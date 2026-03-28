import type { Message } from '@domain/model/message.js'
import type { AppResult } from '@shared/result.js'

/** Output port: LLM completion contract. */
export type ILlmGateway = {
  complete(opts: LlmCompletionOptions): Promise<AppResult<string>>
}

export type LlmCompletionOptions = {
  readonly model?: string
  readonly messages: ReadonlyArray<Message>
  readonly systemPrompt?: string
  readonly maxTokens?: number
  readonly temperature?: number
}
