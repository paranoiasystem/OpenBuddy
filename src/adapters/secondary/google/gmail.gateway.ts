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
    try {
      const raw = this.buildRawMessage(draft)
      await this.gmail.users.messages.send({ userId: 'me', requestBody: { raw } })
      return ok(undefined)
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail sendDraft error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async listMessages(opts: ListMessagesOptions): Promise<AppResult<EmailMessage[]>> {
    try {
      const listRes = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: opts.maxResults ?? 10,
        ...(opts.labelIds?.length ? { labelIds: opts.labelIds } : {}),
      })
      const ids = listRes.data.messages ?? []
      const messages = await Promise.all(ids.map((m) => this.fetchAndParse(m.id!)))
      return ok(messages.filter((m): m is EmailMessage => m !== null))
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail listMessages error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async searchMessages(query: string, maxResults = 10): Promise<AppResult<EmailMessage[]>> {
    try {
      const listRes = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      })
      const ids = listRes.data.messages ?? []
      const messages = await Promise.all(ids.map((m) => this.fetchAndParse(m.id!)))
      return ok(messages.filter((m): m is EmailMessage => m !== null))
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail searchMessages error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async archiveMessage(messageId: string): Promise<AppResult<void>> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { removeLabelIds: ['INBOX'] },
      })
      return ok(undefined)
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail archiveMessage error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async modifyLabels(opts: ModifyLabelsOptions): Promise<AppResult<void>> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: opts.messageId,
        requestBody: {
          ...(opts.addLabelIds?.length ? { addLabelIds: opts.addLabelIds } : {}),
          ...(opts.removeLabelIds?.length ? { removeLabelIds: opts.removeLabelIds } : {}),
        },
      })
      return ok(undefined)
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail modifyLabels error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async markAsRead(messageId: string): Promise<AppResult<void>> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { removeLabelIds: ['UNREAD'] },
      })
      return ok(undefined)
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail markAsRead error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async trashMessage(messageId: string): Promise<AppResult<void>> {
    try {
      await this.gmail.users.messages.trash({ userId: 'me', id: messageId })
      return ok(undefined)
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail trashMessage error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  async getAttachment(
    messageId: string,
    attachmentId: string,
  ): Promise<AppResult<EmailAttachmentData>> {
    try {
      const msgRes = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      })
      const parsed = parseMessage(msgRes.data)
      const meta = parsed?.attachments.find((a) => a.attachmentId === attachmentId)

      const attRes = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      })

      return ok({
        filename: meta?.filename ?? 'attachment',
        mimeType: meta?.mimeType ?? 'application/octet-stream',
        data: attRes.data.data ?? '',
        size: attRes.data.size ?? 0,
      })
    } catch (cause) {
      logger.error(serializeApiError(cause), 'Gmail getAttachment error')
      if (isAuthError(cause)) return err(new EmailAuthError())
      return err(new ExternalServiceError('Gmail', String(cause)))
    }
  }

  private async fetchAndParse(id: string): Promise<EmailMessage | null> {
    try {
      const res = await this.gmail.users.messages.get({
        userId: 'me',
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
