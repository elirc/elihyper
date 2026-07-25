/**
 * Tests for lib/serverEnv.
 *
 * Note what makes this module testable: every function takes the environment
 * as an argument (defaulting to process.env) instead of reaching for the
 * global directly. That one design choice means these tests never mutate
 * process.env, never leak state between cases, and can run in parallel.
 *
 * These run under jest's default `node` environment, which is fine for a
 * module with no DOM. HN-19 switches the suite to jsdom so components can be
 * rendered too.
 */

import {
  findMissingRequiredEnv,
  requireEnv,
  optionalEnv,
  logServerEnvStatus,
  MissingEnvironmentVariableError,
  SERVER_ENV_VARS,
  type ServerEnvVarSpec,
} from '../lib/serverEnv'

describe('findMissingRequiredEnv', () => {
  it('reports nothing when every required variable is set', () => {
    expect(findMissingRequiredEnv({ HUBSPOT_API_KEY: 'pat-real-looking-value' })).toEqual([])
  })

  it('reports a required variable that is absent', () => {
    expect(findMissingRequiredEnv({})).toContain('HUBSPOT_API_KEY')
  })

  it('treats an empty or whitespace-only value as missing', () => {
    expect(findMissingRequiredEnv({ HUBSPOT_API_KEY: '' })).toContain('HUBSPOT_API_KEY')
    expect(findMissingRequiredEnv({ HUBSPOT_API_KEY: '   ' })).toContain('HUBSPOT_API_KEY')
  })

  // The specific failure this guards against: a developer copies .env.example
  // to .env.local and forgets to fill it in. Without this check the app starts
  // happily and fails much later as an opaque 401 from HubSpot.
  it('treats an unfilled .env.example placeholder as missing', () => {
    expect(findMissingRequiredEnv({ HUBSPOT_API_KEY: 'REPLACE_ME_hubspot_private_app_token' })).toContain(
      'HUBSPOT_API_KEY'
    )
  })

  it('ignores optional variables', () => {
    expect(findMissingRequiredEnv({ HUBSPOT_API_KEY: 'set' })).not.toContain('HUBSPOT_ENV_DEV_PROPERTY_NAME')
  })
})

describe('requireEnv', () => {
  it('returns the trimmed value when present', () => {
    expect(requireEnv('HUBSPOT_API_KEY', { HUBSPOT_API_KEY: '  token  ' })).toBe('token')
  })

  it('throws a named error identifying the variable', () => {
    expect(() => requireEnv('HUBSPOT_API_KEY', {})).toThrow(MissingEnvironmentVariableError)

    try {
      requireEnv('HUBSPOT_API_KEY', {})
      throw new Error('expected requireEnv to throw')
    } catch (error) {
      // `catch` gives `unknown`; narrow before asserting on the shape.
      expect(error).toBeInstanceOf(MissingEnvironmentVariableError)
      const missing = error as MissingEnvironmentVariableError
      expect(missing.variableName).toBe('HUBSPOT_API_KEY')
      // The message has to be actionable on its own -- someone reading it in a
      // log at 2am should not have to open the codebase.
      expect(missing.message).toContain('HUBSPOT_API_KEY')
      expect(missing.message).toContain('HubSpot')
    }
  })
})

describe('optionalEnv', () => {
  it('returns the value when set', () => {
    expect(optionalEnv('HUBSPOT_ENV_DEV_PROPERTY_NAME', 'fallback', { HUBSPOT_ENV_DEV_PROPERTY_NAME: 'custom' })).toBe(
      'custom'
    )
  })

  it('returns the fallback when unset or empty', () => {
    expect(optionalEnv('HUBSPOT_ENV_DEV_PROPERTY_NAME', 'fallback', {})).toBe('fallback')
    expect(optionalEnv('HUBSPOT_ENV_DEV_PROPERTY_NAME', 'fallback', { HUBSPOT_ENV_DEV_PROPERTY_NAME: '  ' })).toBe(
      'fallback'
    )
  })

  it('defaults the fallback to an empty string', () => {
    expect(optionalEnv('HUBSPOT_ENV_PROD_PROPERTY_NAME', undefined, {})).toBe('')
  })
})

describe('logServerEnvStatus', () => {
  it('logs one actionable line per missing required variable', () => {
    const logger = { error: jest.fn() }
    logServerEnvStatus({}, logger)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error.mock.calls[0][0]).toContain('HUBSPOT_API_KEY')
  })

  it('stays silent when configuration is complete', () => {
    const logger = { error: jest.fn() }
    logServerEnvStatus({ HUBSPOT_API_KEY: 'token' }, logger)

    expect(logger.error).not.toHaveBeenCalled()
  })
})

describe('SERVER_ENV_VARS', () => {
  // Documentation drifts silently unless something checks it. This fails the
  // build if a variable is added without explaining what it is for.
  it('describes every variable and where to obtain it', () => {
    for (const [name, spec] of Object.entries(SERVER_ENV_VARS) as [string, ServerEnvVarSpec][]) {
      expect(typeof spec.description).toBe('string')
      expect(spec.description.length).toBeGreaterThan(20)
      expect(spec.source.length).toBeGreaterThan(10)
      expect(name).toMatch(/^[A-Z0-9_]+$/)
    }
  })
})
