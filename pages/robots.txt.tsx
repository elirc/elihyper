import type { GetServerSideProps } from 'next'
import { SITE_ORIGIN } from '../lib/seo'

/**
 * /robots.txt
 *
 * A route rather than a static file in public/, because the correct content
 * differs by environment: production invites crawlers, everything else must
 * refuse them.
 *
 * That distinction is not cosmetic. If the dev site is indexed, it competes
 * with production for the same terms and sometimes wins -- which is how a
 * staging URL becomes the top result for a company's own name.
 */
export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const isProduction = process.env.NEXT_PUBLIC_APP_ENV === 'prod'

  const body = isProduction
    ? `User-agent: *
Allow: /

# The Plasmic Studio canvas host is not a page for humans or crawlers.
Disallow: /plasmic-host

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
    : `# Non-production environment. Nothing here should be indexed.
User-agent: *
Disallow: /
`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(body)
  res.end()

  return { props: {} }
}

export default function Robots() {
  return null
}
