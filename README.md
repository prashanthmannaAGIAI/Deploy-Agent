# Runway

An AI agent that deploys an application from a Git repository to your cloud account in one click, then shows what happened.

Status: Phase 0 (foundations). See [docs/PROGRESS.md](docs/PROGRESS.md) for where things stand and [docs/architecture.md](docs/architecture.md) for how the pieces fit.

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

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8000 |
| Temporal UI | http://localhost:8233 |
| Keycloak admin | http://localhost:8081/admin (user/password from `.env`) |

## Checks

```bash
pnpm check        # format check, lint, typecheck, unit tests (JS + Python)
pnpm format       # auto-fix formatting (Prettier + ruff)
```

Individually: `pnpm lint`, `pnpm typecheck` (tsc + mypy), `pnpm test` (Vitest + pytest).

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
