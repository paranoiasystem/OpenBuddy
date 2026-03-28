# Code Review Rules

## Before Opening a PR
- [ ] All tests pass locally
- [ ] No `TODO` / `FIXME` left without a linked issue
- [ ] No `console.log` in production code
- [ ] Types are explicit — no implicit `any`
- [ ] New public functions have a JSDoc comment
- [ ] PR description explains **what** changed and **why**

---

## PR Size
- Keep PRs **small and focused** — one feature or fix per PR
- If a PR touches more than **10 files**, consider splitting it
- Prefer a chain of small PRs over one large refactor

---

## Reviewer Guidelines

### Focus on
- **Logic and design correctness**, not formatting (that's the linter's job)
- Any leakage of framework code into the `domain/` layer
- Missing or weak test coverage on new behaviour
- Unclear naming that will confuse the next reader

### Tone
- Prefer **questions** over demands: `"What do you think about extracting this into a port?"`)
- Distinguish **blocking** comments from **suggestions** (prefix with `nit:` for non-blocking)
- Approve only when you would be comfortable owning that code yourself

---

## Merge Criteria
- At least **1 approval** from a team member
- CI pipeline green (lint + type-check + tests + coverage threshold)
- No unresolved blocking comments
- Branch is up to date with `main`
