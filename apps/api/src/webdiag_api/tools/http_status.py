from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(prefix="/v1/tools/http-status", tags=["tools"])


class HttpStatusRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class HttpRedirectHopResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_url: str = Field(min_length=1, max_length=2_048)
    target_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)


class HttpStatusHeaderSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content_type: str | None = None
    content_length: str | None = None
    cache_control: str | None = None
    server: str | None = None


class HttpStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.http_status.v1"] = "webdiag.tool.http_status.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    ok: bool
    redirect_count: int = Field(ge=0)
    redirect_chain: tuple[HttpRedirectHopResponse, ...]
    headers: HttpStatusHeaderSummary
    recommendation: str = Field(min_length=1, max_length=500)


def get_http_status_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_024))


HttpStatusFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_http_status_fetcher)]


@router.post("", response_model=HttpStatusResponse)
def inspect_http_status(
    payload: HttpStatusRequest,
    fetcher: HttpStatusFetcherDependency,
) -> HttpStatusResponse:
    try:
        fetched = fetcher.fetch(payload.url, read_body=False)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_fetch_failed", "message": str(exc)},
        ) from exc

    return HttpStatusResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        ok=200 <= fetched.status_code < 400,
        redirect_count=len(fetched.redirect_chain),
        redirect_chain=tuple(
            HttpRedirectHopResponse(
                source_url=hop.source_url,
                target_url=hop.target_url,
                status_code=hop.status_code,
            )
            for hop in fetched.redirect_chain
        ),
        headers=HttpStatusHeaderSummary(
            content_type=fetched.headers.get("content-type"),
            content_length=fetched.headers.get("content-length"),
            cache_control=fetched.headers.get("cache-control"),
            server=fetched.headers.get("server"),
        ),
        recommendation=_recommendation(fetched.status_code, len(fetched.redirect_chain)),
    )


def _recommendation(status_code: int, redirect_count: int) -> str:
    if 200 <= status_code < 300 and redirect_count == 0:
        return (
            "URL opens directly with a successful HTTP response. "
            "Keep it stable for users and search crawlers."
        )
    if 200 <= status_code < 300:
        return (
            "The final URL returns a successful response. "
            "Review the redirect chain and remove avoidable hops when possible."
        )
    if 300 <= status_code < 400:
        return (
            "The URL still returns a redirect status after the configured redirect limit. "
            "Check canonical redirects and loops."
        )
    if status_code == 404:
        return (
            "The URL returns 404. Restore the page, redirect it to a relevant replacement, "
            "or remove internal links to it."
        )
    if 400 <= status_code < 500:
        return (
            "The URL returns a client error. Check access rules, routing, canonical URLs, "
            "and links that point to this page."
        )
    return (
        "The URL returns a server error. Check application logs, upstream services, cache, "
        "and deploy health before promoting traffic."
    )
