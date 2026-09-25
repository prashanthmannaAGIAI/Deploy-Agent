# Architecture

Runway deploys an application from a Git repository to a customer's cloud account, then shows what happened. This page is the map; `CLAUDE.md` holds the rules and `docs/adr/` the decisions.

## Components

```
Browser ──HTTPS/WS──▶ apps/web (Next.js) ──REST/WS──▶ apps/api (FastAPI)
                          │ OIDC                         │   │   │
                          ▼                              │   │   └──▶ Redis (log pub/sub)
                       Keycloak                          │   └──────▶ Postgres (+pgvector)
                                                         ▼
                                             Temporal ◀── services/worker
                                                              │ starts one per deployment
                                                              ▼
                                                   runner container (git, buildx,
                                                   terraform/tofu, kubectl, helm, clouds)
                                                              │ short-lived credentials
                                                              ▼
                                                   customer cloud (local k8s / AWS / GCP)
```

| Component | Path | Responsibility |
|---|---|---|
| Web | `apps/web` | Wizard, live deploy-spec panel, deploy screen (xterm.js), monitoring (ECharts), agent drawer. Auth.js against Keycloak. |
| API | `apps/api` | REST + WebSocket. Users, orgs, projects, deploy specs (drafts + versions), connections, deployments, audit log. Starts workflows; relays log lines from Redis to browsers. |
| Worker | `services/worker` | Temporal workflows and activities. One workflow per deployment. |
| Runner | `runner/` | Docker image with deploy tooling. One ephemeral container per deployment; credentials only as env vars; destroyed afterwards. |
| Spec | `packages/spec` | `runway.yaml` Pydantic models (`apiVersion: runway/v1`), generated JSON Schema and TS types for the web app. |
| Agent | `packages/agent` | Repo scan, Dockerfile/pipeline generation, failure diagnosis, chat. `LLMProvider` interface: `anthropic`, `ollama`. |
| Cloud | `packages/cloud` | `CloudProvider` interface; adapters `local`, `aws`, `gcp`. |
| SCM | `packages/scm` | `SourceProvider` interface; adapters `github` (later `bitbucket`, `gitlab`). |
| IaC | `infra/modules` | Terraform modules per target (`local-k8s`, `aws-ecs-fargate`, `gcp-cloud-run`). |
| Customer setup | `infra/customer-setup` | Least-privilege IAM policy / CloudFormation / GCP roles customers install. |

## Deploy spec

`runway.yaml` is the single source of truth. The wizard edits it, the agent proposes patches to it, the workflow reads it. Specs are versioned per project; a deployment pins one spec version.

## Deployment workflow

Temporal workflow, activities idempotent and retry-safe:

`clone → test → build → scan → push → plan → cost-estimate → policy-check → approval (signal; production) → apply → release → health-check → (rollback on failure, if enabled)`

Each log line is redacted of known secret values, persisted (Postgres table behind a `LogStore` interface; ClickHouse later), and published to Redis for WebSocket fan-out.

On failure the agent gets the failed step's last 200 lines plus all error lines, cloud events, and only the relevant source files, and returns a structured diagnosis: cause, evidence (file/line or log line), fix (spec patch or file diff), confidence. "Apply fix and redeploy" patches the spec and restarts from the earliest affected step.

## Trust boundaries

- The agent proposes; the user approves. No infra apply or default-branch push without an explicit user action. Generated files go to a new branch + pull request.
- Cloud credentials: short-lived by preference (AWS role + external ID, GCP WIF). Stored credentials use envelope encryption behind `SecretStore` (local key in dev; KMS/Vault later), scoped per project, every use audited.
- Terraform state lives in a bucket in the customer's account by default.

## Local development

`deploy/docker-compose.yml` runs Postgres 16 + pgvector, Redis, Temporal + UI and Keycloak. The web app and API run on the host (`pnpm dev:web`, `pnpm dev:api`). The zero-cost `local` cloud (kind/k3d + local registry) arrives with the deploy workflow in Phase 5.

| Service | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8000 (docs at `/docs`) |
| Temporal UI | http://localhost:8233 |
| Keycloak | http://localhost:8081 (realm `runway`) |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |
