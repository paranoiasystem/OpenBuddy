import type { Conversation } from '@domain/model/conversation.js'
import type { Message } from '@domain/model/message.js'
import type { AppResult } from '@shared/result.js'

/** Output port: persistence contract for conversations. */
export type IConversationRepository = {
  findByUserId(userId: string): Promise<AppResult<Conversation | undefined>>
  appendMessage(opts: {
    conversationId: string
    message: Message
  }): Promise<AppResult<Conversation>>
  create(userId: string): Promise<AppResult<Conversation>>
}
