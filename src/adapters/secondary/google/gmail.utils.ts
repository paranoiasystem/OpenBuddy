import type { gmail_v1 } from 'googleapis'

import type { EmailAttachment } from '@domain/model/email-attachment.js'
import type { EmailMessage } from '@domain/model/email-message.js'

/** Parses a Gmail API message into the domain EmailMessage type. */
export function parseMessage(raw: gmail_v1.Schema$Message): EmailMessage | null {
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
    labelIds: raw.labelIds ?? [],
    attachments: extractAttachments(raw.id, raw.payload),
  }
}

/** Extracts plain-text body from a Gmail message payload. */
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

/** Extracts attachment metadata from a Gmail message payload. */
function extractAttachments(
  messageId: string,
  payload: gmail_v1.Schema$MessagePart | undefined,
): EmailAttachment[] {
  const attachments: EmailAttachment[] = []
  collectAttachments(messageId, payload, attachments)
  return attachments
}

function collectAttachments(
  messageId: string,
  part: gmail_v1.Schema$MessagePart | undefined,
  out: EmailAttachment[],
): void {
  if (!part) return

  if (part.filename && part.body?.attachmentId) {
    out.push({
      attachmentId: part.body.attachmentId,
      filename: part.filename,
      mimeType: part.mimeType ?? 'application/octet-stream',
      size: part.body.size ?? 0,
    })
  }

  if (part.parts) {
    for (const child of part.parts) {
      collectAttachments(messageId, child, out)
    }
  }
}

// Re-export shared Google API utilities for backwards-compatible imports
export { isAuthError, serializeApiError } from './google-api.utils.js'
