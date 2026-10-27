import hashlib
import io
import os
from pathlib import Path

import pytest
from botocore.exceptions import ClientError
from webdiag_worker import artifact_storage as worker_storage
from webdiag_worker.ai import ProviderArtifactReservation
from webdiag_worker.image_output import GeneratedImage
from webdiag_worker.image_requests import persist_generated_image

from webdiag_api.ai import artifact_storage as api_storage

KEY = "ai-uploads/ab/" + "c" * 62
ARTIFACT_ID = "11111111-1111-4111-8111-111111111111"


class ConditionalS3Client:
    """Model S3's atomic If-None-Match operation without network access."""

    def __init__(self) -> None:
        self.objects: dict[str, bytes] = {}
        self.calls: list[dict[str, object]] = []

    def put_object(self, **kwargs):
        self.calls.append(kwargs)
        key = kwargs["Key"]
        if kwargs.get("IfNoneMatch") == "*" and key in self.objects:
            raise ClientError(
                {
                    "Error": {"Code": "PreconditionFailed"},
                    "ResponseMetadata": {"HTTPStatusCode": 412},
                },
                "PutObject",
            )
        self.objects[key] = kwargs["Body"]

    def get_object(self, **kwargs):
        data = self.objects[kwargs["Key"]]
        return {"Body": io.BytesIO(data), "ContentLength": len(data)}

    def delete_object(self, **kwargs):
        self.objects.pop(kwargs["Key"], None)


@pytest.mark.parametrize("module", (api_storage, worker_storage))
@pytest.mark.parametrize("already_written", (False, True))
def test_s3_revocation_blocks_late_reserved_write(module, already_written: bool) -> None:
    client = ConditionalS3Client()
    api = api_storage.S3ArtifactStorage(client=client, bucket="private-bucket")
    writer = module.S3ArtifactStorage(client=client, bucket="private-bucket")
    options = {
        "artifact_id": ARTIFACT_ID, "object_key": KEY,
        "data": b"private-image", "media_type": "image/png",
    }
    if already_written:
        writer.put_reserved(**options)
    api.revoke_reserved(object_key=KEY)
    api.revoke_reserved(object_key=KEY)

    with pytest.raises(module.ArtifactReservationUnavailableError):
        writer.put_reserved(**options)

    assert client.objects == {KEY: b""}
    with pytest.raises(module.ArtifactStorageError, match="unavailable"):
        writer.read(object_key=KEY, max_bytes=20)
    assert all(call["ACL"] == "private" for call in client.calls)


@pytest.mark.parametrize("module", (api_storage, worker_storage))
def test_local_publication_cannot_replace_a_concurrent_revocation(
    tmp_path: Path, monkeypatch, module
) -> None:
    api = api_storage.LocalArtifactStorage(tmp_path)
    writer = module.LocalArtifactStorage(tmp_path)
    real_link = os.link

    def revoke_before_publication(source, destination):
        api.revoke_reserved(object_key=KEY)
        real_link(source, destination)

    monkeypatch.setattr(os, "link", revoke_before_publication)
    with pytest.raises(module.ArtifactReservationUnavailableError):
        writer.put_reserved(
            artifact_id=ARTIFACT_ID, object_key=KEY,
            data=b"private-image", media_type="image/png",
        )
    assert (tmp_path / KEY).read_bytes() == b""
    assert not list(tmp_path.rglob("*.tmp"))
    with pytest.raises(module.ArtifactStorageError, match="unavailable"):
        writer.read(object_key=KEY, max_bytes=20)


@pytest.mark.parametrize("backend", ("local", "s3"))
def test_revoked_worker_write_preserves_typed_storage_failure_and_keeps_fence(
    tmp_path: Path, backend: str
) -> None:
    if backend == "local":
        api = api_storage.LocalArtifactStorage(tmp_path)
        writer = worker_storage.LocalArtifactStorage(tmp_path)
    else:
        client = ConditionalS3Client()
        api = api_storage.S3ArtifactStorage(client=client, bucket="private-bucket")
        writer = worker_storage.S3ArtifactStorage(client=client, bucket="private-bucket")
    api.revoke_reserved(object_key=KEY)
    reservation = ProviderArtifactReservation(artifact_id=ARTIFACT_ID, object_key=KEY)
    generated = GeneratedImage(
        data=b"private-image", media_type="image/png",
        byte_size=13, sha256=hashlib.sha256(b"private-image").hexdigest(),
    )

    with pytest.raises(worker_storage.ArtifactReservationUnavailableError, match="reservation"):
        persist_generated_image(reservation, writer, generated)

    if backend == "local":
        assert (tmp_path / KEY).read_bytes() == b""
    else:
        assert client.objects == {KEY: b""}
