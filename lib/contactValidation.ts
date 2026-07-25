/**
 * Validation and sanitisation for the public contact form.
 *
 * Extracted verbatim from components/ContactForm.tsx, where these lived as
 * closures inside the component and could not be tested without rendering the
 * whole Plasmic tree.
 *
 * These are CHARACTERISATION extractions: behaviour is preserved exactly,
 * including the known defects documented below, so that the move itself cannot
 * be the cause of a regression. HN-07 changes the behaviour, and the tests
 * that pin the current rules will be updated in that story -- deliberately, as
 * a visible decision rather than an accident.
 *
 * Note this is browser-side validation, which is a user-experience feature,
 * not a security control. Anything that reaches an API route is validated
 * again server-side by lib/inputValidation.ts. A caller who skips the form
 * entirely skips these rules.
 */

/**
 * Unicode letters, combining marks, and the punctuation that appears in real
 * names. Declared without the /g flag: .test() on a global regex advances
 * lastIndex, so a shared /g pattern returns alternating answers.
 */
export const NAME_PATTERN = /^[\p{L}\p{M}'’\-. ]+$/u

export interface ValidationResult {
  isValid: boolean
  sanitized: string
  errorMessage: string
}

/**
 * Strips the obvious injection vectors from free text.
 *
 * This is defence in depth for display, not output encoding: React escapes
 * values on render, so this exists to stop hostile-looking text being stored
 * and forwarded to HubSpot, where it may be rendered by tooling we do not
 * control.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
}

/**
 * Additionally strips tokens used to hijack an LLM prompt.
 *
 * The description field ends up in the AI enrichment pipeline, so text like
 * "system: ignore previous instructions" is a real input, not a theoretical
 * one. Stripping is a blunt instrument and not a substitute for the worker
 * treating this text as untrusted data.
 */
export function stripPromptInjectionTokens(input: string): string {
  return input
    .replace(/system:/gi, '')
    .replace(/assistant:/gi, '')
    .replace(/user:/gi, '')
    .replace(/<\|.*?\|>/g, '')
    .replace(/\[INST\]/gi, '')
    .replace(/\[\/INST\]/gi, '')
}

/**
 * Validates a first or last name.
 *
 * The rule was /^[a-zA-Z-]+$/, which rejected spaces, apostrophes and every
 * accented character -- so "Anne Marie", "O'Brien", "Renée" and "de la Cruz"
 * were all turned away by a form whose only purpose is collecting leads. It is
 * hard to imagine a more expensive validation rule.
 *
 * The replacement accepts any Unicode letter (\p{L}), combining marks
 * (\p{M}, needed for decomposed accents), plus space, apostrophe, hyphen and
 * full stop. The `u` flag is required for \p{...} to mean anything -- without
 * it the pattern is silently interpreted as a literal.
 *
 * Both apostrophe forms are accepted: U+0027 (typed) and U+2019 (what iOS and
 * Word substitute automatically).
 *
 * Still rejected: digits, angle brackets, and anything the sanitiser strips.
 */
export function validateName(name: string, fieldName: string): ValidationResult {
  const sanitized = sanitizeInput(name)

  if (sanitized.length === 0) {
    return { isValid: false, sanitized, errorMessage: `${fieldName} is required` }
  }

  if (sanitized.length > 100) {
    return { isValid: false, sanitized, errorMessage: `${fieldName} must be less than 100 characters` }
  }

  if (!NAME_PATTERN.test(sanitized)) {
    return { isValid: false, sanitized, errorMessage: `${fieldName} contains characters we can't accept` }
  }

  return { isValid: true, sanitized, errorMessage: '' }
}

export function validateEmail(emailInput: string): ValidationResult {
  const sanitized = sanitizeInput(emailInput)

  if (sanitized.length === 0) {
    return { isValid: false, sanitized, errorMessage: 'Email is required' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return { isValid: false, sanitized, errorMessage: 'Please enter a valid email address' }
  }

  return { isValid: true, sanitized, errorMessage: '' }
}

/**
 * Validates a phone number and normalises it to E.164-ish form.
 *
 * A bare 10-digit number is assumed to be US and gains a +1 prefix. That
 * assumption is stated here because it is invisible at the call site and wrong
 * for most of the world.
 */
export function validatePhoneNumber(phoneInput: string): ValidationResult {
  if (phoneInput.trim().length === 0) {
    return { isValid: false, sanitized: phoneInput, errorMessage: 'Phone number is required' }
  }

  let cleaned = phoneInput.replace(/[\s\-()\.]/g, '')

  const hasPlus = cleaned.startsWith('+')
  if (hasPlus) cleaned = cleaned.substring(1)

  cleaned = cleaned.replace(/^0+/, '')

  if (cleaned.length === 0 || !/^\d+$/.test(cleaned)) {
    return { isValid: false, sanitized: phoneInput, errorMessage: 'Phone number must contain only digits' }
  }

  if (cleaned.length === 10 && !hasPlus) {
    return { isValid: true, sanitized: `+1${cleaned}`, errorMessage: '' }
  }

  if (cleaned.length === 11 && cleaned.startsWith('1') && !hasPlus) {
    return { isValid: true, sanitized: `+${cleaned}`, errorMessage: '' }
  }

  if (cleaned.length >= 10 && cleaned.length <= 15) {
    return { isValid: true, sanitized: `+${cleaned}`, errorMessage: '' }
  }

  if (cleaned.length < 10) {
    return { isValid: false, sanitized: phoneInput, errorMessage: 'Phone number is too short' }
  }

  return { isValid: false, sanitized: phoneInput, errorMessage: 'Please enter a valid phone number' }
}

/** The description is optional, so empty is valid. */
export function validateDescription(desc: string): ValidationResult {
  const sanitized = sanitizeInput(desc)

  if (sanitized.length === 0) {
    return { isValid: true, sanitized, errorMessage: '' }
  }

  const dangerousPatterns = [/system:/gi, /assistant:/gi, /user:/gi, /<\|.*?\|>/gi, /\[INST\]/gi, /\[\/INST\]/gi]

  // Note: .test() on a /g regex advances lastIndex, so a shared regex object
  // would give different answers on consecutive calls. These literals are
  // recreated per call, which sidesteps it -- do not hoist them to module
  // scope without dropping the /g flag.
  if (dangerousPatterns.some((pattern) => pattern.test(sanitized))) {
    return { isValid: false, sanitized, errorMessage: 'Description contains invalid content' }
  }

  return { isValid: true, sanitized, errorMessage: '' }
}
