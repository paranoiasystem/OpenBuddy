# Skill: deploy

**Trigger**: Automatically invoked when working on `release/*` or `main` branches, or when asked to deploy or prepare a release.

## Purpose
Validate that the project is production-ready and guide the release process.

## Pre-flight Checks

- [ ] `npm run typecheck` — zero type errors.
- [ ] `npm run lint` — zero warnings or errors.
- [ ] `npm run test:unit` — all pass, coverage ≥ 80% on `domain/` + `application/`.
- [ ] `npm run test:integration` — all pass.
- [ ] `npm run test:e2e` — all pass.

## Docker Validation

- [ ] `docker build -t openbuddy:smoke .` succeeds without errors.
- [ ] `docker run --rm openbuddy:smoke node dist/main.js --version` exits cleanly.
- [ ] `docker history openbuddy:smoke` — no secrets baked into image layers.
- [ ] Image runs as non-root user (`openbuddy`).

## Release Checklist

- [ ] Version bumped in `package.json` following semver.
- [ ] `CHANGELOG.md` updated with all changes since last release.
- [ ] Branch is `release/<version>`, up to date with `develop`.
- [ ] All GitHub CI stages are green before merging.

## Git Operations (in order)

```bash
# 1. Merge release into main
git checkout main && git merge --no-ff release/<version>

# 2. Tag the release
git tag -a v<version> -m "Release v<version>"

# 3. Merge back into develop
git checkout develop && git merge --no-ff release/<version>

# 4. Delete release branch
git branch -d release/<version>
```

## CI Variables Required
- `GHCR_TOKEN` — GitHub Container Registry token
- `GHCR_USER` — GitHub username or org
