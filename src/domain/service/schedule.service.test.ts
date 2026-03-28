import { describe, it, expect, beforeEach } from 'vitest'

import { ScheduleConflictError } from '@domain/errors/schedule-conflict.error.js'
import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { ok } from '@shared/result.js'

import { ScheduleService } from './schedule.service.js'

class FakeScheduledTaskRepository implements IScheduledTaskRepository {
  private tasks: Map<string, ScheduledTask> = new Map()
  private counter = 0

  reset(): void {
    this.tasks = new Map()
    this.counter = 0
  }

  findById(id: string) {
    return Promise.resolve(ok(this.tasks.get(id)))
  }

  findByUserId(userId: string) {
    return Promise.resolve(ok([...this.tasks.values()].filter((t) => t.userId === userId)))
  }

  findAllEnabled() {
    return Promise.resolve(ok([...this.tasks.values()].filter((t) => t.enabled)))
  }

  save(input: CreateScheduledTaskInput) {
    const id = `task-${++this.counter}`
    const task: ScheduledTask = { id, ...input, enabled: true, createdAt: new Date() }
    this.tasks.set(id, task)
    return Promise.resolve(ok(task))
  }

  delete(id: string) {
    this.tasks.delete(id)
    return Promise.resolve(ok(undefined))
  }
}

describe('ScheduleService', () => {
  let repo: FakeScheduledTaskRepository
  let service: ScheduleService

  beforeEach(() => {
    repo = new FakeScheduledTaskRepository()
    service = new ScheduleService(repo)
  })

  describe('create', () => {
    it('should create a task when no duplicate cron expression exists', async () => {
      const input: CreateScheduledTaskInput = {
        userId: 'user-1',
        cronExpression: '0 9 * * *',
        description: 'Morning briefing',
        prompt: 'Give me a morning briefing',
      }

      const result = await service.create(input)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.cronExpression).toBe(input.cronExpression)
        expect(result.value.userId).toBe(input.userId)
      }
    })

    it('should return ScheduleConflictError when a task with the same cron expression already exists', async () => {
      const input: CreateScheduledTaskInput = {
        userId: 'user-1',
        cronExpression: '0 9 * * *',
        description: 'Morning briefing',
        prompt: 'Give me a morning briefing',
      }

      await service.create(input)
      const result = await service.create({ ...input, description: 'Duplicate' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(ScheduleConflictError)
      }
    })

    it('should allow the same cron expression for different users', async () => {
      const cronExpression = '0 9 * * *'

      await service.create({ userId: 'user-1', cronExpression, description: 'A', prompt: 'p1' })
      const result = await service.create({
        userId: 'user-2',
        cronExpression,
        description: 'B',
        prompt: 'p2',
      })

      expect(result.isOk()).toBe(true)
    })
  })

  describe('delete', () => {
    it('should delete a task when the user is the owner', async () => {
      const createResult = await service.create({
        userId: 'user-1',
        cronExpression: '0 9 * * *',
        description: 'Task',
        prompt: 'prompt',
      })

      expect(createResult.isOk()).toBe(true)
      if (!createResult.isOk()) return

      const deleteResult = await service.delete({ taskId: createResult.value.id, userId: 'user-1' })
      expect(deleteResult.isOk()).toBe(true)
    })

    it('should return ok without deleting when user does not own the task', async () => {
      const createResult = await service.create({
        userId: 'user-1',
        cronExpression: '0 9 * * *',
        description: 'Task',
        prompt: 'prompt',
      })
      if (!createResult.isOk()) return

      const deleteResult = await service.delete({ taskId: createResult.value.id, userId: 'user-2' })
      expect(deleteResult.isOk()).toBe(true)

      const listResult = await service.list('user-1')
      expect(listResult.isOk()).toBe(true)
      if (listResult.isOk()) {
        expect(listResult.value).toHaveLength(1)
      }
    })
  })
})
