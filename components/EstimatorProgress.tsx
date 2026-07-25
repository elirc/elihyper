import * as React from 'react'

export const WIZARD_STEPS = ['scope', 'timeline', 'team', 'infrastructure'] as const
export type WizardStep = (typeof WIZARD_STEPS)[number]

const STEP_LABELS: Record<WizardStep, string> = {
  scope: 'Scope',
  timeline: 'Timeline',
  team: 'Team',
  infrastructure: 'Infrastructure',
}

export interface EstimatorProgressProps {
  current: WizardStep
  /** Highest step reached, so completed steps are clickable and future ones are not. */
  maxReached: WizardStep
  onJumpToStep: (step: WizardStep) => void
}

/**
 * "Step 2 of 4" plus a bar, with completed steps clickable.
 *
 * Two problems this solves. Visitors had no idea how much was left, which is
 * the classic reason people abandon a multi-step form -- an unknown number of
 * remaining questions always feels like more than four. And fixing a typo on
 * step 1 from step 3 was impossible: handleBack walked one step at a time and
 * from the summary jumped straight to infrastructure, so the only route back
 * to the scope text was to restart.
 *
 * Accessibility: the bar is a real progressbar with aria-valuenow, and future
 * steps are genuinely disabled buttons rather than unclickable divs, so a
 * screen reader announces them as unavailable instead of silently doing
 * nothing.
 */
export default function EstimatorProgress({ current, maxReached, onJumpToStep }: EstimatorProgressProps) {
  const currentIndex = WIZARD_STEPS.indexOf(current)
  const maxIndex = WIZARD_STEPS.indexOf(maxReached)
  if (currentIndex === -1) return null

  const stepNumber = currentIndex + 1
  const percent = Math.round((stepNumber / WIZARD_STEPS.length) * 100)

  return (
    <div style={{ margin: '0 auto 24px', maxWidth: 880 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          gap: 12,
          flexWrap: 'wrap',
        }}>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
          Step {stepNumber} of {WIZARD_STEPS.length}
        </span>

        <nav style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WIZARD_STEPS.map((step, index) => {
            const isReachable = index <= maxIndex
            const isCurrent = index === currentIndex

            return (
              <button
                key={step}
                type='button'
                disabled={!isReachable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => isReachable && onJumpToStep(step)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  border: '1px solid rgba(0, 194, 255, 0.3)',
                  background: isCurrent ? 'rgba(0, 194, 255, 0.22)' : 'transparent',
                  color: isReachable ? '#ffffff' : 'rgba(255,255,255,0.35)',
                  cursor: isReachable ? 'pointer' : 'not-allowed',
                }}>
                {STEP_LABELS[step]}
              </button>
            )
          })}
        </nav>
      </div>

      <div
        role='progressbar'
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={WIZARD_STEPS.length}
        aria-label='Estimate progress'
        style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, rgba(0,194,255,0.6), rgba(0,194,255,1))',
            transition: 'width 200ms ease',
          }}
        />
      </div>
    </div>
  )
}
