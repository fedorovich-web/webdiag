import hashlib
import uuid
from pathlib import Path

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore


class FakeArtifactStorage:
    def __init__(self, *, fail_delete: bool = False) -> None:
        self.fail_delete = fail_delete
        self.deletes: list[str] = []

    def put(self, *, artifact_id: str, data: bytes, media_type: str):
        raise AssertionError((artifact_id, data, media_type))

    def read(self, *, object_key: str, max_bytes: int) -> bytes:
        raise AssertionError((object_key, max_bytes))

    def delete(self, *, object_key: str) -> None:
        self.deletes.append(object_key)
        if self.fail_delete:
            raise OSError("storage unavailable")


def _context(tmp_path: Path):
    database_path = tmp_path / "accounts.sqlite3"
    user = SqliteAccountStore(str(database_path)).create_user(
        email="cleanup@example.com",
        display_name="Cleanup",
        password_hash="test-only-password-hash",
    )
    store = SqliteAIStore(str(database_path), lease_seconds=60)
    tool = AIToolDefinition(
        id="ai_alt_text_studio",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=1,
        model_policy="openai/gpt-5.6-luna",
    )
    service = AIService(store, catalog=AIToolCatalog((tool,)), input_max_bytes=20_000)
    service.grant_beta_credits(
        user_id=user.id,
        quantity=4,
        reason="test",
        correlation_id="cleanup-grant",
    )
    return service, store, user.id


def _run(service: AIService, store: SqliteAIStore, user_id: str, label: str):
    upload_id = str(uuid.uuid5(uuid.NAMESPACE_URL, label))
    data = label.encode()
    upload = store.create_upload(
        user_id=user_id,
        upload_id=upload_id,
        object_key=f"ai-uploads/{upload_id[:2]}/{upload_id.replace('-', ''):0<62}"[:76],
        media_type="image/png",
        byte_size=len(data),
        width=3,
        height=2,
        sha256=hashlib.sha256(data).hexdigest(),
    )
    run, _created = service.create_run(
        user_id=user_id,
        request=AIRunCreateRequest(
            tool_id="ai_alt_text_studio",
            input={
                "locale": "en",
                "upload_id": upload.id,
                "purpose": "informative",
            },
        ),
        idempotency_key=f"cleanup-{label}",
    )
    claim = service.claim_pending()
    assert claim is not None and claim.run_id == run.id
    service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
    return upload, run, claim


@pytest.mark.parametrize("outcome", ("succeeded", "failed", "provider_unknown"))
def test_terminal_run_marks_bound_upload_pending_in_same_transition(
    tmp_path: Path,
    outcome: str,
) -> None:
    service, store, user_id = _context(tmp_path)
    upload, run, claim = _run(service, store, user_id, outcome)

    if outcome == "succeeded":
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={
                "alt_text": "WebDiag dashboard with technical findings",
                "decorative": False,
                "rationale": "Describes the visible dashboard.",
            },
            provider_request_id="gen_cleanup",
            input_units=10,
            output_units=4,
        )
    else:
        service.fail_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            error_code="ai_test_failure",
            provider_unknown=outcome == "provider_unknown",
        )

    assert store.get_upload(upload_id=upload.id).deletion_state == "pending"


def test_cleanup_is_bounded_idempotent_and_retries_failed_delete(tmp_path: Path) -> None:
    service, store, user_id = _context(tmp_path)
    uploads = []
    for label in ("cleanup-a", "cleanup-b"):
        upload, run, claim = _run(service, store, user_id, label)
        service.fail_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            error_code="ai_test_failure",
            provider_unknown=False,
        )
        uploads.append(upload)

    failing = FakeArtifactStorage(fail_delete=True)
    assert service.cleanup_uploads(artifact_storage=failing, limit=1) == (0, 1)
    assert store.get_upload(upload_id=uploads[0].id).deletion_state == "pending"

    working = FakeArtifactStorage()
    assert service.cleanup_uploads(artifact_storage=working, limit=1) == (1, 0)
    assert len(working.deletes) == 1
    assert service.cleanup_uploads(artifact_storage=working, limit=10) == (1, 0)
    assert service.cleanup_uploads(artifact_storage=working, limit=10) == (0, 0)
    assert all(
        store.get_upload(upload_id=upload.id).deletion_state == "deleted"
        for upload in uploads
    )
