import { describe, it, expect, beforeEach } from 'vitest'

import {
  archiveEmail,
  getEmailAttachment,
  markEmailAsRead,
  modifyEmailLabels,
  trashEmail,
} from '@adapters/secondary/slang/slang.email-tools.js'
import { FakeEmailGateway } from '@shared/__tests__/helpers/fake-email-gateway.js'

type ToolResult = Record<string, unknown>

function parse(json: string): ToolResult {
  return JSON.parse(json) as ToolResult
}

describe('slang email tools', () => {
  let gateway: FakeEmailGateway

  beforeEach(() => {
    gateway = new FakeEmailGateway()
    gateway.reset()
  })

  describe('archive_email', () => {
    it('should return not configured when gateway is undefined', async () => {
      const tool = archiveEmail(undefined)
      const result = parse(await tool({ message_id: '123' }))
      expect(result['configured']).toBe(false)
    })

    it('should archive the message', async () => {
      const tool = archiveEmail(gateway)
      const result = parse(await tool({ message_id: 'msg-1' }))
      expect(result['success']).toBe(true)
      expect(gateway.archivedIds).toEqual(['msg-1'])
    })

    it('should return error when message_id is missing', async () => {
      const tool = archiveEmail(gateway)
      const result = parse(await tool({}))
      expect(result['success']).toBe(false)
    })
  })

  describe('mark_email_as_read', () => {
    it('should return not configured when gateway is undefined', async () => {
      const tool = markEmailAsRead(undefined)
      const result = parse(await tool({ message_id: '123' }))
      expect(result['configured']).toBe(false)
    })

    it('should mark the message as read', async () => {
      const tool = markEmailAsRead(gateway)
      const result = parse(await tool({ message_id: 'msg-2' }))
      expect(result['success']).toBe(true)
      expect(gateway.markedAsReadIds).toEqual(['msg-2'])
    })
  })

  describe('modify_email_labels', () => {
    it('should return not configured when gateway is undefined', async () => {
      const tool = modifyEmailLabels(undefined)
      const result = parse(await tool({ message_id: '123' }))
      expect(result['configured']).toBe(false)
    })

    it('should modify labels on the message', async () => {
      const tool = modifyEmailLabels(gateway)
      const result = parse(
        await tool({
          message_id: 'msg-3',
          add_label_ids: ['IMPORTANT'],
          remove_label_ids: ['SPAM'],
        }),
      )
      expect(result['success']).toBe(true)
      expect(gateway.labelModifications).toEqual([
        { messageId: 'msg-3', addLabelIds: ['IMPORTANT'], removeLabelIds: ['SPAM'] },
      ])
    })
  })

  describe('trash_email', () => {
    it('should return not configured when gateway is undefined', async () => {
      const tool = trashEmail(undefined)
      const result = parse(await tool({ message_id: '123' }))
      expect(result['configured']).toBe(false)
    })

    it('should trash the message', async () => {
      const tool = trashEmail(gateway)
      const result = parse(await tool({ message_id: 'msg-4' }))
      expect(result['success']).toBe(true)
      expect(gateway.trashedIds).toEqual(['msg-4'])
    })
  })

  describe('get_email_attachment', () => {
    it('should return not configured when gateway is undefined', async () => {
      const tool = getEmailAttachment(undefined)
      const result = parse(await tool({ message_id: '123', attachment_id: 'att-1' }))
      expect(result['configured']).toBe(false)
    })

    it('should return attachment data', async () => {
      const tool = getEmailAttachment(gateway)
      const result = parse(await tool({ message_id: 'msg-5', attachment_id: 'att-1' }))
      expect(result['success']).toBe(true)
      const attachment = result['attachment'] as Record<string, unknown>
      expect(attachment['filename']).toBe('test.pdf')
      expect(gateway.attachmentRequests).toEqual([{ messageId: 'msg-5', attachmentId: 'att-1' }])
    })

    it('should return error when ids are missing', async () => {
      const tool = getEmailAttachment(gateway)
      const result = parse(await tool({}))
      expect(result['success']).toBe(false)
    })
  })
})
