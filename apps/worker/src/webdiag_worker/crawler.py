from __future__ import annotations

import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener

MAX_RESPONSE_BYTES = 1_000_000


class _RejectRedirects(HTTPRedirectHandler):
    def redirect_request(
        self, req: Request, fp: Any, code: int, msg: str, headers: Any, newurl: str
    ) -> None:
        raise HTTPError(req.full_url, code, "Crawler API redirect rejected", headers, fp)


_NO_PROXY_HANDLER = ProxyHandler({})
_NO_REDIRECT_OPENER = build_opener(_NO_PROXY_HANDLER, _RejectRedirects())


def urlopen(request: Request, *, timeout: int) -> Any:
    return _NO_REDIRECT_OPENER.open(request, timeout=timeout)


def run_one_crawl() -> bool:
    raw_base = os.getenv("WEBDIAG_CRAWLER_API_INTERNAL_URL", "http://api:8000").strip()
    parsed = urlsplit(raw_base)
    if (
        parsed.scheme not in {"http", "https"} or not parsed.netloc
        or parsed.username or parsed.password or parsed.path not in {"", "/"}
        or parsed.query or parsed.fragment
    ):
        raise RuntimeError("WEBDIAG_CRAWLER_API_INTERNAL_URL must be a clean HTTP origin")
    token = os.getenv("WEBDIAG_CRAWLER_INTERNAL_TOKEN", "")
    if len(token) < 32:
        raise RuntimeError("WEBDIAG_CRAWLER_INTERNAL_TOKEN must contain at least 32 characters")
    if any(not 0x21 <= ord(character) <= 0x7E for character in token):
        raise RuntimeError("WEBDIAG_CRAWLER_INTERNAL_TOKEN must contain visible ASCII")
    timeout = max(
        60,
        min(330, int(os.getenv("WEBDIAG_CRAWLER_WORKER_TIMEOUT_SECONDS", "270"))),
    )
    request = Request(
        f"{parsed.scheme}://{parsed.netloc}/v1/internal/crawl/run-one",
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except (HTTPError, URLError, TimeoutError) as error:
        raise RuntimeError("Crawler API request failed") from error
    if len(raw) > MAX_RESPONSE_BYTES:
        raise RuntimeError("Crawler API response is too large")
    payload = json.loads(raw.decode("utf-8"))
    if payload.get("contract_version") != "webdiag.crawl.worker.v1":
        raise RuntimeError("Crawler API returned an invalid contract")
    processed = payload.get("processed")
    if not isinstance(processed, bool):
        raise RuntimeError("Crawler API returned an invalid processed flag")
    return processed
