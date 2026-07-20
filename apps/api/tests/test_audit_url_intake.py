import pytest

from webdiag_api.audit import AuditTargetScope, build_audit_target
from webdiag_api.security.url_policy import UrlPolicyError


def test_build_audit_target_normalizes_public_url() -> None:
    target = build_audit_target(" HTTPS://Example.COM/path?q=1 ")

    assert target.original_url == " HTTPS://Example.COM/path?q=1 "
    assert str(target.normalized_url) == "https://example.com/path?q=1"
    assert target.hostname == "example.com"
    assert target.scope is AuditTargetScope.SINGLE_URL


def test_build_audit_target_reuses_ssrf_resolved_address_guard() -> None:
    with pytest.raises(UrlPolicyError):
        build_audit_target("https://example.com", resolved_addresses=["10.0.0.1"])


def test_build_audit_target_accepts_sitemap_scope_after_url_validation() -> None:
    target = build_audit_target(
        "https://example.com/sitemap.xml",
        scope=AuditTargetScope.SITEMAP,
        resolved_addresses=["93.184.216.34"],
    )

    assert target.scope is AuditTargetScope.SITEMAP
    assert str(target.normalized_url) == "https://example.com/sitemap.xml"


def test_build_audit_target_blocks_non_http_schemes() -> None:
    with pytest.raises(UrlPolicyError):
        build_audit_target("file:///etc/passwd")
