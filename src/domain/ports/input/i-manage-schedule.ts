import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { AppResult } from '@shared/result.js'

/** Input port: CRUD operations for scheduled tasks. */
export type IManageSchedule = {
  create(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>>
  list(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>>
  delete(opts: { taskId: string; userId: string }): Promise<AppResult<void>>
}
