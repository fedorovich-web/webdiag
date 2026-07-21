from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.audit.html_metadata import parse_html_metadata
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(prefix="/v1/tools/canonical", tags=["tools"])


class CanonicalRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class CanonicalResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.canonical.v1"] = "webdiag.tool.canonical.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = None
    canonical_url: str | None = Field(default=None, max_length=2_048)
    resolved_canonical_url: str | None = Field(default=None, max_length=2_048)
    canonical_present: bool
    canonical_is_absolute: bool | None
    canonical_matches_final_url: bool | None
    canonical_host_matches_final_url: bool | None
    has_noindex: bool
    redirect_count: int = Field(ge=0)
    recommendation: str = Field(min_length=1, max_length=800)


def get_canonical_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_000_000))


CanonicalFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_canonical_fetcher)]


@router.post("", response_model=CanonicalResponse)
def inspect_canonical(
    payload: CanonicalRequest,
    fetcher: CanonicalFetcherDependency,
) -> CanonicalResponse:
    try:
        fetched = fetcher.fetch(payload.url)
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

    metadata = parse_html_metadata(fetched.body_text)
    canonical_url = metadata.canonical_url
    resolved_canonical_url = urljoin(fetched.final_url, canonical_url) if canonical_url else None
    canonical_is_absolute = _is_absolute_url(canonical_url) if canonical_url else None
    canonical_matches_final_url = (
        _normalize_url_for_comparison(resolved_canonical_url)
        == _normalize_url_for_comparison(fetched.final_url)
        if resolved_canonical_url
        else None
    )
    canonical_host_matches_final_url = (
        _hostname(resolved_canonical_url) == _hostname(fetched.final_url)
        if resolved_canonical_url
        else None
    )

    return CanonicalResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        canonical_url=canonical_url,
        resolved_canonical_url=resolved_canonical_url,
        canonical_present=canonical_url is not None,
        canonical_is_absolute=canonical_is_absolute,
        canonical_matches_final_url=canonical_matches_final_url,
        canonical_host_matches_final_url=canonical_host_matches_final_url,
        has_noindex=metadata.has_noindex,
        redirect_count=len(fetched.redirect_chain),
        recommendation=_recommendation(
            status_code=fetched.status_code,
            canonical_present=canonical_url is not None,
            canonical_is_absolute=canonical_is_absolute,
            canonical_matches_final_url=canonical_matches_final_url,
            canonical_host_matches_final_url=canonical_host_matches_final_url,
            has_noindex=metadata.has_noindex,
            redirect_count=len(fetched.redirect_chain),
        ),
    )


def _is_absolute_url(raw_url: str | None) -> bool:
    if not raw_url:
        return False
    parsed = urlsplit(raw_url.strip())
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _hostname(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return (parsed.hostname or "").lower()


def _normalize_url_for_comparison(raw_url: str, *, base_url: str | None = None) -> str:
    normalized_url = urljoin(base_url, raw_url.strip()) if base_url else raw_url.strip()
    parsed = urlsplit(normalized_url)
    scheme = parsed.scheme.lower()
    hostname = parsed.hostname.lower() if parsed.hostname else ""
    if not scheme or not hostname:
        return normalized_url.rstrip("/")

    port = parsed.port
    default_port = (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    authority = hostname
    if port is not None and not default_port:
        authority = f"{hostname}:{port}"

    path = parsed.path.rstrip("/") or "/"
    if path == "/":
        path = ""
    return urlunsplit((scheme, authority, path, parsed.query, ""))


def _recommendation(
    *,
    status_code: int,
    canonical_present: bool,
    canonical_is_absolute: bool | None,
    canonical_matches_final_url: bool | None,
    canonical_host_matches_final_url: bool | None,
    has_noindex: bool,
    redirect_count: int,
) -> str:
    if status_code >= 400:
        return (
            "The page does not return a successful HTTP response. Fix the status code or redirect "
            "before using this URL as a canonical landing page."
        )
    if has_noindex:
        return (
            "The page declares noindex. Do not treat it as an indexable canonical target until "
            "robots meta directives match the SEO goal."
        )
    if not canonical_present:
        return (
            "Canonical link is missing. Add link rel=canonical to the preferred final URL "
            "to reduce duplicate URL ambiguity."
        )
    if canonical_is_absolute is False:
        return (
            "Canonical is relative. It can be resolved by browsers, but absolute canonical URLs "
            "are safer for migrations, syndication, and crawler diagnostics."
        )
    if canonical_host_matches_final_url is False:
        return (
            "Canonical points to another host. Confirm that this is intentional cross-domain "
            "canonicalization; otherwise align it with the final indexable URL."
        )
    if canonical_matches_final_url is False:
        return (
            "Canonical does not match the final URL after redirects. Align canonical, "
            "redirects, internal links, and sitemap URLs to the same preferred address."
        )
    if redirect_count > 0:
        return (
            "Canonical matches the final URL, but the tested URL redirects before reaching it. "
            "Link internally to the canonical final URL to reduce crawl waste "
            "and tracking ambiguity."
        )
    return (
        "Canonical is present and matches the final URL. Keep it aligned with sitemap "
        "entries, internal links, and redirect rules after releases."
    )
