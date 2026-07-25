import { checkStaticSignals, checkForSpam, verifyTurnstile, MIN_FILL_TIME_MS, HONEYPOT_FIELD } from '../lib/spamGuard'

const NOW = 1_700_000_000_000

describe('checkStaticSignals', () => {
  it('passes a plausible human submission', () => {
    expect(checkStaticSignals({ renderedAt: NOW - 20_000 }, NOW)).toEqual({ ok: true })
  })

  it('rejects a filled honeypot', () => {
    expect(checkStaticSignals({ honeypot: 'https://spam.example', renderedAt: NOW - 20_000 }, NOW)).toEqual({
      ok: false,
      reason: 'honeypot_filled',
    })
  })

  it('ignores an empty or whitespace-only honeypot', () => {
    expect(checkStaticSignals({ honeypot: '', renderedAt: NOW - 20_000 }, NOW).ok).toBe(true)
    expect(checkStaticSignals({ honeypot: '   ', renderedAt: NOW - 20_000 }, NOW).ok).toBe(true)
  })

  it('rejects a submission faster than a human could type', () => {
    expect(checkStaticSignals({ renderedAt: NOW - 500 }, NOW)).toEqual({
      ok: false,
      reason: 'submitted_too_fast',
    })
  })

  it('accepts a submission at the threshold', () => {
    expect(checkStaticSignals({ renderedAt: NOW - MIN_FILL_TIME_MS }, NOW).ok).toBe(true)
  })

  // False positives are the expensive failure here: a rejected human is a lost
  // lead who has no idea why. Each of these is a case we deliberately allow.
  describe('never rejects on absent or implausible evidence', () => {
    it('allows a submission with no renderedAt (cached page, or an old build)', () => {
      expect(checkStaticSignals({}, NOW).ok).toBe(true)
    })

    it('allows a non-numeric renderedAt', () => {
      expect(checkStaticSignals({ renderedAt: 'not-a-number' }, NOW).ok).toBe(true)
    })

    it('allows a future renderedAt, which means clock skew rather than time travel', () => {
      expect(checkStaticSignals({ renderedAt: NOW + 60_000 }, NOW).ok).toBe(true)
    })

    it('allows a visitor who left the tab open for an hour', () => {
      expect(checkStaticSignals({ renderedAt: NOW - 3_600_000 }, NOW).ok).toBe(true)
    })
  })
})

describe('verifyTurnstile', () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY
  const originalFetch = global.fetch

  // jsdom does not define fetch as an own property of `global`, so
  // jest.spyOn(global, 'fetch') throws "Property `fetch` does not exist".
  // Assigning a mock and restoring it by hand is the portable way.
  const mockFetch = (impl: jest.Mock) => {
    global.fetch = impl as unknown as typeof fetch
    return impl
  }

  afterEach(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret
    global.fetch = originalFetch
  })

  it('passes when Turnstile is not configured', async () => {
    delete process.env.TURNSTILE_SECRET_KEY

    expect(await verifyTurnstile(undefined)).toEqual({ ok: true })
  })

  it('rejects a missing token when Turnstile IS configured', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'

    expect(await verifyTurnstile(undefined)).toEqual({ ok: false, reason: 'turnstile_missing' })
  })

  it('accepts a token Cloudflare validates', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    mockFetch(jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }))

    expect(await verifyTurnstile('token')).toEqual({ ok: true })
  })

  it('rejects a token Cloudflare refuses', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    mockFetch(jest.fn().mockResolvedValue({ json: async () => ({ success: false }) }))

    expect(await verifyTurnstile('token')).toEqual({ ok: false, reason: 'turnstile_failed' })
  })

  // Same reasoning as the rate limiter: a third-party outage must not take the
  // company's contact form offline.
  it('fails open when Cloudflare is unreachable', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    mockFetch(jest.fn().mockRejectedValue(new Error('network down')))

    expect(await verifyTurnstile('token')).toEqual({ ok: true })
  })
})

describe('checkForSpam', () => {
  it('short-circuits on a static signal without calling Cloudflare', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret'
    const originalFetch = global.fetch
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    const result = await checkForSpam({ honeypot: 'filled' }, NOW)

    expect(result).toEqual({ ok: false, reason: 'honeypot_filled' })
    expect(fetchMock).not.toHaveBeenCalled()

    delete process.env.TURNSTILE_SECRET_KEY
    global.fetch = originalFetch
  })
})

describe('honeypot field name', () => {
  // If this ever collides with a real field the form silently rejects every
  // submission, so it is worth an assertion.
  it('does not collide with a real form field', () => {
    expect(['firstName', 'lastName', 'email', 'phoneNumber', 'message', 'description']).not.toContain(HONEYPOT_FIELD)
  })
})
