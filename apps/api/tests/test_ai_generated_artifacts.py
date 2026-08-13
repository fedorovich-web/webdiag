import asyncio
import hashlib
import io
from pathlib import Path

import httpx
from PIL import Image

from webdiag_api.accounts.api import SESSION_COOKIE_NAME, get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.api import (
    get_ai_artifact_storage,
    get_ai_service,
    get_optional_ai_artifact_storage,
)
from webdiag_api.ai.artifact_storage import LocalArtifactStorage
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.images import normalize_image
from webdiag_api.ai.models import AIRunCreateRequest, AIWorkerArtifact
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.config import settings
from webdiag_api.main import app


def _png() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (3, 2), (12, 34, 56)).save(output, format="PNG")
    return normalize_image(output.getvalue()).data


def _context(tmp_path: Path):
    database = tmp_path / "generated.sqlite3"
    account = AccountService(
        SqliteAccountStore(str(database)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    owner = account.register(
        RegisterRequest(
            email="image-owner@example.com",
            display_name="Image Owner",
            password="correct horse battery staple",
        )
    )
    other = account.register(
        RegisterRequest(
            email="image-other@example.com",
            display_name="Image Other",
            password="another correct horse battery staple",
        )
    )
    tools = tuple(
        AIToolDefinition(
            id=tool_id,
            contract_version="v1",
            state=AIToolState.READY,
            credit_price=5,
            model_policy="openai/gpt-image-2",
        )
        for tool_id in ("ai_image_studio", "ai_image_edit_studio")
    )
    service = AIService(
        SqliteAIStore(str(database), lease_seconds=60),
        catalog=AIToolCatalog(tools),
        input_max_bytes=100_000,
    )
    service.grant_beta_credits(
        user_id=owner.response.user.id,
        quantity=10,
        reason="generated artifact test",
        correlation_id="generated-artifact-grant",
    )
    storage = LocalArtifactStorage(tmp_path / "objects")
    return account, service, storage, owner, other


async def _call(
    method: str,
    path: str,
    *,
    token: str | None = None,
    json: dict[str, object] | None = None,
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    cookies = {SESSION_COOKIE_NAME: token} if token else None
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
        cookies=cookies,
    ) as client:
        return await client.request(method, path, json=json, headers=headers)


def test_generated_artifact_completion_is_private_owned_and_integrity_checked(
    tmp_path: Path,
    monkeypatch,
) -> None:
    account, service, storage, owner, other = _context(tmp_path)
    run, _created = service.create_run(
        user_id=owner.response.user.id,
        request=AIRunCreateRequest(
            tool_id="ai_image_studio",
            input={
                "locale": "en",
                "prompt": "A clean technical illustration of a website audit dashboard.",
                "aspect_ratio": "1:1",
                "quality": "medium",
                "background": "opaque",
            },
        ),
        idempotency_key="image-run-0001",
    )
    claim = service.claim_pending()
    assert claim is not None
    service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
    image = _png()
    artifact_id = "22222222-2222-4222-8222-222222222222"
    stored = storage.put(artifact_id=artifact_id, data=image, media_type="image/png")
    digest = hashlib.sha256(image).hexdigest()

    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_ai_service] = lambda: service
    app.dependency_overrides[get_ai_artifact_storage] = lambda: storage
    app.dependency_overrides[get_optional_ai_artifact_storage] = lambda: storage
    monkeypatch.setattr(settings, "ai_internal_token", "a" * 32)
    try:
        completed = asyncio.run(
            _call(
                "POST",
                f"/v1/internal/ai/runs/{run.id}/complete",
                headers={"Authorization": f"Bearer {'a' * 32}"},
                json={
                    "lease_token": claim.lease_token,
                    "output": {
                        "artifact_id": artifact_id,
                        "media_type": "image/png",
                        "byte_size": len(image),
                        "sha256": digest,
                    },
                    "artifact": {
                        "artifact_id": artifact_id,
                        "object_key": stored.object_key,
                        "media_type": "image/png",
                        "byte_size": len(image),
                        "sha256": digest,
                    },
                    "input_units": 10,
                    "output_units": 20,
                },
            )
        )
        owner_result = asyncio.run(
            _call(
                "GET",
                f"/v1/account/ai/runs/{run.id}/artifacts/{artifact_id}",
                token=owner.token,
            )
        )
        foreign = asyncio.run(
            _call(
                "GET",
                f"/v1/account/ai/runs/{run.id}/artifacts/{artifact_id}",
                token=other.token,
            )
        )
    finally:
        app.dependency_overrides.clear()

    assert completed.status_code == 200, completed.text
    assert completed.headers["cache-control"] == "no-store"
    public_run = service.get_run(user_id=owner.response.user.id, run_id=run.id)
    assert public_run.output == {
        "artifact_id": artifact_id,
        "media_type": "image/png",
        "byte_size": len(image),
        "sha256": digest,
    }
    assert stored.object_key not in str(public_run.output)
    assert owner_result.status_code == 200
    assert owner_result.content == image
    assert owner_result.headers["content-type"] == "image/png"
    assert owner_result.headers["cache-control"] == "no-store"
    assert owner_result.headers["x-content-type-options"] == "nosniff"
    assert foreign.status_code == 404
    assert foreign.json()["detail"]["code"] == "ai_artifact_not_found"

    (tmp_path / "objects" / stored.object_key).write_bytes(b"tampered")
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_ai_service] = lambda: service
    app.dependency_overrides[get_ai_artifact_storage] = lambda: storage
    try:
        tampered = asyncio.run(
            _call(
                "GET",
                f"/v1/account/ai/runs/{run.id}/artifacts/{artifact_id}",
                token=owner.token,
            )
        )
    finally:
        app.dependency_overrides.clear()
    assert tampered.status_code == 500
    assert tampered.headers["cache-control"] == "no-store"
    assert tampered.json()["detail"] == {
        "code": "ai_artifact_unavailable",
        "message": "AI artifact is temporarily unavailable.",
    }


def test_image_completion_rejects_missing_or_mismatched_private_artifact(tmp_path: Path) -> None:
    _account, service, storage, owner, _other = _context(tmp_path)
    run, _created = service.create_run(
        user_id=owner.response.user.id,
        request=AIRunCreateRequest(
            tool_id="ai_image_studio",
            input={
                "locale": "en",
                "prompt": "A clean product illustration for a technical report cover.",
                "aspect_ratio": "1:1",
                "quality": "medium",
                "background": "opaque",
            },
        ),
        idempotency_key="image-run-0002",
    )
    claim = service.claim_pending()
    assert claim is not None
    service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)

    try:
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={
                "artifact_id": "22222222-2222-4222-8222-222222222222",
                "media_type": "image/png",
                "byte_size": 10,
                "sha256": "a" * 64,
            },
            provider_request_id=None,
            input_units=1,
            output_units=1,
            artifact=None,
            artifact_storage=storage,
        )
    except Exception as error:
        assert getattr(error, "code", None) == "ai_invalid_provider_output"
    else:
        raise AssertionError("image completion without an artifact must fail")

    assert service.get_run(user_id=owner.response.user.id, run_id=run.id).state == "failed"


def test_image_edit_binds_one_owned_normalized_upload(tmp_path: Path) -> None:
    _account, service, storage, owner, other = _context(tmp_path)
    upload = service.create_image_upload(
        user_id=owner.response.user.id,
        data=_png(),
        content_type_hint="image/png",
        artifact_storage=storage,
    )

    run, created = service.create_run(
        user_id=owner.response.user.id,
        request=AIRunCreateRequest(
            tool_id="ai_image_edit_studio",
            input={
                "locale": "en",
                "upload_id": upload.id,
                "prompt": "Remove the background and keep the product silhouette unchanged.",
                "aspect_ratio": "auto",
                "quality": "medium",
                "background": "opaque",
            },
        ),
        idempotency_key="image-edit-0001",
    )
    claim = service.claim_pending()

    assert created is True
    assert claim is not None and claim.run_id == run.id
    assert "upload_id" not in claim.input
    assert set(claim.input["image"]) == {
        "object_key",
        "media_type",
        "byte_size",
        "width",
        "height",
        "sha256",
    }
    try:
        service.create_run(
            user_id=other.response.user.id,
            request=AIRunCreateRequest(
                tool_id="ai_image_edit_studio",
                input={
                    "locale": "en",
                    "upload_id": upload.id,
                    "prompt": "Use another account's private upload for an edit request.",
                    "aspect_ratio": "auto",
                    "quality": "medium",
                    "background": "opaque",
                },
            ),
            idempotency_key="image-edit-foreign",
        )
    except Exception as error:
        assert getattr(error, "code", None) == "ai_upload_not_found"
    else:
        raise AssertionError("foreign image upload must not be usable")


def test_deleted_run_artifact_cleanup_is_bounded_idempotent_and_retryable(
    tmp_path: Path,
) -> None:
    _account, service, storage, owner, _other = _context(tmp_path)
    object_keys: list[str] = []
    for index in range(2):
        run, _created = service.create_run(
            user_id=owner.response.user.id,
            request=AIRunCreateRequest(
                tool_id="ai_image_studio",
                input={
                    "locale": "en",
                    "prompt": f"A bounded generated technical illustration number {index}.",
                    "aspect_ratio": "1:1",
                    "quality": "medium",
                    "background": "opaque",
                },
            ),
            idempotency_key=f"image-cleanup-{index}",
        )
        claim = service.claim_pending()
        assert claim is not None and claim.run_id == run.id
        service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
        image = _png()
        artifact_id = f"22222222-2222-4222-8222-{index + 1:012d}"
        stored = storage.put(artifact_id=artifact_id, data=image, media_type="image/png")
        digest = hashlib.sha256(image).hexdigest()
        service.complete_run(
            run_id=run.id,
            lease_token=claim.lease_token,
            output={
                "artifact_id": artifact_id,
                "media_type": "image/png",
                "byte_size": len(image),
                "sha256": digest,
            },
            provider_request_id=None,
            input_units=1,
            output_units=1,
            artifact=AIWorkerArtifact(
                artifact_id=artifact_id,
                object_key=stored.object_key,
                media_type="image/png",
                byte_size=len(image),
                sha256=digest,
            ),
            artifact_storage=storage,
        )
        service.delete_run(user_id=owner.response.user.id, run_id=run.id)
        object_keys.append(stored.object_key)

    class FailingDeleteStorage:
        def delete(self, *, object_key: str) -> None:
            raise OSError(object_key)

    assert service.cleanup_artifacts(
        artifact_storage=FailingDeleteStorage(),
        limit=1,
    ) == (0, 1)
    assert service.cleanup_artifacts(artifact_storage=storage, limit=1) == (1, 0)
    assert sum((tmp_path / "objects" / key).exists() for key in object_keys) == 1
    assert service.cleanup_artifacts(artifact_storage=storage, limit=10) == (1, 0)
    assert service.cleanup_artifacts(artifact_storage=storage, limit=10) == (0, 0)
    assert all(not (tmp_path / "objects" / key).exists() for key in object_keys)


def test_internal_artifact_cleanup_requires_bearer_and_is_no_store(
    tmp_path: Path,
    monkeypatch,
) -> None:
    _account, service, storage, _owner, _other = _context(tmp_path)
    app.dependency_overrides[get_ai_service] = lambda: service
    app.dependency_overrides[get_optional_ai_artifact_storage] = lambda: storage
    monkeypatch.setattr(settings, "ai_internal_token", "a" * 32)
    try:
        missing = asyncio.run(_call("POST", "/v1/internal/ai/artifacts/cleanup?limit=1"))
        authorized = asyncio.run(
            _call(
                "POST",
                "/v1/internal/ai/artifacts/cleanup?limit=1",
                headers={"Authorization": f"Bearer {'a' * 32}"},
            )
        )
    finally:
        app.dependency_overrides.clear()

    assert missing.status_code == 401
    assert missing.headers["cache-control"] == "no-store"
    assert authorized.status_code == 200
    assert authorized.headers["cache-control"] == "no-store"
    assert authorized.json() == {
        "contract_version": "webdiag.ai.artifact_cleanup.v1",
        "deleted": 0,
        "failed": 0,
    }
