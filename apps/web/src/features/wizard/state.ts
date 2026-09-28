import type {
  AuthMethod,
  CloudProviderName,
  Database,
  Environment,
  IacTool,
  ImageSource,
  Notify,
  Size,
  SourceProviderName,
  Stack,
  StateBackend,
  TargetType,
  Trigger,
} from "@runway/spec";

import { CLOUDS, STACKS, type AccessField } from "./catalogue";

export type EnvRow = { id: number; name: string; value: string; secret: boolean };

// Holds identifiers only. Secret material (keys, tokens, secret env values) is never kept in
// wizard state: it is collected by the connection flow in Phase 3 and goes to the SecretStore.
export type WizardState = {
  step: number;
  furthest: number;
  cloud: CloudProviderName | null;
  access: { method: AuthMethod | null; region: string } & Record<AccessField, string>;
  repo: { provider: SourceProviderName; auth: "app" | "token"; name: string; branch: string };
  target: { type: TargetType | null; env: Environment };
  build: {
    stack: Stack;
    version: string;
    image: ImageSource;
    command: string;
    start: string;
    port: string;
    outputDir: string;
  };
  infra: {
    iac: IacTool;
    state: StateBackend;
    size: Size;
    min: string;
    max: string;
    database: Database;
    domain: string;
    tls: boolean;
  };
  pipe: {
    runsIn: "native" | "runway";
    trigger: Trigger;
    tests: boolean;
    testCmd: string;
    scan: boolean;
    approval: boolean;
    rollback: boolean;
    notify: Notify;
    env: EnvRow[];
    nextEnvId: number;
  };
  reviewed: boolean;
};

export const initialState: WizardState = {
  step: 0,
  furthest: 0,
  cloud: null,
  access: {
    method: null,
    region: "",
    accountId: "",
    roleArn: "",
    keyId: "",
    project: "",
    provider: "",
    saEmail: "",
    tenant: "",
    client: "",
    sub: "",
    kubeContext: "",
  },
  repo: { provider: "github", auth: "app", name: "", branch: "main" },
  target: { type: null, env: "staging" },
  build: {
    stack: "nodejs",
    version: "20",
    image: "generate",
    command: "npm ci && npm run build",
    start: "npm start",
    port: "3000",
    outputDir: "dist",
  },
  infra: {
    iac: "terraform",
    state: "customer-bucket",
    size: "small",
    min: "1",
    max: "4",
    database: "none",
    domain: "",
    tls: true,
  },
  pipe: {
    runsIn: "native",
    trigger: "push",
    tests: true,
    testCmd: "npm test",
    scan: true,
    approval: true,
    rollback: true,
    notify: "none",
    env: [
      { id: 1, name: "NODE_ENV", value: "production", secret: false },
      { id: 2, name: "DATABASE_URL", value: "", secret: true },
    ],
    nextEnvId: 3,
  },
  reviewed: false,
};

type Section = "access" | "repo" | "target" | "build" | "infra" | "pipe";

export type WizardAction =
  | { type: "goTo"; step: number }
  | { type: "advance" }
  | { type: "back" }
  | { type: "setCloud"; cloud: CloudProviderName }
  | { type: "setStack"; stack: Stack }
  | { type: "patch"; section: Section; values: Record<string, unknown> }
  | { type: "addEnv" }
  | { type: "updateEnv"; id: number; values: Partial<Omit<EnvRow, "id">> }
  | { type: "removeEnv"; id: number }
  | { type: "setReviewed"; reviewed: boolean }
  | { type: "reset" };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "goTo":
      if (action.step < 0 || action.step > state.furthest) return state;
      return { ...state, step: action.step };
    case "advance": {
      const step = Math.min(state.step + 1, 7);
      return { ...state, step, furthest: Math.max(state.furthest, step) };
    }
    case "back":
      return { ...state, step: Math.max(0, state.step - 1) };
    case "setCloud": {
      const info = CLOUDS[action.cloud];
      if (!info.mvp) return state;
      return {
        ...state,
        cloud: action.cloud,
        access: { ...initialState.access, method: info.methods[0].value, region: info.regions[0] },
        infra: { ...state.infra, state: "customer-bucket" },
        reviewed: false,
      };
    }
    case "setStack": {
      const d = STACKS[action.stack];
      return {
        ...state,
        build: {
          ...state.build,
          stack: action.stack,
          version: d.version,
          command: d.command,
          start: d.start,
          port: d.port,
        },
        pipe: { ...state.pipe, testCmd: d.test },
        reviewed: false,
      };
    }
    case "patch":
      return {
        ...state,
        [action.section]: { ...state[action.section], ...action.values },
        reviewed: false,
      };
    case "addEnv":
      return {
        ...state,
        pipe: {
          ...state.pipe,
          env: [
            ...state.pipe.env,
            { id: state.pipe.nextEnvId, name: "", value: "", secret: false },
          ],
          nextEnvId: state.pipe.nextEnvId + 1,
        },
        reviewed: false,
      };
    case "updateEnv":
      return {
        ...state,
        pipe: {
          ...state.pipe,
          env: state.pipe.env.map((e) => {
            if (e.id !== action.id) return e;
            const next = { ...e, ...action.values };
            // A secret's value never stays in browser state.
            return next.secret ? { ...next, value: "" } : next;
          }),
        },
        reviewed: false,
      };
    case "removeEnv":
      return {
        ...state,
        pipe: { ...state.pipe, env: state.pipe.env.filter((e) => e.id !== action.id) },
        reviewed: false,
      };
    case "setReviewed":
      return { ...state, reviewed: action.reviewed };
    case "reset":
      return initialState;
  }
}

/** Project name for the spec: the repository name as a DNS label. */
export function projectName(repo: string): string {
  const name = (repo.split("/").pop() ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/g, "");
  return name;
}
