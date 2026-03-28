import 'reflect-metadata'

import { DataSource } from 'typeorm'

import { ConversationEntity } from './entities/conversation.entity.js'
import { GoogleTokenEntity } from './entities/google-token.entity.js'
import { ScheduledTaskEntity } from './entities/scheduled-task.entity.js'
import { UserEntity } from './entities/user.entity.js'

/** Factory function that creates and initialises the TypeORM DataSource. */
export async function createDataSource(dbPath: string): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [UserEntity, ConversationEntity, ScheduledTaskEntity, GoogleTokenEntity],
    migrations: ['dist/adapters/secondary/persistence/migrations/*.js'],
    synchronize: process.env['NODE_ENV'] !== 'production',
    logging: process.env['NODE_ENV'] === 'development',
  })

  await dataSource.initialize()
  return dataSource
}
