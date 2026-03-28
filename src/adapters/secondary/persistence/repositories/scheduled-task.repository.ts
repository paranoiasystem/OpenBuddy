import type { DataSource } from 'typeorm'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { CreateScheduledTaskInput, ScheduledTask } from '@domain/model/scheduled-task.js'
import type { IScheduledTaskRepository } from '@domain/ports/output/i-scheduled-task-repository.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import { ScheduledTaskEntity } from '../entities/scheduled-task.entity.js'

/** TypeORM implementation of IScheduledTaskRepository. */
export class ScheduledTaskRepository implements IScheduledTaskRepository {
  private readonly repo

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ScheduledTaskEntity)
  }

  async findById(id: string): Promise<AppResult<ScheduledTask | undefined>> {
    try {
      const entity = await this.repo.findOneBy({ id })
      return ok(entity ?? undefined)
    } catch (cause) {
      logger.error({ cause }, 'ScheduledTaskRepository.findById error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async findByUserId(userId: string): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    try {
      const entities = await this.repo.findBy({ userId })
      return ok(entities)
    } catch (cause) {
      logger.error({ cause }, 'ScheduledTaskRepository.findByUserId error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async findAllEnabled(): Promise<AppResult<ReadonlyArray<ScheduledTask>>> {
    try {
      const entities = await this.repo.findBy({ enabled: true })
      return ok(entities)
    } catch (cause) {
      logger.error({ cause }, 'ScheduledTaskRepository.findAllEnabled error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async save(input: CreateScheduledTaskInput): Promise<AppResult<ScheduledTask>> {
    try {
      const entity = this.repo.create({ ...input, enabled: true })
      const saved = await this.repo.save(entity)
      return ok(saved)
    } catch (cause) {
      logger.error({ cause }, 'ScheduledTaskRepository.save error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async delete(id: string): Promise<AppResult<void>> {
    try {
      await this.repo.delete(id)
      return ok(undefined)
    } catch (cause) {
      logger.error({ cause }, 'ScheduledTaskRepository.delete error')
      return err(new ExternalServiceError('Database'))
    }
  }
}
