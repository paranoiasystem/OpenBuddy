# API & Adapter Conventions

## Port Interfaces
- All port interfaces live in `src/domain/ports/input/` or `src/domain/ports/output/`.
- Interface names use `I` prefix + `PascalCase`: `ILlmGateway`, `ICalendarGateway`.
- Prefer `type` aliases for method signatures; use `interface` only when declaration merging is needed.
- Ports must return `Promise<AppResult<T>>` (i.e. `Promise<Result<T, DomainError>>`).
- Never throw across layer boundaries — always return a `Result`.

## Adapter Implementations
- Each adapter lives in its own directory under `src/adapters/secondary/<provider>/`.
- Adapters may only import from `domain/ports/`, `domain/errors/`, `domain/model/`, and `shared/`.
- Never import one adapter from another — communicate through ports only.
- External HTTP clients (`fetch`) are instantiated inside the adapter; never leak to domain.

## OpenRouter / LLM Gateway
- All LLM calls go through `ILlmGateway` — never call HTTP directly from use cases.
- Include `HTTP-Referer` and `X-Title` headers on every request (OpenRouter requirement).
- Model names are constants in `src/shared/constants.ts` — never hardcode strings in business logic.
- Map HTTP 4xx → `LlmUnavailableError`; HTTP 5xx → `ExternalServiceError`.

## Google APIs
- OAuth2 token persistence is handled exclusively in `src/adapters/secondary/google/google-auth.ts`.
- Refresh logic is transparent to callers — the gateway handles token refresh internally.
- Scope declarations live in `src/shared/constants.ts` as `GOOGLE_SCOPES`.
- Map 401/403 responses → `CalendarAuthError`.

## Telegram Handlers
- Handlers in `src/adapters/primary/telegram/handlers/` receive a `BotContext` and call a use case.
- Handlers must not contain business logic — they translate Telegram updates into use case inputs.
- All user-facing text strings are in `src/shared/messages.ts` — never inline strings in handlers.

## Error Mapping in Adapters
| External status | Domain error |
|---|---|
| Network failure | `LlmUnavailableError` / `ExternalServiceError` |
| HTTP 4xx (client) | `LlmUnavailableError` |
| HTTP 5xx (server) | `ExternalServiceError` |
| 401 / 403 (Google) | `CalendarAuthError` |
