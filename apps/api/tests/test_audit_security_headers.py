from webdiag_api.audit.security_headers import evaluate_security_headers


def test_evaluate_security_headers_marks_complete_https_policy_ok() -> None:
    findings = evaluate_security_headers(
        {
            "strict-transport-security": "max-age=31536000",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "referrer-policy": "strict-origin-when-cross-origin",
            "permissions-policy": "geolocation=()",
            "x-frame-options": "DENY",
        },
        final_url="https://example.com/",
    )

    assert {finding.status for finding in findings} == {"ok"}


def test_evaluate_security_headers_detects_invalid_and_missing_headers() -> None:
    findings = evaluate_security_headers(
        {"x-content-type-options": "sniff"},
        final_url="https://example.com/",
    )
    statuses = {finding.header: finding.status for finding in findings}

    assert statuses["x-content-type-options"] == "invalid"
    assert statuses["strict-transport-security"] == "missing"
    assert statuses["content-security-policy"] == "missing"
    assert statuses["referrer-policy"] == "recommended_missing"
