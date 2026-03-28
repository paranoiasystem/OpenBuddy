import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for IScheduledTaskRepository. Reset in beforeEach. */
export class FakeScheduledTaskRepository implements IScheduledTaskRepository {
  private tasks: Map<string, ScheduledTask> = new Map()
  private counter = 0

  reset(): void {
    this.tasks = new Map()
    this.counter = 0
  }

  findById(id: string): Promise<AppResult<ScheduledTask | undefined>> {
    return Promise.resolve(ok(this.tasks.get(id)))
  }

  findByUserId(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    return Promise.resolve(ok([...this.tasks.values()].filter((t) => t.userId === userId)))
  }

  findAllEnabled(): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    return Promise.resolve(ok([...this.tasks.values()].filter((t) => t.enabled)))
  }

  save(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>> {
    const id = `task-${++this.counter}`
    const task: ScheduledTask = { id, ...input, enabled: true, createdAt: new Date() }
    this.tasks.set(id, task)
    return Promise.resolve(ok(task))
  }

  delete(id: string): Promise<AppResult<void>> {
    this.tasks.delete(id)
    return Promise.resolve(ok(undefined))
  }
}
