import {
  extractPhasesJsonFromText,
  removePhasesJsonFromText,
  extractTeamSummary,
  extractTeamCompositionDetails,
  extractInfrastructureSummary,
  extractCostSummary,
  extractTimelineSummary,
} from '../lib/aiTextParsing'

// A realistic sample of what the enrichment worker writes into
// AI_timelineValidation. These tests double as documentation of the output
// format we depend on: if the worker's prompt changes, they fail here rather
// than showing a visitor a wrong quote.
const TIMELINE_WITH_PHASES = `Total: 4-6 months

The proposed timeline is achievable with the stated team.

PHASES_JSON:{"totalDays":150,"phases":[{"label":"Planning & Discovery","days":20},{"label":"Development","days":100},{"label":"Testing & QA","days":30}]}

Risks are concentrated in the integration phase.`

describe('extractPhasesJsonFromText', () => {
  it('extracts the JSON payload after the marker', () => {
    const json = extractPhasesJsonFromText(TIMELINE_WITH_PHASES)

    expect(json).not.toBeNull()
    expect(JSON.parse(json as string).totalDays).toBe(150)
    expect(JSON.parse(json as string).phases).toHaveLength(3)
  })

  it('brace-matches through nested objects', () => {
    const nested = 'PHASES_JSON:{"phases":[{"label":"A","meta":{"owner":"x"}}],"totalDays":10} trailing prose'

    expect(JSON.parse(extractPhasesJsonFromText(nested) as string).totalDays).toBe(10)
  })

  it('returns null when the payload is not valid JSON', () => {
    expect(extractPhasesJsonFromText('PHASES_JSON:{"phases":[oops}')).toBeNull()
  })

  // Guards a real failure mode: valid JSON that is not the shape we need.
  it('returns null when the JSON has no phases key', () => {
    expect(extractPhasesJsonFromText('PHASES_JSON:{"totalDays":10}')).toBeNull()
  })

  it.each([[undefined], [null], [''], ['no marker here']])('returns null for %s', (input) => {
    expect(extractPhasesJsonFromText(input as string | null | undefined)).toBeNull()
  })
})

describe('removePhasesJsonFromText', () => {
  it('strips the block so the prose can be shown to a visitor', () => {
    const cleaned = removePhasesJsonFromText(TIMELINE_WITH_PHASES) as string

    expect(cleaned).not.toContain('PHASES_JSON')
    expect(cleaned).not.toContain('totalDays')
    expect(cleaned).toContain('Total: 4-6 months')
    expect(cleaned).toContain('Risks are concentrated')
  })

  it('removes every occurrence, not just the first', () => {
    const twice = `A PHASES_JSON:{"phases":[]} B PHASES_JSON:{"phases":[]} C`

    expect(removePhasesJsonFromText(twice)).not.toContain('PHASES_JSON')
  })

  // Truncated LLM output is common. Showing half a JSON object to a visitor is
  // worse than showing nothing.
  it('drops from the marker onward when the block never closes', () => {
    const truncated = 'Timeline looks fine. PHASES_JSON:{"phases":[{"label":"A"'

    expect(removePhasesJsonFromText(truncated)).toBe('Timeline looks fine.')
  })

  it('leaves text without a marker untouched', () => {
    expect(removePhasesJsonFromText('Nothing to strip')).toBe('Nothing to strip')
  })

  it('passes through empty input', () => {
    expect(removePhasesJsonFromText('')).toBeNull()
    expect(removePhasesJsonFromText(null)).toBeNull()
  })
})

describe('extractCostSummary', () => {
  const analysis = `Cost Analysis
- Senior Developer: $150,000
- Mid Developer: $90,000
Total Project Cost: $240,000 - $310,000`

  // The ordering rule is the whole point: without preferring "total", the
  // first dollar line wins and we quote one role's cost as the project price.
  it('prefers the total line over the first dollar figure', () => {
    expect(extractCostSummary(analysis)).toBe('$240,000 - $310,000')
  })

  it('falls back to the first dollar figure when no total is present', () => {
    expect(extractCostSummary('- Senior Developer: $150,000')).toBe('- Senior Developer: $150,000')
  })

  it('returns null when there is no cost at all', () => {
    expect(extractCostSummary('No numbers in this analysis.')).toBeNull()
    expect(extractCostSummary(null)).toBeNull()
  })
})

describe('extractTeamSummary', () => {
  it('reads a Development Team line', () => {
    expect(extractTeamSummary('Development Team: 2 senior engineers')).toBe('2 senior engineers')
  })

  it('reads a Team Size line', () => {
    expect(extractTeamSummary('Team Size: 4 people')).toBe('4 people')
  })

  it('strips bullet markers', () => {
    expect(extractTeamSummary('- Development Team: 3 engineers')).toBe('3 engineers')
  })

  it('returns null when neither label appears', () => {
    expect(extractTeamSummary('Some other analysis')).toBeNull()
  })
})

describe('extractTeamCompositionDetails', () => {
  it('prefers a parenthesised breakdown', () => {
    expect(extractTeamCompositionDetails('Recommended team (2 senior, 1 designer)')).toBe('2 senior, 1 designer')
  })

  it('falls back to the text after a colon', () => {
    expect(extractTeamCompositionDetails('Engineers: two full stack developers')).toBe('two full stack developers')
  })

  // Cost lines mention roles too; picking one up here would display a price
  // where the visitor expects a headcount.
  it('skips lines containing costs', () => {
    const analysis = `- Senior Developer: $150,000\nTeam composition (1 senior, 1 mid)`

    expect(extractTeamCompositionDetails(analysis)).toBe('1 senior, 1 mid')
  })

  it('returns null when no role is mentioned', () => {
    expect(extractTeamCompositionDetails('Nothing relevant here')).toBeNull()
  })
})

describe('extractInfrastructureSummary', () => {
  it('reads the value after a recommend label', () => {
    expect(extractInfrastructureSummary('Recommended: AWS ECS with Fargate')).toBe('AWS ECS with Fargate')
  })

  it('falls back to the first meaningful line', () => {
    expect(extractInfrastructureSummary('- Kubernetes on EKS\n- With autoscaling')).toBe('Kubernetes on EKS')
  })

  it('returns null for empty input', () => {
    expect(extractInfrastructureSummary('')).toBeNull()
    expect(extractInfrastructureSummary(null)).toBeNull()
  })
})

describe('extractTimelineSummary', () => {
  it('prefers a line starting with Total', () => {
    expect(extractTimelineSummary('Some preamble\nTotal duration: 5 months')).toBe('5 months')
  })

  it('falls back to the first line', () => {
    expect(extractTimelineSummary('Roughly 3 months\nMore detail')).toBe('Roughly 3 months')
  })

  it('returns null for empty input', () => {
    expect(extractTimelineSummary(null)).toBeNull()
  })
})
