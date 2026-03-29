import { t } from './i18n/index.js'

/** All user-facing Telegram text strings. Never inline strings in handlers. */
export const MESSAGES = {
  get WELCOME(): string {
    return t('WELCOME')
  },
  get UNAUTHORIZED(): string {
    return t('UNAUTHORIZED')
  },
  get ERROR_GENERIC(): string {
    return t('ERROR_GENERIC')
  },
  get ERROR_LLM_UNAVAILABLE(): string {
    return t('ERROR_LLM_UNAVAILABLE')
  },
  get PROCESSING(): string {
    return t('PROCESSING')
  },
  get SCHEDULE_CREATED(): string {
    return t('SCHEDULE_CREATED')
  },
  get SCHEDULE_DELETED(): string {
    return t('SCHEDULE_DELETED')
  },
  get SCHEDULE_NOT_FOUND(): string {
    return t('SCHEDULE_NOT_FOUND')
  },
  get CALENDAR_EVENT_CREATED(): string {
    return t('CALENDAR_EVENT_CREATED')
  },
  get CALENDAR_AUTH_REQUIRED(): string {
    return t('CALENDAR_AUTH_REQUIRED')
  },
  get AUTH_START(): string {
    return t('AUTH_START')
  },
  get AUTH_SUCCESS(): string {
    return t('AUTH_SUCCESS')
  },
  get AUTH_ALREADY_DONE(): string {
    return t('AUTH_ALREADY_DONE')
  },
  get AUTH_NOT_CONFIGURED(): string {
    return t('AUTH_NOT_CONFIGURED')
  },
  get HELP_TEXT(): string {
    return t('HELP_TEXT')
  },
  get UNKNOWN_COMMAND(): string {
    return t('UNKNOWN_COMMAND')
  },
  get AUTH_REQUIRED_GOOGLE(): string {
    return t('AUTH_REQUIRED_GOOGLE')
  },
  get ERROR_CHAT_WORKFLOW(): string {
    return t('ERROR_CHAT_WORKFLOW')
  },
  get ERROR_EMAIL_WRITE_WORKFLOW(): string {
    return t('ERROR_EMAIL_WRITE_WORKFLOW')
  },
  get ERROR_EMAIL_SEND_FAILED(): string {
    return t('ERROR_EMAIL_SEND_FAILED')
  },
  get ERROR_GENERIC_WORKFLOW(): string {
    return t('ERROR_GENERIC_WORKFLOW')
  },
}
