import { describe, it, expect, beforeEach } from 'vitest'

import { FakeScheduledTaskRepository } from '@shared/__tests__/helpers/fake-scheduled-task-repository.js'

import { ListScheduledTasksUseCase } from './list-scheduled-tasks.use-case.js'

describe('ListScheduledTasksUseCase', () => {
  let repo: FakeScheduledTaskRepository
  let useCase: ListScheduledTasksUseCase

  beforeEach(() => {
    repo = new FakeScheduledTaskRepository()
    useCase = new ListScheduledTasksUseCase(repo)
  })

  it('should return tasks for a user', async () => {
    await repo.save({
      userId: 'user-1',
      cronExpression: '0 9 * * *',
      description: 'Task 1',
      prompt: 'p1',
    })

    const result = await useCase.execute('user-1')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(1)
    }
  })

  it('should return empty list when user has no tasks', async () => {
    const result = await useCase.execute('user-1')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(0)
    }
  })
})
