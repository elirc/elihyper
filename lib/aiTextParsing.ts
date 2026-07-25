/**
 * Extracting structured values out of the AI worker's prose.
 *
 * The enrichment worker (which lives outside this repository) writes
 * human-readable analysis into the Project record's AI_* fields, not JSON. The
 * summary screen needs numbers. These functions are the bridge, and they are
 * unavoidably heuristic.
 *
 * Two consequences worth internalising before changing anything here:
 *
 * 1. Every function returns null rather than guessing. Callers chain through
 *    several sources and fall back to locally computed values, so a null is
 *    recoverable while a confidently wrong number is not.
 *
 * 2. These heuristics are coupled to prompt wording we do not control. If the
 *    worker's output format changes, the summary silently degrades to
 *    baseline figures. That is why they are tested: the tests document the
 *    exact shapes we currently rely on, so a breakage is visible as a failing
 *    assertion rather than a subtly wrong quote.
 */

const PHASES_MARKER = 'PHASES_JSON:'

/**
 * Finds a `PHASES_JSON:{...}` block in AI prose and returns the JSON string.
 *
 * Uses brace matching rather than a regex because the payload contains nested
 * objects, and a regex that handles arbitrary nesting is not a regex. Returns
 * null unless the extracted text parses AND contains a `phases` key, so
 * malformed output is treated as absent rather than crashing the summary.
 */
export function extractPhasesJsonFromText(text?: string | null): string | null {
  if (!text) return null

  const markerIndex = text.indexOf(PHASES_MARKER)
  if (markerIndex === -1) return null

  const start = text.indexOf('{', markerIndex)
  if (start === -1) return null

  let depth = 0
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        const candidate = text.slice(start, i + 1).trim()
        try {
          const parsed = JSON.parse(candidate)
          if (parsed && parsed.phases) return candidate
        } catch {
          // Unparseable payload: treat as absent. The caller falls back to
          // GanttChart's default phase breakdown.
        }
        return null
      }
    }
  }

  return null
}

/**
 * Removes every PHASES_JSON block from AI prose so the remaining text can be
 * shown to the visitor.
 *
 * Without this, the summary screen displays a wall of raw JSON in the middle
 * of the timeline analysis. Handles the truncated case (marker present, block
 * never closed) by cutting from the marker to the end.
 */
export function removePhasesJsonFromText(text?: string | null): string | null {
  if (!text) return text || null

  let result = text

  for (;;) {
    const markerIndex = result.indexOf(PHASES_MARKER)
    if (markerIndex === -1) break

    const start = result.indexOf('{', markerIndex)
    if (start === -1) {
      result = result.slice(0, markerIndex).trim()
      break
    }

    let depth = 0
    let end = -1
    for (let i = start; i < result.length; i++) {
      const ch = result[i]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }

    if (end === -1) {
      // Unterminated block -- drop everything from the marker onward rather
      // than showing the visitor half a JSON object.
      result = result.slice(0, markerIndex).trim()
      break
    }

    result = (result.slice(0, markerIndex).trimEnd() + ' ' + result.slice(end + 1)).trim()
  }

  return result.trim()
}

/** Pulls a "Development Team: ..." or "Team Size: ..." line out of the analysis. */
export function extractTeamSummary(analysis?: string | null): string | null {
  if (!analysis) return null

  const match = analysis.match(/Development\s+Team\s*:\s*([^\n]+)/i) || analysis.match(/Team\s+Size\s*:\s*([^\n]+)/i)
  if (match?.[1]) return match[1].replace(/^[\-•]+\s*/, '').trim()

  return null
}

/**
 * Finds a line describing team composition, preferring a parenthesised
 * breakdown such as "Team (2 senior, 1 designer)".
 *
 * Skips lines containing a dollar sign: in practice the analysis lists roles
 * and their rates on the same line, and we want the composition here, not the
 * cost.
 */
export function extractTeamCompositionDetails(analysis?: string | null): string | null {
  if (!analysis) return null

  const lines = analysis
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (!/(developer|designer|engineer|pm|devops)/i.test(line)) continue
    if (/\$/.test(line)) continue

    const parenthesised = line.match(/\(([^)]+)\)/)
    if (parenthesised?.[1]) return parenthesised[1].trim()

    const afterColon = line.split(':').slice(1).join(':').trim()
    if (afterColon) return afterColon.replace(/^[\-•]+\s*/, '')
  }

  return null
}

/** First meaningful line of the infrastructure recommendation. */
export function extractInfrastructureSummary(text?: string | null): string | null {
  if (!text) return null

  const lines = text
    .split(/\n+/)
    .map((line) => line.replace(/^[\-•]+\s*/, '').trim())
    .filter(Boolean)

  if (!lines.length) return null

  const [first] = lines
  const match = first.match(/(?:recommend(?:ed)?|infrastructure)\s*:?\s*(.+)/i)
  return match?.[1]?.trim() || first
}

/**
 * Finds the headline cost.
 *
 * Prefers a line containing both "total" and a dollar figure; falls back to the
 * first line with any dollar figure. The ordering matters -- an analysis
 * typically lists per-role costs before the total, and showing a single role's
 * cost as the project quote would be badly wrong.
 */
export function extractCostSummary(analysis?: string | null): string | null {
  if (!analysis) return null

  const lines = analysis
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const totalLine = lines.find((line) => /total/i.test(line) && /\$\d/.test(line))
  if (totalLine) {
    const afterColon = totalLine.split(':').slice(1).join(':').trim()
    return afterColon || totalLine
  }

  return lines.find((line) => /\$\d/.test(line)) || null
}

/** Finds the headline timeline, preferring a line starting with "Total". */
export function extractTimelineSummary(text?: string | null): string | null {
  if (!text) return null

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const totalLine = lines.find((line) => /^total\b/i.test(line))
  if (totalLine) {
    const cleaned = totalLine.replace(/^total[^:]*:\s*/i, '').trim()
    return cleaned || totalLine
  }

  return lines[0] || null
}
