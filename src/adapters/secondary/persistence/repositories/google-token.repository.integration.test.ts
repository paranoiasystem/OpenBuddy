import 'reflect-metadata'

import { DataSource } from 'typeorm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { GoogleTokenEntity } from '../entities/google-token.entity.js'

import { GoogleTokenRepository } from './google-token.repository.js'

describe('GoogleTokenRepository', () => {
  let dataSource: DataSource
  let repo: GoogleTokenRepository

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [GoogleTokenEntity],
      synchronize: true,
    })
    await dataSource.initialize()
    repo = new GoogleTokenRepository(dataSource)
  })

  afterEach(async () => {
    await dataSource.destroy()
  })

  it('should return undefined when no token exists', async () => {
    const result = await repo.load()

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toBeUndefined()
    }
  })

  it('should save and load a token', async () => {
    const token = {
      access_token: 'ya29.test-access-token',
      refresh_token: '1//test-refresh-token',
      token_type: 'Bearer',
      expiry_date: 1700000000000,
    }

    const saveResult = await repo.save(token)
    expect(saveResult.isOk()).toBe(true)

    const loadResult = await repo.load()
    expect(loadResult.isOk()).toBe(true)
    if (loadResult.isOk()) {
      expect(loadResult.value).toEqual(token)
    }
  })

  it('should overwrite the previous token on subsequent saves', async () => {
    const firstToken = { access_token: 'first', refresh_token: 'r1' }
    const secondToken = { access_token: 'second', refresh_token: 'r2' }

    await repo.save(firstToken)
    await repo.save(secondToken)

    const result = await repo.load()
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual(secondToken)
    }
  })
})
