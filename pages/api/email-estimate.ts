import type { NextApiRequest, NextApiResponse } from 'next'
import { checkRateLimit } from '../../lib/rateLimiter'
import { validateEmail } from '../../lib/inputValidation'
import { checkForSpam, HONEYPOT_FIELD } from '../../lib/spamGuard'
import { getClientIp } from '../../lib/rateLimiter'
import { renderEstimateEmail } from '../../lib/emailTemplates/estimateSummary'
import { sendQuietly } from '../../lib/mailer'
import { logger, describeError } from '../../lib/logger'
import { SITE_ORIGIN } from '../../lib/seo'

/**
 * POST /api/email-estimate/
 *
 * Emails a visitor a copy of an estimate they generated.
 *
 * The important design decision: the project is fetched SERVER-SIDE by id, and
 * only the id and recipient come from the request. If the client supplied the
 * body content, this endpoint would be an open relay -- anyone could post
 * arbitrary HTML and have it delivered from our verified domain, which is a
 * phishing kit with our reputation attached.
 */

interface EmailEstimateRequest {
  estimateId?: string
  email?: string
  firstName?: string
  renderedAt?: number
  [HONEYPOT_FIELD]?: string
}

// AppSync's public GraphQL endpoint, called with the same anonymous access the
// browser has. Reading a project by id is exactly what HN-11 grants.
async function fetchProject(estimateId: string) {
  const config = await import('../../src/amplifyconfiguration.main.json')
  const devConfig = await import('../../src/amplifyconfiguration.dev.json')
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'prod'
  const { aws_appsync_graphqlEndpoint: endpoint } = (isProd ? config : devConfig) as unknown as {
    aws_appsync_graphqlEndpoint: string
  }

  if (!endpoint) throw new Error('AppSync endpoint is not configured')

  const query = `query GetProject($id: ID!) {
    getProject(id: $id) {
      id scope timeline cost teamSize infrastructure
      AI_estimatedCost AI_estimatedTimeline AI_teamSize AI_infrastructure
      AI_riskAssessment AI_improvedScope
    }
  }`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: estimateId } }),
  })

  const payload = (await response.json()) as { data?: { getProject?: Record<string, unknown> } }
  return payload.data?.getProject || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // A tighter budget than the lead endpoint: emailing is a smaller, more
  // abusable action, and nobody legitimately needs it five times in a quarter
  // of an hour.
  const rateLimit = await checkRateLimit(req, { max: 3, bucket: 'email-estimate' })
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString())
    return res.status(429).json({ error: 'Too many requests', message: 'Please try again later' })
  }

  const body: EmailEstimateRequest = req.body || {}

  const spamCheck = await checkForSpam({
    honeypot: (body as Record<string, unknown>)[HONEYPOT_FIELD],
    renderedAt: body.renderedAt,
    remoteIp: getClientIp(req),
  })
  if (!spamCheck.ok) {
    logger.warn('[email-estimate] blocked', { reason: spamCheck.reason })
    return res.status(400).json({ error: 'Unable to process this request' })
  }

  const emailValidation = validateEmail(body.email || '')
  if (!emailValidation.valid) return res.status(400).json({ error: emailValidation.error })

  const estimateId = (body.estimateId || '').trim()
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(estimateId)) {
    return res.status(400).json({ error: 'Invalid estimate id' })
  }

  try {
    const project = await fetchProject(estimateId)
    if (!project) return res.status(404).json({ error: 'Estimate not found' })

    const rendered = renderEstimateEmail(project as never, {
      firstName: body.firstName,
      estimateUrl: `${SITE_ORIGIN}/tools/ai-project-estimator/?estimate=${encodeURIComponent(estimateId)}`,
      postalAddress: process.env.COMPANY_POSTAL_ADDRESS,
    })

    // sendQuietly: the caller has already completed the thing that mattered
    // (their lead is saved). A mail failure is logged, not surfaced as an
    // error that makes them think the whole submission failed.
    const delivered = await sendQuietly({
      to: (body.email as string).trim().toLowerCase(),
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })

    return res.status(200).json({ success: true, delivered })
  } catch (error) {
    logger.error('[email-estimate] failed', describeError(error))
    return res.status(500).json({ error: 'Could not send the estimate' })
  }
}
