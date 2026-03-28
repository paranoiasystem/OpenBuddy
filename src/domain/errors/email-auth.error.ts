import { DomainError } from './domain-error.js'

/** Thrown when Gmail authentication fails or the token is missing. */
export class EmailAuthError extends DomainError {
  readonly code = 'EMAIL_AUTH_REQUIRED' as const

  constructor() {
    super('Gmail authentication required. Run /auth to authenticate.')
  }
}
