export type LlmUsage = {
  readonly id: string
  readonly userId: string
  readonly model: string
  readonly promptTokens: number
  readonly completionTokens: number
  readonly totalTokens: number
  readonly estimatedCost: number
  readonly responseTimeMs: number
  readonly workflowType: string
  readonly createdAt: Date
}

export type CreateLlmUsageInput = Omit<LlmUsage, 'id' | 'createdAt'>

export type UsageStats = {
  readonly totalRequests: number
  readonly totalTokens: number
  readonly totalEstimatedCost: number
  readonly avgResponseTimeMs: number
  readonly topWorkflows: ReadonlyArray<{ workflow: string; count: number }>
  readonly tokensByModel: ReadonlyArray<{ model: string; tokens: number }>
}
