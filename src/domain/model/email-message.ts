import type { EmailAttachment } from './email-attachment.js'

export type EmailMessage = {
  readonly id: string
  readonly threadId: string
  readonly from: string
  readonly to: string
  readonly subject: string
  readonly snippet: string
  readonly body: string
  readonly receivedAt: Date
  readonly isUnread: boolean
  readonly labelIds: ReadonlyArray<string>
  readonly attachments: ReadonlyArray<EmailAttachment>
}
