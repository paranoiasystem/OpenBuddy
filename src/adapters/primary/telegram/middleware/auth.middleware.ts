import type { MiddlewareFn } from 'telegraf'

import { logger } from '@shared/logger.js'
import { MESSAGES } from '@shared/messages.js'

import type { BotContext } from '../bot-context.type.js'

/**
 * Middleware that enforces the ALLOWED_USER_IDS allowlist.
 * Blocks any Telegram user not in the list before reaching any handler.
 */
export function createAuthMiddleware(allowedIds: ReadonlyArray<string>): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    const telegramId = ctx.from?.id

    if (!telegramId || !allowedIds.includes(String(telegramId))) {
      logger.warn({ telegramId }, 'Unauthorized access attempt')
      await ctx.reply(MESSAGES.UNAUTHORIZED)
      return
    }

    // Attach a resolved userId placeholder — the use case will create/find the real record
    ctx.userId = String(telegramId)
    return next()
  }
}
