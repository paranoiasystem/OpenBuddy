import { DomainError } from './domain-error.js'

/** Thrown when a user cannot be located by their Telegram ID. */
export class UserNotFoundError extends DomainError {
  readonly code = 'USER_NOT_FOUND' as const

  constructor(telegramId: number) {
    super(`User with Telegram ID ${telegramId} not found`)
  }
}
