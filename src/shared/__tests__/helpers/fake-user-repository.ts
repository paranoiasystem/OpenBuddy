import type { CreateUserInput, User } from '@domain/model/user.js'
import type { IUserRepository } from '@domain/ports/output/i-user-repository.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for IUserRepository. Reset in beforeEach. */
export class FakeUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map()
  private counter = 0

  reset(): void {
    this.users = new Map()
    this.counter = 0
  }

  findByTelegramId(telegramId: number): Promise<AppResult<User | undefined>> {
    const user = [...this.users.values()].find((u) => u.telegramId === telegramId)
    return Promise.resolve(ok(user))
  }

  findById(id: string): Promise<AppResult<User | undefined>> {
    return Promise.resolve(ok(this.users.get(id)))
  }

  save(input: CreateUserInput): Promise<AppResult<User>> {
    const id = `user-${++this.counter}`
    const user: User = { id, ...input, createdAt: new Date() }
    this.users.set(id, user)
    return Promise.resolve(ok(user))
  }
}
