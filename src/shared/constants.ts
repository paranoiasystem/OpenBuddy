/** Maximum number of retries for transient external service failures. */
export const MAX_RETRIES = 3

/** Default delay between retries in milliseconds. */
export const RETRY_DELAY_MS = 1_000

/** Maximum number of messages kept in a conversation context window. */
export const MAX_CONVERSATION_HISTORY = 20

/** Number of recent messages passed to the triage workflow for context. */
export const TRIAGE_CONTEXT_MESSAGES = 3

/** Number of recent messages passed to non-triage workflows as conversation history. */
export const WORKFLOW_CONTEXT_MESSAGES = 5

/** OpenRouter model identifiers — never hardcode these in business logic. */
export const OPENROUTER_MODELS = {
  /** Ultra-cheap: triage, sender, formatter — mechanical/structured tasks. */
  TRIAGE: 'inception/mercury-2',
  FORMATTER: 'stepfun/step-3.5-flash',
  /** Tool-calling agents + conversational (email, calendar, daily digests, chat). */
  TOOL_AGENT: 'anthropic/claude-haiku-4.5',
  CHAT: 'anthropic/claude-haiku-4.5',
  COMPOSER: 'anthropic/claude-haiku-4.5',
  // Legacy aliases kept for backwards compatibility
  DEFAULT: 'anthropic/claude-haiku-4.5',
  FAST: 'inception/mercury-2',
  CAPABLE: 'anthropic/claude-haiku-4.5',
} as const

/** Approximate cost per million tokens for OpenRouter models (USD). */
export const MODEL_COSTS_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  'inception/mercury-2': { input: 0.065, output: 0.065 },
  'stepfun/step-3.5-flash': { input: 0.1, output: 0.3 },
  'moonshotai/kimi-k2.5': { input: 0.42, output: 2.2 },
  'anthropic/claude-haiku-4.5': { input: 1.0, output: 5.0 },
  'anthropic/claude-sonnet-4.6': { input: 3.0, output: 15.0 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
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
