from __future__ import annotations

import json
from functools import lru_cache
from importlib.resources import files
from typing import Any


@lru_cache(maxsize=1)
def load_tools() -> list[dict[str, Any]]:
    resource = files("webdiag_api.data").joinpath("tools.json")
    return json.loads(resource.read_text(encoding="utf-8"))

def public_tools() -> list[dict[str, Any]]:
    return [tool for tool in load_tools() if tool["state"] == "ready"]
