/** Role of the message author in a conversation. */
export type MessageRole = 'user' | 'assistant' | 'system'

/** A single message value object within a conversation. */
export type Message = {
  readonly role: MessageRole
  readonly content: string
  readonly createdAt: Date
}
