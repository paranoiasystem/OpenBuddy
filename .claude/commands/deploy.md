# /project:deploy

Prepare and validate a production release.

## Steps

1. Confirm the current branch is `release/*` or `main`.
2. Run the full test suite:
   ```bash
   npm run test:unit && npm run test:integration && npm run test:e2e
   ```
3. Run `npm run build` and verify `dist/` is produced without errors.
4. Build the Docker image locally:
   ```bash
   docker build -t openbuddy:local .
   ```
5. Smoke-test the container:
   ```bash
   docker run --rm --env-file .env openbuddy:local node dist/main.js --version
   ```
6. Confirm `CHANGELOG.md` is updated for this version.
7. Bump version in `package.json` (semver).
8. Output the git tag command:
   ```bash
   git tag -a v<version> -m "Release v<version>"
   ```

## Required CI Variables (must be set in GitHub CI/CD settings)
- `GHCR_TOKEN` — GitHub Container Registry token
- `GHCR_USER` — GitHub username or organisation name

## Gitflow Merge Path
`release/<version>` → merge into `main` (tag) AND back into `develop`
