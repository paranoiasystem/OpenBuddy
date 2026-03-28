# Testing Rules

## Strategy
| Level | Scope | Tools |
|---|---|---|
| **Unit** | Domain logic & use cases — no I/O, no framework | Vitest |
| **Integration** | Adapters against real or in-memory infrastructure | Vitest + testcontainers |
| **E2E** | Primary adapters (HTTP endpoints) with all layers wired | Vitest + supertest |

---

## File Layout
- Test files live **next to the source file**: `create-order.test.ts`
- One `describe` block per module, one `it` per behaviour
- Shared fixtures and fakes go in `src/__tests__/helpers/`

---

## What to Test
- Test **behaviour**, not implementation details
- Cover **happy path** and all meaningful **error paths**
- Do not test private methods or internal state directly

---

## Test Doubles
- Use **fakes** (hand-written in-memory implementations) for output ports in unit tests
- Use **mocks** only for third-party services you cannot control
- Never share mutable state between tests — reset fakes in `beforeEach`

---

## Naming
```ts
it('should <expected result> when <condition>', async () => { ... })
```

### Example
```ts
describe('CreateOrderUseCase', () => {
  it('should create an order when the product is available', async () => { ... })
  it('should return OutOfStockError when the product is unavailable', async () => { ... })
})
```

---

## Coverage
- Target **≥ 80 %** on `domain/` and `application/` layers
- Coverage below threshold blocks the CI pipeline
- `adapters/` coverage is best-effort — focus on integration tests there

---

## Rules
- Every test must be **independent** and **repeatable** — no order dependency
- No `console.log` inside tests
- No `.only` or `.skip` committed to main
- Avoid testing framework internals (routing, ORM mapping) — trust the library
