# Git Conventions

## Commit Format (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code restructuring (no feature/fix) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, config, tooling |
| `revert` | Reverting a previous commit |
| `ci` | CI/CD pipeline changes |
| `build` | Build system or dependency updates |

### Scope

- **kebab-case** matching the area of change: `telegram`, `openrouter`, `calendar`, `persistence`, `slang`, `config`, `docker`, `rules`
- Scope is optional but encouraged

### Rules

- Subject line: imperative mood, lowercase, no period, max 72 chars
- Body: explain **why**, not **what** (the diff shows what)
- Breaking changes: add `BREAKING CHANGE:` footer or `!` after type/scope

## Branch Strategy (Gitflow)

| Branch | Purpose | Branch from | Merge to |
|---|---|---|---|
| `main` | Production releases (tagged with semver) | — | — |
| `develop` | Integration branch | `main` | `main` (via release) |
| `feature/<name>` | New features | `develop` | `develop` |
| `hotfix/<name>` | Urgent production fixes | `main` | `main` + `develop` |
| `release/<version>` | Release preparation | `develop` | `main` + `develop` |

### Rules

- Never commit directly to `main` — use PRs
- Features branch from and merge to `develop`
- Hotfixes branch from `main`, merge to both `main` and `develop`
- PRs target `develop` unless hotfix
- Delete feature branches after merge
