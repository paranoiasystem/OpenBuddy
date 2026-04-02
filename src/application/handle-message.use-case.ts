import { ValidationError } from '@domain/errors/validation.error.js'
import type {
  HandleMessageInput,
  HandleMessageOutput,
  IHandleMessage,
} from '@domain/ports/input/i-handle-message.js'
import type { IConversationRepository } from '@domain/ports/output/i-conversation-repository.js'
import type { IMessageOrchestrator } from '@domain/ports/output/i-message-orchestrator.js'
import type { IUserRepository } from '@domain/ports/output/i-user-repository.js'
import { MessageHandlerService } from '@domain/service/message-handler.service.js'
import { err } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

const MAX_MESSAGE_LENGTH = 4000

/**
 * Orchestrates the full message-handling flow:
 * upsert user → delegate to MessageHandlerService (which routes through SLANG).
 */
export class HandleMessageUseCase implements IHandleMessage {
  private readonly service: MessageHandlerService

  constructor(
    private readonly userRepo: IUserRepository,
    conversationRepo: IConversationRepository,
    orchestrator: IMessageOrchestrator,
  ) {
    this.service = new MessageHandlerService(userRepo, conversationRepo, orchestrator)
  }

  async execute(input: HandleMessageInput): Promise<AppResult<HandleMessageOutput>> {
    const text = input.text.trim()
    if (!text) return err(new ValidationError('Message text must not be empty'))
    if (text.length > MAX_MESSAGE_LENGTH)
      return err(
        new ValidationError(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`),
      )

    // Ensure user record exists before delegating to the domain service
    const userResult = await this.userRepo.findByTelegramId(input.telegramId)
    if (userResult.isErr()) return err(userResult.error)

    if (!userResult.value) {
      const saveResult = await this.userRepo.save({
        telegramId: input.telegramId,
        username: input.username,
        firstName: input.firstName,
      })
      if (saveResult.isErr()) return err(saveResult.error)
    }

    return this.service.process({
      telegramId: input.telegramId,
      firstName: input.firstName,
      text,
      ...(input.onProgress && { onProgress: input.onProgress }),
    })
  }
}
