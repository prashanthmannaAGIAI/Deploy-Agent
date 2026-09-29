import copy
from typing import Any

import pytest
from pydantic import ValidationError

from runway_spec import RunwaySpec, dump_spec, load_spec
from runway_spec.schema import DEFAULT_OUTPUT, render

VALID: dict[str, Any] = {
    "apiVersion": "runway/v1",
    "project": "payments-api",
    "environment": "staging",
    "cloud": {"provider": "aws", "region": "ap-south-1", "auth": "cross-account-role"},
    "source": {"provider": "github", "repo": "acme/payments-api", "branch": "main"},
    "target": {"type": "container"},
    "build": {
        "stack": "nodejs",
        "version": "20",
        "image": "generate",
        "command": "npm ci && npm run build",
        "start": "npm start",
        "port": 3000,
    },
    "infrastructure": {
        "iac": "terraform",
        "state": "customer-bucket",
        "size": "small",
        "scaling": {"min": 1, "max": 4},
    },
    "pipeline": {
        "runs_in": "github-actions",
        "trigger": "push",
        "tests": {"enabled": True, "command": "npm test"},
    },
    "env": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URL", "secret": True},
    ],
}


def with_change(path: str, value: Any) -> dict[str, Any]:
    data = copy.deepcopy(VALID)
    *parents, leaf = path.split(".")
    node = data
    for key in parents:
        node = node[int(key)] if isinstance(node, list) else node[key]
    if isinstance(node, list):
        node[int(leaf)] = value
    else:
        node[leaf] = value
    return data


def test_valid_spec_round_trips_through_yaml() -> None:
    spec = RunwaySpec.model_validate(VALID)

    again = load_spec(dump_spec(spec))

    assert again == spec
    assert dump_spec(spec).startswith("apiVersion: runway/v1\n")


@pytest.mark.parametrize(
    ("path", "value"),
    [
        ("project", "Payments API"),
        ("project", "-leading-hyphen"),
        ("cloud.region", "us-east-1; rm -rf /"),
        ("cloud.auth", "workload-identity"),  # a GCP method on AWS
        ("source.repo", "acme/payments api"),
        ("source.repo", "../../etc/passwd"),
        ("source.branch", "--upload-pack=evil"),
        ("source.branch", "feature/../main"),
        ("source.branch", "main.lock"),
        ("build.port", 0),
        ("build.port", 70000),
        ("build.start", "npm start\nrm -rf /"),
        ("build.version", "20 && curl evil"),
        ("infrastructure.domain", "api.example.com/path"),
        ("env.0.name", "1BAD"),
        ("env.0.name", "BAD-NAME"),
    ],
)
def test_rejects_unsafe_or_invalid_values(path: str, value: Any) -> None:
    with pytest.raises(ValidationError):
        RunwaySpec.model_validate(with_change(path, value))


def test_scaling_max_must_be_at_least_min() -> None:
    with pytest.raises(ValidationError, match="Maximum instances must be at least the minimum"):
        RunwaySpec.model_validate(with_change("infrastructure.scaling", {"min": 3, "max": 2}))


def test_secret_env_vars_never_carry_a_value() -> None:
    with pytest.raises(ValidationError, match="secret store"):
        RunwaySpec.model_validate(with_change("env.1.value", "postgres://user:pw@db/app"))


def test_duplicate_env_vars_are_rejected() -> None:
    data = with_change("env.1", {"name": "NODE_ENV", "value": "dev"})
    with pytest.raises(ValidationError, match="Duplicate environment variables: NODE_ENV"):
        RunwaySpec.model_validate(data)


def test_non_static_targets_need_start_command_and_port() -> None:
    with pytest.raises(ValidationError, match="Enter a start command"):
        RunwaySpec.model_validate(with_change("build.start", None))
    with pytest.raises(ValidationError, match="Enter the port"):
        RunwaySpec.model_validate(with_change("build.port", None))


def test_static_target_needs_output_dir_and_rejects_traversal() -> None:
    data = with_change("target.type", "static")
    data["build"].update(start=None, port=None)
    with pytest.raises(ValidationError, match="output folder"):
        RunwaySpec.model_validate(data)
    data["build"]["output_dir"] = "../outside"
    with pytest.raises(ValidationError):
        RunwaySpec.model_validate(data)
    data["build"]["output_dir"] = "dist"
    RunwaySpec.model_validate(data)


def test_tests_enabled_requires_a_command() -> None:
    with pytest.raises(ValidationError, match="Enter a test command"):
        RunwaySpec.model_validate(with_change("pipeline.tests", {"enabled": True}))


def test_unknown_keys_are_rejected() -> None:
    with pytest.raises(ValidationError):
        RunwaySpec.model_validate(with_change("surprise", True))


def test_generated_schema_is_current() -> None:
    assert DEFAULT_OUTPUT.read_text(encoding="utf-8") == render(), (
        "packages/spec/schema is stale: run `pnpm spec:generate`"
    )
