/**
 * Input validation and sanitization utilities
 */

// Field length limits
export const FIELD_LIMITS = {
  firstName: 100,
  lastName: 100,
  email: 255,
  phoneNumber: 20,
  message: 5000,
  scope: 1000,
  timeline: 100,
  teamSize: 50,
  infrastructure: 200,
  estimatedCost: 100,
  estimatedTimeline: 100,
  estimatedHours: 50,
  estimatedTeam: 100,
  estimatedArchitecture: 500,
  tracking_id: 100,
  tracking_id_uuid: 100,
  utm_source: 100,
  utm_medium: 100,
  utm_campaign: 100,
  utm_content: 100,
  utm_term: 100,
} as const

/**
 * Sanitize string input
 * - Trims whitespace
 * - Removes potentially dangerous characters
 * - Limits length
 */
export function sanitizeString(input: string | undefined, maxLength: number): string | undefined {
  if (!input) return undefined

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove angle brackets to prevent potential XSS
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' }
  }

  const trimmed = email.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email cannot be empty' }
  }

  if (trimmed.length > FIELD_LIMITS.email) {
    return { valid: false, error: `Email must be less than ${FIELD_LIMITS.email} characters` }
  }

  // More robust email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' }
  }

  return { valid: true }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string | undefined): { valid: boolean; error?: string } {
  if (!phone) return { valid: true } // Optional field

  const trimmed = phone.trim()
  if (trimmed.length === 0) return { valid: true }

  if (trimmed.length > FIELD_LIMITS.phoneNumber) {
    return { valid: false, error: `Phone number must be less than ${FIELD_LIMITS.phoneNumber} characters` }
  }

  // Allow digits, spaces, hyphens, plus, parentheses
  const phoneRegex = /^[\d\s\-\+\(\)]+$/
  if (!phoneRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid phone number format' }
  }

  // Check minimum length (at least 7 digits)
  const digitCount = trimmed.replace(/\D/g, '').length
  if (digitCount < 7) {
    return { valid: false, error: 'Phone number must contain at least 7 digits' }
  }

  return { valid: true }
}

/**
 * Validate required string field
 */
export function validateRequiredString(
  value: string | undefined,
  fieldName: string,
  maxLength: number
): { valid: boolean; error?: string; sanitized?: string } {
  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName} is required` }
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` }
  }

  const sanitized = sanitizeString(trimmed, maxLength)
  return { valid: true, sanitized: sanitized! }
}

/**
 * Validate optional string field
 */
export function validateOptionalString(
  value: string | undefined,
  fieldName: string,
  maxLength: number
): { valid: boolean; error?: string; sanitized?: string } {
  if (!value) return { valid: true, sanitized: undefined }

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` }
  }

  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { valid: true, sanitized: undefined }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be less than ${maxLength} characters` }
  }

  const sanitized = sanitizeString(trimmed, maxLength)
  return { valid: true, sanitized: sanitized! }
}

