import type { CalendarEvent } from '@domain/model/calendar-event.js'
import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import { CalendarService } from '@domain/service/calendar.service.js'
import type { AppResult } from '@shared/result.js'

/** Lists upcoming Google Calendar events. */
export class ListCalendarEventsUseCase {
  private readonly service: CalendarService

  constructor(calendarGateway: ICalendarGateway) {
    this.service = new CalendarService(calendarGateway)
  }

  execute(maxResults?: number): Promise<AppResult<ReadonlyArray<CalendarEvent>>> {
    return this.service.listUpcomingEvents(maxResults)
  }
}
