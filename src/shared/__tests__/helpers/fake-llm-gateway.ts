import type { ILlmGateway, LlmCompletionOptions } from '@domain/ports/output/i-llm-gateway.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/**
 * In-memory fake for ILlmGateway.
 * Returns a configurable response; records calls for assertion.
 */
export class FakeLlmGateway implements ILlmGateway {
  private _response: string = 'fake LLM response'
  readonly calls: LlmCompletionOptions[] = []

  setResponse(response: string): void {
    this._response = response
  }

  complete(opts: LlmCompletionOptions): Promise<AppResult<string>> {
    this.calls.push(opts)
    return Promise.resolve(ok(this._response))
  }
}
