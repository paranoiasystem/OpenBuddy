# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-04-02

### Changed
- All SLANG agent workflows now instruct agents to output Markdown only (no raw HTML); `formatForTelegramHtml` converts Markdown → Telegram HTML at the handler boundary
- Removed 6 unused application-layer use cases (`CreateCalendarEvent`, `ListCalendarEvents`, `CreateScheduledTask`, `DeleteScheduledTask`, `ListScheduledTasks`, `SendEmailDraft`) — logic is handled directly by SLANG tool handlers
- Removed unused `IManageCalendar` input port
- Removed unused OpenRouter adapter (`openrouter.gateway.ts`, `openrouter.types.ts`) — OpenRouter is managed internally by `@riktar/slang`
- Removed unused `OPENROUTER_MODELS`, `MAX_RETRIES`, `RETRY_DELAY_MS` constants
- Removed outdated `config/formatting-guide.md` (formatting instructions are now embedded in each `.slang` workflow file)

### Added
- Input validation in `HandleMessageUseCase`: trims whitespace and rejects messages exceeding 4000 characters with a `ValidationError`

### Fixed
- `extractBody` in `gmail.utils.ts` is no longer exported (internal helper)

## [0.1.0-alpha.1] - 2026-03-28

### Added
- Telegram bot with conversation history and multi-turn context
- Multi-agent AI orchestration via `@riktar/slang` (triage, chat, calendar, email, daily-report flows)
- Google Calendar integration: list upcoming events, create events
- Gmail integration: list messages, search messages, send email via OAuth2
- Google OAuth2 authentication flow with HTTP callback and Telegram notification
- Scheduled tasks with `node-cron`: create, list, delete, persistent via SQLite
- Cloudflare Tunnel support for HTTPS exposure without port forwarding
- Docker multi-stage build with non-root `openbuddy` user
- GitHub Actions CI pipeline (`ci.yml`): typecheck, lint, format, test, build
- GitHub Actions release pipeline (`release.yml`): Docker build + push to ghcr.io
- Telegram commands: `/start`, `/auth`, `/help`
- HTTP health endpoint (`GET /health`) for Docker healthcheck
- Hexagonal architecture with strict TypeScript and `neverthrow` Result pattern
