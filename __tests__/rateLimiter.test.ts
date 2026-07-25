import {
  checkRateLimit,
  getClientIp,
  InMemoryRateLimitStore,
  setDefaultStore,
  type RateLimitStore,
} from '../lib/rateLimiter'

const reqWithIp = (ip: string) => ({ headers: { 'x-forwarded-for': ip } })

afterEach(() => {
  setDefaultStore(null)
})

describe('getClientIp', () => {
  it('takes the leftmost x-forwarded-for entry', () => {
    // Proxies append to the right, so the original client is first.
    expect(getClientIp({ headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' } })).toBe('203.0.113.7')
  })

  it('falls back through the other proxy headers in order', () => {
    expect(getClientIp({ headers: { 'x-real-ip': '203.0.113.8' } })).toBe('203.0.113.8')
    expect(getClientIp({ headers: { 'cf-connecting-ip': '203.0.113.9' } })).toBe('203.0.113.9')
  })

  it('returns "unknown" rather than throwing when no header is present', () => {
    expect(getClientIp({ headers: {} })).toBe('unknown')
  })

  it('ignores a blank header', () => {
    expect(getClientIp({ headers: { 'x-forwarded-for': '   ', 'x-real-ip': '203.0.113.10' } })).toBe('203.0.113.10')
  })
})

describe('checkRateLimit', () => {
  it('allows requests up to the limit and blocks the next one', async () => {
    const store = new InMemoryRateLimitStore()
    const req = reqWithIp('203.0.113.1')

    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(req, { max: 5 }, store)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }

    const blocked = await checkRateLimit(req, { max: 5 }, store)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('counts each client separately', async () => {
    const store = new InMemoryRateLimitStore()

    await checkRateLimit(reqWithIp('203.0.113.1'), { max: 1 }, store)
    const other = await checkRateLimit(reqWithIp('203.0.113.2'), { max: 1 }, store)

    expect(other.allowed).toBe(true)
  })

  // Two routes sharing one store must not consume each other's budget.
  it('counts each bucket separately', async () => {
    const store = new InMemoryRateLimitStore()
    const req = reqWithIp('203.0.113.1')

    await checkRateLimit(req, { max: 1, bucket: 'lead' }, store)
    const other = await checkRateLimit(req, { max: 1, bucket: 'email' }, store)

    expect(other.allowed).toBe(true)
  })

  it('starts a new window once the old one expires', async () => {
    const store = new InMemoryRateLimitStore()
    const req = reqWithIp('203.0.113.1')

    await checkRateLimit(req, { max: 1, windowMs: 1 }, store)
    await new Promise((resolve) => setTimeout(resolve, 5))

    expect((await checkRateLimit(req, { max: 1, windowMs: 1 }, store)).allowed).toBe(true)
  })

  // The most important behaviour in this module. A limiter that fails CLOSED
  // turns a DynamoDB blip into "nobody can contact the company".
  it('fails open when the store throws', async () => {
    const brokenStore: RateLimitStore = {
      increment: () => Promise.reject(new Error('DynamoDB unavailable')),
    }

    const result = await checkRateLimit(reqWithIp('203.0.113.1'), { max: 5 }, brokenStore)

    expect(result.allowed).toBe(true)
    expect(result.degraded).toBe(true)
  })

  it('does not leak the raw IP into the storage key', async () => {
    const keys: string[] = []
    const spyStore: RateLimitStore = {
      increment: async (key) => {
        keys.push(key)
        return { count: 1, resetTime: Date.now() + 1000 }
      },
    }

    await checkRateLimit(reqWithIp('203.0.113.1'), {}, spyStore)

    expect(keys[0]).not.toContain('203.0.113.1')
    expect(keys[0]).toMatch(/^default#[a-f0-9]{32}$/)
  })

  it('produces a stable key for the same client', async () => {
    const keys: string[] = []
    const spyStore: RateLimitStore = {
      increment: async (key) => {
        keys.push(key)
        return { count: 1, resetTime: Date.now() + 1000 }
      },
    }

    await checkRateLimit(reqWithIp('203.0.113.1'), {}, spyStore)
    await checkRateLimit(reqWithIp('203.0.113.1'), {}, spyStore)

    expect(keys[0]).toBe(keys[1])
  })
})

describe('InMemoryRateLimitStore', () => {
  it('evicts expired entries as new ones are written', async () => {
    const store = new InMemoryRateLimitStore()

    await store.increment('expiring', 1)
    await new Promise((resolve) => setTimeout(resolve, 5))
    await store.increment('fresh', 60_000)

    // The expired entry is gone, so the counter restarts rather than resuming.
    expect((await store.increment('expiring', 60_000)).count).toBe(1)
  })
})
