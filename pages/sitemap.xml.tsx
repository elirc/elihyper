import type { GetServerSideProps } from 'next'
import { SITE_ORIGIN, getStaticSitemapPaths, buildCanonicalUrl } from '../lib/seo'

/**
 * /sitemap.xml
 *
 * Served from getServerSideProps rather than a static file in public/ so the
 * URL list stays derived from lib/seo.ts. A hand-maintained XML file is a file
 * that silently goes stale the first time someone adds a page in a hurry.
 *
 * Cached at the CDN for an hour: the content changes when someone deploys, not
 * when someone requests it.
 */

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const lastmod = new Date().toISOString().split('T')[0]

  const urls = getStaticSitemapPaths().map((pathname) => {
    // The homepage is the entry point; deeper marketing pages matter less.
    const priority = pathname === '/' ? '1.0' : pathname.split('/').length > 2 ? '0.6' : '0.8'

    return `  <url>
    <loc>${escapeXml(buildCanonicalUrl(pathname))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(xml)
  res.end()

  return { props: {} }
}

// Next requires a default export from a page module. This never renders --
// getServerSideProps writes the response and ends it.
export default function Sitemap() {
  return null
}

export { SITE_ORIGIN }
