import type { Message } from '@domain/model/message.js'
import type { IConversationRepository } from '@domain/ports/output/i-conversation-repository.js'
import type { IMessageOrchestrator } from '@domain/ports/output/i-message-orchestrator.js'
import type { IUserRepository } from '@domain/ports/output/i-user-repository.js'
import { MAX_CONVERSATION_HISTORY } from '@shared/constants.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

export type ProcessMessageInput = {
  readonly telegramId: number
  readonly firstName: string
  readonly text: string
  /** Optional callback invoked after triage, before a long-running workflow starts. */
  readonly onProgress?: () => Promise<void>
}

export type ProcessMessageOutput = {
  readonly reply: string
}

/**
 * Domain service that orchestrates the core message handling flow:
 * resolve user → load/create conversation → delegate to orchestrator → persist reply.
 */
export class MessageHandlerService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly orchestrator: IMessageOrchestrator,
  ) {}

  async process(input: ProcessMessageInput): Promise<AppResult<ProcessMessageOutput>> {
    // 1. Resolve user
    const userResult = await this.userRepo.findByTelegramId(input.telegramId)
    if (userResult.isErr()) return err(userResult.error)
    const user = userResult.value
    if (!user) return ok({ reply: '' })

    // 2. Load or create conversation
    const convoResult = await this.conversationRepo.findByUserId(user.id)
    if (convoResult.isErr()) return err(convoResult.error)
    let conversation = convoResult.value
    if (!conversation) {
      const createResult = await this.conversationRepo.create(user.id)
      if (createResult.isErr()) return err(createResult.error)
      conversation = createResult.value
    }

    // 3. Persist the user message
    const userMessage: Message = { role: 'user', content: input.text, createdAt: new Date() }
    const appendResult = await this.conversationRepo.appendMessage({
      conversationId: conversation.id,
      message: userMessage,
    })
    if (appendResult.isErr()) return err(appendResult.error)

    const history = appendResult.value.messages.slice(-MAX_CONVERSATION_HISTORY)

    // 4. Delegate to the multi-agent orchestrator
    const orchestratorResult = await this.orchestrator.process({
      userMessage: input.text,
      userName: input.firstName,
      userId: user.id,
      conversationHistory: history,
      ...(input.onProgress && { onProgress: input.onProgress }),
    })
    if (orchestratorResult.isErr()) return err(orchestratorResult.error)

    const reply = orchestratorResult.value

    // 5. Persist the assistant reply
    const assistantMessage: Message = { role: 'assistant', content: reply, createdAt: new Date() }
    await this.conversationRepo.appendMessage({
      conversationId: appendResult.value.id,
      message: assistantMessage,
    })

    return ok({ reply })
  }
}
