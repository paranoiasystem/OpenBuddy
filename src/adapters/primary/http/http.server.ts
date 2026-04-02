import { createServer } from 'http'
import type { IncomingMessage, ServerResponse } from 'http'
import { URL } from 'url'

import type { Telegraf } from 'telegraf'

import type { BotContext } from '@adapters/primary/telegram/bot-context.type.js'
import type { GoogleAuthManager } from '@adapters/secondary/google/google-auth.js'
import { logger } from '@shared/logger.js'
import { MESSAGES } from '@shared/messages.js'

type HttpServerDeps = {
  readonly authManager: GoogleAuthManager | undefined
  readonly bot: Telegraf<BotContext>
  readonly port: number
}

/**
 * Minimal HTTP server exposing two endpoints:
 * - GET /health              → 200 OK (Docker health check)
 * - GET /auth/google/callback → OAuth2 code exchange + Telegram notification
 */
export function createHttpServer(deps: HttpServerDeps): ReturnType<typeof createServer> {
  const server = createServer((req, res) => {
    void handleRequest(req, res, deps).catch((cause) => {
      logger.error({ cause, url: req.url }, 'HTTP server unhandled error')
      sendJson(res, 500, { error: 'internal server error' })
    })
  })

  server.listen(deps.port, () => {
    logger.info({ port: deps.port }, 'HTTP server listening')
  })

  return server
}

// ─── Request dispatcher ──────────────────────────────────────────────────────

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: HttpServerDeps,
): Promise<void> {
  const base = `http://localhost:${deps.port}`
  const url = new URL(req.url ?? '/', base)

  if (req.method === 'GET' && url.pathname === '/health') {
    return handleHealth(res)
  }

  if (req.method === 'GET' && url.pathname === '/auth/google/callback') {
    if (!deps.authManager) {
      sendHtml(
        res,
        503,
        buildHtmlPage(MESSAGES.AUTH_NOT_CONFIGURED, MESSAGES.AUTH_CALLBACK_NOT_CONFIGURED),
      )
      return
    }
    return handleGoogleCallback(url, res, { ...deps, authManager: deps.authManager })
  }

  sendJson(res, 404, { error: 'not found' })
}

// ─── Handlers ────────────────────────────────────────────────────────────────

function handleHealth(res: ServerResponse): void {
  sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() })
}

async function handleGoogleCallback(
  url: URL,
  res: ServerResponse,
  deps: HttpServerDeps & { authManager: GoogleAuthManager },
): Promise<void> {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // User denied the OAuth consent
  if (error) {
    logger.warn({ error }, 'Google OAuth2 consent denied by user')
    sendHtml(
      res,
      400,
      buildHtmlPage(MESSAGES.AUTH_CALLBACK_CANCELLED_TITLE, MESSAGES.AUTH_CALLBACK_CANCELLED_BODY),
    )
    return
  }

  if (!code || !state) {
    sendHtml(
      res,
      400,
      buildHtmlPage(MESSAGES.AUTH_CALLBACK_INVALID_TITLE, MESSAGES.AUTH_CALLBACK_INVALID_BODY),
    )
    return
  }

  let telegramUserId: number | undefined
  try {
    telegramUserId = await deps.authManager.exchangeCode(code, state)
  } catch (cause) {
    logger.error({ cause }, 'Google OAuth2 code exchange failed')
    sendHtml(
      res,
      500,
      buildHtmlPage(MESSAGES.AUTH_CALLBACK_ERROR_TITLE, MESSAGES.AUTH_CALLBACK_ERROR_BODY),
    )
    return
  }

  if (telegramUserId === undefined) {
    // State expired or unknown (e.g. bot restarted between /auth and callback)
    sendHtml(
      res,
      400,
      buildHtmlPage(MESSAGES.AUTH_CALLBACK_EXPIRED_TITLE, MESSAGES.AUTH_CALLBACK_EXPIRED_BODY),
    )
    return
  }

  // Notify the user on Telegram
  try {
    await deps.bot.telegram.sendMessage(telegramUserId, MESSAGES.AUTH_SUCCESS, {
      parse_mode: 'HTML',
    })
    logger.info({ telegramUserId }, 'Google auth success notification sent')
  } catch (cause) {
    logger.warn({ cause, telegramUserId }, 'Could not send Telegram auth success message')
  }

  sendHtml(
    res,
    200,
    buildHtmlPage(MESSAGES.AUTH_CALLBACK_SUCCESS_TITLE, MESSAGES.AUTH_CALLBACK_SUCCESS_BODY),
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendJson(res: ServerResponse, status: number, body: Record<string, unknown>): void {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}

function buildHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — OpenBuddy</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; background: #f0f2f5; }
    .card { background: white; border-radius: 12px; padding: 2rem 2.5rem;
            box-shadow: 0 2px 16px rgba(0,0,0,.08); max-width: 420px; text-align: center; }
    h1 { font-size: 1.4rem; margin-bottom: 1rem; color: #1a1a2e; }
    p { color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}
