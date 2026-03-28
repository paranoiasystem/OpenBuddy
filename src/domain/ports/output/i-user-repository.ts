import type { CreateUserInput, User } from '@domain/model/user.js'
import type { AppResult } from '@shared/result.js'

/** Output port: persistence contract for users. */
export type IUserRepository = {
  findByTelegramId(telegramId: number): Promise<AppResult<User | undefined>>
  findById(id: string): Promise<AppResult<User | undefined>>
  save(input: CreateUserInput): Promise<AppResult<User>>
}
