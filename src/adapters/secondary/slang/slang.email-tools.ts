import type { IEmailGateway } from '@domain/ports/output/i-email-gateway.js'
import { logger } from '@shared/logger.js'

import type { SlangToolHandler } from './slang.tools.js'

const NOT_CONFIGURED = JSON.stringify({
  configured: false,
  message: 'Gmail not configured. Run /auth to authenticate.',
})

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
    const labelIds = Array.isArray(args['label_ids']) ? (args['label_ids'] as string[]) : undefined

    const result = await gateway.listMessages({
      maxResults,
      ...(labelIds !== undefined ? { labelIds } : {}),
    })
    if (result.isErr()) {
      logger.warn({ error: result.error.code }, 'list_emails tool error')
      return JSON.stringify({ configured: true, error: result.error.message, emails: [] })
    }
    return JSON.stringify({
      configured: true,
      emails: result.value,
      unread_count: result.value.filter((m) => m.isUnread).length,
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
    return JSON.stringify({ configured: true, emails: result.value })
  }
}

export function sendEmail(gateway: IEmailGateway | undefined): SlangToolHandler {
  return async (args: Record<string, unknown>): Promise<string> => {
    if (!gateway) return NOT_CONFIGURED
    const to = Array.isArray(args['to']) ? (args['to'] as string[]) : [String(args['to'] ?? '')]
    const subject = String(args['subject'] ?? '')
    const body = String(args['body'] ?? '')
    const cc = Array.isArray(args['cc']) ? (args['cc'] as string[]) : undefined

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

    const addLabelIds = Array.isArray(args['add_label_ids'])
      ? (args['add_label_ids'] as string[])
      : undefined
    const removeLabelIds = Array.isArray(args['remove_label_ids'])
      ? (args['remove_label_ids'] as string[])
      : undefined

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
