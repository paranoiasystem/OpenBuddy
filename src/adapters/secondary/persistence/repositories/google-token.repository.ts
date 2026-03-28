import type { DataSource } from 'typeorm'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { IGoogleTokenStore } from '@domain/ports/output/i-google-token-store.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import { GoogleTokenEntity } from '../entities/google-token.entity.js'

const SINGLETON_ID = 'default'

/** TypeORM implementation of IGoogleTokenStore — persists Google OAuth2 tokens in SQLite. */
export class GoogleTokenRepository implements IGoogleTokenStore {
  private readonly repo

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(GoogleTokenEntity)
  }

  async load(): Promise<AppResult<Record<string, unknown> | undefined>> {
    try {
      const entity = await this.repo.findOneBy({ id: SINGLETON_ID })
      if (!entity) return ok(undefined)
      return ok(JSON.parse(entity.tokenJson) as Record<string, unknown>)
    } catch (cause) {
      logger.error({ cause }, 'GoogleTokenRepository.load error')
      return err(new ExternalServiceError('Database'))
    }
  }

  async save(token: Record<string, unknown>): Promise<AppResult<void>> {
    try {
      await this.repo.save({
        id: SINGLETON_ID,
        tokenJson: JSON.stringify(token),
      })
      return ok(undefined)
    } catch (cause) {
      logger.error({ cause }, 'GoogleTokenRepository.save error')
      return err(new ExternalServiceError('Database'))
    }
  }
}
