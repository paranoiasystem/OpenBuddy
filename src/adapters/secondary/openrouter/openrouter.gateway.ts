import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import { LlmUnavailableError } from '@domain/errors/llm-unavailable.error.js'
import type { LlmCompletionOptions, ILlmGateway } from '@domain/ports/output/i-llm-gateway.js'
import { OPENROUTER_MODELS } from '@shared/constants.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import type { OpenRouterRequest, OpenRouterResponse } from './openrouter.types.js'

type OpenRouterGatewayConfig = {
  readonly apiKey: string
  readonly baseUrl: string
  readonly defaultModel: string
}

/** ILlmGateway implementation backed by OpenRouter. */
export class OpenRouterGateway implements ILlmGateway {
  constructor(private readonly config: OpenRouterGatewayConfig) {}

  async complete(opts: LlmCompletionOptions): Promise<AppResult<string>> {
    const body: OpenRouterRequest = {
      model: opts.model ?? this.config.defaultModel ?? OPENROUTER_MODELS.DEFAULT,
      messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ...(opts.maxTokens !== undefined && { max_tokens: opts.maxTokens }),
      ...(opts.temperature !== undefined && { temperature: opts.temperature }),
    }

    let response: Response
    try {
      response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/openbuddy',
          'X-Title': 'OpenBuddy',
        },
        body: JSON.stringify(body),
      })
    } catch (cause) {
      logger.error({ cause }, 'OpenRouter network error')
      return err(new LlmUnavailableError('network error'))
    }

    if (!response.ok) {
      logger.error({ status: response.status }, 'OpenRouter HTTP error')
      if (response.status >= 500) {
        return err(new ExternalServiceError('OpenRouter', `HTTP ${response.status}`))
      }
      return err(new LlmUnavailableError(`HTTP ${response.status}`))
    }

    const data = (await response.json()) as OpenRouterResponse
    const content = data.choices[0]?.message?.content
    if (!content) {
      return err(new LlmUnavailableError('empty response'))
    }

    return ok(content)
  }
}
