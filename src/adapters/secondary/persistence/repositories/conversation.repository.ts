import type { DataSource } from 'typeorm'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { Conversation } from '@domain/model/conversation.js'
import type { Message } from '@domain/model/message.js'
import type { IConversationRepository } from '@domain/ports/output/i-conversation-repository.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import { ConversationEntity } from '../entities/conversation.entity.js'

/** TypeORM implementation of IConversationRepository. */
export class ConversationRepository implements IConversationRepository {
  private readonly repo

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ConversationEntity)
  }

  async findByUserId(userId: string): Promise<AppResult<Conversation | undefined>> {
    try {
      const entity = await this.repo.findOneBy({ userId })
      return ok(entity ?? undefined)
    } catch (cause) {
      logger.error({ cause }, 'ConversationRepository.findByUserId error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async create(userId: string): Promise<AppResult<Conversation>> {
    try {
      const entity = this.repo.create({ userId, messages: [] })
      const saved = await this.repo.save(entity)
      return ok(saved)
    } catch (cause) {
      logger.error({ cause }, 'ConversationRepository.create error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async appendMessage(opts: {
    conversationId: string
    message: Message
  }): Promise<AppResult<Conversation>> {
    try {
      const entity = await this.repo.findOneBy({ id: opts.conversationId })
      if (!entity) {
        return err(new ExternalServiceError('Database', 'conversation not found'))
      }
      entity.messages = [...entity.messages, opts.message]
      const saved = await this.repo.save(entity)
      return ok(saved)
    } catch (cause) {
      logger.error({ cause }, 'ConversationRepository.appendMessage error')
      return err(new ExternalServiceError('Database'))
    }
  }
}
