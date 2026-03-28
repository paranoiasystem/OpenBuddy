import { describe, it, expect, beforeEach } from 'vitest'

import { FakeConversationRepository } from '@shared/__tests__/helpers/fake-conversation-repository.js'
import { FakeMessageOrchestrator } from '@shared/__tests__/helpers/fake-message-orchestrator.js'
import { FakeUserRepository } from '@shared/__tests__/helpers/fake-user-repository.js'

import { HandleMessageUseCase } from './handle-message.use-case.js'

describe('HandleMessageUseCase', () => {
  let userRepo: FakeUserRepository
  let conversationRepo: FakeConversationRepository
  let orchestrator: FakeMessageOrchestrator
  let useCase: HandleMessageUseCase

  beforeEach(() => {
    userRepo = new FakeUserRepository()
    conversationRepo = new FakeConversationRepository()
    orchestrator = new FakeMessageOrchestrator()
    useCase = new HandleMessageUseCase(userRepo, conversationRepo, orchestrator)
  })

  it('should create user and return reply when user does not exist', async () => {
    orchestrator.setResponse('Ciao!')

    const result = await useCase.execute({
      telegramId: 123,
      username: 'marco',
      firstName: 'Marco',
      text: 'Hello',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.reply).toBe('Ciao!')
    }
  })

  it('should return reply when user already exists', async () => {
    await userRepo.save({ telegramId: 123, username: 'marco', firstName: 'Marco' })
    orchestrator.setResponse('Welcome back!')

    const result = await useCase.execute({
      telegramId: 123,
      username: 'marco',
      firstName: 'Marco',
      text: 'Hi again',
    })

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.reply).toBe('Welcome back!')
    }
  })

  it('should propagate orchestrator errors', async () => {
    await userRepo.save({ telegramId: 123, username: 'marco', firstName: 'Marco' })
    orchestrator.setError()

    const result = await useCase.execute({
      telegramId: 123,
      username: 'marco',
      firstName: 'Marco',
      text: 'test',
    })

    expect(result.isErr()).toBe(true)
  })
})
