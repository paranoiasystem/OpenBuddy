import type { EmailDraft } from '@domain/model/email-draft.js'
import type { EmailMessage } from '@domain/model/email-message.js'
import type { AppResult } from '@shared/result.js'

export type ListMessagesOptions = {
  maxResults?: number
  labelIds?: string[]
}

export type ModifyLabelsOptions = {
  messageId: string
  addLabelIds?: string[]
  removeLabelIds?: string[]
}

export type EmailAttachmentData = {
  readonly filename: string
  readonly mimeType: string
  /** Base64-encoded attachment content. */
  readonly data: string
  readonly size: number
}

/** Output port: Gmail API contract. */
export type IEmailGateway = {
  sendDraft(draft: EmailDraft): Promise<AppResult<void>>
  listMessages(opts: ListMessagesOptions): Promise<AppResult<EmailMessage[]>>
  searchMessages(query: string, maxResults?: number): Promise<AppResult<EmailMessage[]>>
  archiveMessage(messageId: string): Promise<AppResult<void>>
  modifyLabels(opts: ModifyLabelsOptions): Promise<AppResult<void>>
  markAsRead(messageId: string): Promise<AppResult<void>>
  trashMessage(messageId: string): Promise<AppResult<void>>
  getAttachment(messageId: string, attachmentId: string): Promise<AppResult<EmailAttachmentData>>
}
