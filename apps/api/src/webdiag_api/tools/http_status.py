from __future__ import annotations

from concurrent.futures import Future, ThreadPoolExecutor, wait
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field, model_validator

from webdiag_api.audit.fetcher import (
    SafeFetchConfig,
    SafeFetchError,
    SafeFetchResult,
    SafeHttpFetcher,
)
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(prefix="/v1/tools/http-status", tags=["tools"])
_BULK_MAX_WORKERS = 5
_BULK_DEADLINE_SECONDS = 15.0


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


class BulkHttpStatusRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    urls: list[Annotated[str, Field(min_length=1, max_length=2_048)]] = Field(
        min_length=1,
        max_length=50,
    )


class BulkHttpStatusError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: Literal[
        "tool_url_rejected",
        "tool_fetch_failed",
        "tool_batch_deadline_exceeded",
    ]
    message: str = Field(min_length=1, max_length=500)


class BulkHttpStatusItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    index: int = Field(ge=0, le=49)
    requested_url: str = Field(min_length=1, max_length=2_048)
    status: Literal["succeeded", "failed"]
    result: HttpStatusResponse | None = None
    error: BulkHttpStatusError | None = None

    @model_validator(mode="after")
    def validate_outcome(self) -> BulkHttpStatusItem:
        if self.status == "succeeded" and (self.result is None or self.error is not None):
            raise ValueError("succeeded bulk item must contain only a result")
        if self.status == "failed" and (self.error is None or self.result is not None):
            raise ValueError("failed bulk item must contain only an error")
        return self


class BulkHttpStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.bulk_http_status.v1"] = (
        "webdiag.tool.bulk_http_status.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    total: int = Field(ge=1, le=50)
    succeeded: int = Field(ge=0, le=50)
    failed: int = Field(ge=0, le=50)
    items: tuple[BulkHttpStatusItem, ...] = Field(min_length=1, max_length=50)


def get_http_status_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_024))


HttpStatusFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_http_status_fetcher)]


def get_bulk_http_status_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(
            timeout_seconds=3.0,
            max_redirects=2,
            max_body_bytes=1_024,
        )
    )


BulkHttpStatusFetcherDependency = Annotated[
    SafeHttpFetcher,
    Depends(get_bulk_http_status_fetcher),
]


@router.post("", response_model=HttpStatusResponse)
def inspect_http_status(
    payload: HttpStatusRequest,
    response: Response,
    fetcher: HttpStatusFetcherDependency,
) -> HttpStatusResponse:
    response.headers["cache-control"] = "no-store"
    try:
        fetched = fetcher.fetch(payload.url, read_body=False)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
            headers={"Cache-Control": "no-store"},
        ) from exc
    except SafeFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_fetch_failed", "message": str(exc)},
            headers={"Cache-Control": "no-store"},
        ) from exc

    return _to_status_response(fetched)


@router.post("/bulk", response_model=BulkHttpStatusResponse)
def inspect_bulk_http_status(
    payload: BulkHttpStatusRequest,
    response: Response,
    fetcher: BulkHttpStatusFetcherDependency,
) -> BulkHttpStatusResponse:
    response.headers["cache-control"] = "no-store"
    work = tuple(enumerate(payload.urls))
    executor = ThreadPoolExecutor(max_workers=min(_BULK_MAX_WORKERS, len(work)))
    futures: tuple[Future[BulkHttpStatusItem], ...] = tuple(
        executor.submit(_inspect_bulk_item, fetcher, index, url) for index, url in work
    )
    try:
        wait(futures, timeout=_BULK_DEADLINE_SECONDS)
        items = tuple(
            future.result()
            if future.done()
            else _deadline_item(index=index, requested_url=url)
            for (index, url), future in zip(work, futures, strict=True)
        )
    finally:
        for future in futures:
            future.cancel()
        executor.shutdown(wait=False, cancel_futures=True)

    succeeded = sum(item.status == "succeeded" for item in items)
    return BulkHttpStatusResponse(
        total=len(items),
        succeeded=succeeded,
        failed=len(items) - succeeded,
        items=items,
    )


def _deadline_item(*, index: int, requested_url: str) -> BulkHttpStatusItem:
    return BulkHttpStatusItem(
        index=index,
        requested_url=requested_url,
        status="failed",
        error=BulkHttpStatusError(
            code="tool_batch_deadline_exceeded",
            message="Bulk HTTP status deadline was exceeded.",
        ),
    )


def _inspect_bulk_item(
    fetcher: SafeHttpFetcher,
    index: int,
    requested_url: str,
) -> BulkHttpStatusItem:
    try:
        fetched = fetcher.fetch(requested_url, read_body=False)
    except UrlPolicyError as exc:
        return BulkHttpStatusItem(
            index=index,
            requested_url=requested_url,
            status="failed",
            error=BulkHttpStatusError(code="tool_url_rejected", message=str(exc)),
        )
    except SafeFetchError as exc:
        return BulkHttpStatusItem(
            index=index,
            requested_url=requested_url,
            status="failed",
            error=BulkHttpStatusError(code="tool_fetch_failed", message=str(exc)),
        )

    return BulkHttpStatusItem(
        index=index,
        requested_url=requested_url,
        status="succeeded",
        result=_to_status_response(fetched),
    )


def _to_status_response(fetched: SafeFetchResult) -> HttpStatusResponse:
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
