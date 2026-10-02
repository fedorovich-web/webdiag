from __future__ import annotations

import json
import os
import re
import stat
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG, AIToolState
from webdiag_api.ai.evaluation import (
    ProviderEvaluationError,
    ProviderEvaluationIncompleteError,
    ProviderEvaluationReport,
    build_provider_evaluation_report,
)
from webdiag_api.ai.storage import SqliteAIStore

ACTIVATION_APPROVAL_CONTRACT = "webdiag.ai.activation_approval.v1"
ACTIVATION_GATE_CONTRACT = "webdiag.ai.activation_gate.v1"
MAX_APPROVAL_FILE_BYTES = 64 * 1024
DEFAULT_MINIMUM_SAMPLES = 10
SELECTED_TEXT_AI_TOOL_IDS = frozenset(
    {
        "ai_audit_action_plan",
        "ai_competitor_gap_report",
        "ai_content_brief",
        "ai_content_optimizer",
        "ai_internal_linking_planner",
        "ai_search_intent_page_fit",
    }
)

_APPROVAL_KEYS = frozenset(
    {
        "contract_version",
        "tool_id",
        "evidence_sha256",
        "approved_credit_price",
        "maximum_provider_cost_nano_usd",
        "semantic_review",
        "provider_smoke",
        "safety_review",
        "production_preflight",
    }
)
_REQUIRED_PASSED_FIELDS = (
    "semantic_review",
    "provider_smoke",
    "safety_review",
    "production_preflight",
)
_SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
_TOOL_ID_RE = re.compile(r"^[a-z][a-z0-9_]{1,119}$")


class ActivationGateError(RuntimeError):
    """The activation approval or evidence cannot be used safely."""


class ActivationGateIncompleteError(ActivationGateError):
    """A required approval or evidence gate has not passed yet."""


@dataclass(frozen=True, slots=True)
class ActivationGateReport:
    tool_id: str
    evidence_sha256: str
    sampled_runs: int
    ru_runs: int
    en_runs: int
    observed_maximum_provider_cost_nano_usd: int
    observed_p95_provider_cost_nano_usd: int
    observed_total_provider_cost_nano_usd: int
    approved_credit_price: int
    approved_maximum_provider_cost_nano_usd: int
    semantic_review: str
    provider_smoke: str
    safety_review: str
    production_preflight: str


def build_activation_gate_report(
    store: SqliteAIStore,
    *,
    tool_id: str,
    approval: Mapping[str, object],
    report: ProviderEvaluationReport | None = None,
    sample_limit: int = 100,
    minimum_samples: int = DEFAULT_MINIMUM_SAMPLES,
) -> ActivationGateReport:
    """Validate an operator approval against immutable provider evidence.

    This function only reads evidence and returns a redacted aggregate. It never
    changes the catalog, prices, credits, or persisted AI runs.
    """

    if (
        not isinstance(tool_id, str)
        or not _TOOL_ID_RE.fullmatch(tool_id)
        or tool_id not in SELECTED_TEXT_AI_TOOL_IDS
    ):
        raise ActivationGateError("AI activation gate input is invalid")
    definition = DEFAULT_AI_CATALOG.get(tool_id)
    if definition is None or definition.state is not AIToolState.INTERNAL:
        raise ActivationGateError("AI activation gate input is invalid")
    if (
        isinstance(minimum_samples, bool)
        or not isinstance(minimum_samples, int)
        or not 2 <= minimum_samples <= 100
    ):
        raise ActivationGateError("AI activation gate input is invalid")
    if (
        isinstance(sample_limit, bool)
        or not isinstance(sample_limit, int)
        or not 1 <= sample_limit <= 100
    ):
        raise ActivationGateError("AI activation gate input is invalid")

    normalized_approval = _validate_approval(approval, tool_id=tool_id)
    if report is None:
        try:
            report = build_provider_evaluation_report(
                store,
                tool_id=tool_id,
                sample_limit=sample_limit,
            )
        except ProviderEvaluationIncompleteError as error:
            raise ActivationGateIncompleteError(
                "AI activation gate evidence is incomplete"
            ) from error
        except ProviderEvaluationError as error:
            raise ActivationGateError("AI activation gate evidence is invalid") from error

    _validate_report(
        report,
        tool_id=tool_id,
        minimum_samples=minimum_samples,
        approval=normalized_approval,
    )
    return ActivationGateReport(
        tool_id=tool_id,
        evidence_sha256=report.evidence_sha256,
        sampled_runs=report.sampled_runs,
        ru_runs=report.ru_runs,
        en_runs=report.en_runs,
        observed_maximum_provider_cost_nano_usd=report.maximum_nano_usd,
        observed_p95_provider_cost_nano_usd=report.p95_nano_usd,
        observed_total_provider_cost_nano_usd=report.total_nano_usd,
        approved_credit_price=normalized_approval["approved_credit_price"],
        approved_maximum_provider_cost_nano_usd=normalized_approval[
            "maximum_provider_cost_nano_usd"
        ],
        semantic_review=normalized_approval["semantic_review"],
        provider_smoke=normalized_approval["provider_smoke"],
        safety_review=normalized_approval["safety_review"],
        production_preflight=normalized_approval["production_preflight"],
    )


def load_activation_approval(path: Path) -> dict[str, object]:
    """Read one bounded, non-linked approval JSON file without exposing details."""

    if not isinstance(path, Path):
        raise ActivationGateError("AI activation gate approval is unavailable")
    try:
        before = path.stat(follow_symlinks=False)
        if _stat_is_link_or_reparse(before) or not stat.S_ISREG(before.st_mode):
            raise ActivationGateError("AI activation gate approval is unavailable")
        if before.st_size > MAX_APPROVAL_FILE_BYTES:
            raise ActivationGateError("AI activation gate approval is invalid")
        raw = path.read_bytes()
        after = path.stat(follow_symlinks=False)
        if (
            _stat_is_link_or_reparse(after)
            or not stat.S_ISREG(after.st_mode)
            or not os.path.samestat(before, after)
        ):
            raise ActivationGateError("AI activation gate approval is unavailable")
    except ActivationGateError:
        raise
    except (OSError, ValueError) as error:
        raise ActivationGateError("AI activation gate approval is unavailable") from error
    if len(raw) > MAX_APPROVAL_FILE_BYTES:
        raise ActivationGateError("AI activation gate approval is invalid")
    try:
        value = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError, RecursionError) as error:
        raise ActivationGateError("AI activation gate approval is invalid") from error
    if not isinstance(value, dict):
        raise ActivationGateError("AI activation gate approval is invalid")
    return _validate_approval(value)


def _validate_approval(
    approval: Mapping[str, object],
    *,
    tool_id: str | None = None,
) -> dict[str, object]:
    if not isinstance(approval, Mapping) or set(approval) != _APPROVAL_KEYS:
        raise ActivationGateError("AI activation gate approval is invalid")
    contract_version = approval.get("contract_version")
    approval_tool_id = approval.get("tool_id")
    evidence_sha256 = approval.get("evidence_sha256")
    if (
        contract_version != ACTIVATION_APPROVAL_CONTRACT
        or not isinstance(approval_tool_id, str)
        or not _TOOL_ID_RE.fullmatch(approval_tool_id)
        or approval_tool_id not in SELECTED_TEXT_AI_TOOL_IDS
        or (tool_id is not None and approval_tool_id != tool_id)
        or not isinstance(evidence_sha256, str)
        or not _SHA256_RE.fullmatch(evidence_sha256)
    ):
        raise ActivationGateError("AI activation gate approval is invalid")
    approved_credit_price = approval.get("approved_credit_price")
    maximum_cost = approval.get("maximum_provider_cost_nano_usd")
    if (
        isinstance(approved_credit_price, bool)
        or not isinstance(approved_credit_price, int)
        or not 1 <= approved_credit_price <= 1_000_000
        or isinstance(maximum_cost, bool)
        or not isinstance(maximum_cost, int)
        or not 1 <= maximum_cost <= 10**15
    ):
        raise ActivationGateError("AI activation gate approval is invalid")
    normalized = dict(approval)
    for field in _REQUIRED_PASSED_FIELDS:
        value = approval.get(field)
        if value != "passed":
            if value in {"pending", "failed", "not_run"}:
                raise ActivationGateIncompleteError(
                    "AI activation gate approval is incomplete"
                )
            raise ActivationGateError("AI activation gate approval is invalid")
        normalized[field] = value
    return normalized


def _validate_report(
    report: ProviderEvaluationReport,
    *,
    tool_id: str,
    minimum_samples: int,
    approval: Mapping[str, object],
) -> None:
    if not isinstance(report, ProviderEvaluationReport):
        raise ActivationGateError("AI activation gate evidence is invalid")
    if (
        report.tool_id != tool_id
        or report.manual_output_review_required
        or report.evidence_sha256 != approval["evidence_sha256"]
        or report.sampled_runs < minimum_samples
        or report.ru_runs < 1
        or report.en_runs < 1
        or report.ru_runs + report.en_runs != report.sampled_runs
        or report.minimum_nano_usd < 0
        or report.maximum_nano_usd < report.minimum_nano_usd
        or not report.minimum_nano_usd <= report.p95_nano_usd <= report.maximum_nano_usd
        or report.total_nano_usd < report.maximum_nano_usd
    ):
        raise ActivationGateIncompleteError("AI activation gate evidence is incomplete")
    if report.maximum_nano_usd > approval["maximum_provider_cost_nano_usd"]:
        raise ActivationGateIncompleteError("AI activation gate cost approval is incomplete")


def _stat_is_link_or_reparse(value: os.stat_result) -> bool:
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
    attributes = getattr(value, "st_file_attributes", 0)
    return stat.S_ISLNK(value.st_mode) or bool(attributes & reparse_flag)
