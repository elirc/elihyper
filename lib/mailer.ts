/**
 * Outbound email transport.
 *
 * Pluggable for the same reason the rate limiter's store is: the thing that
 * actually talks to a third party should be swappable, so tests never send
 * real mail and local development never needs AWS credentials.
 *
 * Default is the log transport. A deployment that has not configured SES gets
 * a clearly logged no-op instead of a crash -- sending email is an enhancement
 * to the lead flow, not a prerequisite for it.
 */

import { logger, describeError } from './logger'

export interface OutboundEmail {
  to: string
  subject: string
  html: string
  text: string
}

export interface Mailer {
  send(email: OutboundEmail): Promise<{ delivered: boolean; id?: string }>
}

/** Local/unconfigured default. Records that a send was attempted, nothing more. */
export class LogMailer implements Mailer {
  async send(email: OutboundEmail) {
    // The recipient is personal data, so log that a send happened and the
    // subject, never the address or the body.
    logger.info('[mailer] log transport: would send', { subject: email.subject })
    return { delivered: false }
  }
}

/**
 * Amazon SES v2.
 *
 * Imported dynamically so deployments without SES configured do not pay to
 * load the SDK on every cold start. Requires a verified sender identity, and
 * a new AWS account is sandboxed until you request production access -- in the
 * sandbox you can only send to verified addresses, which is a confusing way to
 * discover the setup is incomplete.
 */
export class SesMailer implements Mailer {
  private clientPromise: Promise<{ send(command: unknown): Promise<{ MessageId?: string }> }> | null = null

  constructor(
    private fromAddress: string,
    private region = process.env.AWS_REGION || 'us-east-1'
  ) {}

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = import('@aws-sdk/client-sesv2').then(
        ({ SESv2Client }) =>
          new SESv2Client({ region: this.region }) as unknown as {
            send(command: unknown): Promise<{ MessageId?: string }>
          }
      )
    }
    return this.clientPromise
  }

  async send(email: OutboundEmail) {
    const { SendEmailCommand } = await import('@aws-sdk/client-sesv2')
    const client = await this.getClient()

    const result = await client.send(
      new SendEmailCommand({
        FromEmailAddress: this.fromAddress,
        Destination: { ToAddresses: [email.to] },
        Content: {
          Simple: {
            Subject: { Data: email.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: email.html, Charset: 'UTF-8' },
              // Always send both parts. A text/plain alternative is what stops
              // spam filters treating an HTML-only message as suspicious.
              Text: { Data: email.text, Charset: 'UTF-8' },
            },
          },
        },
      })
    )

    return { delivered: true, id: result.MessageId }
  }
}

let defaultMailer: Mailer | null = null

export function getMailer(): Mailer {
  if (!defaultMailer) {
    const from = process.env.SES_FROM_ADDRESS
    defaultMailer = from ? new SesMailer(from) : new LogMailer()

    if (!from && process.env.NODE_ENV === 'production') {
      logger.warn('[mailer] SES_FROM_ADDRESS is not set; estimate emails are not being delivered.')
    }
  }
  return defaultMailer
}

/** Test seam. */
export function setMailer(mailer: Mailer | null) {
  defaultMailer = mailer
}

/**
 * Sends without letting a failure propagate.
 *
 * Callers use this when the email is secondary to something that already
 * succeeded -- the lead is saved, the estimate exists, and losing the email is
 * an annoyance rather than a reason to show the visitor an error.
 */
export async function sendQuietly(email: OutboundEmail): Promise<boolean> {
  try {
    const result = await getMailer().send(email)
    return result.delivered
  } catch (error) {
    logger.error('[mailer] send failed', describeError(error))
    return false
  }
}
