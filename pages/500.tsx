import * as React from 'react'
import Head from 'next/head'
import ErrorPageLayout from '../components/ErrorPageLayout'

/**
 * Custom 500.
 *
 * Kept even simpler than the 404: no analytics push, no router dependency, no
 * imports beyond the layout. This page renders when something has already gone
 * wrong, so every dependency it takes is another way for it to fail too.
 *
 * It also does not attempt to explain the error. A visitor cannot act on a
 * stack trace, and showing internals to the public is how implementation
 * details leak.
 */
export default function ServerError() {
  return (
    <>
      <Head>
        <title>Something went wrong | Hypernova Inc</title>
        <meta name='robots' content='noindex, nofollow' />
      </Head>

      <ErrorPageLayout
        code='500'
        heading='Something went wrong on our end'
        message='This one is our fault, not yours. Try again in a moment, or get in touch and we will sort it out.'>
        <p style={{ marginTop: 32, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>
          Need this fixed now?{' '}
          <a href='mailto:hello@hypernova.inc' style={{ color: '#00c2ff', textDecoration: 'underline' }}>
            hello@hypernova.inc
          </a>
        </p>
      </ErrorPageLayout>
    </>
  )
}
