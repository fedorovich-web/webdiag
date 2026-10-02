from __future__ import annotations

from datetime import UTC, datetime

from webdiag_api.accounts.audit_presentation import (
    localize_report_snapshot,
    localize_saved_audit_payload,
)
from webdiag_api.accounts.report_artifact import render_report_html
from webdiag_api.accounts.report_models import ReportSnapshot
from webdiag_api.accounts.workspace_models import (
    SavedAuditCheck,
    SavedAuditIssue,
    SavedAuditPayload,
    SavedAuditRecommendation,
)
from webdiag_api.audit import CHECK_DEFINITIONS, ISSUE_DEFINITIONS

_NOW = datetime(2026, 8, 16, 12, 0, tzinfo=UTC)


def _payload() -> SavedAuditPayload:
    return SavedAuditPayload(
        target_origin="https://example.test",
        status="succeeded",
        score=82,
        checks=tuple(
            SavedAuditCheck(
                check_id=definition.check_id,
                name=definition.name,
                category=definition.category.value,
                status="passed",
            )
            for definition in CHECK_DEFINITIONS
        ),
        issues=tuple(
            SavedAuditIssue(
                issue_id=definition.issue_id,
                check_id=definition.check_id,
                category=definition.category.value,
                severity=definition.severity.value,
                priority=definition.priority.value,
                title=definition.title,
                description=definition.summary,
                affected_urls=("https://example.test/path",),
                recommendation=SavedAuditRecommendation(
                    summary="Resolve the verified issue.",
                    steps=("Apply the verified correction.",),
                    expected_impact="Removes the verified problem.",
                ),
            )
            for definition in ISSUE_DEFINITIONS
        ),
        completed_at=_NOW,
    )


def test_ru_presentation_covers_every_known_check_and_issue_without_mutating_evidence() -> None:
    payload = _payload()
    stored_json = payload.model_dump_json()

    localized = localize_saved_audit_payload(payload, "ru")

    assert payload.model_dump_json() == stored_json
    assert localized is not payload
    assert [check.check_id for check in localized.checks] == [
        definition.check_id for definition in CHECK_DEFINITIONS
    ]
    assert all(
        check.name != definition.name
        for check, definition in zip(localized.checks, CHECK_DEFINITIONS, strict=True)
    )
    assert [issue.issue_id for issue in localized.issues] == [
        definition.issue_id for definition in ISSUE_DEFINITIONS
    ]
    assert all(
        issue.title != definition.title
        and issue.description != definition.summary
        and issue.recommendation.summary != "Resolve the verified issue."
        and issue.recommendation.steps
        and issue.recommendation.expected_impact
        for issue, definition in zip(localized.issues, ISSUE_DEFINITIONS, strict=True)
    )
    assert localized.checks[0].status == "passed"
    assert localized.issues[0].severity == "critical"


def test_en_presentation_preserves_canonical_evidence_copy() -> None:
    payload = _payload()

    localized = localize_saved_audit_payload(payload, "en")

    assert localized == payload
    assert localized is not payload


def test_unknown_identifiers_fall_back_to_stored_safe_text() -> None:
    payload = SavedAuditPayload(
        target_origin="https://example.test",
        status="succeeded",
        score=None,
        checks=(
            SavedAuditCheck(
                check_id="legacy.check",
                name="Legacy check name",
                category="legacy",
                status="skipped",
            ),
        ),
        issues=(
            SavedAuditIssue(
                issue_id="legacy.issue",
                check_id="legacy.check",
                category="legacy",
                severity="info",
                priority="p3",
                title="Legacy issue title",
                description="Legacy issue description",
                affected_urls=(),
                recommendation=SavedAuditRecommendation(
                    summary="Legacy recommendation",
                    steps=("Legacy step",),
                    expected_impact=None,
                ),
            ),
        ),
        completed_at=_NOW,
    )

    assert localize_saved_audit_payload(payload, "ru") == payload


def test_report_presentation_uses_snapshot_locale_without_changing_snapshot() -> None:
    payload = _payload()
    snapshot = ReportSnapshot(
        title="Клиентский отчёт",
        locale="ru",
        project_name="Example",
        target_origin=payload.target_origin,
        audit_completed_at=payload.completed_at,
        score=payload.score,
        checks=payload.checks,
        issues=payload.issues,
        generated_at=_NOW,
    )
    stored_json = snapshot.model_dump_json()

    localized = localize_report_snapshot(snapshot)

    assert snapshot.model_dump_json() == stored_json
    assert localized.locale == "ru"
    assert localized.checks[0].name != snapshot.checks[0].name
    assert localized.issues[0].title != snapshot.issues[0].title


def test_ru_html_localizes_machine_check_labels_without_changing_contract_values() -> None:
    payload = _payload()
    snapshot = ReportSnapshot(
        title="Клиентский отчёт",
        locale="ru",
        project_name="Example",
        target_origin=payload.target_origin,
        audit_completed_at=payload.completed_at,
        score=payload.score,
        checks=payload.checks,
        issues=payload.issues,
        generated_at=_NOW,
    )

    html = render_report_html(localize_report_snapshot(snapshot)).decode("utf-8")

    assert ">Пройдено<" in html
    assert ">HTTP<" in html
    assert ">passed<" not in html
    assert snapshot.checks[0].status == "passed"
    assert snapshot.checks[0].category == "http"
