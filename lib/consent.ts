/**
 * Cookie-consent state.
 *
 * Stored in a first-party cookie rather than localStorage for one reason that
 * decides the whole design: the pre-paint script in pages/_app.tsx has to read
 * the decision SYNCHRONOUSLY, before it decides whether to inject GTM and the
 * advertising pixels. localStorage is readable there too, but a cookie is also
 * visible to the server, which keeps the door open for server-side gating
 * later without changing where the value lives.
 *
 * Consent must be granted, never assumed. The default is denied, and the
 * banner appears until the visitor chooses. That is the requirement under
 * GDPR/ePrivacy, and it is also just the honest reading of "consent".
 */

export const CONSENT_COOKIE = 'hn_consent'
export const CONSENT_VERSION = 1

/** Six months. Long enough not to nag, short enough to re-ask periodically. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182

export type ConsentChoice = 'granted' | 'denied'

export interface ConsentState {
  version: number
  analytics: ConsentChoice
  marketing: ConsentChoice
}

export const DENIED_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  analytics: 'denied',
  marketing: 'denied',
}

export const GRANTED_CONSENT: ConsentState = {
  version: CONSENT_VERSION,
  analytics: 'granted',
  marketing: 'granted',
}

/**
 * Parses the cookie value.
 *
 * An unparseable or older-version value is treated as no decision at all, so
 * the banner reappears. If we ever add a category, everyone is asked again --
 * which is the correct behaviour, since they never consented to the new one.
 */
export function parseConsent(raw?: string | null): ConsentState | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>
    if (parsed.version !== CONSENT_VERSION) return null
    if (parsed.analytics !== 'granted' && parsed.analytics !== 'denied') return null
    if (parsed.marketing !== 'granted' && parsed.marketing !== 'denied') return null

    return { version: CONSENT_VERSION, analytics: parsed.analytics, marketing: parsed.marketing }
  } catch {
    return null
  }
}

export function serializeConsent(state: ConsentState): string {
  return encodeURIComponent(JSON.stringify(state))
}

/** Reads consent from a raw document.cookie string. */
export function readConsentFromCookieString(cookieString: string): ConsentState | null {
  const match = cookieString.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`))
  return match ? parseConsent(match[1]) : null
}

/**
 * Maps our two categories onto Google Consent Mode v2 signals.
 *
 * ad_user_data and ad_personalization were added in v2 and are mandatory for
 * EEA traffic; omitting them means Google treats the whole consent signal as
 * incomplete, so the careful work of asking the visitor is wasted.
 */
export function toConsentModePayload(state: ConsentState) {
  return {
    ad_storage: state.marketing,
    ad_user_data: state.marketing,
    ad_personalization: state.marketing,
    analytics_storage: state.analytics,
  }
}
