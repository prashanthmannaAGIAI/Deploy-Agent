import { API_VERSION } from "@runway/spec";

import { CLOUDS, SIZES } from "./catalogue";
import { projectName, type WizardState } from "./state";

/** A deploy spec under construction: `null` marks a required value that isn't set yet. */
export type DraftValue = string | number | boolean | null | Draft | Draft[];
export type Draft = { [key: string]: DraftValue };

const intOrNull = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v.trim()) : null);
const textOrNull = (v: string) => v.trim() || null;

/** Maps wizard answers onto the runway/v1 spec shape (see packages/spec). */
export function toSpec(s: WizardState): Draft {
  const isStatic = s.target.type === "static";
  const build: Draft = {
    stack: s.build.stack,
    version: textOrNull(s.build.version),
    image: s.build.image,
  };
  if (s.build.command.trim()) build.command = s.build.command.trim();
  if (isStatic) {
    build.output_dir = textOrNull(s.build.outputDir);
  } else {
    build.start = textOrNull(s.build.start);
    build.port = intOrNull(s.build.port);
  }

  const infrastructure: Draft = { iac: s.infra.iac };
  if (s.infra.iac !== "none") infrastructure.state = s.infra.state;
  infrastructure.size = s.infra.size;
  infrastructure.scaling = { min: intOrNull(s.infra.min), max: intOrNull(s.infra.max) };
  infrastructure.database = s.infra.database;
  if (s.infra.domain.trim()) {
    infrastructure.domain = s.infra.domain.trim().toLowerCase();
    infrastructure.tls = s.infra.tls;
  }

  const runsIn =
    s.pipe.runsIn === "runway"
      ? "runway"
      : (
          {
            github: "github-actions",
            bitbucket: "bitbucket-pipelines",
            gitlab: "gitlab-ci",
          } as const
        )[s.repo.provider];
  const tests: Draft = { enabled: s.pipe.tests };
  if (s.pipe.tests) tests.command = textOrNull(s.pipe.testCmd);

  return {
    apiVersion: API_VERSION,
    project: projectName(s.repo.name) || null,
    environment: s.target.env,
    cloud: { provider: s.cloud, region: textOrNull(s.access.region), auth: s.access.method },
    source: {
      provider: s.repo.provider,
      repo: textOrNull(s.repo.name),
      branch: textOrNull(s.repo.branch),
    },
    target: { type: s.target.type },
    build,
    infrastructure,
    pipeline: {
      runs_in: runsIn,
      trigger: s.pipe.trigger,
      tests,
      security_scan: s.pipe.scan,
      approval: s.pipe.approval ? "production" : "none",
      rollback: s.pipe.rollback ? "automatic" : "manual",
      notify: s.pipe.notify,
    },
    env: s.pipe.env
      .filter((e) => e.name.trim())
      .map((e): Draft =>
        e.secret ? { name: e.name.trim(), secret: true } : { name: e.name.trim(), value: e.value },
      ),
  };
}

/** Inline comments shown next to values in the spec panel. Keyed by dotted path. */
export function specComments(s: WizardState): Record<string, string> {
  const c: Record<string, string> = {};
  if (s.cloud && s.target.type) c["target.type"] = CLOUDS[s.cloud].services[s.target.type];
  c["infrastructure.size"] = SIZES[s.infra.size].spec;
  if (s.pipe.trigger === "push" && s.repo.branch.trim())
    c["pipeline.trigger"] = `on push to ${s.repo.branch.trim()}`;
  if (s.build.image === "generate") c["build.image"] = "generated, for review";
  return c;
}
