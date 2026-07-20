from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit
from xml.etree import ElementTree


@dataclass(frozen=True, slots=True)
class SitemapXmlSummary:
    sitemap_url: str
    status_code: int | None
    available: bool
    valid_xml: bool
    url_count: int
    loc_urls: tuple[str, ...]
    contains_target: bool | None
    fetch_error: str | None = None
    parse_error: str | None = None


def parse_sitemap_xml(
    body_text: str,
    *,
    sitemap_url: str,
    target_url: str,
    status_code: int | None,
    fetch_error: str | None = None,
) -> SitemapXmlSummary:
    available = status_code is not None and 200 <= status_code < 300
    if not available:
        return SitemapXmlSummary(
            sitemap_url=sitemap_url,
            status_code=status_code,
            available=False,
            valid_xml=False,
            url_count=0,
            loc_urls=(),
            contains_target=None,
            fetch_error=fetch_error,
        )

    try:
        root = ElementTree.fromstring(body_text.encode("utf-8"))
    except ElementTree.ParseError as exc:
        return SitemapXmlSummary(
            sitemap_url=sitemap_url,
            status_code=status_code,
            available=True,
            valid_xml=False,
            url_count=0,
            loc_urls=(),
            contains_target=False,
            parse_error=str(exc),
        )

    loc_urls = tuple(_loc_text for _loc_text in _iter_loc_text(root) if _loc_text)
    normalized_target = _normalize_url_for_comparison(target_url)
    return SitemapXmlSummary(
        sitemap_url=sitemap_url,
        status_code=status_code,
        available=True,
        valid_xml=True,
        url_count=len(loc_urls),
        loc_urls=loc_urls,
        contains_target=any(
            _normalize_url_for_comparison(loc_url) == normalized_target for loc_url in loc_urls
        ),
    )


def _iter_loc_text(root: ElementTree.Element) -> list[str]:
    values: list[str] = []
    for element in root.iter():
        if element.tag.rsplit("}", maxsplit=1)[-1] == "loc" and element.text:
            values.append(element.text.strip())
    return values


def _normalize_url_for_comparison(raw_url: str) -> str:
    parsed = urlsplit(raw_url.strip())
    scheme = parsed.scheme.lower()
    hostname = parsed.hostname.lower() if parsed.hostname else ""
    if not scheme or not hostname:
        return raw_url.strip().rstrip("/")

    port = parsed.port
    default_port = (scheme == "http" and port == 80) or (scheme == "https" and port == 443)
    authority = hostname
    if port is not None and not default_port:
        authority = f"{hostname}:{port}"

    path = parsed.path.rstrip("/") or "/"
    if path == "/":
        path = ""
    return urlunsplit((scheme, authority, path, parsed.query, ""))
