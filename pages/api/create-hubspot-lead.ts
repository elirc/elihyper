import type { NextApiRequest, NextApiResponse } from 'next'
import { checkRateLimit } from '../../lib/rateLimiter'
import {
  validateEmail,
  validatePhoneNumber,
  validateName,
  validateOptionalString,
  FIELD_LIMITS,
} from '../../lib/inputValidation'
import { requireEnv, optionalEnv, logServerEnvStatus, MissingEnvironmentVariableError } from '../../lib/serverEnv'
import { checkForSpam, HONEYPOT_FIELD } from '../../lib/spamGuard'
import { getClientIp } from '../../lib/rateLimiter'
import { logger } from '../../lib/logger'

// Runs once, when this module is first loaded, so a misconfigured deployment
// announces itself in the logs at boot instead of waiting for a visitor to
// submit a form and receive a 500.
logServerEnvStatus()

interface HubSpotLeadRequest {
  firstName: string
  lastName: string
  email: string
  phoneNumber?: string
  message?: string
  tracking_id?: string
  environment?: 'dev' | 'prod'
  /** Anti-spam: hidden field a human never fills, and the form's render time. */
  [HONEYPOT_FIELD]?: string
  renderedAt?: number
  turnstileToken?: string
  /** Which form produced this lead. Both entry points now post here. */
  source?: 'contact_form' | 'estimator'
  // Project estimator specific fields
  scope?: string
  timeline?: string
  teamSize?: string
  infrastructure?: string
  estimatedCost?: string
  estimatedTimeline?: string
  estimatedHours?: string
  estimatedTeam?: string
  estimatedArchitecture?: string
  // HubSpot custom properties
  estimator_completed?: boolean
  tracking_id_uuid?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

interface HubSpotError {
  message: string
  status: string
  errors?: Array<{ message: string; in?: string }>
}

function resolveAppEnv(bodyEnv?: string): 'dev' | 'prod' {
  const v = (bodyEnv || '').toLowerCase()
  if (v === 'dev' || v === 'prod') return v
  return process.env.NEXT_PUBLIC_APP_ENV === 'dev' || process.env.NODE_ENV === 'development' ? 'dev' : 'prod'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isProduction = process.env.NODE_ENV === 'production'

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting - check before processing.
  // Now async: the store may be DynamoDB, shared across Lambda instances.
  const rateLimit = await checkRateLimit(req, { bucket: 'create-hubspot-lead' })
  if (!rateLimit.allowed) {
    const resetSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    res.setHeader('X-RateLimit-Limit', '5')
    res.setHeader('X-RateLimit-Remaining', '0')
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
    res.setHeader('Retry-After', resetSeconds.toString())
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
    })
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', '5')
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString())
  res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())

  // Read the HubSpot credential. requireEnv throws a named, described error
  // rather than letting `undefined` travel into an Authorization header and
  // come back as an opaque 401 from HubSpot.
  let hubspotApiKey: string
  try {
    hubspotApiKey = requireEnv('HUBSPOT_API_KEY')
  } catch (error) {
    if (error instanceof MissingEnvironmentVariableError) {
      console.error(`[config] ${error.message}`)
      return res.status(500).json({ error: 'Server configuration error' })
    }
    throw error
  }

  try {
    // Validate and extract request body
    const body: HubSpotLeadRequest = req.body

    // Spam checks run before validation and before any third-party call: a bot
    // submission should cost us nothing.
    const spamCheck = await checkForSpam({
      honeypot: (body as unknown as Record<string, unknown>)[HONEYPOT_FIELD],
      renderedAt: body.renderedAt,
      turnstileToken: body.turnstileToken,
      remoteIp: getClientIp(req),
    })

    if (!spamCheck.ok) {
      // Deliberately generic to the client. Telling a bot which signal caught
      // it is telling its author what to change. The reason is logged instead.
      logger.warn('[spam-guard] submission blocked', { reason: spamCheck.reason })
      return res.status(400).json({ error: 'Unable to process this submission' })
    }

    // Validate required fields with proper validation
    const firstNameValidation = validateName(body.firstName, 'First name', FIELD_LIMITS.firstName)
    if (!firstNameValidation.valid) {
      return res.status(400).json({ error: firstNameValidation.error })
    }

    const lastNameValidation = validateName(body.lastName, 'Last name', FIELD_LIMITS.lastName)
    if (!lastNameValidation.valid) {
      return res.status(400).json({ error: lastNameValidation.error })
    }

    const emailValidation = validateEmail(body.email)
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error })
    }

    // Validate phone number if provided
    const phoneValidation = validatePhoneNumber(body.phoneNumber)
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error })
    }

    // Validate and sanitize optional string fields
    const messageValidation = validateOptionalString(body.message, 'Message', FIELD_LIMITS.message)
    if (!messageValidation.valid) {
      return res.status(400).json({ error: messageValidation.error })
    }

    const scopeValidation = validateOptionalString(body.scope, 'Scope', FIELD_LIMITS.scope)
    if (!scopeValidation.valid) {
      return res.status(400).json({ error: scopeValidation.error })
    }

    const timelineValidation = validateOptionalString(body.timeline, 'Timeline', FIELD_LIMITS.timeline)
    if (!timelineValidation.valid) {
      return res.status(400).json({ error: timelineValidation.error })
    }

    const teamSizeValidation = validateOptionalString(body.teamSize, 'Team size', FIELD_LIMITS.teamSize)
    if (!teamSizeValidation.valid) {
      return res.status(400).json({ error: teamSizeValidation.error })
    }

    const infrastructureValidation = validateOptionalString(
      body.infrastructure,
      'Infrastructure',
      FIELD_LIMITS.infrastructure
    )
    if (!infrastructureValidation.valid) {
      return res.status(400).json({ error: infrastructureValidation.error })
    }

    // Resolve environment. Prefer explicit request field, otherwise fall back to runtime env.
    const resolvedEnv = resolveAppEnv(body.environment)

    // Map validated and sanitized fields to HubSpot contact properties
    const hubspotProperties: Record<string, string | boolean> = {
      firstname: firstNameValidation.sanitized!,
      lastname: lastNameValidation.sanitized!,
      email: body.email.trim().toLowerCase(),
    }

    /**
     * Environment tagging for tracking isolation.
     *
     * Your HubSpot portal uses checkbox-style properties like `environment__dev`.
     * That means we should send boolean true/false, not strings.
     *
     * - dev:  environment__dev = true
     * - prod: environment__dev = false
     *
     * Optionally, if you also have a prod checkbox property, set:
     * - HUBSPOT_ENV_PROD_PROPERTY_NAME=environment__prod
     */
    const envDevProp = optionalEnv('HUBSPOT_ENV_DEV_PROPERTY_NAME', 'environment__dev')
    const envProdProp = optionalEnv('HUBSPOT_ENV_PROD_PROPERTY_NAME')
    hubspotProperties[envDevProp] = resolvedEnv === 'dev'
    if (envProdProp) {
      hubspotProperties[envProdProp] = resolvedEnv === 'prod'
    }

    // Which form produced this lead. `hs_analytics_source_data_1` is a
    // built-in HubSpot property; a dedicated custom property would be better
    // but needs creating in the portal first (see HUBSPOT CONFIG.md).
    if (body.source === 'contact_form' || body.source === 'estimator') {
      hubspotProperties.message = [`Submitted via: ${body.source}`, messageValidation.sanitized]
        .filter(Boolean)
        .join('\n\n')
    }

    // Add optional fields if provided
    if (body.phoneNumber && body.phoneNumber.trim()) {
      hubspotProperties.phone = body.phoneNumber.trim()
    }

    // Add custom HubSpot properties
    if (body.estimator_completed !== undefined) {
      // HubSpot checkbox fields expect boolean or "true"/"false" string
      hubspotProperties.estimator_completed = body.estimator_completed
    }

    // Sanitize UTM and tracking fields from body
    const sanitizedFields = {
      tracking_id_uuid: body.tracking_id_uuid?.trim() || undefined,
      utm_source: body.utm_source?.trim() || undefined,
      utm_medium: body.utm_medium?.trim() || undefined,
      utm_campaign: body.utm_campaign?.trim() || undefined,
      utm_content: body.utm_content?.trim() || undefined,
      utm_term: body.utm_term?.trim() || undefined,
    }

    // Add sanitized UTM and tracking fields
    if (sanitizedFields.tracking_id_uuid) {
      hubspotProperties.tracking_id_uuid = sanitizedFields.tracking_id_uuid
    }

    if (sanitizedFields.utm_source) {
      hubspotProperties.utm_source = sanitizedFields.utm_source
    }

    if (sanitizedFields.utm_medium) {
      hubspotProperties.utm_medium = sanitizedFields.utm_medium
    }

    if (sanitizedFields.utm_campaign) {
      hubspotProperties.utm_campaign = sanitizedFields.utm_campaign
    }

    if (sanitizedFields.utm_content) {
      hubspotProperties.utm_content = sanitizedFields.utm_content
    }

    if (sanitizedFields.utm_term) {
      hubspotProperties.utm_term = sanitizedFields.utm_term
    }

    // Add project estimator fields if provided
    // NOTE: Only send fields that exist in your HubSpot portal
    // Uncomment these if you create the corresponding custom properties in HubSpot
    if (messageValidation.sanitized) {
      hubspotProperties.message = messageValidation.sanitized
    }

    // Commented out - create these properties in HubSpot if needed:
    // if (scopeValidation.sanitized) {
    //   hubspotProperties.scope = scopeValidation.sanitized
    // }
    //
    // if (timelineValidation.sanitized) {
    //   hubspotProperties.timeline = timelineValidation.sanitized
    // }
    //
    // if (teamSizeValidation.sanitized) {
    //   hubspotProperties.team_size = teamSizeValidation.sanitized
    // }
    //
    // if (infrastructureValidation.sanitized) {
    //   hubspotProperties.infrastructure = infrastructureValidation.sanitized
    // }
    //
    // if (body.estimatedCost) {
    //   hubspotProperties.estimated_cost = body.estimatedCost
    // }
    //
    // if (body.estimatedTimeline) {
    //   hubspotProperties.estimated_timeline = body.estimatedTimeline
    // }
    //
    // if (body.estimatedHours) {
    //   hubspotProperties.estimated_hours = body.estimatedHours
    // }
    //
    // if (body.estimatedTeam) {
    //   hubspotProperties.estimated_team = body.estimatedTeam
    // }
    //
    // if (body.estimatedArchitecture) {
    //   hubspotProperties.estimated_architecture = body.estimatedArchitecture
    // }

    // Create or update contact in HubSpot
    // Using HubSpot Contacts API v3
    const hubspotUrl = `https://api.hubapi.com/crm/v3/objects/contacts`

    const response = await fetch(hubspotUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hubspotApiKey}`,
      },
      body: JSON.stringify({
        properties: hubspotProperties,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle HubSpot API errors
      const error: HubSpotError = data
      // Log full error details server-side only
      console.error('HubSpot API error:', {
        status: response.status,
        message: error.message,
        errors: error.errors,
        // Don't log sensitive data like email in production logs
        ...(isProduction ? {} : { email: body.email }),
      })

      // Check if it's a duplicate contact error (409)
      if (response.status === 409) {
        // Try to update existing contact instead
        return await updateExistingContact(hubspotApiKey, body.email, hubspotProperties, res)
      }

      // Don't expose internal error details to client
      return res.status(500).json({
        error: 'Failed to create contact',
        // Only include generic message, not internal error details
        ...(isProduction ? {} : { details: error.message }),
      })
    }

    // Success response
    return res.status(200).json({
      success: true,
      contactId: data.id,
      message: 'Contact created successfully in HubSpot',
      environment: resolvedEnv,
      envDevPropertyName: envDevProp,
      envProdPropertyName: envProdProp || null,
    })
  } catch (error: unknown) {
    // Log full error details server-side only
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error creating HubSpot lead:', {
      message: errorMessage,
      stack: errorStack,
      // Don't log request body in production to avoid logging sensitive data
      ...(isProduction ? {} : { body: req.body }),
    })

    // Don't expose internal error details to client
    return res.status(500).json({
      error: 'Internal server error',
      // Only include error message in development
      ...(isProduction ? {} : { message: errorMessage }),
    })
  }
}

// Helper function to update existing contact
async function updateExistingContact(
  apiKey: string,
  email: string,
  properties: Record<string, string | boolean>,
  res: NextApiResponse
) {
  const isProduction = process.env.NODE_ENV === 'production'

  try {
    // First, search for the contact by email
    const searchUrl = `https://api.hubapi.com/crm/v3/objects/contacts/search`
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email,
              },
            ],
          },
        ],
        properties: ['id', 'email'],
      }),
    })

    const searchData = await searchResponse.json()

    if (!searchResponse.ok || !searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ error: 'Contact not found for update' })
    }

    const contactId = searchData.results[0].id

    // Update the contact
    const updateUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        properties: properties,
      }),
    })

    const updateData = await updateResponse.json()

    if (!updateResponse.ok) {
      // Log full error details server-side only
      console.error('HubSpot update error:', {
        status: updateResponse.status,
        message: updateData.message,
        // Don't log sensitive data in production
        ...(isProduction ? {} : { email }),
      })

      // Don't expose internal error details to client
      return res.status(500).json({
        error: 'Failed to update contact',
        // Only include error details in development
        ...(isProduction ? {} : { details: updateData.message }),
      })
    }

    return res.status(200).json({
      success: true,
      contactId: contactId,
      message: 'Contact updated successfully in HubSpot',
    })
  } catch (error: unknown) {
    // Log full error details server-side only
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error updating HubSpot contact:', {
      message: errorMessage,
      stack: errorStack,
      // Don't log sensitive data in production
      ...(isProduction ? {} : { email }),
    })

    // Don't expose internal error details to client
    return res.status(500).json({
      error: 'Internal server error',
      // Only include error message in development
      ...(isProduction ? {} : { message: errorMessage }),
    })
  }
}
