import { CLOUDS, LONG_LIVED_METHODS } from "./catalogue";
import type { WizardState } from "./state";

/** Preview of the Dockerfile the agent generates (Phase 4 commits it on a branch for review). */
export function dockerfilePreview(s: WizardState): string {
  const { stack, version, port, start } = s.build;
  const p = port || "3000";
  if (stack === "python") {
    const cmd = JSON.stringify([...start.trim().split(/\s+/), "--bind", `0.0.0.0:${p}`]);
    return [
      `FROM python:${version}-slim`,
      "WORKDIR /app",
      "COPY requirements.txt .",
      "RUN pip install --no-cache-dir -r requirements.txt",
      "COPY . .",
      `EXPOSE ${p}`,
      `CMD ${cmd}`,
    ].join("\n");
  }
  return [
    `FROM node:${version}-alpine AS build`,
    "WORKDIR /app",
    "COPY package*.json ./",
    "RUN npm ci",
    "COPY . .",
    "RUN npm run build --if-present",
    "",
    `FROM node:${version}-alpine`,
    "WORKDIR /app",
    "COPY --from=build /app ./",
    `ENV NODE_ENV=production PORT=${p}`,
    `EXPOSE ${p}`,
    'CMD ["npm","start"]',
  ].join("\n");
}

/** What the Terraform module for this target is expected to create. The authoritative list
 *  comes from `terraform plan` in Phase 5. */
export function plannedResources(s: WizardState): string[] {
  if (!s.cloud) return [];
  const c = CLOUDS[s.cloud];
  const r = c.resources;
  const out: string[] = [];
  if (s.infra.iac !== "none") {
    out.push(
      s.cloud === "local"
        ? "Terraform state in your local cluster (Kubernetes backend)"
        : `State bucket and lock (in your ${c.name} account)`,
    );
  }
  if (s.cloud === "aws") {
    out.push(s.target.env === "production" ? "VPC with private subnets and NAT gateway" : r.net);
  } else if (s.cloud === "local") {
    out.push(r.net);
  }
  if (s.build.image !== "buildpacks") out.push(r.registry);
  out.push(`${c.services.container} service (${s.infra.min} to ${s.infra.max} instances)`);
  if (s.cloud !== "gcp") out.push(r.lb);
  out.push(r.iam, r.logs);
  if (s.infra.domain.trim())
    out.push(
      `DNS record and ${s.infra.tls ? "TLS certificate" : "HTTP listener"} for ${s.infra.domain.trim()}`,
    );
  return out;
}

/** Deterministic plan warnings shown on Review. Checkov policy checks run during planning. */
export function planWarnings(s: WizardState): string[] {
  const w: string[] = [];
  if (s.access.method && LONG_LIVED_METHODS.includes(s.access.method))
    w.push("Long-lived credentials in use");
  if (s.target.env === "production" && !s.pipe.approval)
    w.push("Production deploys without an approval step");
  if (!s.pipe.rollback) w.push("Automatic rollback is off");
  if (!s.pipe.scan) w.push("Vulnerability scanning is off");
  return w;
}
