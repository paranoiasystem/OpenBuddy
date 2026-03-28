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
}
