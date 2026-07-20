import gzip

import httpx
import pytest

from webdiag_api.audit import fetcher as fetcher_module
from webdiag_api.audit.fetcher import (
    ResponseBodyTooLargeError,
    SafeFetchConfig,
    SafeFetchError,
    SafeHttpFetcher,
    default_peer_address_provider,
)
from webdiag_api.security.url_policy import UrlPolicyError

SAFE_IP = "93.184.216.34"
OTHER_SAFE_IP = "93.184.216.35"


def public_resolver(hostname: str, port: int) -> list[str]:
    assert hostname
    assert port in {80, 443}
    return [SAFE_IP]


def verified_peer(_response: httpx.Response) -> list[str]:
    return [SAFE_IP]


def streaming_response(
    status_code: int,
    *,
    request: httpx.Request,
    headers: dict[str, str] | None = None,
    content: bytes = b"",
) -> httpx.Response:
    return httpx.Response(
        status_code,
        headers=headers,
        stream=httpx.ByteStream(content),
        request=request,
    )


class CountingStream(httpx.SyncByteStream):
    def __init__(self, chunks: list[bytes]) -> None:
        self.chunks = chunks
        self.yield_count = 0

    def __iter__(self):
        for chunk in self.chunks:
            self.yield_count += 1
            yield chunk


def test_safe_fetcher_disables_environment_proxy_inheritance(monkeypatch) -> None:
    captured: dict[str, object] = {}
    real_client = httpx.Client

    class CapturingClient(real_client):
        def __init__(self, *args, **kwargs) -> None:
            captured["trust_env"] = kwargs.get("trust_env")
            super().__init__(*args, **kwargs)

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(200, content=b"ok", request=request)

    monkeypatch.setattr(fetcher_module.httpx, "Client", CapturingClient)
    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    assert fetcher.fetch("https://example.com").body_text == "ok"
    assert captured["trust_env"] is False


def test_safe_fetcher_pins_resolved_ip_and_preserves_host_across_redirects() -> None:
    seen_requests: list[tuple[str, str | None, object]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_requests.append(
            (
                str(request.url),
                request.headers.get("host"),
                request.extensions.get("sni_hostname"),
            )
        )
        if request.url.path == "/old":
            return streaming_response(
                301,
                headers={"location": "/new"},
                request=request,
            )
        return streaming_response(
            200,
            headers={"content-type": "text/html; charset=utf-8"},
            content=b"<html><head><title>Example</title></head></html>",
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    result = fetcher.fetch("https://example.com/old")

    assert result.status_code == 200
    assert result.final_url == "https://example.com/new"
    assert result.content_type == "text/html; charset=utf-8"
    assert result.redirect_chain[0].status_code == 301
    assert result.redirect_chain[0].target_url == "https://example.com/new"
    assert seen_requests == [
        (f"https://{SAFE_IP}/old", "example.com", "example.com"),
        (f"https://{SAFE_IP}/new", "example.com", "example.com"),
    ]


def test_safe_fetcher_blocks_unsafe_redirect_target_before_request() -> None:
    requested_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested_urls.append(str(request.url))
        return streaming_response(
            302,
            headers={"location": "http://127.0.0.1/admin"},
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(UrlPolicyError):
        fetcher.fetch("https://example.com")

    assert requested_urls == [f"https://{SAFE_IP}"]


def test_safe_fetcher_enforces_redirect_limit() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            302,
            headers={"location": "/next"},
            request=request,
        )

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_redirects=1),
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(SafeFetchError, match="Redirect limit exceeded"):
        fetcher.fetch("https://example.com/start")


def test_safe_fetcher_rejects_declared_large_body_before_streaming() -> None:
    stream = CountingStream([b"not-read"])

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-length": "2048"},
            stream=stream,
            request=request,
        )

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=1024),
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(ResponseBodyTooLargeError, match="size limit"):
        fetcher.fetch("https://example.com")

    assert stream.yield_count == 0


def test_safe_fetcher_stops_streaming_unknown_length_body_at_hard_limit() -> None:
    stream = CountingStream([b"a" * 600, b"b" * 600, b"c" * 600])

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, stream=stream, request=request)

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=1024),
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(ResponseBodyTooLargeError, match="size limit"):
        fetcher.fetch("https://example.com")

    assert stream.yield_count == 2


def test_safe_fetcher_decodes_gzip_within_limit() -> None:
    compressed = gzip.compress(b"<html>ok</html>")

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            headers={"content-encoding": "gzip"},
            content=compressed,
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    assert fetcher.fetch("https://example.com").body_text == "<html>ok</html>"


def test_safe_fetcher_normalizes_invalid_gzip_as_fetch_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            headers={"content-encoding": "gzip"},
            content=b"not-gzip",
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(SafeFetchError, match="could not be decoded"):
        fetcher.fetch("https://example.com")


def test_safe_fetcher_rejects_decompression_bomb_at_decoded_limit() -> None:
    compressed = gzip.compress(b"a" * 4096)

    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            headers={"content-encoding": "gzip"},
            content=compressed,
            request=request,
        )

    fetcher = SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=1024),
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(ResponseBodyTooLargeError, match="Decoded HTTP response body"):
        fetcher.fetch("https://example.com")


def test_safe_fetcher_rejects_unsupported_encoding_before_body_read() -> None:
    stream = CountingStream([b"not-read"])

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            headers={"content-encoding": "br"},
            stream=stream,
            request=request,
        )

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(SafeFetchError, match="Unsupported HTTP content encoding"):
        fetcher.fetch("https://example.com")

    assert stream.yield_count == 0


def test_safe_fetcher_rejects_connected_peer_that_differs_from_pinned_ip() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(200, content=b"ok", request=request)

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=lambda _response: [OTHER_SAFE_IP],
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(UrlPolicyError, match="does not match the pinned target"):
        fetcher.fetch("https://example.com")


def test_safe_fetcher_rejects_private_connected_peer() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(200, content=b"ok", request=request)

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=lambda _response: ["127.0.0.1"],
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(UrlPolicyError, match="Resolved address is not allowed"):
        fetcher.fetch("https://example.com")


def test_default_peer_address_provider_fails_closed_without_network_stream() -> None:
    with pytest.raises(SafeFetchError, match="could not be verified"):
        default_peer_address_provider(httpx.Response(200))


def test_default_peer_address_provider_reads_httpx_network_stream() -> None:
    class FakeNetworkStream:
        def get_extra_info(self, key: str):
            assert key == "server_addr"
            return (SAFE_IP, 443)

    response = httpx.Response(
        200,
        extensions={"network_stream": FakeNetworkStream()},
    )

    assert default_peer_address_provider(response) == [SAFE_IP]


def test_safe_fetcher_converts_httpx_timeout_to_fetch_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("boom", request=request)

    fetcher = SafeHttpFetcher(
        resolver=public_resolver,
        peer_address_provider=verified_peer,
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(SafeFetchError, match="timed out"):
        fetcher.fetch("https://example.com")
