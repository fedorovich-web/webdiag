import json
import hashlib
import base64
import io

import httpx
import pytest
from PIL import Image, PngImagePlugin

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
)
from webdiag_worker.openrouter_provider import OpenRouterProvider
import webdiag_worker.openrouter_provider as openrouter_provider
from webdiag_worker.image_output import normalize_generated_image


class FakeArtifactStorage:
    def __init__(self, data: bytes | BaseException) -> None:
        self.data = data
        self.reads: list[tuple[str, int]] = []
        self.writes: list[tuple[str, bytes, str]] = []

    def read(self, *, object_key: str, max_bytes: int) -> bytes:
        self.reads.append((object_key, max_bytes))
        if isinstance(self.data, BaseException):
            raise self.data
        return self.data

    def delete(self, *, object_key: str) -> None:
        raise AssertionError(object_key)

    def put(self, *, artifact_id: str, data: bytes, media_type: str):
        from webdiag_worker.artifact_storage import StoredArtifact

        self.writes.append((artifact_id, data, media_type))
        return StoredArtifact(
            object_key="ai-uploads/ab/" + "c" * 62,
            media_type=media_type,
            byte_size=len(data),
            sha256=hashlib.sha256(data).hexdigest(),
        )


def _response(
    output: dict[str, object],
    *,
    model: str = "openai/gpt-5.6-luna",
) -> dict[str, object]:
    return {
        "id": "gen_123",
        "object": "chat.completion",
        "created": 1_786_000_000,
        "model": model,
        "choices": [
            {
                "finish_reason": "stop",
                "index": 0,
                "message": {
                    "content": json.dumps(output),
                    "refusal": None,
                    "role": "assistant",
                },
            }
        ],
        "usage": {
            "prompt_tokens": 12,
            "completion_tokens": 4,
            "total_tokens": 16,
            "cost": 0.000012,
        },
    }


def _provider(handler, *, artifact_storage=None) -> OpenRouterProvider:
    client = httpx.Client(
        transport=httpx.MockTransport(handler),
        timeout=httpx.Timeout(connect=2, read=5, write=2, pool=2),
        headers={"Authorization": "Bearer test-openrouter-key"},
    )
    return OpenRouterProvider(client, artifact_storage=artifact_storage)


def _png(*, metadata: bool = False) -> bytes:
    output = io.BytesIO()
    info = None
    if metadata:
        info = PngImagePlugin.PngInfo()
        info.add_text("private", "provider-metadata")
    Image.new("RGB", (3, 2), (12, 34, 56)).save(output, format="PNG", pnginfo=info)
    return output.getvalue()


def _request(
    tool_id: str = "ai_meta_serp_studio",
    *,
    model: str = "openai/gpt-5.6-luna",
    input_value: dict[str, object] | None = None,
) -> ProviderRequest:
    return ProviderRequest(
        run_id="11111111-1111-4111-8111-111111111111",
        tool_id=tool_id,
        contract_version="v1",
        model_policy=model,
        input=input_value
        or {
            "locale": "en",
            "page_url": "https://example.com/page",
            "content": "WebDiag reports deterministic technical findings for this page.",
        },
        safety_identifier="opaque-safety-identifier-value-1234567890",
    )


def test_from_env_disables_ambient_proxy_and_ca_configuration(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_OPENROUTER_API_KEY", "test-openrouter-key")
    captured: dict[str, object] = {}

    class CapturedClient:
        def __init__(self, **kwargs: object) -> None:
            captured.update(kwargs)

        def close(self) -> None:
            return None

    monkeypatch.setattr(openrouter_provider.httpx, "Client", CapturedClient)

    with OpenRouterProvider.from_env():
        pass

    assert captured["trust_env"] is False
    assert captured["headers"] == {
        "Authorization": "Bearer test-openrouter-key",
        "Content-Type": "application/json",
    }


def test_provider_sends_private_strict_openrouter_request_and_maps_usage() -> None:
    requests: list[httpx.Request] = []
    output = {
        "variants": [
            {
                "title": f"Technical page check {index}",
                "description": f"Review deterministic page findings in variant {index}.",
                "rationale": "Uses supplied page facts only.",
            }
            for index in range(1, 4)
        ]
    }

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json=_response(output),
        )

    result = _provider(handler).execute(_request())

    assert result.output == output
    assert result.provider_request_id == "gen_123"
    assert (result.input_units, result.output_units) == (12, 4)
    assert len(requests) == 1
    sent = json.loads(requests[0].content)
    assert requests[0].url == "https://openrouter.ai/api/v1/chat/completions"
    assert requests[0].headers["authorization"] == "Bearer test-openrouter-key"
    assert sent["model"] == "openai/gpt-5.6-luna"
    assert sent["stream"] is False
    assert sent["user"] == "opaque-safety-identifier-value-1234567890"
    assert sent["max_tokens"] == 2_000
    assert sent["provider"] == {
        "allow_fallbacks": False,
        "data_collection": "deny",
        "require_parameters": True,
        "zdr": True,
    }
    output_format = sent["response_format"]
    assert output_format["type"] == "json_schema"
    assert output_format["json_schema"]["strict"] is True
    assert output_format["json_schema"]["schema"]["additionalProperties"] is False
    assert json.loads(sent["messages"][1]["content"]) == _request().input
    assert "example.com" not in sent["messages"][0]["content"]
    assert "test-openrouter-key" not in requests[0].content.decode()
    assert "http-referer" not in requests[0].headers


def test_alt_text_preparation_checks_private_object_and_sends_one_low_detail_image() -> None:
    image_data = b"normalized-png"
    storage = FakeArtifactStorage(image_data)
    requests: list[httpx.Request] = []
    output = {
        "alt_text": "Панель WebDiag со списком технических проблем",
        "decorative": False,
        "rationale": "Описание основано на видимом содержимом.",
    }

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json=_response(output))

    request = _request(
        "ai_alt_text_studio",
        input_value={
            "locale": "ru",
            "page_context": "Карточка проверки",
            "surrounding_text": None,
            "purpose": "informative",
            "image": {
                "object_key": "ai-uploads/aa/" + "b" * 62,
                "media_type": "image/png",
                "byte_size": len(image_data),
                "width": 3,
                "height": 2,
                "sha256": hashlib.sha256(image_data).hexdigest(),
            },
        },
    )
    provider = _provider(handler, artifact_storage=storage)

    prepared = provider.prepare(request)
    result = provider.execute(prepared)

    assert result.output == output
    assert storage.reads == [("ai-uploads/aa/" + "b" * 62, len(image_data))]
    sent = json.loads(requests[0].content)
    assert sent["model"] == "openai/gpt-5.6-luna"
    assert len(sent["messages"][1]["content"]) == 2
    assert sent["messages"][1]["content"][0]["type"] == "text"
    image_part = sent["messages"][1]["content"][1]
    assert image_part["type"] == "image_url"
    assert image_part["image_url"]["detail"] == "low"
    assert image_part["image_url"]["url"].startswith("data:image/png;base64,")
    assert "object_key" not in requests[0].content.decode()
    assert "unknown people" in sent["messages"][0]["content"]


def test_image_studio_uses_dedicated_gpt_image_2_api_and_stores_private_output() -> None:
    image = _png()
    storage = FakeArtifactStorage(b"")
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "created": 1_786_000_000,
                "data": [
                    {
                        "b64_json": base64.b64encode(image).decode("ascii"),
                        "media_type": "image/png",
                    }
                ],
                "usage": {"prompt_tokens": 11, "completion_tokens": 27, "total_tokens": 38},
            },
        )

    result = _provider(handler, artifact_storage=storage).execute(
        _request(
            "ai_image_studio",
            model="openai/gpt-image-2",
            input_value={
                "locale": "en",
                "prompt": "A clean product photograph on a white background.",
                "aspect_ratio": "1:1",
                "quality": "high",
                "background": "opaque",
            },
        )
    )

    assert len(requests) == 1
    assert requests[0].url == "https://openrouter.ai/api/v1/images"
    sent = json.loads(requests[0].content)
    assert sent == {
        "model": "openai/gpt-image-2",
        "prompt": "A clean product photograph on a white background.",
        "aspect_ratio": "1:1",
        "quality": "high",
        "background": "opaque",
        "n": 1,
        "provider": {"only": ["openai"], "allow_fallbacks": False},
    }
    assert len(storage.writes) == 1
    artifact_id, stored_bytes, media_type = storage.writes[0]
    expected = normalize_generated_image(image, declared_media_type="image/png")
    assert stored_bytes == expected.data and media_type == "image/png"
    assert result.output == {
        "artifact_id": artifact_id,
        "media_type": "image/png",
        "byte_size": expected.byte_size,
        "sha256": expected.sha256,
    }
    assert result.artifact is not None
    assert result.artifact.object_key == "ai-uploads/ab/" + "c" * 62
    assert (result.input_units, result.output_units) == (11, 27)


def test_image_edit_reads_owned_upload_and_sends_one_data_url_reference() -> None:
    source = b"normalized-source"
    generated = _png()
    storage = FakeArtifactStorage(source)
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "created": 1,
                "data": [{"b64_json": base64.b64encode(generated).decode(), "media_type": "image/png"}],
                "usage": {"prompt_tokens": 3, "completion_tokens": 7, "total_tokens": 10},
            },
        )

    request = _request(
        "ai_image_edit_studio",
        model="openai/gpt-image-2",
        input_value={
            "locale": "en",
            "prompt": "Remove the background and keep the product unchanged.",
            "aspect_ratio": "auto",
            "quality": "medium",
            "background": "opaque",
            "image": {
                "object_key": "ai-uploads/aa/" + "b" * 62,
                "media_type": "image/webp",
                "byte_size": len(source),
                "width": 4,
                "height": 3,
                "sha256": hashlib.sha256(source).hexdigest(),
            },
        },
    )
    provider = _provider(handler, artifact_storage=storage)

    result = provider.execute(provider.prepare(request))

    assert result.output["byte_size"] == normalize_generated_image(
        generated,
        declared_media_type="image/png",
    ).byte_size
    sent = json.loads(requests[0].content)
    assert sent["input_references"] == [
        {
            "type": "image_url",
            "image_url": {
                "url": "data:image/webp;base64," + base64.b64encode(source).decode("ascii")
            },
        }
    ]
    assert "object_key" not in requests[0].content.decode()


@pytest.mark.parametrize(
    "payload",
    (
        {"data": []},
        {"data": [{"b64_json": "***", "media_type": "image/png"}]},
        {"data": [{"b64_json": "aA==", "media_type": "image/svg+xml"}]},
        {"data": [{"b64_json": base64.b64encode(b"not-an-image").decode(), "media_type": "image/png"}]},
        {
            "data": [
                {"b64_json": base64.b64encode(b"x" * (4 * 1024 * 1024 + 1)).decode(), "media_type": "image/png"}
            ]
        },
    ),
)
def test_image_provider_rejects_invalid_success_without_retry(payload: dict[str, object]) -> None:
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(200, json={**payload, "usage": {"prompt_tokens": 1, "completion_tokens": 1}})

    with pytest.raises(ProviderOutcomeUnknownError):
        _provider(handler, artifact_storage=FakeArtifactStorage(b"")).execute(
            _request(
                "ai_image_studio",
                model="openai/gpt-image-2",
                input_value={
                    "locale": "en",
                    "prompt": "A bounded image generation prompt.",
                    "aspect_ratio": "auto",
                    "quality": "medium",
                    "background": "opaque",
                },
            )
        )
    assert calls == 1


@pytest.mark.parametrize(
    ("tool_id", "model", "input_value", "limit_name"),
    (
        (
            "ai_meta_serp_studio",
            "openai/gpt-5.6-luna",
            None,
            "_CHAT_RESPONSE_MAX_BYTES",
        ),
        (
            "ai_image_studio",
            "openai/gpt-image-2",
            {
                "locale": "en",
                "prompt": "A bounded image generation prompt.",
                "aspect_ratio": "auto",
                "quality": "medium",
                "background": "opaque",
            },
            "_IMAGE_RESPONSE_MAX_BYTES",
        ),
    ),
)
def test_provider_rejects_oversized_success_response_before_json_parsing(
    monkeypatch: pytest.MonkeyPatch,
    tool_id: str,
    model: str,
    input_value: dict[str, object] | None,
    limit_name: str,
) -> None:
    monkeypatch.setattr(openrouter_provider, limit_name, 32)
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(200, content=b'{"padding":"' + b"x" * 64 + b'"}')

    with pytest.raises(ProviderOutcomeUnknownError):
        _provider(handler, artifact_storage=FakeArtifactStorage(b"")).execute(
            _request(tool_id, model=model, input_value=input_value)
        )

    assert calls == 1


@pytest.mark.parametrize("failure", ("missing", "size", "digest"))
def test_alt_text_preparation_fails_known_safe_before_openrouter(failure: str) -> None:
    expected = b"image"
    actual: bytes | BaseException = expected
    descriptor_size = len(expected)
    descriptor_digest = hashlib.sha256(expected).hexdigest()
    if failure == "missing":
        actual = FileNotFoundError("private path")
    elif failure == "size":
        actual = b"different-size"
    else:
        descriptor_digest = "0" * 64
    storage = FakeArtifactStorage(actual)
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(500)

    provider = _provider(handler, artifact_storage=storage)
    request = _request(
        "ai_alt_text_studio",
        input_value={
            "locale": "en",
            "page_context": None,
            "surrounding_text": None,
            "purpose": "unknown",
            "image": {
                "object_key": "ai-uploads/aa/" + "b" * 62,
                "media_type": "image/png",
                "byte_size": descriptor_size,
                "width": 3,
                "height": 2,
                "sha256": descriptor_digest,
            },
        },
    )

    with pytest.raises(KnownSafeProviderError):
        provider.prepare(request)

    assert calls == 0


@pytest.mark.parametrize(
    ("tool_id", "model", "input_value", "provider_output", "expected_output"),
    (
        (
            "ai_audit_action_plan",
            "openai/gpt-5.6-luna",
            {
                "locale": "en",
                "target_origin": "https://example.com",
                "score": 70,
                "checks": [],
                "issues": [
                    {
                        "issue_id": "issue-1",
                        "category": "seo",
                        "severity": "warning",
                        "priority": "high",
                        "title": "Missing title",
                        "description": "No title was found.",
                        "affected_urls": ["https://example.com/page"],
                        "recommendation": {
                            "summary": "Add a title.",
                            "steps": ["Write a descriptive title."],
                            "expected_impact": None,
                        },
                    }
                ],
            },
            {
                "summary": "Fix the saved issue.",
                "actions": [
                    {
                        "issue_ids": ["issue-1"],
                        "title": "Add title",
                        "rationale": "The saved audit found no title.",
                        "steps": ["Write a descriptive title."],
                        "verification": "Run the deterministic title check.",
                        "affected_urls": ["https://example.com/page"],
                    }
                ],
            },
            None,
        ),
        (
            "ai_faq_studio",
            "openai/gpt-5.6-luna",
            {
                "locale": "ru",
                "source_content": "WebDiag проверяет технические сигналы страницы.",
                "audience": None,
                "question_count": 3,
            },
            {
                "items": [
                    {
                        "question": f"Вопрос {index}?",
                        "answer": "Ответ из исходного текста.",
                        "evidence": "WebDiag проверяет технические сигналы страницы.",
                    }
                    for index in range(1, 4)
                ]
            },
            None,
        ),
        (
            "ai_schema_studio",
            "openai/gpt-5.6-luna",
            {
                "locale": "en",
                "schema_type": "Organization",
                "page_url": "https://example.com/about",
                "facts": ["WebDiag", "Contact phone: +7 999 111-22-33"],
            },
            {
                "properties": [
                    {"name": "name", "value": "WebDiag", "source_fact_indexes": [0]},
                    {
                        "name": "telephone",
                        "value": "+7 999 111-22-33",
                        "source_fact_indexes": [1],
                    },
                ],
                "warnings": [],
            },
            {
                "json_ld": {
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "url": "https://example.com/about",
                    "name": "WebDiag",
                    "telephone": "+7 999 111-22-33",
                },
                "property_sources": {"/name": [0], "/telephone": [1]},
                "warnings": [],
            },
        ),
    ),
)
def test_provider_uses_tool_specific_contracts(
    tool_id: str,
    model: str,
    input_value: dict[str, object],
    provider_output: dict[str, object],
    expected_output: dict[str, object] | None,
) -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_response(provider_output, model=model))

    result = _provider(handler).execute(
        _request(tool_id, model=model, input_value=input_value)
    )

    assert result.output == (expected_output or provider_output)


@pytest.mark.parametrize("status_code", (400, 401, 402, 403, 404, 413, 422))
def test_rejected_provider_request_is_known_safe(status_code: int) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            status_code,
            request=request,
            json={
                "error": {
                    "message": "provider detail must not escape",
                    "type": "invalid_request_error",
                    "code": "invalid_request",
                }
            },
        )

    with pytest.raises(KnownSafeProviderError) as error:
        _provider(handler).execute(_request())
    assert "provider detail" not in str(error.value)


@pytest.mark.parametrize("status_code", (408, 409, 429, 500, 503))
def test_ambiguous_provider_status_is_unknown_and_never_retried(status_code: int) -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(
            status_code,
            request=request,
            json={"error": {"message": "ambiguous", "type": "server_error"}},
        )

    with pytest.raises(ProviderOutcomeUnknownError):
        _provider(handler).execute(_request())
    assert calls == 1


def test_timeout_is_unknown_and_not_retried() -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        raise httpx.ReadTimeout("provider timeout", request=request)

    with pytest.raises(ProviderOutcomeUnknownError) as error:
        _provider(handler).execute(_request())
    assert calls == 1
    assert "provider timeout" not in str(error.value)


def test_typed_refusal_is_known_safe() -> None:
    body = _response({"variants": []})
    body["choices"][0]["message"] = {
        "content": None,
        "refusal": "Cannot comply.",
        "role": "assistant",
    }

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=body)

    with pytest.raises(KnownSafeProviderError):
        _provider(handler).execute(_request())


def test_truncated_success_response_is_unknown() -> None:
    body = _response({"variants": []})
    body["choices"][0]["finish_reason"] = "length"

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=body)

    with pytest.raises(ProviderOutcomeUnknownError):
        _provider(handler).execute(_request())


def test_unknown_tool_model_or_missing_safety_id_is_rejected_before_http() -> None:
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(500)

    provider = _provider(handler)
    invalid_requests = (
        _request("ai_unknown"),
        _request(model="openai/gpt-5.6-terra"),
        ProviderRequest(
            run_id="11111111-1111-4111-8111-111111111111",
            tool_id="ai_meta_serp_studio",
            contract_version="v1",
            model_policy="openai/gpt-5.6-luna",
            input={"locale": "en"},
            safety_identifier=None,
        ),
    )
    for request in invalid_requests:
        with pytest.raises(KnownSafeProviderError):
            provider.execute(request)
    assert calls == 0
