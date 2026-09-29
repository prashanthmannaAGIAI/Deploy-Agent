#!/usr/bin/env bash
# DEV ONLY. Creates the local development user from DEV_USER_EMAIL / DEV_USER_PASSWORD.
# Runs as a one-shot compose job after Keycloak is healthy. It is deliberately not part of
# realm-runway.json or any realm export, so the user never exists outside local development.
set -euo pipefail

if [[ "${RUNWAY_ENV:-dev}" != "dev" ]]; then
  echo "RUNWAY_ENV is '${RUNWAY_ENV}', not dev: refusing to create a dev user."
  exit 1
fi
if [[ -z "${DEV_USER_EMAIL:-}" || -z "${DEV_USER_PASSWORD:-}" ]]; then
  echo "DEV_USER_EMAIL or DEV_USER_PASSWORD not set: skipping dev user."
  exit 0
fi

kcadm=/opt/keycloak/bin/kcadm.sh
config=/tmp/kcadm.config
# Values come from the job's environment; output is discarded so nothing secret reaches the logs.
"$kcadm" config credentials --config "$config" --server http://keycloak:8080 --realm master \
  --user "$KEYCLOAK_ADMIN_USER" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null

existing=$("$kcadm" get users --config "$config" -r runway -q exact=true -q email="$DEV_USER_EMAIL" --fields id --format csv --noquotes)
if [[ -n "$existing" ]]; then
  echo "Dev user already exists: ${DEV_USER_EMAIL}"
  exit 0
fi

"$kcadm" create users --config "$config" -r runway \
  -s username="$DEV_USER_EMAIL" -s email="$DEV_USER_EMAIL" -s emailVerified=true -s enabled=true \
  -s firstName=Dev -s lastName=User >/dev/null
"$kcadm" set-password --config "$config" -r runway --username "$DEV_USER_EMAIL" \
  --new-password "$DEV_USER_PASSWORD" >/dev/null
"$kcadm" add-roles --config "$config" -r runway --uusername "$DEV_USER_EMAIL" --rolename deployer
echo "Created dev user: ${DEV_USER_EMAIL} (role: deployer)"
