import { DomainError } from './domain-error.js'

/** Thrown when Google Calendar authentication fails or the token is missing. */
export class CalendarAuthError extends DomainError {
  readonly code = 'CALENDAR_AUTH_REQUIRED' as const

  constructor() {
    super('Google Calendar authentication required. Run /auth to authenticate.')
  }
}
