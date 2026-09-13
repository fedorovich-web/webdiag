from pathlib import Path

import pytest

from webdiag_worker.artifact_storage import (
    ArtifactKeyError,
    ArtifactTooLargeError,
    LocalArtifactStorage,
    S3ArtifactStorage,
    artifact_storage_from_env,
)


class FakeStreamingBody:
    def __init__(self, chunks: list[bytes]) -> None:
        self._chunks = chunks
        self.closed = False

    def read(self, amount: int) -> bytes:
        if not self._chunks:
            return b""
        chunk = self._chunks.pop(0)
        assert len(chunk) <= amount
        return chunk

    def close(self) -> None:
        self.closed = True


class FakeS3Client:
    def __init__(self, body: FakeStreamingBody, content_length: int | None = None) -> None:
        self.body = body
        self.content_length = content_length
        self.delete_calls: list[dict[str, object]] = []
        self.put_calls: list[dict[str, object]] = []

    def put_object(self, **kwargs: object) -> None:
        self.put_calls.append(kwargs)

    def get_object(self, **_kwargs: object) -> dict[str, object]:
        response: dict[str, object] = {"Body": self.body}
        if self.content_length is not None:
            response["ContentLength"] = self.content_length
        return response

    def delete_object(self, **kwargs: object) -> None:
        self.delete_calls.append(kwargs)


def test_worker_local_storage_reads_api_object_with_bound_and_deletes(tmp_path: Path) -> None:
    object_key = "ai-uploads/aa/" + "b" * 62
    path = tmp_path / object_key
    path.parent.mkdir(parents=True)
    path.write_bytes(b"private")
    storage = LocalArtifactStorage(tmp_path)

    assert storage.read(object_key=object_key, max_bytes=7) == b"private"
    with pytest.raises(ArtifactTooLargeError):
        storage.read(object_key=object_key, max_bytes=6)
    with pytest.raises(ArtifactKeyError):
        storage.read(object_key="../outside", max_bytes=7)

    storage.delete(object_key=object_key)
    storage.delete(object_key=object_key)
    assert not path.exists()


def test_worker_local_storage_writes_private_bounded_artifact(tmp_path: Path) -> None:
    storage = LocalArtifactStorage(tmp_path)

    stored = storage.put(
        artifact_id="11111111-1111-4111-8111-111111111111",
        data=b"generated-image",
        media_type="image/png",
    )

    assert stored.object_key.startswith("ai-uploads/")
    assert storage.read(object_key=stored.object_key, max_bytes=15) == b"generated-image"
    assert stored.byte_size == 15
    assert len(stored.sha256) == 64
    with pytest.raises(ArtifactTooLargeError):
        storage.put(artifact_id="x", data=b"x" * (4 * 1024 * 1024 + 1), media_type="image/png")


def test_worker_local_storage_writes_only_to_exact_reserved_key(tmp_path: Path) -> None:
    storage = LocalArtifactStorage(tmp_path)
    object_key = "ai-uploads/ab/" + "c" * 62

    stored = storage.put_reserved(
        artifact_id="11111111-1111-4111-8111-111111111111",
        object_key=object_key,
        data=b"private",
        media_type="image/png",
    )

    assert stored.object_key == object_key
    assert (tmp_path / object_key).read_bytes() == b"private"
    with pytest.raises(ArtifactKeyError):
        storage.put_reserved(
            artifact_id="11111111-1111-4111-8111-111111111111",
            object_key="ai-uploads/../../escape",
            data=b"private",
            media_type="image/png",
        )


def test_worker_s3_storage_counts_fragmented_body_without_content_length() -> None:
    body = FakeStreamingBody([b"12", b"34", b"5", b""])
    client = FakeS3Client(body)
    storage = S3ArtifactStorage(client=client, bucket="private-bucket", prefix="ai-uploads")
    object_key = "ai-uploads/aa/" + "b" * 62

    assert storage.read(object_key=object_key, max_bytes=5) == b"12345"
    assert body.closed


def test_worker_s3_storage_rejects_fragmented_oversize_and_closes_body() -> None:
    body = FakeStreamingBody([b"123", b"456"])
    client = FakeS3Client(body)
    storage = S3ArtifactStorage(client=client, bucket="private-bucket", prefix="ai-uploads")
    object_key = "ai-uploads/aa/" + "b" * 62

    with pytest.raises(ArtifactTooLargeError):
        storage.read(object_key=object_key, max_bytes=5)

    assert body.closed


def test_worker_s3_storage_writes_private_object() -> None:
    client = FakeS3Client(FakeStreamingBody([]))
    storage = S3ArtifactStorage(client=client, bucket="private-bucket", prefix="ai-uploads")

    stored = storage.put(
        artifact_id="11111111-1111-4111-8111-111111111111",
        data=b"image",
        media_type="image/webp",
    )

    assert client.put_calls == [
        {
            "ACL": "private",
            "Body": b"image",
            "Bucket": "private-bucket",
            "ContentLength": 5,
            "ContentType": "image/webp",
            "Key": stored.object_key,
        }
    ]


def test_worker_s3_factory_disables_ambient_proxies() -> None:
    calls: list[tuple[str, dict[str, object]]] = []
    client = FakeS3Client(FakeStreamingBody([]))

    def client_factory(service: str, **kwargs: object) -> FakeS3Client:
        calls.append((service, kwargs))
        return client

    storage = artifact_storage_from_env(
        {
            "WEBDIAG_ENVIRONMENT": "production",
            "WEBDIAG_AI_ARTIFACT_STORAGE": "s3",
            "WEBDIAG_AI_ARTIFACT_S3_ENDPOINT_URL": "https://storage.example",
            "WEBDIAG_AI_ARTIFACT_S3_BUCKET": "private-bucket",
            "WEBDIAG_AI_ARTIFACT_S3_REGION": "eu-central-1",
            "WEBDIAG_AI_ARTIFACT_S3_ACCESS_KEY_ID": "access",
            "WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY": "secret",
        },
        client_factory=client_factory,
    )

    assert isinstance(storage, S3ArtifactStorage)
    config = calls[0][1]["config"]
    assert config.proxies == {}
