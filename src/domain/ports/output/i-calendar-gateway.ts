import type { CalendarEvent, CreateCalendarEventInput } from '@domain/model/calendar-event.js'
import type { AppResult } from '@shared/result.js'

/** Output port: Google Calendar API contract. */
export type ICalendarGateway = {
  createEvent(input: CreateCalendarEventInput): Promise<AppResult<CalendarEvent>>
  listUpcomingEvents(maxResults: number): Promise<AppResult<ReadonlyArray<CalendarEvent>>>
}
