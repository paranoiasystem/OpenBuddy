import pino from 'pino'

/** Structured logger singleton. Level is driven by the LOG_LEVEL env var. */
export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  ...(process.env['NODE_ENV'] !== 'production'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
})
