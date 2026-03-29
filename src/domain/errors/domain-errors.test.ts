import { describe, it, expect } from 'vitest'

import { CalendarAuthError } from './calendar-auth.error.js'
import { DomainError } from './domain-error.js'
import { EmailAuthError } from './email-auth.error.js'
import { ExternalServiceError } from './external-service.error.js'
import { UserNotFoundError } from './user-not-found.error.js'

describe('Domain errors', () => {
  it('should create CalendarAuthError with correct code', () => {
    const error = new CalendarAuthError()
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('CALENDAR_AUTH_REQUIRED')
  })

  it('should create EmailAuthError with correct code', () => {
    const error = new EmailAuthError()
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('EMAIL_AUTH_REQUIRED')
  })

  it('should create ExternalServiceError with service name', () => {
    const error = new ExternalServiceError('Gmail')
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
    expect(error.message).toContain('Gmail')
  })

  it('should create ExternalServiceError with cause', () => {
    const error = new ExternalServiceError('Gmail', 'timeout')
    expect(error.message).toContain('timeout')
  })

  it('should create UserNotFoundError with telegramId', () => {
    const error = new UserNotFoundError(12345)
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('USER_NOT_FOUND')
    expect(error.message).toContain('12345')
  })
})
