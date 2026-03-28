import type { Message } from '@domain/model/message.js'
import type { AppResult } from '@shared/result.js'

/** Output port: routes a user message through the multi-agent workflow pipeline. */
export type IMessageOrchestrator = {
  process(opts: MessageOrchestratorInput): Promise<AppResult<string>>
}

export type MessageOrchestratorInput = {
  /** Raw text from the user. */
  readonly userMessage: string
  /** First name of the user (used in greetings). */
  readonly userName: string
  /** Internal user ID for tool calls that need user context. */
  readonly userId: string
  /** Recent conversation history passed as context to the chat workflow. */
  readonly conversationHistory: ReadonlyArray<Message>
}
