import base64
import io

import httpx
import pytest
from PIL import Image
from test_ai_generated_artifacts import _context
from webdiag_worker.ai import ProviderArtifactReservation, ProviderRequest
from webdiag_worker.artifact_storage import LocalArtifactStorage
from webdiag_worker.cloudflare_image_provider import CloudflareImageProvider

from webdiag_api.ai.catalog import build_production_ai_catalog
from webdiag_api.ai.images import normalize_image
from webdiag_api.ai.models import AIRunCreateRequest, AIWorkerArtifact
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore


@pytest.mark.parametrize("fmt", ["JPEG", "WEBP", "PNG"])
def test_provider_image_survives_api_completion_and_owned_readback(tmp_path, fmt):
    _account, _service, api_storage, owner, _other = _context(tmp_path)
    service = AIService(
        SqliteAIStore(str(tmp_path / "generated.sqlite3")),
        catalog=build_production_ai_catalog(image_provider="cloudflare"),
        input_max_bytes=100_000,
        safety_identifier_secret="a" * 32,
    )
    run, _ = service.create_run(
        user_id=owner.response.user.id,
        idempotency_key="cf-image-test-0001",
        request=AIRunCreateRequest(
            tool_id="ai_image_studio",
            input={
                "locale": "en",
                "prompt": "A colorful synthetic gradient illustration",
                "quality": "low",
                "aspect_ratio": "1:1",
                "background": "opaque",
            },
        ),
    )
    claim = service.claim_pending()
    service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
    with Image.new("RGB", (160, 120)) as image:
        image.putdata(
            [
                ((x * 31 + y * 13) % 256, (x * 7) % 256, (y * 11) % 256)
                for y in range(120)
                for x in range(160)
            ]
        )
        encoded = io.BytesIO()
        image.save(encoded, format=fmt)
    client = httpx.Client(
        transport=httpx.MockTransport(
            lambda r: httpx.Response(
                200,
                json={
                    "success": True,
                    "result": {"image": base64.b64encode(encoded.getvalue()).decode()},
                },
            )
        )
    )
    worker_storage = LocalArtifactStorage(tmp_path / "objects")
    provider = CloudflareImageProvider(client, account_id="a" * 32, artifact_storage=worker_storage)
    request = ProviderRequest(
        run_id=run.id,
        tool_id=claim.tool_id,
        contract_version=claim.contract_version,
        model_policy=claim.model_policy,
        input=claim.input,
        safety_identifier=claim.safety_identifier,
        artifact_reservation=ProviderArtifactReservation(
            claim.artifact_reservation.artifact_id, claim.artifact_reservation.object_key
        ),
    )
    result = provider.execute(provider.prepare(request))
    data = worker_storage.read(object_key=result.artifact.object_key, max_bytes=4 * 1024 * 1024)
    assert result.artifact.media_type == "image/png"
    assert normalize_image(data).data == data
    artifact = AIWorkerArtifact(
        **{
            name: getattr(result.artifact, name)
            for name in ["artifact_id", "object_key", "media_type", "byte_size", "sha256"]
        }
    )
    completed = service.complete_run(
        run_id=run.id,
        lease_token=claim.lease_token,
        output=result.output,
        artifact=artifact,
        artifact_storage=api_storage,
        provider_cost_nano_usd=None,
        provider_request_id=result.provider_request_id,
        input_units=result.input_units,
        output_units=result.output_units,
    )
    assert completed.state == "succeeded"
    downloaded, _ = service.read_artifact(
        user_id=owner.response.user.id,
        run_id=run.id,
        artifact_id=result.artifact.artifact_id,
        artifact_storage=api_storage,
    )
    assert downloaded == data
