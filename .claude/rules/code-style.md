# Code Style

## Language & Runtime
- **TypeScript strict mode** always enabled (`"strict": true` in tsconfig)
- No `any` type — use `unknown` and narrow explicitly
- Prefer `type` over `interface` unless declaration merging is needed
- Use ES modules (`import`/`export`), never CommonJS `require`

---

## Hexagonal Architecture

### Layer structure
```
src/
├── domain/          # Pure business logic — no framework, no I/O
│   ├── model/       # Entities and Value Objects
│   ├── ports/       # Input & output port interfaces
│   └── service/     # Domain services / use cases
├── application/     # Orchestration layer (use cases implementation)
├── adapters/
│   ├── primary/     # Driving adapters (HTTP, CLI, queue consumers)
│   └── secondary/   # Driven adapters (DB, external APIs, file system)
└── shared/          # Cross-cutting utilities (errors, types, helpers)
```

### Rules
- **Domain is king**: `domain/` must never import from `adapters/` or any framework
- **Depend on abstractions**: adapters implement ports, never the other way around
- **One responsibility per file**: one entity, one use case, one adapter
- All inter-layer communication goes through **port interfaces**, not concrete classes
- Framework code (Express, Fastify, Prisma…) lives exclusively in `adapters/`

---

## Naming
| Concept | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `create-order.ts` |
| Classes / Types | `PascalCase` | `OrderService` |
| Functions / variables | `camelCase` | `createOrder` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Port interfaces | `I` prefix | `IOrderRepository` |

---

## Functions
- Prefer small, pure functions — no hidden side effects
- Max **3 parameters**; beyond that use an options object
- Always declare explicit return types
- Avoid nested callbacks — use `async/await`

---

## Errors
- Define domain errors as typed classes in `domain/errors/`
- Never swallow errors silently
- Use `Result<T, E>` pattern (or `neverthrow`) instead of throwing in domain logic

---

## General
- No magic numbers or strings — use named constants
- Max **300 lines per file**; split if longer
- Imports ordered: Node built-ins → external packages → internal modules
