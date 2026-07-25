/**
 * Builds the downloadable estimate PDF.
 *
 * Composed from jsPDF primitives rather than screenshotting the summary with
 * html2canvas. The live UI has fixed-position overlays, gradients and a WebGL
 * canvas, all of which rasterise badly; a screenshot also produces an image of
 * text, which cannot be selected, searched or read by a screen reader. A
 * purpose-built layout is more code and a much better artifact.
 *
 * jsPDF is loaded by the caller via dynamic import so its ~350KB never reaches
 * the initial bundle of pages that do not offer a download.
 */

export interface EstimatePdfData {
  id: string
  cost: string
  timeline: string
  hours: string
  team: string
  infrastructure: string
  scope: string
  risks?: string | null
  /** Phase breakdown, when the AI produced one. */
  phases?: { label: string; days: number }[]
  /** True when the figures are the local fallback rather than an AI analysis. */
  isPreliminary?: boolean
}

/** Minimal surface of the jsPDF instance this module uses. */
export interface PdfDoc {
  setFont(family: string, style?: string): void
  setFontSize(size: number): void
  setTextColor(r: number, g: number, b: number): void
  setFillColor(r: number, g: number, b: number): void
  setDrawColor(r: number, g: number, b: number): void
  text(text: string | string[], x: number, y: number): void
  rect(x: number, y: number, w: number, h: number, style?: string): void
  line(x1: number, y1: number, x2: number, y2: number): void
  splitTextToSize(text: string, maxWidth: number): string[]
  addPage(): void
  save(filename: string): void
}

const MARGIN = 18
const PAGE_WIDTH = 210 // A4 portrait, millimetres
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const PHASE_COLOURS: [number, number, number][] = [
  [59, 130, 246],
  [139, 92, 246],
  [16, 185, 129],
  [245, 158, 11],
  [239, 68, 68],
]

/**
 * Draws the document. Kept separate from file creation so tests can assert the
 * layout calls against a fake doc without producing a binary.
 */
export function drawEstimatePdf(doc: PdfDoc, data: EstimatePdfData): void {
  let y = MARGIN

  const ensureRoom = (needed: number) => {
    // Paginate rather than letting content run off the bottom. The original
    // failure mode for long AI prose was silent truncation at the page edge.
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(17, 24, 39)
  doc.text('Hypernova Inc', MARGIN, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(107, 114, 128)
  doc.text('Project estimate', MARGIN, y)
  y += 10

  if (data.isPreliminary) {
    // The same honesty requirement as the on-screen banner (HN-06): a printed
    // document outlives the session and is the version that gets forwarded.
    doc.setFillColor(254, 243, 199)
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 12, 'F')
    doc.setTextColor(146, 64, 14)
    doc.setFontSize(10)
    doc.text('Preliminary estimate - detailed analysis not yet complete', MARGIN + 3, y + 3)
    y += 16
  }

  const rows: [string, string][] = [
    ['Estimated cost', data.cost],
    ['Estimated timeline', data.timeline],
    ['Estimated hours', data.hours],
    ['Team', data.team],
    ['Infrastructure', data.infrastructure],
  ]

  doc.setFontSize(11)
  for (const [label, value] of rows) {
    ensureRoom(10)
    doc.setTextColor(107, 114, 128)
    doc.setFont('helvetica', 'normal')
    doc.text(label, MARGIN, y)

    doc.setTextColor(17, 24, 39)
    doc.setFont('helvetica', 'bold')
    const valueLines = doc.splitTextToSize(value || 'To be confirmed', CONTENT_WIDTH / 2)
    doc.text(valueLines, MARGIN + CONTENT_WIDTH / 2, y)

    y += Math.max(7, valueLines.length * 5.5)
    doc.setDrawColor(229, 231, 235)
    doc.line(MARGIN, y - 3, PAGE_WIDTH - MARGIN, y - 3)
  }

  y += 6

  const paragraph = (heading: string, body?: string | null) => {
    if (!body || !body.trim()) return
    ensureRoom(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text(heading, MARGIN, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(55, 65, 81)
    for (const line of doc.splitTextToSize(body.trim(), CONTENT_WIDTH)) {
      ensureRoom(6)
      doc.text(line, MARGIN, y)
      y += 5
    }
    y += 6
  }

  paragraph('Scope', data.scope)

  if (data.phases?.length) {
    ensureRoom(24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text('Timeline', MARGIN, y)
    y += 7

    const totalDays = data.phases.reduce((sum, phase) => sum + Math.max(1, phase.days), 0) || 1
    const barWidth = CONTENT_WIDTH - 55
    let offsetDays = 0

    doc.setFontSize(9)
    data.phases.forEach((phase, index) => {
      ensureRoom(9)
      const days = Math.max(1, phase.days)
      const [r, g, b] = PHASE_COLOURS[index % PHASE_COLOURS.length]

      doc.setTextColor(55, 65, 81)
      doc.setFont('helvetica', 'normal')
      doc.text(doc.splitTextToSize(phase.label, 48)[0], MARGIN, y + 3)

      // A Gantt bar is just a rectangle offset by the days before it. No
      // charting library required.
      doc.setFillColor(r, g, b)
      doc.rect(MARGIN + 52 + (offsetDays / totalDays) * barWidth, y, (days / totalDays) * barWidth, 4, 'F')

      offsetDays += days
      y += 8
    })
    y += 4
  }

  paragraph('Key risks', data.risks)

  ensureRoom(18)
  doc.setDrawColor(229, 231, 235)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 6
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text('These figures are an initial estimate, not a quote. Reference: ' + data.id, MARGIN, y)
}

/** Filename used for the download. Short id keeps it readable. */
export function buildPdfFilename(id: string): string {
  return `hypernova-estimate-${id.slice(0, 8)}.pdf`
}
