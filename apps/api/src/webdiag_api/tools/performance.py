from __future__ import annotations

import os
import re
from collections import Counter
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Any, Literal, Protocol
from urllib.parse import urljoin, urlsplit

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError, validate_url

router = APIRouter(tags=["tools"])

Strategy = Literal["mobile", "desktop"]
MetricStatus = Literal["pass", "warning", "fail", "unavailable"]
CheckStatus = Literal["pass", "warning", "fail"]
Severity = Literal["info", "medium", "high"]
ResourceType = Literal["document", "image", "script", "style", "font", "video", "other"]


class PageSpeedRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    strategy: Literal["mobile", "desktop", "both"] = "mobile"


class PageSpeedMetricResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    value: float | None = None
    unit: Literal["ms", "score", "ratio", "category"]
    display_value: str | None = Field(default=None, max_length=160)
    source: Literal["lab", "field"]
    status: MetricStatus


class PageSpeedOpportunityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    display_value: str | None = Field(default=None, max_length=240)
    savings_ms: float | None = Field(default=None, ge=0)
    score: float | None = Field(default=None, ge=0, le=1)


class PageSpeedStrategyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    strategy: Strategy
    available: bool
    performance_score: int | None = Field(default=None, ge=0, le=100)
    field_data_available: bool
    field_overall_category: str | None = Field(default=None, max_length=80)
    lighthouse_version: str | None = Field(default=None, max_length=80)
    analysis_fetch_time: str | None = Field(default=None, max_length=80)
    metrics: tuple[PageSpeedMetricResponse, ...]
    opportunities: tuple[PageSpeedOpportunityResponse, ...]
    fetch_error: str | None = Field(default=None, max_length=500)


class PageSpeedResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.core_web_vitals.v1"] = "webdiag.tool.core_web_vitals.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    normalized_url: str = Field(min_length=1, max_length=2_048)
    strategy: Literal["mobile", "desktop", "both"]
    results: tuple[PageSpeedStrategyResponse, ...]
    recommendation: str = Field(min_length=1, max_length=900)


class CachePolicyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class CachePolicyCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    status: CheckStatus
    severity: Severity
    value: str | None = Field(default=None, max_length=2_048)
    recommendation: str = Field(min_length=1, max_length=500)


class CachePolicyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.cache_policy.v1"] = "webdiag.tool.cache_policy.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = None
    is_static_asset: bool
    cache_control: str | None = None
    etag: str | None = None
    last_modified: str | None = None
    expires: str | None = None
    vary: str | None = None
    score: int = Field(ge=0, le=100)
    checks: tuple[CachePolicyCheckResponse, ...]
    recommendation: str = Field(min_length=1, max_length=900)


class PageWeightRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class ResourceSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: ResourceType
    count: int = Field(ge=0)
    known_bytes: int = Field(ge=0)
    unknown_size_count: int = Field(ge=0)


class PageResourceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    type: ResourceType
    status_code: int | None = Field(default=None, ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=240)
    content_length: int | None = Field(default=None, ge=0)
    modern_image_format: bool | None = None
    recommendation: str | None = Field(default=None, max_length=400)


class PageWeightResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.page_weight.v1"] = "webdiag.tool.page_weight.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    html_bytes: int = Field(ge=0)
    discovered_resource_count: int = Field(ge=0)
    checked_resource_count: int = Field(ge=0)
    total_known_bytes: int = Field(ge=0)
    unknown_size_count: int = Field(ge=0)
    image_count: int = Field(ge=0)
    legacy_image_count: int = Field(ge=0)
    modern_image_count: int = Field(ge=0)
    summaries: tuple[ResourceSummaryResponse, ...]
    largest_resources: tuple[PageResourceResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1_000)


class MissingPageSpeedApiKeyError(RuntimeError):
    pass


class PageSpeedApiError(RuntimeError):
    pass


class PageSpeedClient(Protocol):
    def run(self, *, url: str, strategy: Strategy) -> dict[str, Any]: ...


class GooglePageSpeedClient:
    def __init__(self, *, api_key: str | None = None) -> None:
        self._api_key = api_key if api_key is not None else os.getenv("GOOGLE_PAGESPEED_API_KEY")

    def run(self, *, url: str, strategy: Strategy) -> dict[str, Any]:
        if not self._api_key:
            raise MissingPageSpeedApiKeyError("Google PageSpeed API key is not configured.")
        try:
            with httpx.Client(timeout=35.0, trust_env=False) as client:
                response = client.get(
                    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                    params={
                        "url": url,
                        "strategy": strategy,
                        "category": "performance",
                        "key": self._api_key,
                    },
                    headers={"accept": "application/json"},
                )
        except httpx.TimeoutException as exc:
            raise PageSpeedApiError("Google PageSpeed API request timed out.") from exc
        except httpx.HTTPError as exc:
            raise PageSpeedApiError("Google PageSpeed API request failed.") from exc
        if response.status_code >= 400:
            raise PageSpeedApiError("Google PageSpeed API returned an error response.")
        try:
            payload = response.json()
        except ValueError as exc:
            raise PageSpeedApiError("Google PageSpeed API returned invalid JSON.") from exc
        if not isinstance(payload, dict):
            raise PageSpeedApiError("Google PageSpeed API returned an invalid payload.")
        return payload


def get_pagespeed_client() -> PageSpeedClient:
    return GooglePageSpeedClient()


def get_cache_policy_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_024))


def get_page_weight_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=500_000, max_redirects=5))


PageSpeedClientDependency = Annotated[PageSpeedClient, Depends(get_pagespeed_client)]
CachePolicyFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_cache_policy_fetcher)]
PageWeightFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_page_weight_fetcher)]


@router.post("/v1/tools/core-web-vitals", response_model=PageSpeedResponse)
def inspect_core_web_vitals(
    payload: PageSpeedRequest,
    pagespeed_client: PageSpeedClientDependency,
) -> PageSpeedResponse:
    try:
        validated = validate_url(payload.url)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc

    strategies: tuple[Strategy, ...] = (
        ("mobile", "desktop") if payload.strategy == "both" else (payload.strategy,)
    )
    results = tuple(
        _run_pagespeed_strategy(pagespeed_client, url=validated.normalized, strategy=strategy)
        for strategy in strategies
    )
    return PageSpeedResponse(
        requested_url=payload.url,
        normalized_url=validated.normalized,
        strategy=payload.strategy,
        results=results,
        recommendation=_pagespeed_recommendation(results),
    )


@router.post("/v1/tools/cache-policy", response_model=CachePolicyResponse)
def inspect_cache_policy(
    payload: CachePolicyRequest,
    fetcher: CachePolicyFetcherDependency,
) -> CachePolicyResponse:
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

    is_static_asset = _is_static_asset(fetched.final_url, fetched.content_type)
    checks = tuple(_cache_checks(fetched.headers, is_static_asset=is_static_asset))
    score = round((sum(1 for check in checks if check.status == "pass") / len(checks)) * 100)
    return CachePolicyResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        is_static_asset=is_static_asset,
        cache_control=fetched.headers.get("cache-control"),
        etag=fetched.headers.get("etag"),
        last_modified=fetched.headers.get("last-modified"),
        expires=fetched.headers.get("expires"),
        vary=fetched.headers.get("vary"),
        score=score,
        checks=checks,
        recommendation=_cache_recommendation(score, is_static_asset=is_static_asset),
    )


@router.post("/v1/tools/page-weight", response_model=PageWeightResponse)
def inspect_page_weight(
    payload: PageWeightRequest,
    fetcher: PageWeightFetcherDependency,
) -> PageWeightResponse:
    try:
        fetched = fetcher.fetch(payload.url, read_body=True)
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

    resources = _discover_resources(fetched.body_text, base_url=fetched.final_url)
    inspected: list[PageResourceResponse] = []
    for resource_url in resources[:40]:
        inspected.append(_inspect_resource(fetcher, resource_url))

    summaries = _summarize_resources(inspected)
    known_bytes = sum(resource.content_length or 0 for resource in inspected)
    unknown_size_count = sum(1 for resource in inspected if resource.content_length is None)
    image_resources = [resource for resource in inspected if resource.type == "image"]
    modern_image_count = sum(
        1 for resource in image_resources if resource.modern_image_format is True
    )
    legacy_image_count = sum(
        1 for resource in image_resources if resource.modern_image_format is False
    )
    largest = tuple(
        sorted(
            [resource for resource in inspected if resource.content_length is not None],
            key=lambda resource: resource.content_length or 0,
            reverse=True,
        )[:8]
    )

    return PageWeightResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        html_bytes=len(fetched.body_text.encode("utf-8")),
        discovered_resource_count=len(resources),
        checked_resource_count=len(inspected),
        total_known_bytes=known_bytes,
        unknown_size_count=unknown_size_count,
        image_count=len(image_resources),
        legacy_image_count=legacy_image_count,
        modern_image_count=modern_image_count,
        summaries=summaries,
        largest_resources=largest,
        recommendation=_page_weight_recommendation(
            known_bytes=known_bytes,
            unknown_size_count=unknown_size_count,
            legacy_image_count=legacy_image_count,
            discovered_resource_count=len(resources),
            checked_resource_count=len(inspected),
        ),
    )


def _run_pagespeed_strategy(
    client: PageSpeedClient,
    *,
    url: str,
    strategy: Strategy,
) -> PageSpeedStrategyResponse:
    try:
        payload = client.run(url=url, strategy=strategy)
    except MissingPageSpeedApiKeyError as exc:
        return _unavailable_pagespeed(strategy, str(exc))
    except PageSpeedApiError as exc:
        return _unavailable_pagespeed(strategy, str(exc))

    try:
        return _parse_pagespeed_payload(payload, strategy=strategy)
    except (KeyError, TypeError, ValueError):
        return _unavailable_pagespeed(
            strategy, "Google PageSpeed API returned an unsupported payload."
        )


def _unavailable_pagespeed(strategy: Strategy, message: str) -> PageSpeedStrategyResponse:
    return PageSpeedStrategyResponse(
        strategy=strategy,
        available=False,
        performance_score=None,
        field_data_available=False,
        field_overall_category=None,
        lighthouse_version=None,
        analysis_fetch_time=None,
        metrics=(),
        opportunities=(),
        fetch_error=message,
    )


def _parse_pagespeed_payload(
    payload: dict[str, Any], *, strategy: Strategy
) -> PageSpeedStrategyResponse:
    lighthouse = _as_dict(payload.get("lighthouseResult"))
    audits = _as_dict(lighthouse.get("audits"))
    categories = _as_dict(lighthouse.get("categories"))
    performance = _as_dict(categories.get("performance"))
    raw_score = performance.get("score")
    score = round(float(raw_score) * 100) if isinstance(raw_score, int | float) else None

    loading_experience = _as_dict(payload.get("loadingExperience"))
    field_metrics = _as_dict(loading_experience.get("metrics"))
    metrics = [
        _lab_metric(
            audits, "first-contentful-paint", "First Contentful Paint", "ms", (1_800, 3_000)
        ),
        _lab_metric(
            audits, "largest-contentful-paint", "Largest Contentful Paint", "ms", (2_500, 4_000)
        ),
        _lab_metric(audits, "speed-index", "Speed Index", "ms", (3_400, 5_800)),
        _lab_metric(audits, "total-blocking-time", "Total Blocking Time", "ms", (200, 600)),
        _lab_metric(
            audits, "cumulative-layout-shift", "Cumulative Layout Shift", "ratio", (0.1, 0.25)
        ),
    ]
    inp = _field_metric(field_metrics, "INTERACTION_TO_NEXT_PAINT", "Interaction to Next Paint")
    if inp is not None:
        metrics.append(inp)

    return PageSpeedStrategyResponse(
        strategy=strategy,
        available=True,
        performance_score=score,
        field_data_available=bool(field_metrics),
        field_overall_category=_optional_str(loading_experience.get("overall_category")),
        lighthouse_version=_optional_str(lighthouse.get("lighthouseVersion")),
        analysis_fetch_time=_optional_str(lighthouse.get("fetchTime")),
        metrics=tuple(metrics),
        opportunities=tuple(_opportunities(audits)),
        fetch_error=None,
    )


def _lab_metric(
    audits: dict[str, Any],
    audit_id: str,
    title: str,
    unit: Literal["ms", "ratio"],
    thresholds: tuple[float, float],
) -> PageSpeedMetricResponse:
    audit = _as_dict(audits.get(audit_id))
    value = audit.get("numericValue")
    numeric = float(value) if isinstance(value, int | float) else None
    return PageSpeedMetricResponse(
        id=audit_id,
        title=_optional_str(audit.get("title")) or title,
        value=numeric,
        unit=unit,
        display_value=_optional_str(audit.get("displayValue")),
        source="lab",
        status=_threshold_status(numeric, thresholds),
    )


def _field_metric(
    metrics: dict[str, Any],
    metric_id: str,
    title: str,
) -> PageSpeedMetricResponse | None:
    metric = _as_dict(metrics.get(metric_id))
    if not metric:
        return None
    percentile = metric.get("percentile")
    numeric = float(percentile) if isinstance(percentile, int | float) else None
    return PageSpeedMetricResponse(
        id=metric_id.lower(),
        title=title,
        value=numeric,
        unit="ms",
        display_value=f"{round(numeric)} ms" if numeric is not None else None,
        source="field",
        status=_threshold_status(numeric, (200, 500)),
    )


def _threshold_status(value: float | None, thresholds: tuple[float, float]) -> MetricStatus:
    if value is None:
        return "unavailable"
    if value <= thresholds[0]:
        return "pass"
    if value <= thresholds[1]:
        return "warning"
    return "fail"


def _opportunities(audits: dict[str, Any]) -> list[PageSpeedOpportunityResponse]:
    rows: list[PageSpeedOpportunityResponse] = []
    for audit_id, raw in audits.items():
        audit = _as_dict(raw)
        details = _as_dict(audit.get("details"))
        savings = details.get("overallSavingsMs")
        score = audit.get("score")
        if not isinstance(savings, int | float) or savings <= 0:
            continue
        rows.append(
            PageSpeedOpportunityResponse(
                id=str(audit_id),
                title=_optional_str(audit.get("title")) or str(audit_id),
                display_value=_optional_str(audit.get("displayValue")),
                savings_ms=float(savings),
                score=float(score) if isinstance(score, int | float) else None,
            )
        )
    return sorted(rows, key=lambda row: row.savings_ms or 0, reverse=True)[:8]


def _cache_checks(
    headers: dict[str, str], *, is_static_asset: bool
) -> list[CachePolicyCheckResponse]:
    cache_control = headers.get("cache-control")
    normalized_cache = cache_control.lower() if cache_control else ""
    max_age = _max_age_seconds(normalized_cache)
    validators = [value for value in (headers.get("etag"), headers.get("last-modified")) if value]
    content_encoding = headers.get("content-encoding")
    vary = headers.get("vary")
    checks: list[CachePolicyCheckResponse] = []

    if not cache_control:
        checks.append(
            CachePolicyCheckResponse(
                id="cache-control",
                title="Cache-Control policy",
                status="fail",
                severity="high" if is_static_asset else "medium",
                value=None,
                recommendation=(
                    "Add an explicit Cache-Control policy so browsers, CDNs, and crawlers "
                    "do not guess caching behavior."
                ),
            )
        )
    elif is_static_asset and (max_age is None or max_age < 604_800):
        checks.append(
            CachePolicyCheckResponse(
                id="cache-control",
                title="Static asset cache lifetime",
                status="warning",
                severity="medium",
                value=cache_control,
                recommendation=(
                    "Use long-lived immutable caching for hashed static assets and change "
                    "the URL when the asset changes."
                ),
            )
        )
    elif (
        not is_static_asset
        and max_age is not None
        and max_age > 86_400
        and "public" in normalized_cache
    ):
        checks.append(
            CachePolicyCheckResponse(
                id="cache-control",
                title="HTML cache lifetime",
                status="warning",
                severity="medium",
                value=cache_control,
                recommendation=(
                    "Avoid long public caching for HTML unless releases, personalization, "
                    "and purge rules are controlled."
                ),
            )
        )
    else:
        checks.append(
            CachePolicyCheckResponse(
                id="cache-control",
                title="Cache-Control policy",
                status="pass",
                severity="info",
                value=cache_control,
                recommendation=(
                    "Cache-Control is explicit. Keep cache lifetime aligned with asset "
                    "hashing and release policy."
                ),
            )
        )

    checks.append(
        CachePolicyCheckResponse(
            id="validators",
            title="Revalidation validators",
            status="pass" if validators else "warning",
            severity="info" if validators else "medium",
            value=", ".join(validators) if validators else None,
            recommendation=(
                "Serve ETag or Last-Modified to let clients revalidate cached "
                "responses efficiently."
            )
            if not validators
            else "A validator is present. Keep it stable and cheap to compute.",
        )
    )
    checks.append(
        CachePolicyCheckResponse(
            id="expires",
            title="Expires fallback",
            status="pass" if headers.get("expires") or cache_control else "warning",
            severity="info",
            value=headers.get("expires"),
            recommendation=(
                "Cache-Control is the primary policy; Expires can remain as a "
                "compatibility fallback."
            )
            if headers.get("expires")
            else (
                "Cache-Control is enough for modern clients; add Expires only if "
                "legacy cache compatibility is required."
            ),
        )
    )
    checks.append(
        CachePolicyCheckResponse(
            id="vary",
            title="Vary header for negotiated responses",
            status="pass"
            if not content_encoding or (vary and "accept-encoding" in vary.lower())
            else "warning",
            severity="info"
            if not content_encoding or (vary and "accept-encoding" in vary.lower())
            else "medium",
            value=vary,
            recommendation=(
                "When serving compressed variants, include Vary: Accept-Encoding so "
                "caches do not mix incompatible responses."
            )
            if content_encoding and not (vary and "accept-encoding" in vary.lower())
            else "Vary policy is acceptable for the observed response.",
        )
    )
    return checks


def _cache_recommendation(score: int, *, is_static_asset: bool) -> str:
    if score >= 90:
        return (
            "Caching policy is explicit and consistent with the observed response type. "
            "Keep release and CDN purge rules documented."
        )
    if is_static_asset:
        return (
            "Static assets should use long-lived immutable caching when filenames are "
            "content-hashed. This improves repeat visits and Core Web Vitals."
        )
    return (
        "Add explicit Cache-Control and validators. HTML should avoid accidental "
        "long public caching unless purge and personalization rules are controlled."
    )


STATIC_EXTENSIONS = {
    ".js",
    ".mjs",
    ".css",
    ".webp",
    ".avif",
    ".jpg",
    ".jpeg",
    ".png",
    ".svg",
    ".gif",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".mp4",
    ".webm",
}


def _is_static_asset(url: str, content_type: str | None) -> bool:
    path = urlsplit(url).path.lower()
    if any(path.endswith(extension) for extension in STATIC_EXTENSIONS):
        return True
    normalized = (content_type or "").lower()
    return normalized.startswith(
        ("image/", "font/", "text/css", "application/javascript", "text/javascript", "video/")
    )


def _max_age_seconds(cache_control: str) -> int | None:
    match = re.search(r"(?:s-maxage|max-age)\s*=\s*(\d+)", cache_control)
    if not match:
        return None
    return int(match.group(1))


class ResourceHTMLParser(HTMLParser):
    def __init__(self, *, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {name.lower(): value for name, value in attrs if value}
        if tag in {"img", "script", "iframe"}:
            self._add(values.get("src"))
        if tag == "source":
            self._add_srcset(values.get("srcset"))
            self._add(values.get("src"))
        if tag == "img":
            self._add_srcset(values.get("srcset"))
        if tag == "video":
            self._add(values.get("poster"))
        if tag == "link":
            rel = (values.get("rel") or "").lower()
            if any(
                token in rel
                for token in ("stylesheet", "preload", "modulepreload", "icon", "apple-touch-icon")
            ):
                self._add(values.get("href"))

    def _add_srcset(self, value: str | None) -> None:
        if not value:
            return
        for candidate in value.split(","):
            self._add(candidate.strip().split(" ")[0])

    def _add(self, value: str | None) -> None:
        if not value or value.startswith(("data:", "blob:", "javascript:", "#")):
            return
        absolute = urljoin(self.base_url, value)
        if urlsplit(absolute).scheme in {"http", "https"} and absolute not in self.urls:
            self.urls.append(absolute)


def _discover_resources(html: str, *, base_url: str) -> list[str]:
    parser = ResourceHTMLParser(base_url=base_url)
    parser.feed(html)
    return parser.urls


def _inspect_resource(fetcher: SafeHttpFetcher, url: str) -> PageResourceResponse:
    try:
        fetched = fetcher.fetch(url, read_body=False)
    except (UrlPolicyError, SafeFetchError):
        return PageResourceResponse(
            url=url,
            type=_resource_type(url, None),
            status_code=None,
            content_type=None,
            content_length=None,
            modern_image_format=None,
            recommendation=(
                "Resource could not be safely inspected. Check URL accessibility, "
                "redirects, and host policy."
            ),
        )
    content_length = _content_length(fetched.headers.get("content-length"))
    resource_type = _resource_type(fetched.final_url, fetched.content_type)
    modern_image = (
        _modern_image_format(fetched.final_url, fetched.content_type)
        if resource_type == "image"
        else None
    )
    return PageResourceResponse(
        url=fetched.final_url,
        type=resource_type,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        content_length=content_length,
        modern_image_format=modern_image,
        recommendation=_resource_recommendation(resource_type, modern_image, content_length),
    )


def _content_length(value: str | None) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except ValueError:
        return None
    return parsed if parsed >= 0 else None


def _resource_type(url: str, content_type: str | None) -> ResourceType:
    normalized = (content_type or "").lower()
    path = urlsplit(url).path.lower()
    if normalized.startswith("image/") or path.endswith(
        (".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg", ".gif", ".ico")
    ):
        return "image"
    if normalized.startswith("font/") or path.endswith((".woff", ".woff2", ".ttf", ".otf")):
        return "font"
    if normalized.startswith("text/css") or path.endswith(".css"):
        return "style"
    if "javascript" in normalized or path.endswith((".js", ".mjs")):
        return "script"
    if normalized.startswith("video/") or path.endswith((".mp4", ".webm")):
        return "video"
    if normalized.startswith("text/html"):
        return "document"
    return "other"


def _modern_image_format(url: str, content_type: str | None) -> bool | None:
    normalized = (content_type or "").lower()
    path = urlsplit(url).path.lower()
    if (
        "image/avif" in normalized
        or "image/webp" in normalized
        or path.endswith((".avif", ".webp"))
    ):
        return True
    if (
        "image/jpeg" in normalized
        or "image/png" in normalized
        or path.endswith((".jpg", ".jpeg", ".png"))
    ):
        return False
    return None


def _resource_recommendation(
    resource_type: ResourceType,
    modern_image: bool | None,
    content_length: int | None,
) -> str | None:
    if resource_type == "image" and modern_image is False:
        return (
            "Use AVIF/WebP variants for photographic or heavy raster images, "
            "with appropriate fallbacks where needed."
        )
    if resource_type == "image" and content_length is not None and content_length > 250_000:
        return (
            "Large image asset. Check dimensions, compression quality, responsive "
            "srcset, and whether it affects LCP."
        )
    if (
        resource_type in {"script", "style"}
        and content_length is not None
        and content_length > 200_000
    ):
        return (
            "Large render-critical asset. Split, defer, tree-shake, or cache "
            "aggressively where appropriate."
        )
    return None


def _summarize_resources(
    resources: list[PageResourceResponse],
) -> tuple[ResourceSummaryResponse, ...]:
    counts = Counter(resource.type for resource in resources)
    known = Counter[ResourceType]()
    unknown = Counter[ResourceType]()
    for resource in resources:
        if resource.content_length is None:
            unknown[resource.type] += 1
        else:
            known[resource.type] += resource.content_length
    return tuple(
        ResourceSummaryResponse(
            type=resource_type,
            count=counts[resource_type],
            known_bytes=known[resource_type],
            unknown_size_count=unknown[resource_type],
        )
        for resource_type in ("document", "image", "script", "style", "font", "video", "other")
        if counts[resource_type]
    )


def _page_weight_recommendation(
    *,
    known_bytes: int,
    unknown_size_count: int,
    legacy_image_count: int,
    discovered_resource_count: int,
    checked_resource_count: int,
) -> str:
    notes: list[str] = []
    if checked_resource_count < discovered_resource_count:
        notes.append(
            
                "Only the first 40 static HTML resources were inspected; use the "
                "browser/PageSpeed layer for runtime waterfall coverage."
            
        )
    if legacy_image_count:
        notes.append(
            
                "Replace heavy JPEG/PNG raster images with AVIF/WebP variants where "
                "visual quality and browser support allow."
            
        )
    if known_bytes > 2_000_000:
        notes.append(
            
                "Known static resources exceed 2 MB; reduce JS/CSS payloads, "
                "compress images, and review third-party assets."
            
        )
    if unknown_size_count:
        notes.append(
            
                "Some resources did not expose Content-Length; verify transfer size "
                "through CDN logs or browser waterfall."
            
        )
    if not notes:
        notes.append(
            
                "Static resource weight looks controlled for the inspected HTML references. "
                "Confirm runtime assets with PageSpeed or browser waterfall."
            
        )
    return " ".join(notes)


def _pagespeed_recommendation(results: tuple[PageSpeedStrategyResponse, ...]) -> str:
    if not any(result.available for result in results):
        return (
            "PageSpeed integration is configured but no result is available. Set "
            "GOOGLE_PAGESPEED_API_KEY in production and keep this tool graceful "
            "when the provider is unavailable."
        )
    scores = [
        result.performance_score for result in results if result.performance_score is not None
    ]
    if scores and min(scores) >= 90:
        return (
            "PageSpeed performance is strong for the tested strategy. Keep monitoring "
            "Core Web Vitals after releases and content changes."
        )
    if scores and min(scores) >= 50:
        return (
            "PageSpeed shows medium performance risk. Prioritize LCP, INP/TBT, "
            "image weight, render-blocking CSS/JS, and caching opportunities."
        )
    return (
        "PageSpeed shows high performance risk or missing score. Review Lighthouse "
        "opportunities, Core Web Vitals field data, and heavy resources before scaling traffic."
    )


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _optional_str(value: Any) -> str | None:
    return value if isinstance(value, str) else None
