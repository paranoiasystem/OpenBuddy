import { ScheduleConflictError } from '@domain/errors/schedule-conflict.error.js'
import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/**
 * Domain service for scheduled task business rules.
 * Enforces the invariant that a user cannot have two tasks with the same cron expression.
 */
export class ScheduleService {
  constructor(private readonly taskRepo: IScheduledTaskRepository) {}

  /** Creates a new scheduled task, rejecting duplicates by cron expression per user. */
  async create(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>> {
    const existingResult = await this.taskRepo.findByUserId(input.userId)
    if (existingResult.isErr()) return err(existingResult.error)

    const duplicate = existingResult.value.find(
      (task) => task.cronExpression === input.cronExpression,
    )
    if (duplicate) {
      return err(new ScheduleConflictError(input.cronExpression))
    }

    return this.taskRepo.save(input)
  }

  /** Lists all scheduled tasks for a user. */
  list(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    return this.taskRepo.findByUserId(userId)
  }

  /** Deletes a task, verifying ownership. */
  async delete(opts: { taskId: string; userId: string }): Promise<AppResult<void>> {
    const taskResult = await this.taskRepo.findById(opts.taskId)
    if (taskResult.isErr()) return err(taskResult.error)

    const task = taskResult.value
    if (!task || task.userId !== opts.userId) {
      return ok(undefined)
    }

    return this.taskRepo.delete(opts.taskId)
  }
}
