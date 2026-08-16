import hashlib
import io
import json
import sqlite3
from pathlib import Path

import pytest
from PIL import Image

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.artifact_storage import LocalArtifactStorage
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.cli import main as cli_main
from webdiag_api.ai.images import normalize_image
from webdiag_api.ai.models import AIRunCreateRequest, AIWorkerArtifact
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.recovery import create_backup

TOOL_ID = "ai_schema_studio"
MODEL_POLICY = "openai/gpt-5.6-luna"


def _create_snapshot(tmp_path: Path, *, locales: tuple[str, ...]) -> tuple[Path, str]:
    account_database = tmp_path / "accounts.sqlite3"
    user = SqliteAccountStore(str(account_database)).create_user(
        email="eval@example.com",
        display_name="Evaluation Operator",
        password_hash="test-only-password-hash",
    )
    definition = AIToolDefinition(
        id=TOOL_ID,
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=1,
        model_policy=MODEL_POLICY,
    )
    service = AIService(
        SqliteAIStore(str(account_database), lease_seconds=60),
        catalog=AIToolCatalog((definition,)),
        input_max_bytes=4_096,
    )
    service.grant_beta_credits(
        user_id=user.id,
        quantity=len(locales),
        reason="provider evaluation",
        correlation_id="eval-grant",
    )
    for index, locale in enumerate(locales, start=1):
        page_url = f"https://{locale}.example.test/about"
        public_input = {
            "locale": locale,
            "schema_type": "Organization",
            "page_url": page_url,
            "facts": ["WebDiag"],
        }
        run, created = service.create_run(
            user_id=user.id,
            request=AIRunCreateRequest(tool_id=TOOL_ID, input=public_input),
            idempotency_key=f"eval-case-{locale}",
        )
        assert created
        claim = service.claim_pending()
        assert claim is not None
        service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={
                "json_ld": {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "url": page_url,
                    "name": "WebDiag",
                },
                "property_sources": {"/name": [0]},
                "warnings": [],
            },
            provider_request_id=f"gen_eval_{locale}",
            input_units=100 * index,
            output_units=20 * index,
            provider_cost_nano_usd=1_000 * index,
        )

    audit_database = tmp_path / "audits.sqlite3"
    with sqlite3.connect(audit_database) as connection:
        connection.execute("CREATE TABLE audit_marker(id INTEGER PRIMARY KEY)")
    backup_dir = tmp_path / "eval-backup"
    create_backup(
        account_database=account_database,
        audit_database=audit_database,
        output_dir=backup_dir,
    )
    return backup_dir, user.id


def _rebuild_snapshot(tmp_path: Path, source: Path, name: str) -> Path:
    replacement = tmp_path / name
    create_backup(
        account_database=source,
        audit_database=tmp_path / "audits.sqlite3",
        output_dir=replacement,
    )
    return replacement


def _create_image_snapshot(tmp_path: Path) -> Path:
    account_database = tmp_path / "image-accounts.sqlite3"
    user = SqliteAccountStore(str(account_database)).create_user(
        email="image-eval@example.com",
        display_name="Image Evaluation Operator",
        password_hash="test-only-password-hash",
    )
    definition = AIToolDefinition(
        id="ai_image_studio",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=1,
        model_policy="openai/gpt-image-2",
    )
    service = AIService(
        SqliteAIStore(str(account_database), lease_seconds=60),
        catalog=AIToolCatalog((definition,)),
        input_max_bytes=4_096,
    )
    service.grant_beta_credits(
        user_id=user.id,
        quantity=2,
        reason="image provider evaluation",
        correlation_id="image-eval-grant",
    )
    storage = LocalArtifactStorage(tmp_path / "image-objects")
    image_buffer = io.BytesIO()
    Image.new("RGB", (2, 2), (10, 20, 30)).save(image_buffer, format="PNG")
    image_data = normalize_image(image_buffer.getvalue()).data
    digest = hashlib.sha256(image_data).hexdigest()
    for index, locale in enumerate(("ru", "en"), start=1):
        run, created = service.create_run(
            user_id=user.id,
            request=AIRunCreateRequest(
                tool_id="ai_image_studio",
                input={
                    "locale": locale,
                    "prompt": "Чистая предметная иллюстрация для технического отчёта."
                    if locale == "ru"
                    else "A clean product illustration for a technical report.",
                    "aspect_ratio": "1:1",
                    "quality": "medium",
                    "background": "opaque",
                },
            ),
            idempotency_key=f"image-eval-case-{locale}",
        )
        assert created
        claim = service.claim_pending()
        assert claim is not None and claim.artifact_reservation is not None
        service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
        reservation = claim.artifact_reservation
        stored = storage.put_reserved(
            artifact_id=reservation.artifact_id,
            object_key=reservation.object_key,
            data=image_data,
            media_type="image/png",
        )
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={
                "artifact_id": reservation.artifact_id,
                "media_type": "image/png",
                "byte_size": len(image_data),
                "sha256": digest,
            },
            provider_request_id=None,
            input_units=10 * index,
            output_units=20 * index,
            provider_cost_nano_usd=50_000 * index,
            artifact=AIWorkerArtifact(
                artifact_id=reservation.artifact_id,
                object_key=stored.object_key,
                media_type="image/png",
                byte_size=len(image_data),
                sha256=digest,
            ),
            artifact_storage=storage,
        )
    audit_database = tmp_path / "image-audits.sqlite3"
    with sqlite3.connect(audit_database) as connection:
        connection.execute("CREATE TABLE audit_marker(id INTEGER PRIMARY KEY)")
    backup_dir = tmp_path / "image-eval-backup"
    create_backup(
        account_database=account_database,
        audit_database=audit_database,
        output_dir=backup_dir,
    )
    return backup_dir


def test_provider_eval_report_revalidates_ru_en_runs_without_private_data(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, user_id = _create_snapshot(tmp_path, locales=("ru", "en"))

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            TOOL_ID,
            "--sample-limit",
            "20",
        ]
    ) == 0

    raw_output = capsys.readouterr().out
    report = json.loads(raw_output)
    assert report == {
        "automated_contract_gate": "passed",
        "contract_version": "webdiag.ai.provider_eval_report.v1",
        "evidence_sha256": report["evidence_sha256"],
        "locales": {"en": 1, "ru": 1},
        "manual_output_review_required": False,
        "model_policy": MODEL_POLICY,
        "provider_cost_nano_usd": {
            "maximum": 2_000,
            "minimum": 1_000,
            "p95": 2_000,
            "total": 3_000,
        },
        "sample_limit": 20,
        "sampled_runs": 2,
        "tool_contract_version": "v1",
        "tool_id": TOOL_ID,
        "usage": {"input_units_total": 300, "output_units_total": 60},
    }
    assert len(report["evidence_sha256"]) == 64
    assert set(report["evidence_sha256"]) <= set("0123456789abcdef")
    assert user_id not in raw_output
    assert "eval@example.com" not in raw_output
    assert "gen_eval" not in raw_output
    assert "https://" not in raw_output
    assert "WebDiag" not in raw_output


def test_provider_eval_report_keeps_image_output_review_manual(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir = _create_image_snapshot(tmp_path)

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            "ai_image_studio",
        ]
    ) == 0
    report = json.loads(capsys.readouterr().out)
    assert report["automated_contract_gate"] == "passed"
    assert report["manual_output_review_required"] is True
    assert report["locales"] == {"en": 1, "ru": 1}


def test_provider_eval_report_does_not_change_or_sidecar_the_snapshot(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    before = {path.name: path.read_bytes() for path in backup_dir.iterdir()}

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 0
    capsys.readouterr()

    after = {path.name: path.read_bytes() for path in backup_dir.iterdir()}
    assert after == before
    assert not any(
        path.name.endswith(("-wal", "-shm")) for path in backup_dir.iterdir()
    )


def test_provider_eval_report_rejects_excessive_sample_limit(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            TOOL_ID,
            "--sample-limit",
            "101",
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is invalid\n"


def test_provider_eval_query_does_not_materialize_oversized_json(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    account_database = backup_dir / "accounts.sqlite3"
    oversized = json.dumps(
        {"locale": "ru", "oversized": "x" * 2_000_000},
        separators=(",", ":"),
    )
    with sqlite3.connect(account_database) as connection:
        connection.execute(
            "UPDATE ai_runs SET input_json = ?, input_sha256 = ?",
            (oversized, hashlib.sha256(oversized.encode()).hexdigest()),
        )
    replacement = _rebuild_snapshot(tmp_path, account_database, "oversized-json-backup")
    samples = SqliteAIStore(
        str(replacement / "accounts.sqlite3")
    ).provider_evaluation_samples(tool_id=TOOL_ID)

    assert samples
    assert all(sample.input_json is None for sample in samples)
    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(replacement),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is invalid\n"


def test_provider_eval_report_fails_closed_without_both_locales(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru",))

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(backup_dir),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is incomplete\n"


def test_provider_eval_report_rejects_semantically_invalid_saved_output(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    account_database = backup_dir / "accounts.sqlite3"
    invalid_output = json.dumps(
        {
            "json_ld": {
                "@context": "https://schema.org",
                "@type": "Organization",
                "url": "https://en.example.test/about",
                "name": "Invented Company",
            },
            "property_sources": {"/name": [0]},
            "warnings": [],
        },
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
    with sqlite3.connect(account_database) as connection:
        connection.execute(
            """
            UPDATE ai_runs
            SET output_json = ?, output_sha256 = ?
            WHERE id = (SELECT id FROM ai_runs WHERE input_json LIKE '%\"en\"%' LIMIT 1)
            """,
            (invalid_output, hashlib.sha256(invalid_output.encode()).hexdigest()),
        )
    # Rebuild the manifest after controlled corruption so recovery verification
    # succeeds and the evaluation layer must catch the grounding violation.
    replacement = _rebuild_snapshot(
        tmp_path, account_database, "invalid-eval-backup"
    )

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(replacement),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is invalid\n"


def test_provider_eval_report_rejects_digest_consistent_unknown_input_fields(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    account_database = backup_dir / "accounts.sqlite3"
    with sqlite3.connect(account_database) as connection:
        rows = connection.execute("SELECT id, input_json FROM ai_runs").fetchall()
        for run_id, raw_input in rows:
            input_value = json.loads(raw_input)
            input_value["unexpected"] = "must be rejected"
            updated = json.dumps(
                input_value,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            connection.execute(
                "UPDATE ai_runs SET input_json = ?, input_sha256 = ? WHERE id = ?",
                (updated, hashlib.sha256(updated.encode()).hexdigest(), run_id),
            )
    replacement = _rebuild_snapshot(
        tmp_path, account_database, "unknown-input-eval-backup"
    )

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(replacement),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is invalid\n"


def test_provider_eval_report_normalizes_deep_json_parser_failure(
    tmp_path: Path,
    capsys,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    account_database = backup_dir / "accounts.sqlite3"
    deeply_nested = "[" * 1_100 + "0" + "]" * 1_100
    with sqlite3.connect(account_database) as connection:
        connection.execute(
            """
            UPDATE ai_runs SET input_json = ?, input_sha256 = ?
            WHERE id = (SELECT id FROM ai_runs LIMIT 1)
            """,
            (
                deeply_nested,
                hashlib.sha256(deeply_nested.encode()).hexdigest(),
            ),
        )
    replacement = _rebuild_snapshot(tmp_path, account_database, "deep-json-backup")

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(replacement),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is invalid\n"


@pytest.mark.parametrize(
    ("assignment", "value"),
    (
        ("contract_version = ?", "v2"),
        ("model_policy = ?", "openai/other-model"),
        ("input_sha256 = ?", "0" * 64),
        ("output_sha256 = ?", "0" * 64),
    ),
)
def test_provider_eval_report_rejects_snapshot_or_digest_drift(
    tmp_path: Path,
    capsys,
    assignment: str,
    value: str,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    account_database = backup_dir / "accounts.sqlite3"
    with sqlite3.connect(account_database) as connection:
        connection.execute(f"UPDATE ai_runs SET {assignment}", (value,))
    replacement = _rebuild_snapshot(tmp_path, account_database, "drifted-eval-backup")

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(replacement),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is invalid\n"


@pytest.mark.parametrize(
    "assignment",
    ("provider_cost_nano_usd = NULL", "provider_request_id = NULL"),
)
def test_provider_eval_report_rejects_unmeasured_text_runs(
    tmp_path: Path,
    capsys,
    assignment: str,
) -> None:
    backup_dir, _user_id = _create_snapshot(tmp_path, locales=("ru", "en"))
    account_database = backup_dir / "accounts.sqlite3"
    with sqlite3.connect(account_database) as connection:
        connection.execute(f"UPDATE ai_run_attempts SET {assignment}")
    replacement = _rebuild_snapshot(tmp_path, account_database, "unmeasured-eval-backup")

    assert cli_main(
        [
            "provider-eval-report",
            "--backup-dir",
            str(replacement),
            "--tool-id",
            TOOL_ID,
        ]
    ) == 2
    assert capsys.readouterr().err == "provider evaluation evidence is incomplete\n"
