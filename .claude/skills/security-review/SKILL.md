# Skill: security-review

**Trigger**: Automatically invoked when files in `src/adapters/` are modified, or when asked to review authentication, credential handling, or security-sensitive code.

## Purpose
Perform a focused security audit before any merge to `main`.

## Checklist

### Secrets & Credentials
- [ ] No API keys, tokens, or passwords hardcoded anywhere in `src/`.
- [ ] All secrets loaded exclusively through `src/shared/config.ts` (zod-validated env vars).
- [ ] `.env` is in `.gitignore`; `.env.example` contains only placeholders.
- [ ] `.google-token.json` is in `.gitignore` (legacy safeguard).

### Input Validation
- [ ] All Telegram-sourced input is validated before reaching the domain layer.
- [ ] Zod schemas are used for external API response shapes (no silent `unknown` casts).
- [ ] LLM prompts are constructed from trusted sources — no raw user input injected unsanitised.

### OAuth2 / Google Auth
- [ ] OAuth2 tokens are persisted in the database via `IGoogleTokenStore` — never on the filesystem.
- [ ] Token refresh errors surface as `CalendarAuthError` — no silent failures.

### Telegram Bot
- [ ] `ALLOWED_USER_IDS` whitelist enforced in `auth.middleware.ts` before any handler runs.
- [ ] Bot token is read only from env — never logged, never sent to LLM context.
- [ ] Error middleware prevents stack traces from leaking to users.

### Dependencies
- [ ] Run `npm audit` and report any high/critical vulnerabilities.
- [ ] `better-sqlite3` native build is reproducible in CI (apk python3 make g++).

## Output Format
Report findings as: **Critical** | **High** | **Medium** | **Info**.
Each finding: `[file:line] Description — recommended fix`.
