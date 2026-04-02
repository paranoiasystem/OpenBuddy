import type { IEmailGateway } from '@domain/ports/output/i-email-gateway.js'
import { logger } from '@shared/logger.js'

import type { SlangToolHandler } from './slang.tools.js'

const MAX_EMAIL_BODY_CHARS = 1000

/** Clips the body of each email to avoid flooding the agent context window. */
function truncateEmailBodies<T extends { body: string }>(emails: T[]): T[] {
  return emails.map((e) =>
    e.body.length > MAX_EMAIL_BODY_CHARS
      ? { ...e, body: e.body.slice(0, MAX_EMAIL_BODY_CHARS) + '…[truncated]' }
      : e,
  )
}

const NOT_CONFIGURED = JSON.stringify({
  configured: false,
  message: 'Gmail not configured. Run /auth to authenticate.',
})

/** Coerces an unknown value into a string array (handles single strings and arrays). */
function toStringArray(value: unknown): string[] | undefined {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === 'string') return [value]
  return undefined
}

export function listEmails(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({
        configured: false,
        message: 'Gmail not configured. Run /auth to authenticate.',
        emails: [],
        unread_count: 0,
      })
    }
    const maxResults = typeof args['max_results'] === 'number' ? args['max_results'] : 10
    const labelIds = toStringArray(args['label_ids'])

    const result = await gateway.listMessages({
      maxResults,
      ...(labelIds !== undefined ? { labelIds } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'list_emails tool error')
      return JSON.stringify({ configured: true, error: result.error.message, emails: [] })
    }
    const emails = truncateEmailBodies(result.value)
    return JSON.stringify({
      configured: true,
      emails,
      unread_count: emails.filter((m) => m.isUnread).length,
    })
  }
}

export function searchEmails(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) {
      return JSON.stringify({
        configured: false,
        message: 'Gmail not configured. Run /auth to authenticate.',
        emails: [],
      })
    }
    const query = String(args['query'] ?? '')
    const maxResults = typeof args['max_results'] === 'number' ? args['max_results'] : 10

    const result = await gateway.searchMessages(query, maxResults)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'search_emails tool error')
      return JSON.stringify({ configured: true, error: result.error.message, emails: [] })
    }
    return JSON.stringify({ configured: true, emails: truncateEmailBodies(result.value) })
  }
}

export function sendEmail(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const to = toStringArray(args['to']) ?? [String(args['to'] ?? '')]
    const subject = String(args['subject'] ?? '')
    const body = String(args['body'] ?? '')
    const cc = toStringArray(args['cc'])

    const result = await gateway.sendDraft({
      to,
      subject,
      body,
      ...(cc !== undefined ? { cc } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'send_email tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, message: 'Email sent successfully.' })
  }
}

export function archiveEmail(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const messageId = String(args['message_id'] ?? '')
    if (!messageId) return JSON.stringify({ success: false, error: 'message_id is required.' })

    const result = await gateway.archiveMessage(messageId)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'archive_email tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, message: 'Email archived.' })
  }
}

export function modifyEmailLabels(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const messageId = String(args['message_id'] ?? '')
    if (!messageId) return JSON.stringify({ success: false, error: 'message_id is required.' })

    const addLabelIds = toStringArray(args['add_label_ids'])
    const removeLabelIds = toStringArray(args['remove_label_ids'])

    const result = await gateway.modifyLabels({
      messageId,
      ...(addLabelIds !== undefined ? { addLabelIds } : {}),
      ...(removeLabelIds !== undefined ? { removeLabelIds } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'modify_email_labels tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, message: 'Labels updated.' })
  }
}

export function markEmailAsRead(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const messageId = String(args['message_id'] ?? '')
    if (!messageId) return JSON.stringify({ success: false, error: 'message_id is required.' })

    const result = await gateway.markAsRead(messageId)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'mark_email_as_read tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, message: 'Email marked as read.' })
  }
}

export function trashEmail(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const messageId = String(args['message_id'] ?? '')
    if (!messageId) return JSON.stringify({ success: false, error: 'message_id is required.' })

    const result = await gateway.trashMessage(messageId)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'trash_email tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, message: 'Email moved to trash.' })
  }
}

export function getEmailAttachment(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const messageId = String(args['message_id'] ?? '')
    const attachmentId = String(args['attachment_id'] ?? '')
    if (!messageId || !attachmentId) {
      return JSON.stringify({
        success: false,
        error: 'message_id and attachment_id are required.',
      })
    }

    const result = await gateway.getAttachment(messageId, attachmentId)
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'get_email_attachment tool error')
      return JSON.stringify({ success: false, error: result.error.message })
    }
    return JSON.stringify({ success: true, attachment: result.value })
  }
}
