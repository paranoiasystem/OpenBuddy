import type { UsageStats } from '@domain/model/llm-usage.js'
import type { ILlmUsageRepository } from '@domain/ports/output/i-llm-usage-repository.js'
import type { AppResult } from '@shared/result.js'

export type StatsPeriod = 'today' | 'week' | 'month'

export class StatsService {
  constructor(private readonly usageRepo: ILlmUsageRepository) {}

  async getStats(period?: StatsPeriod): Promise<AppResult<UsageStats>> {
    const since = period ? computeSince(period) : undefined
    return this.usageRepo.getStats(since)
  }
}

function computeSince(period: StatsPeriod): Date {
  const now = new Date()
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week': {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      return d
    }
    case 'month': {
      const d = new Date(now)
      d.setMonth(d.getMonth() - 1)
      return d
    }
  }
}
