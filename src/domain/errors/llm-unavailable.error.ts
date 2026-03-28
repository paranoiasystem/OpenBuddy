import { DomainError } from './domain-error.js'

/** Thrown when the LLM gateway cannot fulfil a completion request. */
export class LlmUnavailableError extends DomainError {
  readonly code = 'LLM_UNAVAILABLE' as const

  constructor(cause?: string) {
    super(cause ? `LLM service unavailable: ${cause}` : 'LLM service unavailable')
  }
}
