/**
 * The "here is your estimate" email.
 *
 * A pure function: project in, {subject, html, text} out. No transport, no
 * network, no environment. That is what makes it testable -- the tests below
 * assert the content without sending anything or mocking a mail client.
 *
 * Email HTML is not web HTML. Outlook renders with Word's engine, Gmail strips
 * <style> blocks in some contexts, and flexbox/grid are unreliable across the
 * set. So: tables for layout, inline styles, no external CSS. This looks like
 * 2005 on purpose.
 */

export interface EstimateEmailProject {
  id: string
  scope?: string | null
  AI_estimatedCost?: string | null
  AI_estimatedTimeline?: string | null
  AI_teamSize?: string | null
  AI_infrastructure?: string | null
  AI_riskAssessment?: string | null
  AI_improvedScope?: string | null
  teamSize?: string | null
  infrastructure?: string | null
  timeline?: string | null
  cost?: string | null
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface EstimateEmailOptions {
  firstName?: string
  /** Absolute URL that reopens the estimate. */
  estimateUrl: string
  /** Postal address, required by CAN-SPAM for commercial email. */
  postalAddress?: string
}

/**
 * Escapes text before it is interpolated into HTML.
 *
 * The scope field is visitor-supplied and travels through an LLM before
 * reaching here, so it must be treated as hostile. React escapes for us in the
 * app; string-built email has no such protection, and an unescaped "<" is how
 * a mail client ends up rendering an attacker's markup.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim()
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`
}

interface Row {
  label: string
  value: string
}

function buildRows(project: EstimateEmailProject): Row[] {
  const rows: Row[] = [
    { label: 'Estimated cost', value: project.AI_estimatedCost || project.cost || 'To be confirmed' },
    { label: 'Estimated timeline', value: project.AI_estimatedTimeline || project.timeline || 'To be confirmed' },
    { label: 'Team', value: project.AI_teamSize || project.teamSize || 'To be confirmed' },
    { label: 'Infrastructure', value: project.AI_infrastructure || project.infrastructure || 'To be confirmed' },
  ]

  return rows
}

export function renderEstimateEmail(
  project: EstimateEmailProject,
  options: EstimateEmailOptions
): RenderedEmail {
  const greetingName = options.firstName?.trim()
  const greeting = greetingName ? `Hi ${greetingName},` : 'Hi,'
  const rows = buildRows(project)
  const scope = truncate(project.AI_improvedScope || project.scope || '', 600)
  const risks = truncate(project.AI_riskAssessment || '', 800)
  const postal = options.postalAddress || 'Hypernova Inc, United States'

  const subject = project.AI_estimatedCost
    ? `Your project estimate: ${project.AI_estimatedCost}`
    : 'Your project estimate from Hypernova'

  const textLines = [
    greeting,
    '',
    'Here is the estimate you generated on hypernova.inc.',
    '',
    ...rows.map((row) => `${row.label}: ${row.value}`),
    '',
    scope ? `Scope\n${scope}\n` : '',
    risks ? `Key risks\n${risks}\n` : '',
    `View or share this estimate: ${options.estimateUrl}`,
    '',
    'These figures are an initial estimate, not a quote. Reply to this email and',
    'an engineer will go through it with you.',
    '',
    '--',
    'You received this email because you requested an estimate on hypernova.inc.',
    postal,
  ]

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;">${escapeHtml(
            row.label
          )}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(
            row.value
          )}</td>
        </tr>`
    )
    .join('')

  const section = (heading: string, body: string) =>
    body
      ? `
      <tr><td style="padding:20px 0 6px;color:#111827;font-size:15px;font-weight:600;">${escapeHtml(heading)}</td></tr>
      <tr><td style="color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(body)}</td></tr>`
      : ''

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;padding:32px;font-family:Arial,Helvetica,sans-serif;">
          <tr><td style="color:#111827;font-size:20px;font-weight:700;padding-bottom:8px;">Hypernova Inc</td></tr>
          <tr><td style="color:#374151;font-size:15px;line-height:1.6;padding-bottom:20px;">${escapeHtml(
            greeting
          )}<br/>Here is the estimate you generated on hypernova.inc.</td></tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
            </td>
          </tr>
          ${section('Scope', scope)}
          ${section('Key risks', risks)}
          <tr>
            <td style="padding:28px 0 8px;">
              <a href="${escapeHtml(
                options.estimateUrl
              )}" style="display:inline-block;background:#0b1220;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">View or share this estimate</a>
            </td>
          </tr>
          <tr><td style="color:#6b7280;font-size:13px;line-height:1.6;padding-top:20px;">These figures are an initial estimate, not a quote. Reply to this email and an engineer will go through it with you.</td></tr>
          <tr><td style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:16px;color:#9ca3af;font-size:12px;line-height:1.6;">
            You received this email because you requested an estimate on hypernova.inc.<br/>${escapeHtml(postal)}
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text: textLines.filter((line) => line !== undefined).join('\n') }
}
