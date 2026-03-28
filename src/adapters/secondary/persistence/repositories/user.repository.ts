import type { DataSource } from 'typeorm'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { CreateUserInput, User } from '@domain/model/user.js'
import type { IUserRepository } from '@domain/ports/output/i-user-repository.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import { UserEntity } from '../entities/user.entity.js'

/** TypeORM implementation of IUserRepository. */
export class UserRepository implements IUserRepository {
  private readonly repo

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UserEntity)
  }

  async findByTelegramId(telegramId: number): Promise<AppResult<User | undefined>> {
    try {
      const entity = await this.repo.findOneBy({ telegramId })
      return ok(entity ? toUser(entity) : undefined)
    } catch (cause) {
      logger.error({ cause }, 'UserRepository.findByTelegramId error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async findById(id: string): Promise<AppResult<User | undefined>> {
    try {
      const entity = await this.repo.findOneBy({ id })
      return ok(entity ? toUser(entity) : undefined)
    } catch (cause) {
      logger.error({ cause }, 'UserRepository.findById error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async save(input: CreateUserInput): Promise<AppResult<User>> {
    try {
      const entityData = {
        telegramId: input.telegramId,
        firstName: input.firstName,
        ...(input.username !== undefined ? { username: input.username } : {}),
      }
      const entity = this.repo.create(entityData)
      const saved = await this.repo.save(entity)
      return ok(toUser(saved))
    } catch (cause) {
      logger.error({ cause }, 'UserRepository.save error')
      return err(new ExternalServiceError('Database'))
    }
  }
}

function toUser(entity: UserEntity): User {
  return {
    id: entity.id,
    telegramId: entity.telegramId,
    username: entity.username,
    firstName: entity.firstName,
    createdAt: entity.createdAt,
  }
}
