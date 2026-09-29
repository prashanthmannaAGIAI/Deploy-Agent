# Progress

## Current phase: 1 — Web shell and auth (built; waiting for user review, then PR)

Branch `phase-1-web-shell`. The pull request is opened after the user has checked the UI against the prototype.

### Plan

1. **Deploy spec** (`packages/spec`): Pydantic v2 models for `apiVersion: runway/v1` with input validation (names, repo, branch, port, env keys, domain, scaling). Generate `schema/runway.v1.schema.json` and TS types (`json-schema-to-typescript`) into `packages/spec/ts`, exposed as `@runway/spec`. `pnpm spec:generate`, plus a CI check that generated files are current. pytest for the models.
2. **Keycloak**: a dev-only `keycloak-dev-user` compose job creates `DEV_USER_EMAIL` / `DEV_USER_PASSWORD` (role `deployer`) once Keycloak is healthy. It's not in the realm file or any export. A `runway` login theme styled with the prototype tokens.
3. **Auth** (Auth.js v5 + Keycloak OIDC, PKCE): Runway sign-in page matching the prototype. Email + password go through Keycloak's hosted page (the email is passed as `login_hint`), so passwords and MFA never touch our app. GitHub / Google / SSO buttons are disabled with "Coming soon". Route protection for every app page; sign out.
4. **Design system**: Tailwind v4 with the prototype tokens (light + dark) as CSS variables, IBM Plex via `next/font`, shadcn-style primitives (Button, Input, Select, Segmented, Toggle, OptionTile, Note, Pill).
5. **Shell**: top bar (nav, Ask agent, avatar menu with sign out), empty states for Deployments and Monitoring, and an Ask agent drawer (UI only; chat arrives in Phase 4, so sending is disabled and says so).
6. **Wizard**: all 8 steps, prototype copy and validation messages, reducer-based local state (non-secret fields persisted to localStorage; credentials never persisted). Live `runway.yaml` panel with changed-line flash and a mobile bottom sheet. MVP gating: clouds local/AWS/GCP; containerised target; Node.js/Python; GitHub; other options "Coming soon". Features that need later phases (Test connection = Phase 3, repo list and scan = 3/4, Deploy = 5) are clearly marked rather than faked.
7. **Tests**: Vitest for the YAML emitter, reducer, validation and key screens; pytest for the spec.
8. Docs (README, architecture, ADR for Auth.js beta + login flow), `.env.example` updates, `pnpm check` green, commit, push, then the user reviews before a PR is opened.

### Done

- Steps 1–8.
- Branding: AiOps logo, name and "Powered By Zosa Agentic" on every page (web app and Keycloak), checked by the e2e test.
- Sign-in page redesign (user request): animated AI robot running a CI/CD pipeline, navy + logo-gradient palette, carried over to the Keycloak page. The rest of the app keeps the prototype tokens.
- Checks: `pnpm check` green (62 Vitest, 26 pytest, ESLint, ruff, tsc, mypy strict). `pnpm e2e` (Playwright, real Keycloak) green: sign-in as the dev user, all 8 wizard steps with validation messages, reload persistence, sign-out ending the Keycloak session. Smoke test also checks the dev-user job and the login theme.
- Contract test: a completed wizard produces a spec that validates against the JSON Schema generated from the Python models.
- CI: `spec:check` on every push; the PR job now also runs the Playwright tests after the compose smoke test.
- Bugs found by the browser test and fixed with tests: the draft was lost on reload under React Strict Mode; sign-out from the account menu never submitted.
- ADR 0004 (sign-in design).

### Differences from the prototype (deliberate)

- Sign-in: our page asks for the email and hands off to Keycloak's hosted page (Runway theme) for the password. See ADR 0004.
- "Test connection", "Connect GitHub" / "Verify token", secret inputs (secret keys, key files, tokens, secret env values) and agent chat are visible but disabled, each with a note naming the phase that delivers it. Repository and branch are typed in until the GitHub connection exists.
- No fake numbers: the cost card says it's priced with Infracost at plan time ($0 for local). Policy checks show only real, deterministic warnings plus "Checkov runs during planning". The resource list is labelled as an estimate until `terraform plan` provides the real list.
- "Deploy to {env}" validates everything, then says deployments arrive in Phase 5.
- Added the `local` cloud (Local Kubernetes) as the first option; Azure, DigitalOcean, Oracle, non-container targets, non-Node/Python stacks, Bitbucket/GitLab, buildpacks, managed databases, Runway-managed state and notifications are "Coming soon".
- The spec panel shows the real `runway/v1` shape (`apiVersion`, nested `scaling`, `tests.enabled`, `env` as a list).

### Next

- User review of the web shell, then open the PR for Phase 1.
- Phase 2: projects and persistence (drafts saved to the API instead of localStorage).

### Open questions

- MFA: planned as Keycloak conditional OTP for users with the `deployer` role, together with RBAC in Phase 8. Say if you want it earlier.

## Phase 0 — Foundations (complete, 2026-09-28)

- pnpm + uv monorepo; FastAPI `/healthz`; placeholder `runner/`, `infra/`.
- `deploy/docker-compose.yml`: Postgres 16 + pgvector, Redis, Temporal + UI, Keycloak (realm `runway`, client `runway-web`, roles viewer/deployer/admin). `deploy/smoke-test.sh` probes every service.
- Tooling: Prettier, ESLint, ruff, tsc, mypy strict, Vitest, pytest; `pnpm check` runs all. CI: checks on every push, compose smoke on PRs to `main` / manual.
- Docs: `architecture.md`, `ui-spec.md`, ADRs 0001–0003.
- Dev machine note: a local PostgreSQL already listens on 5432, so this machine's `.env` uses `POSTGRES_PORT=5433` (and `DATABASE_URL` on 5433).

## Custom domain (2026-09-29, branch `custom-domain`)

- Cloud Run domain mapping is not allowed in `asia-south1`, so the preview moved to `asia-southeast1` (Singapore) at the user's choice (no extra cost vs a load balancer). Addresses: https://aiops.zosa-agentic.ai and https://auth.aiops.zosa-agentic.ai. `zosa-agentic.ai` verified in Search Console by freddie.manna@thinkhat.ai; DNS at GoDaddy.
- The move recreated the Keycloak database (`aiops-keycloak-db-sg`): the admin account is re-invited and MFA re-applied.

## Hosted preview (live since 2026-09-29, branch `deploy-gcp-preview`)

- Web: https://aiops-web-152128589088.asia-south1.run.app · Keycloak: https://aiops-keycloak-152128589088.asia-south1.run.app (project `enliv-342806`, `asia-south1`). Runbook: `infra/aiops-preview/README.md`.
- Terraform in `infra/aiops-preview` (state `gs://aiops-tfstate-enliv-342806`): Cloud Run web + Keycloak (scale to zero, Cloud SQL Auth Proxy sidecar), Cloud SQL `db-f1-micro`, Secret Manager, service accounts, registry; all `aiops-*`.
- MFA (TOTP) required for admins and deployers (`deploy/keycloak/configure_mfa.py`); invite-only accounts via `deploy/gcp/create-user.sh`. First account: `admin@zosa-agentic.ai` (admin, deployer), temporary password in secret `aiops-initial-password-admin-zosa-agentic-ai`.
- Verified live: route protection, Keycloak sign-in, wizard, sign-out, MFA setup prompt for the admin.
- Fixed during rollout: Keycloak startup probe now checks readiness (a TCP probe let Cloud Run throttle CPU during first boot and the schema setup stalled); Auth.js `trustHost` now honours `AUTH_URL`.
- Next: GitHub and Google sign-in (waiting for the user's OAuth apps; link-to-invited-accounts only), SSO (waiting for the provider), then own domain.

## Decisions from the user

- 2026-09-29: MFA required for admins and deployers only; GitHub/Google sign-in may only link to invited accounts (no automatic account creation).

- 2026-09-29, hosting the platform (preview, after the Phase 1 PR is merged): Google Cloud project `enliv-342806`, region `asia-south1`, "Cheapest" option (web, API and Keycloak on Cloud Run scaling to zero; Keycloak on the smallest Cloud SQL Postgres; about $10/month, slow first sign-in after idle), default `*.run.app` URLs first and the user's own domain later, invite-only sign-in now with open sign-up later. First account: `admin@zosa-agentic.ai` (admin). The local dev user is never created there. Infrastructure as Terraform in `infra/`; plan and cost shown before any apply, applied only on the user's explicit go-ahead.
- 2026-09-28: the product is branded **AiOps** ("Your DevOps Agent") with the supplied logo, spacing-corrected with the user's approval (original kept as `aiops-logo-original.svg`). "Powered By Zosa Agentic" appears on every page, including the Keycloak sign-in page. "Runway" stays only in code identifiers.
- 2026-09-28, Phase 1: sign-in is email + password through Keycloak only; GitHub, Google and SSO shown disabled as "Coming soon". The dev user is created automatically from `DEV_USER_EMAIL` / `DEV_USER_PASSWORD`, local development only, never in any realm export.
