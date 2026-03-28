/** Represents a user of the bot identified by their Telegram ID. */
export type User = {
  readonly id: string
  readonly telegramId: number
  readonly username: string | undefined
  readonly firstName: string
  readonly createdAt: Date
}

/** Data required to create a new User. */
export type CreateUserInput = {
  readonly telegramId: number
  readonly username: string | undefined
  readonly firstName: string
}
