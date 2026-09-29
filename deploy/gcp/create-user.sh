#!/usr/bin/env bash
# Invite a user to the hosted AiOps preview (sign-up is closed).
#   bash deploy/gcp/create-user.sh <email> [role ...]      roles: viewer | deployer | admin
# Creates the user in the `runway` realm with a temporary password that Keycloak makes them
# change at first sign-in. The temporary password is stored in Secret Manager
# (aiops-initial-password-<email>) and never printed.
set -euo pipefail

EMAIL=${1:?usage: create-user.sh <email> [role ...]}
shift
ROLES=("$@")
[[ ${#ROLES[@]} -gt 0 ]] || ROLES=(viewer)
[[ "$EMAIL" =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] || { echo "Not an email: $EMAIL"; exit 1; }
for r in "${ROLES[@]}"; do [[ "$r" =~ ^(viewer|deployer|admin)$ ]] || { echo "Unknown role: $r"; exit 1; }; done

PROJECT=${PROJECT:-enliv-342806}
REGION=${REGION:-asia-southeast1}
GCLOUD=${GCLOUD:-gcloud}

KC_URL=$("$GCLOUD" run services describe aiops-keycloak --region "$REGION" --project "$PROJECT" --format='value(status.url)')
ADMIN_PW=$("$GCLOUD" secrets versions access latest --secret=aiops-keycloak-admin-password --project "$PROJECT")
TEMP_PW=$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)
SECRET="aiops-initial-password-$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9\n' '-')"
export KC_URL ADMIN_PW TEMP_PW EMAIL
ROLE_LIST="${ROLES[*]}"
export ROLE_LIST

# kcadm from the Keycloak image; output is discarded so nothing secret reaches the terminal.
docker run --rm -e KC_URL -e ADMIN_PW -e TEMP_PW -e EMAIL -e ROLE_LIST --entrypoint bash \
  quay.io/keycloak/keycloak:26.7.4 -c '
    set -euo pipefail
    k=/opt/keycloak/bin/kcadm.sh; c=/tmp/kcadm.config
    $k config credentials --config $c --server "$KC_URL" --realm master \
      --user aiops-bootstrap-admin --password "$ADMIN_PW" >/dev/null 2>&1
    if [[ -n "$($k get users --config $c -r runway -q exact=true -q email="$EMAIL" --fields id --format csv --noquotes)" ]]; then
      echo "User already exists: $EMAIL"; exit 3
    fi
    $k create users --config $c -r runway -s username="$EMAIL" -s email="$EMAIL" \
      -s emailVerified=true -s enabled=true >/dev/null 2>&1
    $k set-password --config $c -r runway --username "$EMAIL" --new-password "$TEMP_PW" --temporary >/dev/null 2>&1
    for role in $ROLE_LIST; do $k add-roles --config $c -r runway --uusername "$EMAIL" --rolename "$role"; done
  ' || { rc=$?; [[ $rc -eq 3 ]] && exit 0; exit $rc; }

if "$GCLOUD" secrets describe "$SECRET" --project "$PROJECT" >/dev/null 2>&1; then
  printf %s "$TEMP_PW" | "$GCLOUD" secrets versions add "$SECRET" --project "$PROJECT" --data-file=- >/dev/null
else
  printf %s "$TEMP_PW" | "$GCLOUD" secrets create "$SECRET" --project "$PROJECT" --data-file=- \
    --replication-policy=automatic --labels=runway-project=aiops,runway-env=preview,managed-by=create-user >/dev/null
fi

echo "Invited $EMAIL (roles: $ROLE_LIST)."
echo "Temporary password (change required at first sign-in):"
echo "  gcloud secrets versions access latest --secret=$SECRET --project $PROJECT"
