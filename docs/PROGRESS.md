# Progress

## Current phase: 1 — Web shell and auth (not started)

## Phase 0 — Foundations (complete, 2026-09-28)

- pnpm + uv monorepo; FastAPI `/healthz`; Next.js placeholder; placeholder `runner/`, `infra/`.
- `deploy/docker-compose.yml`: Postgres 16 + pgvector, Redis, Temporal + UI, Keycloak (realm `runway`, client `runway-web`, roles viewer/deployer/admin). `deploy/smoke-test.sh` probes every service.
- Tooling: Prettier, ESLint, ruff, tsc, mypy strict, Vitest, pytest; `pnpm check` runs all. CI: checks on every push, compose smoke on PRs to `main` / manual.
- Docs: `architecture.md`, `ui-spec.md`, ADRs 0001–0003.
- Verified: `pnpm check` green; CI green; local `pnpm compose:up` → all 5 services healthy, smoke test passes, Keycloak client secret substituted from `.env`.
- Dev machine note: a local PostgreSQL already listens on 5432, so this machine's `.env` uses `POSTGRES_PORT=5433` (and `DATABASE_URL` on 5433).

### Next

- Phase 1 on branch `phase-1-web-shell`: plan here first, then build.

### Phase 1 decisions (from the user, 2026-09-28)

- Sign-in: email + password through Keycloak only. GitHub, Google and SSO buttons appear as in the prototype but disabled with "Coming soon".
- Dev user: created automatically on first start from `DEV_USER_EMAIL` and `DEV_USER_PASSWORD` in `.env` (add both to `.env.example`). Local development only: never put it in any realm export or config used outside local dev.

### Open questions

- None.
