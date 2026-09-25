# Deploy Agent (working product name: Runway)

This file is the standing brief for Claude Code working in this repository. Read it fully at the start of every session, then read `docs/PROGRESS.md` to see where the last session stopped.

## What we are building

An AI agent for cloud engineers, DevOps engineers and developers that deploys an application from a Git repository to a cloud account in one click, then shows what happened.

The user journey (already designed, see the prototype):

1. Sign in (email + password, GitHub, Google, SSO). MFA required for accounts that can deploy to production.
2. Choose a cloud: AWS, Google Cloud, Azure, DigitalOcean, Oracle Cloud.
3. Connect the cloud. Preferred: short-lived credentials (AWS cross-account IAM role with external ID, GCP Workload Identity Federation, Azure federated credential). Fallback: access keys / service account key / client secret, encrypted at rest.
4. Connect the code: GitHub (GitHub App preferred, PAT fallback) or Bitbucket (OAuth preferred, access token fallback), GitLab later. Pick repository and branch.
5. The agent scans the repo and detects the stack.
6. Choose the deployment target: containerised web service, Kubernetes, serverless, VMs, static site.
7. Answer build questions: stack, runtime version, Docker (use existing / generate / buildpacks), build and start commands, port.
8. Answer infrastructure questions: Terraform / OpenTofu / none, state location, Kubernetes cluster (new/existing), Helm, size, autoscaling, managed database, domain and TLS.
9. Answer pipeline questions: where CI runs (GitHub Actions / Bitbucket Pipelines / our runners), trigger, tests, security scan, production approval, automatic rollback, notifications, environment variables and secrets.
10. Review: resources to be created, cost estimate, policy checks, explicit "I've reviewed this plan" confirmation.
11. Deploy: live step list and streaming log. On failure the agent diagnoses the cause from logs + source code and offers a one-click fix. On success, show the URL.
12. Monitoring: metrics, logs and events pulled from the target cloud's native tools (CloudWatch, Cloud Monitoring/Logging, Azure Monitor, Prometheus/Loki for Kubernetes).
13. An "Ask agent" panel available on every screen.

Every answer in the wizard is written into one **deploy spec** (`runway.yaml`), shown live in a side panel. The deploy spec is the single source of truth shared by the UI, the agent and the workflow engine.

## The prototype is the UI source of truth

`docs/prototype/runway-prototype.html` is a working single-file prototype. Open it in a browser before building any screen. Match its screens, flow, copy, validation messages, colour tokens (light and dark), typography (IBM Plex Sans / IBM Plex Mono) and the live deploy-spec panel. Rebuild it properly in the real stack; do not embed the prototype file in the app. Its simulated data (scripted agent replies, fake logs, fake metrics) must be replaced with real implementations.

## Stack (do not change without asking)

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces for JS, uv for Python |
| Frontend | Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui, xterm.js for logs, ECharts for charts |
| Auth | Keycloak (OIDC) in dev via docker compose; Auth.js / next-auth in the web app |
| API | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 + Alembic |
| Workflow engine | Temporal (Python SDK) |
| AI agent | Anthropic Python SDK with tool use; model from env `ANTHROPIC_MODEL` (default `claude-sonnet-5`) |
| Deploy runner | Docker image with git, docker buildx, terraform, opentofu, kubectl, helm, aws, gcloud, az CLIs. Locally run as a Docker container per deployment; later as Kubernetes Jobs |
| Database | PostgreSQL 16 (+ pgvector) |
| Cache / pub-sub | Redis (log fan-out to browsers) |
| Log storage | Postgres table for MVP behind an interface; ClickHouse later |
| Secrets | Envelope encryption behind a `SecretStore` interface: local implementation for dev, AWS KMS / HashiCorp Vault implementations later |
| IaC | Terraform modules in `infra/modules/` |
| Guardrails | Checkov on generated IaC, Infracost for cost estimates, Trivy for image scans |
| Tests | pytest, Vitest, Playwright for end-to-end |
| CI for this repo | GitHub Actions |

## Repository layout

```
apps/web/            Next.js frontend
apps/api/            FastAPI service (REST + WebSocket)
services/worker/     Temporal workflows and activities
packages/agent/      AI agent: repo scanner, generators, failure diagnosis, chat
packages/spec/       Deploy spec: Pydantic models + generated JSON Schema + TS types
packages/cloud/      Cloud adapters (aws, gcp, ...) behind one interface
packages/scm/        GitHub / Bitbucket adapters behind one interface
runner/              Dockerfile and entrypoint for the deploy runner image
infra/modules/       Terraform modules per target (aws-ecs-fargate, gcp-cloud-run, ...)
deploy/              docker-compose.yml for local dev, Helm chart for the platform itself
docs/                Architecture, ADRs, PROGRESS.md, prototype
.github/workflows/   CI for this repository
```

## Architecture rules

- The deploy spec schema lives in `packages/spec` and is versioned (`apiVersion: runway/v1`). Frontend types are generated from it; never hand-write duplicate types.
- Cloud and SCM providers sit behind interfaces (`CloudProvider`, `SourceProvider`). Adding a cloud must not require changes outside its adapter and its Terraform modules.
- A deployment is a Temporal workflow with these activities: clone, test, build, scan, push, plan, cost-estimate, policy-check, approval (signal; required for production), apply, release, health-check, and rollback on failure when enabled. Activities are idempotent and retry safely.
- Each deployment runs in its own ephemeral runner container. Credentials are injected as environment variables at start and never written to disk or to logs. The container is destroyed afterwards.
- Every log line is persisted and streamed to the browser over WebSocket via Redis pub-sub.
- Terraform state goes in a bucket in the customer's own account by default.
- The agent proposes; the user approves. The agent never applies infrastructure changes or pushes to a user's default branch without an explicit user action. Generated files (Dockerfile, pipeline YAML, Helm chart) are committed to a new branch and opened as a pull request.
- Failure diagnosis: the agent receives the failed step's logs, cloud events and relevant source files, and must return a structured result (cause, evidence with file/line or log line, proposed fix as a spec patch or file diff, confidence). The UI renders that structure.

## Security rules (non-negotiable)

- Never commit secrets. Use `.env` files that are git-ignored; keep `.env.example` up to date with every variable and a comment.
- Never print credentials, tokens or keys in logs, test output, error messages or commit messages. Redact known secret values from runner logs before persisting.
- Encrypt all stored credentials. Scope them per project. Record every credential use in an audit log.
- Request least-privilege permissions. Ship the IAM policy / CloudFormation template / GCP role definitions the customer needs in `infra/customer-setup/`.
- Validate and sanitise all user input used in shell commands, Terraform variables or file paths. No `shell=True` with user-supplied strings.
- Only use sandbox / test cloud accounts during development. Never run `terraform apply` against an account unless the user explicitly asks in the current session.

## MVP scope

Build the MVP first and nothing beyond it until the user says so:

- Clouds: `local` (Kubernetes on the developer machine, zero cost), AWS and GCP.
- Targets: containerised web service only (AWS ECS Fargate, GCP Cloud Run).
- Stacks: Node.js and Python.
- Source: GitHub (App + PAT). Bitbucket is phase 2.
- Everything else in the UI can exist as the prototype shows it, but options outside the MVP are disabled with a "Coming soon" label rather than faked.

## Build phases

Work one phase at a time. At the end of each phase: all tests pass, `docker compose up` works from a clean clone, `docs/PROGRESS.md` is updated, changes are committed and pushed, and you stop and summarise for the user before starting the next phase.

0. **Foundations**: monorepo scaffold, docker compose (Postgres, Redis, Temporal + UI, Keycloak), lint/format/typecheck config, CI workflow, `.env.example`, `docs/architecture.md`, `docs/PROGRESS.md`.
1. **Web shell and auth**: Next.js app with the prototype's design tokens, layout, login via Keycloak, and all wizard screens wired to local state with the live deploy-spec panel. Deploy spec schema in `packages/spec`.
2. **Projects and persistence**: API endpoints and DB models for users, organisations, projects, deploy specs (drafts and versions), deployments, log lines, audit events. Wizard saves drafts.
3. **Connections**: AWS (assume role with external ID; access-key fallback), GCP (workload identity; service account key fallback), GitHub (App install flow; PAT fallback). "Test connection" does real permission checks. `SecretStore` with local encryption.
4. **Agent: repo scan and generation**: clone read-only, detect stack/port/commands, generate Dockerfile and GitHub Actions workflow, open a PR with generated files. Agent chat endpoint with tool use.
5. **Deploy workflow**: runner image, Temporal workflow and activities, Terraform modules for ECS Fargate and Cloud Run, plan + approval + apply, health check, rollback, live log streaming to the deploy screen.
6. **Failure diagnosis**: structured diagnosis on failure, one-click "apply fix and redeploy" that patches the spec and reruns from the right step.
7. **Monitoring**: CloudWatch and Cloud Monitoring/Logging adapters, metrics charts, log search, events timeline.
8. **Hardening**: Checkov, Infracost, Trivy integrated into the workflow; RBAC (viewer, deployer, admin); audit log screen; Playwright end-to-end test of the full happy path and the port-mismatch failure path.

## Cost rules

Keep development spend close to zero. Follow these unless the user says otherwise.

Zero-cost development mode (the default until the user says otherwise):
- Add a `local` cloud provider that deploys to a local Kubernetes cluster (kind or k3d) with a local registry. It implements the same `CloudProvider` interface and runs the full workflow: build, push, plan, apply (Terraform `kubernetes`/`helm` providers), release, health check, failure diagnosis, logs and metrics (Prometheus + Loki in the local cluster). Build and test every phase against `local` first.
- Put the LLM behind an `LLMProvider` interface with two implementations: `anthropic` and `ollama` (local open-source model). Select with `LLM_PROVIDER`; default `ollama` in dev. Keep prompts and structured outputs identical across providers so switching is a config change.
- Real AWS/GCP deployments happen only when the user explicitly asks, staying inside free tiers and credits.

Working efficiently in Claude Code:
- In phase 0, read `docs/prototype/runway-prototype.html` once and write a compact `docs/ui-spec.md` (screens, fields, copy, validation messages, colour tokens). In later sessions read `docs/ui-spec.md` instead of the prototype, and open the prototype only to check a specific detail.
- Read only the files a task needs. Do not re-read the whole repo at the start of a session; `docs/PROGRESS.md` says where things are.
- Keep `docs/PROGRESS.md` short: current phase, what's done, what's next, open questions. Roll finished phases into a few summary lines.

The product's own AI agent:
- Route by task: use `ANTHROPIC_MODEL_FAST` (default `claude-haiku-4-5-20251001`) for stack detection, classification and short answers; use `ANTHROPIC_MODEL` for failure diagnosis, IaC generation and chat.
- Use prompt caching for system prompts and tool definitions.
- Never send whole logs or repos to the model. Send the last 200 lines of the failed step, all error lines, and only the source files the diagnosis needs. Cap each request's input size in config.
- Unit and integration tests use recorded model responses (fixtures), not live API calls. Live calls only in a manually triggered test.

Cloud resources during development:
- Test on GCP Cloud Run first; it scales to zero and costs almost nothing when idle.
- AWS dev environment: no NAT Gateway. Use public subnets with tight security groups for dev, or VPC endpoints. Private subnets + NAT only in the production module variant.
- AWS dev defaults: Fargate Spot, smallest task size, desired count 0 when not testing. Create the load balancer only in end-to-end tests that need it.
- Tag every resource Runway creates with `runway:project`, `runway:env` and `runway:expires-at`. Provide a `make cleanup` script that destroys expired test resources in both clouds, and have end-to-end tests run `terraform destroy` when they finish, even on failure.
- Use `moto` (AWS) and fakes for unit tests. Real cloud calls only in end-to-end tests.
- Remind the user to set a billing alert before the first real deployment in phase 5.

CI for this repository:
- Cache pnpm and uv dependencies. Cancel superseded runs on the same branch.
- Run lint, typecheck and unit tests on every push; run end-to-end and cloud tests only on pull requests to `main` or on manual trigger.

Hosting the platform itself (after the MVP):
- Start without Kubernetes: run web, API and worker as containers on Cloud Run or ECS Fargate, with one small managed Postgres (also used by Temporal and for log storage) and a small Redis. Move to Kubernetes, ClickHouse and Vault only when load or customers require it.

## Working conventions

- Before writing code in a phase, write a short plan in `docs/PROGRESS.md` and follow it.
- Small, focused commits using Conventional Commits (`feat(api): ...`, `fix(web): ...`). Push to `main` only for phase 0; from phase 1 use a branch per phase (`phase-1-web-shell`) and open a pull request.
- Write tests alongside code. Target meaningful coverage of the spec, adapters, workflow and agent output parsing.
- Record significant decisions as short ADRs in `docs/adr/`.
- If something in this brief is ambiguous or blocked (missing credentials, missing GitHub App, a tool not installed), stop and ask the user rather than guessing or faking it.
- Keep `README.md` current with setup and run instructions a new engineer can follow.
