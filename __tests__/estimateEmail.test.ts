import { renderEstimateEmail, escapeHtml } from '../lib/emailTemplates/estimateSummary'
import { LogMailer, sendQuietly, setMailer, type Mailer } from '../lib/mailer'

const project = {
  id: 'abc123def456',
  scope: 'Internal dashboard for 40 staff',
  AI_estimatedCost: '$180,000 - $240,000',
  AI_estimatedTimeline: '4-6 months',
  AI_teamSize: '2 senior, 1 designer',
  AI_infrastructure: 'AWS ECS with Fargate',
  AI_riskAssessment: 'Integration with the legacy billing system is the main unknown.',
}

const options = { estimateUrl: 'https://hypernova.inc/tools/ai-project-estimator/?estimate=abc123def456' }

afterEach(() => setMailer(null))

describe('escapeHtml', () => {
  // The scope field is visitor-supplied and passes through an LLM. String-built
  // email has none of React's escaping, so this is the only thing standing
  // between hostile input and a mail client rendering it.
  it('escapes every character that could break out of markup', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    )
    expect(escapeHtml("it's & more")).toBe('it&#39;s &amp; more')
  })

  it('escapes the ampersand first so entities are not double-encoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})

describe('renderEstimateEmail', () => {
  it('puts the cost in the subject when there is one', () => {
    expect(renderEstimateEmail(project, options).subject).toBe('Your project estimate: $180,000 - $240,000')
  })

  it('falls back to a generic subject when the analysis is incomplete', () => {
    expect(renderEstimateEmail({ id: 'x' }, options).subject).toBe('Your project estimate from Hypernova')
  })

  it('includes every headline figure in both parts', () => {
    const { html, text } = renderEstimateEmail(project, options)

    for (const value of ['$180,000 - $240,000', '4-6 months', '2 senior, 1 designer', 'AWS ECS with Fargate']) {
      expect(html).toContain(value)
      expect(text).toContain(value)
    }
  })

  it('always includes a plain-text alternative', () => {
    // HTML-only mail is a strong spam signal.
    const { text } = renderEstimateEmail(project, options)

    expect(text.length).toBeGreaterThan(100)
    expect(text).not.toContain('<td')
  })

  it('includes the estimate link in both parts', () => {
    const { html, text } = renderEstimateEmail(project, options)

    expect(html).toContain(options.estimateUrl)
    expect(text).toContain(options.estimateUrl)
  })

  it('greets by name when known and stays neutral otherwise', () => {
    expect(renderEstimateEmail(project, { ...options, firstName: 'Ada' }).text).toContain('Hi Ada,')
    expect(renderEstimateEmail(project, options).text).toContain('Hi,')
  })

  it('shows a placeholder rather than blanks for missing figures', () => {
    const { html } = renderEstimateEmail({ id: 'x' }, options)

    expect(html).toContain('To be confirmed')
  })

  // CAN-SPAM requires a postal address and a statement of why the recipient
  // got the message.
  it('includes the compliance footer', () => {
    const { html, text } = renderEstimateEmail(project, options)

    expect(text).toContain('You received this email because you requested an estimate')
    expect(html).toContain('Hypernova Inc, United States')
  })

  it('escapes hostile scope text', () => {
    const hostile = { ...project, scope: '<img src=x onerror=alert(1)>' }
    const { html } = renderEstimateEmail(hostile, options)

    expect(html).not.toContain('<img src=x')
    expect(html).toContain('&lt;img src=x')
  })

  it('truncates a very long scope rather than emailing an essay', () => {
    const { html } = renderEstimateEmail({ ...project, scope: 'a'.repeat(2000) }, options)

    expect(html).toContain('…')
  })
})

describe('sendQuietly', () => {
  const email = { to: 'a@b.co', subject: 's', html: '<p>h</p>', text: 't' }

  it('reports whether the transport actually delivered', async () => {
    setMailer(new LogMailer())
    expect(await sendQuietly(email)).toBe(false)

    setMailer({ send: async () => ({ delivered: true, id: 'msg-1' }) })
    expect(await sendQuietly(email)).toBe(true)
  })

  // The point of the helper: the lead is already saved by the time this runs,
  // so a mail outage must not surface as a failed submission.
  it('swallows a transport failure', async () => {
    const exploding: Mailer = { send: () => Promise.reject(new Error('SES is down')) }
    setMailer(exploding)

    await expect(sendQuietly(email)).resolves.toBe(false)
  })
})
