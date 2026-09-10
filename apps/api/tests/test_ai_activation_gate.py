import json
from pathlib import Path

import pytest

from webdiag_api.ai import cli
from webdiag_api.ai.activation import (
    ACTIVATION_APPROVAL_CONTRACT,
    SELECTED_TEXT_AI_TOOL_IDS,
    ActivationGateError,
    ActivationGateIncompleteError,
    ActivationGateReport,
    build_activation_gate_report,
    load_activation_approval,
)
from webdiag_api.ai.evaluation import ProviderEvaluationReport

TOOL_ID = "ai_content_brief"


def _report(**overrides: object) -> ProviderEvaluationReport:
    values: dict[str, object] = {
        "tool_id": TOOL_ID,
        "tool_contract_version": "v1",
        "model_policy": "openai/gpt-5.6-luna",
        "sample_limit": 100,
        "sampled_runs": 12,
        "ru_runs": 6,
        "en_runs": 6,
        "input_units_total": 1_200,
        "output_units_total": 600,
        "minimum_nano_usd": 1_000,
        "maximum_nano_usd": 8_000,
        "p95_nano_usd": 7_000,
        "total_nano_usd": 42_000,
        "evidence_sha256": "a" * 64,
        "manual_output_review_required": False,
    }
    values.update(overrides)
    return ProviderEvaluationReport(**values)


def _approval(**overrides: object) -> dict[str, object]:
    values: dict[str, object] = {
        "contract_version": ACTIVATION_APPROVAL_CONTRACT,
        "tool_id": TOOL_ID,
        "evidence_sha256": "a" * 64,
        "approved_credit_price": 7,
        "maximum_provider_cost_nano_usd": 10_000,
        "semantic_review": "passed",
        "provider_smoke": "passed",
        "safety_review": "passed",
        "production_preflight": "passed",
    }
    values.update(overrides)
    return values


class _Store:
    def provider_evaluation_report(self, **_kwargs: object) -> ProviderEvaluationReport:
        return _report()


def test_activation_gate_accepts_complete_text_tool_approval() -> None:
    result = build_activation_gate_report(
        _Store(),
        tool_id=TOOL_ID,
        approval=_approval(),
        report=_report(),
    )

    assert result.tool_id == TOOL_ID
    assert result.evidence_sha256 == "a" * 64
    assert result.sampled_runs == 12
    assert result.approved_credit_price == 7
    assert result.observed_maximum_provider_cost_nano_usd == 8_000


@pytest.mark.parametrize(
    ("field", "value"),
    (
        ("semantic_review", "pending"),
        ("provider_smoke", "failed"),
        ("safety_review", "pending"),
        ("production_preflight", "failed"),
    ),
)
def test_activation_gate_rejects_unpassed_required_approval(
    field: str,
    value: str,
) -> None:
    with pytest.raises(ActivationGateIncompleteError, match="activation gate"):
        build_activation_gate_report(
            _Store(),
            tool_id=TOOL_ID,
            approval=_approval(**{field: value}),
            report=_report(),
        )


@pytest.mark.parametrize(
    ("field", "value", "error_type"),
    (
        ("tool_id", "ai_image_studio", ActivationGateError),
        ("evidence_sha256", "b" * 64, ActivationGateError),
        ("approved_credit_price", 0, ActivationGateError),
        ("approved_credit_price", True, ActivationGateError),
        ("maximum_provider_cost_nano_usd", 7_000, ActivationGateIncompleteError),
        ("contract_version", "v2", ActivationGateError),
    ),
)
def test_activation_gate_rejects_invalid_or_mismatched_approval(
    field: str,
    value: object,
    error_type: type[ActivationGateError],
) -> None:
    with pytest.raises(error_type, match="activation gate"):
        build_activation_gate_report(
            _Store(),
            tool_id=TOOL_ID,
            approval=_approval(**{field: value}),
            report=_report(),
        )


def test_activation_gate_rejects_insufficient_or_unbalanced_evidence() -> None:
    with pytest.raises(ActivationGateIncompleteError, match="activation gate"):
        build_activation_gate_report(
            _Store(),
            tool_id=TOOL_ID,
            approval=_approval(),
            minimum_samples=20,
            report=_report(),
        )

    with pytest.raises(ActivationGateIncompleteError, match="activation gate"):
        build_activation_gate_report(
            _Store(),
            tool_id=TOOL_ID,
            approval=_approval(),
            report=_report(en_runs=0),
        )


def test_selected_text_tool_allowlist_excludes_binary_and_unplanned_tools() -> None:
    assert frozenset(
        {
            "ai_audit_action_plan",
            "ai_competitor_gap_report",
            "ai_content_brief",
            "ai_content_optimizer",
            "ai_internal_linking_planner",
            "ai_search_intent_page_fit",
        }
    ) == SELECTED_TEXT_AI_TOOL_IDS


def test_load_activation_approval_is_bounded_and_strict(tmp_path: Path) -> None:
    path = tmp_path / "approval.json"
    path.write_text(json.dumps(_approval()), encoding="utf-8")

    approval = load_activation_approval(path)
    assert approval["tool_id"] == TOOL_ID

    path.write_text(json.dumps({**_approval(), "unexpected": True}), encoding="utf-8")
    with pytest.raises(ActivationGateError, match="activation gate"):
        load_activation_approval(path)

    oversized = tmp_path / "oversized.json"
    oversized.write_bytes(b"{" + b" " * 70_000)
    with pytest.raises(ActivationGateError, match="activation gate"):
        load_activation_approval(oversized)

    linked = tmp_path / "linked.json"
    try:
        linked.symlink_to(path)
    except OSError:
        pytest.skip("file symlinks are unavailable")
    with pytest.raises(ActivationGateError, match="activation gate"):
        load_activation_approval(linked)


def test_activation_gate_uses_supplied_report_without_querying_store() -> None:
    class ExplodingStore:
        def provider_evaluation_report(self, **_kwargs: object) -> ProviderEvaluationReport:
            raise AssertionError("supplied report must be used")

    result = build_activation_gate_report(
        ExplodingStore(),
        tool_id=TOOL_ID,
        approval=_approval(),
        report=_report(),
    )

    assert result.evidence_sha256 == "a" * 64


def test_activation_gate_builds_report_from_verified_store_when_needed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls: list[tuple[object, str, int]] = []

    def fake_report(store: object, *, tool_id: str, sample_limit: int) -> ProviderEvaluationReport:
        calls.append((store, tool_id, sample_limit))
        return _report()

    monkeypatch.setattr(
        "webdiag_api.ai.activation.build_provider_evaluation_report",
        fake_report,
    )
    store = _Store()

    result = build_activation_gate_report(
        store,
        tool_id=TOOL_ID,
        approval=_approval(),
        sample_limit=42,
    )

    assert result.sampled_runs == 12
    assert calls == [(store, TOOL_ID, 42)]


def test_activation_cli_emits_only_redacted_aggregate(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(cli, "verify_bundle", lambda _path: None)
    monkeypatch.setattr(cli, "load_activation_approval", lambda _path: _approval())
    monkeypatch.setattr(cli, "SqliteAIStore", lambda _path: object())
    monkeypatch.setattr(
        cli,
        "build_activation_gate_report",
        lambda *_args, **_kwargs: ActivationGateReport(
            tool_id=TOOL_ID,
            evidence_sha256="a" * 64,
            sampled_runs=12,
            ru_runs=6,
            en_runs=6,
            observed_maximum_provider_cost_nano_usd=8_000,
            observed_p95_provider_cost_nano_usd=7_000,
            observed_total_provider_cost_nano_usd=42_000,
            approved_credit_price=7,
            approved_maximum_provider_cost_nano_usd=10_000,
            semantic_review="passed",
            provider_smoke="passed",
            safety_review="passed",
            production_preflight="passed",
        ),
    )

    assert cli.main(
        [
            "provider-activation-gate",
            "--backup-dir",
            str(tmp_path / "backup"),
            "--approval",
            str(tmp_path / "approval.json"),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 0
    captured = capsys.readouterr()
    output = json.loads(captured.out)
    assert output["activation_gate"] == "passed"
    assert output["tool_id"] == TOOL_ID
    assert "semantic_review" not in output
    assert "provider_request_id" not in captured.out


def test_activation_cli_keeps_incomplete_error_stable(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setattr(cli, "verify_bundle", lambda _path: None)
    monkeypatch.setattr(
        cli,
        "load_activation_approval",
        lambda _path: (_ for _ in ()).throw(
            ActivationGateIncompleteError("AI activation gate approval is incomplete")
        ),
    )

    assert cli.main(
        [
            "provider-activation-gate",
            "--backup-dir",
            str(tmp_path / "backup"),
            "--approval",
            str(tmp_path / "approval.json"),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "AI activation gate approval is incomplete\n"
