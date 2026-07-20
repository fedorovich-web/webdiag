from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from webdiag_api.audit.html_metadata import ScriptBlock


@dataclass(frozen=True, slots=True)
class StructuredDataBlock:
    index: int
    valid: bool
    types: tuple[str, ...] = ()
    node_count: int = 0
    error: str | None = None


@dataclass(frozen=True, slots=True)
class StructuredDataReport:
    block_count: int
    valid_count: int
    invalid_count: int
    types: tuple[str, ...]
    blocks: tuple[StructuredDataBlock, ...]

    @property
    def has_invalid_blocks(self) -> bool:
        return self.invalid_count > 0


def analyze_json_ld_scripts(scripts: tuple[ScriptBlock, ...]) -> StructuredDataReport:
    blocks: list[StructuredDataBlock] = []
    collected_types: list[str] = []
    for index, script in enumerate(scripts, start=1):
        try:
            parsed = json.loads(script.content)
        except json.JSONDecodeError as exc:
            blocks.append(
                StructuredDataBlock(
                    index=index,
                    valid=False,
                    error=f"line {exc.lineno}, column {exc.colno}: {exc.msg}",
                )
            )
            continue

        types = tuple(sorted(set(_extract_types(parsed))))
        collected_types.extend(types)
        blocks.append(
            StructuredDataBlock(
                index=index,
                valid=True,
                types=types,
                node_count=_count_json_ld_nodes(parsed),
            )
        )

    valid_count = sum(1 for block in blocks if block.valid)
    invalid_count = len(blocks) - valid_count
    return StructuredDataReport(
        block_count=len(blocks),
        valid_count=valid_count,
        invalid_count=invalid_count,
        types=tuple(sorted(set(collected_types))),
        blocks=tuple(blocks),
    )


def _extract_types(value: Any) -> list[str]:
    types: list[str] = []
    if isinstance(value, dict):
        raw_type = value.get("@type")
        if isinstance(raw_type, str) and raw_type.strip():
            types.append(raw_type.strip())
        elif isinstance(raw_type, list):
            types.extend(
                item.strip()
                for item in raw_type
                if isinstance(item, str) and item.strip()
            )
        for nested in value.values():
            types.extend(_extract_types(nested))
    elif isinstance(value, list):
        for item in value:
            types.extend(_extract_types(item))
    return types


def _count_json_ld_nodes(value: Any) -> int:
    if isinstance(value, dict):
        own_node = 1 if ("@type" in value or "@context" in value or "@id" in value) else 0
        return own_node + sum(_count_json_ld_nodes(item) for item in value.values())
    if isinstance(value, list):
        return sum(_count_json_ld_nodes(item) for item in value)
    return 0
