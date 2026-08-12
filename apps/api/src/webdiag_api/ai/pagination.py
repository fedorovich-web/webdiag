from __future__ import annotations

import base64
import binascii
import json
from dataclasses import dataclass
from uuid import UUID


class AICursorError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class AICursor:
    created_at: int
    item_id: str


def encode_cursor(*, kind: str, created_at: int, item_id: str) -> str:
    payload = json.dumps(
        [1, kind, created_at, item_id],
        ensure_ascii=True,
        separators=(",", ":"),
    ).encode("ascii")
    return base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")


def decode_cursor(value: str | None, *, kind: str) -> AICursor | None:
    if value is None:
        return None
    if not 1 <= len(value) <= 256 or not value.isascii() or "=" in value:
        raise AICursorError("invalid AI cursor")
    try:
        padding = "=" * (-len(value) % 4)
        raw = base64.b64decode(value + padding, altchars=b"-_", validate=True)
        payload = json.loads(raw.decode("ascii"))
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError, binascii.Error) as error:
        raise AICursorError("invalid AI cursor") from error
    if (
        not isinstance(payload, list)
        or len(payload) != 4
        or payload[0] != 1
        or payload[1] != kind
        or isinstance(payload[2], bool)
        or not isinstance(payload[2], int)
        or payload[2] <= 0
        or not isinstance(payload[3], str)
    ):
        raise AICursorError("invalid AI cursor")
    try:
        item_id = str(UUID(payload[3]))
    except ValueError as error:
        raise AICursorError("invalid AI cursor") from error
    if item_id != payload[3] or encode_cursor(
        kind=kind,
        created_at=payload[2],
        item_id=item_id,
    ) != value:
        raise AICursorError("invalid AI cursor")
    return AICursor(created_at=payload[2], item_id=item_id)
