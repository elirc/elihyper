/**
 * Environment detection utility
 * Detects dev/prod based on Next.js environment
 *
 * Logic:
 * - Uses NEXT_PUBLIC_APP_ENV if set (explicit override)
 * - Otherwise uses NODE_ENV: 'development' = 'dev', otherwise 'prod'
 *
 * Usage:
 * import { env } from '@/utils/env'
 *
 * env will be 'dev' or 'prod'
 */
export const env =
  typeof window !== 'undefined'
    ? // Client-side: use injected value or fallback
      (window as any).__NEXT_APP_ENV__ || 'prod'
    : // Server-side: use NODE_ENV or NEXT_PUBLIC_APP_ENV
      process.env.NEXT_PUBLIC_APP_ENV || (process.env.NODE_ENV === 'development' ? 'dev' : 'prod')
