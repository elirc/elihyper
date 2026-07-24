/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution (e.g., @upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limiter configuration
 * Limits: 5 requests per 15 minutes per IP
 */
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Get client IP address from request
 */
function getClientIp(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  // Check various headers for IP (in order of preference)
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const cfConnectingIp = req.headers['cf-connecting-ip']

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  if (typeof realIp === 'string') {
    return realIp
  }
  if (typeof cfConnectingIp === 'string') {
    return cfConnectingIp
  }

  // Fallback to a default (shouldn't happen in production)
  return 'unknown'
}

/**
 * Check if request should be rate limited
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(req: { headers: { [key: string]: string | string[] | undefined } }): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const clientIp = getClientIp(req)
  const now = Date.now()

  let entry = rateLimitStore.get(clientIp)

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    }
    rateLimitStore.set(clientIp, entry)
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  }
}

