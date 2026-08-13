from __future__ import annotations

import json
import os
import threading
from dataclasses import dataclass
from types import TracebackType
from typing import Any, Protocol
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
        raise HTTPError(req.full_url, code, "AI API redirect rejected", headers, fp)


_NO_REDIRECT_OPENER = build_opener(_RejectRedirects())


def urlopen(request: Request, *, timeout: int) -> Any:
    return _NO_REDIRECT_OPENER.open(request, timeout=timeout)


@dataclass(frozen=True, slots=True)
class ProviderRequest:
    run_id: str
    tool_id: str
    contract_version: str
    model_policy: str
    input: dict[str, object]
    safety_identifier: str | None = None


@dataclass(frozen=True, slots=True)
class ProviderResult:
    output: dict[str, object]
    provider_request_id: str | None = None
    input_units: int = 0
    output_units: int = 0

    def __post_init__(self) -> None:
        for value in (self.input_units, self.output_units):
            if (
                isinstance(value, bool)
                or not isinstance(value, int)
                or not 0 <= value <= 1_000_000_000
            ):
                raise ValueError("provider usage must use bounded non-negative integers")
        if self.provider_request_id is not None and not 1 <= len(self.provider_request_id) <= 200:
            raise ValueError("provider request ID is invalid")


class AIProvider(Protocol):
    def execute(self, request: ProviderRequest) -> ProviderResult: ...


class KnownSafeProviderError(RuntimeError):
    pass


class ProviderOutcomeUnknownError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class _WorkerConfig:
    base_url: str
    token: str
    timeout: int


def _config() -> _WorkerConfig:
    raw_base = os.getenv("WEBDIAG_AI_API_INTERNAL_URL", "http://api:8000").strip()
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
        raise RuntimeError("WEBDIAG_AI_API_INTERNAL_URL must be a clean HTTP origin")
    token = os.getenv("WEBDIAG_AI_INTERNAL_TOKEN", "")
    if not token:
        raise RuntimeError("WEBDIAG_AI_INTERNAL_TOKEN is required")
    if len(token) < 32 or any(not 0x21 <= ord(character) <= 0x7E for character in token):
        raise RuntimeError(
            "WEBDIAG_AI_INTERNAL_TOKEN must contain at least 32 visible ASCII characters"
        )
    raw_timeout = os.getenv("WEBDIAG_AI_WORKER_TIMEOUT_SECONDS", "120")
    try:
        timeout = int(raw_timeout)
    except ValueError as error:
        raise RuntimeError("WEBDIAG_AI_WORKER_TIMEOUT_SECONDS must be an integer") from error
    return _WorkerConfig(
        base_url=f"{parsed.scheme}://{parsed.netloc}",
        token=token,
        timeout=max(5, min(600, timeout)),
    )


def _request_json(
    method: str,
    path: str,
    payload: dict[str, object] | None = None,
) -> dict[str, object]:
    config = _config()
    body = None
    headers = {
        "Authorization": f"Bearer {config.token}",
        "Accept": "application/json",
    }
    if payload is not None:
        body = json.dumps(payload, separators=(",", ":")).encode()
        headers["Content-Type"] = "application/json"
    request = Request(
        f"{config.base_url}{path}",
        data=body,
        method=method,
        headers=headers,
    )
    try:
        with urlopen(request, timeout=config.timeout) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except (HTTPError, URLError, TimeoutError) as error:
        raise RuntimeError("AI internal API request failed") from error
    if len(raw) > MAX_RESPONSE_BYTES:
        raise RuntimeError("AI internal API response is too large")
    try:
        parsed = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise RuntimeError("AI internal API returned invalid JSON") from error
    if not isinstance(parsed, dict):
        raise RuntimeError("AI internal API returned invalid JSON")
    return parsed


class _LeaseHeartbeat:
    def __init__(self, *, run_id: str, lease_token: str, interval_seconds: float) -> None:
        if interval_seconds <= 0:
            raise ValueError("AI lease renewal interval must be positive")
        self._run_id = run_id
        self._lease_token = lease_token
        self._interval_seconds = interval_seconds
        self._stop = threading.Event()
        self._error: BaseException | None = None
        self._thread = threading.Thread(
            target=self._run,
            name=f"webdiag-ai-lease-{run_id}",
            daemon=True,
        )

    def __enter__(self) -> _LeaseHeartbeat:
        self._thread.start()
        return self

    def __exit__(
        self,
        error_type: type[BaseException] | None,
        _error: BaseException | None,
        _traceback: TracebackType | None,
    ) -> None:
        self._stop.set()
        self._thread.join()
        if error_type is None and self._error is not None:
            raise RuntimeError("AI run lease renewal failed") from self._error

    def _run(self) -> None:
        while not self._stop.wait(self._interval_seconds):
            try:
                response = _request_json(
                    "POST",
                    f"/v1/internal/ai/runs/{self._run_id}/renew",
                    {"lease_token": self._lease_token},
                )
                _validate_contract(response)
                if not isinstance(response.get("lease_expires_at"), int):
                    raise RuntimeError("AI lease API returned an invalid expiry")
            except BaseException as error:
                self._error = error
                self._stop.set()
                return


def run_one_ai_job(
    provider: AIProvider,
    *,
    lease_renew_interval_seconds: float | None = None,
) -> bool:
    _config()
    claimed = _request_json("POST", "/v1/internal/ai/runs/claim")
    _validate_contract(claimed)
    raw_claim = claimed.get("claim")
    if raw_claim is None:
        return False
    claim = _provider_request(raw_claim)
    lease_token = raw_claim.get("lease_token")
    if not isinstance(lease_token, str) or not 32 <= len(lease_token) <= 256:
        raise RuntimeError("AI claim returned an invalid lease token")
    interval = (
        lease_renew_interval_seconds
        if lease_renew_interval_seconds is not None
        else float(os.getenv("WEBDIAG_AI_LEASE_RENEW_INTERVAL_SECONDS", "300"))
    )
    _validate_contract(
        _request_json(
            "POST",
            f"/v1/internal/ai/runs/{claim.run_id}/mark-submitted",
            {"lease_token": lease_token},
        )
    )
    try:
        with _LeaseHeartbeat(
            run_id=claim.run_id,
            lease_token=lease_token,
            interval_seconds=interval,
        ):
            result = provider.execute(claim)
    except KnownSafeProviderError:
        _fail(claim.run_id, lease_token, "ai_provider_failed", "known_safe")
        return True
    except ProviderOutcomeUnknownError:
        _fail(claim.run_id, lease_token, "ai_provider_outcome_unknown", "provider_unknown")
        return True
    except Exception:
        _fail(claim.run_id, lease_token, "ai_provider_outcome_unknown", "provider_unknown")
        return True
    if not isinstance(result, ProviderResult):
        raise RuntimeError("AI provider returned an invalid result")
    completed = _request_json(
        "POST",
        f"/v1/internal/ai/runs/{claim.run_id}/complete",
        {
            "lease_token": lease_token,
            "output": result.output,
            "provider_request_id": result.provider_request_id,
            "input_units": result.input_units,
            "output_units": result.output_units,
        },
    )
    _validate_contract(completed)
    if completed.get("state") != "succeeded":
        raise RuntimeError("AI complete API returned an invalid state")
    return True


def _fail(run_id: str, lease_token: str, error_code: str, outcome: str) -> None:
    response = _request_json(
        "POST",
        f"/v1/internal/ai/runs/{run_id}/fail",
        {"lease_token": lease_token, "error_code": error_code, "outcome": outcome},
    )
    _validate_contract(response)


def _validate_contract(payload: dict[str, object]) -> None:
    if payload.get("contract_version") != "webdiag.ai.worker.v1":
        raise RuntimeError("AI internal API returned an invalid contract")


def _provider_request(raw: object) -> ProviderRequest:
    if not isinstance(raw, dict):
        raise RuntimeError("AI claim returned invalid work")
    required = ("run_id", "tool_id", "contract_version", "model_policy")
    if any(not isinstance(raw.get(field), str) or not raw[field] for field in required):
        raise RuntimeError("AI claim returned invalid work")
    input_value = raw.get("input")
    if not isinstance(input_value, dict) or not all(
        isinstance(key, str) for key in input_value
    ):
        raise RuntimeError("AI claim returned invalid work")
    safety_identifier = raw.get("safety_identifier")
    if safety_identifier is not None and (
        not isinstance(safety_identifier, str)
        or not 32 <= len(safety_identifier) <= 64
        or any(not 0x21 <= ord(character) <= 0x7E for character in safety_identifier)
    ):
        raise RuntimeError("AI claim returned invalid work")
    return ProviderRequest(
        run_id=raw["run_id"],
        tool_id=raw["tool_id"],
        contract_version=raw["contract_version"],
        model_policy=raw["model_policy"],
        input=input_value,
        safety_identifier=safety_identifier,
    )
