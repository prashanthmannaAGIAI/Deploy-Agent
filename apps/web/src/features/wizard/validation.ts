import { ACCESS_FIELDS, type AccessField } from "./catalogue";
import { rules } from "./spec-rules";
import type { WizardState } from "./state";

// Formats for connection identifiers (not part of the spec; checked again server-side in Phase 3).
const ACCESS_FORMATS: Partial<Record<AccessField, [RegExp, string]>> = {
  accountId: [/^\d{12}$/, "Enter the 12-digit AWS account ID."],
  roleArn: [
    /^arn:aws(-[a-z]+)*:iam::\d{12}:role\/[\w+=,.@/-]{1,512}$/,
    "Enter a role ARN like arn:aws:iam::123456789012:role/AiOpsDeployer.",
  ],
  keyId: [/^(AKIA|ASIA)[A-Z0-9]{16}$/, "Enter an access key ID that starts with AKIA."],
  project: [/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/, "Enter a valid Google Cloud project ID."],
  provider: [
    /^projects\/\d+\/locations\/global\/workloadIdentityPools\/[a-z0-9-]{4,32}\/providers\/[a-z0-9-]{4,32}$/,
    "Enter the full provider name, starting with projects/.",
  ],
  saEmail: [
    /^[a-z][a-z0-9-]{4,28}[a-z0-9]@[a-z][a-z0-9-]{4,28}[a-z0-9]\.iam\.gserviceaccount\.com$/,
    "Enter a service account email ending in .iam.gserviceaccount.com.",
  ],
  kubeContext: [/^[A-Za-z0-9._@:/-]{1,253}$/, "Enter the name of a context from your kubeconfig."],
};

export function missingAccessFields(state: WizardState): AccessField[] {
  const method = state.access.method;
  if (!method) return [];
  return ACCESS_FIELDS[method].filter((f) => !state.access[f].trim());
}

/** Returns the prototype's error message for the current step, or "" when it is valid. */
export function validateStep(state: WizardState, step = state.step): string {
  switch (step) {
    case 0:
      return state.cloud ? "" : "Choose a cloud to continue.";
    case 1: {
      const missing = missingAccessFields(state).length;
      if (missing === 1) return "Fill in the missing field before continuing.";
      if (missing > 1) return `Fill in all ${missing} missing fields before continuing.`;
      for (const field of ACCESS_FIELDS[state.access.method ?? "kubeconfig"]) {
        const format = ACCESS_FORMATS[field];
        if (format && !format[0].test(state.access[field].trim())) return format[1];
      }
      return state.access.region ? "" : "Choose a default region.";
    }
    case 2:
      if (!state.repo.name.trim()) return "Choose a repository.";
      if (!rules.repo.test(state.repo.name.trim()))
        return "Enter the repository as owner/name, for example acme/payments-api.";
      return rules.branch.test(state.repo.branch.trim()) ? "" : "Enter a valid branch name.";
    case 3:
      return state.target.type ? "" : "Choose how the app should run.";
    case 4: {
      const b = state.build;
      if (!rules.version.test(b.version.trim())) return "Enter a runtime version, for example 20.";
      if (!rules.command.test(b.command)) return "Enter a build command on a single line.";
      if (state.target.type === "static")
        return b.outputDir.trim() ? "" : "Enter the output folder of your build.";
      if (!b.start.trim()) return "Enter a start command.";
      if (!rules.command.test(b.start)) return "Enter the start command on a single line.";
      const port = Number(b.port);
      return /^\d{2,5}$/.test(b.port) && port <= 65535
        ? ""
        : "Enter the port your app listens on, for example 3000.";
    }
    case 5: {
      const i = state.infra;
      const min = Number(i.min);
      const max = Number(i.max);
      if (!(Number.isInteger(min) && min >= 1)) return "Set at least 1 minimum instance.";
      if (!(Number.isInteger(max) && max >= min))
        return "Maximum instances must be at least the minimum.";
      if (max > 100) return "Set at most 100 maximum instances.";
      if (i.domain.trim() && !rules.domain.test(i.domain.trim()))
        return "Enter a domain like api.example.com, or leave it empty.";
      return "";
    }
    case 6: {
      const p = state.pipe;
      if (p.tests && !p.testCmd.trim()) return "Enter a test command, or turn off tests.";
      if (p.tests && !rules.command.test(p.testCmd))
        return "Enter the test command on a single line.";
      const named = p.env.filter((e) => e.name.trim());
      const bad = named.find((e) => !rules.envName.test(e.name.trim()));
      if (bad)
        return `${bad.name.trim()}: variable names use letters, digits and underscores, and can't start with a digit.`;
      const names = named.map((e) => e.name.trim());
      const dup = names.find((n, i) => names.indexOf(n) !== i);
      return dup ? `${dup} is defined twice. Each variable name must be unique.` : "";
    }
    case 7:
      return state.reviewed ? "" : "Confirm you have reviewed the plan.";
    default:
      return "";
  }
}

/** First step (up to `upTo`) that fails validation, or -1. Used before deploying. */
export function firstInvalidStep(state: WizardState, upTo = 7): number {
  for (let s = 0; s <= upTo; s++) if (validateStep(state, s)) return s;
  return -1;
}
