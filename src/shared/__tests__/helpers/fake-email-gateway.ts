import type { EmailDraft } from '@domain/model/email-draft.js'
import type { EmailMessage } from '@domain/model/email-message.js'
import type {
  EmailAttachmentData,
  IEmailGateway,
  ListMessagesOptions,
  ModifyLabelsOptions,
} from '@domain/ports/output/i-email-gateway.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for IEmailGateway. Reset in beforeEach. */
export class FakeEmailGateway implements IEmailGateway {
  readonly sentDrafts: EmailDraft[] = []
  readonly archivedIds: string[] = []
  readonly labelModifications: ModifyLabelsOptions[] = []
  readonly markedAsReadIds: string[] = []
  readonly trashedIds: string[] = []
  readonly attachmentRequests: Array<{ messageId: string; attachmentId: string }> = []

  private _messages: EmailMessage[] = []
  private _attachmentData: EmailAttachmentData = {
    filename: 'test.pdf',
    mimeType: 'application/pdf',
    data: 'dGVzdA==',
    size: 4,
  }

  reset(): void {
    this.sentDrafts.length = 0
    this.archivedIds.length = 0
    this.labelModifications.length = 0
    this.markedAsReadIds.length = 0
    this.trashedIds.length = 0
    this.attachmentRequests.length = 0
    this._messages = []
  }

  setMessages(messages: EmailMessage[]): void {
    this._messages = messages
  }

  setAttachmentData(data: EmailAttachmentData): void {
    this._attachmentData = data
  }

  sendDraft(draft: EmailDraft): Promise<AppResult<void>> {
    this.sentDrafts.push(draft)
    return Promise.resolve(ok(undefined))
  }

  listMessages(_opts: ListMessagesOptions): Promise<AppResult<EmailMessage[]>> {
    return Promise.resolve(ok(this._messages))
  }

  searchMessages(_query: string, _maxResults?: number): Promise<AppResult<EmailMessage[]>> {
    return Promise.resolve(ok(this._messages))
  }

  archiveMessage(messageId: string): Promise<AppResult<void>> {
    this.archivedIds.push(messageId)
    return Promise.resolve(ok(undefined))
  }

  modifyLabels(opts: ModifyLabelsOptions): Promise<AppResult<void>> {
    this.labelModifications.push(opts)
    return Promise.resolve(ok(undefined))
  }

  markAsRead(messageId: string): Promise<AppResult<void>> {
    this.markedAsReadIds.push(messageId)
    return Promise.resolve(ok(undefined))
  }

  trashMessage(messageId: string): Promise<AppResult<void>> {
    this.trashedIds.push(messageId)
    return Promise.resolve(ok(undefined))
  }

  getAttachment(messageId: string, attachmentId: string): Promise<AppResult<EmailAttachmentData>> {
    this.attachmentRequests.push({ messageId, attachmentId })
    return Promise.resolve(ok(this._attachmentData))
  }
}
