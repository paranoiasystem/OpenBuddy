import type { Result } from 'neverthrow'

export { err, ok, Result } from 'neverthrow'

import type { DomainError } from '@domain/errors/domain-error.js'

/** Convenience alias for the standard Result type used throughout the application. */
export type AppResult<T> = Result<T, DomainError>
