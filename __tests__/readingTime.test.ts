import {
  countWords,
  estimateReadingMinutes,
  formatReadingTime,
  normalizeTags,
  collectTags,
  filterByTag,
  paginate,
  WORDS_PER_MINUTE,
} from '../lib/readingTime'

describe('countWords', () => {
  it('counts plain prose', () => {
    expect(countWords('one two three four five')).toBe(5)
  })

  // CMS bodies are rich text. Counting tags as words makes a short post look
  // like a long one.
  it('ignores HTML tags and entities', () => {
    expect(countWords('<p>one <strong>two</strong> three</p>')).toBe(3)
    expect(countWords('one &amp; two')).toBe(2)
  })

  it('ignores markdown punctuation', () => {
    expect(countWords('# Heading\n\n**bold** and _italic_')).toBe(4)
  })

  // Nobody reads a code block at prose speed; counting it normally
  // over-estimates a code-heavy article badly.
  it('excludes fenced code blocks', () => {
    expect(countWords('intro text\n```\nconst a = 1\nconst b = 2\n```\noutro')).toBe(3)
  })

  it.each([[''], ['   '], ['<p></p>']])('returns 0 for %s', (input) => {
    expect(countWords(input)).toBe(0)
  })
})

describe('estimateReadingMinutes', () => {
  it('divides by the words-per-minute rate', () => {
    expect(
      estimateReadingMinutes(
        Array(WORDS_PER_MINUTE * 6)
          .fill('word')
          .join(' ')
      )
    ).toBe(6)
  })

  // "0 min read" reads as a bug, so anything with content is at least 1.
  it('never returns less than one minute for real content', () => {
    expect(estimateReadingMinutes('short')).toBe(1)
  })

  it('returns 0 only for empty content', () => {
    expect(estimateReadingMinutes('')).toBe(0)
  })
})

describe('formatReadingTime', () => {
  it('formats a label', () => {
    expect(formatReadingTime(Array(440).fill('word').join(' '))).toBe('2 min read')
  })

  it('returns an empty string rather than a misleading label', () => {
    expect(formatReadingTime('')).toBe('')
  })
})

describe('normalizeTags', () => {
  // Plasmic returns an array for a multi-select and a comma-separated string
  // for a text field. Both shapes are real depending on how the content model
  // was configured.
  it('accepts an array', () => {
    expect(normalizeTags(['DevOps', ' Cloud '])).toEqual(['devops', 'cloud'])
  })

  it('accepts a comma-separated string', () => {
    expect(normalizeTags('DevOps, Cloud')).toEqual(['devops', 'cloud'])
  })

  it.each([[null], [undefined], ['']])('returns an empty array for %s', (input) => {
    expect(normalizeTags(input as null)).toEqual([])
  })
})

describe('collectTags', () => {
  it('returns each distinct tag once, alphabetised', () => {
    const items = [{ tags: ['DevOps', 'Cloud'] }, { tags: 'cloud, testing' }, { tags: null }]

    expect(collectTags(items)).toEqual(['cloud', 'devops', 'testing'])
  })
})

describe('filterByTag', () => {
  const items = [{ tags: ['devops'] }, { tags: ['cloud', 'devops'] }, { tags: ['testing'] }]

  it('filters case-insensitively', () => {
    expect(filterByTag(items, 'DevOps')).toHaveLength(2)
  })

  // A stale or hand-edited URL should show the full list, not an empty page
  // that looks like the blog has no articles.
  it.each([[undefined], [null], [''], ['  ']])('returns everything for %s', (tag) => {
    expect(filterByTag(items, tag as string | null)).toHaveLength(3)
  })

  it('returns nothing for a tag no article carries', () => {
    expect(filterByTag(items, 'nonexistent')).toHaveLength(0)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 25 }, (_, i) => i)

  it('slices the requested page', () => {
    expect(paginate(items, 2, 10).items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
  })

  it('reports navigation state', () => {
    expect(paginate(items, 1, 10)).toMatchObject({ page: 1, totalPages: 3, hasPrevious: false, hasNext: true })
    expect(paginate(items, 3, 10)).toMatchObject({ page: 3, hasPrevious: true, hasNext: false })
  })

  // The page number comes from the URL, so it is attacker- and typo-supplied.
  it.each([
    ['zero', 0, 1],
    ['negative', -5, 1],
    ['beyond the end', 99, 3],
    ['not a number', NaN, 1],
  ])('clamps a %s page number', (_label, requested, expected) => {
    expect(paginate(items, requested as number, 10).page).toBe(expected)
  })

  it('handles an empty list without dividing by zero', () => {
    expect(paginate([], 1, 10)).toMatchObject({ items: [], page: 1, totalPages: 1, hasNext: false })
  })
})
