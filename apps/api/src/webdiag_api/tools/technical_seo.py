from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import (
    SafeFetchConfig,
    SafeFetchError,
    SafeFetchResult,
    SafeHttpFetcher,
)
from webdiag_api.audit.html_metadata import parse_html_metadata
from webdiag_api.audit.robots import analyze_robots_txt
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])

_HREFLANG_RE = re.compile(r"^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$")
_SCRIPT_SKIP_TAGS = {"style", "script", "noscript", "template"}


class TechnicalSeoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class IndexabilitySignalResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    status: Literal["pass", "warning", "fail"]
    message: str = Field(min_length=1, max_length=500)


class IndexabilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.indexability.v1"] = (
        "webdiag.tool.indexability.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    redirect_count: int = Field(ge=0)
    robots_txt_allowed: bool | None
    robots_txt_status_code: int | None = Field(default=None, ge=100, le=599)
    meta_robots_noindex: bool
    meta_robots_nofollow: bool
    x_robots_tag_noindex: bool
    x_robots_tag_nofollow: bool
    canonical_url: str | None = Field(default=None, max_length=2_048)
    resolved_canonical_url: str | None = Field(default=None, max_length=2_048)
    canonical_matches_final_url: bool | None
    indexable_candidate: bool
    signals: tuple[IndexabilitySignalResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class HreflangAlternateResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hreflang: str = Field(min_length=1, max_length=80)
    href: str = Field(min_length=1, max_length=2_048)
    resolved_href: str = Field(min_length=1, max_length=2_048)
    valid_language_tag: bool
    self_reference: bool


class HreflangResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.hreflang.v1"] = "webdiag.tool.hreflang.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    html_lang: str | None = Field(default=None, max_length=80)
    total_alternates: int = Field(ge=0)
    valid_alternate_count: int = Field(ge=0)
    invalid_alternate_count: int = Field(ge=0)
    duplicate_hreflang_count: int = Field(ge=0)
    has_x_default: bool
    has_self_reference: bool
    alternates: tuple[HreflangAlternateResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


TechnologyCategory = Literal[
    "cms",
    "framework",
    "analytics",
    "cdn",
    "server",
    "hosting",
    "library",
]


class TechnologySignalResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    category: TechnologyCategory
    confidence: Literal["high", "medium", "low"]
    evidence: str = Field(min_length=1, max_length=240)


class TechnologyDetectorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.technology_detector.v1"] = (
        "webdiag.tool.technology_detector.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    detected_count: int = Field(ge=0)
    technologies: tuple[TechnologySignalResponse, ...]
    server_header: str | None = Field(default=None, max_length=240)
    powered_by_header: str | None = Field(default=None, max_length=240)
    generator_meta: str | None = Field(default=None, max_length=240)
    recommendation: str = Field(min_length=1, max_length=800)


@dataclass(frozen=True, slots=True)
class HreflangLink:
    hreflang: str
    href: str


@dataclass(frozen=True, slots=True)
class ParsedTechnicalHtml:
    html_lang: str | None
    hreflang_links: tuple[HreflangLink, ...]
    generator: str | None
    asset_urls: tuple[str, ...]
    body_markers: str


class _TechnicalHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_lang: str | None = None
        self.hreflang_links: list[HreflangLink] = []
        self.generator: str | None = None
        self.asset_urls: list[str] = []
        self._markers: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        values = {key.lower(): (value or "").strip() for key, value in attrs}
        if name in _SCRIPT_SKIP_TAGS:
            self._skip_depth += 1
        if name == "html" and values.get("lang") and self.html_lang is None:
            self.html_lang = values["lang"]
        if name == "meta":
            self._handle_meta(values)
        if name == "link":
            self._handle_link(values)
        if name in {"script", "img", "source", "iframe"}:
            self._append_asset(values.get("src"))
        if name == "link":
            self._append_asset(values.get("href"))
        if name == "div" and values.get("id") == "gatsby-focus-wrapper":
            self._markers.append("gatsby-focus-wrapper")
        if values.get("ng-version"):
            self._markers.append("ng-version")
        if values.get("data-reactroot") is not None:
            self._markers.append("data-reactroot")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in _SCRIPT_SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth > 0:
            lowered = data.lower()
            for marker in ("__nuxt__", "__next_data__", "shopify.theme", "gtag("):
                if marker in lowered:
                    self._markers.append(marker)

    def handle_comment(self, data: str) -> None:
        lowered = data.lower()
        if "wp-content" in lowered or "shopify" in lowered:
            self._markers.append(lowered[:120])

    def _handle_meta(self, values: dict[str, str]) -> None:
        name = values.get("name", "").lower()
        content = values.get("content", "")
        if name == "generator" and content and self.generator is None:
            self.generator = content[:240]

    def _handle_link(self, values: dict[str, str]) -> None:
        rel = {part.lower() for part in values.get("rel", "").split()}
        hreflang = values.get("hreflang")
        href = values.get("href")
        if "alternate" in rel and hreflang and href:
            self.hreflang_links.append(HreflangLink(hreflang=hreflang, href=href))

    def _append_asset(self, url: str | None) -> None:
        if url:
            self.asset_urls.append(url)


class _ResponseCollector:
    def __init__(self) -> None:
        self._seen: set[tuple[str, str]] = set()
        self.items: list[TechnologySignalResponse] = []

    def add(
        self,
        name: str,
        category: TechnologyCategory,
        confidence: Literal["high", "medium", "low"],
        evidence: str,
    ) -> None:
        key = (name.lower(), category)
        if key in self._seen:
            return
        self._seen.add(key)
        self.items.append(
            TechnologySignalResponse(
                name=name,
                category=category,
                confidence=confidence,
                evidence=evidence[:240],
            )
        )


def get_technical_seo_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_000_000))


TechnicalSeoFetcherDependency = Annotated[
    SafeHttpFetcher,
    Depends(get_technical_seo_fetcher),
]


@router.post("/v1/tools/indexability", response_model=IndexabilityResponse)
def inspect_indexability(
    payload: TechnicalSeoRequest,
    fetcher: TechnicalSeoFetcherDependency,
) -> IndexabilityResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    metadata = parse_html_metadata(fetched.body_text)
    x_robots = fetched.headers.get("x-robots-tag", "")
    robots_status, robots_allowed = _robots_permission(fetcher, fetched.final_url)
    resolved_canonical_url = (
        urljoin(fetched.final_url, metadata.canonical_url) if metadata.canonical_url else None
    )
    canonical_matches_final = (
        _normalize_url(resolved_canonical_url) == _normalize_url(fetched.final_url)
        if resolved_canonical_url
        else None
    )

    signals = _indexability_signals(
        fetched=fetched,
        robots_allowed=robots_allowed,
        meta_noindex=metadata.has_noindex,
        x_robots=x_robots,
        canonical_present=metadata.canonical_url is not None,
        canonical_matches_final=canonical_matches_final,
    )
    indexable_candidate = not any(signal.status == "fail" for signal in signals)

    return IndexabilityResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        redirect_count=len(fetched.redirect_chain),
        robots_txt_allowed=robots_allowed,
        robots_txt_status_code=robots_status,
        meta_robots_noindex=metadata.has_noindex,
        meta_robots_nofollow=metadata.has_nofollow,
        x_robots_tag_noindex="noindex" in x_robots.lower(),
        x_robots_tag_nofollow="nofollow" in x_robots.lower(),
        canonical_url=metadata.canonical_url,
        resolved_canonical_url=resolved_canonical_url,
        canonical_matches_final_url=canonical_matches_final,
        indexable_candidate=indexable_candidate,
        signals=tuple(signals),
        recommendation=_indexability_recommendation(signals),
    )


@router.post("/v1/tools/hreflang", response_model=HreflangResponse)
def inspect_hreflang(
    payload: TechnicalSeoRequest,
    fetcher: TechnicalSeoFetcherDependency,
) -> HreflangResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parsed = _parse_technical_html(fetched.body_text)
    alternates = tuple(
        _hreflang_response(link, base_url=fetched.final_url) for link in parsed.hreflang_links
    )
    language_counts: dict[str, int] = {}
    for item in alternates:
        key = item.hreflang.lower()
        language_counts[key] = language_counts.get(key, 0) + 1

    duplicate_count = sum(1 for count in language_counts.values() if count > 1)
    valid_count = sum(item.valid_language_tag for item in alternates)
    self_reference = any(item.self_reference for item in alternates)
    has_x_default = any(item.hreflang.lower() == "x-default" for item in alternates)

    return HreflangResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        html_lang=parsed.html_lang,
        total_alternates=len(alternates),
        valid_alternate_count=valid_count,
        invalid_alternate_count=len(alternates) - valid_count,
        duplicate_hreflang_count=duplicate_count,
        has_x_default=has_x_default,
        has_self_reference=self_reference,
        alternates=alternates,
        recommendation=_hreflang_recommendation(
            alternates=alternates,
            duplicate_count=duplicate_count,
            has_x_default=has_x_default,
            has_self_reference=self_reference,
        ),
    )


@router.post("/v1/tools/technology-detector", response_model=TechnologyDetectorResponse)
def inspect_technology(
    payload: TechnicalSeoRequest,
    fetcher: TechnicalSeoFetcherDependency,
) -> TechnologyDetectorResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parsed = _parse_technical_html(fetched.body_text)
    technologies = tuple(_detect_technologies(fetched=fetched, parsed=parsed))

    return TechnologyDetectorResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        detected_count=len(technologies),
        technologies=technologies,
        server_header=fetched.headers.get("server"),
        powered_by_header=fetched.headers.get("x-powered-by"),
        generator_meta=parsed.generator,
        recommendation=_technology_recommendation(technologies),
    )


def _fetch_html_or_raise(fetcher: SafeHttpFetcher, url: str) -> SafeFetchResult:
    try:
        fetched = fetcher.fetch(url)
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

    if "html" not in (fetched.content_type or "").lower():
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "tool_non_html_response",
                "message": "Target URL did not return HTML.",
            },
        )
    return fetched


def _robots_permission(
    fetcher: SafeHttpFetcher,
    final_url: str,
) -> tuple[int | None, bool | None]:
    robots_url = urljoin(_origin_from_url(final_url), "/robots.txt")
    try:
        fetched = fetcher.fetch(robots_url)
    except (SafeFetchError, UrlPolicyError):
        return None, None

    summary = analyze_robots_txt(
        fetched.body_text,
        robots_url=robots_url,
        target_url=final_url,
        status_code=fetched.status_code,
    )
    return summary.status_code, summary.allows_target


def _parse_technical_html(html: str) -> ParsedTechnicalHtml:
    parser = _TechnicalHtmlParser()
    parser.feed(html)
    parser.close()
    return ParsedTechnicalHtml(
        html_lang=parser.html_lang,
        hreflang_links=tuple(parser.hreflang_links),
        generator=parser.generator,
        asset_urls=tuple(parser.asset_urls[:240]),
        body_markers=" ".join(parser._markers)[:2_000],
    )


def _indexability_signals(
    *,
    fetched: SafeFetchResult,
    robots_allowed: bool | None,
    meta_noindex: bool,
    x_robots: str,
    canonical_present: bool,
    canonical_matches_final: bool | None,
) -> list[IndexabilitySignalResponse]:
    signals: list[IndexabilitySignalResponse] = []
    signals.append(
        IndexabilitySignalResponse(
            id="http-status",
            status="pass" if 200 <= fetched.status_code < 400 else "fail",
            message=f"Final HTTP status is {fetched.status_code}.",
        )
    )
    signals.append(
        IndexabilitySignalResponse(
            id="robots-txt",
            status="fail" if robots_allowed is False else "pass" if robots_allowed else "warning",
            message=(
                "robots.txt allows this URL."
                if robots_allowed is True
                else "robots.txt blocks this URL."
                if robots_allowed is False
                else "robots.txt permission could not be confirmed."
            ),
        )
    )
    signals.append(
        IndexabilitySignalResponse(
            id="meta-robots",
            status="fail" if meta_noindex else "pass",
            message="Meta robots contains noindex." if meta_noindex else "No meta noindex found.",
        )
    )
    x_robots_lower = x_robots.lower()
    signals.append(
        IndexabilitySignalResponse(
            id="x-robots-tag",
            status="fail" if "noindex" in x_robots_lower else "pass",
            message=(
                "X-Robots-Tag contains noindex."
                if "noindex" in x_robots_lower
                else "No X-Robots-Tag noindex found."
            ),
        )
    )
    canonical_status: Literal["pass", "warning", "fail"] = "pass"
    canonical_message = "Canonical points to the final URL."
    if not canonical_present:
        canonical_status = "warning"
        canonical_message = "Canonical link is missing."
    elif canonical_matches_final is False:
        canonical_status = "warning"
        canonical_message = "Canonical points to a different URL."
    signals.append(
        IndexabilitySignalResponse(
            id="canonical",
            status=canonical_status,
            message=canonical_message,
        )
    )
    return signals


def _indexability_recommendation(signals: list[IndexabilitySignalResponse]) -> str:
    failing = [signal for signal in signals if signal.status == "fail"]
    if failing:
        return (
            "Fix failed indexability signals before treating the page as an SEO landing "
            "page: "
            + ", ".join(signal.id for signal in failing)
            + "."
        )
    if any(signal.status == "warning" for signal in signals):
        return (
            "The page has no hard noindex block, but warnings should be reviewed before "
            "publishing it as a canonical indexable URL."
        )
    return "The static HTML indexability signals look suitable for an indexable page."


def _hreflang_response(link: HreflangLink, *, base_url: str) -> HreflangAlternateResponse:
    resolved = urljoin(base_url, link.href)
    hreflang = link.hreflang.strip()
    return HreflangAlternateResponse(
        hreflang=hreflang,
        href=link.href,
        resolved_href=resolved,
        valid_language_tag=_valid_hreflang(hreflang),
        self_reference=_normalize_url(resolved) == _normalize_url(base_url),
    )


def _valid_hreflang(value: str) -> bool:
    normalized = value.strip()
    return normalized.lower() == "x-default" or bool(_HREFLANG_RE.fullmatch(normalized))


def _hreflang_recommendation(
    *,
    alternates: tuple[HreflangAlternateResponse, ...],
    duplicate_count: int,
    has_x_default: bool,
    has_self_reference: bool,
) -> str:
    if not alternates:
        return (
            "No hreflang alternates were found. This is acceptable for single-language "
            "sites, but multilingual pages need reciprocal alternates and x-default."
        )
    if any(not alternate.valid_language_tag for alternate in alternates):
        return "Fix invalid hreflang language tags before relying on international targeting."
    if duplicate_count:
        return "Remove duplicate hreflang values; each language-region target should be unique."
    if not has_self_reference:
        return "Add a self-referencing hreflang alternate for the current page URL."
    if not has_x_default:
        return "Consider adding x-default for language selectors or global fallback pages."
    return "Hreflang alternates are structurally consistent in the static HTML scan."


def _detect_technologies(
    *,
    fetched: SafeFetchResult,
    parsed: ParsedTechnicalHtml,
) -> tuple[TechnologySignalResponse, ...]:
    collector = _ResponseCollector()
    headers_text = " ".join(f"{key}:{value}" for key, value in fetched.headers.items()).lower()
    assets_text = " ".join(parsed.asset_urls).lower()
    markers = parsed.body_markers.lower()
    generator = (parsed.generator or "").lower()
    combined = " ".join((headers_text, assets_text, markers, generator))

    if "wordpress" in generator or "wp-content" in combined or "wp-includes" in combined:
        collector.add("WordPress", "cms", "high", "generator meta or wp-content asset marker")
    if "drupal" in generator or "/sites/default/" in combined:
        collector.add("Drupal", "cms", "medium", "generator meta or Drupal asset path")
    if "joomla" in generator:
        collector.add("Joomla", "cms", "medium", "generator meta")
    if "shopify" in combined or "x-shopify" in headers_text:
        collector.add("Shopify", "cms", "high", "Shopify header, script, or CDN marker")
    if "wix" in combined or "wixstatic" in combined:
        collector.add("Wix", "cms", "high", "Wix script, asset, or header marker")
    if "tilda" in combined or "tildacdn" in combined:
        collector.add("Tilda", "cms", "high", "Tilda asset marker")
    if "webflow" in combined:
        collector.add("Webflow", "cms", "medium", "Webflow asset marker")

    if "_next/" in assets_text or "__next_data__" in markers or "x-nextjs" in headers_text:
        collector.add("Next.js", "framework", "high", "Next.js asset or response header marker")
    if "_nuxt/" in assets_text or "__nuxt__" in markers:
        collector.add("Nuxt", "framework", "high", "Nuxt asset or runtime marker")
    if "gatsby-focus-wrapper" in markers or "gatsby" in assets_text:
        collector.add("Gatsby", "framework", "medium", "Gatsby DOM or asset marker")
    if "react" in assets_text or "data-reactroot" in markers:
        collector.add("React", "library", "low", "React asset or hydration marker")
    if "vue" in assets_text or "__nuxt__" in markers:
        collector.add("Vue", "library", "low", "Vue/Nuxt asset or runtime marker")
    if "angular" in assets_text or "ng-version" in markers:
        collector.add("Angular", "framework", "medium", "Angular asset or ng-version marker")

    server = fetched.headers.get("server", "")
    powered_by = fetched.headers.get("x-powered-by", "")
    if server:
        collector.add(server.split()[0], "server", "medium", "Server response header")
    if powered_by:
        collector.add(powered_by.split()[0], "server", "medium", "X-Powered-By header")
    if "cloudflare" in headers_text or "cf-cache-status" in headers_text:
        collector.add("Cloudflare", "cdn", "high", "Cloudflare response headers")
    if "x-vercel-id" in headers_text or "vercel" in server.lower():
        collector.add("Vercel", "hosting", "high", "Vercel response header")
    if "x-nf-request-id" in headers_text or "netlify" in headers_text:
        collector.add("Netlify", "hosting", "high", "Netlify response header")

    if "googletagmanager" in combined or "gtag(" in markers:
        collector.add("Google Tag Manager / GA", "analytics", "medium", "Google tag marker")
    if "mc.yandex" in combined or "yandex_metrika" in combined:
        collector.add("Yandex Metrica", "analytics", "medium", "Yandex Metrica script marker")
    if "connect.facebook.net" in combined or "fbq(" in markers:
        collector.add("Meta Pixel", "analytics", "medium", "Meta Pixel script marker")

    return tuple(collector.items[:30])


def _technology_recommendation(technologies: tuple[TechnologySignalResponse, ...]) -> str:
    if not technologies:
        return (
            "No strong technology fingerprints were detected in static HTML and headers. "
            "Use browser-based detection later for runtime-only frameworks and tag managers."
        )
    low_confidence = sum(item.confidence == "low" for item in technologies)
    if low_confidence:
        return (
            "Review low-confidence detections manually; static fingerprints can be hidden, "
            "bundled, or removed by modern build pipelines."
        )
    return "Detected technologies are based on static HTML assets and response headers."


def _origin_from_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "/", "", ""))


def _normalize_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url.strip())
    scheme = parsed.scheme.lower()
    hostname = (parsed.hostname or "").lower()
    if not scheme or not hostname:
        return raw_url.rstrip("/")
    port = parsed.port
    default_port = (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    authority = hostname if port is None or default_port else f"{hostname}:{port}"
    path = parsed.path.rstrip("/") or "/"
    if path == "/":
        path = ""
    return urlunsplit((scheme, authority, path, parsed.query, ""))
