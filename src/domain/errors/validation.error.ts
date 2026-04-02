import { DomainError } from './domain-error.js'

/** Raised when user-supplied input fails boundary validation. */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR' as const

  constructor(message: string) {
    super(message)
  }
}
