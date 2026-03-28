import type { ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import type { AppResult } from '@shared/result.js'

/** Lists all scheduled tasks belonging to a user. */
export class ListScheduledTasksUseCase {
  constructor(private readonly taskRepo: IScheduledTaskRepository) {}

  execute(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    return this.taskRepo.findByUserId(userId)
  }
}
