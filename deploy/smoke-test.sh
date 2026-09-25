#!/usr/bin/env bash
# Probes every service in deploy/docker-compose.yml. Run from the repo root after `pnpm compose:up`.
set -euo pipefail

compose() { docker compose -f deploy/docker-compose.yml --env-file .env "$@"; }
env_value() { grep -E "^$1=" .env | cut -d= -f2-; }

ui_port=$(env_value TEMPORAL_UI_PORT); ui_port=${ui_port:-8233}
kc_port=$(env_value KEYCLOAK_PORT); kc_port=${kc_port:-8081}
db_name=$(env_value POSTGRES_DB); db_name=${db_name:-runway}

check() { printf '%-40s' "$1"; shift; if "$@" >/dev/null 2>&1; then echo ok; else echo FAILED; exit 1; fi; }

check "postgres: pgvector in ${db_name}" \
  compose exec -T postgres sh -c "psql -U \"\$POSTGRES_USER\" -d ${db_name} -tAc \"SELECT 1 FROM pg_extension WHERE extname='vector'\" | grep -q 1"
check "redis: ping" compose exec -T redis sh -c "redis-cli ping | grep -q PONG"
check "temporal: cluster health" compose exec -T temporal sh -c "temporal operator cluster health --address temporal:7233 | grep -q SERVING"
check "temporal ui: http" curl -fsS "http://127.0.0.1:${ui_port}/"
check "keycloak: runway realm discovery" \
  sh -c "curl -fsS http://127.0.0.1:${kc_port}/realms/runway/.well-known/openid-configuration | grep -q '/realms/runway'"
echo "All services healthy."
