import pytest

from webdiag_api.security.url_policy import (
    UrlPolicyError,
    validate_resolved_addresses,
    validate_url,
)


@pytest.mark.parametrize("value", [
    "file:///etc/passwd",
    "http://localhost",
    "http://127.0.0.1",
    "http://[::1]",
    "http://169.254.169.254/latest/meta-data",
    "https://example.com:8443",
    "https://user:secret@example.com",
])
def test_blocked_urls(value: str) -> None:
    with pytest.raises(UrlPolicyError):
        validate_url(value)

def test_public_https_url() -> None:
    result = validate_url("https://example.com/path?q=1")
    assert result.hostname == "example.com"
    assert result.port == 443


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("https://Example.COM:443", "https://example.com"),
        ("http://Example.COM:80", "http://example.com"),
    ],
)
def test_normalizes_default_port_and_dns_hostname(value: str, expected: str) -> None:
    assert validate_url(value).normalized == expected


def test_normalizes_unicode_and_punycode_dns_hostnames_to_same_ascii_origin() -> None:
    unicode_url = validate_url("https://b\u00fccher.example")
    punycode_url = validate_url("https://xn--bcher-kva.example")

    assert unicode_url.normalized == "https://xn--bcher-kva.example"
    assert unicode_url.normalized == punycode_url.normalized


def test_rejects_hostname_that_cannot_be_encoded_as_idna() -> None:
    with pytest.raises(UrlPolicyError):
        validate_url("https://\ud800.example")


def test_normalizes_public_ipv6_authority_with_brackets() -> None:
    result = validate_url("https://[2606:4700:4700::1111]/dns-query")

    assert result.hostname == "2606:4700:4700::1111"
    assert result.normalized == "https://[2606:4700:4700::1111]/dns-query"


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("http://example.com:443", "http://example.com:443"),
        ("https://example.com:80", "https://example.com:80"),
    ],
)
def test_retains_permitted_non_default_ports(value: str, expected: str) -> None:
    assert validate_url(value).normalized == expected


def test_resolved_private_address_is_blocked() -> None:
    with pytest.raises(UrlPolicyError):
        validate_resolved_addresses(["10.0.0.1"])

def test_resolved_public_address_is_allowed() -> None:
    validate_resolved_addresses(["93.184.216.34"])
