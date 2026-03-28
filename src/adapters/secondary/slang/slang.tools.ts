import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import type { IEmailGateway } from '@domain/ports/output/i-email-gateway.js'
import { logger } from '@shared/logger.js'

/** Shape of a SLANG tool handler: receives args, returns a string result. */
export type SlangToolHandler = (args: Record<string, unknown>) => Promise<string>

export type SlangToolRegistry = Record<string, SlangToolHandler>

type ToolDependencies = {
  readonly calendarGateway: ICalendarGateway | undefined
  readonly emailGateway: IEmailGateway | undefined
}

/**
 * Builds the tool registry injected into every SLANG workflow run.
 * Tools are the bridge between SLANG agents and the secondary adapters.
 */
export function buildToolRegistry(deps: ToolDependencies): SlangToolRegistry {
  return {
    get_current_datetime: getCurrentDatetime,
    list_calendar_events: listCalendarEvents(deps.calendarGateway),
    create_calendar_event: createCalendarEvent(deps.calendarGateway),
    list_emails: listEmails(deps.emailGateway),
    search_emails: searchEmails(deps.emailGateway),
    send_email: sendEmail(deps.emailGateway),
  }
}

// ─── Tool implementations ────────────────────────────────────────────────────

function getCurrentDatetime(_args: Record<string, unknown>): Promise<string> {
  const now = new Date()
  return Promise.resolve(
    JSON.stringify({
      iso: now.toISOString(),
      readable: now.toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
      date: now.toLocaleDateString('it-IT'),
      time: now.toLocaleTimeString('it-IT'),
      dayOfWeek: now.toLocaleDateString('it-IT', { weekday: 'long' }),
    }),
  )
}

function listCalendarEvents(gateway: ICalendarGateway | undefined) {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({ configured: false, message: 'Google Calendar not configured.' })
    }
    const maxResults = typeof args['max_results'] === 'number' ? args['max_results'] : 10
    const result = await gateway.listUpcomingEvents(maxResults)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'list_calendar_events tool error')
      return JSON.stringify({ configured: true, error: result.error.message, events: [] })
    }
    return JSON.stringify({ configured: true, events: result.value })
  }
}

function createCalendarEvent(gateway: ICalendarGateway | undefined) {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({ configured: false, message: 'Google Calendar not configured.' })
    }

    const title = String(args['title'] ?? '').trim()
    if (!title || title.toLowerCase() === 'untitled') {
      return JSON.stringify({
        success: false,
        error: 'A descriptive title is required. Do not create events without a specific title.',
      })
    }

    if (!args['start_at'] || !args['end_at']) {
      return JSON.stringify({
        success: false,
        error: 'Both start_at and end_at (ISO 8601 datetime) are required.',
      })
    }

    const startAt = new Date(String(args['start_at']))
    const endAt = new Date(String(args['end_at']))

    if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
      return JSON.stringify({ success: false, error: 'Invalid date format. Use ISO 8601.' })
    }

    const description = args['description'] ? String(args['description']) : undefined
    const location = args['location'] ? String(args['location']) : undefined

    const result = await gateway.createEvent({
      title,
      startAt,
      endAt,
      ...(description !== undefined ? { description } : {}),
      ...(location !== undefined ? { location } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'create_calendar_event tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, event: result.value })
  }
}

function listEmails(gateway: IEmailGateway | undefined) {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({
        configured: false,
        message: 'Gmail not configured. Run /auth to authenticate.',
        emails: [],
        unread_count: 0,
      })
    }
    const maxResults = typeof args['max_results'] === 'number' ? args['max_results'] : 10
    const labelIds = Array.isArray(args['label_ids']) ? (args['label_ids'] as string[]) : undefined

    const result = await gateway.listMessages({
      maxResults,
      ...(labelIds !== undefined ? { labelIds } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'list_emails tool error')
      return JSON.stringify({ configured: true, error: result.error.message, emails: [] })
    }
    return JSON.stringify({
      configured: true,
      emails: result.value,
      unread_count: result.value.filter((m) => m.isUnread).length,
    })
  }
}

function searchEmails(gateway: IEmailGateway | undefined) {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({
        configured: false,
        message: 'Gmail not configured. Run /auth to authenticate.',
        emails: [],
      })
    }
    const query = String(args['query'] ?? '')
    const maxResults = typeof args['max_results'] === 'number' ? args['max_results'] : 10

    const result = await gateway.searchMessages(query, maxResults)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'search_emails tool error')
      return JSON.stringify({ configured: true, error: result.error.message, emails: [] })
    }
    return JSON.stringify({ configured: true, emails: result.value })
  }
}

function sendEmail(gateway: IEmailGateway | undefined) {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({
        configured: false,
        message: 'Gmail not configured. Run /auth to authenticate.',
      })
    }
    const to = Array.isArray(args['to']) ? (args['to'] as string[]) : [String(args['to'] ?? '')]
    const subject = String(args['subject'] ?? '')
    const body = String(args['body'] ?? '')
    const cc = Array.isArray(args['cc']) ? (args['cc'] as string[]) : undefined

    const result = await gateway.sendDraft({
      to,
      subject,
      body,
      ...(cc !== undefined ? { cc } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'send_email tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, message: 'Email sent successfully.' })
  }
}
