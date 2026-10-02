from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any
from urllib.parse import urlsplit, urlunsplit

from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    AuditJob,
    AuditRun,
    AuditTarget,
    Evidence,
)

if TYPE_CHECKING:
    from webdiag_api.audit.service import AuditSnapshot

_ABSOLUTE_HTTP_URL = re.compile(r"https?://[^\s<>\"']+", re.IGNORECASE)
_CANONICAL_SOURCE = 'link[rel="canonical"]'


def public_url(raw_url: str) -> str:
    """Return an HTTP URL without credential-bearing components."""
    value = raw_url.strip()
    try:
        parsed = urlsplit(value)
    except ValueError:
        return value
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        return value
    authority = parsed.netloc.rsplit("@", maxsplit=1)[-1]
    return urlunsplit((parsed.scheme.lower(), authority, parsed.path, "", ""))


def _public_url_reference(raw_url: str) -> str:
    value = raw_url.strip()
    absolute = public_url(value)
    if absolute != value:
        return absolute
    try:
        parsed = urlsplit(value)
    except ValueError:
        return value
    if parsed.path and (parsed.query or parsed.fragment):
        return urlunsplit(("", "", parsed.path, "", ""))
    return value


def _public_urls_in_text(value: str) -> str:
    return _ABSOLUTE_HTTP_URL.sub(lambda match: public_url(match.group(0)), value)


def _public_metadata(value: Any, *, key: str = "") -> Any:
    if isinstance(value, dict):
        return {
            item_key: _public_metadata(item, key=str(item_key))
            for item_key, item in value.items()
        }
    if isinstance(value, list):
        return [_public_metadata(item, key=key) for item in value]
    if isinstance(value, tuple):
        return tuple(_public_metadata(item, key=key) for item in value)
    if isinstance(value, str):
        if "url" in key.lower():
            return _public_url_reference(value)
        return _public_urls_in_text(value)
    return value


def _public_evidence(evidence: Evidence) -> Evidence:
    value = _public_urls_in_text(evidence.value)
    if evidence.source == _CANONICAL_SOURCE:
        value = _public_url_reference(value)
    return evidence.model_copy(
        update={
            "source": _public_urls_in_text(evidence.source),
            "value": value,
            "excerpt": (
                _public_urls_in_text(evidence.excerpt) if evidence.excerpt is not None else None
            ),
            "metadata": _public_metadata(evidence.metadata),
        }
    )


def public_audit_target(target: AuditTarget) -> AuditTarget:
    safe_url = public_url(str(target.normalized_url))
    return AuditTarget.model_validate(
        {
            **target.model_dump(),
            "original_url": safe_url,
            "normalized_url": safe_url,
        }
    )


def _public_affected_url(affected: AffectedUrl) -> AffectedUrl:
    safe_url = public_url(str(affected.url))
    return AffectedUrl.model_validate(
        {
            **affected.model_dump(),
            "url": safe_url,
            "normalized_url": public_url(affected.normalized_url),
            "final_url": public_url(str(affected.final_url)) if affected.final_url else None,
        }
    )


def _public_issue(issue: AuditIssue) -> AuditIssue:
    return issue.model_copy(
        update={
            "affected_urls": tuple(_public_affected_url(item) for item in issue.affected_urls),
            "evidence": tuple(_public_evidence(item) for item in issue.evidence),
        }
    )


def _public_check(check: AuditCheck) -> AuditCheck:
    return check.model_copy(
        update={"evidence": tuple(_public_evidence(item) for item in check.evidence)}
    )


def public_audit_job(job: AuditJob) -> AuditJob:
    return job.model_copy(update={"target": public_audit_target(job.target)})


def public_audit_run(run: AuditRun) -> AuditRun:
    return run.model_copy(
        update={
            "target": public_audit_target(run.target),
            "checks": tuple(_public_check(check) for check in run.checks),
            "issues": tuple(_public_issue(issue) for issue in run.issues),
        }
    )


def public_audit_snapshot(snapshot: AuditSnapshot) -> AuditSnapshot:
    from webdiag_api.audit.service import AuditSnapshot

    return AuditSnapshot(
        job=public_audit_job(snapshot.job),
        run=public_audit_run(snapshot.run) if snapshot.run else None,
    )
