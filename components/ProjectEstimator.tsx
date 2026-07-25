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
import {
  ROLE_RATES,
  HOURS_PER_PERSON_PER_MONTH,
  parseTimelineToMonths,
  getTeamComposition,
  computeDefaultEstimate,
  getTimelineRangeInMonths,
  formatMonthsRange,
  formatTeamSize,
  formatInfrastructure,
} from '../lib/estimatorMath'
import {
  extractPhasesJsonFromText,
  removePhasesJsonFromText,
  extractTeamSummary,
  extractTeamCompositionDetails,
  extractInfrastructureSummary,
  extractCostSummary,
  extractTimelineSummary,
} from '../lib/aiTextParsing'
import { logger, describeError } from '../lib/logger'

const TOAST_OPTIONS = {
  position: 'bottom-right' as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'dark' as const,
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


  // Unified estimate: align hours with timeline (AI if present) and cost with AI when available
  const currentEstimate = useMemo(() => {
    const monthsForHours = parseTimelineToMonths(aiTimeline || formState.timeline)
    const roles = getTeamComposition(formState.selectedTeam)
    let totalHours = 0
    if (roles) {
      Object.entries(roles).forEach(([, count]) => {
        totalHours += (count as number) * monthsForHours * HOURS_PER_PERSON_PER_MONTH
      })
    }
    const hoursRange = totalHours ? `${Math.round(totalHours * 0.85)}-${Math.round(totalHours * 1.15)}` : 'TBD'

    if (aiEstimate) {
      return { hours: hoursRange, cost: aiEstimate }
    }
    const baseline = computeDefaultEstimate(formState.selectedTeam, formState.timeline)
    return { hours: hoursRange, cost: baseline.cost }
  }, [formState.selectedTeam, formState.timeline, aiEstimate, aiTimeline])

  // State update handler
  const updateFormField = useCallback((field: keyof FormState, value: string) => {
    logger.debug('[estimator] Updating form field:', { field, value })
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
      logger.debug('[estimator] Not on infrastructure step yet')
      return
    }

    // Flag to track if AI data has been received
    let aiDataReceived = false

    try {
      logger.debug('[estimator] submitting project')
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
      logger.debug('[estimator] project created', projectId)
      setLastProjectId(projectId)

      // Show loading screen while AI processes the project
      setStep('loading')

      // Subscribe for real-time AI updates for this project
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe()
        }
        // Filter server-side, on the id we just created.
        //
        // Without `variables`, AppSync pushes EVERY project update to EVERY
        // connected client, and the check below quietly discarded the ones
        // that did not match. That meant each visitor's browser received every
        // other visitor's scope text, cost analysis and risk assessment over
        // the websocket. The client-side `if` was hiding a data leak, not
        // preventing one.
        //
        // The generated subscription already accepted
        // `$filter: ModelSubscriptionProjectFilterInput` -- it was simply
        // never passed. The client-side check stays as defence in depth: a
        // filter is a server we are trusting, and trusting one server is
        // enough reason to keep a cheap local assertion.
        const sub = client
          .graphql({
            query: onUpdateProject,
            variables: { filter: { id: { eq: projectId } } },
          })
          .subscribe({
            next: ({ data }: SubscriptionMessage) => {
              const updated = data?.onUpdateProject
              if (!updated || updated.id !== projectId) return
              logger.debug('[estimator] subscription update received')
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
              logger.debug('[estimator] AI data received via subscription')
              aiDataReceived = true
              setStep('summary')
            }
          },
          error: (err: Error) => logger.error('[estimator] Subscription error:', err),
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
            logger.debug('[estimator] AI data already available on immediate fetch')
            aiDataReceived = true
            setStep('summary')
          }
        } catch {}
      } catch (subErr) {
        logger.error('[estimator] Failed to start subscription:', subErr)
      }

      // Fallback polling - only used if subscription fails to deliver
      const pollForSummary = async (attempts = 0) => {
        // Stop polling if AI data has already been received
        if (aiDataReceived) {
          logger.debug('[estimator] Polling stopped - AI data already received')
          return
        }

        if (attempts >= 6) {
          logger.debug('[estimator] Max fallback polling attempts reached. Showing summary with available data.')
          setStep('summary')
          return
        }

        try {
          logger.debug('[estimator] Fetching project details, attempt', attempts + 1)
          const updatedProject = await client.graphql({
            query: getProject,
            variables: { id: projectId },
          })

          const project = updatedProject.data.getProject

          // Check multiple fields since AI_estimatedCost might remain null
          if (project?.AI_costAnalysis || project?.AI_summary || project?.AI_estimatedCost) {
            logger.debug('[estimator] Using AI-generated estimate:', project.AI_estimatedCost || 'N/A')
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
            logger.debug('[estimator] AI data received via polling')
            aiDataReceived = true
            setStep('summary')
            return
          } else {
            logger.debug('[estimator] AI data not ready yet (fallback polling), attempt:', attempts + 1)
            // Only schedule next poll if data hasn't been received
            if (!aiDataReceived) {
              setTimeout(
                () => pollForSummary(attempts + 1),
                5000 // 5 second intervals for fallback polling
              )
            }
          }
        } catch (error) {
          logger.error('[estimator] Error in fallback polling:', error)
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
          logger.debug('[estimator] subscription silent after 15s, starting fallback polling')
          pollForSummary()
        } else {
          logger.debug('[estimator] No polling needed - subscription already delivered data')
        }
      }, 15000)
    } catch (e: any) {
      logger.error('[estimator] Error creating project:', e)
      alert(e.message || 'An error occurred while creating the project.')
    }
  }, [formState, step, currentEstimate.cost, autoSelections])

  const handleNext = useCallback(() => {
    logger.debug('[estimator] Next clicked on step:', step)
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
    logger.debug('[estimator] Back clicked on step:', step)
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
    logger.debug('[estimator] Restarting estimator')
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe()
      } catch (error) {
        logger.error('[estimator] Failed to unsubscribe during restart:', error)
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
    logger.debug('[estimator] Starting estimate')
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
    logger.debug('[estimator] Submitting contact information:', {
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
        // HubSpot is the system of record for leads; the DynamoDB write is a
        // secondary copy, so this is a warning rather than a failure.
        logger.warn('[estimator] secondary lead write failed', describeError(dbError))
      }

      logger.debug('[estimator] lead created in HubSpot')
      toast.success("Thank you! We'll be in touch soon.", TOAST_OPTIONS)
    } catch (error: any) {
      logger.error('[estimator] Error creating lead:', error)
      toast.error(
        error.message || 'An error occurred while submitting your information. Please try again.',
        TOAST_OPTIONS
      )
    }
  }, [formState, lastProjectId])




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
    [aiTimelineValidationRaw]
  )

  const timelineSummaryFromAI = useMemo(
    () => extractTimelineSummary(cleanedTimelineValidation),
    [cleanedTimelineValidation]
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
  }, [aiEstimate, aiCostAnalysis, currentEstimate.cost])

  const timelineRangeFromSummary = useMemo(
    () => (timelineSummaryFromAI ? getTimelineRangeInMonths(timelineSummaryFromAI) : null),
    [timelineSummaryFromAI]
  )

  const timelineRangeFromPhases = useMemo(
    () => timelineInsightFromPhases?.monthsRange ?? null,
    [timelineInsightFromPhases]
  )

  const timelineRangeFromAiTimeline = useMemo(
    () => (aiTimeline ? getTimelineRangeInMonths(aiTimeline) : null),
    [aiTimeline]
  )

  const timelineRangeForHours = timelineRangeFromSummary || timelineRangeFromPhases || timelineRangeFromAiTimeline

  const timelineLabelFromPhases = useMemo(
    () => formatMonthsRange(timelineRangeFromPhases),
    [timelineRangeFromPhases]
  )

  const timelineLabelFromSummaryRange = useMemo(
    () => formatMonthsRange(timelineRangeFromSummary),
    [timelineRangeFromSummary]
  )

  const timelineLabelFromAiTimeline = useMemo(
    () => formatMonthsRange(timelineRangeFromAiTimeline),
    [timelineRangeFromAiTimeline]
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
  }, [timelineLabelFromPhases, timelineLabelFromSummaryRange, timelineLabelFromAiTimeline, timelineInsightFromPhases, timelineSummaryFromAI, aiTimeline, autoSelections.timeline, formState.timeline])

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
    [aiCostAnalysis]
  )

  const displayedTeamSize = useMemo(() => {
    if (aiTeamSize?.trim()) return aiTeamSize.trim()
    if (teamDetailsFromAnalysis) return teamDetailsFromAnalysis
    if (formState.selectedTeam) return formatTeamSize(formState.selectedTeam)
    if (autoSelections.team) return "We'll recommend a team for you."
    return 'TBD'
  }, [aiTeamSize, teamDetailsFromAnalysis, formState.selectedTeam, autoSelections.team])

  const displayedInfrastructure = useMemo(() => {
    if (aiInfrastructure?.trim()) return aiInfrastructure.trim()
    const parsed = extractInfrastructureSummary(aiInfrastructureRecommendations)
    if (parsed) return parsed
    if (formState.infrastructure) return formatInfrastructure(formState.infrastructure)
    if (autoSelections.infrastructure) return "We'll recommend the right infrastructure."
    return 'TBD'
  }, [aiInfrastructure, aiInfrastructureRecommendations, formState.infrastructure, autoSelections.infrastructure])

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
