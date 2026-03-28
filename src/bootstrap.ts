import type { Server } from 'http'

import type { Telegraf } from 'telegraf'

import { createHttpServer } from './adapters/primary/http/http.server.js'
import type { BotContext } from './adapters/primary/telegram/bot-context.type.js'
import { createTelegramBot } from './adapters/primary/telegram/telegram.bot.js'
import { GoogleCalendarGateway } from './adapters/secondary/google/calendar.gateway.js'
import { GmailGateway } from './adapters/secondary/google/gmail.gateway.js'
import { GoogleAuthManager } from './adapters/secondary/google/google-auth.js'
import { createDataSource } from './adapters/secondary/persistence/data-source.js'
import { ConversationRepository } from './adapters/secondary/persistence/repositories/conversation.repository.js'
import { GoogleTokenRepository } from './adapters/secondary/persistence/repositories/google-token.repository.js'
import { ScheduledTaskRepository } from './adapters/secondary/persistence/repositories/scheduled-task.repository.js'
import { UserRepository } from './adapters/secondary/persistence/repositories/user.repository.js'
import { CronAdapter } from './adapters/secondary/scheduler/cron.adapter.js'
import { SlangOrchestrator } from './adapters/secondary/slang/slang.orchestrator.js'
import { buildToolRegistry } from './adapters/secondary/slang/slang.tools.js'
import { HandleMessageUseCase } from './application/handle-message.use-case.js'
import { loadConfig } from './shared/config.js'
import { logger } from './shared/logger.js'

export type BootstrapResult = {
  bot: Telegraf<BotContext>
  httpServer: Server
}

/**
 * Composition root: wires all adapters and use cases.
 * Returns the configured bot and HTTP server — both are started by main.ts.
 */
export async function bootstrap(): Promise<BootstrapResult> {
  const config = loadConfig()

  // ─── Persistence ─────────────────────────────────────────────────────────────
  const dataSource = await createDataSource(config.DB_PATH)
  logger.info('Database connected')

  const userRepo = new UserRepository(dataSource)
  const conversationRepo = new ConversationRepository(dataSource)
  const taskRepo = new ScheduledTaskRepository(dataSource)
  const googleTokenRepo = new GoogleTokenRepository(dataSource)

  // ─── Google APIs (optional — graceful degradation if not configured) ──────────
  let authManager: GoogleAuthManager | undefined
  let calendarGateway: GoogleCalendarGateway | undefined
  let emailGateway: GmailGateway | undefined

  if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
    authManager = new GoogleAuthManager(
      {
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        redirectUri:
          config.GOOGLE_REDIRECT_URI ?? `http://localhost:${config.PORT}/auth/google/callback`,
      },
      googleTokenRepo,
    )

    await authManager.tryLoadToken()

    const oauthClient = authManager.getClient()
    calendarGateway = new GoogleCalendarGateway(oauthClient)
    emailGateway = new GmailGateway(oauthClient)
    logger.info('Google APIs configured')
  } else {
    logger.info('Google credentials not set — /auth will report unconfigured')
  }

  // ─── SLANG orchestrator ───────────────────────────────────────────────────────
  const tools = buildToolRegistry({ calendarGateway, emailGateway, timezone: config.TIMEZONE })
  const orchestrator = new SlangOrchestrator(
    {
      openRouterApiKey: config.OPENROUTER_API_KEY,
      siteUrl: 'https://github.com/openbuddy',
      appName: 'OpenBuddy',
      timezone: config.TIMEZONE,
    },
    tools,
  )

  // ─── Use cases ────────────────────────────────────────────────────────────────
  const handleMessage = new HandleMessageUseCase(userRepo, conversationRepo, orchestrator)

  // ─── Scheduler ───────────────────────────────────────────────────────────────
  const cronAdapter = new CronAdapter(taskRepo, async (task) => {
    logger.info({ taskId: task.id }, 'Executing scheduled task')
    await handleMessage.execute({
      telegramId: 0,
      username: undefined,
      firstName: 'Scheduler',
      text: task.prompt,
    })
  })

  const enabledTasksResult = await taskRepo.findAllEnabled()
  if (enabledTasksResult.isOk()) {
    await cronAdapter.registerAll(enabledTasksResult.value)
  }

  // ─── Primary adapters ────────────────────────────────────────────────────────
  // Bot is created before the HTTP server so it can be passed to the OAuth callback handler
  const bot = createTelegramBot(
    { token: config.TELEGRAM_BOT_TOKEN, allowedUserIds: config.ALLOWED_USER_IDS },
    { handleMessage },
    { authManager },
  )

  const httpServer = createHttpServer({
    authManager,
    bot,
    port: config.PORT,
  })

  logger.info('Bootstrap complete')
  return { bot, httpServer }
}
