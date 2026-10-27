import base64
import hashlib
import io
from dataclasses import replace
from email.parser import BytesParser
from email.policy import default

import httpx
import pytest
from PIL import Image, PngImagePlugin

from webdiag_worker.ai import KnownSafeProviderError, ProviderOutcomeUnknownError
from webdiag_worker.artifact_storage import LocalArtifactStorage
from test_vercel_gateway_images import _request, RESERVATION

MODEL = "@cf/black-forest-labs/flux-2-klein-4b"
ACCOUNT = "a" * 32


def image_bytes(size=(24, 16), fmt="PNG"):
    out = io.BytesIO()
    with Image.new("RGB", size, "green") as image:
        meta = PngImagePlugin.PngInfo()
        meta.add_text("private", "must be stripped")
        image.save(out, format=fmt, **({"pnginfo": meta} if fmt == "PNG" else {}))
    return out.getvalue()


def provider(tmp_path, handler):
    from webdiag_worker.cloudflare_image_provider import CloudflareImageProvider

    storage = LocalArtifactStorage(tmp_path)
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return CloudflareImageProvider(
        client, account_id=ACCOUNT, artifact_storage=storage
    ), storage


def request(**changes):
    return replace(_request(model_policy=MODEL), **changes)


def parts(sent):
    msg = BytesParser(policy=default).parsebytes(
        b"Content-Type: "
        + sent.headers["content-type"].encode()
        + b"\r\n\r\n"
        + sent.content
    )
    return {
        p.get_param("name", header="content-disposition"): p.get_payload(decode=True)
        for p in msg.iter_parts()
    }


@pytest.mark.parametrize("fmt", ["PNG", "JPEG", "WEBP"])
def test_generation_uses_fixed_endpoint_and_writes_verified_private_artifact(
    tmp_path, fmt
):
    sent = []

    def handler(r):
        sent.append(r)
        return httpx.Response(
            200,
            headers={"cf-ray": "synthetic-request-id"},
            json={
                "success": True,
                "result": {"image": base64.b64encode(image_bytes(fmt=fmt)).decode()},
            },
        )

    p, storage = provider(tmp_path, handler)
    result = p.execute(p.prepare(request()))
    assert len(sent) == 1
    assert (
        str(sent[0].url)
        == f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/ai/run/{MODEL}"
    )
    assert parts(sent[0])["prompt"] == b"A green forest after rain"
    assert b"input_image_0" not in sent[0].content
    data = storage.read(object_key=RESERVATION.object_key, max_bytes=4 * 1024 * 1024)
    assert hashlib.sha256(data).hexdigest() == result.artifact.sha256
    with Image.open(io.BytesIO(data)) as image:
        assert "private" not in image.info
    assert result.output["artifact_id"] == RESERVATION.artifact_id
    assert result.provider_request_id == "synthetic-request-id"
    assert result.provider_cost_nano_usd is None


def test_editing_verifies_source_and_sends_small_image_without_metadata(tmp_path):
    sent = []
    p, storage = provider(
        tmp_path,
        lambda r: (
            sent.append(r)
            or httpx.Response(
                200,
                json={
                    "success": True,
                    "result": {"image": base64.b64encode(image_bytes()).decode()},
                },
            )
        ),
    )
    data = image_bytes(size=(1600, 1200))
    key = "ai-uploads/bb/" + "c" * 62
    storage.put_reserved(
        artifact_id=RESERVATION.artifact_id,
        object_key=key,
        data=data,
        media_type="image/png",
    )
    value = dict(
        request().input,
        image={
            "object_key": key,
            "media_type": "image/png",
            "byte_size": len(data),
            "width": 1600,
            "height": 1200,
            "sha256": hashlib.sha256(data).hexdigest(),
        },
    )
    p.execute(p.prepare(request(tool_id="ai_image_edit_studio", input=value)))
    with Image.open(io.BytesIO(parts(sent[0])["input_image_0"])) as image:
        assert max(image.size) <= 511
        assert "private" not in image.info
    assert len(sent) == 1


@pytest.mark.parametrize(
    "status,exception",
    [
        (400, KnownSafeProviderError),
        (403, KnownSafeProviderError),
        (429, KnownSafeProviderError),
        (500, ProviderOutcomeUnknownError),
        (302, ProviderOutcomeUnknownError),
    ],
)
def test_rejection_or_ambiguous_response_never_retries(tmp_path, status, exception):
    sent = []
    p, _ = provider(tmp_path, lambda r: sent.append(r) or httpx.Response(status))
    with pytest.raises(exception):
        p.execute(p.prepare(request()))
    assert len(sent) == 1


def test_timeout_never_retries(tmp_path):
    sent = []

    def handler(r):
        sent.append(r)
        raise httpx.ReadTimeout("synthetic", request=r)

    p, _ = provider(tmp_path, handler)
    with pytest.raises(ProviderOutcomeUnknownError):
        p.execute(p.prepare(request()))
    assert len(sent) == 1


def test_revoked_reservation_after_paid_generation_is_unknown_without_retry(tmp_path):
    sent = []
    p, _ = provider(
        tmp_path,
        lambda r: sent.append(r) or httpx.Response(
            200,
            json={
                "success": True,
                "result": {"image": base64.b64encode(image_bytes()).decode()},
            },
        ),
    )
    marker = tmp_path / RESERVATION.object_key
    marker.parent.mkdir(parents=True)
    marker.write_bytes(b"")

    with pytest.raises(ProviderOutcomeUnknownError):
        p.execute(p.prepare(request()))

    assert len(sent) == 1
    assert marker.read_bytes() == b""


@pytest.mark.parametrize(
    "body",
    [
        {"success": True, "result": {"image": "invalid"}},
        {"success": True, "result": {"url": "https://example.com/private.png"}},
        {
            "success": True,
            "result": {"image": base64.b64encode(b"not an image").decode()},
        },
    ],
)
def test_invalid_inline_result_is_unknown_and_never_fetches_external_urls(
    tmp_path, body
):
    sent = []
    p, _ = provider(
        tmp_path, lambda r: sent.append(r) or httpx.Response(200, json=body)
    )
    with pytest.raises(ProviderOutcomeUnknownError):
        p.execute(p.prepare(request()))
    assert len(sent) == 1


def test_wrong_model_is_rejected_before_http(tmp_path):
    sent = []
    p, _ = provider(tmp_path, lambda r: sent.append(r))
    with pytest.raises(KnownSafeProviderError):
        p.prepare(request(model_policy="openai/gpt-image-2"))
    assert not sent


@pytest.mark.parametrize(
    "aspect", ["auto", "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9"]
)
def test_resolution_changes_with_quality_and_stays_inside_provider_limits(aspect):
    from webdiag_worker.cloudflare_image_provider import image_dimensions

    sizes = [image_dimensions(aspect, quality) for quality in ["low", "medium", "high"]]
    assert all(
        256 <= side <= 1920 and side % 16 == 0 for size in sizes for side in size
    )
    assert all(a[0] * a[1] < b[0] * b[1] for a, b in zip(sizes, sizes[1:]))


@pytest.mark.parametrize(
    "name,value",
    [
        ("CLOUDFLARE_ACCOUNT_ID", "../../other-account"),
        ("CLOUDFLARE_API_TOKEN", "bad key with spaces"),
    ],
)
def test_credentials_fail_closed_without_logging_values(
    tmp_path, monkeypatch, name, value
):
    from webdiag_worker.cloudflare_image_provider import CloudflareImageProvider

    monkeypatch.setenv("CLOUDFLARE_ACCOUNT_ID", ACCOUNT)
    monkeypatch.setenv("CLOUDFLARE_API_TOKEN", "synthetic-fixture-token-00000000")
    monkeypatch.setenv(name, value)
    with pytest.raises(RuntimeError, match=name) as error:
        CloudflareImageProvider.from_env(
            artifact_storage=LocalArtifactStorage(tmp_path)
        )
    assert value not in str(error.value)


def test_corrupt_input_is_rejected_before_provider(tmp_path):
    sent = []
    p, storage = provider(tmp_path, lambda r: sent.append(r))
    data = image_bytes()
    key = "ai-uploads/bb/" + "c" * 62
    storage.put_reserved(
        artifact_id=RESERVATION.artifact_id,
        object_key=key,
        data=data,
        media_type="image/png",
    )
    value = dict(
        request().input,
        image={
            "object_key": key,
            "media_type": "image/png",
            "byte_size": len(data),
            "width": 24,
            "height": 16,
            "sha256": "0" * 64,
        },
    )
    with pytest.raises(KnownSafeProviderError, match="integrity"):
        p.prepare(request(tool_id="ai_image_edit_studio", input=value))
    assert not sent


def test_unwritable_storage_is_rejected_before_provider(tmp_path):
    from webdiag_worker.cloudflare_image_provider import CloudflareImageProvider

    sent = []
    p = CloudflareImageProvider(
        httpx.Client(transport=httpx.MockTransport(lambda r: sent.append(r))),
        account_id=ACCOUNT,
        artifact_storage=object(),
    )
    with pytest.raises(KnownSafeProviderError, match="storage"):
        p.prepare(request())
    assert not sent
