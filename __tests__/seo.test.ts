import {
  PAGE_SEO,
  DEFAULT_SEO,
  SITE_ORIGIN,
  getPageSeo,
  buildCanonicalUrl,
  getStaticSitemapPaths,
} from '../lib/seo'

describe('buildCanonicalUrl', () => {
  it('produces an absolute URL with a trailing slash', () => {
    // next.config.mjs sets trailingSlash: true, so this is the URL actually
    // served. A canonical pointing at a URL that redirects is worse than none.
    expect(buildCanonicalUrl('/services')).toBe(`${SITE_ORIGIN}/services/`)
    expect(buildCanonicalUrl('/services/')).toBe(`${SITE_ORIGIN}/services/`)
  })

  it('handles the homepage', () => {
    expect(buildCanonicalUrl('/')).toBe(`${SITE_ORIGIN}/`)
    expect(buildCanonicalUrl('')).toBe(`${SITE_ORIGIN}/`)
  })

  // The single most valuable assertion in this file. Without stripping,
  // every campaign URL becomes its own canonical and the page's ranking
  // signals are split across dozens of duplicates.
  it('strips query strings and hashes', () => {
    expect(buildCanonicalUrl('/services/?utm_source=linkedin&utm_campaign=q3')).toBe(`${SITE_ORIGIN}/services/`)
    expect(buildCanonicalUrl('/services/#pricing')).toBe(`${SITE_ORIGIN}/services/`)
    expect(buildCanonicalUrl('/services/?a=1#b')).toBe(`${SITE_ORIGIN}/services/`)
  })

  it('handles nested paths', () => {
    expect(buildCanonicalUrl('/solutions/usa-based-developers')).toBe(`${SITE_ORIGIN}/solutions/usa-based-developers/`)
  })
})

describe('getPageSeo', () => {
  it('returns the entry for a known route', () => {
    expect(getPageSeo('/tools/ai-project-estimator').title).toContain('Estimator')
  })

  it('falls back to the default for an unknown route', () => {
    expect(getPageSeo('/not-a-real-route')).toBe(DEFAULT_SEO)
  })
})

describe('PAGE_SEO content quality', () => {
  // noindex pages never appear in a result, so their description length is
  // irrelevant -- holding them to the same bar would be theatre.
  const entries = Object.entries(PAGE_SEO).filter(([, seo]) => !seo.noindex)

  // Search engines truncate around these lengths. A title cut mid-word is a
  // worse result than a shorter one written to fit.
  it.each(entries)('%s has a title under 65 characters', (_pathname, seo) => {
    expect(seo.title.length).toBeGreaterThan(0)
    expect(seo.title.length).toBeLessThanOrEqual(65)
  })

  it.each(entries)('%s has a description between 50 and 165 characters', (_pathname, seo) => {
    expect(seo.description.length).toBeGreaterThanOrEqual(50)
    expect(seo.description.length).toBeLessThanOrEqual(165)
  })

  // Duplicate titles are the exact problem this story exists to fix, so the
  // suite fails if they ever come back.
  it('has no duplicate titles', () => {
    const titles = entries.filter(([, seo]) => !seo.noindex).map(([, seo]) => seo.title)

    expect(new Set(titles).size).toBe(titles.length)
  })

  it('has no duplicate descriptions', () => {
    const descriptions = entries.filter(([, seo]) => !seo.noindex).map(([, seo]) => seo.description)

    expect(new Set(descriptions).size).toBe(descriptions.length)
  })
})

describe('getStaticSitemapPaths', () => {
  it('excludes dynamic routes, which have no single URL', () => {
    expect(getStaticSitemapPaths().some((p) => p.includes('['))).toBe(false)
  })

  it('excludes noindex routes', () => {
    expect(getStaticSitemapPaths()).not.toContain('/plasmic-host')
  })

  it('includes the homepage and the estimator', () => {
    const paths = getStaticSitemapPaths()

    expect(paths).toContain('/')
    expect(paths).toContain('/tools/ai-project-estimator')
  })
})
