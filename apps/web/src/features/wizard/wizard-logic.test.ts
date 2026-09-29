import schema from "@runway/spec/schema.json";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

import { plannedResources, planWarnings } from "./plan";
import { specLines, specText, UNSET, yamlScalar } from "./spec-yaml";
import {
  initialState,
  projectName,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from "./state";
import { specComments, toSpec } from "./to-spec";
import { firstInvalidStep, validateStep } from "./validation";

const run = (actions: WizardAction[], from: WizardState = initialState) =>
  actions.reduce(wizardReducer, from);

/** A wizard filled in the way a user would: AWS role, GitHub repo, Node.js service. */
const complete = run([
  { type: "setCloud", cloud: "aws" },
  {
    type: "patch",
    section: "access",
    values: { accountId: "123456789012", roleArn: "arn:aws:iam::123456789012:role/AiOpsDeployer" },
  },
  { type: "patch", section: "repo", values: { name: "acme/Payments_API", branch: "release/1.4" } },
  { type: "patch", section: "target", values: { type: "container", env: "production" } },
  { type: "setReviewed", reviewed: true },
]);

const validateSchema = new Ajv2020({ strict: false }).compile(schema);

describe("toSpec", () => {
  test("a completed wizard produces a spec that passes the generated JSON Schema", () => {
    const spec = toSpec(complete);
    const ok = validateSchema(spec);
    expect(validateSchema.errors ?? []).toEqual([]);
    expect(ok).toBe(true);
    expect(spec).toMatchObject({
      project: "payments-api",
      cloud: { provider: "aws", region: "ap-south-1", auth: "cross-account-role" },
      pipeline: { runs_in: "github-actions", approval: "production" },
    });
  });

  test("secret env vars carry no value in the spec", () => {
    const env = toSpec(complete).env as { name: string; value?: string; secret?: boolean }[];
    expect(env).toContainEqual({ name: "DATABASE_URL", secret: true });
    expect(env.find((e) => e.name === "DATABASE_URL")).not.toHaveProperty("value");
  });

  test("unset required values are null and render as the prototype placeholder", () => {
    const text = specText(toSpec(initialState));
    expect(text).toContain(`  provider: ${UNSET}`);
    expect(text).toContain(`  repo: ${UNSET}`);
    expect(text).toContain(`project: ${UNSET}`);
  });
});

describe("spec YAML", () => {
  test("rendered text parses back to the same spec", () => {
    const spec = toSpec(complete);
    expect(parse(specText(spec, specComments(complete)))).toEqual(spec);
  });

  test("incomplete specs parse too, with nulls for unset values", () => {
    const spec = toSpec(initialState);
    expect(parse(specText(spec))).toEqual(spec);
  });

  test.each([
    ["npm start", "npm start"],
    ["npm ci && npm run build", "npm ci && npm run build"],
    ["20", '"20"'],
    ["3.12", '"3.12"'],
    ["true", '"true"'],
    ["no", '"no"'],
    ["a: b", '"a: b"'],
    ["x # y", '"x # y"'],
    ["", '""'],
    ["-dash", '"-dash"'],
    ["*alias", '"*alias"'],
  ])("scalar %j is written as %s", (input, expected) => {
    expect(yamlScalar(input)).toBe(expected);
    expect(parse(`k: ${yamlScalar(input)}`)).toEqual({ k: input });
  });

  test("hostile env values stay inside one quoted scalar", () => {
    const s = run([{ type: "updateEnv", id: 1, values: { value: "x\nsurprise: true" } }], complete);
    const spec = toSpec(s);
    const parsed = parse(specText(spec));
    expect(parsed.surprise).toBeUndefined();
    expect(parsed).toEqual(spec);
  });

  test("list items are rendered with bullets", () => {
    const lines = specLines(toSpec(complete)).filter((l) => l.bullet === "- ");
    expect(lines.map((l) => l.value)).toEqual(["NODE_ENV", "DATABASE_URL"]);
  });
});

describe("reducer", () => {
  test("choosing a cloud sets its recommended auth method and first region", () => {
    const s = run([{ type: "setCloud", cloud: "gcp" }]);
    expect(s.access).toMatchObject({ method: "workload-identity", region: "asia-south1" });
  });

  test("clouds outside the MVP can't be selected", () => {
    expect(run([{ type: "setCloud", cloud: "azure" }]).cloud).toBeNull();
  });

  test("choosing a stack applies its defaults", () => {
    const s = run([{ type: "setStack", stack: "python" }]);
    expect(s.build).toMatchObject({ version: "3.12", start: "gunicorn app:app", port: "8000" });
    expect(s.pipe.testCmd).toBe("pytest");
  });

  test("marking an env var secret drops its value from state", () => {
    const s = run([
      { type: "updateEnv", id: 1, values: { value: "hunter2" } },
      { type: "updateEnv", id: 1, values: { secret: true } },
    ]);
    expect(s.pipe.env[0]).toMatchObject({ secret: true, value: "" });
  });

  test("any change after review clears the confirmation", () => {
    const s = run([{ type: "patch", section: "infra", values: { max: "8" } }], complete);
    expect(s.reviewed).toBe(false);
  });

  test("jumping is limited to steps already reached", () => {
    const s = run([{ type: "advance" }, { type: "goTo", step: 5 }]);
    expect(s.step).toBe(1);
    expect(run([{ type: "goTo", step: 0 }], s).step).toBe(0);
  });

  test.each([
    ["acme/Payments_API", "payments-api"],
    ["acme/web.dashboard", "web-dashboard"],
    ["acme/--x--", "x"],
    ["", ""],
  ])("project name for %j is %j", (repo, name) => {
    expect(projectName(repo)).toBe(name);
  });
});

describe("validation", () => {
  test("a completed wizard passes every step", () => {
    expect(firstInvalidStep(complete)).toBe(-1);
  });

  test.each<[number, WizardAction[], string]>([
    [0, [], "Choose a cloud to continue."],
    [1, [{ type: "setCloud", cloud: "aws" }], "Fill in all 2 missing fields before continuing."],
    [1, [{ type: "setCloud", cloud: "local" }], "Fill in the missing field before continuing."],
    [2, [], "Choose a repository."],
    [
      2,
      [{ type: "patch", section: "repo", values: { name: "not a repo" } }],
      "Enter the repository as owner/name, for example acme/payments-api.",
    ],
    [
      2,
      [{ type: "patch", section: "repo", values: { name: "a/b", branch: "--upload-pack=x" } }],
      "Enter a valid branch name.",
    ],
    [3, [], "Choose how the app should run."],
    [4, [{ type: "patch", section: "build", values: { start: "" } }], "Enter a start command."],
    [
      4,
      [{ type: "patch", section: "build", values: { port: "abc" } }],
      "Enter the port your app listens on, for example 3000.",
    ],
    [
      5,
      [{ type: "patch", section: "infra", values: { min: "0" } }],
      "Set at least 1 minimum instance.",
    ],
    [
      5,
      [{ type: "patch", section: "infra", values: { min: "3", max: "2" } }],
      "Maximum instances must be at least the minimum.",
    ],
    [
      5,
      [{ type: "patch", section: "infra", values: { domain: "not a domain" } }],
      "Enter a domain like api.example.com, or leave it empty.",
    ],
    [
      6,
      [{ type: "patch", section: "pipe", values: { testCmd: "" } }],
      "Enter a test command, or turn off tests.",
    ],
    [7, [], "Confirm you have reviewed the plan."],
  ])("step %i shows the prototype message", (step, actions, message) => {
    expect(validateStep(run(actions), step)).toBe(message);
  });

  test("env var names must be valid and unique", () => {
    const bad = run([{ type: "updateEnv", id: 1, values: { name: "1BAD" } }], complete);
    expect(validateStep(bad, 6)).toMatch(/^1BAD: variable names/);
    const dup = run([{ type: "updateEnv", id: 2, values: { name: "NODE_ENV" } }], complete);
    expect(validateStep(dup, 6)).toBe(
      "NODE_ENV is defined twice. Each variable name must be unique.",
    );
  });

  test("AWS identifiers are checked for format", () => {
    const s = run([{ type: "patch", section: "access", values: { accountId: "12345" } }], complete);
    expect(validateStep(s, 1)).toBe("Enter the 12-digit AWS account ID.");
  });
});

describe("plan", () => {
  test("AWS dev/staging avoids a NAT gateway; production gets private subnets", () => {
    const staging = run(
      [{ type: "patch", section: "target", values: { env: "staging" } }],
      complete,
    );
    expect(plannedResources(staging).join()).toContain("no NAT gateway");
    expect(plannedResources(complete).join()).toContain("private subnets and NAT gateway");
  });

  test("warnings flag long-lived credentials and unapproved production", () => {
    const s = run(
      [
        { type: "patch", section: "access", values: { method: "access-keys" } },
        { type: "patch", section: "pipe", values: { approval: false } },
      ],
      complete,
    );
    expect(planWarnings(s)).toEqual([
      "Long-lived credentials in use",
      "Production deploys without an approval step",
    ]);
  });
});
