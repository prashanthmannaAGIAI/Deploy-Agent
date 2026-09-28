"""Generate the JSON Schema for the deploy spec.

Usage: uv run python -m runway_spec.schema [output-path]
"""

import json
import sys
from pathlib import Path
from typing import Any

from runway_spec.models import API_VERSION, RunwaySpec

DEFAULT_OUTPUT = Path(__file__).resolve().parents[2] / "schema" / "runway.v1.schema.json"


def json_schema() -> dict[str, Any]:
    schema = RunwaySpec.model_json_schema(by_alias=True, mode="validation")
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": f"https://runway.dev/schema/{API_VERSION.replace('/', '.')}.json",
        **schema,
    }


def render() -> str:
    return json.dumps(json_schema(), indent=2, sort_keys=False) + "\n"


def main(argv: list[str]) -> None:
    output = Path(argv[1]) if len(argv) > 1 else DEFAULT_OUTPUT
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(render(), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main(sys.argv)
