import { registerBotCommands } from './adapters/primary/telegram/telegram.bot.js'
import { bootstrap } from './bootstrap.js'
import { logger } from './shared/logger.js'

async function main(): Promise<void> {
  const { bot, httpServer } = await bootstrap()

  // Graceful shutdown: stop bot polling and close HTTP server
  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Shutting down gracefully...')
    bot.stop(signal)
    httpServer.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }

  process.once('SIGINT', () => {
    shutdown('SIGINT')
  })
  process.once('SIGTERM', () => {
    shutdown('SIGTERM')
  })

  await registerBotCommands(bot)
  await bot.launch()
  logger.info('OpenBuddy bot started')
}

void main().catch((err: unknown) => {
  logger.error({ err }, 'Fatal startup error')
  process.exit(1)
})
