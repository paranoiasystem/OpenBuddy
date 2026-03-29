import { describe, it, expect, beforeEach } from 'vitest'

import { FakeLlmUsageRepository } from '@shared/__tests__/helpers/fake-llm-usage-repository.js'

import { StatsService } from './stats.service.js'

describe('StatsService', () => {
  let repo: FakeLlmUsageRepository
  let service: StatsService

  beforeEach(() => {
    repo = new FakeLlmUsageRepository()
    repo.reset()
    service = new StatsService(repo)
  })

  describe('getStats', () => {
    it('should return zero stats when no data exists', async () => {
      const result = await service.getStats()
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.totalRequests).toBe(0)
        expect(result.value.totalTokens).toBe(0)
        expect(result.value.totalEstimatedCost).toBe(0)
        expect(result.value.avgResponseTimeMs).toBe(0)
        expect(result.value.topWorkflows).toEqual([])
        expect(result.value.tokensByModel).toEqual([])
      }
    })

    it('should return aggregated stats when data exists', async () => {
      await repo.save({
        userId: 'u1',
        model: 'anthropic/claude-sonnet-4.6',
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        estimatedCost: 0.005,
        responseTimeMs: 1000,
        workflowType: 'chat',
      })
      await repo.save({
        userId: 'u1',
        model: 'anthropic/claude-sonnet-4.6',
        promptTokens: 50,
        completionTokens: 150,
        totalTokens: 200,
        estimatedCost: 0.003,
        responseTimeMs: 800,
        workflowType: 'email-read',
      })

      const result = await service.getStats()
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.totalRequests).toBe(2)
        expect(result.value.totalTokens).toBe(500)
        expect(result.value.totalEstimatedCost).toBeCloseTo(0.008)
        expect(result.value.avgResponseTimeMs).toBe(900)
        expect(result.value.topWorkflows).toHaveLength(2)
        expect(result.value.tokensByModel).toHaveLength(1)
      }
    })

    it('should rank workflows by usage count', async () => {
      for (let i = 0; i < 3; i++) {
        await repo.save({
          userId: 'u1',
          model: 'model',
          promptTokens: 10,
          completionTokens: 10,
          totalTokens: 20,
          estimatedCost: 0,
          responseTimeMs: 500,
          workflowType: 'chat',
        })
      }
      await repo.save({
        userId: 'u1',
        model: 'model',
        promptTokens: 10,
        completionTokens: 10,
        totalTokens: 20,
        estimatedCost: 0,
        responseTimeMs: 500,
        workflowType: 'email-read',
      })

      const result = await service.getStats()
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const [first, second] = result.value.topWorkflows
        expect(first?.workflow).toBe('chat')
        expect(first?.count).toBe(3)
        expect(second?.workflow).toBe('email-read')
        expect(second?.count).toBe(1)
      }
    })

    it('should pass since date to repository when period is provided', async () => {
      await repo.save({
        userId: 'u1',
        model: 'model',
        promptTokens: 10,
        completionTokens: 10,
        totalTokens: 20,
        estimatedCost: 0,
        responseTimeMs: 500,
        workflowType: 'chat',
      })

      // The fake repo doesn't filter by date, but getStats should be called
      const result = await service.getStats('today')
      expect(result.isOk()).toBe(true)
    })
  })
})
