import type { AppResult } from '@shared/result.js'

/** Input port: process an incoming Telegram message and produce a reply. */
export type IHandleMessage = {
  execute(input: HandleMessageInput): Promise<AppResult<HandleMessageOutput>>
}

export type HandleMessageInput = {
  readonly telegramId: number
  readonly username: string | undefined
  readonly firstName: string
  readonly text: string
}

export type HandleMessageOutput = {
  readonly reply: string
}
