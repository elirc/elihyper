import {
  parseTimelineToMonths,
  getTeamComposition,
  computeDefaultEstimate,
  computeTotalHours,
  getTimelineRangeInMonths,
  formatMonthsRange,
  formatTeamSize,
  formatInfrastructure,
  ROLE_RATES,
  HOURS_PER_PERSON_PER_MONTH,
} from '../lib/estimatorMath'

describe('parseTimelineToMonths', () => {
  it.each([
    ['6 months', 6],
    ['1 month', 1],
    ['2 years', 24],
    ['1 year', 12],
    ['8 weeks', 2],
    ['90 days', 3],
  ])('reads %s as %s months', (input, expected) => {
    expect(parseTimelineToMonths(input)).toBeCloseTo(expected, 5)
  })

  it('averages a range', () => {
    expect(parseTimelineToMonths('4-6 months')).toBe(5)
    expect(parseTimelineToMonths('3 to 9 months')).toBe(6)
  })

  it('assumes months for a bare number', () => {
    expect(parseTimelineToMonths('6')).toBe(6)
  })

  // The defaults matter commercially: a shorter assumed timeline produces a
  // cheaper quote, and an under-quote is discovered during the sales call.
  it.each([[''], ['as soon as possible'], ['not sure yet']])('defaults %s to 12 months', (input) => {
    expect(parseTimelineToMonths(input)).toBe(12)
  })

  // ROUGH EDGE, pinned deliberately: the function averages the FIRST TWO
  // numbers it finds, whatever they mean. "2 years, maybe 6" is read as the
  // range 2-6 and yields (2+6)/2 = 4 years = 48 months, not 24.
  //
  // Averaging is right for "4-6 months" and wrong here. Fixing it needs a
  // decision about what free text should mean, which is a product question,
  // not a refactor. Documented rather than silently changed.
  it('averages the first two numbers even when the second is incidental', () => {
    expect(parseTimelineToMonths('2 years, maybe 6')).toBe(48)
  })
})

describe('getTeamComposition', () => {
  it('maps each wizard option to a headcount', () => {
    expect(getTeamComposition('1Developer')).toEqual({ seniorDev: 1 })
    expect(getTeamComposition('2Developers')).toEqual({ seniorDev: 1, midDev: 1 })
    expect(getTeamComposition('2Developers1Designer')).toEqual({ seniorDev: 1, midDev: 1, designer: 1 })
    expect(getTeamComposition('4Developers1Designer')).toEqual({ seniorDev: 2, midDev: 2, designer: 1 })
  })

  it('returns null for anything else, including the recommend-for-me sentinel', () => {
    expect(getTeamComposition('Recommend for me')).toBeNull()
    expect(getTeamComposition('')).toBeNull()
    expect(getTeamComposition('3Developers')).toBeNull()
  })
})

describe('computeTotalHours', () => {
  it('multiplies headcount by duration by the monthly allocation', () => {
    // 2 people x 6 months x 160h
    expect(computeTotalHours('2Developers', 6)).toBe(2 * 6 * HOURS_PER_PERSON_PER_MONTH)
    expect(computeTotalHours('4Developers1Designer', 3)).toBe(5 * 3 * HOURS_PER_PERSON_PER_MONTH)
  })

  it('is zero for an unknown team rather than NaN', () => {
    expect(computeTotalHours('Recommend for me', 6)).toBe(0)
  })
})

describe('computeDefaultEstimate', () => {
  it('produces a cost range from the rate card', () => {
    const { cost } = computeDefaultEstimate('1Developer', '6 months')
    const hours = 6 * HOURS_PER_PERSON_PER_MONTH // 960

    expect(cost).toBe(
      `$${(hours * ROLE_RATES.seniorDev.min).toLocaleString()} - $${(hours * ROLE_RATES.seniorDev.max).toLocaleString()}`
    )
  })

  it('presents hours as a +/-15% band', () => {
    const { hours } = computeDefaultEstimate('1Developer', '6 months')
    const exact = 6 * HOURS_PER_PERSON_PER_MONTH

    expect(hours).toBe(`${Math.round(exact * 0.85)}-${Math.round(exact * 1.15)}`)
  })

  it('falls back to placeholders for an unknown team', () => {
    expect(computeDefaultEstimate('Recommend for me', '6 months')).toEqual({
      hours: 'TBD',
      cost: 'Calculating...',
    })
  })

  it('uses the 12 month default when no timeline is given', () => {
    expect(computeDefaultEstimate('1Developer', '')).toEqual(computeDefaultEstimate('1Developer', '12 months'))
  })

  it('scales cost with team size', () => {
    const solo = computeDefaultEstimate('1Developer', '6 months')
    const team = computeDefaultEstimate('4Developers1Designer', '6 months')

    const firstNumber = (s: string) => Number(s.replace(/[^0-9]/g, '').slice(0, 8))
    expect(firstNumber(team.cost)).toBeGreaterThan(firstNumber(solo.cost))
  })
})

describe('getTimelineRangeInMonths', () => {
  it('reads a plain range', () => {
    expect(getTimelineRangeInMonths('4-6 months')).toEqual({ min: 4, max: 6 })
  })

  it('handles en dashes, em dashes and the word "to"', () => {
    expect(getTimelineRangeInMonths('4 – 6 months')).toEqual({ min: 4, max: 6 })
    expect(getTimelineRangeInMonths('4 — 6 months')).toEqual({ min: 4, max: 6 })
    expect(getTimelineRangeInMonths('4 to 6 months')).toEqual({ min: 4, max: 6 })
  })

  it('converts other units to months', () => {
    expect(getTimelineRangeInMonths('1-2 years')).toEqual({ min: 12, max: 24 })
    expect(getTimelineRangeInMonths('8 weeks')).toEqual({ min: 2, max: 2 })
  })

  it('normalises a reversed range', () => {
    expect(getTimelineRangeInMonths('6-4 months')).toEqual({ min: 4, max: 6 })
  })

  // Returning null lets the caller fall through to the next source. A wrong
  // number here would be displayed to the visitor as a real estimate.
  it.each([[undefined], [null], [''], ['soon'], ['0 months']])('returns null for %s', (input) => {
    expect(getTimelineRangeInMonths(input as string | null | undefined)).toBeNull()
  })
})

describe('formatMonthsRange', () => {
  it('renders in the largest natural unit', () => {
    expect(formatMonthsRange({ min: 12, max: 12 })).toBe('1 years')
    expect(formatMonthsRange({ min: 18, max: 18 })).toBe('1.5 years')
    expect(formatMonthsRange({ min: 3, max: 3 })).toBe('3 months')
    expect(formatMonthsRange({ min: 0.5, max: 0.5 })).toBe('2 weeks')
  })

  it('renders a genuine range with both ends', () => {
    expect(formatMonthsRange({ min: 4, max: 6 })).toBe('4 months - 6 months')
  })

  // "3 months - 3.1 months" is noise dressed up as precision.
  it('collapses a range narrower than a week to one value', () => {
    expect(formatMonthsRange({ min: 3, max: 3.1 })).toBe('3.1 months')
  })

  it('returns null when there is nothing to format', () => {
    expect(formatMonthsRange(null)).toBeNull()
    expect(formatMonthsRange(undefined)).toBeNull()
  })
})

describe('display formatters', () => {
  it('labels every team option', () => {
    expect(formatTeamSize('2Developers1Designer')).toBe('2 Developers + 1 Designer')
    expect(formatTeamSize('unknown')).toBe('TBD')
  })

  it('labels every infrastructure option', () => {
    expect(formatInfrastructure('awsEphemeral')).toBe('AWS Ephemeral Infrastructure')
    expect(formatInfrastructure('kubernetes')).toBe('Kubernetes Cluster')
    expect(formatInfrastructure('unknown')).toBe('TBD')
  })
})
