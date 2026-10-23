from __future__ import annotations

import json
import math


def _unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON object key")
        result[key] = value
    return result


def _finite_float(value: str) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise ValueError("non-finite JSON number")
    return number


def _reject_constant(_value: str) -> object:
    raise ValueError("non-finite JSON constant")


def _validate_utf8(value: object) -> None:
    if isinstance(value, str):
        value.encode("utf-8")
    elif isinstance(value, dict):
        for key, item in value.items():
            _validate_utf8(key)
            _validate_utf8(item)
    elif isinstance(value, list):
        for item in value:
            _validate_utf8(item)


def decode_json_object(raw: str) -> dict[str, object]:
    try:
        result = json.loads(
            raw,
            object_pairs_hook=_unique_object,
            parse_constant=_reject_constant,
            parse_float=_finite_float,
        )
        _validate_utf8(result)
    except RecursionError as error:
        raise ValueError("JSON nesting is too deep") from error
    if not isinstance(result, dict):
        raise ValueError("JSON value must be an object")
    return result
