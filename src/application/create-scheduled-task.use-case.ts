import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { ScheduleService } from '@domain/service/schedule.service.js'
import type { AppResult } from '@shared/result.js'

/** Creates a new scheduled task after enforcing domain invariants. */
export class CreateScheduledTaskUseCase {
  private readonly service: ScheduleService

  constructor(taskRepo: IScheduledTaskRepository) {
    this.service = new ScheduleService(taskRepo)
  }

  execute(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>> {
    return this.service.create(input)
  }
}
