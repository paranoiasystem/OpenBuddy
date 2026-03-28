import type { GoogleAuthManager } from '@adapters/secondary/google/google-auth.js'
import { logger } from '@shared/logger.js'
import { MESSAGES } from '@shared/messages.js'

import type { BotContext } from '../bot-context.type.js'

/** Factory that creates the /auth command handler. */
export function createAuthHandler(authManager: GoogleAuthManager | undefined) {
  return async (ctx: BotContext): Promise<void> => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    if (!authManager) {
      await ctx.reply(MESSAGES.AUTH_NOT_CONFIGURED)
      return
    }

    if (authManager.isAuthenticated()) {
      await ctx.reply(MESSAGES.AUTH_ALREADY_DONE)
      return
    }

    try {
      const authUrl = authManager.generateAuthUrl(telegramId)
      await ctx.reply(MESSAGES.AUTH_START, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '🔗 Autorizza Google', url: authUrl }]],
        },
      })
      logger.info({ telegramId }, 'Auth URL sent to user')
    } catch (cause) {
      logger.error({ cause }, 'Failed to generate auth URL')
      await ctx.reply(MESSAGES.ERROR_GENERIC)
    }
  }
}
