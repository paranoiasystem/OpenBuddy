/** OpenRouter chat completion request shape (OpenAI-compatible). */
export type OpenRouterRequest = {
  readonly model: string
  readonly messages: ReadonlyArray<{ role: string; content: string }>
  readonly max_tokens?: number
  readonly temperature?: number
}

/** OpenRouter chat completion response shape. */
export type OpenRouterResponse = {
  readonly choices: ReadonlyArray<{
    readonly message: {
      readonly role: string
      readonly content: string
    }
  }>
  readonly usage?: {
    readonly prompt_tokens: number
    readonly completion_tokens: number
    readonly total_tokens: number
  }
}
