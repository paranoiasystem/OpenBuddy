import type { MiddlewareFn } from 'telegraf'

import { logger } from '@shared/logger.js'
import { MESSAGES } from '@shared/messages.js'

import type { BotContext } from '../bot-context.type.js'

/** Global error middleware — catches unhandled errors and sends a generic message. */
export function createErrorMiddleware(): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    try {
      await next()
    } catch (cause) {
      logger.error({ cause, telegramId: ctx.from?.id }, 'Unhandled bot error')
      try {
        await ctx.reply(MESSAGES.ERROR_GENERIC)
      } catch {
        // Ignore reply errors
      }
    }
  }
}
