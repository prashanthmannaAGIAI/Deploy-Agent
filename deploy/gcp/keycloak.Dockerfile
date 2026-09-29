# AiOps Keycloak (production mode) for Cloud Run. Build from the repo root:
#   docker build -f deploy/gcp/keycloak.Dockerfile -t <image> .
# The realm file is imported on first start; the dev user job is NOT part of this image.
FROM quay.io/keycloak/keycloak:26.7.4 AS builder
ENV KC_DB=postgres KC_HEALTH_ENABLED=true KC_CACHE=local
COPY deploy/keycloak/themes/runway /opt/keycloak/themes/runway
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.7.4
COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY deploy/keycloak/realm-runway.json /opt/keycloak/data/import/realm-runway.json
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
