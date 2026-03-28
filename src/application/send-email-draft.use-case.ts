import type { EmailDraft } from '@domain/model/email-draft.js'
import type { IEmailGateway } from '@domain/ports/output/i-email-gateway.js'
import type { AppResult } from '@shared/result.js'

/** Sends an email draft via Gmail. */
export class SendEmailDraftUseCase {
  constructor(private readonly emailGateway: IEmailGateway) {}

  execute(draft: EmailDraft): Promise<AppResult<void>> {
    return this.emailGateway.sendDraft(draft)
  }
}
