import * as React from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DEFAULT_SEO, SITE_NAME, SITE_ORIGIN, buildCanonicalUrl, getPageSeo, type PageSeo } from '../lib/seo'

export interface SeoHeadProps extends Partial<PageSeo> {}

/**
 * Renders per-route title, description, canonical and social tags.
 *
 * Mounted once in pages/_app.tsx, where it resolves metadata from
 * router.pathname. That keeps the change to 17 page components at zero: adding
 * a page means adding an entry to lib/seo.ts, not remembering to import
 * something.
 *
 * Props override the looked-up values, which is how a dynamic route
 * (/insights/[slug]) can supply a real title once its CMS content is known.
 */
export default function SeoHead(props: SeoHeadProps) {
  const router = useRouter()

  const base = getPageSeo(router.pathname)
  const seo: PageSeo = {
    title: props.title || base.title,
    description: props.description || base.description,
    image: props.image || base.image || DEFAULT_SEO.image,
    type: props.type || base.type || 'website',
    noindex: props.noindex ?? base.noindex,
  }

  const canonical = buildCanonicalUrl(router.asPath)
  // Social crawlers do not resolve relative image URLs.
  const absoluteImage = seo.image?.startsWith('http') ? seo.image : `${SITE_ORIGIN}${seo.image}`

  return (
    <Head>
      <title>{seo.title}</title>
      <meta name='description' content={seo.description} />
      <link rel='canonical' href={canonical} />

      {/*
        Non-production environments must never be indexed. Two identical sites
        in the index split ranking signals, and the dev copy sometimes wins --
        which is how a staging URL ends up as the top result for the brand.
      */}
      {(seo.noindex || process.env.NEXT_PUBLIC_APP_ENV !== 'prod') && (
        <meta name='robots' content='noindex, nofollow' />
      )}

      <meta property='og:site_name' content={SITE_NAME} />
      <meta property='og:title' content={seo.title} />
      <meta property='og:description' content={seo.description} />
      <meta property='og:url' content={canonical} />
      <meta property='og:type' content={seo.type} />
      <meta property='og:image' content={absoluteImage} />

      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={seo.title} />
      <meta name='twitter:description' content={seo.description} />
      <meta name='twitter:image' content={absoluteImage} />
    </Head>
  )
}

/**
 * Organization structured data, rendered once on the homepage.
 *
 * This is what populates a knowledge panel and lets search engines associate
 * the brand with its social profiles. JSON-LD rather than microdata because it
 * is the format Google documents and the only one that does not require
 * touching the generated Plasmic markup.
 */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/og-image.png`,
    description: DEFAULT_SEO.description,
  }

  return (
    <Head>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
    </Head>
  )
}
