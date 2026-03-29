import { describe, it, expect, beforeEach } from 'vitest'

import { ScheduleConflictError } from '@domain/errors/schedule-conflict.error.js'
import { FakeScheduledTaskRepository } from '@shared/__tests__/helpers/fake-scheduled-task-repository.js'

import { CreateScheduledTaskUseCase } from './create-scheduled-task.use-case.js'

describe('CreateScheduledTaskUseCase', () => {
  let repo: FakeScheduledTaskRepository
  let useCase: CreateScheduledTaskUseCase

  beforeEach(() => {
    repo = new FakeScheduledTaskRepository()
    useCase = new CreateScheduledTaskUseCase(repo)
  })

  it('should create a task when no duplicate exists', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      cronExpression: '0 9 * * *',
      description: 'Morning briefing',
      prompt: 'Give me a morning briefing',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.cronExpression).toBe('0 9 * * *')
      expect(result.value.userId).toBe('user-1')
    }
  })

  it('should return ScheduleConflictError for duplicate cron expression', async () => {
    const input = {
      userId: 'user-1',
      cronExpression: '0 9 * * *',
      description: 'Task',
      prompt: 'prompt',
    }

    await useCase.execute(input)
    const result = await useCase.execute({ ...input, description: 'Duplicate' })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ScheduleConflictError)
    }
  })
})
