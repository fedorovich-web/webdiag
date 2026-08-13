import asyncio
import io
from pathlib import Path

import httpx
import pytest
from PIL import Image

from webdiag_api.accounts.api import SESSION_COOKIE_NAME, get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.api import get_ai_artifact_storage, get_ai_service
from webdiag_api.ai.artifact_storage import LocalArtifactStorage
from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.main import app


def _png() -> bytes:
    output = io.BytesIO()
    with Image.new("RGB", (3, 2), color="red") as image:
        image.save(output, format="PNG")
    return output.getvalue()


async def _call(
    *,
    token: str | None,
    data: bytes,
    content_type: str | None,
) -> httpx.Response:
    headers = {"content-type": content_type} if content_type is not None else None
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
        cookies={SESSION_COOKIE_NAME: token} if token else None,
    ) as client:
        return await client.post(
            "/v1/account/ai/uploads/image",
            content=data,
            headers=headers,
        )


@pytest.fixture
def upload_context(tmp_path: Path):
    database_path = tmp_path / "accounts.sqlite3"
    account = AccountService(
        SqliteAccountStore(str(database_path)),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    session = account.register(
        RegisterRequest(
            email="upload-owner@example.com",
            display_name="Upload Owner",
            password="correct horse battery staple",
        )
    )
    store = SqliteAIStore(str(database_path), upload_limit=1)
    artifact_root = tmp_path / "artifacts"
    ai = AIService(
        store,
        catalog=DEFAULT_AI_CATALOG,
        input_max_bytes=1024,
    )
    artifact_storage = LocalArtifactStorage(artifact_root)
    app.dependency_overrides[get_account_service] = lambda: account
    app.dependency_overrides[get_ai_service] = lambda: ai
    app.dependency_overrides[get_ai_artifact_storage] = lambda: artifact_storage
    try:
        yield session.token, store, artifact_root
    finally:
        app.dependency_overrides.clear()


def test_image_upload_requires_authentication_and_content_type(upload_context) -> None:
    token, _store, artifact_root = upload_context

    unauthenticated = asyncio.run(_call(token=None, data=_png(), content_type="image/png"))
    missing_type = asyncio.run(_call(token=token, data=_png(), content_type=None))

    assert unauthenticated.status_code == 401
    assert unauthenticated.headers["cache-control"] == "no-store"
    assert missing_type.status_code == 415
    assert missing_type.headers["cache-control"] == "no-store"
    assert missing_type.json()["detail"]["code"] == "ai_image_content_type_required"
    assert not list(artifact_root.rglob("*.*"))


def test_image_upload_detects_format_normalizes_and_hides_storage_key(upload_context) -> None:
    token, store, artifact_root = upload_context

    response = asyncio.run(
        _call(token=token, data=_png(), content_type="application/octet-stream")
    )

    assert response.status_code == 201
    assert response.headers["cache-control"] == "no-store"
    body = response.json()
    assert body["contract_version"] == "webdiag.ai.upload.v1"
    assert body["upload"]["media_type"] == "image/png"
    assert (body["upload"]["width"], body["upload"]["height"]) == (3, 2)
    assert len(body["upload"]["sha256"]) == 64
    assert "object_key" not in body["upload"]
    stored = store.get_upload(upload_id=body["upload"]["id"])
    assert stored is not None
    assert stored.object_key not in response.text
    assert (artifact_root / stored.object_key).read_bytes()


def test_invalid_image_has_stable_no_store_validation_error(upload_context) -> None:
    token, _store, _artifact_root = upload_context

    response = asyncio.run(_call(token=token, data=b"not an image", content_type="image/png"))

    assert response.status_code == 422
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "detail": {"code": "ai_invalid_image", "message": "Invalid image."}
    }


def test_upload_quota_compensates_private_object_write(upload_context) -> None:
    token, _store, artifact_root = upload_context
    first = asyncio.run(_call(token=token, data=_png(), content_type="image/png"))

    second = asyncio.run(_call(token=token, data=_png(), content_type="image/png"))

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["detail"]["code"] == "ai_upload_limit_reached"
    assert len([path for path in artifact_root.rglob("*") if path.is_file()]) == 1
