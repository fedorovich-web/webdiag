from __future__ import annotations

import os
import re

import httpx


def cloudflare_client_from_env() -> tuple[str, httpx.Client]:
    account = os.getenv("CLOUDFLARE_ACCOUNT_ID", "").strip()
    token = os.getenv("CLOUDFLARE_API_TOKEN", "").strip()
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account):
        raise RuntimeError(
            "CLOUDFLARE_ACCOUNT_ID must contain 32 hexadecimal characters"
        )
    if not 16 <= len(token) <= 512 or any(
        not 0x21 <= ord(char) <= 0x7E for char in token
    ):
        raise RuntimeError(
            "CLOUDFLARE_API_TOKEN must contain 16 to 512 visible ASCII characters"
        )
    return account, httpx.Client(
        headers={"Authorization": f"Bearer {token}"},
        timeout=httpx.Timeout(connect=5, read=160, write=10, pool=5),
        trust_env=False,
    )
