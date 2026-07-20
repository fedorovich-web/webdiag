from __future__ import annotations

from webdiag_api.audit.models import AuditTarget, AuditTargetScope
from webdiag_api.security.url_policy import validate_resolved_addresses, validate_url


def build_audit_target(
    raw_url: str,
    *,
    scope: AuditTargetScope = AuditTargetScope.SINGLE_URL,
    resolved_addresses: list[str] | None = None,
) -> AuditTarget:
    """Normalize and validate a user-supplied audit target.

    DNS resolution is intentionally injected by the caller. This keeps the domain model
    deterministic and lets the future HTTP fetcher apply the same SSRF guard after each
    redirect and before every network request.
    """
    validated = validate_url(raw_url)
    if resolved_addresses is not None:
        validate_resolved_addresses(resolved_addresses)
    return AuditTarget(
        original_url=raw_url,
        normalized_url=validated.normalized,
        hostname=validated.hostname,
        scope=scope,
    )
