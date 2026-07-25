import * as React from 'react'

export type AiStatus = 'pending' | 'ready' | 'degraded' | 'error'

export interface EstimateStatusBannerProps {
  status: AiStatus
  onRetry?: () => void
}

/**
 * Tells the visitor when the figures they are looking at are a fallback.
 *
 * The estimator computes a local baseline (rate card x headcount x duration)
 * before the AI worker responds, and shows it if the worker never does. Those
 * numbers look identical to a real analysis -- same layout, same confidence,
 * same currency formatting -- so a visitor had no way to tell an AI-reviewed
 * estimate from arithmetic.
 *
 * That matters at exactly the wrong moment: the summary screen is where we ask
 * for their contact details. Presenting a fallback as an analysis is the kind
 * of thing that is discovered in the first sales call.
 */
export default function EstimateStatusBanner({ status, onRetry }: EstimateStatusBannerProps) {
  if (status === 'ready' || status === 'pending') return null

  const isError = status === 'error'

  return (
    <div
      role='status'
      style={{
        margin: '0 auto 24px',
        maxWidth: 880,
        padding: '16px 20px',
        borderRadius: 12,
        border: `1px solid ${isError ? 'rgba(255,107,107,0.5)' : 'rgba(250,173,20,0.5)'}`,
        background: isError ? 'rgba(255,107,107,0.1)' : 'rgba(250,173,20,0.1)',
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 1.6,
      }}>
      <strong style={{ display: 'block', marginBottom: 6 }}>
        {isError ? 'We could not complete the detailed analysis' : 'Showing a preliminary estimate'}
      </strong>

      <span style={{ color: 'rgba(255,255,255,0.8)' }}>
        {isError
          ? 'Something went wrong while analysing your project. The figures below are a rough calculation, not a reviewed estimate.'
          : 'Our detailed analysis is taking longer than usual. The figures below come from our standard rate card and are a starting point, not a reviewed estimate.'}
      </span>

      <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {onRetry && (
          <button type='button' onClick={onRetry} style={buttonStyle(true)}>
            Try again
          </button>
        )}
        <a href='/book-a-meeting/' style={buttonStyle(false)}>
          Talk to a human
        </a>
      </div>
    </div>
  )
}

function buttonStyle(primary: boolean): React.CSSProperties {
  return {
    display: 'inline-block',
    padding: '9px 16px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    border: '1px solid rgba(0, 194, 255, 0.45)',
    background: primary ? 'rgba(0, 194, 255, 0.18)' : 'transparent',
    color: '#ffffff',
    textDecoration: 'none',
  }
}
