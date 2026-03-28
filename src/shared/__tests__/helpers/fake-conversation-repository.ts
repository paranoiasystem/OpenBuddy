import type { Conversation } from '@domain/model/conversation.js'
import type { Message } from '@domain/model/message.js'
import type { IConversationRepository } from '@domain/ports/output/i-conversation-repository.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for IConversationRepository. Reset in beforeEach. */
export class FakeConversationRepository implements IConversationRepository {
  private conversations: Map<string, Conversation> = new Map()
  private counter = 0

  reset(): void {
    this.conversations = new Map()
    this.counter = 0
  }

  findByUserId(userId: string): Promise<AppResult<Conversation | undefined>> {
    const convo = [...this.conversations.values()].find((c) => c.userId === userId)
    return Promise.resolve(ok(convo))
  }

  create(userId: string): Promise<AppResult<Conversation>> {
    const id = `convo-${++this.counter}`
    const now = new Date()
    const convo: Conversation = {
      id,
      userId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    this.conversations.set(id, convo)
    return Promise.resolve(ok(convo))
  }

  async appendMessage(opts: {
    conversationId: string
    message: Message
  }): Promise<AppResult<Conversation>> {
    const convo = this.conversations.get(opts.conversationId)
    if (!convo) {
      // Auto-create for test convenience
      const created = await this.create('unknown')
      if (created.isErr()) return created
      return this.appendMessage({ ...opts, conversationId: created.value.id })
    }
    const updated: Conversation = {
      ...convo,
      messages: [...convo.messages, opts.message],
      updatedAt: new Date(),
    }
    this.conversations.set(opts.conversationId, updated)
    return Promise.resolve(ok(updated))
  }
}
