import * as React from 'react'
import Script from 'next/script'
import { env } from '../src/utils/env'
import { logger } from '../lib/logger'

/**
 * HubSpot Meetings embed for /book-a-meeting.
 *
 * The page existed as a designed shell with no scheduler in it, so the only
 * route from "I want to talk to someone" to an actual meeting was a form and
 * an email thread. Prospects who reach the summary have already given us their
 * name, email and their entire project scope; making them retype it to book a
 * call is the largest avoidable drop-off in the funnel.
 *
 * HubSpot Meetings rather than Calendly because the CRM is already HubSpot:
 * the booking lands on the same contact record as the lead, with no
 * integration to maintain.
 */

const HUBSPOT_EMBED_SRC = 'https://static.hsappstatic.net/MeetingsEmbedCode/static-1/embed/MeetingsEmbedCode.js'

export interface MeetingSchedulerProps {
  /** e.g. "hypernova/discovery" -- the slug from the HubSpot meetings link. */
  meetingSlug?: string
}

interface Prefill {
  firstName?: string
  lastName?: string
  email?: string
}

/**
 * Reads what we already know about the visitor.
 *
 * Prefill values come from the URL first (so an emailed link can carry them)
 * and fall back to the tracking store pages/_app.tsx writes. Both are
 * best-effort: a failure here means the visitor types their name, not that
 * booking breaks.
 */
function readPrefill(): Prefill {
  if (typeof window === 'undefined') return {}

  try {
    const params = new URLSearchParams(window.location.search)
    const fromUrl: Prefill = {
      firstName: params.get('firstName') || undefined,
      lastName: params.get('lastName') || undefined,
      email: params.get('email') || undefined,
    }
    if (fromUrl.email) return fromUrl

    const raw = localStorage.getItem('hypernova_contact')
    return raw ? { ...fromUrl, ...JSON.parse(raw) } : fromUrl
  } catch {
    return {}
  }
}

export default function MeetingScheduler({ meetingSlug }: MeetingSchedulerProps) {
  const slug = meetingSlug || process.env.NEXT_PUBLIC_HUBSPOT_MEETING_SLUG
  const [scriptFailed, setScriptFailed] = React.useState(false)
  const [prefill, setPrefill] = React.useState<Prefill>({})

  React.useEffect(() => {
    setPrefill(readPrefill())
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    // HubSpot posts a message when a booking completes. This is the only
    // signal we get -- the embed is a cross-origin iframe, so nothing else
    // about the booking is observable from here.
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object' || !event.data) return
      const data = event.data as { meetingBookSucceeded?: boolean }
      if (!data.meetingBookSucceeded) return

      window.dataLayer?.push({ event: 'meeting_booked', env, app_env: env })
      logger.debug('[meetings] booking confirmed')
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  if (!slug) {
    // Unconfigured is a real state: the slug is per-portal and nobody should
    // have to read the source to find out why the page is empty.
    return <SchedulerFallback message='Online booking is not configured yet. Email us and we will find a time.' />
  }

  const query = new URLSearchParams({ embed: 'true' })
  if (prefill.firstName) query.set('firstName', prefill.firstName)
  if (prefill.lastName) query.set('lastName', prefill.lastName)
  if (prefill.email) query.set('email', prefill.email)

  return (
    <div style={{ margin: '0 auto', maxWidth: 900, padding: '0 16px' }}>
      {scriptFailed ? (
        <SchedulerFallback message='The booking calendar could not load. Email us and we will find a time.' />
      ) : (
        <div
          className='meetings-iframe-container'
          data-src={`https://meetings.hubspot.com/${slug}?${query.toString()}`}
          // A generous min-height stops the page collapsing while the iframe
          // sizes itself, which otherwise produces a visible jump.
          style={{ minHeight: 700 }}
        />
      )}

      <Script src={HUBSPOT_EMBED_SRC} strategy='afterInteractive' onError={() => setScriptFailed(true)} />
    </div>
  )
}

/**
 * Shown when the embed cannot load or is unconfigured.
 *
 * A blank frame is the worst outcome: the visitor came here specifically to
 * book, and a page that silently shows nothing reads as a broken company.
 */
function SchedulerFallback({ message }: { message: string }) {
  return (
    <div
      style={{
        margin: '0 auto',
        maxWidth: 640,
        padding: 24,
        borderRadius: 12,
        border: '1px solid rgba(0, 194, 255, 0.3)',
        background: 'rgba(0, 194, 255, 0.06)',
        color: '#ffffff',
        textAlign: 'center',
        fontSize: 16,
        lineHeight: 1.6,
      }}>
      <p style={{ marginBottom: 16 }}>{message}</p>
      <a
        href='mailto:hello@hypernova.inc'
        style={{
          display: 'inline-block',
          padding: '12px 20px',
          borderRadius: 8,
          border: '1px solid rgba(0, 194, 255, 0.45)',
          background: 'rgba(0, 194, 255, 0.18)',
          color: '#ffffff',
          textDecoration: 'none',
        }}>
        hello@hypernova.inc
      </a>
    </div>
  )
}
