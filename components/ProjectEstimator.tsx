import React, { useState, useCallback, useMemo, useRef, useEffect, forwardRef } from 'react'
import { PlasmicProjectEstimator, DefaultProjectEstimatorProps } from './plasmic/hypernova_inc/PlasmicProjectEstimator'
import { HTMLElementRefOf } from '@plasmicapp/react-web'
import { client } from '../src/utils/api-client'
import { createProject, createLead } from '../src/graphql/mutations'
import { getProject } from '../src/graphql/queries'
import { onUpdateProject } from '../src/graphql/subscriptions'
import GanttChart from './GanttChart'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { env } from '../src/utils/env'

const TOAST_OPTIONS = {
  position: 'bottom-right' as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark' as const,
}

interface TeamEstimate {
  hours: string
  cost: string
}

interface RoleRates {
  seniorDev: { min: number; max: number }
  midDev: { min: number; max: number }
  designer: { min: number; max: number }
}

interface ProjectData {
  id?: string
  teamSize?: string | null
  AI_teamSize?: string | null
  AI_estimatedCost?: string | null
  AI_estimatedTimeline?: string | null
  timeline?: string | null
  scope?: string | null
  infrastructure?: string | null
  AI_improvedScope?: string | null
  AI_costAnalysis?: string | null
  AI_summary?: string | null
  AI_timelineValidation?: string | null
  AI_timeline?: string | null
  AI_infrastructure?: string | null
  AI_infrastructureRecommendations?: string | null
  AI_riskAssessment?: string | null
}

interface GraphQLResponse {
  data?: {
    getProject?: ProjectData
  }
}

interface SubscriptionMessage {
  data?: {
    onUpdateProject?: ProjectData
  }
}

interface FormEvent {
  target: {
    value: string
  }
}

interface FormState {
  scope: string
  timeline: string
  selectedTeam: string
  infrastructure: string
  firstName: string
  lastName: string
  emailAddress: string
  phoneNumber: string
  message: string
}

const createInitialFormState = (): FormState => ({
  scope: '',
  timeline: '',
  selectedTeam: '',
  infrastructure: '',
  firstName: '',
  lastName: '',
  emailAddress: '',
  phoneNumber: '',
  message: '',
})

export interface ProjectEstimatorProps extends DefaultProjectEstimatorProps {}

function ProjectEstimator_(props: ProjectEstimatorProps, ref: HTMLElementRefOf<'div'>) {
  type StepType = 'start' | 'scope' | 'timeline' | 'team' | 'infrastructure' | 'loading' | 'summary'

  // Form state management
  const [step, setStep] = useState<StepType>('start')
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState())

  // State for AI-generated estimates
  const [aiEstimate, setAiEstimate] = useState<string | null>(null)
  const [aiTimeline, setAiTimeline] = useState<string | null>(null)
  const [aiPhasesJson, setAiPhasesJson] = useState<string | null>(null)
  const [aiTeamSize, setAiTeamSize] = useState<string | null>(null)
  const [aiImprovedScope, setAiImprovedScope] = useState<string | null>(null)
  const [aiCostAnalysis, setAiCostAnalysis] = useState<string | null>(null)
  const [aiTimelineValidationRaw, setAiTimelineValidationRaw] = useState<string | null>(null)
  const [aiInfrastructure, setAiInfrastructure] = useState<string | null>(null)
  const [aiInfrastructureRecommendations, setAiInfrastructureRecommendations] = useState<string | null>(null)
  const [aiRiskAssessment, setAiRiskAssessment] = useState<string | null>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const [lastProjectId, setLastProjectId] = useState<string | null>(null)
  const contactFormTrackedFields = useRef<Set<string>>(new Set())
  const [autoSelections, setAutoSelections] = useState({
    timeline: false,
    team: false,
    infrastructure: false,
  })

  const extractPhasesJsonFromText = useCallback((text?: string | null) => {
    if (!text) return null
    const marker = 'PHASES_JSON:'
    const idx = text.indexOf(marker)
    if (idx === -1) return null
    const start = text.indexOf('{', idx)
    if (start === -1) return null
    // Find matching closing brace for the JSON object
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
          } catch {}
          return null
        }
      }
    }
    return null
  }, [])

  const removePhasesJsonFromText = useCallback((text?: string | null) => {
    if (!text) return text || null
    const marker = 'PHASES_JSON:'
    let result = text
    while (true) {
      const idx = result.indexOf(marker)
      if (idx === -1) break
      const start = result.indexOf('{', idx)
      if (start === -1) {
        result = result.slice(0, idx).trim()
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
      if (end !== -1) {
        result = (result.slice(0, idx).trimEnd() + ' ' + result.slice(end + 1)).trim()
      } else {
        result = result.slice(0, idx).trim()
        break
      }
    }
    return result.trim()
  }, [])

  // Dynamic default estimate calculator (realistic baseline before AI)
  const ROLE_RATES = useMemo(
    () => ({
      seniorDev: { min: 150, max: 200 },
      midDev: { min: 100, max: 150 },
      designer: { min: 100, max: 150 },
    }),
    []
  )

  const parseTimelineToMonths = useCallback((timeline: string): number => {
    if (!timeline) return 12
    const nums = (timeline.match(/\d+/g) || []).map((n) => parseInt(n, 10))
    const hasYear = /year/i.test(timeline)
    const hasMonth = /month/i.test(timeline)
    const hasWeek = /week/i.test(timeline)
    const hasDay = /day/i.test(timeline)
    if (nums.length === 0) return hasYear ? 12 : 12
    const n = nums.length === 1 ? nums[0] : Math.round((nums[0] + nums[1]) / 2)
    if (hasYear) return n * 12
    if (hasMonth) return n
    if (hasWeek) return n / 4
    if (hasDay) return n / 30
    return n // fallback assume months
  }, [])

  const extractTeamSummary = useCallback((analysis?: string | null) => {
    if (!analysis) return null
    const match = analysis.match(/Development\s+Team\s*:\s*([^\n]+)/i) || analysis.match(/Team\s+Size\s*:\s*([^\n]+)/i)
    if (match?.[1]) {
      return match[1].replace(/^[\-\u2022]+\s*/, '').trim()
    }
    return null
  }, [])

  const extractTeamCompositionDetails = useCallback((analysis?: string | null) => {
    if (!analysis) return null
    const lines = analysis
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    for (const line of lines) {
      if (!/(developer|designer|engineer|pm|devops)/i.test(line)) continue
      // Skip lines that are about cost (contain dollar signs)
      if (/\$/.test(line)) continue
      const paren = line.match(/\(([^)]+)\)/)
      if (paren?.[1]) {
        return paren[1].trim()
      }
      const afterColon = line.split(':').slice(1).join(':').trim()
      if (afterColon) {
        return afterColon.replace(/^[\-\u2022]+\s*/, '')
      }
    }
    return null
  }, [])

  const extractInfrastructureSummary = useCallback((text?: string | null) => {
    if (!text) return null
    const lines = text
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022]+\s*/, '').trim())
      .filter(Boolean)
    if (!lines.length) return null
    const [first] = lines
    const match = first.match(/(?:recommend(?:ed)?|infrastructure)\s*:?\s*(.+)/i)
    return match?.[1]?.trim() || first
  }, [])

  const extractCostSummary = useCallback((analysis?: string | null) => {
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
    const firstDollarLine = lines.find((line) => /\$\d/.test(line))
    return firstDollarLine || null
  }, [])

  const extractTimelineSummary = useCallback((text?: string | null) => {
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
  }, [])

  const getTimelineRangeInMonths = useCallback((text?: string | null) => {
    if (!text) return null
    const normalized = text.replace(/–|—|to/gi, '-')
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*(day|week|month|year)/i)
    if (!match) return null
    const start = parseFloat(match[1])
    const end = match[2] ? parseFloat(match[2]) : start
    if (Number.isNaN(start) || Number.isNaN(end)) return null
    const unit = match[3].toLowerCase()
    const convert = (value: number) => {
      switch (unit) {
        case 'year':
          return value * 12
        case 'month':
          return value
        case 'week':
          return value / 4
        case 'day':
          return value / 30
        default:
          return value
      }
    }
    const minMonths = convert(Math.min(start, end))
    const maxMonths = convert(Math.max(start, end))
    if (minMonths <= 0 || maxMonths <= 0) return null
    return { min: minMonths, max: maxMonths }
  }, [])

  const formatMonthsRange = useCallback((range?: { min: number; max: number } | null) => {
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
      const days = Math.max(1, Math.round(months * 30))
      return `${days} days`
    }
    const diff = Math.abs(range.max - range.min)
    if (diff < 0.25) {
      return formatSingle(range.max)
    }
    return `${formatSingle(range.min)} - ${formatSingle(range.max)}`
  }, [])

  const getTeamComposition = useCallback((teamKey: string): Record<string, number> | null => {
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
  }, [])

  const computeDefaultEstimate = useCallback(
    (teamKey: string, timeline: string): TeamEstimate => {
      const roles = getTeamComposition(teamKey)
      if (!roles) return { hours: 'TBD', cost: 'Calculating...' }
      const months = parseTimelineToMonths(timeline || '12 months')
      const hoursPerPersonPerMonth = 160

      let minCost = 0
      let maxCost = 0
      let totalHours = 0
      Object.entries(roles).forEach(([role, count]) => {
        const c = count as number
        const roleHours = c * months * hoursPerPersonPerMonth
        totalHours += roleHours
        const rates = ROLE_RATES[role as keyof RoleRates]
        minCost += roleHours * rates.min
        maxCost += roleHours * rates.max
      })

      // Present hours as a range (+/- 15%)
      const lowHours = Math.round(totalHours * 0.85)
      const highHours = Math.round(totalHours * 1.15)

      const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      const cost = `${fmt(Math.round(minCost))} - ${fmt(Math.round(maxCost))}`

      return { hours: `${lowHours}-${highHours}`, cost }
    },
    [ROLE_RATES, getTeamComposition, parseTimelineToMonths]
  )

  // Unified estimate: align hours with timeline (AI if present) and cost with AI when available
  const currentEstimate = useMemo(() => {
    const monthsForHours = parseTimelineToMonths(aiTimeline || formState.timeline)
    const roles = getTeamComposition(formState.selectedTeam)
    const hoursPerPersonPerMonth = 160
    let totalHours = 0
    if (roles) {
      Object.entries(roles).forEach(([, count]) => {
        totalHours += (count as number) * monthsForHours * hoursPerPersonPerMonth
      })
    }
    const hoursRange = totalHours ? `${Math.round(totalHours * 0.85)}-${Math.round(totalHours * 1.15)}` : 'TBD'

    if (aiEstimate) {
      return { hours: hoursRange, cost: aiEstimate }
    }
    const baseline = computeDefaultEstimate(formState.selectedTeam, formState.timeline)
    return { hours: hoursRange, cost: baseline.cost }
  }, [
    formState.selectedTeam,
    formState.timeline,
    aiEstimate,
    aiTimeline,
    computeDefaultEstimate,
    getTeamComposition,
    parseTimelineToMonths,
  ])

  // State update handler
  const updateFormField = useCallback((field: keyof FormState, value: string) => {
    console.log('DEBUG: Updating form field:', { field, value })
    setAutoSelections((prev) => {
      if (field === 'timeline' && prev.timeline) {
        return { ...prev, timeline: false }
      }
      if (field === 'selectedTeam' && prev.team) {
        return { ...prev, team: false }
      }
      if (field === 'infrastructure' && prev.infrastructure) {
        return { ...prev, infrastructure: false }
      }
      return prev
    })
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  const handleRecommendationToggle = useCallback((key: 'timeline' | 'team' | 'infrastructure', value: boolean) => {
    setAutoSelections((prev) => {
      if (prev[key] === value) return prev
      return { ...prev, [key]: value }
    })

    if (value) {
      if (key === 'timeline') {
        setFormState((prev) => ({ ...prev, timeline: '' }))
      } else if (key === 'team') {
        setFormState((prev) => ({ ...prev, selectedTeam: '' }))
      } else if (key === 'infrastructure') {
        setFormState((prev) => ({ ...prev, infrastructure: '' }))
      }
    }
  }, [])

  const handleProjectSubmit = useCallback(async () => {
    if (step !== 'infrastructure') {
      console.log('DEBUG: Not on infrastructure step yet')
      return
    }

    // Flag to track if AI data has been received
    let aiDataReceived = false

    try {
      console.log('DEBUG: Submitting project data:', formState)
      // Basic validation to avoid empty strings hitting DynamoDB
      const hasTimeline = autoSelections.timeline || !!formState.timeline.trim()
      const hasTeam = autoSelections.team || !!formState.selectedTeam
      const hasInfrastructure = autoSelections.infrastructure || !!formState.infrastructure

      if (!formState.scope || !hasTimeline || !hasTeam || !hasInfrastructure) {
        alert('Please complete all steps before submitting the project.')
        return
      }

      const timelineValue = autoSelections.timeline ? 'Recommend for me' : formState.timeline
      const teamValue = autoSelections.team ? 'Recommend for me' : formState.selectedTeam
      const infrastructureValue = autoSelections.infrastructure ? 'Recommend for me' : formState.infrastructure
      const summaryTeam = autoSelections.team ? 'a recommended team' : formState.selectedTeam || 'TBD'
      const summaryInfrastructure = autoSelections.infrastructure
        ? 'recommended infrastructure'
        : formState.infrastructure || 'TBD'

      const initialProjectData = {
        scope: formState.scope,
        timeline: timelineValue,
        teamSize: teamValue,
        infrastructure: infrastructureValue,
        cost: currentEstimate.cost,
        summary: `Project for ${summaryTeam} with ${summaryInfrastructure}`,
      } as const

      // Remove empty string fields to keep AppSync/Dynamo happy
      const projectData = Object.fromEntries(Object.entries(initialProjectData).filter(([, v]) => v !== ''))

      const result = await client
        .graphql({
          query: createProject,
          variables: { input: projectData },
        })
        .catch((error) => {
          if (error.message?.includes('Unauthorized') || error.statusCode === 401) {
            throw new Error('Authentication failed. Please try again or contact support.')
          }
          throw error
        })

      const projectId = result.data.createProject.id
      console.log('Project created successfully with ID:', projectId)
      setLastProjectId(projectId)

      // Show loading screen while AI processes the project
      setStep('loading')

      // Subscribe for real-time AI updates for this project
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
        }
        const sub = client.graphql({ query: onUpdateProject }).subscribe({
          next: ({ data }: SubscriptionMessage) => {
            const updated = data?.onUpdateProject
            if (!updated || updated.id !== projectId) return
            console.log('DEBUG: Subscription update (matched id):', updated)
            if (updated.AI_estimatedCost) {
              setAiEstimate(updated.AI_estimatedCost)
            }
            if (updated.AI_estimatedTimeline) {
              setAiTimeline(updated.AI_estimatedTimeline)
            }
            if (updated.teamSize) {
              setAutoSelections((prev) => (prev.team ? { ...prev, team: false } : prev))
              setFormState((prev) => ({ ...prev, selectedTeam: updated.teamSize || '' }))
            }
            if (updated.AI_teamSize) {
              setAiTeamSize(updated.AI_teamSize)
            }
            if (updated.scope) {
              setFormState((prev) => ({ ...prev, scope: updated.scope || '' }))
            }
            if (updated.AI_improvedScope) {
              setAiImprovedScope(updated.AI_improvedScope)
            }
            if (updated.AI_costAnalysis) {
              setAiCostAnalysis(updated.AI_costAnalysis)
            }
            if (updated.AI_infrastructure) {
              setAiInfrastructure(updated.AI_infrastructure)
            }
            if (updated.infrastructure) {
              setAutoSelections((prev) => (prev.infrastructure ? { ...prev, infrastructure: false } : prev))
              setFormState((prev) => ({ ...prev, infrastructure: updated.infrastructure || '' }))
            }
            if (updated.AI_timelineValidation) {
              const pj = extractPhasesJsonFromText(updated.AI_timelineValidation)
              if (pj) setAiPhasesJson(pj)
              setAiTimelineValidationRaw(updated.AI_timelineValidation)
            }
            if (updated.AI_timeline) {
              try {
                // Expect JSON with { totalDays, phases }
                const parsed = JSON.parse(updated.AI_timeline)
                if (parsed && parsed.phases) {
                  setAiPhasesJson(updated.AI_timeline)
                }
              } catch {}
            }
            if (updated.AI_infrastructureRecommendations) {
              setAiInfrastructureRecommendations(updated.AI_infrastructureRecommendations)
            }
            if (updated.AI_riskAssessment) {
              setAiRiskAssessment(updated.AI_riskAssessment)
            }
            // Transition from loading to summary when AI data arrives
            // Check multiple fields since AI_estimatedCost might remain null
            if (updated.AI_costAnalysis || updated.AI_summary || updated.AI_estimatedCost) {
              console.log('DEBUG: AI data received via subscription')
              aiDataReceived = true
              setStep('summary')
            }
          },
          error: (err: Error) => console.error('Subscription error:', err),
        })
        subscriptionRef.current = sub as unknown as { unsubscribe: () => void }

        // Immediate fetch to avoid races where updates land before subscription is ready
        try {
          const immediate = await client.graphql({
            query: getProject,
            variables: { id: projectId },
          })
          const p = (immediate as GraphQLResponse)?.data?.getProject
          if (p?.AI_estimatedCost) setAiEstimate(p.AI_estimatedCost)
          if (p?.AI_estimatedTimeline) setAiTimeline(p.AI_estimatedTimeline)
          if (p?.teamSize) {
            setAutoSelections((prev) => (prev.team ? { ...prev, team: false } : prev))
            setFormState((prev) => ({ ...prev, selectedTeam: p.teamSize || '' }))
          }
          if (p?.AI_teamSize) setAiTeamSize(p.AI_teamSize)
          if (p?.AI_timeline) {
            try {
              const parsed = JSON.parse(p.AI_timeline)
              if (parsed && parsed.phases) setAiPhasesJson(p.AI_timeline)
            } catch {}
          }
          if (p?.AI_timelineValidation) {
            const pj = extractPhasesJsonFromText(p.AI_timelineValidation)
            if (pj) setAiPhasesJson(pj)
            setAiTimelineValidationRaw(p.AI_timelineValidation)
          }
          if (p?.scope) setFormState((prev) => ({ ...prev, scope: p.scope || '' }))
          if (p?.AI_improvedScope) setAiImprovedScope(p.AI_improvedScope)
          if (p?.AI_costAnalysis) setAiCostAnalysis(p.AI_costAnalysis)
          if (p?.AI_infrastructure) setAiInfrastructure(p.AI_infrastructure)
          if (p?.infrastructure) {
            setAutoSelections((prev) => (prev.infrastructure ? { ...prev, infrastructure: false } : prev))
            setFormState((prev) => ({ ...prev, infrastructure: p.infrastructure || '' }))
          }
          if (p?.AI_infrastructureRecommendations)
            setAiInfrastructureRecommendations(p.AI_infrastructureRecommendations)
          if (p?.AI_riskAssessment) setAiRiskAssessment(p.AI_riskAssessment)
          // Transition from loading to summary if AI data is already available
          // Check multiple fields since AI_estimatedCost might remain null
          if (p?.AI_costAnalysis || p?.AI_summary || p?.AI_estimatedCost) {
            console.log('DEBUG: AI data already available on immediate fetch')
            aiDataReceived = true
            setStep('summary')
          }
        } catch {}
      } catch (subErr) {
        console.error('Failed to start subscription:', subErr)
      }

      // Fallback polling - only used if subscription fails to deliver
      const pollForSummary = async (attempts = 0) => {
        // Stop polling if AI data has already been received
        if (aiDataReceived) {
          console.log('DEBUG: Polling stopped - AI data already received')
          return
        }

        if (attempts >= 6) {
          console.log('DEBUG: Max fallback polling attempts reached. Showing summary with available data.')
          setStep('summary')
          return
        }

        try {
          console.log('DEBUG: Fetching project details, attempt', attempts + 1)
          const updatedProject = await client.graphql({
            query: getProject,
            variables: { id: projectId },
          })

          const project = updatedProject.data.getProject
          console.log('DEBUG: Project data:', {
            id: project?.id,
            AI_summary: project?.AI_summary,
            AI_estimatedCost: project?.AI_estimatedCost,
            AI_estimatedTimeline: project?.AI_estimatedTimeline,
            scope: project?.scope,
            timeline: project?.timeline,
            teamSize: project?.teamSize,
            AI_teamSize: project?.AI_teamSize,
            AI_timeline: project?.AI_timeline,
            AI_improvedScope: project?.AI_improvedScope,
            AI_costAnalysis: project?.AI_costAnalysis,
            AI_timelineValidation: project?.AI_timelineValidation,
            AI_infrastructure: project?.AI_infrastructure,
            AI_infrastructureRecommendations: project?.AI_infrastructureRecommendations,
            AI_riskAssessment: project?.AI_riskAssessment,
          })

          // Check multiple fields since AI_estimatedCost might remain null
          if (project?.AI_costAnalysis || project?.AI_summary || project?.AI_estimatedCost) {
            console.log('DEBUG: Using AI-generated estimate:', project.AI_estimatedCost || 'N/A')
            console.log('DEBUG: All AI analysis fields:', {
              AI_improvedScope: project?.AI_improvedScope,
              AI_costAnalysis: project?.AI_costAnalysis,
              AI_timelineValidation: project?.AI_timelineValidation,
              AI_infrastructureRecommendations: project?.AI_infrastructureRecommendations,
              AI_riskAssessment: project?.AI_riskAssessment,
            })
            setAiEstimate(project.AI_estimatedCost || null)
            if (project?.AI_estimatedTimeline) {
              setAiTimeline(project.AI_estimatedTimeline)
            }
            if (project?.teamSize) {
              setAutoSelections((prev) => (prev.team ? { ...prev, team: false } : prev))
              setFormState((prev) => ({ ...prev, selectedTeam: project.teamSize || '' }))
            }
            if (project?.AI_teamSize) {
              setAiTeamSize(project.AI_teamSize)
            }
            if (project?.scope) {
              setFormState((prev) => ({ ...prev, scope: project.scope || '' }))
            }
            if (project?.AI_improvedScope) {
              setAiImprovedScope(project.AI_improvedScope)
            }
            if (project?.AI_costAnalysis) {
              setAiCostAnalysis(project.AI_costAnalysis)
            }
            if (project?.AI_infrastructure) {
              setAiInfrastructure(project.AI_infrastructure)
            }
            if (project?.infrastructure) {
              setAutoSelections((prev) => (prev.infrastructure ? { ...prev, infrastructure: false } : prev))
              setFormState((prev) => ({ ...prev, infrastructure: project.infrastructure || '' }))
            }
            if (project?.AI_timelineValidation) {
              const pj = extractPhasesJsonFromText(project.AI_timelineValidation)
              if (pj) setAiPhasesJson(pj)
              setAiTimelineValidationRaw(project.AI_timelineValidation)
            }
            if (project?.AI_timeline) {
              try {
                const parsed = JSON.parse(project.AI_timeline)
                if (parsed && parsed.phases) {
                  setAiPhasesJson(project.AI_timeline)
                }
              } catch {}
            }
            if (project?.AI_infrastructureRecommendations) {
              setAiInfrastructureRecommendations(project.AI_infrastructureRecommendations)
            }
            if (project?.AI_riskAssessment) {
              setAiRiskAssessment(project.AI_riskAssessment)
            }
            console.log('DEBUG: AI data received via polling')
            aiDataReceived = true
            setStep('summary')
            return
          } else {
            console.log('DEBUG: AI data not ready yet (fallback polling), attempt:', attempts + 1)
            // Only schedule next poll if data hasn't been received
            if (!aiDataReceived) {
              setTimeout(
                () => pollForSummary(attempts + 1),
                5000 // 5 second intervals for fallback polling
              )
            }
          }
        } catch (error) {
          console.error('Error in fallback polling:', error)
          // Only schedule next poll if data hasn't been received
          if (!aiDataReceived) {
            setTimeout(
              () => pollForSummary(attempts + 1),
              5000 // 5 second intervals for fallback polling
            )
          }
        }
      }

      // Start polling only after 15 seconds if subscription hasn't delivered
      // This gives the subscription time to work (it's the preferred method)
      setTimeout(() => {
        if (!aiDataReceived) {
          console.log("DEBUG: Subscription hasn't delivered after 15s - starting fallback polling")
          pollForSummary()
        } else {
          console.log('DEBUG: No polling needed - subscription already delivered data')
        }
      }, 15000)
    } catch (e: any) {
      console.error('Error creating project:', e)
      alert(e.message || 'An error occurred while creating the project.')
    }
  }, [formState, step, currentEstimate.cost, autoSelections])

  const handleNext = useCallback(() => {
    console.log('DEBUG: Next clicked on step:', step)
    switch (step) {
      case 'start':
        setStep('scope')
        break
      case 'scope':
        if (!formState.scope.trim()) {
          alert('Please describe your scope to continue.')
          return
        }
        setStep('timeline')
        break
      case 'timeline':
        if (!autoSelections.timeline && !formState.timeline.trim()) {
          alert('Please provide a desired timeline to continue.')
          return
        }
        setStep('team')
        break
      case 'team':
        if (!autoSelections.team && !formState.selectedTeam) {
          alert('Please select a team size.')
          return
        }
        setStep('infrastructure')
        break
      case 'infrastructure':
        if (!autoSelections.infrastructure && !formState.infrastructure) {
          alert('Please choose an infrastructure option.')
          return
        }
        handleProjectSubmit()
        break
    }
  }, [step, handleProjectSubmit, autoSelections])

  const handleBack = useCallback(() => {
    console.log('DEBUG: Back clicked on step:', step)
    switch (step) {
      case 'scope':
        setStep('start')
        break
      case 'timeline':
        setStep('scope')
        break
      case 'team':
        setStep('timeline')
        break
      case 'infrastructure':
        setStep('team')
        break
      case 'loading':
        setStep('infrastructure')
        break
      case 'summary':
        setStep('infrastructure')
        break
    }
  }, [step])

  const handleRestart = useCallback(() => {
    console.log('DEBUG: Restarting estimator')
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe()
      } catch (error) {
        console.error('Failed to unsubscribe during restart:', error)
      }
      subscriptionRef.current = null
    }
    setLastProjectId(null)
    setStep('start')
    setFormState(createInitialFormState())
    setAutoSelections({
      timeline: false,
      team: false,
      infrastructure: false,
    })
    setAiEstimate(null)
    setAiTimeline(null)
    setAiPhasesJson(null)
    setAiTeamSize(null)
    setAiImprovedScope(null)
    setAiCostAnalysis(null)
    setAiTimelineValidationRaw(null)
    setAiInfrastructure(null)
    setAiInfrastructureRecommendations(null)
    setAiRiskAssessment(null)
  }, [createInitialFormState])

  const handleStartEstimate = useCallback(() => {
    console.log('DEBUG: Starting estimate')
    window.dataLayer?.push({ event: 'estimator_started', env, app_env: env })
    setStep('scope')
  }, [])

  const handleContactFormBlur = useCallback(
    (fieldName: string, value: string) => {
      if (value.trim() && !contactFormTrackedFields.current.has(fieldName) && lastProjectId) {
        contactFormTrackedFields.current.add(fieldName)
        window.dataLayer?.push({
          event: 'contact_form_input',
          env,
          app_env: env,
          tracking_id: lastProjectId,
        })
      }
    },
    [lastProjectId]
  )

  const handleContactSubmit = useCallback(async () => {
    console.log('DEBUG: Submitting contact information:', {
      firstName: formState.firstName,
      lastName: formState.lastName,
      emailAddress: formState.emailAddress,
      phoneNumber: formState.phoneNumber,
    })

    // Validate required fields
    if (!formState.firstName || !formState.lastName || !formState.emailAddress) {
      toast.error('Please provide your first name, last name, and email address.', TOAST_OPTIONS)
      return
    }

    // Validate email format (must have @ and TLD)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formState.emailAddress)) {
      toast.error('Please enter a valid email address (e.g., name@example.com).', TOAST_OPTIONS)
      return
    }

    try {
      // Track contact form submission attempt
      if (lastProjectId) {
        window.dataLayer?.push({
          event: 'contact_form_submitted',
          env,
          app_env: env,
          tracking_id: lastProjectId,
        })
      }

      // Pull UTM + tracking_id from the same localStorage location `_app.tsx` writes.
      const utmData: {
        tracking_id?: string | null
        utm_source?: string | null
        utm_medium?: string | null
        utm_campaign?: string | null
        utm_content?: string | null
        utm_term?: string | null
      } = (() => {
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem('hypernova_tracking') : null
          return raw ? JSON.parse(raw) : {}
        } catch {
          return {}
        }
      })()

      // Call HubSpot API endpoint
      // Note: next.config.mjs sets `trailingSlash: true`, so use a trailing slash to avoid a redirect.
      const hubspotResponse = await fetch('/api/create-hubspot-lead/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.emailAddress,
          phoneNumber: formState.phoneNumber?.trim() || undefined,
          message: formState.message?.trim() || undefined,
          environment: env,
          // HubSpot custom properties
          estimator_completed: true,
          tracking_id_uuid: utmData.tracking_id || lastProjectId || undefined,
          utm_source: utmData.utm_source || undefined,
          utm_medium: utmData.utm_medium || undefined,
          utm_campaign: utmData.utm_campaign || undefined,
          utm_content: utmData.utm_content || undefined,
          utm_term: utmData.utm_term || undefined,
          // Estimator metadata (safe to pass even if API currently ignores it)
          scope: formState.scope,
        }),
      })

      const hubspotData = await hubspotResponse.json()

      if (!hubspotResponse.ok) {
        throw new Error(hubspotData.details || hubspotData.error || 'Failed to submit to HubSpot')
      }

      // Also create lead in local database (optional - don't fail the submission if this errors)
      try {
        const leadInput: any = {
          firstName: formState.firstName,
          lastName: formState.lastName,
          email: formState.emailAddress,
          phoneNumber: formState.phoneNumber?.trim() || 'unknown',
          description:
            formState.message ||
            `Project Estimator: ${formState.scope.substring(0, 100)}${formState.scope.length > 100 ? '...' : ''}`,
          environment: env,
        }

        await client.graphql({
          query: createLead,
          variables: {
            input: leadInput,
          },
        })
      } catch (dbError) {
        // Log but don't fail if local DB save fails - HubSpot is the primary system
        console.warn('Failed to save lead to local database:', dbError)
        // Log detailed error for debugging
        if (dbError && typeof dbError === 'object') {
          console.warn('DB Error details:', JSON.stringify(dbError, null, 2))
        }
      }

      console.log('Lead created successfully in HubSpot:', hubspotData)
      toast.success("Thank you! We'll be in touch soon.", TOAST_OPTIONS)
    } catch (error: any) {
      console.error('Error creating lead:', error)
      toast.error(
        error.message || 'An error occurred while submitting your information. Please try again.',
        TOAST_OPTIONS
      )
    }
  }, [formState, lastProjectId])

  const formatTeamSize = useCallback((team: string): string => {
    const displayNames: Record<string, string> = {
      '1Developer': '1 Developer',
      '2Developers': '2 Developers',
      '2Developers1Designer': '2 Developers + 1 Designer',
      '4Developers1Designer': '4 Developers + 1 Designer',
    }
    return displayNames[team] || 'TBD'
  }, [])

  const formatInfrastructure = useCallback((infra: string): string => {
    const displayNames: Record<string, string> = {
      staticVm: 'Static Virtual Machine',
      awsEphemeral: 'AWS Ephemeral Infrastructure',
      kubernetes: 'Kubernetes Cluster',
    }
    return displayNames[infra] || 'TBD'
  }, [])

  useEffect(() => {
    console.log('DEBUG: Form state updated:', formState)
  }, [formState])

  // Track form progress with GA4 events
  useEffect(() => {
    switch (step) {
      case 'scope':
        window.dataLayer?.push({
          event: 'estimator_progress',
          env,
          app_env: env,
          step: 1,
          total_steps: 4,
          page_name: 'scope_of_work',
        })
        break
      case 'timeline':
        window.dataLayer?.push({
          event: 'estimator_progress',
          env,
          app_env: env,
          step: 2,
          total_steps: 4,
          page_name: 'timeline',
        })
        break
      case 'team':
        window.dataLayer?.push({
          event: 'estimator_progress',
          env,
          app_env: env,
          step: 3,
          total_steps: 4,
          page_name: 'team_size',
        })
        break
      case 'infrastructure':
        window.dataLayer?.push({
          event: 'estimator_progress',
          env,
          app_env: env,
          step: 4,
          total_steps: 4,
          page_name: 'infrastructure',
        })
        break
      case 'summary':
        window.dataLayer?.push({
          event: 'estimator_completed',
          env,
          app_env: env,
          step: 'complete',
          tracking_id: lastProjectId,
        })
        break
    }
  }, [step, lastProjectId])

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe()
        } catch {}
      }
    }
  }, [])

  // Additional lightweight refresher while on summary until AI estimates arrive
  useEffect(() => {
    if (step !== 'summary' || aiEstimate || !lastProjectId) return
    let attempts = 0
    let timer: any
    const tick = async () => {
      attempts += 1
      try {
        const res = await client.graphql({
          query: getProject,
          variables: { id: lastProjectId },
        })
        const p = (res as GraphQLResponse)?.data?.getProject
        if (p?.AI_estimatedCost) setAiEstimate(p.AI_estimatedCost)
        if (p?.AI_estimatedTimeline) setAiTimeline(p.AI_estimatedTimeline)
        if (p?.teamSize) {
          setAutoSelections((prev) => (prev.team ? { ...prev, team: false } : prev))
          setFormState((prev) => ({ ...prev, selectedTeam: p.teamSize || '' }))
        }
        if (p?.AI_teamSize) setAiTeamSize(p.AI_teamSize)
        if (p?.scope) setFormState((prev) => ({ ...prev, scope: p.scope || '' }))
        if (p?.AI_improvedScope) setAiImprovedScope(p.AI_improvedScope)
        if (p?.AI_costAnalysis) setAiCostAnalysis(p.AI_costAnalysis)
        if (p?.AI_timelineValidation) setAiTimelineValidationRaw(p.AI_timelineValidation)
        const pj = extractPhasesJsonFromText(p?.AI_timelineValidation)
        if (pj) setAiPhasesJson(pj)
        if (p?.AI_timeline) {
          try {
            const parsed = JSON.parse(p.AI_timeline)
            if (parsed && parsed.phases) setAiPhasesJson(p.AI_timeline)
          } catch {}
        }
        if (p?.AI_infrastructure) setAiInfrastructure(p.AI_infrastructure)
        if (p?.infrastructure) {
          setAutoSelections((prev) => (prev.infrastructure ? { ...prev, infrastructure: false } : prev))
          setFormState((prev) => ({ ...prev, infrastructure: p.infrastructure || '' }))
        }
        if (p?.AI_infrastructureRecommendations) setAiInfrastructureRecommendations(p.AI_infrastructureRecommendations)
        if (p?.AI_riskAssessment) setAiRiskAssessment(p.AI_riskAssessment)
      } catch {}
      if (!aiEstimate && attempts < 30 && step === 'summary') {
        timer = setTimeout(tick, 1000)
      }
    }
    timer = setTimeout(tick, 500)
    return () => clearTimeout(timer)
  }, [step, aiEstimate, lastProjectId])

  const cleanedTimelineValidation = useMemo(
    () => (aiTimelineValidationRaw ? removePhasesJsonFromText(aiTimelineValidationRaw) || null : null),
    [aiTimelineValidationRaw, removePhasesJsonFromText]
  )

  const timelineSummaryFromAI = useMemo(
    () => extractTimelineSummary(cleanedTimelineValidation),
    [cleanedTimelineValidation, extractTimelineSummary]
  )

  const timelineInsightFromPhases = useMemo(() => {
    if (!aiPhasesJson) return null
    try {
      const parsed = JSON.parse(aiPhasesJson)
      if (parsed?.totalDays) {
        const totalDays = Number(parsed.totalDays)
        if (Number.isFinite(totalDays) && totalDays > 0) {
          const months = totalDays / 30
          const display = totalDays >= 60 ? `${Math.round(totalDays / 30)} months` : `${totalDays} days`
          return {
            display,
            monthsRange: { min: months, max: months },
          }
        }
      }
    } catch {}
    return null
  }, [aiPhasesJson])

  const displayedCost = useMemo(() => {
    if (aiEstimate?.trim()) return aiEstimate.trim()
    const extracted = extractCostSummary(aiCostAnalysis)
    if (extracted) return extracted
    return currentEstimate.cost
  }, [aiEstimate, extractCostSummary, aiCostAnalysis, currentEstimate.cost])

  const timelineRangeFromSummary = useMemo(
    () => (timelineSummaryFromAI ? getTimelineRangeInMonths(timelineSummaryFromAI) : null),
    [timelineSummaryFromAI, getTimelineRangeInMonths]
  )

  const timelineRangeFromPhases = useMemo(
    () => timelineInsightFromPhases?.monthsRange ?? null,
    [timelineInsightFromPhases]
  )

  const timelineRangeFromAiTimeline = useMemo(
    () => (aiTimeline ? getTimelineRangeInMonths(aiTimeline) : null),
    [aiTimeline, getTimelineRangeInMonths]
  )

  const timelineRangeForHours = timelineRangeFromSummary || timelineRangeFromPhases || timelineRangeFromAiTimeline

  const timelineLabelFromPhases = useMemo(
    () => formatMonthsRange(timelineRangeFromPhases),
    [timelineRangeFromPhases, formatMonthsRange]
  )

  const timelineLabelFromSummaryRange = useMemo(
    () => formatMonthsRange(timelineRangeFromSummary),
    [timelineRangeFromSummary, formatMonthsRange]
  )

  const timelineLabelFromAiTimeline = useMemo(
    () => formatMonthsRange(timelineRangeFromAiTimeline),
    [timelineRangeFromAiTimeline, formatMonthsRange]
  )

  const displayedTimeline = useMemo(() => {
    if (timelineLabelFromPhases) return timelineLabelFromPhases
    if (timelineLabelFromSummaryRange) return timelineLabelFromSummaryRange
    if (timelineLabelFromAiTimeline) return timelineLabelFromAiTimeline
    if (timelineInsightFromPhases) return timelineInsightFromPhases.display
    if (timelineSummaryFromAI) return timelineSummaryFromAI
    if (aiTimeline?.trim()) return aiTimeline.trim()
    if (autoSelections.timeline) return "We'll recommend a timeline for you."
    return formState.timeline || 'TBD'
  }, [
    timelineLabelFromPhases,
    timelineLabelFromSummaryRange,
    timelineLabelFromAiTimeline,
    timelineInsightFromPhases,
    timelineSummaryFromAI,
    aiTimeline,
    autoSelections.timeline,
    formState.timeline,
  ])

  const displayedHours = useMemo(() => {
    if (timelineRangeForHours) {
      const minHours = Math.round(timelineRangeForHours.min * 160)
      const maxHours = Math.round(timelineRangeForHours.max * 160)
      if (minHours > 0 && maxHours > 0) {
        if (Math.abs(maxHours - minHours) >= 50) {
          return `${minHours.toLocaleString()}-${maxHours.toLocaleString()}`
        }
        const avg = Math.round((minHours + maxHours) / 2)
        return `~${avg.toLocaleString()}`
      }
    }
    return currentEstimate.hours
  }, [timelineRangeForHours, currentEstimate.hours])

  const teamDetailsFromAnalysis = useMemo(
    () => extractTeamCompositionDetails(aiCostAnalysis) || extractTeamSummary(aiCostAnalysis),
    [extractTeamCompositionDetails, extractTeamSummary, aiCostAnalysis]
  )

  const displayedTeamSize = useMemo(() => {
    if (aiTeamSize?.trim()) return aiTeamSize.trim()
    if (teamDetailsFromAnalysis) return teamDetailsFromAnalysis
    if (formState.selectedTeam) return formatTeamSize(formState.selectedTeam)
    if (autoSelections.team) return "We'll recommend a team for you."
    return 'TBD'
  }, [aiTeamSize, teamDetailsFromAnalysis, formState.selectedTeam, formatTeamSize, autoSelections.team])

  const displayedInfrastructure = useMemo(() => {
    if (aiInfrastructure?.trim()) return aiInfrastructure.trim()
    const parsed = extractInfrastructureSummary(aiInfrastructureRecommendations)
    if (parsed) return parsed
    if (formState.infrastructure) return formatInfrastructure(formState.infrastructure)
    if (autoSelections.infrastructure) return "We'll recommend the right infrastructure."
    return 'TBD'
  }, [
    aiInfrastructure,
    extractInfrastructureSummary,
    aiInfrastructureRecommendations,
    formState.infrastructure,
    formatInfrastructure,
    autoSelections.infrastructure,
  ])

  const ganttChartContent = useMemo(() => {
    if (step !== 'summary') return null
    if (!aiPhasesJson && !aiTimeline) return null
    return <GanttChart aiTimelineText={aiTimeline || undefined} phasesJson={aiPhasesJson || undefined} />
  }, [step, aiTimeline, aiPhasesJson])

  return (
    <>
      <PlasmicProjectEstimator
        root={{ ref }}
        {...props}
        step={step}
        aiImprovedScope={aiImprovedScope || undefined}
        aiCostAnalysis={aiCostAnalysis || undefined}
        aiTimelineValidation={cleanedTimelineValidation || undefined}
        aiInfrastructureRecommendations={aiInfrastructureRecommendations || undefined}
        aiRiskAssessment={aiRiskAssessment || undefined}
        scopeOfWorkTextInput={{
          props: {
            value: formState.scope,
            onChange: (e: FormEvent) => updateFormField('scope', e.target.value),
          },
        }}
        timelineTextInput={{
          props: {
            value: formState.timeline,
            onChange: (e: FormEvent) => updateFormField('timeline', e.target.value),
            disabled: autoSelections.timeline,
          },
        }}
        checkbox={{
          props: {
            isSelected: autoSelections.timeline,
            onChange: (checked: boolean) => handleRecommendationToggle('timeline', checked),
          },
        }}
        _1Developer={{
          props: {
            selected: formState.selectedTeam === '1Developer',
            onClick: () => {
              if (autoSelections.team) {
                handleRecommendationToggle('team', false)
              }
              updateFormField('selectedTeam', '1Developer')
            },
            'aria-disabled': autoSelections.team || undefined,
          },
        }}
        _2Developers={{
          props: {
            selected: formState.selectedTeam === '2Developers',
            onClick: () => {
              if (autoSelections.team) {
                handleRecommendationToggle('team', false)
              }
              updateFormField('selectedTeam', '2Developers')
            },
            'aria-disabled': autoSelections.team || undefined,
          },
        }}
        _2Developers1Designer={{
          props: {
            selected: formState.selectedTeam === '2Developers1Designer',
            onClick: () => {
              if (autoSelections.team) {
                handleRecommendationToggle('team', false)
              }
              updateFormField('selectedTeam', '2Developers1Designer')
            },
            'aria-disabled': autoSelections.team || undefined,
          },
        }}
        _4Developers1Designer={{
          props: {
            selected: formState.selectedTeam === '4Developers1Designer',
            onClick: () => {
              if (autoSelections.team) {
                handleRecommendationToggle('team', false)
              }
              updateFormField('selectedTeam', '4Developers1Designer')
            },
            'aria-disabled': autoSelections.team || undefined,
          },
        }}
        teamCheckbox={{
          props: {
            isSelected: autoSelections.team,
            onChange: (checked: boolean) => handleRecommendationToggle('team', checked),
          },
        }}
        staticVm={{
          props: {
            selected: formState.infrastructure === 'staticVm',
            onClick: () => {
              if (autoSelections.infrastructure) {
                handleRecommendationToggle('infrastructure', false)
              }
              updateFormField('infrastructure', 'staticVm')
            },
            'aria-disabled': autoSelections.infrastructure || undefined,
          },
        }}
        awsEphemeral={{
          props: {
            selected: formState.infrastructure === 'awsEphemeral',
            onClick: () => {
              if (autoSelections.infrastructure) {
                handleRecommendationToggle('infrastructure', false)
              }
              updateFormField('infrastructure', 'awsEphemeral')
            },
            'aria-disabled': autoSelections.infrastructure || undefined,
          },
        }}
        kubernetes={{
          props: {
            selected: formState.infrastructure === 'kubernetes',
            onClick: () => {
              if (autoSelections.infrastructure) {
                handleRecommendationToggle('infrastructure', false)
              }
              updateFormField('infrastructure', 'kubernetes')
            },
            'aria-disabled': autoSelections.infrastructure || undefined,
          },
        }}
        infrastructureCheckbox={{
          props: {
            isSelected: autoSelections.infrastructure,
            onChange: (checked: boolean) => handleRecommendationToggle('infrastructure', checked),
          },
        }}
        startEstimateButton={{
          props: {
            onClick: handleStartEstimate,
          },
        }}
        nextButton={{
          props: {
            onClick: handleNext,
          },
        }}
        backButton={{
          props: {
            onClick: handleBack,
          },
        }}
        restartButton={{
          props: {
            onClick: handleRestart,
          },
        }}
        getStartedButton={{
          props: {
            onClick: handleContactSubmit,
          },
        }}
        estimatedTimeline={displayedTimeline}
        estimatedHours={displayedHours}
        estimatedTeam={displayedTeamSize}
        estimatedCost={displayedCost}
        estimatedArchitecture={displayedInfrastructure}
        scope={formState.scope || 'TBD'}
        firstName={{
          props: {
            value: formState.firstName,
            onChange: (e: any) => updateFormField('firstName', e.target.value),
            onBlur: (e: any) => handleContactFormBlur('firstName', e.target.value),
          },
        }}
        lastName={{
          props: {
            value: formState.lastName,
            onChange: (e: any) => updateFormField('lastName', e.target.value),
            onBlur: (e: any) => handleContactFormBlur('lastName', e.target.value),
          },
        }}
        emailAddress={{
          props: {
            value: formState.emailAddress,
            onChange: (e: any) => updateFormField('emailAddress', e.target.value),
            onBlur: (e: any) => handleContactFormBlur('emailAddress', e.target.value),
          },
        }}
        phoneNumber={{
          props: {
            value: formState.phoneNumber,
            onChange: (e: any) => updateFormField('phoneNumber', e.target.value),
            onBlur: (e: any) => handleContactFormBlur('phoneNumber', e.target.value),
          },
        }}
        message={{
          props: {
            value: formState.message,
            onChange: (e: any) => updateFormField('message', e.target.value),
            onBlur: (e: any) => handleContactFormBlur('message', e.target.value),
          },
        }}
        ganttChart={{
          children: ganttChartContent,
        }}
      />
      <ToastContainer />
    </>
  )
}

const ProjectEstimator = forwardRef(ProjectEstimator_)
export default ProjectEstimator
