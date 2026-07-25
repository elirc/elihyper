/**
 * Estimator arithmetic: turning a team choice and a free-text timeline into a
 * cost and hours range.
 *
 * These functions were defined inside ProjectEstimator as useCallback hooks,
 * which made them impossible to test without rendering the whole Plasmic
 * component tree. They are pure -- same input, same output, no React, no
 * network -- so they belong in a module a test can import directly.
 *
 * This is the baseline shown before the AI enrichment worker responds, and the
 * fallback shown if it never does. It is deliberately simple: rate card times
 * headcount times duration.
 */

export interface TeamEstimate {
  hours: string
  cost: string
}

export interface RoleRate {
  min: number
  max: number
}

export type RoleKey = 'seniorDev' | 'midDev' | 'designer'

/** Blended hourly rate card, in USD. */
export const ROLE_RATES: Record<RoleKey, RoleRate> = {
  seniorDev: { min: 150, max: 200 },
  midDev: { min: 100, max: 150 },
  designer: { min: 100, max: 150 },
}

/**
 * One person-month. 160 = roughly 4 weeks x 40 hours, i.e. it assumes a
 * full-time allocation with no holiday and no context switching. It is
 * optimistic on purpose: it produces a floor, and the AI analysis is expected
 * to adjust upward.
 */
export const HOURS_PER_PERSON_PER_MONTH = 160

/**
 * Reads a duration out of whatever the visitor typed.
 *
 * Handles "6 months", "2 years", "8 weeks", "90 days" and ranges like
 * "4-6 months" (averaged). Returns months.
 *
 * Defaults to 12 months when it cannot tell -- a deliberately conservative
 * guess, since under-estimating a timeline produces an under-estimated cost
 * and an awkward sales conversation later.
 */
export function parseTimelineToMonths(timeline: string): number {
  if (!timeline) return 12

  const nums = (timeline.match(/\d+/g) || []).map((n) => parseInt(n, 10))
  if (nums.length === 0) return 12

  // A range like "4-6 months" is averaged; anything longer than two numbers
  // uses the first two, which is what a "3 to 6 month, maybe 9" answer means
  // in practice.
  const n = nums.length === 1 ? nums[0] : Math.round((nums[0] + nums[1]) / 2)

  if (/year/i.test(timeline)) return n * 12
  if (/month/i.test(timeline)) return n
  if (/week/i.test(timeline)) return n / 4
  if (/day/i.test(timeline)) return n / 30

  return n // a bare number is assumed to mean months
}

/** Maps a team option from the wizard to a headcount by role. */
export function getTeamComposition(teamKey: string): Partial<Record<RoleKey, number>> | null {
  switch (teamKey) {
    case '1Developer':
      return { seniorDev: 1 }
    case '2Developers':
      return { seniorDev: 1, midDev: 1 }
    case '2Developers1Designer':
      return { seniorDev: 1, midDev: 1, designer: 1 }
    case '4Developers1Designer':
      return { seniorDev: 2, midDev: 2, designer: 1 }
    default:
      return null
  }
}

/** Total person-hours for a team over a duration. */
export function computeTotalHours(teamKey: string, months: number): number {
  const roles = getTeamComposition(teamKey)
  if (!roles) return 0

  return Object.values(roles).reduce<number>(
    (total, count) => total + (count || 0) * months * HOURS_PER_PERSON_PER_MONTH,
    0
  )
}

/**
 * The pre-AI baseline estimate.
 *
 * Hours are presented as a +/-15% band rather than a single number, because a
 * single number reads as a commitment and this is an arithmetic guess.
 */
export function computeDefaultEstimate(teamKey: string, timeline: string): TeamEstimate {
  const roles = getTeamComposition(teamKey)
  if (!roles) return { hours: 'TBD', cost: 'Calculating...' }

  const months = parseTimelineToMonths(timeline || '12 months')

  let minCost = 0
  let maxCost = 0
  let totalHours = 0

  for (const [role, count] of Object.entries(roles)) {
    const roleHours = (count || 0) * months * HOURS_PER_PERSON_PER_MONTH
    totalHours += roleHours
    const rates = ROLE_RATES[role as RoleKey]
    minCost += roleHours * rates.min
    maxCost += roleHours * rates.max
  }

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  return {
    hours: `${Math.round(totalHours * 0.85)}-${Math.round(totalHours * 1.15)}`,
    cost: `${fmt(Math.round(minCost))} - ${fmt(Math.round(maxCost))}`,
  }
}

export interface MonthsRange {
  min: number
  max: number
}

/**
 * Pulls a duration range in months out of AI prose such as
 * "Total: 4-6 months" or "roughly 8 weeks".
 *
 * Returns null rather than guessing when there is no duration to find --
 * callers use that null to fall back to the next source, so a wrong guess here
 * is worse than no answer.
 */
export function getTimelineRangeInMonths(text?: string | null): MonthsRange | null {
  if (!text) return null

  // Normalise en/em dashes and the word "to" so one regex handles
  // "4-6", "4 – 6" and "4 to 6".
  const normalized = text.replace(/–|—|to/gi, '-')
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*(day|week|month|year)/i)
  if (!match) return null

  const start = parseFloat(match[1])
  const end = match[2] ? parseFloat(match[2]) : start
  if (Number.isNaN(start) || Number.isNaN(end)) return null

  const unit = match[3].toLowerCase()
  const toMonths = (value: number) => {
    switch (unit) {
      case 'year':
        return value * 12
      case 'week':
        return value / 4
      case 'day':
        return value / 30
      default:
        return value
    }
  }

  const min = toMonths(Math.min(start, end))
  const max = toMonths(Math.max(start, end))
  if (min <= 0 || max <= 0) return null

  return { min, max }
}

/**
 * Renders a months range in the largest unit that reads naturally:
 * 18 months as "1.5 years", 0.5 months as "2 weeks".
 *
 * Collapses to a single value when the ends are within a week of each other,
 * because "3 months - 3.1 months" is noise dressed up as precision.
 */
export function formatMonthsRange(range?: MonthsRange | null): string | null {
  if (!range) return null

  const formatSingle = (months: number) => {
    if (months >= 12) {
      const years = months / 12
      return years % 1 === 0 ? `${years | 0} years` : `${years.toFixed(1)} years`
    }
    if (months >= 1) {
      return months % 1 === 0 ? `${months | 0} months` : `${months.toFixed(1)} months`
    }
    const weeks = months * 4
    if (weeks >= 1) {
      return weeks % 1 === 0 ? `${weeks | 0} weeks` : `${weeks.toFixed(1)} weeks`
    }
    return `${Math.max(1, Math.round(months * 30))} days`
  }

  if (Math.abs(range.max - range.min) < 0.25) return formatSingle(range.max)

  return `${formatSingle(range.min)} - ${formatSingle(range.max)}`
}

/** Wizard team key -> label shown to the visitor. */
export function formatTeamSize(team: string): string {
  const displayNames: Record<string, string> = {
    '1Developer': '1 Developer',
    '2Developers': '2 Developers',
    '2Developers1Designer': '2 Developers + 1 Designer',
    '4Developers1Designer': '4 Developers + 1 Designer',
  }
  return displayNames[team] || 'TBD'
}

/** Wizard infrastructure key -> label shown to the visitor. */
export function formatInfrastructure(infra: string): string {
  const displayNames: Record<string, string> = {
    staticVm: 'Static Virtual Machine',
    awsEphemeral: 'AWS Ephemeral Infrastructure',
    kubernetes: 'Kubernetes Cluster',
  }
  return displayNames[infra] || 'TBD'
}
