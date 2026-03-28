import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { ScheduleService } from '@domain/service/schedule.service.js'
import type { AppResult } from '@shared/result.js'

/** Deletes a scheduled task, verifying the requesting user owns it. */
export class DeleteScheduledTaskUseCase {
  private readonly service: ScheduleService

  constructor(taskRepo: IScheduledTaskRepository) {
    this.service = new ScheduleService(taskRepo)
  }

  execute(opts: { taskId: string; userId: string }): Promise<AppResult<void>> {
    return this.service.delete(opts)
  }
}
