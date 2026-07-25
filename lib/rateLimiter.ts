/**
 * Rate limiting for public API routes.
 *
 * The previous implementation kept counters in a module-scoped Map and started
 * a setInterval at import time. Both are wrong on Lambda, which is where this
 * actually runs:
 *
 * - Every cold start gets a fresh, empty Map. An attacker rotating requests
 *   across concurrent instances was effectively unlimited, while the response
 *   headers still promised "5 per 15 minutes". A limit you advertise but do
 *   not enforce is worse than no limit: it tells an attacker exactly what to
 *   route around.
 * - A module-scope setInterval keeps a timer alive in every warm instance
 *   forever, and it stopped jest's worker process from exiting cleanly.
 *
 * The store is now pluggable. DynamoDB gives one counter shared by every
 * instance, with a TTL attribute so rows expire without a sweeper. In-memory
 * stays the local-development default, because requiring AWS credentials to
 * run `npm run dev` would be a bad trade.
 *
 * Fail-open is deliberate: if the store is unreachable the request is ALLOWED.
 * A rate limiter that takes the contact form offline when DynamoDB has a bad
 * minute has turned a minor abuse-prevention feature into an outage that loses
 * real leads.
 */

import { logger, describeError } from './logger'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  /** True when the store failed and the request was allowed through anyway. */
  degraded?: boolean
}

export interface RateLimitOptions {
  /** Requests permitted per window. */
  max?: number
  /** Window length in milliseconds. */
  windowMs?: number
  /** Distinguishes limits for different routes sharing one store. */
  bucket?: string
}

const DEFAULT_MAX = 5
const DEFAULT_WINDOW_MS = 15 * 60 * 1000

type Headers = { [key: string]: string | string[] | undefined }

/**
 * Best-effort client IP.
 *
 * Takes the FIRST entry of x-forwarded-for: proxies append to the right, so
 * the leftmost value is the original client. It is also client-controlled and
 * trivially spoofed, which is why rate limiting is one layer and never the
 * only one.
 */
export function getClientIp(req: { headers: Headers }): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim()

  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim()

  const cfConnectingIp = req.headers['cf-connecting-ip']
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) return cfConnectingIp.trim()

  return 'unknown'
}

/**
 * Hashes the identifier before it becomes a storage key.
 *
 * An IP address is personal data under GDPR. We need to count requests per
 * client, not to know who the client is, and a hash supports counting without
 * retaining the address.
 */
function hashIdentifier(value: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require('node:crypto')
  const salt = process.env.RATE_LIMIT_SALT || 'hypernova-default-salt'
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 32)
}

export interface RateLimitStore {
  /**
   * Atomically increments the counter for `key` and returns the new count.
   *
   * Atomicity is the whole contract: read-then-write races under concurrency,
   * which is precisely the condition a rate limiter exists to handle.
   */
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>
}

/** Local-development store. Correct within one process, useless across many. */
export class InMemoryRateLimitStore implements RateLimitStore {
  private entries = new Map<string, { count: number; resetTime: number }>()

  async increment(key: string, windowMs: number) {
    const now = Date.now()
    const existing = this.entries.get(key)

    if (!existing || existing.resetTime < now) {
      const fresh = { count: 1, resetTime: now + windowMs }
      this.entries.set(key, fresh)
      this.evictExpired(now)
      return fresh
    }

    existing.count += 1
    return existing
  }

  /**
   * Opportunistic cleanup on write, rather than a background timer. The old
   * setInterval ran forever in every warm Lambda; doing the work on the code
   * path that creates entries costs nothing and needs no lifecycle management.
   */
  private evictExpired(now: number) {
    for (const [key, entry] of this.entries.entries()) {
      if (entry.resetTime < now) this.entries.delete(key)
    }
  }

  /** Test helper. */
  clear() {
    this.entries.clear()
  }
}

/**
 * DynamoDB-backed store: one counter shared by every Lambda instance.
 *
 * Key design:
 *   pk  = "<bucket>#<hashedIp>#<windowStart>" -- a new row per window, so
 *         expiry is a TTL rather than a reset somebody has to remember.
 *   ttl = window end in epoch SECONDS. DynamoDB deletes expired rows for free.
 *         It is a cleanup mechanism, not a correctness one: windowStart in the
 *         key is what makes the count correct.
 *
 * ADD is atomic and creates the attribute when absent, so there is no
 * read-modify-write race and no need to seed the row first.
 */
export class DynamoRateLimitStore implements RateLimitStore {
  private clientPromise: Promise<any> | null = null

  constructor(
    private tableName: string,
    private region = process.env.AWS_REGION || 'us-east-1'
  ) {}

  private async getClient() {
    if (!this.clientPromise) {
      // Imported dynamically so a deployment that never sets
      // RATE_LIMIT_TABLE_NAME does not pay to load the SDK on every cold start.
      this.clientPromise = import('@aws-sdk/client-dynamodb').then(
        ({ DynamoDBClient }) => new DynamoDBClient({ region: this.region })
      )
    }
    return this.clientPromise
  }

  async increment(key: string, windowMs: number) {
    const { UpdateItemCommand } = await import('@aws-sdk/client-dynamodb')
    const client = await this.getClient()

    const now = Date.now()
    const windowStart = Math.floor(now / windowMs) * windowMs
    const resetTime = windowStart + windowMs

    const result = await client.send(
      new UpdateItemCommand({
        TableName: this.tableName,
        Key: { pk: { S: `${key}#${windowStart}` } },
        UpdateExpression: 'ADD #count :one SET #ttl = :ttl',
        ExpressionAttributeNames: { '#count': 'count', '#ttl': 'ttl' },
        ExpressionAttributeValues: {
          ':one': { N: '1' },
          // TTL is epoch SECONDS, not milliseconds. Passing milliseconds sets
          // an expiry ~50,000 years out and the table grows forever.
          ':ttl': { N: String(Math.floor(resetTime / 1000) + 60) },
        },
        ReturnValues: 'UPDATED_NEW',
      })
    )

    return { count: Number(result.Attributes?.count?.N ?? '1'), resetTime }
  }
}

let defaultStore: RateLimitStore | null = null

export function getDefaultStore(): RateLimitStore {
  if (!defaultStore) {
    const tableName = process.env.RATE_LIMIT_TABLE_NAME
    defaultStore = tableName ? new DynamoRateLimitStore(tableName) : new InMemoryRateLimitStore()

    if (!tableName && process.env.NODE_ENV === 'production') {
      logger.warn(
        '[rate-limit] RATE_LIMIT_TABLE_NAME is not set; using the in-memory store. ' +
          'Counters are per-instance, so the advertised limit is not enforced across Lambdas.'
      )
    }
  }
  return defaultStore
}

/** Test seam: swap the store, or reset it with null. */
export function setDefaultStore(store: RateLimitStore | null) {
  defaultStore = store
}

export async function checkRateLimit(
  req: { headers: Headers },
  options: RateLimitOptions = {},
  store: RateLimitStore = getDefaultStore()
): Promise<RateLimitResult> {
  const max = options.max ?? DEFAULT_MAX
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS
  const bucket = options.bucket ?? 'default'

  const key = `${bucket}#${hashIdentifier(getClientIp(req))}`

  try {
    const { count, resetTime } = await store.increment(key, windowMs)

    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      resetTime,
    }
  } catch (error) {
    // Fail open -- see the note at the top of this file.
    logger.error('[rate-limit] store unavailable, allowing request', describeError(error))

    return { allowed: true, remaining: max - 1, resetTime: Date.now() + windowMs, degraded: true }
  }
}
