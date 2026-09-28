"""Deploy spec (`runway.yaml`) models, `apiVersion: runway/v1`.

These models are the single source of truth for the deploy spec. The JSON Schema in
`packages/spec/schema/` and the TypeScript types in `packages/spec/ts/` are generated from them
(`pnpm spec:generate`); never edit those by hand.

Values from the spec end up in shell commands, Terraform variables and file paths, so every
free-text field is constrained here. Build/start/test commands are the exception by nature: they
run inside the user's own build sandbox, but must still be single-line and bounded.
"""

from enum import StrEnum
from typing import Annotated, Final, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

API_VERSION: Final = "runway/v1"


class _Model(BaseModel):
    # python-re: the default Rust engine has no look-around, which the ref/path rules need.
    model_config = ConfigDict(
        extra="forbid", populate_by_name=True, use_enum_values=True, regex_engine="python-re"
    )


# --- Constrained strings -----------------------------------------------------------------------

DnsLabel = Annotated[
    str,
    StringConstraints(pattern=r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"),
    Field(description="Lowercase DNS label: letters, digits and hyphens, at most 63 characters."),
]
Region = Annotated[str, StringConstraints(pattern=r"^[a-z0-9][a-z0-9-]{0,39}$")]
RepoFullName = Annotated[
    str,
    StringConstraints(pattern=r"^[A-Za-z0-9_.-]{1,100}/[A-Za-z0-9_.-]{1,100}$"),
    Field(description="Repository as owner/name."),
]
GitBranch = Annotated[
    str,
    StringConstraints(
        # Subset of git-check-ref-format: no leading '-' or '/', no '..', '//', '@{', no
        # trailing '/', '.' or '.lock', and only safe characters.
        pattern=r"^(?![-/])(?!.*\.\.)(?!.*//)(?!.*@\{)[A-Za-z0-9._/@-]{1,200}(?<![/.])(?<!\.lock)$"
    ),
]
RuntimeVersion = Annotated[str, StringConstraints(pattern=r"^[0-9][0-9A-Za-z.-]{0,19}$")]
Command = Annotated[
    str,
    StringConstraints(pattern=r"^[^\r\n\x00]{1,500}$"),
    Field(description="Single-line shell command run inside the build sandbox."),
]
RelativePath = Annotated[
    str,
    StringConstraints(pattern=r"^(?!/)(?!.*(^|/)\.\.(/|$))[A-Za-z0-9._/-]{1,200}$"),
    Field(description="Path relative to the repository root; no '..' segments."),
]
Hostname = Annotated[
    str,
    StringConstraints(
        pattern=r"^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$",
    ),
]
EnvVarName = Annotated[str, StringConstraints(pattern=r"^[A-Za-z_][A-Za-z0-9_]{0,127}$")]
EnvVarValue = Annotated[str, StringConstraints(pattern=r"^[^\x00]{0,4096}$")]


# --- Enums -------------------------------------------------------------------------------------


class Environment(StrEnum):
    dev = "dev"
    staging = "staging"
    production = "production"


class CloudProviderName(StrEnum):
    local = "local"
    aws = "aws"
    gcp = "gcp"
    azure = "azure"
    digitalocean = "digitalocean"
    oci = "oci"


class AuthMethod(StrEnum):
    kubeconfig = "kubeconfig"
    cross_account_role = "cross-account-role"
    access_keys = "access-keys"
    workload_identity = "workload-identity"
    service_account_key = "service-account-key"
    federated_credential = "federated-credential"
    client_secret = "client-secret"  # noqa: S105 - auth method name, not a secret
    api_token = "api-token"  # noqa: S105 - auth method name, not a secret
    api_signing_key = "api-signing-key"


AUTH_METHODS: dict[CloudProviderName, tuple[AuthMethod, ...]] = {
    CloudProviderName.local: (AuthMethod.kubeconfig,),
    CloudProviderName.aws: (AuthMethod.cross_account_role, AuthMethod.access_keys),
    CloudProviderName.gcp: (AuthMethod.workload_identity, AuthMethod.service_account_key),
    CloudProviderName.azure: (AuthMethod.federated_credential, AuthMethod.client_secret),
    CloudProviderName.digitalocean: (AuthMethod.api_token,),
    CloudProviderName.oci: (AuthMethod.api_signing_key,),
}


class SourceProviderName(StrEnum):
    github = "github"
    bitbucket = "bitbucket"
    gitlab = "gitlab"


class TargetType(StrEnum):
    container = "container"
    kubernetes = "kubernetes"
    serverless = "serverless"
    vm = "vm"
    static = "static"


class Stack(StrEnum):
    nodejs = "nodejs"
    python = "python"
    java = "java"
    go = "go"
    dotnet = "dotnet"
    php = "php"
    frontend = "frontend"


class ImageSource(StrEnum):
    generate = "generate"
    dockerfile = "dockerfile"
    buildpacks = "buildpacks"


class IacTool(StrEnum):
    terraform = "terraform"
    opentofu = "opentofu"
    none = "none"


class StateBackend(StrEnum):
    customer_bucket = "customer-bucket"
    runway_managed = "runway-managed"


class Size(StrEnum):
    small = "small"
    medium = "medium"
    large = "large"


class Database(StrEnum):
    none = "none"
    postgres = "postgres"
    mysql = "mysql"
    redis = "redis"
    mongodb = "mongodb"


class RunsIn(StrEnum):
    github_actions = "github-actions"
    bitbucket_pipelines = "bitbucket-pipelines"
    gitlab_ci = "gitlab-ci"
    runway = "runway"


class Trigger(StrEnum):
    push = "push"
    tag = "tag"
    manual = "manual"


class Approval(StrEnum):
    production = "production"
    none = "none"


class Rollback(StrEnum):
    automatic = "automatic"
    manual = "manual"


class Notify(StrEnum):
    slack = "slack"
    teams = "teams"
    email = "email"
    none = "none"


# --- Sections ----------------------------------------------------------------------------------


class Cloud(_Model):
    provider: CloudProviderName
    region: Region
    auth: AuthMethod

    @model_validator(mode="after")
    def _auth_matches_provider(self) -> Self:
        allowed = AUTH_METHODS[CloudProviderName(self.provider)]
        if AuthMethod(self.auth) not in allowed:
            names = ", ".join(a.value for a in allowed)
            raise ValueError(f"auth '{self.auth}' is not valid for {self.provider}; use {names}")
        return self


class Source(_Model):
    provider: SourceProviderName
    repo: RepoFullName
    branch: GitBranch


class Target(_Model):
    type: TargetType


class Build(_Model):
    stack: Stack
    version: RuntimeVersion
    image: ImageSource
    command: Command | None = Field(default=None, description="Build command.")
    start: Command | None = Field(default=None, description="Start command (not for static).")
    port: int | None = Field(default=None, ge=1, le=65535, description="Port the app listens on.")
    output_dir: RelativePath | None = Field(default=None, description="Static build output.")


class Kubernetes(_Model):
    cluster: Literal["create"] | DnsLabel = Field(
        description="'create' for a new cluster, or the name of an existing one."
    )
    namespace: DnsLabel = "default"
    helm: bool = True


class Scaling(_Model):
    min: int = Field(ge=1, le=100)
    max: int = Field(ge=1, le=100)

    @model_validator(mode="after")
    def _max_at_least_min(self) -> Self:
        if self.max < self.min:
            raise ValueError("Maximum instances must be at least the minimum.")
        return self


class Infrastructure(_Model):
    iac: IacTool
    state: StateBackend | None = Field(default=None, description="Required unless iac is none.")
    kubernetes: Kubernetes | None = None
    size: Size
    scaling: Scaling
    database: Database = Database.none
    domain: Hostname | None = None
    tls: bool = True

    @model_validator(mode="after")
    def _state_when_iac(self) -> Self:
        if self.iac != IacTool.none and self.state is None:
            raise ValueError("state is required when iac is terraform or opentofu")
        return self


class Tests(_Model):
    enabled: bool
    command: Command | None = None

    @model_validator(mode="after")
    def _command_when_enabled(self) -> Self:
        if self.enabled and not self.command:
            raise ValueError("Enter a test command, or turn off tests.")
        return self


class Pipeline(_Model):
    runs_in: RunsIn
    trigger: Trigger
    tests: Tests
    security_scan: bool = True
    approval: Approval = Approval.production
    rollback: Rollback = Rollback.automatic
    notify: Notify = Notify.none


class EnvVar(_Model):
    name: EnvVarName
    value: EnvVarValue | None = None
    secret: bool = False

    @model_validator(mode="after")
    def _secret_has_no_value(self) -> Self:
        if self.secret and self.value is not None:
            raise ValueError(f"{self.name}: secret values live in the secret store, not the spec")
        return self


class RunwaySpec(_Model):
    """A complete, deployable spec."""

    api_version: Literal["runway/v1"] = Field(default=API_VERSION, alias="apiVersion")
    project: DnsLabel
    environment: Environment
    cloud: Cloud
    source: Source
    target: Target
    build: Build
    infrastructure: Infrastructure
    pipeline: Pipeline
    env: list[EnvVar] = Field(default_factory=list)

    @model_validator(mode="after")
    def _cross_section_rules(self) -> Self:
        if self.target.type == TargetType.static:
            if not self.build.output_dir:
                raise ValueError("Enter the output folder of your build.")
        else:
            if not self.build.start:
                raise ValueError("Enter a start command.")
            if self.build.port is None:
                raise ValueError("Enter the port your app listens on, for example 3000.")
        if self.target.type == TargetType.kubernetes and self.infrastructure.kubernetes is None:
            raise ValueError("infrastructure.kubernetes is required for the kubernetes target")
        names = [e.name for e in self.env]
        duplicates = sorted({n for n in names if names.count(n) > 1})
        if duplicates:
            raise ValueError(f"Duplicate environment variables: {', '.join(duplicates)}")
        return self
