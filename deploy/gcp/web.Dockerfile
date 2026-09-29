# AiOps web app (Next.js standalone) for Cloud Run. Build from the repo root:
#   docker build -f deploy/gcp/web.Dockerfile -t <image> .
FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/spec/package.json packages/spec/
RUN pnpm install --frozen-lockfile --filter "@runway/web..."
COPY apps/web apps/web
COPY packages/spec packages/spec
# Placeholders only so modules that read settings at import time can load during the build.
# Nothing here is baked into the image: the server reads real values from Cloud Run at runtime.
RUN KEYCLOAK_ISSUER=http://build.invalid KEYCLOAK_WEB_CLIENT_ID=build \
    KEYCLOAK_WEB_CLIENT_SECRET=build AUTH_SECRET=build \
    pnpm --filter @runway/web build

FROM node:22-alpine AS run
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
