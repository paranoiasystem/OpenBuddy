import type { Context } from 'telegraf'

/** Extended Telegraf Context with resolved userId (set by auth middleware). */
export type BotContext = Context & {
  userId: string
}
