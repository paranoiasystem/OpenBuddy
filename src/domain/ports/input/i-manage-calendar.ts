import type { CalendarEvent, CreateCalendarEventInput } from '@domain/model/calendar-event.js'
import type { AppResult } from '@shared/result.js'

/** Input port: Google Calendar operations. */
export type IManageCalendar = {
  createEvent(input: CreateCalendarEventInput): Promise<AppResult<CalendarEvent>>
  listUpcomingEvents(opts: {
    maxResults?: number
  }): Promise<AppResult<ReadonlyArray<CalendarEvent>>>
}
