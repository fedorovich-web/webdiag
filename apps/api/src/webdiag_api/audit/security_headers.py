from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit


@dataclass(frozen=True, slots=True)
class SecurityHeaderFinding:
    header: str
    status: str
    value: str
    message: str


REQUIRED_HEADERS = (
    "strict-transport-security",
    "content-security-policy",
    "x-content-type-options",
)

RECOMMENDED_HEADERS = (
    "referrer-policy",
    "permissions-policy",
    "x-frame-options",
)

BASELINE_SECURITY_HEADERS = REQUIRED_HEADERS + RECOMMENDED_HEADERS


def evaluate_security_headers(
    headers: dict[str, str],
    *,
    final_url: str,
) -> tuple[SecurityHeaderFinding, ...]:
    normalized = {key.lower(): value.strip() for key, value in headers.items()}
    findings: list[SecurityHeaderFinding] = []
    is_https = urlsplit(final_url).scheme.lower() == "https"

    for header in BASELINE_SECURITY_HEADERS:
        value = normalized.get(header)
        if value is None:
            severity = "missing" if header in REQUIRED_HEADERS else "recommended_missing"
            if header == "strict-transport-security" and not is_https:
                severity = "not_applicable"
            findings.append(
                SecurityHeaderFinding(
                    header=header,
                    status=severity,
                    value="missing",
                    message=_missing_message(header, is_https=is_https),
                )
            )
            continue
        findings.append(_evaluate_present_header(header=header, value=value))

    return tuple(findings)


def _evaluate_present_header(*, header: str, value: str) -> SecurityHeaderFinding:
    lowered = value.lower()
    if header == "x-content-type-options" and lowered != "nosniff":
        return SecurityHeaderFinding(
            header=header,
            status="invalid",
            value=value,
            message="X-Content-Type-Options should be exactly nosniff.",
        )
    if header == "content-security-policy" and "default-src" not in lowered:
        return SecurityHeaderFinding(
            header=header,
            status="weak",
            value=value,
            message="Content-Security-Policy is present but lacks default-src.",
        )
    if header == "strict-transport-security" and "max-age=" not in lowered:
        return SecurityHeaderFinding(
            header=header,
            status="weak",
            value=value,
            message="Strict-Transport-Security is present but lacks max-age.",
        )
    return SecurityHeaderFinding(
        header=header,
        status="ok",
        value=value,
        message="Header is present.",
    )


def _missing_message(header: str, *, is_https: bool) -> str:
    if header == "strict-transport-security" and not is_https:
        return "HSTS is only applicable to HTTPS responses."
    return f"{header} is not present on the audited response."
