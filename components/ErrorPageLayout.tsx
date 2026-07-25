import * as React from 'react'
import Link from 'next/link'

export interface ErrorPageLayoutProps {
  code: string
  heading: string
  message: string
  children?: React.ReactNode
}

/**
 * Shared shell for the 404 and 500 pages.
 *
 * Deliberately self-contained: no Plasmic components, no Amplify client, no
 * analytics provider, no 3D hero. An error page that depends on the same
 * machinery as the rest of the app will fail in exactly the situations it
 * exists for -- a 500 page that itself throws leaves the visitor with the
 * browser's default error screen, which is what we were trying to avoid.
 *
 * Styling is inline for the same reason: it cannot break because a stylesheet
 * failed to load.
 */
export default function ErrorPageLayout({ code, heading, message, children }: ErrorPageLayoutProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        background: '#05070f',
        color: '#ffffff',
        fontFamily: 'Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      }}>
      <p style={{ fontSize: 14, letterSpacing: '0.2em', color: '#00c2ff', marginBottom: 16 }}>{code}</p>

      <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 600, marginBottom: 16, maxWidth: 640 }}>
        {heading}
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', maxWidth: 560, marginBottom: 32 }}>
        {message}
      </p>

      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        <Link href='/' style={linkStyle(true)}>
          Go to the homepage
        </Link>
        <Link href='/services/' style={linkStyle(false)}>
          Our services
        </Link>
        <Link href='/tools/ai-project-estimator/' style={linkStyle(false)}>
          Get a project estimate
        </Link>
      </nav>

      {children}
    </main>
  )
}

function linkStyle(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '12px 20px',
    borderRadius: 10,
    fontSize: 16,
    border: '1px solid rgba(0, 194, 255, 0.45)',
    background: primary ? 'rgba(0, 194, 255, 0.18)' : 'transparent',
    color: '#ffffff',
  }
}
