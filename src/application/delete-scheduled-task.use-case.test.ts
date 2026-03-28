import { describe, it, expect, beforeEach } from 'vitest'

import { FakeScheduledTaskRepository } from '@shared/__tests__/helpers/fake-scheduled-task-repository.js'

import { DeleteScheduledTaskUseCase } from './delete-scheduled-task.use-case.js'

describe('DeleteScheduledTaskUseCase', () => {
  let repo: FakeScheduledTaskRepository
  let useCase: DeleteScheduledTaskUseCase

  beforeEach(() => {
    repo = new FakeScheduledTaskRepository()
    useCase = new DeleteScheduledTaskUseCase(repo)
  })

  it('should delete a task when the user is the owner', async () => {
    const saved = await repo.save({
      userId: 'user-1',
      cronExpression: '0 9 * * *',
      description: 'Task',
      prompt: 'prompt',
    })
    if (saved.isErr()) return

    const result = await useCase.execute({ taskId: saved.value.id, userId: 'user-1' })

    expect(result.isOk()).toBe(true)

    const listResult = await repo.findByUserId('user-1')
    if (listResult.isOk()) {
      expect(listResult.value).toHaveLength(0)
    }
  })

  it('should not delete when user does not own the task', async () => {
    const saved = await repo.save({
      userId: 'user-1',
      cronExpression: '0 9 * * *',
      description: 'Task',
      prompt: 'prompt',
    })
    if (saved.isErr()) return

    const result = await useCase.execute({ taskId: saved.value.id, userId: 'user-2' })
    expect(result.isOk()).toBe(true)

    const listResult = await repo.findByUserId('user-1')
    if (listResult.isOk()) {
      expect(listResult.value).toHaveLength(1)
    }
  })
})
