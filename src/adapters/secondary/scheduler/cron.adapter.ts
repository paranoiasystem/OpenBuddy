import cron from 'node-cron'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IManageSchedule } from '@domain/ports/input/i-manage-schedule.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { ScheduleService } from '@domain/service/schedule.service.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

type TaskCallback = (task: ScheduledTask) => Promise<void>

/**
 * IManageSchedule implementation using node-cron.
 * Registers/deregisters cron jobs alongside persistence operations.
 */
export class CronAdapter implements IManageSchedule {
  private readonly service: ScheduleService
  private readonly jobs: Map<string, cron.ScheduledTask> = new Map()

  constructor(
    taskRepo: IScheduledTaskRepository,
    private readonly onTick: TaskCallback,
  ) {
    this.service = new ScheduleService(taskRepo)
  }

  async create(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>> {
    if (!cron.validate(input.cronExpression)) {
      return err(
        new ExternalServiceError('Cron', `Invalid cron expression: ${input.cronExpression}`),
      )
    }

    const result = await this.service.create(input)
    if (result.isErr()) return result

    const task = result.value
    this.registerJob(task)
    return ok(task)
  }

  list(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    return this.service.list(userId)
  }

  async delete(opts: { taskId: string; userId: string }): Promise<AppResult<void>> {
    const result = await this.service.delete(opts)
    if (result.isErr()) return result

    const job = this.jobs.get(opts.taskId)
    if (job) {
      job.stop()
      this.jobs.delete(opts.taskId)
    }
    return ok(undefined)
  }

  /** Registers an in-memory cron job for the given task. */
  private registerJob(task: ScheduledTask): void {
    const job = cron.schedule(task.cronExpression, () => {
      void this.onTick(task).catch((cause: unknown) => {
        logger.error({ cause, taskId: task.id }, 'Scheduled task execution error')
      })
    })
    this.jobs.set(task.id, job)
  }

  /** Must be called at startup to re-register all persisted enabled tasks. */
  registerAll(tasks: ReadonlyArray<ScheduledTask>): Promise<void> {
    for (const task of tasks) {
      if (task.enabled && cron.validate(task.cronExpression)) {
        this.registerJob(task)
      }
    }
    logger.info({ count: tasks.length }, 'Registered scheduled tasks')
    return Promise.resolve()
  }
}
