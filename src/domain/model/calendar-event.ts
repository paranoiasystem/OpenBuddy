/** A calendar event value object. */
export type CalendarEvent = {
  readonly id: string
  readonly title: string
  readonly description: string | undefined
  readonly startAt: Date
  readonly endAt: Date
  readonly location: string | undefined
}

/** Data required to create a new calendar event. */
export type CreateCalendarEventInput = {
  readonly title: string
  readonly description?: string
  readonly startAt: Date
  readonly endAt: Date
  readonly location?: string
}
