# Progress

## Current phase: 0 — Foundations (built; local compose check pending)

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
- CI green on GitHub: checks job, and the `compose-smoke` job (all services healthy, smoke probes pass).
- Decisions: ADR 0002 (TS 6.0 / ESLint 9 / pinned Vitest, pnpm 12 supply-chain settings), ADR 0003 (local stack, Temporal auto-setup 1.29.7).

### Not yet verified (blocks marking Phase 0 complete)

- Local `pnpm compose:up` + `bash deploy/smoke-test.sh`. On 2026-09-28 WSL 2.7 was installed, but WSL 2 couldn't start ("virtualization is not enabled") and Windows had a reboot pending. Docker Desktop had also started before WSL was installed. Passed on GitHub runners.
- Next session, first: confirm `wsl --status` is clean and `docker info` answers (restart Docker Desktop if needed), `cp .env.example .env` with real values, run compose:up and the smoke test, fix failures, and only then mark Phase 0 complete.

### Next

- Phase 1: web shell and auth (branch `phase-1-web-shell`), after Phase 0 is complete.

### Phase 1 decisions (from the user, 2026-09-28)

- Sign-in: email + password through Keycloak only. GitHub, Google and SSO buttons appear as in the prototype but disabled with "Coming soon".
- Dev user: created automatically on first start from `DEV_USER_EMAIL` and `DEV_USER_PASSWORD` in `.env` (add both to `.env.example`). Local development only: never put it in any realm export or config used outside local dev.

### Open questions

- If WSL 2 still can't start after the reboot: enable "Virtual Machine Platform" (`wsl.exe --install --no-distribution` as admin) and check virtualization (Intel VT-x) in the firmware settings.
