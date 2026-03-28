# /project:review

Perform a structured code review of the staged or specified changes.

## Steps

1. Run `npm run typecheck` and report any type errors first.
2. Run `npm run lint` and surface any ESLint violations.
3. Check that every changed file respects the rules in `.claude/rules/`:
   - `code-style.md`: strict TS, no `any`, hexagonal layer boundaries
   - `review.md`: PR size, JSDoc on public functions, no `console.log`
   - `testing.md`: new behaviour covered, fakes used for unit tests
   - `api-conventions.md`: port interfaces, adapter boundaries, provider conventions
4. Verify that `domain/` imports contain no framework or adapter references.
5. Check all new public functions have explicit return types and JSDoc.
6. Verify test coverage has not dropped below 80% on `domain/` and `application/`.
7. List findings grouped by: **Blocking** | **Suggestion (nit)** | **Praise**.

## Output Format

```
## Review Summary

### Blocking
- [file:line] Description of issue

### Suggestions (nit)
- [file:line] Optional improvement

### Praise
- What was done well
```
