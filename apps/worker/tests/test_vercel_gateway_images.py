from __future__ import annotations

import base64
import hashlib
import io
import json
from dataclasses import replace

import httpx
import pytest
from PIL import Image, PngImagePlugin

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderArtifactReservation,
    ProviderOutcomeUnknownError,
    ProviderRequest,
)
from webdiag_worker.artifact_storage import LocalArtifactStorage
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider


MODEL = "openai/gpt-image-2"
RESERVATION = ProviderArtifactReservation(
    artifact_id="11111111-1111-4111-8111-111111111111",
    object_key="ai-uploads/aa/" + "b" * 62,
)


def _image() -> bytes:
    output = io.BytesIO()
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("Comment", "private provider metadata must be stripped")
    with Image.new("RGB", (24, 16), "green") as image:
        image.save(output, format="PNG", pnginfo=metadata)
    return output.getvalue()


def _request(**changes) -> ProviderRequest:
    return replace(
        ProviderRequest(
            run_id="22222222-2222-4222-8222-222222222222",
            tool_id="ai_image_studio",
            contract_version="v1",
            model_policy=MODEL,
            input={
                "locale": "en",
                "prompt": "A green forest after rain",
                "aspect_ratio": "3:2",
                "quality": "medium",
                "background": "opaque",
            },
            safety_identifier="opaque-safety-identifier",
            artifact_reservation=RESERVATION,
        ),
        **changes,
    )


def _response() -> dict:
    return {
        "created": 1791510000,
        "data": [{"b64_json": base64.b64encode(_image()).decode()}],
        "usage": {
            "input_tokens": 25,
            "output_tokens": 1568,
            "total_tokens": 1593,
            "input_tokens_details": {"text_tokens": 25, "image_tokens": 0},
            "cost": 0.041125,
        },
    }


def _provider(tmp_path, handler):
    storage = LocalArtifactStorage(tmp_path)
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return VercelAIGatewayProvider(client, artifact_storage=storage), storage


def test_generation_posts_image_api_and_writes_normalized_reserved_artifact(tmp_path):
    sent = []

    def handler(request):
        sent.append(request)
        return httpx.Response(200, json=_response())

    provider, storage = _provider(tmp_path, handler)
    request = provider.prepare(_request())
    result = provider.execute(request)
    assert len(sent) == 1
    assert str(sent[0].url) == "https://ai-gateway.vercel.sh/v1/images/generations"
    assert json.loads(sent[0].content) == {
        "model": MODEL,
        "prompt": "A green forest after rain",
        "n": 1,
        "size": "1536x1024",
        "quality": "medium",
        "background": "opaque",
        "output_format": "png",
        "user": "opaque-safety-identifier",
    }
    assert result.input_units == 25
    assert result.output_units == 1568
    assert result.provider_cost_nano_usd == 41_125_000
    assert result.artifact.artifact_id == RESERVATION.artifact_id
    assert result.artifact.object_key == RESERVATION.object_key
    stored = storage.read(object_key=RESERVATION.object_key, max_bytes=4 * 1024 * 1024)
    assert b"private provider metadata" not in stored
    assert hashlib.sha256(stored).hexdigest() == result.output["sha256"]
    assert result.output == {
        "artifact_id": RESERVATION.artifact_id,
        "media_type": "image/png",
        "byte_size": len(stored),
        "sha256": result.artifact.sha256,
    }


def test_edit_prepares_owned_bytes_and_preserves_reservation(tmp_path):
    sent = []
    provider, storage = _provider(
        tmp_path,
        lambda request: sent.append(request) or httpx.Response(200, json=_response()),
    )
    source = storage.put(artifact_id="source", data=_image(), media_type="image/png")
    request = _request(tool_id="ai_image_edit_studio")
    request = replace(
        request,
        input={
            **request.input,
            "image": {
                "object_key": source.object_key,
                "media_type": source.media_type,
                "byte_size": source.byte_size,
                "sha256": source.sha256,
                "width": 24,
                "height": 16,
            },
        },
    )
    prepared = provider.prepare(request)
    assert prepared.artifact_reservation == RESERVATION
    result = provider.execute(prepared)
    assert result.artifact.artifact_id == RESERVATION.artifact_id
    assert str(sent[0].url) == "https://ai-gateway.vercel.sh/v1/images/edits"
    body = json.loads(sent[0].content)
    assert body["images"] == [
        {"image_url": "data:image/png;base64," + base64.b64encode(_image()).decode()}
    ]
    assert "object_key" not in sent[0].content.decode()


@pytest.mark.parametrize(
    "changes",
    [
        {"artifact_reservation": None},
        {"model_policy": "openai/gpt-image-1"},
        {"contract_version": "v2"},
        {"safety_identifier": None},
        {"input": {"prompt": "short"}},
    ],
)
def test_invalid_image_request_is_rejected_before_provider_http(tmp_path, changes):
    sent = []
    provider, _ = _provider(tmp_path, lambda request: sent.append(request))
    with pytest.raises(KnownSafeProviderError):
        provider.execute(provider.prepare(_request(**changes)))
    assert sent == []


@pytest.mark.parametrize(
    "failure", ["missing", "digest", "size", "remote", "extra", "media"]
)
def test_edit_rejects_untrusted_or_corrupt_source_before_http(tmp_path, failure):
    sent = []
    provider, storage = _provider(tmp_path, lambda request: sent.append(request))
    source = storage.put(artifact_id="source", data=_image(), media_type="image/png")
    descriptor = {
        "object_key": source.object_key,
        "media_type": source.media_type,
        "byte_size": source.byte_size,
        "sha256": source.sha256,
        "width": 24,
        "height": 16,
    }
    if failure == "missing":
        storage.delete(object_key=source.object_key)
    elif failure == "digest":
        descriptor["sha256"] = "0" * 64
    elif failure == "size":
        descriptor["byte_size"] += 1
    elif failure == "remote":
        descriptor["object_key"] = "https://attacker.invalid/source.png"
    elif failure == "media":
        descriptor["media_type"] = []
    else:
        descriptor["url"] = "https://attacker.invalid/source.png"
    request = _request(tool_id="ai_image_edit_studio")
    with pytest.raises(KnownSafeProviderError):
        provider.prepare(replace(request, input={**request.input, "image": descriptor}))
    assert sent == []


@pytest.mark.parametrize("failure", ["timeout", "transport", 500, 503, 307])
def test_ambiguous_image_submission_never_retries(tmp_path, failure):
    sent = []

    def handler(request):
        sent.append(request)
        if failure == "timeout":
            raise httpx.ReadTimeout("ambiguous", request=request)
        if failure == "transport":
            raise httpx.ReadError("ambiguous", request=request)
        return httpx.Response(failure, headers={"Location": "https://attacker.invalid"})

    provider, _ = _provider(tmp_path, handler)
    with pytest.raises(ProviderOutcomeUnknownError):
        provider.execute(provider.prepare(_request()))
    assert len(sent) == 1


@pytest.mark.parametrize(
    "failure", ["url", "base64", "oversized", "invalid_image", "usage", "model"]
)
def test_invalid_paid_image_response_is_unknown_without_artifact(tmp_path, failure):
    response = _response()
    if failure == "url":
        response["data"] = [{"url": "https://attacker.invalid/image.png"}]
    elif failure == "base64":
        response["data"] = [{"b64_json": "not base64!!!"}]
    elif failure == "oversized":
        response["data"] = [
            {"b64_json": base64.b64encode(b"x" * (4 * 1024 * 1024 + 1)).decode()}
        ]
    elif failure == "invalid_image":
        response["data"] = [{"b64_json": base64.b64encode(b"not an image").decode()}]
    elif failure == "usage":
        del response["usage"]
    else:
        response["model"] = "unapproved/model"
    provider, _ = _provider(
        tmp_path, lambda request: httpx.Response(200, json=response)
    )
    with pytest.raises(ProviderOutcomeUnknownError):
        provider.execute(provider.prepare(_request()))
    assert not (tmp_path / RESERVATION.object_key).exists()


def test_missing_optional_image_cost_keeps_verified_artifact_and_unknown_cost(tmp_path):
    response = _response()
    del response["usage"]["cost"]
    provider, storage = _provider(
        tmp_path, lambda request: httpx.Response(200, json=response)
    )
    result = provider.execute(provider.prepare(_request()))
    assert result.provider_cost_nano_usd is None
    assert result.input_units == 25
    assert result.output_units == 1568
    assert result.artifact.artifact_id == RESERVATION.artifact_id
    stored = storage.read(object_key=RESERVATION.object_key, max_bytes=4 * 1024 * 1024)
    assert hashlib.sha256(stored).hexdigest() == result.output["sha256"]


@pytest.mark.parametrize("cost", [None, True, -1, 1001, "0.01"])
def test_invalid_reported_image_cost_is_unknown_without_artifact(tmp_path, cost):
    response = _response()
    response["usage"]["cost"] = cost
    provider, _ = _provider(
        tmp_path, lambda request: httpx.Response(200, json=response)
    )
    with pytest.raises(ProviderOutcomeUnknownError):
        provider.execute(provider.prepare(_request()))
    assert not (tmp_path / RESERVATION.object_key).exists()


@pytest.mark.parametrize("status", [400, 401, 402, 403, 404, 413, 422, 429])
def test_provider_rejection_is_known_safe(tmp_path, status):
    sent = []
    provider, _ = _provider(
        tmp_path, lambda request: sent.append(request) or httpx.Response(status)
    )
    with pytest.raises(KnownSafeProviderError):
        provider.execute(provider.prepare(_request()))
    assert len(sent) == 1


@pytest.mark.parametrize("field", ["locale", "aspect_ratio", "quality", "background"])
def test_invalid_option_types_are_known_safe_before_submission(tmp_path, field):
    sent = []
    provider, _ = _provider(tmp_path, lambda request: sent.append(request))
    request = _request()
    with pytest.raises(KnownSafeProviderError):
        provider.prepare(replace(request, input={**request.input, field: []}))
    assert sent == []


@pytest.mark.parametrize(
    ("ratio", "size"),
    [
        ("auto", "auto"),
        ("1:1", "1024x1024"),
        ("3:2", "1536x1024"),
        ("2:3", "1024x1536"),
        ("4:3", "1536x1152"),
        ("3:4", "1152x1536"),
        ("16:9", "1536x864"),
        ("9:16", "864x1536"),
        ("21:9", "1792x768"),
    ],
)
def test_every_contract_aspect_ratio_requests_a_valid_image_size(tmp_path, ratio, size):
    sent = []
    provider, _ = _provider(
        tmp_path, lambda request: sent.append(request) or httpx.Response(400)
    )
    request = _request()
    with pytest.raises(KnownSafeProviderError):
        provider.execute(
            replace(request, input={**request.input, "aspect_ratio": ratio})
        )
    assert json.loads(sent[0].content)["size"] == size


def test_response_stream_is_bounded_before_decoding(tmp_path):
    class ExcessiveStream(httpx.SyncByteStream):
        def __iter__(self):
            for _ in range(130):
                yield b" " * (64 * 1024)

    sent = []
    provider, _ = _provider(
        tmp_path,
        lambda request: (
            sent.append(request) or httpx.Response(200, stream=ExcessiveStream())
        ),
    )
    with pytest.raises(ProviderOutcomeUnknownError, match="too large"):
        provider.execute(provider.prepare(_request()))
    assert len(sent) == 1
    assert not (tmp_path / RESERVATION.object_key).exists()


@pytest.mark.parametrize("failure", ["write", "integrity", "reservation"])
def test_private_storage_failure_after_paid_generation_is_unknown(
    tmp_path, monkeypatch, failure
):
    sent = []
    provider, storage = _provider(
        tmp_path,
        lambda request: sent.append(request) or httpx.Response(200, json=_response()),
    )
    original = storage.put_reserved
    if failure == "reservation":
        marker = tmp_path / RESERVATION.object_key
        marker.parent.mkdir(parents=True)
        marker.write_bytes(b"")

    def put_reserved(**kwargs):
        if failure == "write":
            raise OSError("disk unavailable")
        stored = original(**kwargs)
        return replace(stored, sha256="0" * 64) if failure == "integrity" else stored

    monkeypatch.setattr(storage, "put_reserved", put_reserved)
    with pytest.raises(ProviderOutcomeUnknownError):
        provider.execute(provider.prepare(_request()))
    assert len(sent) == 1
    if failure == "reservation":
        assert marker.read_bytes() == b""
