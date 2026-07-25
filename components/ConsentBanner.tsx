import * as React from 'react'
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_SECONDS,
  DENIED_CONSENT,
  GRANTED_CONSENT,
  readConsentFromCookieString,
  serializeConsent,
  toConsentModePayload,
  type ConsentState,
} from '../lib/consent'

/**
 * Cookie consent banner.
 *
 * Before this, GTM, LinkedIn Insight, the Meta pixel, the X pixel and a
 * 90-day experiment cookie all loaded on first paint, before the visitor had
 * any say. For a consultancy selling into the EU and UK that is both a legal
 * exposure and a bad look on a site whose pitch is engineering rigour.
 *
 * The banner only renders when no decision is stored. The actual gating
 * happens in pages/_app.tsx's pre-paint script, which reads the same cookie
 * synchronously -- by the time this component mounts, the decision about
 * whether to load a tracker has already been made. This is only the UI for
 * making that decision.
 */
export default function ConsentBanner() {
  const [decision, setDecision] = React.useState<ConsentState | null | undefined>(undefined)

  React.useEffect(() => {
    setDecision(readConsentFromCookieString(document.cookie))
  }, [])

  const persist = React.useCallback((state: ConsentState) => {
    const parts = [
      `${CONSENT_COOKIE}=${serializeConsent(state)}`,
      'Path=/',
      `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
      'SameSite=Lax',
    ]
    if (window.location.protocol === 'https:') parts.push('Secure')
    document.cookie = parts.join('; ')

    // Update Consent Mode live so a granting visitor is measured from this
    // page view rather than the next one. gtag may not exist if GTM was never
    // configured, hence the guard.
    const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
    if (typeof w.gtag === 'function') {
      w.gtag('consent', 'update', toConsentModePayload(state))
    } else {
      w.dataLayer.push(['consent', 'update', toConsentModePayload(state)])
    }
    w.dataLayer.push({
      event: 'consent_updated',
      consent_analytics: state.analytics,
      consent_marketing: state.marketing,
    })

    setDecision(state)

    // Granting requires a reload to actually inject the tags: the pre-paint
    // script already ran and decided not to. Reloading is honest and simple;
    // injecting them here would duplicate that logic in a second place, where
    // the two copies would drift.
    if (state.analytics === 'granted' || state.marketing === 'granted') {
      window.location.reload()
    }
  }, [])

  // undefined = not yet read (SSR and first paint). Rendering nothing here
  // avoids a hydration mismatch and a banner that flashes for people who
  // already decided months ago.
  if (decision !== null) return null

  return (
    <div
      role='dialog'
      aria-live='polite'
      aria-label='Cookie preferences'
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        margin: '0 auto',
        maxWidth: 720,
        padding: 20,
        borderRadius: 12,
        border: '1px solid rgba(0, 194, 255, 0.35)',
        background: 'rgba(5, 7, 15, 0.97)',
        backdropFilter: 'blur(10px)',
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 1.6,
        boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
      }}>
      <p style={{ marginBottom: 14 }}>
        We use cookies to understand how the site is used and to measure our advertising. Nothing non-essential runs
        until you choose.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type='button' onClick={() => persist(GRANTED_CONSENT)} style={buttonStyle(true)}>
          Accept all
        </button>
        {/*
          Rejecting is exactly as easy as accepting: same size, same
          prominence, one click. A "reject" buried two menus deep is not
          consent, and regulators have said so repeatedly.
        */}
        <button type='button' onClick={() => persist(DENIED_CONSENT)} style={buttonStyle(false)}>
          Reject non-essential
        </button>
      </div>
    </div>
  )
}

function buttonStyle(primary: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    border: '1px solid rgba(0, 194, 255, 0.45)',
    background: primary ? 'rgba(0, 194, 255, 0.2)' : 'transparent',
    color: '#ffffff',
  }
}

/**
 * Footer link that clears the stored decision so the banner returns.
 *
 * Withdrawing consent has to be as easy as giving it, and a visitor who
 * changes their mind currently has no route back.
 */
export function ConsentPreferencesLink() {
  return (
    <button
      type='button'
      onClick={() => {
        document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
        window.location.reload()
      }}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'inherit',
        textDecoration: 'underline',
        cursor: 'pointer',
        font: 'inherit',
      }}>
      Cookie preferences
    </button>
  )
}
