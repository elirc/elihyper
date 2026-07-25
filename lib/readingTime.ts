/**
 * Reading-time estimate for insight articles.
 *
 * 220 words per minute is the common figure for adult reading of technical
 * prose. It is a rough number and that is fine: the label exists to help
 * someone decide whether they have time to read now, and "6 min read" does
 * that job whether the truth is five or seven.
 */

export const WORDS_PER_MINUTE = 220

/**
 * Counts words in text that may contain HTML or markdown.
 *
 * CMS bodies arrive as rich text, so tags are stripped first -- otherwise
 * every <p> and <strong> counts as a word and a short post reads as a long
 * one.
 */
export function countWords(content: string): number {
  if (!content) return 0

  const plain = content
    // Code blocks: keep them, but they are not read at prose speed. Counting
    // them normally over-estimates badly on a code-heavy article.
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[#*_>`~\[\]()]/g, ' ')
    .trim()

  if (!plain) return 0

  return plain.split(/\s+/).filter(Boolean).length
}

/** Whole minutes, never zero -- "0 min read" reads as an error. */
export function estimateReadingMinutes(content: string, wordsPerMinute = WORDS_PER_MINUTE): number {
  const words = countWords(content)
  if (words === 0) return 0

  return Math.max(1, Math.round(words / wordsPerMinute))
}

/** Display label, e.g. "6 min read". Empty string when there is nothing to read. */
export function formatReadingTime(content: string, wordsPerMinute = WORDS_PER_MINUTE): string {
  const minutes = estimateReadingMinutes(content, wordsPerMinute)
  return minutes === 0 ? '' : `${minutes} min read`
}

export interface TaggedItem {
  tags?: string[] | string | null
}

/**
 * Normalises the tag field.
 *
 * Plasmic CMS returns whatever the content editor configured: an array for a
 * multi-select field, a comma-separated string for a text field. Handling both
 * here means the filtering code does not have to care which was chosen, and a
 * later change in Studio does not break the page.
 */
export function normalizeTags(tags: TaggedItem['tags']): string[] {
  if (!tags) return []
  const list = Array.isArray(tags) ? tags : String(tags).split(',')

  return list
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .map((tag) => tag.toLowerCase())
}

/** Every distinct tag across a set of items, alphabetised for a stable UI. */
export function collectTags(items: TaggedItem[]): string[] {
  const seen = new Set<string>()
  for (const item of items) {
    for (const tag of normalizeTags(item.tags)) seen.add(tag)
  }

  return Array.from(seen).sort()
}

/** Filters by tag. An empty or unknown tag returns everything, never nothing. */
export function filterByTag<T extends TaggedItem>(items: T[], tag?: string | null): T[] {
  const wanted = tag?.trim().toLowerCase()
  if (!wanted) return items

  return items.filter((item) => normalizeTags(item.tags).includes(wanted))
}

export interface Page<T> {
  items: T[]
  page: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

/**
 * Slices a list into a page.
 *
 * Clamps out-of-range page numbers rather than returning an empty list,
 * because the page number comes from the URL and a stale link should show
 * something useful instead of a blank screen.
 */
export function paginate<T>(items: T[], page: number, perPage: number): Page<T> {
  const size = Math.max(1, perPage)
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages)
  const start = (current - 1) * size

  return {
    items: items.slice(start, start + size),
    page: current,
    totalPages,
    hasPrevious: current > 1,
    hasNext: current < totalPages,
  }
}
