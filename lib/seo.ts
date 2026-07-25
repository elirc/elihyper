/**
 * Per-route SEO metadata.
 *
 * Before this, pages/_app.tsx set one Open Graph title and description for the
 * entire site, so every page shared on LinkedIn as "Hypernova Inc - Build with
 * Proven Teams" and every page competed in search with the same title. For a
 * site whose whole purpose is inbound lead generation, that is the cheapest
 * fixable problem available.
 *
 * Keeping the copy in a data structure rather than scattered through 17 page
 * components means marketing can review every title and description in one
 * place, and a missing entry is visible at a glance.
 */

export interface PageSeo {
  title: string
  description: string
  /** Overrides the default OG image for pages that deserve their own. */
  image?: string
  /** Article for blog posts, website for everything else. */
  type?: 'website' | 'article'
  /** Set for pages that should not appear in search results. */
  noindex?: boolean
}

export const SITE_NAME = 'Hypernova Inc'

/**
 * Canonical origin. Canonical URLs must be absolute and must match what is
 * actually served -- including the trailing slash, since next.config.mjs sets
 * trailingSlash: true. A canonical pointing at a URL that redirects is worse
 * than no canonical at all.
 */
export const SITE_ORIGIN = 'https://hypernova.inc'

export const DEFAULT_SEO: PageSeo = {
  title: 'Hypernova Inc - Software Built by Senior US-Based Engineers',
  description:
    'Hypernova builds and rescues production software with senior, US-based engineering teams. Get a free AI-generated project estimate in minutes.',
  image: '/og-image.png',
  type: 'website',
}

/**
 * Keyed by Next's `router.pathname`, so dynamic routes appear in their
 * bracketed form. Titles stay under ~60 characters and descriptions under
 * ~155, which is roughly where Google truncates them.
 */
export const PAGE_SEO: Record<string, PageSeo> = {
  '/': DEFAULT_SEO,

  '/services': {
    title: 'Software Development Services | Hypernova',
    description:
      'Product engineering, cloud infrastructure and team augmentation from senior US-based developers. See how Hypernova delivers production software.',
  },

  '/technologies': {
    title: 'Our Technology Stack | Hypernova',
    description:
      'The languages, frameworks and cloud platforms Hypernova builds with, and why we choose them for production workloads.',
  },

  '/technology/[slug]': {
    title: 'Technology | Hypernova',
    description: 'How Hypernova uses this technology to ship reliable production software.',
  },

  '/insights': {
    title: 'Engineering Insights | Hypernova',
    description:
      'Practical writing on shipping production software: architecture, cloud cost, delivery practices and engineering leadership.',
  },

  '/insights/[slug]': {
    title: 'Insights | Hypernova',
    description: 'Practical engineering writing from the Hypernova team.',
    type: 'article',
  },

  '/case-study': {
    title: 'Client Case Studies | Hypernova',
    description: 'How Hypernova has delivered production software for real clients, with the outcomes that followed.',
  },

  '/case-studies/oso': {
    title: 'OSO Case Study | Hypernova',
    description: 'How Hypernova delivered production software for OSO, and what the engagement produced.',
  },

  '/production-quality': {
    title: 'Production-Quality Software | Hypernova',
    description:
      'What separates a prototype from software you can run a business on: testing, observability, security and operational readiness.',
  },

  '/senior-developers-proven-teams': {
    title: 'Senior Developers, Proven Teams | Hypernova',
    description:
      'Work with engineers who have shipped before. Hypernova staffs proven senior teams rather than assembling strangers.',
  },

  '/solutions/usa-based-developers': {
    title: 'US-Based Development Teams | Hypernova',
    description:
      'Why Hypernova hires only US-based senior developers: timezone overlap, communication, and accountability for production systems.',
  },

  '/solutions/convert-vibe-code-to-production-quality': {
    title: 'Turn AI-Generated Code Into Production Software | Hypernova',
    description:
      'AI got you a prototype. Hypernova turns it into software that scales, passes review and survives real users.',
  },

  '/tools/ai-project-estimator': {
    title: 'Free AI Project Estimator | Hypernova',
    description:
      'Describe your project and get an AI-generated cost range, timeline, team composition and risk assessment in minutes. No sales call required.',
  },

  // TODO(marketing): this description is a placeholder written without sight
  // of the page's content. Replace it with copy that describes what Nova
  // actually does before this route is promoted anywhere.
  '/tools/nova': {
    title: 'Nova | Hypernova',
    description:
      'Nova is a Hypernova tool for teams planning and scoping software projects. Explore what it does and how to use it.',
  },

  '/book-a-meeting': {
    title: 'Book a Meeting | Hypernova',
    description: 'Talk to a Hypernova engineer about your project. Pick a time that suits you.',
  },

  // The Plasmic Studio canvas host. Never useful to a searcher, and indexing it
  // would put a blank editor page in search results for the brand.
  '/plasmic-host': {
    title: 'Plasmic Host',
    description: 'Design tool canvas host.',
    noindex: true,
  },
}

export function getPageSeo(pathname: string): PageSeo {
  return PAGE_SEO[pathname] || DEFAULT_SEO
}

/**
 * Builds the canonical URL for a path.
 *
 * Strips query strings and hashes -- `?utm_source=linkedin` must not create a
 * second canonical URL, or every campaign splits the page's ranking signals
 * across duplicates.
 */
export function buildCanonicalUrl(asPath: string, origin = SITE_ORIGIN): string {
  const [pathOnly] = asPath.split(/[?#]/)

  if (pathOnly === '/' || pathOnly === '') return `${origin}/`

  // trailingSlash: true means this is the URL actually served.
  const withTrailingSlash = pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
  return `${origin}${withTrailingSlash}`
}

/** Routes that belong in the sitemap, excluding dynamic and noindex pages. */
export function getStaticSitemapPaths(): string[] {
  return Object.entries(PAGE_SEO)
    .filter(([pathname, seo]) => !pathname.includes('[') && !seo.noindex)
    .map(([pathname]) => pathname)
}
