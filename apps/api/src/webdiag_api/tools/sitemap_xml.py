from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit, urlunsplit
from xml.etree import ElementTree

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.audit.sitemap import parse_sitemap_xml
from webdiag_api.security.url_policy import UrlPolicyError, validate_url

router = APIRouter(prefix="/v1/tools/sitemap", tags=["tools"])


class SitemapXmlRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    target_url: str | None = Field(default=None, min_length=1, max_length=2_048)


class SitemapLocResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class SitemapXmlToolResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.sitemap_xml.v1"] = "webdiag.tool.sitemap_xml.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    sitemap_url: str = Field(min_length=1, max_length=2_048)
    target_url: str | None = Field(default=None, min_length=1, max_length=2_048)
    status_code: int | None = Field(default=None, ge=100, le=599)
    available: bool
    valid_xml: bool
    kind: Literal["urlset", "sitemapindex", "unknown"]
    url_count: int = Field(ge=0)
    sitemap_count: int = Field(ge=0)
    contains_target: bool | None
    sample_urls: tuple[SitemapLocResponse, ...]
    sample_sitemaps: tuple[SitemapLocResponse, ...]
    content_type: str | None = None
    parse_error: str | None = Field(default=None, max_length=500)
    fetch_error: str | None = Field(default=None, max_length=500)
    recommendation: str = Field(min_length=1, max_length=800)


def get_sitemap_xml_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_000_000))


SitemapXmlFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_sitemap_xml_fetcher)]


@router.post("", response_model=SitemapXmlToolResponse)
def inspect_sitemap_xml(
    payload: SitemapXmlRequest,
    fetcher: SitemapXmlFetcherDependency,
) -> SitemapXmlToolResponse:
    try:
        requested_url = validate_url(payload.url).normalized
        target_url = _target_url(payload=payload, requested_url=requested_url)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc

    sitemap_url = (
        requested_url
        if _looks_like_sitemap_url(requested_url)
        else urljoin(_origin_from_url(requested_url), "/sitemap.xml")
    )

    try:
        fetched = fetcher.fetch(sitemap_url)
        body_text = fetched.body_text
        status_code_value: int | None = fetched.status_code
        fetch_error = None
        content_type = fetched.content_type
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        body_text = ""
        status_code_value = None
        fetch_error = str(exc)
        content_type = None

    summary = parse_sitemap_xml(
        body_text,
        sitemap_url=sitemap_url,
        target_url=target_url or requested_url,
        status_code=status_code_value,
        fetch_error=fetch_error,
    )
    kind, loc_urls = _sitemap_kind_and_locs(body_text) if summary.valid_xml else ("unknown", ())
    sample_urls, sample_sitemaps = _split_samples(kind, loc_urls)

    return SitemapXmlToolResponse(
        requested_url=payload.url,
        sitemap_url=sitemap_url,
        target_url=target_url,
        status_code=summary.status_code,
        available=summary.available,
        valid_xml=summary.valid_xml,
        kind=kind,
        url_count=len(sample_urls.all_locs) if kind == "urlset" else 0,
        sitemap_count=len(sample_sitemaps.all_locs) if kind == "sitemapindex" else 0,
        contains_target=summary.contains_target if target_url else None,
        sample_urls=tuple(SitemapLocResponse(url=url) for url in sample_urls.visible_locs),
        sample_sitemaps=tuple(SitemapLocResponse(url=url) for url in sample_sitemaps.visible_locs),
        content_type=content_type,
        parse_error=_truncate(summary.parse_error),
        fetch_error=_truncate(summary.fetch_error),
        recommendation=_recommendation(
            available=summary.available,
            valid_xml=summary.valid_xml,
            kind=kind,
            url_count=len(sample_urls.all_locs) if kind == "urlset" else 0,
            sitemap_count=len(sample_sitemaps.all_locs) if kind == "sitemapindex" else 0,
            contains_target=summary.contains_target if target_url else None,
            fetch_error=summary.fetch_error,
            parse_error=summary.parse_error,
        ),
    )


class _LocSplit(BaseModel):
    all_locs: tuple[str, ...]
    visible_locs: tuple[str, ...]


def _target_url(*, payload: SitemapXmlRequest, requested_url: str) -> str | None:
    if payload.target_url is not None:
        return validate_url(payload.target_url).normalized
    return None if _looks_like_sitemap_url(requested_url) else requested_url


def _looks_like_sitemap_url(raw_url: str) -> bool:
    parsed = urlsplit(raw_url)
    filename = parsed.path.rsplit("/", maxsplit=1)[-1].lower()
    return filename.endswith(".xml") and "sitemap" in filename


def _origin_from_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "/", "", ""))


def _sitemap_kind_and_locs(
    body_text: str,
) -> tuple[Literal["urlset", "sitemapindex", "unknown"], tuple[str, ...]]:
    try:
        root = ElementTree.fromstring(body_text.encode("utf-8"))
    except ElementTree.ParseError:
        return "unknown", ()

    kind = root.tag.rsplit("}", maxsplit=1)[-1]
    loc_urls = tuple(
        element.text.strip()
        for element in root.iter()
        if element.tag.rsplit("}", maxsplit=1)[-1] == "loc"
        and element.text
        and element.text.strip()
    )
    if kind == "urlset":
        return "urlset", loc_urls
    if kind == "sitemapindex":
        return "sitemapindex", loc_urls
    return "unknown", loc_urls


def _split_samples(kind: str, loc_urls: tuple[str, ...]) -> tuple[_LocSplit, _LocSplit]:
    visible = loc_urls[:10]
    if kind == "sitemapindex":
        return (
            _LocSplit(all_locs=(), visible_locs=()),
            _LocSplit(all_locs=loc_urls, visible_locs=visible),
        )
    if kind == "urlset":
        return (
            _LocSplit(all_locs=loc_urls, visible_locs=visible),
            _LocSplit(all_locs=(), visible_locs=()),
        )
    return (
        _LocSplit(all_locs=loc_urls, visible_locs=visible),
        _LocSplit(all_locs=(), visible_locs=()),
    )


def _truncate(value: str | None, limit: int = 500) -> str | None:
    if value is None:
        return None
    return value if len(value) <= limit else f"{value[: limit - 1]}…"


def _recommendation(
    *,
    available: bool,
    valid_xml: bool,
    kind: str,
    url_count: int,
    sitemap_count: int,
    contains_target: bool | None,
    fetch_error: str | None,
    parse_error: str | None,
) -> str:
    if not available and fetch_error:
        return (
            "Sitemap could not be fetched. Check DNS, hosting availability, firewall rules, "
            "or response size before relying on sitemap discovery."
        )
    if not available:
        return (
            "Sitemap is not available with a successful HTTP response. Publish a valid sitemap.xml "
            "or declare the correct Sitemap URL in robots.txt."
        )
    if not valid_xml:
        return (
            f"Sitemap was fetched but is not valid XML. Fix the XML syntax before submitting it "
            f"to search engines. Parse error: {_truncate(parse_error) or 'unknown'}."
        )
    if kind == "sitemapindex":
        return (
            f"Sitemap index is valid and references {sitemap_count} child sitemap files. "
            "Validate high-priority child sitemaps next, especially after migrations "
            "or template changes."
        )
    if kind != "urlset":
        return (
            "The XML is valid, but the root element is not a standard urlset or sitemapindex. "
            "Use the sitemap protocol format for predictable search engine processing."
        )
    if url_count == 0:
        return (
            "Sitemap is valid XML, but it does not list URLs. Add canonical URLs "
            "that should be discovered."
        )
    if contains_target is True:
        return (
            "Sitemap is valid and contains the tested URL. Keep it aligned with canonical URLs, "
            "robots rules, and redirects after releases."
        )
    if contains_target is False:
        return (
            "Sitemap is valid, but the tested URL was not found. Add the canonical URL if it is an "
            "important SEO landing page, or confirm it should stay out of sitemap discovery."
        )
    return (
        f"Sitemap is valid and lists {url_count} URLs. Review sample URLs for canonical host, "
        "protocol, trailing slash, and important commercial pages."
    )
