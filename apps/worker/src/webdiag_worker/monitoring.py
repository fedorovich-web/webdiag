from __future__ import annotations

import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

MAX_RESPONSE_BYTES = 1_000_000


class _RejectRedirects(HTTPRedirectHandler):
    def redirect_request(
        self,
        req: Request,
        fp: Any,
        code: int,
        msg: str,
        headers: Any,
        _newurl: str,
    ) -> None:
        raise HTTPError(req.full_url, code, "Monitoring API redirect rejected", headers, fp)


_NO_REDIRECT_OPENER = build_opener(_RejectRedirects())


def urlopen(request: Request, *, timeout: int) -> Any:
    return _NO_REDIRECT_OPENER.open(request, timeout=timeout)


def run_due_monitors() -> int:
    raw_base = os.getenv("WEBDIAG_MONITORING_API_INTERNAL_URL", "http://api:8000").strip()
    parsed = urlsplit(raw_base)
    if (
        parsed.scheme not in {"http", "https"}
        or not parsed.netloc
        or parsed.username
        or parsed.password
        or parsed.path not in {"", "/"}
        or parsed.query
        or parsed.fragment
    ):
        raise RuntimeError("WEBDIAG_MONITORING_API_INTERNAL_URL must be a clean HTTP origin")
    base = f"{parsed.scheme}://{parsed.netloc}"
    token = os.getenv("WEBDIAG_MONITORING_INTERNAL_TOKEN", "")
    timeout = max(5, min(120, int(os.getenv("WEBDIAG_MONITORING_WORKER_TIMEOUT_SECONDS", "60"))))
    if not token:
        raise RuntimeError("WEBDIAG_MONITORING_INTERNAL_TOKEN is required")
    request = Request(
        f"{base}/v1/internal/monitoring/run-due",
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            payload = response.read(MAX_RESPONSE_BYTES + 1)
            if len(payload) > MAX_RESPONSE_BYTES:
                raise RuntimeError("Monitoring API response is too large")
            parsed = json.loads(payload.decode("utf-8"))
    except (HTTPError, URLError, TimeoutError) as error:
        raise RuntimeError("Monitoring API request failed") from error
    if parsed.get("contract_version") != "webdiag.monitoring.run_due.v1":
        raise RuntimeError("Monitoring API returned an invalid contract")
    processed = parsed.get("processed")
    if not isinstance(processed, int) or not 0 <= processed <= 20:
        raise RuntimeError("Monitoring API returned an invalid processed count")
    return processed
