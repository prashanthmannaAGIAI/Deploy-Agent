"""Read and write runway.yaml."""

from typing import Any

import yaml

from runway_spec.models import RunwaySpec


def load_spec(text: str) -> RunwaySpec:
    """Parse and validate a runway.yaml document. Raises pydantic.ValidationError."""
    data: Any = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise ValueError("runway.yaml must be a mapping at the top level")
    return RunwaySpec.model_validate(data)


def dump_spec(spec: RunwaySpec) -> str:
    data = spec.model_dump(by_alias=True, exclude_none=True, mode="json")
    return yaml.safe_dump(data, sort_keys=False, allow_unicode=True)
