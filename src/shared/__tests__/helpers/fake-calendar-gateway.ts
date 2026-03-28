import type { CalendarEvent, CreateCalendarEventInput } from '@domain/model/calendar-event.js'
import type { ICalendarGateway } from '@domain/ports/output/i-calendar-gateway.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for ICalendarGateway. Reset in beforeEach. */
export class FakeCalendarGateway implements ICalendarGateway {
  private events: CalendarEvent[] = []
  private counter = 0

  reset(): void {
    this.events = []
    this.counter = 0
  }

  createEvent(input: CreateCalendarEventInput): Promise<AppResult<CalendarEvent>> {
    const event: CalendarEvent = {
      id: `event-${++this.counter}`,
      title: input.title,
      description: input.description,
      startAt: input.startAt,
      endAt: input.endAt,
      location: input.location,
    }
    this.events.push(event)
    return Promise.resolve(ok(event))
  }

  listUpcomingEvents(_maxResults: number): Promise<AppResult<ReadonlyArray<CalendarEvent>>> {
    return Promise.resolve(ok(this.events))
  }
}
