import * as React from 'react'

export interface EstimateShareBarProps {
  onCopyLink: () => void
}

/**
 * "Copy link" affordance on the summary screen.
 *
 * The estimate URL is set by a shallow router.replace as soon as the summary
 * renders, so the link already works if the visitor copies it from the address
 * bar. This exists because almost nobody thinks to do that, and the person who
 * needs to see the estimate is usually not the person looking at it -- it is
 * whoever signs off the budget.
 */
export default function EstimateShareBar({ onCopyLink }: EstimateShareBarProps) {
  return (
    <div
      style={{
        margin: '0 auto 20px',
        maxWidth: 880,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        padding: '12px 16px',
        borderRadius: 10,
        border: '1px solid rgba(0, 194, 255, 0.25)',
        background: 'rgba(0, 194, 255, 0.06)',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 15,
      }}>
      <span>Keep this estimate — the link reopens it later, or share it with your team.</span>

      <button
        type='button'
        onClick={onCopyLink}
        style={{
          padding: '9px 16px',
          borderRadius: 8,
          fontSize: 14,
          cursor: 'pointer',
          border: '1px solid rgba(0, 194, 255, 0.45)',
          background: 'rgba(0, 194, 255, 0.18)',
          color: '#ffffff',
          whiteSpace: 'nowrap',
        }}>
        Copy link
      </button>
    </div>
  )
}

/**
 * Shown when a shared link points at an estimate we cannot load — a mistyped
 * URL, a deleted record, or an id from a different environment.
 *
 * The failure has to be explicit. Falling back to a blank wizard would look
 * like the link "worked" and the estimate was empty, which is a worse
 * experience than an error, and the visitor would have no idea whether to try
 * again or give up.
 */
export function EstimateNotFound({ onStartOver }: { onStartOver: () => void }) {
  return (
    <div
      role='alert'
      style={{
        margin: '0 auto 24px',
        maxWidth: 880,
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid rgba(255,107,107,0.5)',
        background: 'rgba(255,107,107,0.1)',
        color: '#ffffff',
        fontSize: 15,
        lineHeight: 1.6,
      }}>
      <strong style={{ display: 'block', marginBottom: 6 }}>We could not find that estimate</strong>

      <span style={{ color: 'rgba(255,255,255,0.8)' }}>
        The link may be mistyped or the estimate may no longer exist. Building a new one takes about a minute.
      </span>

      <div style={{ marginTop: 14 }}>
        <button
          type='button'
          onClick={onStartOver}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            fontSize: 14,
            cursor: 'pointer',
            border: '1px solid rgba(0, 194, 255, 0.45)',
            background: 'rgba(0, 194, 255, 0.18)',
            color: '#ffffff',
          }}>
          Start a new estimate
        </button>
      </div>
    </div>
  )
}
