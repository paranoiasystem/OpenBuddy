import { MESSAGES } from '@shared/messages.js'

import type { BotContext } from '../bot-context.type.js'

/** Handles the /start command — sends the welcome message. */
export async function startHandler(ctx: BotContext): Promise<void> {
  await ctx.reply(MESSAGES.WELCOME)
}
