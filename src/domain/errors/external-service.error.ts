import { DomainError } from './domain-error.js'

/** Thrown when an external service returns an unexpected server-side error. */
export class ExternalServiceError extends DomainError {
  readonly code = 'EXTERNAL_SERVICE_ERROR' as const

  constructor(service: string, cause?: string) {
    super(cause ? `${service} error: ${cause}` : `${service} returned an unexpected error`)
  }
}
