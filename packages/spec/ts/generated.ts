/* Generated from packages/spec/schema/runway.v1.schema.json by `pnpm spec:generate`. Do not edit. */

export type Apiversion = "runway/v1";
/**
 * Lowercase DNS label: letters, digits and hyphens, at most 63 characters.
 */
export type Project = string;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Environment".
 */
export type Environment = "dev" | "staging" | "production";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "CloudProviderName".
 */
export type CloudProviderName = "local" | "aws" | "gcp" | "azure" | "digitalocean" | "oci";
export type Region = string;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "AuthMethod".
 */
export type AuthMethod =
  | "kubeconfig"
  | "cross-account-role"
  | "access-keys"
  | "workload-identity"
  | "service-account-key"
  | "federated-credential"
  | "client-secret"
  | "api-token"
  | "api-signing-key";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "SourceProviderName".
 */
export type SourceProviderName = "github" | "bitbucket" | "gitlab";
/**
 * Repository as owner/name.
 */
export type Repo = string;
export type Branch = string;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "TargetType".
 */
export type TargetType = "container" | "kubernetes" | "serverless" | "vm" | "static";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Stack".
 */
export type Stack = "nodejs" | "python" | "java" | "go" | "dotnet" | "php" | "frontend";
export type Version = string;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "ImageSource".
 */
export type ImageSource = "generate" | "dockerfile" | "buildpacks";
/**
 * Build command.
 */
export type Command = string | null;
/**
 * Start command (not for static).
 */
export type Start = string | null;
/**
 * Port the app listens on.
 */
export type Port = number | null;
/**
 * Static build output.
 */
export type OutputDir = string | null;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "IacTool".
 */
export type IacTool = "terraform" | "opentofu" | "none";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "StateBackend".
 */
export type StateBackend = "customer-bucket" | "runway-managed";
/**
 * 'create' for a new cluster, or the name of an existing one.
 */
export type Cluster = "create" | string;
/**
 * Lowercase DNS label: letters, digits and hyphens, at most 63 characters.
 */
export type Namespace = string;
export type Helm = boolean;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Size".
 */
export type Size = "small" | "medium" | "large";
export type Min = number;
export type Max = number;
export type Database = "none" | "postgres" | "mysql" | "redis" | "mongodb";
export type Domain = string | null;
export type Tls = boolean;
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "RunsIn".
 */
export type RunsIn = "github-actions" | "bitbucket-pipelines" | "gitlab-ci" | "runway";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Trigger".
 */
export type Trigger = "push" | "tag" | "manual";
export type Enabled = boolean;
export type Command1 = string | null;
export type SecurityScan = boolean;
export type Approval = "production" | "none";
export type Rollback = "automatic" | "manual";
export type Notify = "slack" | "teams" | "email" | "none";
export type Name = string;
export type Value = string | null;
export type Secret = boolean;
export type Env = EnvVar[];
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Approval".
 */
export type Approval1 = "production" | "none";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Database".
 */
export type Database1 = "none" | "postgres" | "mysql" | "redis" | "mongodb";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Notify".
 */
export type Notify1 = "slack" | "teams" | "email" | "none";
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Rollback".
 */
export type Rollback1 = "automatic" | "manual";

/**
 * A complete, deployable spec.
 */
export interface RunwaySpec {
  apiVersion?: Apiversion;
  project: Project;
  environment: Environment;
  cloud: Cloud;
  source: Source;
  target: Target;
  build: Build;
  infrastructure: Infrastructure;
  pipeline: Pipeline;
  env?: Env;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Cloud".
 */
export interface Cloud {
  provider: CloudProviderName;
  region: Region;
  auth: AuthMethod;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Source".
 */
export interface Source {
  provider: SourceProviderName;
  repo: Repo;
  branch: Branch;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Target".
 */
export interface Target {
  type: TargetType;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Build".
 */
export interface Build {
  stack: Stack;
  version: Version;
  image: ImageSource;
  command?: Command;
  start?: Start;
  port?: Port;
  output_dir?: OutputDir;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Infrastructure".
 */
export interface Infrastructure {
  iac: IacTool;
  /**
   * Required unless iac is none.
   */
  state?: StateBackend | null;
  kubernetes?: Kubernetes | null;
  size: Size;
  scaling: Scaling;
  database?: Database;
  domain?: Domain;
  tls?: Tls;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Kubernetes".
 */
export interface Kubernetes {
  cluster: Cluster;
  namespace?: Namespace;
  helm?: Helm;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Scaling".
 */
export interface Scaling {
  min: Min;
  max: Max;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Pipeline".
 */
export interface Pipeline {
  runs_in: RunsIn;
  trigger: Trigger;
  tests: Tests;
  security_scan?: SecurityScan;
  approval?: Approval;
  rollback?: Rollback;
  notify?: Notify;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "Tests".
 */
export interface Tests {
  enabled: Enabled;
  command?: Command1;
}
/**
 * This interface was referenced by `RunwaySpec`'s JSON-Schema
 * via the `definition` "EnvVar".
 */
export interface EnvVar {
  name: Name;
  value?: Value;
  secret?: Secret;
}
