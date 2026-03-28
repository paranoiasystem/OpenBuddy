import { MESSAGES } from '@shared/messages.js'

import type { BotContext } from '../bot-context.type.js'

/** Handles the /help command — lists available commands and features. */
export async function helpHandler(ctx: BotContext): Promise<void> {
  await ctx.reply(MESSAGES.HELP_TEXT, { parse_mode: 'HTML' })
}
