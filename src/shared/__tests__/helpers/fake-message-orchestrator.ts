import { LlmUnavailableError } from '@domain/errors/llm-unavailable.error.js'
import type {
  IMessageOrchestrator,
  MessageOrchestratorInput,
} from '@domain/ports/output/i-message-orchestrator.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for IMessageOrchestrator. Reset in beforeEach. */
export class FakeMessageOrchestrator implements IMessageOrchestrator {
  private _response = 'Hello from orchestrator'
  private _shouldError = false
  readonly calls: MessageOrchestratorInput[] = []

  reset(): void {
    this._response = 'Hello from orchestrator'
    this._shouldError = false
    this.calls.length = 0
  }

  setResponse(response: string): void {
    this._response = response
  }

  setError(): void {
    this._shouldError = true
  }

  process(opts: MessageOrchestratorInput): Promise<AppResult<string>> {
    this.calls.push(opts)
    if (this._shouldError) {
      return Promise.resolve(err(new LlmUnavailableError('test error')))
    }
    return Promise.resolve(ok(this._response))
  }
}
