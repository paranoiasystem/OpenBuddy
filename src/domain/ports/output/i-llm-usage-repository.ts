import type { CreateLlmUsageInput, LlmUsage, UsageStats } from '@domain/model/llm-usage.js'
import type { AppResult } from '@shared/result.js'

/** Output port: LLM usage tracking persistence. */
export type ILlmUsageRepository = {
  save(input: CreateLlmUsageInput): Promise<AppResult<LlmUsage>>
  getStats(since?: Date): Promise<AppResult<UsageStats>>
}
