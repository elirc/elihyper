/**
 * Logging with a production/development split.
 *
 * The problem this replaces: components logged form values on every keystroke
 * and full project payloads on every state change. In production that means a
 * visitor's name, email address, phone number and their confidential project
 * scope were printed to the browser console -- readable by anyone with access
 * to the machine, by screen-sharing software, and by any browser extension
 * with console access.
 *
 * Rules:
 *
 *   logger.debug  development only. Never reaches a production build's output.
 *   logger.info   quiet by default; enable with NEXT_PUBLIC_DEBUG_LOGS=true.
 *   logger.warn   always emitted. Something is wrong but recoverable.
 *   logger.error  always emitted. Something failed.
 *
 * NEVER pass personal data to warn or error. Log an identifier and the shape
 * of the problem, not the payload: `logger.error('lead submit failed', { status })`
 * rather than `logger.error('failed', formState)`.
 */

type LogArgs = unknown[]

function isDebugEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return true
  // Escape hatch for diagnosing a production-only problem. Deliberately a
  // NEXT_PUBLIC_ variable so it can be flipped per environment in Amplify,
  // and deliberately off by default.
  return process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true'
}

export const logger = {
  /**
   * Development-time tracing. Stripped from production output.
   * Safe for values you would not want in a production log -- but prefer not
   * to log personal data at all, since "development" includes a shared laptop
   * on a video call.
   */
  debug(...args: LogArgs): void {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  },

  info(...args: LogArgs): void {
    if (isDebugEnabled()) {
      // eslint-disable-next-line no-console
      console.info(...args)
    }
  },

  warn(...args: LogArgs): void {
    // eslint-disable-next-line no-console
    console.warn(...args)
  },

  error(...args: LogArgs): void {
    // eslint-disable-next-line no-console
    console.error(...args)
  },
}

/**
 * Reduces an unknown thrown value to something safe to log.
 *
 * `catch (e)` gives you `unknown`. Logging it directly risks serialising an
 * object that contains the request body -- which is how personal data ends up
 * in an error log even when nobody intended to log it. This keeps the message
 * and the name, and nothing else.
 */
export function describeError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }
  return { name: 'UnknownError', message: typeof error === 'string' ? error : 'Non-Error value thrown' }
}
