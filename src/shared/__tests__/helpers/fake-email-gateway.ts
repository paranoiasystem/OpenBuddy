import type { EmailDraft } from '@domain/model/email-draft.js'
import type { EmailMessage } from '@domain/model/email-message.js'
import type { IEmailGateway, ListMessagesOptions } from '@domain/ports/output/i-email-gateway.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for IEmailGateway. Reset in beforeEach. */
export class FakeEmailGateway implements IEmailGateway {
  readonly sentDrafts: EmailDraft[] = []
  private _messages: EmailMessage[] = []

  reset(): void {
    this.sentDrafts.length = 0
    this._messages = []
  }

  setMessages(messages: EmailMessage[]): void {
    this._messages = messages
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
}
