/** A recurring task executed by the cron scheduler. */
export type ScheduledTask = {
  readonly id: string
  readonly userId: string
  readonly cronExpression: string
  readonly description: string
  readonly prompt: string
  readonly enabled: boolean
  readonly createdAt: Date
}

/** Data required to create a new scheduled task. */
export type CreateScheduledTaskInput = {
  readonly userId: string
  readonly cronExpression: string
  readonly description: string
  readonly prompt: string
}
