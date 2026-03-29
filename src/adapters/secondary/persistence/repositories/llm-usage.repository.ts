import type { DataSource, SelectQueryBuilder } from 'typeorm'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type { CreateLlmUsageInput, LlmUsage, UsageStats } from '@domain/model/llm-usage.js'
import type { ILlmUsageRepository } from '@domain/ports/output/i-llm-usage-repository.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import { LlmUsageEntity } from '../entities/llm-usage.entity.js'

export class LlmUsageRepository implements ILlmUsageRepository {
  private readonly repo

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(LlmUsageEntity)
  }

  async save(input: CreateLlmUsageInput): Promise<AppResult<LlmUsage>> {
    try {
      const entity = this.repo.create({
        userId: input.userId,
        model: input.model,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        totalTokens: input.totalTokens,
        estimatedCost: input.estimatedCost,
        responseTimeMs: input.responseTimeMs,
        workflowType: input.workflowType,
      })
      const saved = await this.repo.save(entity)
      return ok(this.toDomain(saved))
    } catch (cause) {
      logger.error({ cause }, 'Failed to save LLM usage')
      return err(new ExternalServiceError('Database', String(cause)))
    }
  }

  async getStats(since?: Date): Promise<AppResult<UsageStats>> {
    try {
      const qb = this.repo.createQueryBuilder('u')
      if (since) {
        qb.where('u.createdAt >= :since', { since: since.toISOString() })
      }

      const aggregate = await this.buildAggregateQuery(qb, since)
      const topWorkflows = await this.buildTopWorkflowsQuery(since)
      const tokensByModel = await this.buildTokensByModelQuery(since)

      return ok({
        totalRequests: Number(aggregate['totalRequests'] ?? 0),
        totalTokens: Number(aggregate['totalTokens'] ?? 0),
        totalEstimatedCost: Number(aggregate['totalCost'] ?? 0),
        avgResponseTimeMs: Math.round(Number(aggregate['avgTime'] ?? 0)),
        topWorkflows,
        tokensByModel,
      })
    } catch (cause) {
      logger.error({ cause }, 'Failed to get usage stats')
      return err(new ExternalServiceError('Database', String(cause)))
    }
  }

  private async buildAggregateQuery(
    _qb: SelectQueryBuilder<LlmUsageEntity>,
    since?: Date,
  ): Promise<Record<string, unknown>> {
    const qb = this.repo
      .createQueryBuilder('u')
      .select('COUNT(*)', 'totalRequests')
      .addSelect('COALESCE(SUM(u.totalTokens), 0)', 'totalTokens')
      .addSelect('COALESCE(SUM(u.estimatedCost), 0)', 'totalCost')
      .addSelect('COALESCE(AVG(u.responseTimeMs), 0)', 'avgTime')

    if (since) {
      qb.where('u.createdAt >= :since', { since: since.toISOString() })
    }

    return (await qb.getRawOne()) as Record<string, unknown>
  }

  private async buildTopWorkflowsQuery(
    since?: Date,
  ): Promise<Array<{ workflow: string; count: number }>> {
    const qb = this.repo
      .createQueryBuilder('u')
      .select('u.workflowType', 'workflow')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.workflowType')
      .orderBy('count', 'DESC')
      .limit(5)

    if (since) {
      qb.where('u.createdAt >= :since', { since: since.toISOString() })
    }

    const rawRows: unknown[] = await qb.getRawMany()
    return rawRows.map((r) => {
      const row = r as Record<string, unknown>
      return { workflow: String(row['workflow'] ?? ''), count: Number(row['count'] ?? 0) }
    })
  }

  private async buildTokensByModelQuery(
    since?: Date,
  ): Promise<Array<{ model: string; tokens: number }>> {
    const qb = this.repo
      .createQueryBuilder('u')
      .select('u.model', 'model')
      .addSelect('COALESCE(SUM(u.totalTokens), 0)', 'tokens')
      .groupBy('u.model')
      .orderBy('tokens', 'DESC')

    if (since) {
      qb.where('u.createdAt >= :since', { since: since.toISOString() })
    }

    const rawRows: unknown[] = await qb.getRawMany()
    return rawRows.map((r) => {
      const row = r as Record<string, unknown>
      return { model: String(row['model'] ?? ''), tokens: Number(row['tokens'] ?? 0) }
    })
  }

  private toDomain(entity: LlmUsageEntity): LlmUsage {
    return {
      id: entity.id,
      userId: entity.userId,
      model: entity.model,
      promptTokens: entity.promptTokens,
      completionTokens: entity.completionTokens,
      totalTokens: entity.totalTokens,
      estimatedCost: entity.estimatedCost,
      responseTimeMs: entity.responseTimeMs,
      workflowType: entity.workflowType,
      createdAt: entity.createdAt,
    }
  }
}
