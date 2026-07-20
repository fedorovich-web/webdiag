from __future__ import annotations

import socket
from collections.abc import Callable
from dataclasses import dataclass
from urllib.parse import urljoin

import httpx

from webdiag_api.security.url_policy import (
    UrlPolicyError,
    validate_resolved_addresses,
    validate_url,
)

DEFAULT_USER_AGENT = "WebDiagBot/0.5 (+https://webdiag.local/audit)"
REDIRECT_STATUS_CODES = frozenset({301, 302, 303, 307, 308})


class SafeFetchError(RuntimeError):
    """Raised when a safe audit fetch cannot be completed."""


@dataclass(frozen=True, slots=True)
class SafeFetchConfig:
    timeout_seconds: float = 8.0
    max_redirects: int = 5
    max_body_bytes: int = 1_000_000
    user_agent: str = DEFAULT_USER_AGENT

    def __post_init__(self) -> None:
        if self.timeout_seconds <= 0:
            raise ValueError("timeout_seconds must be greater than zero.")
        if self.max_redirects < 0:
            raise ValueError("max_redirects cannot be negative.")
        if self.max_body_bytes < 1_024:
            raise ValueError("max_body_bytes must be at least 1024 bytes.")
        if not self.user_agent.strip():
            raise ValueError("user_agent cannot be blank.")


@dataclass(frozen=True, slots=True)
class RedirectHop:
    source_url: str
    target_url: str
    status_code: int


@dataclass(frozen=True, slots=True)
class SafeFetchResult:
    requested_url: str
    final_url: str
    status_code: int
    headers: dict[str, str]
    body_text: str
    content_type: str | None
    redirect_chain: tuple[RedirectHop, ...]
    truncated: bool = False


Resolver = Callable[[str, int], list[str]]


def default_resolver(hostname: str, port: int) -> list[str]:
    """Resolve a hostname for the SSRF guard before a network request."""
    try:
        values = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise UrlPolicyError("Hostname could not be resolved.") from exc
    return sorted({item[4][0] for item in values})


class SafeHttpFetcher:
    """HTTP fetcher for audit checks with SSRF and redirect policy enforcement."""

    def __init__(
        self,
        *,
        config: SafeFetchConfig | None = None,
        resolver: Resolver | None = None,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.config = config or SafeFetchConfig()
        self._resolver = resolver or default_resolver
        self._transport = transport

    def _validate_before_request(self, raw_url: str) -> str:
        validated = validate_url(raw_url)
        resolved_addresses = self._resolver(validated.hostname, validated.port)
        validate_resolved_addresses(resolved_addresses)
        return validated.normalized

    def fetch(self, raw_url: str) -> SafeFetchResult:
        current_url = self._validate_before_request(raw_url)
        requested_url = current_url
        redirect_chain: list[RedirectHop] = []
        headers = {"user-agent": self.config.user_agent, "accept": "text/html,*/*;q=0.8"}

        with httpx.Client(
            follow_redirects=False,
            timeout=self.config.timeout_seconds,
            transport=self._transport,
        ) as client:
            while True:
                try:
                    response = client.get(current_url, headers=headers)
                except httpx.TimeoutException as exc:
                    raise SafeFetchError("HTTP fetch timed out.") from exc
                except httpx.HTTPError as exc:
                    raise SafeFetchError("HTTP fetch failed.") from exc

                location = response.headers.get("location")
                if response.status_code in REDIRECT_STATUS_CODES and location:
                    if len(redirect_chain) >= self.config.max_redirects:
                        raise SafeFetchError("Redirect limit exceeded.")
                    target_url = self._validate_before_request(urljoin(current_url, location))
                    redirect_chain.append(
                        RedirectHop(
                            source_url=current_url,
                            target_url=target_url,
                            status_code=response.status_code,
                        )
                    )
                    current_url = target_url
                    continue

                raw_body = response.content
                truncated = len(raw_body) > self.config.max_body_bytes
                body = raw_body[: self.config.max_body_bytes] if truncated else raw_body
                encoding = response.encoding or "utf-8"
                try:
                    body_text = body.decode(encoding, errors="replace")
                except LookupError:
                    body_text = body.decode("utf-8", errors="replace")

                normalized_headers = {key.lower(): value for key, value in response.headers.items()}
                return SafeFetchResult(
                    requested_url=requested_url,
                    final_url=str(response.url),
                    status_code=response.status_code,
                    headers=normalized_headers,
                    body_text=body_text,
                    content_type=normalized_headers.get("content-type"),
                    redirect_chain=tuple(redirect_chain),
                    truncated=truncated,
                )
