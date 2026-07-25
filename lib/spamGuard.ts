/**
 * Spam protection for the public lead forms.
 *
 * Both forms are unauthenticated, publicly reachable, and create CRM records.
 * Rate limiting (lib/rateLimiter) caps volume from one client; this module
 * addresses a different problem -- a single submission that was not made by a
 * person.
 *
 * Two layers, deliberately ordered cheapest-first:
 *
 *   1. Honeypot + timing. Free, invisible, no third party, no privacy
 *      implications, and it stops the overwhelming majority of commodity form
 *      bots. Costs a real visitor nothing.
 *
 *   2. Cloudflare Turnstile. Only consulted when configured, and verified
 *      server-side. Chosen over reCAPTCHA because its default mode requires no
 *      interaction and it does not build an advertising profile of your
 *      visitors.
 *
 * Deliberately NOT done: blocking disposable email domains. Those lists are
 * always stale, and a prospect using a privacy forwarding address is a real
 * prospect. Rejecting them costs more than the spam does.
 */

import { logger, describeError } from './logger'

/** Field name for the honeypot. Plausible enough that a bot will fill it in. */
export const HONEYPOT_FIELD = 'company_website'

/**
 * Minimum time between a form rendering and being submitted.
 *
 * Three seconds is comfortably below what a human needs to fill in four fields
 * and comfortably above what a script needs. The check is one-sided on
 * purpose: there is no maximum, because a visitor who opens the page, gets
 * interrupted, and returns an hour later is exactly the lead we want.
 */
export const MIN_FILL_TIME_MS = 3000

export interface SpamCheckInput {
  /** Value of the honeypot field, if the client sent one. */
  honeypot?: unknown
  /** Epoch ms when the form was rendered, as reported by the client. */
  renderedAt?: unknown
  /** Turnstile token, when the widget is configured. */
  turnstileToken?: unknown
  /** Client IP, passed to Turnstile's verification API. */
  remoteIp?: string
}

export interface SpamCheckResult {
  ok: boolean
  /** Short machine-readable reason, for logs and metrics. Never shown to a user. */
  reason?: 'honeypot_filled' | 'submitted_too_fast' | 'turnstile_missing' | 'turnstile_failed'
}

/**
 * The synchronous checks. No network, no third party.
 *
 * Note what is NOT rejected: a missing renderedAt. An older cached page, or a
 * client whose clock is wrong, would otherwise be turned away. Absent evidence
 * is not evidence of a bot, and this layer must never produce a false positive
 * that a visitor cannot understand or recover from.
 */
export function checkStaticSignals(input: SpamCheckInput, now = Date.now()): SpamCheckResult {
  // A real browser never fills this in: it is hidden from view, removed from
  // the tab order, and has autocomplete off. A bot filling every field will.
  if (typeof input.honeypot === 'string' && input.honeypot.trim().length > 0) {
    return { ok: false, reason: 'honeypot_filled' }
  }

  const renderedAt = Number(input.renderedAt)
  if (Number.isFinite(renderedAt) && renderedAt > 0) {
    const elapsed = now - renderedAt
    // Only a suspiciously FAST submission is rejected. A negative elapsed time
    // means clock skew, not time travel, so it is ignored.
    if (elapsed >= 0 && elapsed < MIN_FILL_TIME_MS) {
      return { ok: false, reason: 'submitted_too_fast' }
    }
  }

  return { ok: true }
}

/**
 * Verifies a Turnstile token with Cloudflare.
 *
 * Returns ok when Turnstile is not configured: a site that has not set the
 * secret should keep working, not reject every submission. Configuration is
 * opt-in, and the cost of forgetting it should be less protection, never an
 * outage.
 */
export async function verifyTurnstile(token: unknown, remoteIp?: string): Promise<SpamCheckResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true }

  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'turnstile_missing' }
  }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp)

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const result = (await response.json()) as { success?: boolean }
    return result.success ? { ok: true } : { ok: false, reason: 'turnstile_failed' }
  } catch (error) {
    // Fail open, for the same reason the rate limiter does: a Cloudflare
    // outage must not take the company's contact form offline.
    logger.error('[spam-guard] turnstile verification unavailable, allowing', describeError(error))
    return { ok: true }
  }
}

/** Runs the static checks, then Turnstile if it is configured. */
export async function checkForSpam(input: SpamCheckInput, now = Date.now()): Promise<SpamCheckResult> {
  const staticResult = checkStaticSignals(input, now)
  if (!staticResult.ok) return staticResult

  return verifyTurnstile(input.turnstileToken, input.remoteIp)
}

/**
 * Props for the hidden honeypot input.
 *
 * aria-hidden and tabIndex -1 keep it away from screen readers and keyboard
 * users -- a honeypot that traps assistive technology users is not a honeypot,
 * it is a bug that only affects disabled people.
 */
export const honeypotFieldProps = {
  type: 'text',
  name: HONEYPOT_FIELD,
  tabIndex: -1,
  autoComplete: 'off',
  'aria-hidden': true,
  style: {
    position: 'absolute' as const,
    left: '-9999px',
    width: '1px',
    height: '1px',
    opacity: 0,
    pointerEvents: 'none' as const,
  },
}
