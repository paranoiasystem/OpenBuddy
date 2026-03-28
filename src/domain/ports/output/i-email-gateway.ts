import type { EmailDraft } from '@domain/model/email-draft.js'
import type { EmailMessage } from '@domain/model/email-message.js'
import type { AppResult } from '@shared/result.js'

export type ListMessagesOptions = {
  maxResults?: number
  labelIds?: string[]
}

/** Output port: Gmail API contract. */
export type IEmailGateway = {
  sendDraft(draft: EmailDraft): Promise<AppResult<void>>
  listMessages(opts: ListMessagesOptions): Promise<AppResult<EmailMessage[]>>
  searchMessages(query: string, maxResults?: number): Promise<AppResult<EmailMessage[]>>
}
