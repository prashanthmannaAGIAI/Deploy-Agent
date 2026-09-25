# Progress

## Current phase: 0 — Foundations (built; compose verification pending)

### Plan

1. Monorepo scaffold: pnpm workspace (`apps/web`) and uv workspace (`apps/api`, `services/worker`, `packages/{agent,spec,cloud,scm}`), with placeholder `runner/`, `infra/modules/`, `infra/customer-setup/`.
2. Minimal runnable apps: FastAPI `GET /healthz` and a Next.js placeholder page. The real UI is Phase 1.
3. `deploy/docker-compose.yml`: Postgres 16 + pgvector (app DB + Temporal DBs), Redis, Temporal + Temporal UI, Keycloak (dev mode, realm imported from file, client secret from env).
4. Tooling: ESLint + Prettier + `tsc` for TS; ruff (lint + format) + mypy for Python; Vitest and pytest smoke tests. Root scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`, `pnpm check`.
5. CI (`.github/workflows/ci.yml`): pnpm + uv caches, cancel superseded runs, lint/typecheck/unit tests on every push. A compose smoke job runs only on PRs to `main` or on manual trigger.
6. `.env.example` (every variable, with a comment), `.gitignore`, `README.md`.
7. Docs: `docs/architecture.md`, `docs/ui-spec.md` (condensed prototype), ADRs in `docs/adr/`.
8. Verify: lint, typecheck and tests pass; `docker compose up` brings every service up healthy; commit and push to `main`.

### Done

- Steps 1–7.
- `pnpm check` passes locally (Prettier, ESLint, ruff, tsc, mypy strict, Vitest, pytest).
- `docker compose config` validates; compose refuses to start without `.env` passwords.
- Decisions: ADR 0002 (TS 6.0 / ESLint 9 / pinned Vitest, pnpm 12 supply-chain settings), ADR 0003 (local stack, Temporal auto-setup 1.29.7).

### Not yet verified

- `pnpm compose:up` + `deploy/smoke-test.sh` on the dev machine: Docker Desktop's engine can't start because WSL 2 isn't installed. Also verifiable with the CI `compose-smoke` job (manual trigger).

### Next

- Phase 1: web shell and auth (branch `phase-1-web-shell`).

### Open questions

- Install WSL 2 for Docker Desktop (needs admin + reboot).
