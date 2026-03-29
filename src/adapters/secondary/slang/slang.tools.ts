import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import type { IEmailGateway } from '@domain/ports/output/i-email-gateway.js'
import { logger } from '@shared/logger.js'

import {
  archiveEmail,
  getEmailAttachment,
  listEmails,
  markEmailAsRead,
  modifyEmailLabels,
  searchEmails,
  sendEmail,
  trashEmail,
} from './slang.email-tools.js'

/** Shape of a SLANG tool handler: receives args, returns a string result. */
export type SlangToolHandler = (args: Record<string, unknown>) => Promise<string>

export type SlangToolRegistry = Record<string, SlangToolHandler>

type ToolDependencies = {
  readonly calendarGateway: ICalendarGateway | undefined
  readonly emailGateway: IEmailGateway | undefined
  readonly timezone: string
}

/**
 * Builds the tool registry injected into every SLANG workflow run.
 * Tools are the bridge between SLANG agents and the secondary adapters.
 */
export function buildToolRegistry(deps: ToolDependencies): SlangToolRegistry {
  return {
    get_current_datetime: getCurrentDatetime(deps.timezone),
    list_calendar_events: listCalendarEvents(deps.calendarGateway),
    create_calendar_event: createCalendarEvent(deps.calendarGateway, deps.timezone),
    list_emails: listEmails(deps.emailGateway),
    search_emails: searchEmails(deps.emailGateway),
    send_email: sendEmail(deps.emailGateway),
    archive_email: archiveEmail(deps.emailGateway),
    modify_email_labels: modifyEmailLabels(deps.emailGateway),
    mark_email_as_read: markEmailAsRead(deps.emailGateway),
    trash_email: trashEmail(deps.emailGateway),
    get_email_attachment: getEmailAttachment(deps.emailGateway),
  }
}

// ─── Tool implementations ────────────────────────────────────────────────────

function getCurrentDatetime(timezone: string) {
  return (_args: Record<string, unknown>): Promise<string> => {
    const now = new Date()
    return Promise.resolve(
      JSON.stringify({
        iso: now.toISOString(),
        readable: now.toLocaleString('it-IT', { timeZone: timezone }),
        date: now.toLocaleDateString('it-IT', { timeZone: timezone }),
        time: now.toLocaleTimeString('it-IT', { timeZone: timezone }),
        dayOfWeek: now.toLocaleDateString('it-IT', { weekday: 'long', timeZone: timezone }),
        timezone,
      }),
    )
  }
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

function createCalendarEvent(gateway: ICalendarGateway | undefined, timezone: string) {
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

    const startAt = new Date(ensureTimezoneOffset(String(args['start_at']), timezone))
    const endAt = new Date(ensureTimezoneOffset(String(args['end_at']), timezone))

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

// ─── Timezone helpers ─────────────────────────────────────────────────────────

/** Computes the UTC offset string (e.g. "+02:00") for a given date and IANA timezone. */
export function getTimezoneOffset(date: Date, timezone: string): string {
  const utcParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)

  const localParts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)

  const get = (parts: Intl.DateTimeFormatPart[], type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0)

  const utcMinutes =
    Date.UTC(
      get(utcParts, 'year'),
      get(utcParts, 'month') - 1,
      get(utcParts, 'day'),
      get(utcParts, 'hour'),
      get(utcParts, 'minute'),
    ) / 60000
  const localMinutes =
    Date.UTC(
      get(localParts, 'year'),
      get(localParts, 'month') - 1,
      get(localParts, 'day'),
      get(localParts, 'hour'),
      get(localParts, 'minute'),
    ) / 60000

  const offsetMinutes = localMinutes - utcMinutes
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const absMinutes = Math.abs(offsetMinutes)
  const h = String(Math.floor(absMinutes / 60)).padStart(2, '0')
  const m = String(absMinutes % 60).padStart(2, '0')
  return `${sign}${h}:${m}`
}

/**
 * If an ISO datetime string lacks a timezone offset (naive), appends the
 * configured timezone offset so that `new Date()` interprets it correctly.
 */
function ensureTimezoneOffset(isoString: string, timezone: string): string {
  const trimmed = isoString.trim()
  if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed
  }
  const refDate = new Date(trimmed + 'Z')
  if (isNaN(refDate.getTime())) return trimmed
  return trimmed + getTimezoneOffset(refDate, timezone)
}
