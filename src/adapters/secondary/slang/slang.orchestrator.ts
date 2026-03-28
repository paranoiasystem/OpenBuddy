import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

import { ExternalServiceError } from '@domain/errors/external-service.error.js'
import type {
  IMessageOrchestrator,
  MessageOrchestratorInput,
} from '@domain/ports/output/i-message-orchestrator.js'
import { logger } from '@shared/logger.js'
import { err, ok } from '@shared/result.js'
import type { AppResult } from '@shared/result.js'

import type { SlangToolRegistry } from './slang.tools.js'

const WORKFLOWS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'workflows')

/** Intents returned by the triage workflow. */
type Intent =
  | 'chat'
  | 'email-read'
  | 'email-write'
  | 'calendar-read'
  | 'calendar-write'
  | 'daily-report'
  | 'unknown'

type TriageResult = {
  intent: Intent
  confidence: number
  params: Record<string, unknown>
  requires_auth: boolean
  provider: string
}

type SlangOrchestratorConfig = {
  readonly openRouterApiKey: string
  readonly siteUrl?: string
  readonly appName?: string
  readonly timezone: string
}

/**
 * IMessageOrchestrator implementation using @riktar/slang.
 *
 * Flow:
 *  1. Run "triage" workflow → classify intent
 *  2. Route to the appropriate workflow based on intent
 *  3. Extract the final text response from the workflow output
 */
export class SlangOrchestrator implements IMessageOrchestrator {
  private readonly config: SlangOrchestratorConfig
  private readonly tools: SlangToolRegistry

  constructor(config: SlangOrchestratorConfig, tools: SlangToolRegistry) {
    this.config = config
    this.tools = tools
  }

  async process(opts: MessageOrchestratorInput): Promise<AppResult<string>> {
    try {
      const { runFlow: slangRunFlow, createOpenRouterAdapter } = await import('@riktar/slang')
      const runFlow = slangRunFlow as unknown as RunFlowFn

      const adapter = createOpenRouterAdapter({
        apiKey: this.config.openRouterApiKey,
        siteUrl: this.config.siteUrl ?? 'https://github.com/openbuddy',
        appName: this.config.appName ?? 'OpenBuddy',
      })

      // Step 1: Triage
      const triageResult = await this.runTriage({ runFlow, adapter }, opts)
      if (triageResult.isErr()) return err(triageResult.error)

      const triage = triageResult.value
      logger.info({ intent: triage.intent, userId: opts.userId }, 'Triage result')

      // Step 2: Auth guard — if intent requires Google auth, check tools are configured
      if (triage.requires_auth && this.isProtectedIntent(triage.intent)) {
        const probeFn = this.tools['list_calendar_events']
        if (probeFn) {
          const probe = await probeFn({})
          const probeResult = tryParseJson(probe) as Record<string, unknown> | undefined
          if (probeResult?.['configured'] === false) {
            return ok(
              'Per utilizzare questa funzionalità devi prima autenticarti con Google. Usa /auth per avviare il processo.',
            )
          }
        }
      }

      // Step 3: Route to the appropriate workflow
      return this.routeToWorkflow({ runFlow, adapter }, triage.intent, triage.params, opts)
    } catch (cause) {
      logger.error({ cause }, 'SlangOrchestrator fatal error')
      return err(new ExternalServiceError('Slang', String(cause)))
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async runTriage(
    ctx: SlangContext,
    opts: MessageOrchestratorInput,
  ): Promise<AppResult<TriageResult>> {
    const source = await this.loadWorkflow('triage.slang')
    const historyText = opts.conversationHistory
      .slice(-5)
      .map((m) => `${m.role}: ${stripSlangMeta(m.content)}`)
      .join('\n')

    const state = await ctx.runFlow(source, {
      adapter: ctx.adapter,
      params: {
        user_message: opts.userMessage,
        user_context: historyText,
      },
      tools: this.tools,
    })

    if (state.status !== 'converged' || state.outputs.length === 0) {
      logger.warn({ status: state.status }, 'Triage workflow did not converge')
      return ok({ intent: 'chat', confidence: 0.5, params: {}, requires_auth: false, provider: '' })
    }

    // @riktar/slang stores outputs as raw LLM text strings; parse the JSON ourselves.
    const raw = state.outputs[0]
    if (typeof raw === 'object' && raw !== null) {
      return ok(raw as TriageResult)
    }
    if (typeof raw === 'string') {
      const parsed = tryParseJson(raw)
      if (
        parsed !== undefined &&
        typeof parsed === 'object' &&
        parsed !== null &&
        'intent' in parsed
      ) {
        return ok(parsed as TriageResult)
      }
    }
    logger.warn({ raw }, 'Triage output could not be parsed — falling back to chat intent')
    return ok({ intent: 'chat', confidence: 0.5, params: {}, requires_auth: false, provider: '' })
  }

  private async routeToWorkflow(
    ctx: SlangContext,
    intent: Intent,
    triageParams: Record<string, unknown>,
    opts: MessageOrchestratorInput,
  ): Promise<AppResult<string>> {
    const historyText = opts.conversationHistory
      .slice(-10)
      .map((m) => `${m.role}: ${stripSlangMeta(m.content)}`)
      .join('\n')

    switch (intent) {
      case 'daily-report':
        return this.runDailyReport(ctx, opts, triageParams)

      case 'email-write':
        return this.runEmailWrite(ctx, opts, triageParams, historyText)

      case 'email-read':
        return this.runEmailRead(ctx, opts, triageParams)

      case 'calendar-read':
      case 'calendar-write':
        return this.runCalendar(ctx, opts, triageParams)

      case 'chat':
      case 'unknown':
      default:
        return this.runChat(ctx, opts, historyText)
    }
  }

  private async runChat(
    ctx: SlangContext,
    opts: MessageOrchestratorInput,
    historyText: string,
  ): Promise<AppResult<string>> {
    const source = await this.loadWorkflow('chat.slang')
    const state = await ctx.runFlow(source, {
      adapter: ctx.adapter,
      params: {
        user_message: opts.userMessage,
        conversation_history: historyText,
        user_name: opts.userName,
      },
      tools: this.tools,
    })

    if (state.status !== 'converged' || state.outputs.length === 0) {
      logger.warn({ status: state.status }, 'Chat workflow did not converge')
      return ok('Mi dispiace, non sono riuscito a elaborare la risposta. Riprova tra poco.')
    }
    const raw = state.outputs[0]
    return ok(stripSlangMeta(typeof raw === 'string' ? raw : JSON.stringify(raw)))
  }

  private async runDailyReport(
    ctx: SlangContext,
    opts: MessageOrchestratorInput,
    _params: Record<string, unknown>,
  ): Promise<AppResult<string>> {
    const source = await this.loadWorkflow('daily-report.slang')
    const now = new Date()
    const state = await ctx.runFlow(source, {
      adapter: ctx.adapter,
      params: {
        user_id: opts.userId,
        user_name: opts.userName,
        email_provider: 'gmail',
        calendar_provider: 'google',
        current_date: now.toLocaleDateString('it-IT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: this.config.timezone,
        }),
      },
      tools: this.tools,
    })

    return this.extractResponse(state, 'briefing')
  }

  private async runEmailWrite(
    ctx: SlangContext,
    opts: MessageOrchestratorInput,
    params: Record<string, unknown>,
    historyText: string,
  ): Promise<AppResult<string>> {
    const source = await this.loadWorkflow('email-write.slang')
    const state = await ctx.runFlow(source, {
      adapter: ctx.adapter,
      params: {
        user_instruction: opts.userMessage,
        recipient: String(params['recipient'] ?? ''),
        conversation_history: historyText,
        tone_preference: String(params['tone'] ?? 'professional'),
      },
      tools: this.tools,
    })

    if (state.status !== 'converged' || state.outputs.length === 0) {
      logger.warn({ status: state.status }, 'Email-write workflow did not converge')
      return ok('Mi dispiace, non sono riuscito a preparare la bozza. Riprova tra poco.')
    }

    const raw = state.outputs[0]
    let output: { preview?: string; subject?: string; body?: string }
    if (typeof raw === 'object' && raw !== null) {
      output = raw as { preview?: string; subject?: string; body?: string }
    } else if (typeof raw === 'string') {
      const parsed = tryParseJson(raw)
      output =
        typeof parsed === 'object' && parsed !== null
          ? (parsed as { preview?: string; subject?: string; body?: string })
          : {}
    } else {
      output = {}
    }

    const preview = output.preview ?? `📧 <b>${output.subject ?? ''}</b>\n\n${output.body ?? ''}`
    return ok(stripSlangMeta(preview))
  }

  private async runEmailRead(
    ctx: SlangContext,
    opts: MessageOrchestratorInput,
    params: Record<string, unknown>,
  ): Promise<AppResult<string>> {
    const source = await this.loadWorkflow('email-read.slang')
    const state = await ctx.runFlow(source, {
      adapter: ctx.adapter,
      params: {
        user_request: opts.userMessage,
        email_provider: String(params['provider'] ?? 'gmail'),
        user_id: opts.userId,
      },
      tools: this.tools,
    })

    return this.extractResponse(state, 'summary')
  }

  private async runCalendar(
    ctx: SlangContext,
    opts: MessageOrchestratorInput,
    params: Record<string, unknown>,
  ): Promise<AppResult<string>> {
    const source = await this.loadWorkflow('calendar.slang')
    const state = await ctx.runFlow(source, {
      adapter: ctx.adapter,
      params: {
        user_request: opts.userMessage,
        calendar_provider: String(params['provider'] ?? 'google'),
        user_id: opts.userId,
        current_datetime: new Date().toISOString(),
        timezone: this.config.timezone,
      },
      tools: this.tools,
    })

    return this.extractResponse(state, 'response')
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private isProtectedIntent(intent: Intent): boolean {
    return [
      'email-read',
      'email-write',
      'calendar-read',
      'calendar-write',
      'daily-report',
    ].includes(intent)
  }

  private async loadWorkflow(filename: string): Promise<string> {
    const filePath = join(WORKFLOWS_DIR, filename)
    return readFile(filePath, 'utf-8')
  }

  /**
   * Extracts a string response from a workflow's outputs.
   * Accepts both fully converged and budget-exceeded states as long as
   * at least one output was produced.
   */
  private extractResponse(
    state: { status: string; outputs: unknown[] },
    key: string,
  ): AppResult<string> {
    if (state.outputs.length === 0) {
      logger.warn({ status: state.status }, 'Workflow produced no outputs')
      return ok('Mi dispiace, non sono riuscito a completare la richiesta. Riprova tra poco.')
    }
    if (state.status !== 'converged') {
      logger.warn(
        { status: state.status, outputCount: state.outputs.length },
        'Workflow did not converge — using partial output',
      )
    }

    const raw = state.outputs[0]

    // Already a parsed object (future-proof if slang starts parsing outputs)
    if (typeof raw === 'object' && raw !== null && key in raw) {
      return ok(stripSlangMeta(String((raw as Record<string, unknown>)[key])))
    }

    // Raw string: try to parse JSON and extract the key
    if (typeof raw === 'string') {
      const parsed = tryParseJson(raw)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        key in (parsed as Record<string, unknown>)
      ) {
        return ok(stripSlangMeta(String((parsed as Record<string, unknown>)[key])))
      }
      // No JSON found: return text with slang metadata stripped
      return ok(stripSlangMeta(raw))
    }

    return ok(JSON.stringify(raw))
  }
}

// ─── Slang output utilities ───────────────────────────────────────────────────

/**
 * Extract a JSON object from a raw LLM response string.
 * Mirrors the extraction logic used internally by @riktar/slang.
 */
function tryParseJson(raw: string): unknown {
  // 1. Markdown code block: ```json ... ```
  const codeBlock = raw.match(/```json\s*([\s\S]*?)```/)
  if (codeBlock?.[1]) {
    try {
      return JSON.parse(codeBlock[1].trim())
    } catch {
      /* fall through */
    }
  }
  // 2. Direct JSON parse
  try {
    return JSON.parse(raw)
  } catch {
    /* fall through */
  }
  // 3. First '{' to last '}'
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1))
    } catch {
      /* fall through */
    }
  }
  return undefined
}

/**
 * Strip the CONFIDENCE annotation and any JSON code blocks that
 * @riktar/slang injects into every LLM response.
 */
function stripSlangMeta(text: string): string {
  return text
    .replace(/\n*```json[\s\S]*?```/g, '')
    .replace(/\n*CONFIDENCE:\s*[\d.]+\s*$/gim, '')
    .trim()
}

// ─── Internal type helpers ───────────────────────────────────────────────────

type RunFlowOptions = {
  readonly adapter: unknown
  readonly params?: Record<string, unknown>
  readonly tools?: Record<string, unknown>
}

type RunFlowFn = (
  source: string,
  opts: RunFlowOptions,
) => Promise<{ status: string; outputs: unknown[] }>

type SlangContext = {
  runFlow: RunFlowFn
  adapter: unknown
}
