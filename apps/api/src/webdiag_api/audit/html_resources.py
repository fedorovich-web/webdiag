from __future__ import annotations

from urllib.parse import urljoin, urlsplit

from webdiag_api.audit.html_metadata import HtmlMetadata
from webdiag_api.security.url_policy import canonicalize_hostname

ASCII_WHITESPACE = "\t\n\f\r "


def bounded_text(value: str, limit: int) -> str:
    if len(value) <= limit:
        return value
    marker = "… [truncated]"
    return value[: limit - len(marker)] + marker


def bounded_optional_text(value: str | None, limit: int) -> str | None:
    return bounded_text(value, limit) if value is not None else None


def resolve_html_reference(value: str, base_url: str) -> str:
    stripped = value.strip()
    try:
        return urljoin(base_url, stripped)
    except ValueError:
        return stripped


def resolve_http_reference(value: str | None, base_url: str) -> str | None:
    if value is None or len(value) > 2048:
        return None
    try:
        resolved = urljoin(base_url, value.strip())
        parsed = urlsplit(resolved)
        port = parsed.port
        if (
            len(resolved) > 2048
            or parsed.scheme not in {"http", "https"}
            or not parsed.hostname
            or any(character.isspace() for character in parsed.netloc)
            or parsed.username is not None
            or parsed.password is not None
            or port == 0
        ):
            return None
        hostname = parsed.hostname
        canonical_hostname, _address = canonicalize_hostname(hostname.rstrip("."))
        if (
            len(hostname) > 253
            or len(resolved) + len(canonical_hostname) - len(hostname) > 2_048
        ):
            return None
    except ValueError:
        return None
    return resolved


def document_base_url(metadata: HtmlMetadata, final_url: str) -> str:
    return resolve_http_reference(metadata.base_href, final_url) or final_url


def srcset_urls(value: str | None) -> list[str]:
    if not value:
        return []
    urls: list[str] = []
    position = 0
    while position < len(value):
        while position < len(value) and value[position] in ASCII_WHITESPACE + ",":
            position += 1
        start = position
        while position < len(value) and value[position] not in ASCII_WHITESPACE:
            position += 1
        url = value[start:position]
        if not url:
            break
        if url.endswith(","):
            urls.append(url.rstrip(","))
            continue
        urls.append(url)
        in_parentheses = False
        while position < len(value):
            character = value[position]
            position += 1
            if character == "(" and not in_parentheses:
                in_parentheses = True
            elif character == ")":
                in_parentheses = False
            elif character == "," and not in_parentheses:
                break
    return urls
