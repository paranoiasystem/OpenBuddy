import type { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'

import { CalendarAuthError } from '@domain/errors/calendar-auth.error.js'
import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { CalendarEvent, CreateCalendarEventInput } from '@domain/model/calendar-event.js'
import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** ICalendarGateway implementation backed by Google Calendar API v3. */
export class GoogleCalendarGateway implements ICalendarGateway {
  private readonly calendar: ReturnType<typeof google.calendar>

  constructor(auth: OAuth2Client) {
    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async createEvent(input: CreateCalendarEventInput): Promise<AppResult<CalendarEvent>> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          start: { dateTime: input.startAt.toISOString() },
          end: { dateTime: input.endAt.toISOString() },
        },
      })

      const event = response.data
      if (!event.id) {
        return err(new ExternalServiceError('Google Calendar', 'missing event id in response'))
      }

      const startRaw = event.start?.dateTime ?? event.start?.date
      const endRaw = event.end?.dateTime ?? event.end?.date
      if (!startRaw || !endRaw) {
        logger.warn(
          { eventId: event.id },
          'Event created but response missing start/end — returning input dates',
        )
        return ok({
          id: event.id,
          title: event.summary ?? input.title,
          description: event.description ?? undefined,
          startAt: input.startAt,
          endAt: input.endAt,
          location: event.location ?? undefined,
        })
      }

      return ok({
        id: event.id,
        title: event.summary ?? input.title,
        description: event.description ?? undefined,
        startAt: new Date(startRaw),
        endAt: new Date(endRaw),
        location: event.location ?? undefined,
      })
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Google Calendar createEvent error')
      if (isAuthError(cause)) return err(new CalendarAuthError())
      return err(new ExternalServiceError('Google Calendar', String(cause)))
    }
  }

  async listUpcomingEvents(maxResults: number): Promise<AppResult<ReadonlyArray<CalendarEvent>>> {
    try {
      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events = (response.data.items ?? [])
        .filter(
          (e) => e.id && (e.start?.dateTime ?? e.start?.date) && (e.end?.dateTime ?? e.end?.date),
        )
        .map((e) => ({
          id: e.id!,
          title: e.summary ?? '(no title)',
          description: e.description ?? undefined,
          startAt: new Date((e.start!.dateTime ?? e.start!.date)!),
          endAt: new Date((e.end!.dateTime ?? e.end!.date)!),
          location: e.location ?? undefined,
        }))

      return ok(events)
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Google Calendar listUpcomingEvents error')
      if (isAuthError(cause)) return err(new CalendarAuthError())
      return err(new ExternalServiceError('Google Calendar', String(cause)))
    }
  }
}

function isAuthError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const obj = e as Record<string, unknown>
  const code = obj['code']
  const status = (obj['response'] as Record<string, unknown> | undefined)?.['status']
  return code === 401 || code === 403 || status === 401 || status === 403
}

/** Extract human-readable fields from Google API (GaxiosError) for structured logging. */
function serializeApiError(cause: unknown): Record<string, unknown> {
  if (typeof cause !== 'object' || cause === null) return { cause: String(cause) }
  const obj = cause as Record<string, unknown>
  const response = obj['response'] as Record<string, unknown> | undefined
  return {
    message: obj['message'] ?? String(cause),
    status: response?.['status'] ?? obj['code'],
    data: response?.['data'],
  }
}
