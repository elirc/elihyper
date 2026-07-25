import {
  parseConsent,
  serializeConsent,
  readConsentFromCookieString,
  toConsentModePayload,
  CONSENT_COOKIE,
  CONSENT_VERSION,
  DENIED_CONSENT,
  GRANTED_CONSENT,
} from '../lib/consent'

describe('parseConsent', () => {
  it('round-trips a serialized state', () => {
    expect(parseConsent(serializeConsent(GRANTED_CONSENT))).toEqual(GRANTED_CONSENT)
    expect(parseConsent(serializeConsent(DENIED_CONSENT))).toEqual(DENIED_CONSENT)
  })

  // Every one of these returns null, which makes the banner reappear. Failing
  // towards "ask again" is the only safe direction: the alternative is
  // treating a corrupt value as consent nobody gave.
  it.each([
    ['nothing', undefined],
    ['empty', ''],
    ['garbage', 'not-json'],
    [
      'an unknown analytics value',
      encodeURIComponent(JSON.stringify({ version: 1, analytics: 'maybe', marketing: 'denied' })),
    ],
    ['a missing category', encodeURIComponent(JSON.stringify({ version: 1, analytics: 'granted' }))],
  ])('returns null for %s', (_label, raw) => {
    expect(parseConsent(raw as string | undefined)).toBeNull()
  })

  // If a category is ever added, the version bumps and everyone is asked
  // again -- correctly, since nobody consented to the new category.
  it('rejects an older consent version', () => {
    const old = encodeURIComponent(
      JSON.stringify({ version: CONSENT_VERSION - 1, analytics: 'granted', marketing: 'granted' })
    )

    expect(parseConsent(old)).toBeNull()
  })
})

describe('readConsentFromCookieString', () => {
  it('finds the cookie among others', () => {
    const cookie = `foo=1; ${CONSENT_COOKIE}=${serializeConsent(GRANTED_CONSENT)}; bar=2`

    expect(readConsentFromCookieString(cookie)).toEqual(GRANTED_CONSENT)
  })

  it('returns null when absent', () => {
    expect(readConsentFromCookieString('foo=1; bar=2')).toBeNull()
    expect(readConsentFromCookieString('')).toBeNull()
  })

  // A cookie whose name merely ends with ours must not be mistaken for it.
  it('does not match a similarly named cookie', () => {
    expect(readConsentFromCookieString(`other_${CONSENT_COOKIE}=${serializeConsent(GRANTED_CONSENT)}`)).toBeNull()
  })
})

describe('toConsentModePayload', () => {
  it('maps marketing to all three advertising signals', () => {
    expect(toConsentModePayload(GRANTED_CONSENT)).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    })
  })

  it('denies everything when consent is denied', () => {
    expect(toConsentModePayload(DENIED_CONSENT)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  })

  // ad_user_data and ad_personalization are the v2 additions. Omitting them
  // makes Google treat the whole signal as incomplete, which would waste the
  // effort of asking the visitor at all.
  it('includes the Consent Mode v2 signals', () => {
    const payload = toConsentModePayload(GRANTED_CONSENT)

    expect(payload).toHaveProperty('ad_user_data')
    expect(payload).toHaveProperty('ad_personalization')
  })

  it('allows analytics without marketing', () => {
    const payload = toConsentModePayload({ version: CONSENT_VERSION, analytics: 'granted', marketing: 'denied' })

    expect(payload.analytics_storage).toBe('granted')
    expect(payload.ad_storage).toBe('denied')
  })
})
