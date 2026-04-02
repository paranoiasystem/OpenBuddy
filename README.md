# OpenBuddy

A self-hosted, privacy-focused Telegram personal assistant powered by multi-agent AI orchestration.

OpenBuddy uses [SLANG](https://github.com/riktar/slang) to classify user intent and route messages through specialized AI workflows — chat, email, calendar, and daily reports — ensuring maximum flexibility in implementation and full control over your data.

## Features

- **Multi-agent AI workflows** — Intent triage routes each message to the right agent pipeline (chat, email read/write, calendar, daily briefing)
- **Google Calendar** — List upcoming events, create new ones, get daily agenda
- **Gmail** — Read, search, and send emails with multi-agent drafting and review
- **Scheduled tasks** — Recurring cron-based tasks that trigger AI workflows automatically
- **Conversation history** — Context-aware responses using recent message history
- **Privacy-first** — Self-hosted, no data leaves your infrastructure (except LLM API calls)
- **Graceful degradation** — Google integrations are optional; the bot works without them

## Architecture

OpenBuddy follows **hexagonal architecture** (ports & adapters) with strict TypeScript:

```
src/
├── domain/          Pure business logic — no frameworks, no I/O
│   ├── model/       Entities and Value Objects
│   ├── ports/       Input & output port interfaces
│   ├── service/     Domain services
│   └── errors/      Typed domain errors
├── application/     Use cases (orchestration layer)
├── adapters/
│   ├── primary/     Telegram bot, HTTP server
│   └── secondary/   Google APIs, SQLite, SLANG (OpenRouter via @riktar/slang), scheduler
└── shared/          Config, logging, constants, utilities
```

**Key data flow:**

```
Telegram message → auth middleware → HandleMessageUseCase
  → upsert User → load Conversation → persist message
  → SLANG triage (classify intent) → route to workflow
  → workflow agents execute with tools → persist reply → ctx.reply()
```

## Prerequisites

- **Node.js** >= 22
- **Telegram Bot Token** — create one via [@BotFather](https://t.me/BotFather)
- **OpenRouter API Key** — sign up at [openrouter.ai](https://openrouter.ai)
- **Google OAuth2 credentials** *(optional)* — for Calendar and Gmail features

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/openbuddy.git
cd openbuddy

# Configure environment
cp .env.example .env
# Edit .env with your tokens and credentials

# Install dependencies
npm install

# Start in development mode (hot reload)
npm run dev
```

## Configuration

All configuration is via environment variables, validated at startup with Zod.

| Variable | Required | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | — | Telegram bot token from @BotFather |
| `ALLOWED_USER_IDS` | Yes | — | Comma-separated Telegram user IDs |
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key |
| `OPENROUTER_BASE_URL` | No | `https://openrouter.ai/api/v1` | OpenRouter API base URL |
| `OPENROUTER_DEFAULT_MODEL` | No | `anthropic/claude-haiku-4.5` | Default LLM model |
| `LOCALE` | No | `it` | UI language (`it` or `en`) |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:3000/auth/google/callback` | OAuth2 redirect URI |
| `DB_PATH` | No | `./openbuddy.sqlite` | SQLite database file path |
| `NODE_ENV` | No | `development` | `development`, `test`, or `production` |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `PORT` | No | `3000` | HTTP server port (health check + OAuth callback) |
| `TIMEZONE` | No | `Europe/Rome` | IANA timezone for date/time formatting |

## Model Strategy

Each workflow agent uses a model chosen for its cost/quality trade-off:

| Model | Input $/M | Output $/M | Used for |
|---|---|---|---|
| `inception/mercury-2` | $0.065 | $0.065 | Triage (intent classification) |
| `stepfun/step-3.5-flash` | $0.10 | $0.30 | Email sender, email summarizer, calendar formatter |
| `anthropic/claude-haiku-4.5` | $1.00 | $5.00 | Chat, email drafter, calendar agent, daily report |

> Triage uses the cheapest possible model — it only needs to output a small JSON intent object.
> Mechanical formatting tasks use Step 3.5 Flash.
> All conversational and tool-calling agents use Haiku 4.5 for quality and reliability.

You can override the default model via `OPENROUTER_DEFAULT_MODEL` in your `.env`.

## Telegram Commands

| Command | Description |
|---|---|
| `/start` | Start the bot and show welcome message |
| `/help` | List available commands and features |
| `/auth` | Authenticate with Google (Calendar + Gmail) |
| `/stats` | Show LLM usage statistics |

Beyond commands, simply write a message and the AI will classify your intent and respond accordingly.

## SLANG Workflows

| Workflow | Trigger | Description |
|---|---|---|
| **triage** | Every message | Classifies intent and routes to the right workflow |
| **chat** | General conversation | Free-form AI chat with conversation context |
| **email-read** | "What emails do I have?" | Fetches and summarizes emails |
| **email-write** | "Write an email to..." | Multi-agent drafting: Drafter → Sender |
| **calendar** | "What's on my calendar?" | Lists events or creates new ones |
| **daily-report** | "Give me a briefing" | Combines email digest + calendar into a daily summary |

## Docker

```bash
# Build and run with Docker Compose
docker compose up -d

# The bot exposes port 3000 for health checks and OAuth callbacks
# SQLite data is persisted in a Docker volume
```

The included `docker-compose.yml` also supports an optional Cloudflare Tunnel sidecar for exposing the OAuth callback endpoint without opening ports.

## Development

```bash
npm run dev              # Hot reload with tsx watch
npm run build            # Compile TypeScript to dist/
npm run typecheck        # Type check without emitting
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier

# Testing
npm test                 # Unit tests (domain + application + shared)
npm run test:watch       # Unit tests in watch mode
npm run test:coverage    # Unit tests with coverage report
npm run test:integration # Integration tests (requires Docker)
npm run test:e2e         # End-to-end tests
```

### Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js >= 22, TypeScript (strict mode) |
| Bot framework | Telegraf v4 |
| Agent orchestration | @riktar/slang |
| LLM provider | OpenRouter (OpenAI-compatible API) — multi-model strategy |
| Database | TypeORM + SQLite (better-sqlite3) |
| Config validation | Zod |
| Error handling | neverthrow (Result types) |
| Logging | Pino |
| Scheduler | node-cron |
| Google APIs | googleapis |

## Contributing

1. Branch from `develop` using Gitflow conventions:
   - `feature/<name>` for new features
   - `hotfix/<name>` for urgent fixes (from `main`)

2. Follow **Conventional Commits**:
   ```
   feat(telegram): add /stats command
   fix(calendar): handle timezone offset in event creation
   ```

3. Keep PRs small and focused — one feature or fix per PR.

4. Ensure all checks pass before requesting review:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
