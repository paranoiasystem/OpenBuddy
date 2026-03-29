import { describe, it, expect, beforeEach } from 'vitest'

import { LlmUnavailableError } from '@domain/errors/llm-unavailable.error.js'
import { FakeConversationRepository } from '@shared/__tests__/helpers/fake-conversation-repository.js'
import { FakeMessageOrchestrator } from '@shared/__tests__/helpers/fake-message-orchestrator.js'
import { FakeUserRepository } from '@shared/__tests__/helpers/fake-user-repository.js'

import { MessageHandlerService } from './message-handler.service.js'

describe('MessageHandlerService', () => {
  let userRepo: FakeUserRepository
  let conversationRepo: FakeConversationRepository
  let orchestrator: FakeMessageOrchestrator
  let service: MessageHandlerService

  beforeEach(() => {
    userRepo = new FakeUserRepository()
    conversationRepo = new FakeConversationRepository()
    orchestrator = new FakeMessageOrchestrator()
    service = new MessageHandlerService(userRepo, conversationRepo, orchestrator)
  })

  describe('process', () => {
    it('should return orchestrator reply when user exists', async () => {
      await userRepo.save({ telegramId: 123, username: 'marco', firstName: 'Marco' })
      orchestrator.setResponse('Ciao Marco!')

      const result = await service.process({ telegramId: 123, firstName: 'Marco', text: 'Ciao' })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.reply).toBe('Ciao Marco!')
      }
    })

    it('should return ok with empty reply when user does not exist', async () => {
      const result = await service.process({ telegramId: 999, firstName: 'Unknown', text: 'test' })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.reply).toBe('')
      }
    })

    it('should pass conversation history to the orchestrator', async () => {
      const user = await userRepo.save({ telegramId: 123, username: 'marco', firstName: 'Marco' })
      if (user.isErr()) return

      const convo = await conversationRepo.create(user.value.id)
      if (convo.isErr()) return
      await conversationRepo.appendMessage({
        conversationId: convo.value.id,
        message: { role: 'user', content: 'previous message', createdAt: new Date() },
      })

      await service.process({ telegramId: 123, firstName: 'Marco', text: 'new message' })

      expect(orchestrator.calls).toHaveLength(1)
      const call = orchestrator.calls[0]
      expect(call).toBeDefined()
      if (call) {
        expect(call.conversationHistory.length).toBeGreaterThan(0)
      }
    })

    it('should propagate orchestrator errors', async () => {
      await userRepo.save({ telegramId: 123, username: 'marco', firstName: 'Marco' })
      orchestrator.setError()

      const result = await service.process({ telegramId: 123, firstName: 'Marco', text: 'test' })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(LlmUnavailableError)
      }
    })
  })
})
