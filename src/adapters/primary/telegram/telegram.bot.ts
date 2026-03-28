import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'

import type { GoogleAuthManager } from '@adapters/secondary/google/google-auth.js'
import type { IHandleMessage } from '@domain/ports/input/i-handle-message.js'

import type { BotContext } from './bot-context.type.js'
import { createAuthHandler } from './handlers/auth.handler.js'
import { helpHandler } from './handlers/help.handler.js'
import { createMessageHandler } from './handlers/message.handler.js'
import { startHandler } from './handlers/start.handler.js'
import { createAuthMiddleware } from './middleware/auth.middleware.js'
import { createErrorMiddleware } from './middleware/error.middleware.js'

type TelegramBotConfig = {
  readonly token: string
  readonly allowedUserIds: ReadonlyArray<string>
}

type UseCases = {
  readonly handleMessage: IHandleMessage
}

type Adapters = {
  readonly authManager: GoogleAuthManager | undefined
}

/** Assembles and configures the Telegraf bot instance. */
export function createTelegramBot(
  config: TelegramBotConfig,
  useCases: UseCases,
  adapters: Adapters,
): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.token)

  bot.use(createErrorMiddleware())
  bot.use(createAuthMiddleware(config.allowedUserIds))

  bot.command('start', startHandler)
  bot.command('help', helpHandler)
  bot.command('auth', createAuthHandler(adapters.authManager))
  bot.on(message('text'), createMessageHandler(useCases.handleMessage))

  return bot
}

/** Registers the bot's command menu with Telegram. Call once before bot.launch(). */
export async function registerBotCommands(bot: Telegraf<BotContext>): Promise<void> {
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Avvia il bot e mostra il messaggio di benvenuto' },
    { command: 'help', description: 'Mostra i comandi disponibili e le funzionalità' },
    { command: 'auth', description: 'Autentica il bot con Google (Calendar e Gmail)' },
  ])
}
