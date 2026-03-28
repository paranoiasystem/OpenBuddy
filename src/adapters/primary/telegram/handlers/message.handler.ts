import type { IHandleMessage } from '@domain/ports/input/i-handle-message.js'
import { logger } from '@shared/logger.js'
import { MESSAGES } from '@shared/messages.js'

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

    await ctx.reply(sanitizeForTelegramHtml(result.value.reply), { parse_mode: 'HTML' })
  }
}

// ─── Telegram HTML helpers ──────────────────────────────────────────────────

const HTML_TAG_PATTERN = /<\/?(?:b|i|u|s|code|pre|a)\b/i

/**
 * If the text already contains known Telegram HTML tags, pass through as-is.
 * Otherwise escape &, <, > so plain chat text renders safely in HTML mode.
 */
function sanitizeForTelegramHtml(text: string): string {
  if (HTML_TAG_PATTERN.test(text)) return text
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
