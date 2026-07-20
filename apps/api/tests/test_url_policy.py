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

def test_resolved_private_address_is_blocked() -> None:
    with pytest.raises(UrlPolicyError):
        validate_resolved_addresses(["10.0.0.1"])

def test_resolved_public_address_is_allowed() -> None:
    validate_resolved_addresses(["93.184.216.34"])
