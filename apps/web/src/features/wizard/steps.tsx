"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldRow, Select, TextArea } from "@/components/ui/field";
import { CheckIcon, LockIcon, WarnIcon } from "@/components/ui/icons";
import { Note } from "@/components/ui/note";
import { OptionGrid, OptionTile } from "@/components/ui/option-tile";
import { Segmented } from "@/components/ui/segmented";
import { Toggle } from "@/components/ui/toggle";

import { CLOUD_ORDER, CLOUDS, DATABASES, SIZES, STACKS, TARGETS } from "./catalogue";
import { dockerfilePreview, plannedResources, planWarnings } from "./plan";
import type { WizardState } from "./state";
import { useWizard } from "./wizard-context";

export function StepHead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 grid gap-2">
      <h1>{title}</h1>
      <p className="max-w-[62ch] text-muted">{children}</p>
    </div>
  );
}

const Stack = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-5">{children}</div>
);

const lockedHint = (
  <span className="inline-flex items-center gap-1">
    <LockIcon className="size-3.5" /> Entered and encrypted when cloud connections arrive in Phase
    3.
  </span>
);

/* ---------- 0 Cloud ---------- */

export function CloudStep() {
  const { state, dispatch } = useWizard();
  return (
    <>
      <StepHead title="Where should this run?">
        Pick the cloud account you&apos;ll deploy into. You can add more clouds to the same project
        later.
      </StepHead>
      <OptionGrid label="Cloud">
        {CLOUD_ORDER.map((key) => {
          const c = CLOUDS[key];
          const lines =
            key === "local"
              ? ["kind or k3d on your machine, zero cost"]
              : [
                  [
                    c.services.container,
                    c.services.kubernetes,
                    c.services.serverless,
                    c.services.vm,
                  ].join(", "),
                ];
          return (
            <OptionTile
              key={key}
              mark={c.mark}
              title={c.name}
              lines={lines}
              selected={state.cloud === key}
              disabled={!c.mvp}
              onSelect={() => dispatch({ type: "setCloud", cloud: key })}
            />
          );
        })}
      </OptionGrid>
    </>
  );
}

/* ---------- 1 Access ---------- */

export function AccessStep() {
  const { state, dispatch } = useWizard();
  if (!state.cloud) return null;
  const c = CLOUDS[state.cloud];
  const a = state.access;
  const set = (values: Partial<WizardState["access"]>) =>
    dispatch({ type: "patch", section: "access", values });
  const f = (
    label: string,
    key: keyof WizardState["access"],
    placeholder?: string,
    hint?: ReactNode,
  ) => (
    <Field
      label={label}
      mono
      value={a[key] ?? ""}
      placeholder={placeholder}
      hint={hint}
      onValueChange={(v) => set({ [key]: v })}
    />
  );

  let fields: ReactNode = null;
  switch (a.method) {
    case "kubeconfig":
      fields = f(
        "Kubeconfig context",
        "kubeContext",
        "kind-runway",
        "A context in your kubeconfig that points at a local kind or k3d cluster.",
      );
      break;
    case "cross-account-role":
      fields = (
        <>
          <FieldRow>
            {f("AWS account ID", "accountId", "123456789012")}
            <Field
              label="External ID"
              mono
              readOnly
              value=""
              placeholder="Generated when you save the connection"
              hint="Generated for you. Paste it into the role trust policy."
            />
          </FieldRow>
          {f(
            "Role ARN",
            "roleArn",
            "arn:aws:iam::123456789012:role/RunwayDeployer",
            "Launch our CloudFormation template to create this role with least-privilege permissions, then paste its ARN.",
          )}
        </>
      );
      break;
    case "access-keys":
      fields = (
        <>
          <FieldRow>
            {f("Access key ID", "keyId", "AKIA…")}
            <Field label="Secret access key" type="password" mono disabled hint={lockedHint} />
          </FieldRow>
          <Note kind="warn">
            Long-lived keys are encrypted in Runway&apos;s secret store and only injected into the
            deployment sandbox. Rotate them every 90 days, or switch to a cross-account role.
          </Note>
        </>
      );
      break;
    case "workload-identity":
      fields = (
        <>
          {f("Project ID", "project", "acme-prod-4821")}
          {f(
            "Workload identity provider",
            "provider",
            "projects/…/locations/global/workloadIdentityPools/runway/providers/runway",
          )}
          {f(
            "Service account email",
            "saEmail",
            "runway-deployer@acme-prod.iam.gserviceaccount.com",
          )}
        </>
      );
      break;
    case "service-account-key":
      fields = (
        <>
          {f("Project ID", "project", "acme-prod-4821")}
          <TextArea
            label="Service account key (JSON)"
            disabled
            placeholder='{ "type": "service_account", … }'
            hint={lockedHint}
          />
          <Note kind="warn">
            Key files never expire on their own. Workload identity federation avoids storing one.
          </Note>
        </>
      );
      break;
  }

  return (
    <>
      <StepHead title={`Connect ${c.name}`}>
        Each deployment runs in a short-lived sandbox. Credentials are injected at run time and
        never written to disk.
      </StepHead>
      <Stack>
        {c.methods.length > 1 && (
          <Segmented
            label="How should Runway sign in?"
            value={a.method ?? c.methods[0].value}
            onValueChange={(method) => set({ method })}
            options={c.methods.map((m, i) => ({
              value: m.value,
              label: i === 0 ? `${m.label} (recommended)` : m.label,
            }))}
          />
        )}
        {fields}
        <Select
          label="Default region"
          value={a.region}
          onValueChange={(region) => set({ region })}
          options={c.regions.map((r) => ({ value: r, label: r }))}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Test connection</Button>
        </div>
        <Note>
          Real permission checks arrive with cloud connections in Phase 3. Until then you can
          continue once the fields are filled in.
        </Note>
      </Stack>
    </>
  );
}

/* ---------- 2 Repository ---------- */

export function RepositoryStep() {
  const { state, dispatch } = useWizard();
  const r = state.repo;
  const set = (values: Partial<WizardState["repo"]>) =>
    dispatch({ type: "patch", section: "repo", values });
  return (
    <>
      <StepHead title="Connect your code">
        Runway reads the repository to detect your stack, and writes the pipeline file back if you
        want one.
      </StepHead>
      <Stack>
        <Segmented
          label="Repository provider"
          value={r.provider}
          onValueChange={(provider) => set({ provider })}
          options={[
            { value: "github", label: "GitHub" },
            { value: "bitbucket", label: "Bitbucket", disabled: true },
            { value: "gitlab", label: "GitLab", disabled: true },
          ]}
        />
        <Segmented
          label="Access method"
          value={r.auth}
          onValueChange={(auth) => set({ auth })}
          options={[
            { value: "app", label: "Install GitHub App (recommended)" },
            { value: "token", label: "Access token" },
          ]}
        />
        {r.auth === "token" && (
          <Field
            label="GitHub access token"
            type="password"
            mono
            disabled
            hint={
              <>
                Required scopes: repo, workflow, read:org. <br />
                {lockedHint}
              </>
            }
          />
        )}
        <div>
          <Button disabled>{r.auth === "token" ? "Verify token" : "Connect GitHub"}</Button>
        </div>
        <Note>
          Connecting GitHub arrives in Phase 3, and the agent&apos;s repository scan in Phase 4. For
          now, enter the repository and branch to deploy.
        </Note>
        <FieldRow>
          <Field
            label="Repository"
            mono
            value={r.name}
            placeholder="acme/payments-api"
            onValueChange={(name) => set({ name })}
          />
          <Field
            label="Deployment branch"
            mono
            value={r.branch}
            placeholder="main"
            onValueChange={(branch) => set({ branch })}
          />
        </FieldRow>
      </Stack>
    </>
  );
}

/* ---------- 3 Target ---------- */

export function TargetStep() {
  const { state, dispatch } = useWizard();
  if (!state.cloud) return null;
  const c = CLOUDS[state.cloud];
  return (
    <>
      <StepHead title="How should it run?">
        Service names below are for {c.name}. Runway picks sensible defaults for each target that
        you can change later.
      </StepHead>
      <Stack>
        <OptionGrid label="Deployment target">
          {TARGETS.map((t) => (
            <OptionTile
              key={t.value}
              title={t.title}
              lines={[c.services[t.value], t.description]}
              selected={state.target.type === t.value}
              disabled={!t.mvp}
              onSelect={() =>
                dispatch({ type: "patch", section: "target", values: { type: t.value } })
              }
            />
          ))}
        </OptionGrid>
        <Segmented
          label="Environment"
          value={state.target.env}
          onValueChange={(env) => dispatch({ type: "patch", section: "target", values: { env } })}
          options={[
            { value: "dev", label: "Development" },
            { value: "staging", label: "Staging" },
            { value: "production", label: "Production" },
          ]}
        />
      </Stack>
    </>
  );
}

/* ---------- 4 Build ---------- */

export function BuildStep() {
  const { state, dispatch } = useWizard();
  const b = state.build;
  const set = (values: Partial<WizardState["build"]>) =>
    dispatch({ type: "patch", section: "build", values });
  const isStatic = state.target.type === "static";
  return (
    <>
      <StepHead title="Build settings">
        Detected from your repository. Adjust anything that doesn&apos;t match how you run the app
        locally.
      </StepHead>
      <Stack>
        <FieldRow>
          <Select
            label="Stack"
            value={b.stack}
            onValueChange={(stack) =>
              dispatch({ type: "setStack", stack: stack as typeof b.stack })
            }
            options={Object.entries(STACKS).map(([value, s]) => ({
              value,
              label: s.label,
              disabled: !s.mvp,
            }))}
          />
          <Field
            label="Runtime version"
            mono
            value={b.version}
            onValueChange={(version) => set({ version })}
          />
        </FieldRow>
        <Segmented
          label="Container image"
          value={b.image}
          onValueChange={(image) => set({ image })}
          options={[
            { value: "dockerfile", label: "Use my Dockerfile" },
            { value: "generate", label: "Generate one for me" },
            { value: "buildpacks", label: "No container (buildpacks)", disabled: true },
          ]}
        />
        {b.image === "generate" && (
          <div className="grid gap-1.5">
            <span className="text-sm font-medium">Generated Dockerfile</span>
            <pre className="m-0 overflow-x-auto rounded-[10px] bg-term px-4 py-3.5 font-mono text-[12.5px] leading-[1.65] whitespace-pre text-term-ink">
              {dockerfilePreview(state)}
            </pre>
            <small className="block text-[13px] text-muted">
              Committed to a branch for review when you deploy. You can edit it afterwards like any
              other file.
            </small>
          </div>
        )}
        <FieldRow>
          <Field
            label="Build command"
            mono
            value={b.command}
            onValueChange={(command) => set({ command })}
          />
          {isStatic ? (
            <Field
              label="Output folder"
              mono
              value={b.outputDir}
              onValueChange={(outputDir) => set({ outputDir })}
            />
          ) : (
            <Field
              label="Start command"
              mono
              value={b.start}
              onValueChange={(start) => set({ start })}
            />
          )}
        </FieldRow>
        {!isStatic && (
          <Field
            label="Port your app listens on"
            mono
            inputMode="numeric"
            value={b.port}
            placeholder="3000"
            hint="Used for the container, load balancer and health checks."
            onValueChange={(port) => set({ port })}
          />
        )}
      </Stack>
    </>
  );
}

/* ---------- 5 Infrastructure ---------- */

export function InfrastructureStep() {
  const { state, dispatch } = useWizard();
  if (!state.cloud) return null;
  const c = CLOUDS[state.cloud];
  const i = state.infra;
  const set = (values: Partial<WizardState["infra"]>) =>
    dispatch({ type: "patch", section: "infra", values });
  return (
    <>
      <StepHead title="Infrastructure">
        Everything is created as code in your account, so you can inspect, version and tear it down
        without Runway.
      </StepHead>
      <Stack>
        <Segmented
          label="Infrastructure as code"
          value={i.iac}
          onValueChange={(iac) => set({ iac })}
          options={[
            { value: "terraform", label: "Terraform" },
            { value: "opentofu", label: "OpenTofu" },
            { value: "none", label: "Skip, create resources directly", disabled: true },
          ]}
        />
        {i.iac !== "none" && (
          <Select
            label="Where to keep state"
            value={i.state}
            onValueChange={(v) => set({ state: v as typeof i.state })}
            options={[
              {
                value: "customer-bucket",
                label:
                  state.cloud === "local"
                    ? "In your local cluster (recommended)"
                    : `A bucket in your ${c.name} account (recommended)`,
              },
              { value: "runway-managed", label: "Runway-managed backend", disabled: true },
            ]}
          />
        )}
        <Segmented
          label="Instance size"
          value={i.size}
          onValueChange={(size) => set({ size })}
          options={Object.entries(SIZES).map(([value, s]) => ({
            value: value as typeof i.size,
            label: `${s.label}, ${s.spec}`,
          }))}
        />
        <FieldRow>
          <Field
            label="Minimum instances"
            type="number"
            min={1}
            value={i.min}
            onValueChange={(min) => set({ min })}
          />
          <Field
            label="Maximum instances"
            type="number"
            min={1}
            value={i.max}
            hint="Scales on CPU above 70%."
            onValueChange={(max) => set({ max })}
          />
        </FieldRow>
        <Select
          label="Managed database"
          value={i.database}
          onValueChange={(v) => set({ database: v as typeof i.database })}
          options={DATABASES.map((d) => ({ value: d.value, label: d.label, disabled: !d.mvp }))}
        />
        <Field
          label="Custom domain (optional)"
          mono
          value={i.domain}
          placeholder="api.example.com"
          onValueChange={(domain) => set({ domain })}
        />
        {i.domain.trim() && (
          <Toggle
            label="Issue a TLS certificate"
            description="Certificate is renewed automatically."
            checked={i.tls}
            onCheckedChange={(tls) => set({ tls })}
          />
        )}
      </Stack>
    </>
  );
}

/* ---------- 6 Pipeline ---------- */

export function PipelineStep() {
  const { state, dispatch } = useWizard();
  const p = state.pipe;
  const set = (values: Partial<WizardState["pipe"]>) =>
    dispatch({ type: "patch", section: "pipe", values });
  const secretStore = state.cloud ? CLOUDS[state.cloud].secretStore : "your cloud secret store";
  return (
    <>
      <StepHead title="Pipeline">
        How future changes get from your branch to {state.target.env}.
      </StepHead>
      <Stack>
        <Segmented
          label="Run the pipeline in"
          value={p.runsIn}
          onValueChange={(runsIn) => set({ runsIn })}
          options={[
            { value: "native", label: "GitHub Actions (commits a pipeline file)" },
            { value: "runway", label: "Runway runners" },
          ]}
        />
        <Segmented
          label="Deploy when"
          value={p.trigger}
          onValueChange={(trigger) => set({ trigger })}
          options={[
            { value: "push", label: `Code is pushed to ${state.repo.branch || "main"}` },
            { value: "tag", label: "A version tag is created" },
            { value: "manual", label: "I click deploy" },
          ]}
        />
        <div>
          <Toggle
            label="Run tests before deploying"
            description="A failing test stops the deployment."
            checked={p.tests}
            onCheckedChange={(tests) => set({ tests })}
          />
          {p.tests && (
            <div className="pb-3 pl-12">
              <Field
                label="Test command"
                mono
                value={p.testCmd}
                onValueChange={(testCmd) => set({ testCmd })}
              />
            </div>
          )}
          <Toggle
            label="Scan for vulnerabilities"
            description="Checks the image and infrastructure code for known issues and risky settings."
            checked={p.scan}
            onCheckedChange={(scan) => set({ scan })}
          />
          <Toggle
            label="Require approval for production"
            description="Someone with the deployer role approves the plan before it is applied."
            checked={p.approval}
            onCheckedChange={(approval) => set({ approval })}
          />
          <Toggle
            label="Roll back automatically on failure"
            description="Restores the last healthy version if health checks fail."
            checked={p.rollback}
            onCheckedChange={(rollback) => set({ rollback })}
          />
        </div>
        <Select
          label="Send deployment updates to"
          value={p.notify}
          onValueChange={(v) => set({ notify: v as typeof p.notify })}
          options={[
            { value: "slack", label: "Slack", disabled: true },
            { value: "teams", label: "Microsoft Teams", disabled: true },
            { value: "email", label: "Email", disabled: true },
            { value: "none", label: "Nowhere" },
          ]}
        />
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Environment variables</span>
          <div className="grid gap-2">
            {p.env.map((e) => (
              <div
                key={e.id}
                className="grid grid-cols-[1fr_1.4fr_auto_auto] items-center gap-2 max-[820px]:grid-cols-2"
              >
                <input
                  className="min-h-10 rounded-lg border border-line-2 bg-surface px-3 py-2 font-mono text-[13.5px]"
                  aria-label="Variable name"
                  placeholder="KEY"
                  spellCheck={false}
                  value={e.name}
                  onChange={(ev) =>
                    dispatch({ type: "updateEnv", id: e.id, values: { name: ev.target.value } })
                  }
                />
                <input
                  className="min-h-10 rounded-lg border border-line-2 bg-surface px-3 py-2 font-mono text-[13.5px] disabled:cursor-not-allowed disabled:bg-surface-2"
                  aria-label={`Value for ${e.name || "variable"}`}
                  type={e.secret ? "password" : "text"}
                  placeholder={e.secret ? "Set when secrets arrive in Phase 3" : "value"}
                  disabled={e.secret}
                  spellCheck={false}
                  value={e.value}
                  onChange={(ev) =>
                    dispatch({ type: "updateEnv", id: e.id, values: { value: ev.target.value } })
                  }
                />
                <label className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted">
                  <input
                    type="checkbox"
                    checked={e.secret}
                    onChange={(ev) =>
                      dispatch({
                        type: "updateEnv",
                        id: e.id,
                        values: { secret: ev.target.checked },
                      })
                    }
                  />
                  Secret
                </label>
                <Button
                  variant="ghost"
                  size="small"
                  aria-label={`Remove ${e.name || "variable"}`}
                  onClick={() => dispatch({ type: "removeEnv", id: e.id })}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div>
            <Button size="small" onClick={() => dispatch({ type: "addEnv" })}>
              Add variable
            </Button>
          </div>
          <small className="block text-[13px] text-muted">
            Secrets are stored in {secretStore}, not in the pipeline file.
          </small>
        </div>
      </Stack>
    </>
  );
}

/* ---------- 7 Review ---------- */

function Summary({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <section className="rounded-xl border border-line bg-surface px-4 py-3.5">
      <h3>{title}</h3>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="m-0 text-right font-medium [overflow-wrap:anywhere]">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReviewStep() {
  const { state, dispatch } = useWizard();
  if (!state.cloud) return null;
  const c = CLOUDS[state.cloud];
  const resources = plannedResources(state);
  const warnings = planWarnings(state);
  const iacName = state.infra.iac === "opentofu" ? "OpenTofu" : "Terraform";
  const ciName = state.pipe.runsIn === "runway" ? "Runway runners" : "GitHub Actions";
  return (
    <>
      <StepHead title="Review the plan">
        Nothing has been created yet. Check the plan, then deploy.
      </StepHead>
      <Stack>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <Summary
            title="Source"
            rows={[
              ["Repository", state.repo.name],
              ["Branch", state.repo.branch],
              ["Stack", `${STACKS[state.build.stack].label} ${state.build.version}`],
            ]}
          />
          <Summary
            title="Destination"
            rows={[
              ["Cloud", c.name],
              ["Region", state.access.region],
              ["Runs on", state.target.type ? c.services[state.target.type] : ""],
              ["Environment", state.target.env],
            ]}
          />
          <Summary
            title="Pipeline"
            rows={[
              ["Runs in", ciName],
              ["Tests", state.pipe.tests ? "Yes" : "No"],
              ["Approval", state.pipe.approval ? "Production" : "None"],
              ["Rollback", state.pipe.rollback ? "Automatic" : "Manual"],
            ]}
          />
        </div>
        <section className="rounded-xl border border-line bg-surface p-4">
          <div className="mb-3">
            <h3>
              {iacName} will create about {resources.length} resources
            </h3>
            <small className="text-[13px] text-muted">
              The exact list comes from the {iacName} plan when you deploy.
            </small>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0">
            {resources.map((r) => (
              <li key={r} className="flex items-start gap-2.5 text-sm">
                <CheckIcon className="size-5 flex-none" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <section className="rounded-xl border border-line bg-surface px-4 py-3.5">
            <h3>Estimated cost</h3>
            {state.cloud === "local" ? (
              <div className="mt-1.5 flex items-baseline gap-2">
                <b className="text-[28px] font-semibold tracking-[-0.01em]">$0</b>
                <span className="text-muted">runs on your machine</span>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-muted">
                Priced with Infracost from the {iacName} plan when you deploy.
              </p>
            )}
          </section>
          <section className="rounded-xl border border-line bg-surface px-4 py-3.5">
            <h3>Policy checks</h3>
            <ul className="m-0 mt-2 grid list-none gap-2 p-0">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2.5 text-sm text-warn">
                  <WarnIcon className="size-5 flex-none" />
                  <span>{w}</span>
                </li>
              ))}
              <li className="text-sm text-muted">
                Checkov runs on the generated {iacName} during planning.
              </li>
            </ul>
          </section>
        </div>
        <Toggle
          label="I've reviewed this plan"
          description={`Required before Runway can make changes to your ${c.name} account.`}
          checked={state.reviewed}
          onCheckedChange={(reviewed) => dispatch({ type: "setReviewed", reviewed })}
        />
      </Stack>
    </>
  );
}

export const STEP_VIEWS = [
  CloudStep,
  AccessStep,
  RepositoryStep,
  TargetStep,
  BuildStep,
  InfrastructureStep,
  PipelineStep,
  ReviewStep,
];
