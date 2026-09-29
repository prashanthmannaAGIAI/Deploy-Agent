// UI catalogue: names, copy and MVP availability for each option. Spec values (the union
// types) come from @runway/spec; this file only adds presentation.
import type {
  AuthMethod,
  CloudProviderName,
  Database,
  Size,
  Stack,
  TargetType,
} from "@runway/spec";

export type AccessField =
  | "accountId"
  | "roleArn"
  | "keyId"
  | "project"
  | "provider"
  | "saEmail"
  | "tenant"
  | "client"
  | "sub"
  | "kubeContext";

export type CloudInfo = {
  name: string;
  mark: string;
  mvp: boolean;
  regions: string[];
  services: Record<TargetType, string>;
  methods: { value: AuthMethod; label: string }[];
  resources: {
    registry: string;
    lb: string;
    logs: string;
    net: string;
    iam: string;
    monitoring: string;
  };
  secretStore: string;
};

export const CLOUDS: Record<CloudProviderName, CloudInfo> = {
  local: {
    name: "Local Kubernetes",
    mark: "LK",
    mvp: true,
    regions: ["local"],
    services: {
      container: "Kubernetes Deployment",
      kubernetes: "Local cluster",
      serverless: "Knative",
      vm: "Not available",
      static: "Nginx on Kubernetes",
    },
    methods: [{ value: "kubeconfig", label: "Kubeconfig context" }],
    resources: {
      registry: "Image in the local registry",
      lb: "Ingress route",
      logs: "Loki log stream",
      net: "Namespace",
      iam: "Kubernetes service account",
      monitoring: "Prometheus",
    },
    secretStore: "Kubernetes secrets",
  },
  aws: {
    name: "AWS",
    mark: "AW",
    mvp: true,
    regions: ["ap-south-1", "ap-southeast-2", "us-east-1", "eu-west-1", "me-central-1"],
    services: {
      container: "ECS Fargate",
      kubernetes: "EKS",
      serverless: "Lambda",
      vm: "EC2",
      static: "S3 + CloudFront",
    },
    methods: [
      { value: "cross-account-role", label: "Cross-account role" },
      { value: "access-keys", label: "Access keys" },
    ],
    resources: {
      registry: "ECR repository",
      lb: "Application Load Balancer",
      logs: "CloudWatch log group",
      net: "VPC with public subnets (no NAT gateway)",
      iam: "IAM task role",
      monitoring: "CloudWatch",
    },
    secretStore: "AWS Secrets Manager",
  },
  gcp: {
    name: "Google Cloud",
    mark: "GC",
    mvp: true,
    regions: ["asia-south1", "australia-southeast1", "us-central1", "europe-west1", "me-central1"],
    services: {
      container: "Cloud Run",
      kubernetes: "GKE",
      serverless: "Cloud Functions",
      vm: "Compute Engine",
      static: "Cloud Storage + Cloud CDN",
    },
    methods: [
      { value: "workload-identity", label: "Workload identity" },
      { value: "service-account-key", label: "Service account key" },
    ],
    resources: {
      registry: "Artifact Registry repository",
      lb: "HTTPS endpoint (run.app)",
      logs: "Cloud Logging",
      net: "Default serverless networking",
      iam: "Service account",
      monitoring: "Cloud Monitoring",
    },
    secretStore: "Secret Manager",
  },
  azure: {
    name: "Azure",
    mark: "AZ",
    mvp: false,
    regions: ["centralindia", "australiaeast", "eastus", "westeurope", "uaenorth"],
    services: {
      container: "Container Apps",
      kubernetes: "AKS",
      serverless: "Azure Functions",
      vm: "Virtual Machines",
      static: "Static Web Apps",
    },
    methods: [
      { value: "federated-credential", label: "Federated credential" },
      { value: "client-secret", label: "Client secret" },
    ],
    resources: {
      registry: "Container Registry",
      lb: "Application Gateway",
      logs: "Log Analytics workspace",
      net: "Virtual network",
      iam: "Managed identity",
      monitoring: "Azure Monitor",
    },
    secretStore: "Key Vault",
  },
  digitalocean: {
    name: "DigitalOcean",
    mark: "DO",
    mvp: false,
    regions: ["blr1", "syd1", "nyc3", "ams3", "fra1"],
    services: {
      container: "App Platform",
      kubernetes: "DOKS",
      serverless: "Functions",
      vm: "Droplets",
      static: "App Platform static site",
    },
    methods: [{ value: "api-token", label: "API token" }],
    resources: {
      registry: "Container Registry",
      lb: "Load Balancer",
      logs: "Log forwarding",
      net: "VPC",
      iam: "Scoped API token",
      monitoring: "DigitalOcean Insights",
    },
    secretStore: "your cloud secret store",
  },
  oci: {
    name: "Oracle Cloud",
    mark: "OC",
    mvp: false,
    regions: ["ap-mumbai-1", "ap-sydney-1", "us-ashburn-1", "eu-frankfurt-1", "me-dubai-1"],
    services: {
      container: "Container Instances",
      kubernetes: "OKE",
      serverless: "OCI Functions",
      vm: "Compute",
      static: "Object Storage + CDN",
    },
    methods: [{ value: "api-signing-key", label: "API signing key" }],
    resources: {
      registry: "Container Registry",
      lb: "Load Balancer",
      logs: "Logging log group",
      net: "VCN",
      iam: "Dynamic group",
      monitoring: "OCI Monitoring",
    },
    secretStore: "your cloud secret store",
  },
};

export const CLOUD_ORDER: CloudProviderName[] = [
  "local",
  "aws",
  "gcp",
  "azure",
  "digitalocean",
  "oci",
];

/** Non-secret identifier fields per auth method. Secret material is collected in Phase 3. */
export const ACCESS_FIELDS: Record<AuthMethod, AccessField[]> = {
  kubeconfig: ["kubeContext"],
  "cross-account-role": ["accountId", "roleArn"],
  "access-keys": ["keyId"],
  "workload-identity": ["project", "provider", "saEmail"],
  "service-account-key": ["project"],
  "federated-credential": ["tenant", "client", "sub"],
  "client-secret": ["tenant", "client", "sub"],
  "api-token": [],
  "api-signing-key": [],
};

export const LONG_LIVED_METHODS: AuthMethod[] = [
  "access-keys",
  "service-account-key",
  "client-secret",
];

export const TARGETS: { value: TargetType; title: string; description: string; mvp: boolean }[] = [
  {
    value: "container",
    title: "Containerised web service",
    description: "A long-running API or web app behind a load balancer.",
    mvp: true,
  },
  {
    value: "kubernetes",
    title: "Kubernetes",
    description: "Deploy to a managed cluster with Helm charts.",
    mvp: false,
  },
  {
    value: "serverless",
    title: "Serverless functions",
    description: "Event-driven jobs or low-traffic endpoints.",
    mvp: false,
  },
  {
    value: "vm",
    title: "Virtual machines",
    description: "Full control over the host and OS.",
    mvp: false,
  },
  {
    value: "static",
    title: "Static site",
    description: "A frontend build served from a CDN.",
    mvp: false,
  },
];

export type StackInfo = {
  label: string;
  mvp: boolean;
  version: string;
  command: string;
  start: string;
  port: string;
  test: string;
};

export const STACKS: Record<Stack, StackInfo> = {
  nodejs: {
    label: "Node.js",
    mvp: true,
    version: "20",
    command: "npm ci && npm run build",
    start: "npm start",
    port: "3000",
    test: "npm test",
  },
  python: {
    label: "Python",
    mvp: true,
    version: "3.12",
    command: "pip install -r requirements.txt",
    start: "gunicorn app:app",
    port: "8000",
    test: "pytest",
  },
  java: {
    label: "Java (Spring Boot)",
    mvp: false,
    version: "21",
    command: "./mvnw package -DskipTests",
    start: "java -jar target/app.jar",
    port: "8080",
    test: "./mvnw test",
  },
  go: {
    label: "Go",
    mvp: false,
    version: "1.22",
    command: "go build -o app .",
    start: "./app",
    port: "8080",
    test: "go test ./...",
  },
  dotnet: {
    label: ".NET",
    mvp: false,
    version: "8.0",
    command: "dotnet publish -c Release -o out",
    start: "dotnet out/App.dll",
    port: "8080",
    test: "dotnet test",
  },
  php: {
    label: "PHP (Laravel)",
    mvp: false,
    version: "8.3",
    command: "composer install --no-dev",
    start: "php artisan serve --host=0.0.0.0",
    port: "8000",
    test: "php artisan test",
  },
  frontend: {
    label: "React / Vue / Angular",
    mvp: false,
    version: "20",
    command: "npm ci && npm run build",
    start: "",
    port: "",
    test: "npm test",
  },
};

export const SIZES: Record<Size, { label: string; spec: string }> = {
  small: { label: "Small", spec: "0.5 vCPU, 1 GB" },
  medium: { label: "Medium", spec: "1 vCPU, 2 GB" },
  large: { label: "Large", spec: "2 vCPU, 4 GB" },
};

export const DATABASES: { value: Database; label: string; mvp: boolean }[] = [
  { value: "none", label: "None", mvp: true },
  { value: "postgres", label: "PostgreSQL", mvp: false },
  { value: "mysql", label: "MySQL", mvp: false },
  { value: "redis", label: "Redis", mvp: false },
  { value: "mongodb", label: "MongoDB compatible", mvp: false },
];

export const STEPS = [
  "Cloud",
  "Access",
  "Repository",
  "Target",
  "Build",
  "Infrastructure",
  "Pipeline",
  "Review",
] as const;
