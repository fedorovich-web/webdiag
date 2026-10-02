import hashlib
import json
import uuid
from pathlib import Path

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.catalog import AIToolCatalog, AIToolDefinition, AIToolState
from webdiag_api.ai.models import AIRunCreateRequest
from webdiag_api.ai.service import AIService, AIServiceError
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    validate_output,
    validate_public_input,
)


class FakeClock:
    def __init__(self, value: int = 1_000_000_000) -> None:
        self.value = value

    def __call__(self) -> int:
        return self.value


def _public_input(upload_id: str, *, locale: str = "ru") -> dict[str, object]:
    return {
        "locale": locale,
        "upload_id": upload_id,
        "page_context": "  Карточка услуги\r\nна главной странице  ",
        "surrounding_text": "  Проверка технического состояния сайта  ",
        "purpose": "unknown",
    }


def _service(tmp_path: Path, *, clock: FakeClock | None = None):
    database_path = tmp_path / "accounts.sqlite3"
    accounts = SqliteAccountStore(str(database_path))
    owner = accounts.create_user(
        email="alt-owner@example.com",
        display_name="Alt Owner",
        password_hash="test-only-password-hash",
    )
    other = accounts.create_user(
        email="alt-other@example.com",
        display_name="Alt Other",
        password_hash="test-only-password-hash",
    )
    store = SqliteAIStore(
        str(database_path),
        upload_ttl_seconds=60,
        clock_ns=clock or FakeClock(),
    )
    tool = AIToolDefinition(
        id="ai_alt_text_studio",
        contract_version="v1",
        state=AIToolState.READY,
        credit_price=1,
        model_policy="openai/gpt-5.6-sol",
    )
    service = AIService(store, catalog=AIToolCatalog((tool,)), input_max_bytes=20_000)
    for user_id, correlation in ((owner.id, "owner-grant"), (other.id, "other-grant")):
        service.grant_beta_credits(
            user_id=user_id,
            quantity=5,
            reason="test",
            correlation_id=correlation,
        )
    return service, store, owner.id, other.id


def _upload(store: SqliteAIStore, *, user_id: str, label: str):
    upload_id = str(uuid.uuid5(uuid.NAMESPACE_URL, label))
    data = label.encode()
    return store.create_upload(
        user_id=user_id,
        upload_id=upload_id,
        object_key=f"ai-uploads/{upload_id[:2]}/{upload_id.replace('-', ''):0<62}"[:76],
        media_type="image/png",
        byte_size=len(data),
        width=640,
        height=480,
        sha256=hashlib.sha256(data).hexdigest(),
    )


def test_alt_text_public_input_is_strict_bounded_bilingual_and_normalized() -> None:
    upload_id = str(uuid.uuid4())
    ru = validate_public_input("ai_alt_text_studio", _public_input(upload_id))
    en = validate_public_input(
        "ai_alt_text_studio",
        {
            "locale": "en",
            "upload_id": upload_id,
            "purpose": "informative",
        },
    )

    assert ru == {
        "locale": "ru",
        "upload_id": upload_id,
        "page_context": "Карточка услуги\nна главной странице",
        "surrounding_text": "Проверка технического состояния сайта",
        "purpose": "unknown",
    }
    assert en["locale"] == "en"
    for invalid in (
        {**_public_input(upload_id), "locale": "de"},
        {**_public_input(upload_id), "upload_id": upload_id.upper()},
        {**_public_input(upload_id), "purpose": "seo"},
        {**_public_input(upload_id), "unexpected": True},
        {**_public_input(upload_id), "page_context": "x" * 2_001},
    ):
        with pytest.raises(AIToolContractError):
            validate_public_input("ai_alt_text_studio", invalid)


def test_alt_text_output_enforces_decorative_invariant() -> None:
    informative = {
        "alt_text": "Панель WebDiag со списком технических проблем сайта",
        "decorative": False,
        "rationale": "Описывает видимое содержимое изображения.",
    }
    decorative = {
        "alt_text": "",
        "decorative": True,
        "rationale": "Изображение не добавляет информации к окружающему тексту.",
    }
    assert validate_output("ai_alt_text_studio", {}, informative) == informative
    assert validate_output("ai_alt_text_studio", {}, decorative) == decorative

    for invalid in (
        {**informative, "alt_text": ""},
        {**decorative, "alt_text": "Декоративный градиент"},
        {**informative, "alt_text": "x" * 301},
        {**informative, "rationale": ""},
    ):
        with pytest.raises(AIToolContractError):
            validate_output("ai_alt_text_studio", {}, invalid)


def test_alt_text_run_snapshots_owned_descriptor_and_binds_atomically(tmp_path: Path) -> None:
    service, store, owner_id, _other_id = _service(tmp_path)
    upload = _upload(store, user_id=owner_id, label="descriptor")
    request = AIRunCreateRequest(
        tool_id="ai_alt_text_studio",
        input=_public_input(upload.id),
    )

    run, created = service.create_run(
        user_id=owner_id,
        request=request,
        idempotency_key="alt-text-descriptor",
    )
    replay, replay_created = service.create_run(
        user_id=owner_id,
        request=request,
        idempotency_key="alt-text-descriptor",
    )

    assert created and not replay_created and replay.id == run.id
    stored_run = store.get_run(run_id=run.id)
    provider_input = json.loads(stored_run.input_json)
    assert "upload_id" not in provider_input
    assert provider_input["image"] == {
        "object_key": upload.object_key,
        "media_type": "image/png",
        "byte_size": upload.byte_size,
        "width": 640,
        "height": 480,
        "sha256": upload.sha256,
    }
    assert owner_id not in stored_run.input_json
    assert "alt-owner@example.com" not in stored_run.input_json
    assert "input" not in run.model_dump(mode="json")
    assert store.get_upload(upload_id=upload.id).bound_run_id == run.id


def test_alt_text_missing_foreign_expired_and_already_bound_uploads_are_indistinguishable(
    tmp_path: Path,
) -> None:
    clock = FakeClock()
    service, store, owner_id, other_id = _service(tmp_path, clock=clock)
    foreign = _upload(store, user_id=owner_id, label="foreign")
    expired = _upload(store, user_id=owner_id, label="expired")
    bound = _upload(store, user_id=owner_id, label="bound")
    service.create_run(
        user_id=owner_id,
        request=AIRunCreateRequest(
            tool_id="ai_alt_text_studio",
            input=_public_input(bound.id),
        ),
        idempotency_key="alt-text-first-binding",
    )
    clock.value = expired.expires_at

    failures: list[tuple[int, str, str]] = []
    for user_id, upload_id, key in (
        (other_id, str(uuid.uuid4()), "alt-text-missing"),
        (other_id, foreign.id, "alt-text-foreign"),
        (owner_id, expired.id, "alt-text-expired"),
        (owner_id, bound.id, "alt-text-bound"),
    ):
        with pytest.raises(AIServiceError) as raised:
            service.create_run(
                user_id=user_id,
                request=AIRunCreateRequest(
                    tool_id="ai_alt_text_studio",
                    input=_public_input(upload_id),
                ),
                idempotency_key=key,
            )
        failures.append(
            (raised.value.status_code, raised.value.code, raised.value.message)
        )

    assert set(failures) == {(404, "ai_upload_not_found", "Image upload not found.")}
