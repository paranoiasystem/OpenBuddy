import type { Message } from './message.js'

/** Aggregate holding the history of a user's conversation with the bot. */
export type Conversation = {
  readonly id: string
  readonly userId: string
  readonly messages: ReadonlyArray<Message>
  readonly createdAt: Date
  readonly updatedAt: Date
}

/** Result of appending a new message to a conversation. */
export type ConversationWithNewMessage = {
  readonly conversation: Conversation
  readonly addedMessage: Message
}
