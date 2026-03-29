import type { UsageStats } from '@domain/model/llm-usage.js'
import type { StatsService, StatsPeriod } from '@domain/service/stats.service.js'
import { MESSAGES } from '@shared/messages.js'

import type { BotContext } from '../bot-context.type.js'

const VALID_PERIODS = new Set<string>(['today', 'week', 'month'])

/** Factory that creates the /stats command handler. */
export function createStatsHandler(statsService: StatsService) {
  return async (ctx: BotContext): Promise<void> => {
    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : ''
    const parts = text.split(' ')
    const periodArg = parts[1]?.trim()
    const period = VALID_PERIODS.has(periodArg ?? '') ? (periodArg as StatsPeriod) : undefined

    const result = await statsService.getStats(period)

    if (result.isErr()) {
      await ctx.reply(MESSAGES.ERROR_GENERIC)
      return
    }

    const message = formatStatsMessage(result.value, period)
    await ctx.reply(message, { parse_mode: 'HTML' })
  }
}

function formatStatsMessage(stats: UsageStats, period?: StatsPeriod): string {
  const periodLabel = period ? periodLabels[period] : 'da sempre'

  if (stats.totalRequests === 0) {
    return `<b>Statistiche di utilizzo</b> (${periodLabel})\n\nNessun dato disponibile.`
  }

  const lines: string[] = [
    `<b>Statistiche di utilizzo</b> (${periodLabel})`,
    '',
    `<b>Richieste:</b> ${stats.totalRequests}`,
    `<b>Token totali:</b> ~${formatNumber(stats.totalTokens)}`,
    `<b>Costo stimato:</b> $${stats.totalEstimatedCost.toFixed(4)}`,
    `<b>Tempo medio risposta:</b> ${(stats.avgResponseTimeMs / 1000).toFixed(1)}s`,
  ]

  if (stats.topWorkflows.length > 0) {
    lines.push('', '<b>Workflow più usati:</b>')
    stats.topWorkflows.forEach((wf, i) => {
      lines.push(`${i + 1}. ${wf.workflow} — ${wf.count} richieste`)
    })
  }

  if (stats.tokensByModel.length > 0) {
    lines.push('', '<b>Token per modello:</b>')
    for (const m of stats.tokensByModel) {
      const shortName = m.model.split('/').pop() ?? m.model
      lines.push(`- ${shortName}: ~${formatNumber(m.tokens)}`)
    }
  }

  return lines.join('\n')
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const periodLabels: Record<StatsPeriod, string> = {
  today: 'oggi',
  week: 'ultima settimana',
  month: 'ultimo mese',
}
