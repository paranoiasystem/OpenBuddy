import type { CalendarEvent, CreateCalendarEventInput } from '@domain/model/calendar-event.js'
import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import type { AppResult } from '@shared/result.js'

const DEFAULT_MAX_RESULTS = 10

/**
 * Domain service for calendar operations.
 * Delegates to the ICalendarGateway output port — no Google SDK knowledge here.
 */
export class CalendarService {
  constructor(private readonly calendarGateway: ICalendarGateway) {}

  /** Creates a new calendar event. */
  createEvent(input: CreateCalendarEventInput): Promise<AppResult<CalendarEvent>> {
    return this.calendarGateway.createEvent(input)
  }

  /** Lists upcoming events, defaulting to the next 10. */
  listUpcomingEvents(
    maxResults = DEFAULT_MAX_RESULTS,
  ): Promise<AppResult<ReadonlyArray<CalendarEvent>>> {
    return this.calendarGateway.listUpcomingEvents(maxResults)
  }
}
