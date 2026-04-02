# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenBuddy is a Telegram personal assistant bot with multi-agent AI orchestration. It uses SLANG (`@riktar/slang`) to classify user intent and route messages through specialized workflows (chat, email, calendar, daily-report).

| Component | Technology |
|---|---|
| Runtime | Node.js ≥22 + TypeScript strict mode |
| Bot | Telegraf v4 |
| Agent orchestration | @riktar/slang |
| LLM | OpenRouter (OpenAI-compatible API) |
| Calendar / Email | Google Calendar API + Gmail API (optional — graceful degradation) |
| Scheduler | node-cron |
| Database | TypeORM + SQLite (better-sqlite3) |
| Config validation | Zod |
| Error handling | neverthrow (`Result<T, E>` — never throw in domain) |
| Testing | Vitest + testcontainers + supertest |

## Commands

```bash
npm run dev                # tsx watch mode (hot reload)
npm run build              # tsc + tsc-alias (output → dist/)
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
npm run lint:fix           # ESLint with auto-fix
npm run format:check       # Prettier check
npm run format             # Prettier write

# Testing
npm test                   # Unit tests (domain + application + shared)
npm run test:watch         # Unit tests in watch mode
npm run test:coverage      # Unit tests with coverage report → coverage/unit/
npm run test:integration   # Integration tests (needs Docker)
npm run test:e2e           # E2E tests

# Run a single test file
npx vitest run src/domain/service/message-handler.service.test.ts

# Run tests matching a pattern
npx vitest run -t "should create an order"

# Database
npm run migrate:run        # Run TypeORM migrations
npm run migrate:generate   # Generate a new migration
```

## Architecture

Hexagonal architecture (ports & adapters). See `.claude/rules/code-style.md` for layer rules.

```
src/
├── main.ts            ← Entry point: bootstrap → register commands → launch
├── bootstrap.ts       ← Composition root: ONLY place adapters are wired to ports
├── domain/            ← Pure business logic. ZERO framework imports. ZERO I/O.
│   ├── model/         ← Entities and Value Objects (User, Conversation, Message, CalendarEvent, EmailDraft, ScheduledTask)
│   ├── ports/
│   │   ├── input/     ← Use case contracts (IHandleMessage, IManageSchedule)
│   │   └── output/    ← Adapter contracts (IUserRepository, ILlmGateway, ICalendarGateway, IEmailGateway, IMessageOrchestrator, etc.)
│   ├── service/       ← Domain services (MessageHandlerService, ScheduleService, CalendarService, StatsService)
│   └── errors/        ← Typed error classes extending DomainError (incl. ValidationError)
├── application/       ← Use cases (HandleMessageUseCase only — all other logic handled by SLANG tools)
├── adapters/
│   ├── primary/
│   │   ├── telegram/  ← Telegraf bot: handlers/ (start, help, auth, message, stats) + middleware/ (auth allowlist, error)
│   │   └── http/      ← Minimal Node http server: GET /health, GET /auth/google/callback
│   └── secondary/
│       ├── google/     ← OAuth2 auth manager + ICalendarGateway + IEmailGateway
│       ├── persistence/← TypeORM DataSource, entities, repositories (implements I*Repository ports)
│       ├── scheduler/  ← IManageSchedule via node-cron
│       └── slang/      ← IMessageOrchestrator: triage → intent routing → workflow execution + tool registry
└── shared/
    ├── config.ts       ← Zod-validated env vars (required: TELEGRAM_BOT_TOKEN, OPENROUTER_API_KEY; optional: GOOGLE_*)
    ├── logger.ts       ← Pino singleton (pretty in dev, JSON in prod)
    ├── result.ts       ← Re-exports neverthrow; defines AppResult<T> = Result<T, DomainError>
    ├── constants.ts    ← MAX_CONVERSATION_HISTORY, TRIAGE_CONTEXT_MESSAGES, GOOGLE_SCOPES, estimateCost
    ├── messages.ts     ← All user-facing Telegram strings (Italian)
    ├── telegram-html.ts← Markdown → Telegram HTML converter (used by message handler)
    └── __tests__/helpers/ ← Hand-written fakes for unit tests (FakeUserRepository, FakeConversationRepository, etc.)
```

### Key data flow

```
Telegram message → auth middleware → message.handler → HandleMessageUseCase
  → upsert User → load/create Conversation → persist user message
  → SlangOrchestrator.process() → triage intent → route to workflow (chat/email/calendar/report)
  → persist bot reply → return to Telegram handler → ctx.reply()
```

### Path aliases (tsconfig)

Use these in imports — resolved by `tsc-alias` at build time, by vitest config at test time:

| Alias | Path |
|---|---|
| `@domain/*` | `src/domain/*` |
| `@application/*` | `src/application/*` |
| `@adapters/*` | `src/adapters/*` |
| `@shared/*` | `src/shared/*` |

### ESLint enforces

- `@typescript-eslint/consistent-type-imports` → always use `import type` for type-only imports
- `import/order` → builtins → external → internal, alphabetized, with newlines between groups
- `@typescript-eslint/explicit-module-boundary-types` → explicit return types on all exported functions
- Unused vars allowed only with `_` prefix

## Commit Convention (Conventional Commits)

Format: `<type>(<scope>): <description>`

Allowed types: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore` | `revert` | `ci` | `build`

Scope is **kebab-case** (e.g. `telegram`, `openrouter`, `calendar`, `persistence`).

Enforced by commitlint + husky pre-commit hook.

## Branch Strategy (Gitflow)

| Branch | Purpose |
|---|---|
| `main` | Production releases only — tagged with semver |
| `develop` | Integration branch — all features merge here |
| `feature/<name>` | New features, branched from `develop` |
| `hotfix/<name>` | Urgent fixes, branched from `main` |
| `release/<version>` | Release preparation, branched from `develop` |

## CI/CD (GitHub Actions)

### `ci.yml` — on PR to `main` / `develop`
1. `npm ci` with cache
2. `tsc --noEmit`
3. ESLint + Prettier check
4. commitlint (validates Conventional Commits)
5. Unit tests with coverage (artifact published)
6. Integration tests
7. `tsc` build (artifact `dist/`)

### `release.yml` — on push to `main` or tag `v*.*.*`
1. Docker multi-stage build
2. Push to `ghcr.io/<owner>/openbuddy` with tags `:sha`, `:latest`, `:v*`
3. On tag: create GitHub Release with auto-generated changelog

Uses `GITHUB_TOKEN` automatically. Required repo permissions: `packages: write`, `contents: write`.

## Slash Commands (`.claude/commands/`)

| Command | Purpose |
|---|---|
| `/project:review` | Structured code review with layer boundary checks |
| `/project:fix-issue` | TDD-driven issue fix (Red → Green → Refactor) |
| `/project:deploy` | Pre-flight validation + Docker + release checklist |
