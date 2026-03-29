export type Locale = 'it' | 'en'

export type MessageKeys = {
  readonly WELCOME: string
  readonly UNAUTHORIZED: string
  readonly ERROR_GENERIC: string
  readonly ERROR_LLM_UNAVAILABLE: string
  readonly PROCESSING: string
  readonly SCHEDULE_CREATED: string
  readonly SCHEDULE_DELETED: string
  readonly SCHEDULE_NOT_FOUND: string
  readonly CALENDAR_EVENT_CREATED: string
  readonly CALENDAR_AUTH_REQUIRED: string
  readonly AUTH_START: string
  readonly AUTH_SUCCESS: string
  readonly AUTH_ALREADY_DONE: string
  readonly AUTH_NOT_CONFIGURED: string
  readonly HELP_TEXT: string
  readonly UNKNOWN_COMMAND: string
  readonly AUTH_REQUIRED_GOOGLE: string
  readonly ERROR_CHAT_WORKFLOW: string
  readonly ERROR_EMAIL_WRITE_WORKFLOW: string
  readonly ERROR_EMAIL_SEND_FAILED: string
  readonly ERROR_GENERIC_WORKFLOW: string
}
