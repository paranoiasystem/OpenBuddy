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

/** Approximate cost per million tokens for OpenRouter models (USD). */
export const MODEL_COSTS_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'anthropic/claude-sonnet-4.6': { input: 3.0, output: 15.0 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-haiku-4.5': { input: 0.8, output: 4.0 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'openai/gpt-4o': { input: 2.5, output: 10.0 },
}

/** Estimates cost in USD for a given model and token counts. */
export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const costs = MODEL_COSTS_PER_MILLION_TOKENS[model]
  if (!costs) return 0
  return (promptTokens * costs.input + completionTokens * costs.output) / 1_000_000
}

/** Google OAuth2 scopes required by the bot. */
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.modify',
] as const
