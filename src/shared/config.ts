import { z } from 'zod'

const configSchema = z.object({
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  ALLOWED_USER_IDS: z.string().transform((val) =>
    val
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean),
  ),

  // OpenRouter
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_DEFAULT_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),

  // Google OAuth2
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  // Database
  DB_PATH: z.string().default('./openbuddy.sqlite'),

  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  PORT: z.coerce.number().int().positive().default(3000),
  TIMEZONE: z.string().default('Europe/Rome'),
})

export type Config = z.infer<typeof configSchema>

/**
 * Validates all required environment variables at startup.
 * Throws a descriptive error listing every missing or invalid variable.
 */
export function loadConfig(): Config {
  const result = configSchema.safeParse(process.env)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  return result.data
}
