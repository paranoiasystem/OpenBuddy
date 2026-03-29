/** Maximum number of retries for transient external service failures. */
export const MAX_RETRIES = 3

/** Default delay between retries in milliseconds. */
export const RETRY_DELAY_MS = 1_000

/** Maximum number of messages kept in a conversation context window. */
export const MAX_CONVERSATION_HISTORY = 20

/** OpenRouter model identifiers — never hardcode these in business logic. */
export const OPENROUTER_MODELS = {
  DEFAULT: 'anthropic/claude-3.5-sonnet',
  FAST: 'anthropic/claude-3-haiku',
  CAPABLE: 'anthropic/claude-3-opus',
} as const

/** Google OAuth2 scopes required by the bot. */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.modify',
] as const
