import type { CreateLlmUsageInput, LlmUsage, UsageStats } from '@domain/model/llm-usage.js'
import type { ILlmUsageRepository } from '@domain/ports/output/i-llm-usage-repository.js'
import { ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

/** In-memory fake for ILlmUsageRepository. Reset in beforeEach. */
export class FakeLlmUsageRepository implements ILlmUsageRepository {
  readonly saved: LlmUsage[] = []
  private _nextId = 1

  reset(): void {
    this.saved.length = 0
    this._nextId = 1
  }

  save(input: CreateLlmUsageInput): Promise<AppResult<LlmUsage>> {
    const usage: LlmUsage = {
      id: String(this._nextId++),
      ...input,
      createdAt: new Date(),
    }
    this.saved.push(usage)
    return Promise.resolve(ok(usage))
  }

  getStats(_since?: Date): Promise<AppResult<UsageStats>> {
    const totalRequests = this.saved.length
    const totalTokens = this.saved.reduce((sum, u) => sum + u.totalTokens, 0)
    const totalEstimatedCost = this.saved.reduce((sum, u) => sum + u.estimatedCost, 0)
    const avgResponseTimeMs =
      totalRequests > 0
        ? Math.round(this.saved.reduce((sum, u) => sum + u.responseTimeMs, 0) / totalRequests)
        : 0

    const workflowCounts = new Map<string, number>()
    for (const u of this.saved) {
      workflowCounts.set(u.workflowType, (workflowCounts.get(u.workflowType) ?? 0) + 1)
    }
    const topWorkflows = [...workflowCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([workflow, count]) => ({ workflow, count }))

    const modelTokens = new Map<string, number>()
    for (const u of this.saved) {
      modelTokens.set(u.model, (modelTokens.get(u.model) ?? 0) + u.totalTokens)
    }
    const tokensByModel = [...modelTokens.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([model, tokens]) => ({ model, tokens }))

    return Promise.resolve(
      ok({
        totalRequests,
        totalTokens,
        totalEstimatedCost,
        avgResponseTimeMs,
        topWorkflows,
        tokensByModel,
      }),
    )
  }
}
