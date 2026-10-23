from __future__ import annotations

import os


def bounded_int_env(name: str, default: int, *, minimum: int, maximum: int) -> int:
    if not minimum <= default <= maximum:
        raise ValueError("Default must be inside the allowed range")
    raw = os.getenv(name)
    if raw is None:
        return default
    message = f"{name} must be an integer between {minimum} and {maximum}"
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError(message) from error
    if not minimum <= value <= maximum:
        raise RuntimeError(message)
    return value
