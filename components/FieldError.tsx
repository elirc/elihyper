import * as React from 'react'

export interface FieldErrorProps {
  /** Stable id so the input can point at this element with aria-describedby. */
  id: string
  message?: string | null
}

/**
 * An inline validation message tied to one field.
 *
 * Deliberately developer-owned rather than a Plasmic node: the estimator's
 * design has no error slot, and waiting for one would block a fix that removes
 * six blocking browser dialogs.
 *
 * Accessibility notes, since this is the part that is easy to get wrong:
 *
 * - role="alert" (implicitly aria-live="assertive") makes a screen reader
 *   announce the message when it appears. Without it, a sighted user sees red
 *   text and a screen reader user is told nothing at all -- the form simply
 *   refuses to advance for no stated reason.
 * - The element is always rendered, even when empty. A live region has to
 *   exist in the DOM *before* its content changes for assistive technology to
 *   notice the change; mounting it at the same moment as the message is the
 *   classic reason "it works visually but announces nothing".
 * - The id is what the input references via aria-describedby.
 */
export default function FieldError({ id, message }: FieldErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      style={{
        minHeight: message ? undefined : 0,
        marginTop: message ? 8 : 0,
        color: '#ff6b6b',
        fontSize: 14,
        lineHeight: 1.4,
      }}>
      {message || ''}
    </div>
  )
}
