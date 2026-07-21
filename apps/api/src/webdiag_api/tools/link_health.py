from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])

LinkKind = Literal["internal", "external", "same-page", "mailto", "tel", "non-http"]
ImageSource = Literal["img-src", "img-srcset", "picture-source", "social-image"]


class LinkHealthRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2048)


class LinkItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2048)
    text: str | None = Field(default=None, max_length=240)
    kind: LinkKind
    rel: str | None = Field(default=None, max_length=240)
    target: str | None = Field(default=None, max_length=80)
    nofollow: bool
    sponsored: bool
    ugc: bool
    target_blank_missing_noopener: bool


class LinkAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.link_analyzer.v1"] = (
        "webdiag.tool.link_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2048)
    final_url: str = Field(min_length=1, max_length=2048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    total_links: int = Field(ge=0)
    unique_http_links: int = Field(ge=0)
    internal_count: int = Field(ge=0)
    external_count: int = Field(ge=0)
    same_page_count: int = Field(ge=0)
    mailto_tel_count: int = Field(ge=0)
    non_http_count: int = Field(ge=0)
    nofollow_count: int = Field(ge=0)
    sponsored_count: int = Field(ge=0)
    ugc_count: int = Field(ge=0)
    target_blank_missing_noopener_count: int = Field(ge=0)
    sample_links: tuple[LinkItemResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1000)


class BrokenLinkItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2048)
    text: str | None = Field(default=None, max_length=240)
    kind: Literal["internal", "external"]
    status_code: int | None = Field(default=None, ge=100, le=599)
    final_url: str | None = Field(default=None, max_length=2048)
    redirect_hops: int = Field(ge=0)
    broken: bool
    problem: str | None = Field(default=None, max_length=500)


class BrokenLinkCheckerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.broken_link_checker.v1"] = (
        "webdiag.tool.broken_link_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2048)
    final_url: str = Field(min_length=1, max_length=2048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    discovered_link_count: int = Field(ge=0)
    checked_link_count: int = Field(ge=0)
    broken_link_count: int = Field(ge=0)
    redirecting_link_count: int = Field(ge=0)
    skipped_non_http_count: int = Field(ge=0)
    items: tuple[BrokenLinkItemResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1000)


class BrokenImageItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2048)
    source: ImageSource
    status_code: int | None = Field(default=None, ge=100, le=599)
    final_url: str | None = Field(default=None, max_length=2048)
    content_type: str | None = Field(default=None, max_length=240)
    redirect_hops: int = Field(ge=0)
    broken: bool
    problem: str | None = Field(default=None, max_length=500)


class BrokenImageCheckerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.broken_image_checker.v1"] = (
        "webdiag.tool.broken_image_checker.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2048)
    final_url: str = Field(min_length=1, max_length=2048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    discovered_image_count: int = Field(ge=0)
    checked_image_count: int = Field(ge=0)
    broken_image_count: int = Field(ge=0)
    redirecting_image_count: int = Field(ge=0)
    items: tuple[BrokenImageItemResponse, ...]
    recommendation: str = Field(min_length=1, max_length=1000)


@dataclass(slots=True)
class ParsedLink:
    url: str
    raw_href: str
    text: str | None
    rel: str | None
    target: str | None


@dataclass(slots=True)
class OpenLink:
    index: int
    parts: list[str] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class ParsedImageCandidate:
    url: str
    source: ImageSource


class LinkHealthHTMLParser(HTMLParser):
    def __init__(self, *, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.links: list[ParsedLink] = []
        self.image_candidates: list[ParsedImageCandidate] = []
        self._open_links: list[OpenLink] = []
        self._picture_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        values = {
            name.lower(): (value if value is not None else "") for name, value in attrs
        }
        if tag == "a" and values.get("href") is not None:
            href = values["href"]
            self.links.append(
                ParsedLink(
                    url=_absolute_url(href, self.base_url),
                    raw_href=href.strip(),
                    text=None,
                    rel=_blank_to_none(values.get("rel")),
                    target=_blank_to_none(values.get("target")),
                )
            )
            self._open_links.append(OpenLink(index=len(self.links) - 1))

        if tag == "picture":
            self._picture_depth += 1

        if tag == "source" and self._picture_depth:
            for url in _srcset_urls(values.get("srcset")):
                self.image_candidates.append(
                    ParsedImageCandidate(
                        url=_absolute_url(url, self.base_url),
                        source="picture-source",
                    )
                )

        if tag == "img":
            if values.get("src"):
                self.image_candidates.append(
                    ParsedImageCandidate(
                        url=_absolute_url(values["src"], self.base_url),
                        source="img-src",
                    )
                )
            for url in _srcset_urls(values.get("srcset")):
                self.image_candidates.append(
                    ParsedImageCandidate(
                        url=_absolute_url(url, self.base_url),
                        source="img-srcset",
                    )
                )

        if tag == "meta":
            key = (values.get("property") or values.get("name") or "").lower()
            content = values.get("content")
            if content and key in {"og:image", "twitter:image", "twitter:image:src"}:
                self.image_candidates.append(
                    ParsedImageCandidate(
                        url=_absolute_url(content, self.base_url),
                        source="social-image",
                    )
                )

    def handle_data(self, data: str) -> None:
        if self._open_links:
            text = " ".join(data.split())
            if text:
                self._open_links[-1].parts.append(text)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "a" and self._open_links:
            opened = self._open_links.pop()
            current = self.links[opened.index]
            text = " ".join(opened.parts).strip()
            self.links[opened.index] = ParsedLink(
                url=current.url,
                raw_href=current.raw_href,
                text=text[:240] if text else None,
                rel=current.rel,
                target=current.target,
            )
        if tag == "picture" and self._picture_depth:
            self._picture_depth -= 1


def get_link_health_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=700_000, max_redirects=5))


LinkHealthFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_link_health_fetcher)]


@router.post("/v1/tools/link-analyzer", response_model=LinkAnalyzerResponse)
def inspect_links(
    payload: LinkHealthRequest,
    fetcher: LinkHealthFetcherDependency,
) -> LinkAnalyzerResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parser = _parse_html(fetched.body_text, base_url=fetched.final_url)
    rows = [_link_item(link, fetched.final_url) for link in parser.links]
    unique_http = {row.url for row in rows if row.kind in {"internal", "external"}}

    return LinkAnalyzerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        total_links=len(rows),
        unique_http_links=len(unique_http),
        internal_count=sum(row.kind == "internal" for row in rows),
        external_count=sum(row.kind == "external" for row in rows),
        same_page_count=sum(row.kind == "same-page" for row in rows),
        mailto_tel_count=sum(row.kind in {"mailto", "tel"} for row in rows),
        non_http_count=sum(row.kind == "non-http" for row in rows),
        nofollow_count=sum(row.nofollow for row in rows),
        sponsored_count=sum(row.sponsored for row in rows),
        ugc_count=sum(row.ugc for row in rows),
        target_blank_missing_noopener_count=sum(
            row.target_blank_missing_noopener for row in rows
        ),
        sample_links=tuple(rows[:50]),
        recommendation=_link_analyzer_recommendation(rows),
    )


@router.post("/v1/tools/broken-links", response_model=BrokenLinkCheckerResponse)
def inspect_broken_links(
    payload: LinkHealthRequest,
    fetcher: LinkHealthFetcherDependency,
) -> BrokenLinkCheckerResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parser = _parse_html(fetched.body_text, base_url=fetched.final_url)
    rows = [_link_item(link, fetched.final_url) for link in parser.links]
    checkable = _dedupe_links([row for row in rows if row.kind in {"internal", "external"}])
    inspected = tuple(_inspect_link(fetcher, row) for row in checkable[:80])

    return BrokenLinkCheckerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        discovered_link_count=len(rows),
        checked_link_count=len(inspected),
        broken_link_count=sum(row.broken for row in inspected),
        redirecting_link_count=sum(row.redirect_hops > 0 for row in inspected),
        skipped_non_http_count=sum(
            row.kind not in {"internal", "external"} for row in rows
        ),
        items=inspected,
        recommendation=_broken_links_recommendation(
            discovered=len(checkable),
            inspected=inspected,
        ),
    )


@router.post("/v1/tools/broken-images", response_model=BrokenImageCheckerResponse)
def inspect_broken_images(
    payload: LinkHealthRequest,
    fetcher: LinkHealthFetcherDependency,
) -> BrokenImageCheckerResponse:
    fetched = _fetch_html_or_raise(fetcher, payload.url)
    parser = _parse_html(fetched.body_text, base_url=fetched.final_url)
    candidates = _dedupe_image_candidates(parser.image_candidates)
    inspected = tuple(_inspect_image(fetcher, candidate) for candidate in candidates[:70])

    return BrokenImageCheckerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        discovered_image_count=len(candidates),
        checked_image_count=len(inspected),
        broken_image_count=sum(row.broken for row in inspected),
        redirecting_image_count=sum(row.redirect_hops > 0 for row in inspected),
        items=inspected,
        recommendation=_broken_images_recommendation(
            discovered=len(candidates),
            inspected=inspected,
        ),
    )


def _fetch_html_or_raise(fetcher: SafeHttpFetcher, url: str):
    try:
        fetched = fetcher.fetch(url, read_body=True)
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

    if fetched.content_type and "html" not in fetched.content_type.lower():
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "tool_non_html_response",
                "message": "Target URL did not return HTML.",
            },
        )
    return fetched


def _parse_html(html: str, *, base_url: str) -> LinkHealthHTMLParser:
    parser = LinkHealthHTMLParser(base_url=base_url)
    parser.feed(html)
    return parser


def _absolute_url(value: str, base_url: str) -> str:
    stripped = value.strip()
    return stripped if stripped.startswith("#") else urljoin(base_url, stripped).strip()


def _blank_to_none(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _srcset_urls(value: str | None) -> list[str]:
    if not value:
        return []
    urls: list[str] = []
    for candidate in value.split(","):
        parts = candidate.strip().split()
        if parts:
            urls.append(parts[0])
    return urls


def _kind(url: str, page_url: str) -> LinkKind:
    if url.startswith("#"):
        return "same-page"

    parsed = urlsplit(url)
    scheme = parsed.scheme.lower()
    if scheme == "mailto":
        return "mailto"
    if scheme == "tel":
        return "tel"
    if scheme not in {"http", "https"}:
        return "non-http"

    page_host = urlsplit(page_url).netloc.lower()
    return "internal" if parsed.netloc.lower() == page_host else "external"


def _rel_tokens(value: str | None) -> set[str]:
    return {token.lower() for token in (value or "").split()}


def _strip_fragment_for_http(url: str) -> str:
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"}:
        return url
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, parsed.query, ""))


def _link_item(link: ParsedLink, page_url: str) -> LinkItemResponse:
    rels = _rel_tokens(link.rel)
    kind = _kind(link.url, page_url)
    target = (link.target or "").lower()
    target_blank_missing_noopener = (
        target == "_blank" and kind == "external" and "noopener" not in rels
    )

    return LinkItemResponse(
        url=_strip_fragment_for_http(link.url),
        text=link.text,
        kind=kind,
        rel=link.rel,
        target=link.target,
        nofollow="nofollow" in rels,
        sponsored="sponsored" in rels,
        ugc="ugc" in rels,
        target_blank_missing_noopener=target_blank_missing_noopener,
    )


def _dedupe_links(rows: list[LinkItemResponse]) -> list[LinkItemResponse]:
    seen: set[str] = set()
    out: list[LinkItemResponse] = []
    for row in rows:
        if row.url not in seen:
            seen.add(row.url)
            out.append(row)
    return out


def _dedupe_image_candidates(
    candidates: list[ParsedImageCandidate],
) -> list[ParsedImageCandidate]:
    seen: set[str] = set()
    out: list[ParsedImageCandidate] = []
    for candidate in candidates:
        is_http = urlsplit(candidate.url).scheme in {"http", "https"}
        if is_http and candidate.url not in seen:
            seen.add(candidate.url)
            out.append(candidate)
    return out


def _inspect_link(
    fetcher: SafeHttpFetcher,
    row: LinkItemResponse,
) -> BrokenLinkItemResponse:
    try:
        fetched = fetcher.fetch(row.url, read_body=False)
    except (UrlPolicyError, SafeFetchError):
        return BrokenLinkItemResponse(
            url=row.url,
            text=row.text,
            kind="internal" if row.kind == "internal" else "external",
            status_code=None,
            final_url=None,
            redirect_hops=0,
            broken=True,
            problem="Link could not be safely fetched or resolved.",
        )

    broken = fetched.status_code >= 400
    return BrokenLinkItemResponse(
        url=row.url,
        text=row.text,
        kind="internal" if row.kind == "internal" else "external",
        status_code=fetched.status_code,
        final_url=fetched.final_url,
        redirect_hops=len(fetched.redirect_chain),
        broken=broken,
        problem="HTTP status is 400 or higher." if broken else None,
    )


def _inspect_image(
    fetcher: SafeHttpFetcher,
    candidate: ParsedImageCandidate,
) -> BrokenImageItemResponse:
    try:
        fetched = fetcher.fetch(candidate.url, read_body=False)
    except (UrlPolicyError, SafeFetchError):
        return BrokenImageItemResponse(
            url=candidate.url,
            source=candidate.source,
            status_code=None,
            final_url=None,
            content_type=None,
            redirect_hops=0,
            broken=True,
            problem="Image could not be safely fetched or resolved.",
        )

    content_type = (fetched.content_type or "").lower()
    not_image = bool(content_type and "image/" not in content_type)
    broken = fetched.status_code >= 400 or not_image
    problem = _broken_image_problem(fetched.status_code, not_image)

    return BrokenImageItemResponse(
        url=candidate.url,
        source=candidate.source,
        status_code=fetched.status_code,
        final_url=fetched.final_url,
        content_type=fetched.content_type,
        redirect_hops=len(fetched.redirect_chain),
        broken=broken,
        problem=problem,
    )


def _broken_image_problem(status_code: int, not_image: bool) -> str | None:
    if status_code >= 400:
        return "HTTP status is 400 or higher."
    if not_image:
        return "Resource does not declare an image content type."
    return None


def _link_analyzer_recommendation(rows: list[LinkItemResponse]) -> str:
    if not rows:
        return (
            "No links were found in the static HTML. Confirm that navigation is not "
            "injected only by JavaScript."
        )
    if any(row.target_blank_missing_noopener for row in rows):
        return "Add rel=noopener to external target=_blank links."
    if sum(row.kind == "internal" for row in rows) == 0:
        return "No internal links were found; verify crawl paths and discoverability."
    return (
        "Link structure looks controlled for the static HTML scan. Use broken-link "
        "checking to verify availability."
    )


def _broken_links_recommendation(
    *,
    discovered: int,
    inspected: tuple[BrokenLinkItemResponse, ...],
) -> str:
    notes: list[str] = []
    if inspected and len(inspected) < discovered:
        notes.append(
            "Only the first 80 unique HTTP links were checked; use crawler jobs for "
            "full-site coverage."
        )
    if any(row.broken for row in inspected):
        notes.append(
            "Fix or remove broken links; internal 4xx/5xx links are high-priority "
            "SEO and UX defects."
        )
    if any(row.redirect_hops > 0 for row in inspected):
        notes.append(
            "Update redirecting links to their final URLs where possible to reduce "
            "crawl and user latency."
        )
    return " ".join(notes) or "Checked HTTP links are reachable in the scan."


def _broken_images_recommendation(
    *,
    discovered: int,
    inspected: tuple[BrokenImageItemResponse, ...],
) -> str:
    notes: list[str] = []
    if inspected and len(inspected) < discovered:
        notes.append(
            "Only the first 70 unique image candidates were checked; use "
            "browser/PageSpeed for runtime assets."
        )
    if any(row.broken for row in inspected):
        notes.append(
            "Fix broken image URLs and non-image responses before tuning AVIF/WebP "
            "performance."
        )
    if any(row.redirect_hops > 0 for row in inspected):
        notes.append("Replace redirected image URLs with final CDN URLs.")
    return " ".join(notes) or "Checked image URLs are reachable image resources."
