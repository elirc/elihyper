import * as React from 'react'

type Phase = {
  label: string
  days: number
  start: Date
  end: Date
  color: string
}

export interface GanttChartProps {
  aiTimelineText?: string
  phasesJson?: string // JSON string: { totalDays: number, phases: {label, days}[] }
  className?: string
  style?: React.CSSProperties
}

function parseDurationToDays(input: string): number | null {
  const m = input.match(/(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years)/i)
  if (!m) return null
  const n = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (unit.startsWith('day')) return Math.max(1, Math.round(n))
  if (unit.startsWith('week')) return Math.max(1, Math.round(n * 7))
  if (unit.startsWith('month')) return Math.max(1, Math.round(n * 30))
  if (unit.startsWith('year')) return Math.max(1, Math.round(n * 365))
  return null
}

function parsePhasesFromText(text: string): Phase[] {
  // Default phases for common project types
  const defaultPhases = [
    { label: 'Planning & Discovery', days: 14, color: '#3b82f6' },
    { label: 'Design & Architecture', days: 21, color: '#8b5cf6' },
    { label: 'Development', days: 60, color: '#10b981' },
    { label: 'Testing & QA', days: 14, color: '#f59e0b' },
    { label: 'Deployment & Launch', days: 7, color: '#ef4444' },
  ]

  // Try to parse duration from text
  const totalDays = parseDurationToDays(text)

  if (totalDays) {
    // Scale default phases to fit the total duration
    const totalDefaultDays = defaultPhases.reduce((sum, p) => sum + p.days, 0)
    const scale = totalDays / totalDefaultDays

    const start = new Date()
    let cursor = new Date(start)

    return defaultPhases.map((phase) => {
      const scaledDays = Math.max(1, Math.round(phase.days * scale))
      const s = new Date(cursor)
      const e = new Date(cursor.getTime() + scaledDays * 86400000)
      cursor = new Date(e)

      return {
        label: phase.label,
        days: scaledDays,
        start: s,
        end: e,
        color: phase.color,
      }
    })
  }

  // Fallback to default timeline
  const start = new Date()
  let cursor = new Date(start)

  return defaultPhases.map((phase) => {
    const s = new Date(cursor)
    const e = new Date(cursor.getTime() + phase.days * 86400000)
    cursor = new Date(e)

    return {
      label: phase.label,
      days: phase.days,
      start: s,
      end: e,
      color: phase.color,
    }
  })
}

function parsePhasesFromJson(jsonStr?: string): Phase[] | null {
  if (!jsonStr) return null
  try {
    const parsed = JSON.parse(jsonStr)
    const items: { label: string; days: number }[] = parsed?.phases || []
    if (!Array.isArray(items) || items.length === 0) return null
    const colors: Record<string, string> = {
      'Planning & Discovery': '#3b82f6',
      'Design & Architecture': '#8b5cf6',
      Development: '#10b981',
      'Testing & QA': '#f59e0b',
      'Deployment & Launch': '#ef4444',
    }
    const start = new Date()
    let cursor = new Date(start)
    return items.map((p) => {
      const s = new Date(cursor)
      const e = new Date(cursor.getTime() + Math.max(1, Math.round(p.days)) * 86400000)
      cursor = new Date(e)
      return {
        label: p.label,
        days: Math.max(1, Math.round(p.days)),
        start: s,
        end: e,
        color: colors[p.label] || '#6366f1',
      }
    })
  } catch {
    return null
  }
}

export default function GanttChart({ aiTimelineText, phasesJson, className, style }: GanttChartProps) {
  const [labelWidth, setLabelWidth] = React.useState(200)

  React.useEffect(() => {
    const updateWidth = () => {
      setLabelWidth(window.innerWidth < 768 ? 140 : 200)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const phases = React.useMemo(() => {
    const fromJson = parsePhasesFromJson(phasesJson)
    if (fromJson && fromJson.length) return fromJson
    return parsePhasesFromText(aiTimelineText || '')
  }, [aiTimelineText, phasesJson])

  const timelineStart = phases[0]?.start || new Date()
  const timelineEnd = phases[phases.length - 1]?.end || new Date()
  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / 86400000)
  const dayWidth = Math.max(3, Math.min(8, 600 / totalDays)) // More compact responsive day width

  if (!phases || phases.length === 0) return null

  return (
    <div
      className={className}
      style={{
        maxWidth: '100%',
        overflowX: 'auto',
        padding: '12px',
        backgroundColor: '#0D0D0D',
        borderRadius: 8,
        border: '1px solid #374151',
        ...style,
      }}>
      <h3 style={{ color: '#f9fafb', marginBottom: 12, fontSize: 16 }}>Project Timeline ({totalDays} days)</h3>

      {/* Timeline header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${labelWidth}px 1fr`,
          gap: '12px',
          marginBottom: 8,
          fontSize: 11,
          color: '#9ca3af',
        }}>
        <div style={{ fontWeight: 'bold' }}>Phase</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{timelineStart.toLocaleDateString()}</span>
          <span>{timelineEnd.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Phase bars */}
      {phases.map((phase, idx) => {
        const startOffset = Math.floor((phase.start.getTime() - timelineStart.getTime()) / 86400000)
        const width = Math.max(dayWidth, phase.days * dayWidth)
        const left = startOffset * dayWidth

        return (
          <div
            key={idx}
            style={{
              display: 'grid',
              gridTemplateColumns: `${labelWidth}px 1fr`,
              gap: '12px',
              alignItems: 'start',
              marginBottom: 10,
            }}>
            <div
              style={{
                width: `${labelWidth}px`,
                maxWidth: `${labelWidth}px`,
                minWidth: `${labelWidth}px`,
                fontSize: 13,
                color: '#f3f4f6',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                flexShrink: 0,
                lineHeight: '1.4',
              }}>
              {phase.label}
            </div>
            <div
              style={{
                position: 'relative',
                minHeight: 28,
                backgroundColor: '#374151',
                borderRadius: 4,
                minWidth: totalDays * dayWidth,
                display: 'flex',
                alignItems: 'center',
              }}>
              <div
                style={{
                  position: 'absolute',
                  left: `${left}px`,
                  width: `${width}px`,
                  height: 28,
                  backgroundColor: phase.color,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  color: 'white',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  top: 0,
                }}
                title={`${phase.days} days: ${phase.start.toLocaleDateString()} - ${phase.end.toLocaleDateString()}`}>
                {phase.days}d
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
