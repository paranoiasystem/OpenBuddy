import { DomainError } from './domain-error.js'

/** Thrown when a new scheduled task conflicts with an existing one. */
export class ScheduleConflictError extends DomainError {
  readonly code = 'SCHEDULE_CONFLICT' as const

  constructor(cronExpression: string) {
    super(`A scheduled task with expression "${cronExpression}" already exists`)
  }
}
