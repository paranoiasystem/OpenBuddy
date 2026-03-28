import type { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import type { gmail_v1 } from 'googleapis'

import { EmailAuthError } from '@domain/errors/email-auth.error.js'
import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { EmailDraft } from '@domain/model/email-draft.js'
import type { EmailMessage } from '@domain/model/email-message.js'
import type { IEmailGateway, ListMessagesOptions } from '@domain/ports/output/i-email-gateway.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** IEmailGateway implementation backed by Gmail API. */
export class GmailGateway implements IEmailGateway {
  private readonly gmail: ReturnType<typeof google.gmail>

  constructor(auth: OAuth2Client) {
    this.gmail = google.gmail({ version: 'v1', auth })
  }

  async sendDraft(draft: EmailDraft): Promise<AppResult<void>> {
    try {
      const raw = this.buildRawMessage(draft)
      await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      })
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

function parseMessage(raw: gmail_v1.Schema$Message): EmailMessage | null {
  if (!raw.id || !raw.threadId) return null

  const headers = raw.payload?.headers ?? []
  const header = (name: string): string =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''

  const body = extractBody(raw.payload)
  const dateStr = header('Date')

  return {
    id: raw.id,
    threadId: raw.threadId,
    from: header('From'),
    to: header('To'),
    subject: header('Subject'),
    snippet: raw.snippet ?? '',
    body,
    receivedAt: dateStr ? new Date(dateStr) : new Date(Number(raw.internalDate ?? 0)),
    isUnread: (raw.labelIds ?? []).includes('UNREAD'),
  }
}

function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
  if (!payload) return ''

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }

  return ''
}

function isAuthError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const obj = e as Record<string, unknown>
  const code = obj['code']
  const status = (obj['response'] as Record<string, unknown> | undefined)?.['status']
  return code === 401 || code === 403 || status === 401 || status === 403
}

/** Extract human-readable fields from Google API (GaxiosError) for structured logging. */
function serializeApiError(cause: unknown): Record<string, unknown> {
  if (typeof cause !== 'object' || cause === null) return { cause: String(cause) }
  const obj = cause as Record<string, unknown>
  const response = obj['response'] as Record<string, unknown> | undefined
  return {
    message: obj['message'] ?? String(cause),
    status: response?.['status'] ?? obj['code'],
    data: response?.['data'],
  }
}
