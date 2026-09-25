# 3. Local development stack

Date: 2026-09-26 · Status: accepted

## Context
Phase 0 needs Postgres (+pgvector), Redis, Temporal + UI and Keycloak running locally with one command, at zero cost.

## Decision
- One `deploy/docker-compose.yml`; all ports bound to `127.0.0.1`; passwords only from `.env` (compose fails fast if missing).
- Postgres `pgvector/pgvector:*-pg16` hosts the app DB (`runway`, pgvector enabled by an init script) and Temporal's DBs.
- Temporal uses `temporalio/auto-setup:1.29.7`, which creates and migrates its schema on start. It is the last auto-setup release; moving to `temporalio/server` plus an `admin-tools` schema job is a follow-up when we need a newer server.
- Keycloak runs `start-dev` with an embedded dev database on a named volume, importing `deploy/keycloak/realm-runway.json` on first start. The client secret and redirect URLs are substituted from env vars at import.
- The web app and API run on the host for fast reloads; they are not in compose yet.

## Consequences
Changing realm settings after the first start needs `docker compose down -v` (or editing in the admin console), because import skips existing realms.
