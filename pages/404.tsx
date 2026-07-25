import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import ErrorPageLayout from '../components/ErrorPageLayout'
import { env } from '../src/utils/env'

/**
 * Custom 404.
 *
 * Next.js serves a bare black-and-white error page by default, with no
 * navigation and no branding. Every mistyped URL, every stale campaign link and
 * every renamed Plasmic page landed there, and we had no idea how often.
 *
 * The tracking is the part that pays for itself: a page_not_found event with
 * the attempted path and referrer turns "broken links" from a thing people
 * occasionally mention into a list you can sort by frequency.
 */
export default function NotFound() {
  const router = useRouter()

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    window.dataLayer?.push({
      event: 'page_not_found',
      env,
      app_env: env,
      // The path the visitor actually asked for, which is the thing to fix.
      attempted_path: window.location.pathname + window.location.search,
      // Where they came from -- an internal referrer means we linked it wrong
      // ourselves, which is a different (and more embarrassing) problem.
      referrer: document.referrer || '(none)',
    })
  }, [router.asPath])

  return (
    <>
      <Head>
        <title>Page not found | Hypernova Inc</title>
        {/* A 404 must never be indexed, whatever the site-wide rules say. */}
        <meta name='robots' content='noindex, nofollow' />
      </Head>

      <ErrorPageLayout
        code='404'
        heading='We could not find that page'
        message='The link may be out of date, or the page may have moved. These will get you back on track.'
      />
    </>
  )
}
