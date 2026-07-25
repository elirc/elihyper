import { drawEstimatePdf, buildPdfFilename, type PdfDoc, type EstimatePdfData } from '../lib/estimatePdf'

/**
 * A recording stand-in for jsPDF.
 *
 * Testing a PDF by inspecting the binary is miserable and brittle. Because
 * drawEstimatePdf is written against a small interface rather than jsPDF
 * itself, the test can assert what was drawn -- which is the part that has
 * bugs -- without producing a file.
 */
function createFakeDoc() {
  const calls: { text: string[]; rects: number[][]; pages: number } = { text: [], rects: [], pages: 1 }

  const doc: PdfDoc = {
    setFont: () => {},
    setFontSize: () => {},
    setTextColor: () => {},
    setFillColor: () => {},
    setDrawColor: () => {},
    text: (value) => {
      calls.text.push(...(Array.isArray(value) ? value : [value]))
    },
    rect: (x, y, w, h) => {
      calls.rects.push([x, y, w, h])
    },
    line: () => {},
    // Roughly 2mm per character at the sizes used; good enough to exercise
    // the wrapping and pagination paths.
    splitTextToSize: (text, maxWidth) => {
      const perLine = Math.max(1, Math.floor(maxWidth / 2))
      const out: string[] = []
      for (let i = 0; i < text.length; i += perLine) out.push(text.slice(i, i + perLine))
      return out.length ? out : ['']
    },
    addPage: () => {
      calls.pages += 1
    },
    save: () => {},
  }

  return { doc, calls }
}

const data: EstimatePdfData = {
  id: 'abc123def456ghi',
  cost: '$180,000 - $240,000',
  timeline: '4-6 months',
  hours: '2,400-3,200',
  team: '2 senior, 1 designer',
  infrastructure: 'AWS ECS with Fargate',
  scope: 'Internal dashboard for 40 staff',
  risks: 'Legacy billing integration is the main unknown.',
  phases: [
    { label: 'Planning & Discovery', days: 20 },
    { label: 'Development', days: 100 },
    { label: 'Testing & QA', days: 30 },
  ],
}

describe('drawEstimatePdf', () => {
  it('includes every headline figure', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, data)
    const all = calls.text.join(' ')

    for (const value of ['Hypernova Inc', '$180,000 - $240,000', '4-6 months', '2,400-3,200', 'AWS ECS']) {
      expect(all).toContain(value)
    }
  })

  it('states that the figures are an estimate, not a quote', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, data)

    expect(calls.text.join(' ')).toContain('not a quote')
  })

  it('includes the estimate id so a lead can be traced back', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, data)

    expect(calls.text.join(' ')).toContain(data.id)
  })

  // The same honesty requirement as HN-06's on-screen banner. A PDF outlives
  // the session and is the copy that gets forwarded to a budget holder.
  it('marks a preliminary estimate as preliminary', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, { ...data, isPreliminary: true })

    expect(calls.text.join(' ')).toContain('Preliminary estimate')
  })

  it('does not claim to be preliminary when the analysis completed', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, data)

    expect(calls.text.join(' ')).not.toContain('Preliminary estimate')
  })

  it('draws one bar per phase, widths proportional to duration', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, data)

    // Three phase bars; the 100-day phase must be the widest.
    const widths = calls.rects.map(([, , w]) => w)
    expect(calls.rects.length).toBeGreaterThanOrEqual(3)
    expect(Math.max(...widths)).toBeGreaterThan(widths.filter((w) => w !== Math.max(...widths))[0])
  })

  it('paginates long prose instead of running off the page', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, { ...data, scope: 'x'.repeat(6000), risks: 'y'.repeat(6000) })

    expect(calls.pages).toBeGreaterThan(1)
  })

  it('renders without phases or risks', () => {
    const { doc, calls } = createFakeDoc()

    expect(() => drawEstimatePdf(doc, { ...data, phases: undefined, risks: null })).not.toThrow()
    expect(calls.text.join(' ')).toContain('$180,000 - $240,000')
  })

  it('shows a placeholder for a missing figure rather than an empty row', () => {
    const { doc, calls } = createFakeDoc()
    drawEstimatePdf(doc, { ...data, team: '' })

    expect(calls.text.join(' ')).toContain('To be confirmed')
  })
})

describe('buildPdfFilename', () => {
  it('shortens the id so the filename stays readable', () => {
    expect(buildPdfFilename('abc123def456ghi')).toBe('hypernova-estimate-abc123de.pdf')
  })
})
