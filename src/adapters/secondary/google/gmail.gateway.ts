import type { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'

import { EmailAuthError } from '@domain/errors/email-auth.error.js'
import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { EmailDraft } from '@domain/model/email-draft.js'
import type { EmailMessage } from '@domain/model/email-message.js'
import type {
  EmailAttachmentData,
  IEmailGateway,
  ListMessagesOptions,
  ModifyLabelsOptions,
} from '@domain/ports/output/i-email-gateway.js'
import { GMAIL_USER_ID } from '@shared/constants.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import { isAuthError, parseMessage, serializeApiError } from './gmail.utils.js'

/** IEmailGateway implementation backed by Gmail API. */
export class GmailGateway implements IEmailGateway {
  private readonly gmail: ReturnType<typeof google.gmail>

  constructor(auth: OAuth2Client) {
    this.gmail = google.gmail({ version: 'v1', auth })
  }

  async sendDraft(draft: EmailDraft): Promise<AppResult<void>> {
    return this.wrapGmailCall('sendDraft', async () => {
      const raw = this.buildRawMessage(draft)
      await this.gmail.users.messages.send({ userId: GMAIL_USER_ID, requestBody: { raw } })
    })
  }

  async listMessages(opts: ListMessagesOptions): Promise<AppResult<EmailMessage[]>> {
    return this.wrapGmailCall('listMessages', async () => {
      const listRes = await this.gmail.users.messages.list({
        userId: GMAIL_USER_ID,
        maxResults: opts.maxResults ?? 10,
        ...(opts.labelIds?.length ? { labelIds: opts.labelIds } : {}),
      })
      const ids = listRes.data.messages ?? []
      const messages = await Promise.all(ids.map((m) => this.fetchAndParse(m.id!)))
      return messages.filter((m): m is EmailMessage => m !== null)
    })
  }

  async searchMessages(query: string, maxResults = 10): Promise<AppResult<EmailMessage[]>> {
    return this.wrapGmailCall('searchMessages', async () => {
      const listRes = await this.gmail.users.messages.list({
        userId: GMAIL_USER_ID,
        q: query,
        maxResults,
      })
      const ids = listRes.data.messages ?? []
      const messages = await Promise.all(ids.map((m) => this.fetchAndParse(m.id!)))
      return messages.filter((m): m is EmailMessage => m !== null)
    })
  }

  async archiveMessage(messageId: string): Promise<AppResult<void>> {
    return this.wrapGmailCall('archiveMessage', async () => {
      await this.gmail.users.messages.modify({
        userId: GMAIL_USER_ID,
        id: messageId,
        requestBody: { removeLabelIds: ['INBOX'] },
      })
    })
  }

  async modifyLabels(opts: ModifyLabelsOptions): Promise<AppResult<void>> {
    return this.wrapGmailCall('modifyLabels', async () => {
      await this.gmail.users.messages.modify({
        userId: GMAIL_USER_ID,
        id: opts.messageId,
        requestBody: {
          ...(opts.addLabelIds?.length ? { addLabelIds: opts.addLabelIds } : {}),
          ...(opts.removeLabelIds?.length ? { removeLabelIds: opts.removeLabelIds } : {}),
        },
      })
    })
  }

  async markAsRead(messageId: string): Promise<AppResult<void>> {
    return this.wrapGmailCall('markAsRead', async () => {
      await this.gmail.users.messages.modify({
        userId: GMAIL_USER_ID,
        id: messageId,
        requestBody: { removeLabelIds: ['UNREAD'] },
      })
    })
  }

  async trashMessage(messageId: string): Promise<AppResult<void>> {
    return this.wrapGmailCall('trashMessage', async () => {
      await this.gmail.users.messages.trash({ userId: GMAIL_USER_ID, id: messageId })
    })
  }

  async getAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<AppResult<EmailAttachmentData>> {
    return this.wrapGmailCall('getAttachment', async () => {
      const msgRes = await this.gmail.users.messages.get({
        userId: GMAIL_USER_ID,
        id: messageId,
        format: 'full',
      })
      const parsed = parseMessage(msgRes.data)
      const meta = parsed?.attachments.find((a) => a.attachmentId === attachmentId)

      const attRes = await this.gmail.users.messages.attachments.get({
        userId: GMAIL_USER_ID,
        messageId,
        id: attachmentId,
      })

      return {
        filename: meta?.filename ?? 'attachment',
        mimeType: meta?.mimeType ?? 'application/octet-stream',
        data: attRes.data.data ?? '',
        size: attRes.data.size ?? 0,
      }
    })
  }

  /** Wraps a Gmail API call with standardised error handling. */
  private async wrapGmailCall<T>(operation: string, fn: () => Promise<T>): Promise<AppResult<T>> {
    try {
      return ok(await fn())
    } catch (cause) {
      logger.error(serializeApiError(cause), `Gmail ${operation} error`)
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  private async fetchAndParse(id: string): Promise<EmailMessage | null> {
    try {
      const res = await this.gmail.users.messages.get({
        userId: GMAIL_USER_ID,
        id,
        format: 'full',
      })
      return parseMessage(res.data)
    } catch {
      return null
    }
  }

  private buildRawMessage(draft: EmailDraft): string {
    const lines = [
      `To: ${draft.to.join(', ')}`,
      ...(draft.cc?.length ? [`Cc: ${draft.cc.join(', ')}`] : []),
      `Subject: ${draft.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      draft.body,
    ]
    return Buffer.from(lines.join('\r\n')).toString('base64url')
  }
}
