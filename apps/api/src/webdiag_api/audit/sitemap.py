from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit
from xml.etree import ElementTree

from webdiag_api.audit.html_resources import bounded_text


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
        kind = root.tag.rsplit("}", maxsplit=1)[-1]
        if kind not in {"urlset", "sitemapindex"}:
            raise ValueError("Sitemap root must be urlset or sitemapindex.")
    except (ElementTree.ParseError, ValueError) as exc:
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

    loc_urls: list[str] = []
    normalized_locs: list[str] = []
    invalid_location_count = 0
    first_location_error: str | None = None
    for loc in _iter_loc_text(root):
        if not loc:
            continue
        try:
            normalized = _normalize_sitemap_location(loc)
        except ValueError as exc:
            invalid_location_count += 1
            if first_location_error is None:
                first_location_error = bounded_text(str(exc), 300)
            continue
        loc_urls.append(loc)
        normalized_locs.append(normalized)

    normalized_target = _normalize_url_for_comparison(target_url)
    target_found = normalized_target in normalized_locs
    return SitemapXmlSummary(
        sitemap_url=sitemap_url,
        status_code=status_code,
        available=True,
        valid_xml=invalid_location_count == 0,
        url_count=len(loc_urls),
        loc_urls=tuple(loc_urls),
        contains_target=target_found if target_found or not invalid_location_count else None,
        parse_error=(
            f"Skipped {invalid_location_count} invalid sitemap location(s). {first_location_error}"
            if invalid_location_count else None
        ),
    )


def _iter_loc_text(root: ElementTree.Element) -> list[str]:
    values: list[str] = []
    for element in root.iter():
        if element.tag.rsplit("}", maxsplit=1)[-1] == "loc" and element.text:
            values.append(element.text.strip())
    return values


def _normalize_sitemap_location(raw_url: str) -> str:
    if len(raw_url) > 2_048:
        raise ValueError("Sitemap location exceeds the supported URL length.")
    parsed = urlsplit(raw_url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Sitemap location must be an absolute HTTP or HTTPS URL.")
    # Accessing port validates malformed/non-numeric and out-of-range values.
    if parsed.port is not None and parsed.port == 0:
        raise ValueError("Sitemap location port is invalid.")
    return _normalize_url_for_comparison(raw_url)


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
