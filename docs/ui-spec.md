# UI spec (condensed from `docs/prototype/runway-prototype.html`)

Read this instead of the prototype. Open the prototype only to check a specific detail. Copy in quotes is exact.

## Design tokens

Fonts: IBM Plex Sans 400/500/600 (`--sans`), IBM Plex Mono 400/500 (`--mono`). Body 15px/1.55. h1 26px, h2 21px, h3 16px, all 600. Mono text 13.5px (12.5px in code blocks, spec panel, logs).

Theme: light by default; dark via `prefers-color-scheme: dark` unless `html[data-theme=light]`; force dark with `html[data-theme=dark]`.

| Token | Light | Dark |
|---|---|---|
| `--bg` | #EDF1F5 | #0F141A |
| `--surface` | #FFFFFF | #171E26 |
| `--surface-2` | #F5F7FA | #1C252F |
| `--ink` | #15202B | #E4E9EF |
| `--muted` | #586475 | #98A3B2 |
| `--line` | #D5DCE4 | #29333F |
| `--line-2` | #C3CCD7 | #374352 |
| `--accent` | #2B57E0 | #7C9BFF |
| `--accent-ink` | #FFFFFF | #0C1430 |
| `--accent-soft` | #E3EAFC | #1D2947 |
| `--ok` / `--ok-soft` | #16825A / #E0F2E9 | #4BC28A / #12302A |
| `--warn` / `--warn-soft` | #9A620C / #FBEFD8 | #E2A94A / #342712 |
| `--err` / `--err-soft` | #BF3434 / #FBE5E5 | #F07474 / #3A1919 |
| `--term` / `--term-ink` / `--term-muted` | #101820 / #D3DCE6 / #7F8C9C | #0A0F14 / #D3DCE6 / #76839A |
| `--fresh` (changed spec line flash) | #FFF3C4 | #3A3417 |

Terminal line colours: command #8FA7FF, warn #E8B559, error #F28B8B, ok #6FD3A0, dim `--term-muted`.

Shapes: buttons 40px high (small 32px), radius 8; inputs 40px, radius 8, border `--line-2`, hover border `--muted`; cards/option tiles radius 12; notes radius 10; pills radius 99. Focus ring 2px `--accent`, offset 2px. Readonly inputs use `--surface-2`.

Components:
- **Button**: default (surface + line-2 border), `primary` (accent), `ghost` (transparent, hover surface-2), `small`. Disabled opacity .5.
- **Segmented control** (`role=radiogroup`, buttons `role=radio`): surface-2 track, selected = surface with 1px line-2 ring.
- **Toggle row**: switch 36×20 + bold label + muted description, top border between rows.
- **Option tile**: grid of min 210px cards; mark (36px square with 2-letter code), bold title, muted lines; selected = accent border + 1px accent ring + accent-soft bg; optional green "Suggested" badge top-right.
- **Note**: icon + text; variants neutral / `ok` / `warn` / `err`; **agent note** = accent-soft bg, spark icon, label "Runway agent" in accent 13px bold.
- **Code block**: `--term` background, mono 12.5px.
- **Pill**: dot + label; `run` (accent, pulsing dot), `ok`, `bad`.
- Icons (20×20 stroke): check, warn (triangle), info, spark, lock. Logo: 26px accent rounded square with three horizontal bars.
- Respect `prefers-reduced-motion` for all animations.

## Layout

- **Top bar** (56px, sticky, surface, bottom border): logo + "Runway", nav tabs "New deployment" / "Deployments" / "Monitoring" (current = ink on surface-2), spacer, small button "Ask agent" (spark icon), avatar circle with the user's initial. (The prototype's "Prototype" tag is not carried over.)
- **Wizard**: 3 columns `230px | main (max 820px) | 400px spec panel`. Left rail lists steps with numbered circles (done = green ✓, current = accent-soft row, future steps disabled until reached). Footer: "Back" (from step 2), inline error text (`role=alert`), "View spec" toggle (narrow screens), primary "Continue", and on Review "Deploy to {env}".
- **Spec panel**: header "runway.yaml" + "Written as you answer. This is exactly what gets deployed."; mono YAML with keys muted, values ink, unset values shown as `~ # not set yet` in italic muted, comments italic muted; lines that changed flash `--fresh` for 1.6s.
- Breakpoints: ≤1180px spec panel becomes a bottom sheet (70vh) opened by "View spec" / closed by "Close"; ≤820px single column, rail becomes horizontal scroll, login art stacks above form; ≤520px hide brand name and button labels.

## Screens

### Login
Split: left dark art panel (`--term`), right form (max 380px).
- Art: brand; h1 "Ship any repo to any cloud, and see exactly what happened."; p "Answer a few questions, review the plan, deploy in one click. When something breaks, the agent reads the logs and tells you why."; sample runway.yaml snippet.
- Form: h2 "Sign in", "Use your work account to continue."; buttons "GitHub", "Google", "Single sign-on (SAML / OIDC)"; divider "or with email"; fields "Work email" (placeholder you@company.com), "Password"; primary "Sign in"; footnote "Two-factor authentication is required for accounts that can deploy to production."
- Validation: "Enter a valid work email." / "Enter your password."

### Wizard steps (rail labels: Cloud, Access, Repository, Target, Build, Infrastructure, Pipeline, Review)

**0 Cloud** — "Where should this run?" / "Pick the cloud account you'll deploy into. You can add more clouds to the same project later." Tiles: AWS (AW), Google Cloud (GC), Azure (AZ), DigitalOcean (DO), Oracle Cloud (OC); each lists its container, k8s, serverless, VM service names. MVP adds `local` and disables Azure/DO/OCI as "Coming soon". Error: "Choose a cloud to continue."

Cloud catalogue (services: container / k8s / serverless / vm / static; auth methods, first = recommended; regions):
- AWS: ECS Fargate / EKS / Lambda / EC2 / S3 + CloudFront; "Cross-account role", "Access keys"; ap-south-1, ap-southeast-2, us-east-1, eu-west-1, me-central-1. Resources: ECR repository, Application Load Balancer, CloudWatch log group, VPC with 2 private subnets, IAM task role; monitoring CloudWatch.
- GCP: Cloud Run / GKE / Cloud Functions / Compute Engine / Cloud Storage + Cloud CDN; "Workload identity", "Service account key"; asia-south1, australia-southeast1, us-central1, europe-west1, me-central1. Resources: Artifact Registry repository, HTTPS load balancer, Cloud Logging bucket, VPC network, Service account; monitoring Cloud Monitoring.
- Azure: Container Apps / AKS / Azure Functions / Virtual Machines / Static Web Apps; "Federated credential", "Client secret".
- DigitalOcean: App Platform / DOKS / Functions / Droplets; "API token".
- Oracle: Container Instances / OKE / OCI Functions / Compute; "API signing key".

**1 Access** — "Connect {cloud}" / "Each deployment runs in a short-lived sandbox. Credentials are injected at run time and never written to disk." Segmented "How should Runway sign in?" (first option suffixed " (recommended)"). Fields by method:
- role: "AWS account ID" (123456789012), "External ID" (readonly, generated `rw-xxxxxxxx`, hint "Generated for you. Paste it into the role trust policy."), "Role ARN" (arn:aws:iam::123456789012:role/RunwayDeployer, hint "Launch our CloudFormation template to create this role with least-privilege permissions, then paste its ARN.").
- keys: "Access key ID" (AKIA…), "Secret access key" (password) + warn note "Long-lived keys are encrypted in Vault and only injected into the deployment sandbox. Rotate them every 90 days, or switch to a cross-account role." (reword "Vault" to match the real SecretStore).
- wif: "Project ID" (acme-prod-4821), "Workload identity provider", "Service account email".
- sa: "Project ID", "Service account key (JSON)" textarea + warn "Key files never expire on their own. Workload identity federation avoids storing one."
- fed/secret: "Tenant ID", "Client ID", "Subscription ID", (+ "Client secret").
- token: "API token" / "API signing key fingerprint", hint "Create a token scoped to the resources this project needs."
Then select "Default region", button "Test connection" ("Testing…" while running). Success note: "**Connected.** Permission check passed for {n} of {n} required actions in {region}." Missing fields: "Fill in the missing field before testing." / "Fill in all {n} missing fields before testing." Editing any access field resets connected. Continue error: "Test the connection before continuing."

**2 Repository** — "Connect your code" / "Runway reads the repository to detect your stack, and writes the pipeline file back if you want one." Segmented "Repository provider" (GitHub, Bitbucket, GitLab — MVP: GitHub only). Segmented "Access method": "Install GitHub App (recommended)" / "Access token" (Bitbucket: "Bitbucket OAuth (recommended)"). Token field "{provider} access token", hint "Required scopes: repo, workflow, read:org" (Bitbucket "repository:read, pipeline:write, webhook"; GitLab "read_repository, api"). Button "Connect GitHub" / "Verify token"; error "Paste an access token first." Connected note "Connected to GitHub. {n} repositories available." Then selects "Repository" (first option "Choose a repository") and "Deployment branch". After choosing a repo, agent note summarising the scan (stack, framework, scripts, tests, Dockerfile present or not, detected/assumed port). Errors: "Connect your repository provider first." / "Choose a repository." Changing provider or auth resets connection and repo.

**3 Target** — "How should it run?" / "Service names below are for {cloud}. Runway picks sensible defaults for each target that you can change later." Optional agent note recommending a target. Tiles: "Containerised web service" (A long-running API or web app behind a load balancer.), "Kubernetes" (Deploy to a managed cluster with Helm charts.), "Serverless functions" (Event-driven jobs or low-traffic endpoints.), "Virtual machines" (Full control over the host and OS.), "Static site" (A frontend build served from a CDN.); each shows the cloud's service name; "Suggested" badge on the agent's pick. MVP: only containerised enabled. Segmented "Environment": Development / Staging / Production (default staging). Error: "Choose how the app should run."

**4 Build** — "Build settings" / "Detected from your repository. Adjust anything that doesn't match how you run the app locally." Select "Stack" + field "Runtime version"; segmented "Container image": "Use my Dockerfile" / "Generate one for me" / "No container (buildpacks)". When generating: "Generated Dockerfile" code block + "Committed to a branch for review when you deploy. You can edit it afterwards like any other file." Fields "Build command", "Start command" (static: "Output folder"), "Port your app listens on" (hint "Used for the container, load balancer and health checks."). Stack defaults: Node.js 20 `npm ci && npm run build` / `npm start` / 3000 / test `npm test`; Python 3.12 `pip install -r requirements.txt` / `gunicorn app:app` / 8000 / test `pytest`. Changing stack resets version, commands, port, test command. Errors: "Enter the output folder of your build." / "Enter a start command." / "Enter the port your app listens on, for example 3000." (port must be 2–5 digits).

**5 Infrastructure** — "Infrastructure" / "Everything is created as code in your account, so you can inspect, version and tear it down without Runway." Segmented "Infrastructure as code": Terraform / OpenTofu / "Skip, create resources directly". Select "Where to keep state": "A bucket in your {cloud} account (recommended)" / "Runway-managed backend". k8s only: cluster new/existing, "Cluster name", "Namespace", toggle "Package with Helm". Segmented "Instance size": "Small, 0.5 vCPU, 1 GB" / "Medium, 1 vCPU, 2 GB" / "Large, 2 vCPU, 4 GB". "Minimum instances", "Maximum instances" (hint "Scales on CPU above 70%."). Select "Managed database": None, PostgreSQL, MySQL, Redis, MongoDB compatible. "Custom domain (optional)" (api.example.com); when set, toggle "Issue a TLS certificate" ("Certificate is renewed automatically."). Errors: "Set at least 1 minimum instance." / "Maximum instances must be at least the minimum." / "Enter the name of your existing cluster."

**6 Pipeline** — "Pipeline" / "How future changes get from your branch to {env}." Segmented "Run the pipeline in": "GitHub Actions (commits a pipeline file)" / "Runway runners". Segmented "Deploy when": "Code is pushed to {branch}" / "A version tag is created" / "I click deploy". Toggles: "Run tests before deploying" (A failing test stops the deployment.) + indented "Test command"; "Scan for vulnerabilities" (Checks the image and infrastructure code for known issues and risky settings.); "Require approval for production" (Someone with the deployer role approves the plan before it is applied.); "Roll back automatically on failure" (Restores the last healthy version if health checks fail.). Select "Send deployment updates to": Slack, Microsoft Teams, Email, Nowhere. "Environment variables" rows: KEY, value (password input when secret), "Secret" checkbox, "Remove"; button "Add variable"; note "Secrets are stored in {AWS Secrets Manager | Secret Manager | Key Vault}, not in the pipeline file." Defaults: NODE_ENV=production, DATABASE_URL (secret). Error: "Enter a test command, or turn off tests."

**7 Review** — "Review the plan" / "Nothing has been created yet. Check the plan, then deploy." Summary cards: Source (Repository, Branch, Stack), Destination (Cloud, Region, Runs on, Environment), Pipeline (Runs in, Tests, Approval, Rollback). Panel "{Terraform|OpenTofu|Runway} will create {n} resources" with checklist (state bucket and lock, network, registry, service "(min to max instances)", load balancer, database, IAM, logs, DNS/TLS). "Estimated cost" big number "$N" + "per month at minimum scale" + "Before tax and data transfer." (real: Infracost). "Policy checks" list (No public storage buckets; No SSH open to the internet; Encryption at rest enabled; warn "Long-lived credentials in use" when keys are used) — real: Checkov. Toggle "I've reviewed this plan" / "Required before Runway can make changes to your {cloud} account." Error: "Confirm you have reviewed the plan." Primary button "Deploy to {env}".

### Deploy
Header: h1 repo name, "{branch} to {service} in {region}, {env}", status pill (Deploying / Failed / Deployed). Grid `300px | log`: step list (pending, running spinner, done green, failed red; duration in mono, "reused" for skipped-on-redeploy steps) and terminal panel "Deployment log" with the cloud's log source name on the right. Steps: Clone repository, Run tests, Build image, Push image, Plan with {IaC}, Create infrastructure, Deploy to {service}, Health check.
- Failure card (red border, `role=alert`): h2 e.g. "Health check failed"; agent diagnosis block ("Runway agent diagnosis": cause, "Evidence:" with file:line / log line, "**Fix:** …"); rollback sentence; actions "Apply fix and redeploy" (primary), "Ask the agent", "Edit settings". Redeploy logs "--- Redeploying with the fix applied. Reusing image and infrastructure. ---" and restarts from the right step.
- Success card (green border): h2 "Deployed", "Live at {url}. Total time {t}." (+ "Port fix saved to your deploy spec and committed as a pull request." after a fix); actions "Open monitoring", "View all deployments".

### Deployments (history)
Empty: "No deployments yet" / "Every deployment you start shows up here with its logs and outcome." + "Start a deployment". Otherwise header "Deployments" / "All projects and environments." + "New deployment"; table ID, Repository, Branch, Target, Environment, Status (pill Succeeded/Failed), Duration, Started.

### Monitoring
Empty: "No live services yet" / "Monitoring starts after your first successful deployment. Metrics and logs are pulled from your cloud provider." Otherwise header project name, "{service} in {region}, {env}. Data from {CloudWatch|Cloud Monitoring}.", pill Healthy, time range segmented 1h / 6h / 24h. Stat tiles: Requests per minute, p95 latency ("within 300 ms target"), Error rate, Instances ("{n} of {max}"). Charts (ECharts): CPU %, Memory %, p95 latency ms, Requests per minute. Two-column: Logs panel (level segmented All/Info/Warn/Error, "Search logs" input, table Time/Level/Message, empty "No log lines match. Clear the search or pick another level.", button "Explain these errors") and Events timeline (autoscale, deployments succeeded/failed, alert rules).

### Ask agent drawer
Right drawer (≤420px) with scrim, `role=dialog`, Escape closes. Header "Runway agent". Initial message: "I can explain any step, suggest settings for your repo, or dig into a failed deployment. What do you need?" Suggestion chips: "Why did the health check fail?", "What will this cost?", "Explain the generated Dockerfile", "Is it safe to use access keys?". Input placeholder "Ask about this deployment", button "Send". User bubbles accent, agent bubbles surface-2.

## runway.yaml shape (as shown in the panel)

```yaml
project: <repo name>
environment: staging
cloud: { provider, region, auth, verified }
source: { provider, repo, branch }
target: { type, service }
build: { stack: "<name> <version>", image: dockerfile (generated)|dockerfile|buildpacks, build, start, port }  # static: output
infrastructure: { iac, state: customer-bucket|runway-managed, kubernetes?: {cluster, namespace, helm}, size, scaling: {min, max}, database, domain }
pipeline: { runs_in, trigger: "push <branch>"|tag|manual, tests: <cmd>|off, security_scan, approval: production|none, rollback: automatic|manual, notify }
env: { KEY: value | <secret> }
```
The real schema lives in `packages/spec` (`apiVersion: runway/v1`); this is only the display shape.
