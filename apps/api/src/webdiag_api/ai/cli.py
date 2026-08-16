from __future__ import annotations

import argparse
import json
import sys
from collections.abc import Sequence
from pathlib import Path

from webdiag_api.ai.evaluation import (
    ProviderEvaluationError,
    ProviderEvaluationIncompleteError,
    build_provider_evaluation_report,
)
from webdiag_api.ai.storage import CreditConflictError, SqliteAIStore
from webdiag_api.recovery import DATABASE_FILENAMES, RecoveryError, verify_bundle


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m webdiag_api.ai.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    grant = commands.add_parser("grant-credits")
    grant.add_argument("--database-path", required=True)
    grant.add_argument("--user-id", required=True)
    grant.add_argument("--confirm-user-id", required=True)
    grant.add_argument("--quantity", required=True, type=int)
    grant.add_argument("--reason", required=True)
    grant.add_argument("--correlation-id", required=True)
    report = commands.add_parser("provider-cost-report")
    report.add_argument("--backup-dir", required=True)
    report.add_argument("--tool-id", required=True)
    report.add_argument("--sample-limit", type=int, default=10_000)
    evaluation = commands.add_parser("provider-eval-report")
    evaluation.add_argument("--backup-dir", required=True)
    evaluation.add_argument("--tool-id", required=True)
    evaluation.add_argument("--sample-limit", type=int, default=100)
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    arguments = _parser().parse_args(argv)
    if arguments.command == "provider-eval-report":
        backup_dir = Path(arguments.backup_dir)
        try:
            verify_bundle(backup_dir)
        except RecoveryError:
            print("provider evaluation snapshot is unavailable", file=sys.stderr)
            return 2
        store = SqliteAIStore(str(backup_dir / DATABASE_FILENAMES["account"]))
        try:
            report = build_provider_evaluation_report(
                store,
                tool_id=arguments.tool_id,
                sample_limit=arguments.sample_limit,
            )
        except ProviderEvaluationIncompleteError as error:
            print(str(error), file=sys.stderr)
            return 2
        except ProviderEvaluationError as error:
            print(str(error), file=sys.stderr)
            return 2
        print(
            json.dumps(
                {
                    "automated_contract_gate": "passed",
                    "contract_version": "webdiag.ai.provider_eval_report.v1",
                    "evidence_sha256": report.evidence_sha256,
                    "locales": {"en": report.en_runs, "ru": report.ru_runs},
                    "manual_output_review_required": (
                        report.manual_output_review_required
                    ),
                    "model_policy": report.model_policy,
                    "provider_cost_nano_usd": {
                        "maximum": report.maximum_nano_usd,
                        "minimum": report.minimum_nano_usd,
                        "p95": report.p95_nano_usd,
                        "total": report.total_nano_usd,
                    },
                    "sample_limit": report.sample_limit,
                    "sampled_runs": report.sampled_runs,
                    "tool_contract_version": report.tool_contract_version,
                    "tool_id": report.tool_id,
                    "usage": {
                        "input_units_total": report.input_units_total,
                        "output_units_total": report.output_units_total,
                    },
                },
                sort_keys=True,
                separators=(",", ":"),
            )
        )
        return 0
    if arguments.command == "provider-cost-report":
        backup_dir = Path(arguments.backup_dir)
        try:
            verify_bundle(backup_dir)
        except RecoveryError:
            print("provider cost snapshot is unavailable", file=sys.stderr)
            return 2
        store = SqliteAIStore(str(backup_dir / DATABASE_FILENAMES["account"]))
        try:
            report = store.provider_cost_report(
                tool_id=arguments.tool_id,
                sample_limit=arguments.sample_limit,
            )
        except ValueError as error:
            print(str(error), file=sys.stderr)
            return 2
        print(
            json.dumps(
                {
                    "contract_version": "webdiag.ai.provider_cost_report.v1",
                    "tool_id": report.tool_id,
                    "sample_limit": report.sample_limit,
                    "sampled_attempts": report.sampled_attempts,
                    "measured_attempts": report.measured_attempts,
                    "unmeasured_attempts": report.unmeasured_attempts,
                    "input_units_total": report.input_units_total,
                    "output_units_total": report.output_units_total,
                    "provider_cost_nano_usd": {
                        "minimum": report.minimum_nano_usd,
                        "maximum": report.maximum_nano_usd,
                        "p95": report.p95_nano_usd,
                        "total": report.total_nano_usd,
                    },
                },
                sort_keys=True,
                separators=(",", ":"),
            )
        )
        return 0
    store = SqliteAIStore(arguments.database_path)
    if arguments.user_id != arguments.confirm_user_id:
        print("credit grant confirmation does not match target user", file=sys.stderr)
        return 2
    try:
        entry = store.grant_credits(
            user_id=arguments.user_id,
            quantity=arguments.quantity,
            reason=arguments.reason,
            correlation_id=arguments.correlation_id,
        )
    except (ValueError, CreditConflictError) as error:
        print(str(error), file=sys.stderr)
        return 2
    account = store.get_credit_account(user_id=arguments.user_id)
    print(
        f"ledger_id={entry.id} user_id={entry.user_id} "
        f"available={account.available} reserved={account.reserved}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
