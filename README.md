# AiOps — Your DevOps Agent

An AI agent that deploys an application from a Git repository to your cloud account in one click, then shows what happened. Powered By Zosa Agentic.

"Runway" was the working name and remains in code identifiers (package names, the `runway.yaml` / `runway/v1` spec format, the Keycloak realm id). Everything users see says AiOps.

Status: Phase 1 (web shell and auth). See [docs/PROGRESS.md](docs/PROGRESS.md) for where things stand and [docs/architecture.md](docs/architecture.md) for how the pieces fit.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Git | any recent | |
| Node.js | 20+ | 22 LTS used in CI |
| pnpm | 12 | `corepack enable pnpm` (the version is pinned in `package.json`) |
| Python | 3.12 | |
| uv | 0.5+ | https://docs.astral.sh/uv/ |
| Docker | Docker Desktop (Windows/macOS needs WSL 2 / its VM running) or Docker Engine + Compose v2 | |

Later phases also need Terraform or OpenTofu, kubectl, Helm, kind or k3d, and optionally the AWS CLI, gcloud and Ollama.

## First-time setup

```bash
git clone https://github.com/prashanthmannaAGIAI/Deploy-Agent.git
cd Deploy-Agent
cp .env.example .env          # then replace every change-me value
pnpm install
uv sync
```

## Run locally

```bash
pnpm compose:up               # Postgres, Redis, Temporal + UI, Keycloak (waits until healthy)
bash deploy/smoke-test.sh     # optional: probes every service
pnpm dev:api                  # API on http://localhost:8000 (health: /healthz, docs: /docs)
pnpm dev:web                  # web on http://localhost:3000
pnpm compose:down             # stop services (add -v to docker compose down to wipe data)
```

### Sign in locally

`pnpm compose:up` also runs a one-shot job that creates the dev user from `DEV_USER_EMAIL` and `DEV_USER_PASSWORD` in `.env` (dev only). Open http://localhost:3000, enter that email, click **Continue**, and enter the password on the AiOps (Keycloak) sign-in page.

Changed the realm file or the dev user? Keycloak only imports the realm on first start: `docker compose -f deploy/docker-compose.yml --env-file .env down` then `docker volume rm runway_keycloak-data` and `pnpm compose:up` again.

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| Temporal UI | http://localhost:8233 |
| Keycloak admin | http://localhost:8081/admin (user/password from `.env`) |

Port already in use (for example a local PostgreSQL on 5432)? Change the matching `*_PORT` in `.env` (`POSTGRES_PORT=5433`, and the port in `DATABASE_URL`) and run `pnpm compose:up` again.

## Checks

```bash
pnpm check        # format check, lint, typecheck, unit tests (JS + Python)
pnpm format       # auto-fix formatting (Prettier + ruff)
```

Individually: `pnpm lint`, `pnpm typecheck` (tsc + mypy), `pnpm test` (Vitest + pytest).

End-to-end (needs `pnpm compose:up`; first time run `pnpm --filter @runway/web exec playwright install chromium`):

```bash
pnpm e2e          # Playwright: sign in as the dev user, walk the wizard, sign out
```

Deploy spec: the Pydantic models in `packages/spec/src/runway_spec/models.py` are the source of truth. After changing them run `pnpm spec:generate` to refresh the JSON Schema and the TypeScript types (`@runway/spec`); CI fails if they are stale.

## Repository layout

```
apps/web/            Next.js frontend
apps/api/            FastAPI service
services/worker/     Temporal workflows and activities
packages/agent/      AI agent
packages/spec/       Deploy spec (runway.yaml) models and schema
packages/cloud/      Cloud adapters
packages/scm/        GitHub / Bitbucket adapters
runner/              Deploy runner image
infra/modules/       Terraform modules per target
infra/customer-setup/ IAM / role templates customers install
deploy/              docker compose for local dev
docs/                Architecture, ADRs, UI spec, progress, prototype
```

## Security

Never commit secrets. `.env` is git-ignored; add every new variable to `.env.example` with a comment. See `CLAUDE.md` for the full rules.
