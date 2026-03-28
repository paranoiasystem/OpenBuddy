# /project:fix-issue

Fix a GitHub/GitHub issue end-to-end following TDD.

## Arguments
`/project:fix-issue <issue-number-or-description>`

## Steps

1. Read and summarise the issue requirements.
2. Identify the affected hexagonal layer(s) and port(s).
3. Create a feature branch: `git checkout -b feature/<issue-slug>` from `develop`.
4. **Red phase**: Write a failing test next to the source file.
   - Use fakes from `src/shared/__tests__/helpers/` for output ports.
   - Name: `it('should <expected result> when <condition>')`
5. **Green phase**: Implement the minimal code to make the test pass.
6. **Refactor phase**: Clean up without breaking tests.
7. Run `npm run typecheck && npm run lint && npm test` — all must pass.
8. Verify coverage threshold: `npm run test:coverage`.
9. Draft a Conventional Commit message: `fix(<scope>): <description>`.

## Constraints
- Do not import from `adapters/` inside `domain/`.
- Do not use `any` — narrow `unknown` explicitly.
- Keep each file under 300 lines.
- All domain errors must extend `DomainError` and return `Result<T, E>`.
