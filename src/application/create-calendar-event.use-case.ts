import type { CalendarEvent, CreateCalendarEventInput } from '@domain/model/calendar-event.js'
import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import { CalendarService } from '@domain/service/calendar.service.js'
import type { AppResult } from '@shared/result.js'

/** Creates a new Google Calendar event. */
export class CreateCalendarEventUseCase {
  private readonly service: CalendarService

  constructor(calendarGateway: ICalendarGateway) {
    this.service = new CalendarService(calendarGateway)
  }

  execute(input: CreateCalendarEventInput): Promise<AppResult<CalendarEvent>> {
    return this.service.createEvent(input)
  }
}
