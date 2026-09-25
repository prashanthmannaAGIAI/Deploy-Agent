#!/usr/bin/env bash
# Runs once, on first start of an empty data volume.
# Creates the application database and enables pgvector. Temporal creates its own databases.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
  -v dbname="$RUNWAY_DB_NAME" <<'SQL'
SELECT format('CREATE DATABASE %I', :'dbname')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'dbname')\gexec
SQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$RUNWAY_DB_NAME" \
  -c 'CREATE EXTENSION IF NOT EXISTS vector;'
