import { describe, it, expect, beforeEach } from 'vitest'

import { LlmUnavailableError } from '@domain/errors/llm-unavailable.error.js'
import type {
  IMessageOrchestrator,
  MessageOrchestratorInput,
} from '@domain/ports/output/i-message-orchestrator.js'
import { FakeConversationRepository } from '@shared/__tests__/helpers/fake-conversation-repository.js'
import { FakeUserRepository } from '@shared/__tests__/helpers/fake-user-repository.js'
import { ok, err } from '@shared/result.js'

import { MessageHandlerService } from './message-handler.service.js'

class FakeOrchestrator implements IMessageOrchestrator {
  private _response = 'Hello from orchestrator'
  readonly calls: MessageOrchestratorInput[] = []

  setResponse(r: string): void {
    this._response = r
  }
  setError(): void {
    this._response = '__error__'
  }

  process(opts: MessageOrchestratorInput) {
    this.calls.push(opts)
    if (this._response === '__error__') {
      return Promise.resolve(err(new LlmUnavailableError('test error')))
    }
    return Promise.resolve(ok(this._response))
  }
}

describe('MessageHandlerService', () => {
  let userRepo: FakeUserRepository
  let conversationRepo: FakeConversationRepository
  let orchestrator: FakeOrchestrator
  let service: MessageHandlerService

  beforeEach(() => {
    userRepo = new FakeUserRepository()
    conversationRepo = new FakeConversationRepository()
    orchestrator = new FakeOrchestrator()
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
