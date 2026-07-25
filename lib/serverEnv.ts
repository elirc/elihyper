/**
 * Server-side environment configuration.
 *
 * This module exists to enforce two rules:
 *
 * 1. Secrets are read in one place. When you need to know what this app
 *    requires in order to run, you read SERVER_ENV_VARS below instead of
 *    grepping for `process.env` across the codebase.
 *
 * 2. Missing configuration fails loudly and specifically. Before this module,
 *    `process.env.HUBSPOT_API_KEY` was read inline in the API route and a
 *    missing value produced a generic 500. That meant a misconfigured deploy
 *    was indistinguishable from a HubSpot outage, and it only surfaced when a
 *    real visitor submitted a real form -- i.e. we found out by losing a lead.
 *
 * IMPORTANT: anything imported by a React component is bundled and shipped to
 * the browser. This file must only ever be imported from `pages/api/**`.
 * Variables prefixed `NEXT_PUBLIC_` are public by definition and are
 * deliberately not managed here.
 */

export interface ServerEnvVarSpec {
  /** Is the app unable to do its job without this? */
  required: boolean
  /** What the variable is for, shown in error messages and .env.example. */
  description: string
  /** Where an operator obtains the value. */
  source: string
}

export const SERVER_ENV_VARS: Record<string, ServerEnvVarSpec> = {
  HUBSPOT_API_KEY: {
    required: true,
    description: 'HubSpot private-app token used to create and update CRM contacts from lead forms.',
    source: 'HubSpot > Settings > Integrations > Private Apps. Needs the crm.objects.contacts.write scope.',
  },
  HUBSPOT_ENV_DEV_PROPERTY_NAME: {
    required: false,
    description: 'Name of the HubSpot checkbox property flagging a contact as created from the dev environment.',
    source: 'Defaults to "environment__dev" when unset.',
  },
  HUBSPOT_ENV_PROD_PROPERTY_NAME: {
    required: false,
    description: 'Optional companion property flagging a contact as created from production.',
    source: 'Leave unset unless the HubSpot portal has such a property.',
  },
  RATE_LIMIT_TABLE_NAME: {
    required: false,
    description: 'DynamoDB table backing the shared API rate limiter; falls back to a per-instance in-memory store.',
    source: 'Provision with a String partition key `pk` and TTL enabled on the `ttl` attribute.',
  },
  SES_FROM_ADDRESS: {
    required: false,
    description: 'Verified SES sender address used to email visitors a copy of their estimate.',
    source: 'SES > Verified identities. Without it the mailer logs instead of sending.',
  },
  COMPANY_POSTAL_ADDRESS: {
    required: false,
    description: 'Postal address printed in the estimate email footer, required by CAN-SPAM.',
    source: 'The registered business address.',
  },
  RATE_LIMIT_SALT: {
    required: false,
    description: 'Salt used when hashing client IP addresses into rate-limit keys so raw IPs are never stored.',
    source: 'Any long random string. Changing it resets all counters.',
  },
}

/**
 * Thrown when a required variable is absent. Carries the variable name so the
 * caller can log something actionable rather than "undefined is not a string".
 */
export class MissingEnvironmentVariableError extends Error {
  readonly variableName: string

  constructor(variableName: string, spec?: ServerEnvVarSpec) {
    const purpose = spec ? ` ${spec.description} (${spec.source})` : ''
    super(`Missing required environment variable ${variableName}.${purpose}`)
    this.name = 'MissingEnvironmentVariableError'
    this.variableName = variableName
  }
}

type EnvSource = Record<string, string | undefined>

/**
 * A value counts as missing if it is absent, empty, or still the placeholder
 * committed in .env.example. The placeholder check matters: copying the example
 * file and forgetting to fill it in is the single most common setup mistake,
 * and without this it fails later as a confusing 401 from HubSpot.
 */
function isMissing(value: string | undefined): boolean {
  if (value === undefined) return true
  const trimmed = value.trim()
  return trimmed.length === 0 || trimmed.startsWith('REPLACE_ME')
}

/** Returns the names of every required variable that is absent or unfilled. */
export function findMissingRequiredEnv(env: EnvSource = process.env): string[] {
  return Object.entries(SERVER_ENV_VARS)
    .filter(([name, spec]) => spec.required && isMissing(env[name]))
    .map(([name]) => name)
}

/**
 * Reads a variable, throwing a descriptive error when it is unusable.
 * Use this at the point of use (inside a request handler), not at module load:
 * throwing at import time would break `next build`, and the build must never
 * need production secrets.
 */
export function requireEnv(name: string, env: EnvSource = process.env): string {
  const value = env[name]
  if (isMissing(value)) {
    throw new MissingEnvironmentVariableError(name, SERVER_ENV_VARS[name])
  }
  return (value as string).trim()
}

/** Reads an optional variable, falling back to the supplied default. */
export function optionalEnv(name: string, fallback = '', env: EnvSource = process.env): string {
  const value = env[name]
  return isMissing(value) ? fallback : (value as string).trim()
}

/**
 * Logs a single clear line per missing required variable. Call this once from
 * an API route module so a misconfigured deployment announces itself in the
 * logs at startup rather than on the first visitor's submission.
 */
export function logServerEnvStatus(env: EnvSource = process.env, logger: Pick<Console, 'error'> = console): void {
  for (const name of findMissingRequiredEnv(env)) {
    const spec = SERVER_ENV_VARS[name]
    logger.error(`[config] ${name} is not set. ${spec.description} ${spec.source}`)
  }
}
