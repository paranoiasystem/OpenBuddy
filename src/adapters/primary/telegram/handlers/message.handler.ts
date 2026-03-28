import type { IHandleMessage } from '@domain/ports/input/i-handle-message.js'
import { logger } from '@shared/logger.js'
import { MESSAGES } from '@shared/messages.js'
import { formatForTelegramHtml } from '@shared/telegram-html.js'

import type { BotContext } from '../bot-context.type.js'

/** Factory that creates the text message handler, injecting the use case. */
export function createMessageHandler(handleMessage: IHandleMessage) {
  return async (ctx: BotContext): Promise<void> => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined
    if (!text) return

    // Reject unregistered slash commands before they reach the orchestrator
    if (text.startsWith('/')) {
      await ctx.reply('Comando non riconosciuto. Usa /help per vedere i comandi disponibili.')
      return
    }

    const telegramId = ctx.from?.id
    if (!telegramId) return

    const result = await handleMessage.execute({
      telegramId,
      username: ctx.from?.username,
      firstName: ctx.from?.first_name ?? 'User',
      text,
    })

    if (result.isErr()) {
      logger.error({ error: result.error }, 'HandleMessage use case error')
      await ctx.reply(MESSAGES.ERROR_GENERIC)
      return
    }

    await ctx.reply(formatForTelegramHtml(result.value.reply), { parse_mode: 'HTML' })
  }
}
