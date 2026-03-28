import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { AppResult } from '@shared/result.js'

/** Output port: persistence contract for scheduled tasks. */
export type IScheduledTaskRepository = {
  findById(id: string): Promise<AppResult<ScheduledTask | undefined>>
  findByUserId(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>>
  findAllEnabled(): Promise<AppResult<ReadonlyArray<ScheduledTask>>>
  save(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>>
  delete(id: string): Promise<AppResult<void>>
}
