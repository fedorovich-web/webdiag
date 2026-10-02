import hashlib
import sqlite3
from uuid import UUID

from webdiag_api.audit.models import (
    AffectedUrl,
    AuditCheck,
    AuditIssue,
    AuditJob,
    AuditJobStatus,
    AuditRun,
    AuditTarget,
    CheckStatus,
    Evidence,
    EvidenceKind,
    IssueCategory,
    Priority,
    Recommendation,
    Severity,
)
from webdiag_api.audit.redaction import public_audit_snapshot
from webdiag_api.audit.service import AuditSnapshot
from webdiag_api.audit.storage import SqliteAuditStore


def test_public_snapshot_removes_sensitive_url_components_from_typed_fields() -> None:
    target = AuditTarget(
        original_url="https://example.com/page?token=secret#private",
        normalized_url="https://example.com/page?token=secret#private",
        hostname="example.com",
    )
    redirect = Evidence(
        kind=EvidenceKind.REDIRECT_HOP,
        source="https://example.com/start?source=private",
        value="301 -> https://example.com/page?token=secret#private",
        metadata={"nested": ["https://example.com/asset?signature=private", "ordinary"]},
    )
    issue = AuditIssue(
        issue_id="redirects.chain.too_long",
        check_id="redirects.chain",
        category=IssueCategory.REDIRECTS,
        severity=Severity.MEDIUM,
        priority=Priority.P2,
        title="Redirect chain is too long",
        description="The URL redirects too many times.",
        affected_urls=(
            AffectedUrl(
                url="https://example.com/page?token=secret#private",
                normalized_url="https://example.com/page?token=secret#private",
                final_url="https://example.com/final?session=private#fragment",
            ),
        ),
        evidence=(redirect,),
        recommendation=Recommendation(summary="Collapse the redirect chain."),
    )
    job = AuditJob(job_id=UUID(int=1), target=target, status=AuditJobStatus.SUCCEEDED)
    run = AuditRun(
        run_id=UUID(int=2),
        job_id=job.job_id,
        target=target,
        status=AuditJobStatus.SUCCEEDED,
        checks=(
            AuditCheck(
                check_id="redirects.chain",
                name="Redirect chain",
                category=IssueCategory.REDIRECTS,
                status=CheckStatus.WARNING,
                evidence=(redirect,),
            ),
        ),
        issues=(issue,),
    )

    public = public_audit_snapshot(AuditSnapshot(job=job, run=run))
    serialized = public.job.model_dump_json() + public.run.model_dump_json()

    for forbidden in (
        "token=secret",
        "source=private",
        "signature=private",
        "session=private",
        "#private",
    ):
        assert forbidden not in serialized
    assert str(public.job.target.normalized_url) == "https://example.com/page"
    assert public.run.checks[0].evidence[0].value == "301 -> https://example.com/page"
    assert public.run.checks[0].evidence[0].metadata["nested"] == [
        "https://example.com/asset",
        "ordinary",
    ]


def test_store_read_projection_protects_legacy_snapshot(tmp_path) -> None:
    target = AuditTarget(
        original_url="https://example.com/page?legacy_token=secret",
        normalized_url="https://example.com/page?legacy_token=secret",
        hostname="example.com",
    )
    job = AuditJob(job_id=UUID(int=3), target=target, status=AuditJobStatus.SUCCEEDED)
    run = AuditRun(
        run_id=UUID(int=4),
        job_id=job.job_id,
        target=target,
        status=AuditJobStatus.SUCCEEDED,
    )
    store = SqliteAuditStore(str(tmp_path / "audits.sqlite3"))
    store.ensure_schema()
    job_payload = job.model_dump_json()
    run_payload = run.model_dump_json()
    with sqlite3.connect(tmp_path / "audits.sqlite3") as connection:
        connection.execute(
            "INSERT INTO audit_jobs(job_id, created_at, payload_json, payload_sha256) "
            "VALUES (?, ?, ?, ?)",
            (
                str(job.job_id),
                job.created_at.isoformat(),
                job_payload,
                hashlib.sha256(job_payload.encode()).hexdigest(),
            ),
        )
        connection.execute(
            "INSERT INTO audit_runs(run_id, job_id, payload_json, payload_sha256) "
            "VALUES (?, ?, ?, ?)",
            (
                str(run.run_id),
                str(run.job_id),
                run_payload,
                hashlib.sha256(run_payload.encode()).hexdigest(),
            ),
        )

    restored = store.get_snapshot(job.job_id)

    assert restored is not None
    assert "legacy_token=secret" not in restored.job.model_dump_json()
    assert restored.run is not None
    assert "legacy_token=secret" not in restored.run.model_dump_json()


def test_store_write_boundary_redacts_raw_models(tmp_path) -> None:
    target = AuditTarget(
        original_url="https://example.com/page?write_token=secret",
        normalized_url="https://example.com/page?write_token=secret",
        hostname="example.com",
    )
    job = AuditJob(job_id=UUID(int=5), target=target, status=AuditJobStatus.SUCCEEDED)
    run = AuditRun(
        run_id=UUID(int=6),
        job_id=job.job_id,
        target=target,
        status=AuditJobStatus.SUCCEEDED,
    )
    database = tmp_path / "audits.sqlite3"
    store = SqliteAuditStore(str(database))

    store.save_snapshot(job, run)

    with sqlite3.connect(database) as connection:
        payloads = connection.execute(
            "SELECT payload_json FROM audit_jobs UNION ALL SELECT payload_json FROM audit_runs"
        ).fetchall()
    assert all("write_token=secret" not in payload for (payload,) in payloads)
