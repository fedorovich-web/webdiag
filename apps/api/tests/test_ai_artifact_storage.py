import hashlib
import os
from pathlib import Path

import pytest

from webdiag_api.ai.artifact_storage import (
    ArtifactConfigurationError,
    ArtifactKeyError,
    ArtifactTooLargeError,
    LocalArtifactStorage,
    S3ArtifactStorage,
    artifact_storage_from_env,
)


class FakeStreamingBody:
    def __init__(self, data: bytes) -> None:
        self._data = data
        self.closed = False

    def read(self, amount: int) -> bytes:
        chunk = self._data[:amount]
        self._data = self._data[amount:]
        return chunk

    def close(self) -> None:
        self.closed = True


class FakeS3Client:
    def __init__(self, body: FakeStreamingBody | None = None, content_length: int = 0) -> None:
        self.body = body
        self.content_length = content_length
        self.put_calls: list[dict[str, object]] = []
        self.get_calls: list[dict[str, object]] = []
        self.delete_calls: list[dict[str, object]] = []

    def put_object(self, **kwargs: object) -> None:
        self.put_calls.append(kwargs)

    def get_object(self, **kwargs: object) -> dict[str, object]:
        self.get_calls.append(kwargs)
        return {"Body": self.body, "ContentLength": self.content_length}

    def delete_object(self, **kwargs: object) -> None:
        self.delete_calls.append(kwargs)


def test_local_storage_put_is_atomic_private_and_digest_checked(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    replacements: list[tuple[Path, Path]] = []
    real_replace = os.replace

    def record_replace(source: str | os.PathLike[str], target: str | os.PathLike[str]) -> None:
        source_path = Path(source)
        target_path = Path(target)
        assert source_path.exists()
        assert not target_path.exists()
        replacements.append((source_path, target_path))
        real_replace(source_path, target_path)

    monkeypatch.setattr(os, "replace", record_replace)
    storage = LocalArtifactStorage(tmp_path)

    stored = storage.put(artifact_id="not-used-in-key", data=b"private", media_type="image/png")

    assert "not-used-in-key" not in stored.object_key
    assert stored.media_type == "image/png"
    assert stored.byte_size == 7
    assert stored.sha256 == hashlib.sha256(b"private").hexdigest()
    assert storage.read(object_key=stored.object_key, max_bytes=7) == b"private"
    assert len(replacements) == 1
    assert replacements[0][0].parent == replacements[0][1].parent
    assert not list(tmp_path.rglob("*.tmp"))


@pytest.mark.parametrize("object_key", ("../outside", "/absolute", "ai-uploads/../value"))
def test_local_storage_rejects_untrusted_object_keys(tmp_path: Path, object_key: str) -> None:
    storage = LocalArtifactStorage(tmp_path)

    with pytest.raises(ArtifactKeyError):
        storage.read(object_key=object_key, max_bytes=10)
    with pytest.raises(ArtifactKeyError):
        storage.delete(object_key=object_key)


def test_local_storage_bounds_reads_and_delete_is_idempotent(tmp_path: Path) -> None:
    storage = LocalArtifactStorage(tmp_path)
    stored = storage.put(artifact_id="upload", data=b"1234", media_type="image/jpeg")

    with pytest.raises(ArtifactTooLargeError):
        storage.read(object_key=stored.object_key, max_bytes=3)

    storage.delete(object_key=stored.object_key)
    storage.delete(object_key=stored.object_key)
    assert not (tmp_path / stored.object_key).exists()


def test_s3_storage_put_is_private_and_uses_exact_content_length() -> None:
    client = FakeS3Client()
    storage = S3ArtifactStorage(client=client, bucket="private-bucket", prefix="ai-uploads")

    stored = storage.put(artifact_id="upload", data=b"image", media_type="image/webp")

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
    assert stored.sha256 == hashlib.sha256(b"image").hexdigest()


def test_s3_storage_streams_with_a_hard_read_bound_and_closes_body() -> None:
    body = FakeStreamingBody(b"12345")
    client = FakeS3Client(body, content_length=5)
    storage = S3ArtifactStorage(client=client, bucket="private-bucket", prefix="ai-uploads")
    object_key = "ai-uploads/aa/" + "b" * 62

    assert storage.read(object_key=object_key, max_bytes=5) == b"12345"
    assert body.closed
    assert client.get_calls == [{"Bucket": "private-bucket", "Key": object_key}]

    oversized_body = FakeStreamingBody(b"123456")
    client.body = oversized_body
    client.content_length = 6
    with pytest.raises(ArtifactTooLargeError):
        storage.read(object_key=object_key, max_bytes=5)
    assert oversized_body.closed


def test_s3_delete_validates_key_and_is_idempotent_at_the_client_boundary() -> None:
    client = FakeS3Client()
    storage = S3ArtifactStorage(client=client, bucket="private-bucket", prefix="ai-uploads")
    object_key = "ai-uploads/aa/" + "b" * 62

    storage.delete(object_key=object_key)
    storage.delete(object_key=object_key)

    assert client.delete_calls == [
        {"Bucket": "private-bucket", "Key": object_key},
        {"Bucket": "private-bucket", "Key": object_key},
    ]
    with pytest.raises(ArtifactKeyError):
        storage.delete(object_key="../outside")


def test_storage_factory_rejects_local_production_and_non_https_s3(tmp_path: Path) -> None:
    with pytest.raises(ArtifactConfigurationError):
        artifact_storage_from_env(
            {"WEBDIAG_ENVIRONMENT": "production", "WEBDIAG_AI_ARTIFACT_STORAGE": "local"}
        )

    base = {
        "WEBDIAG_ENVIRONMENT": "production",
        "WEBDIAG_AI_ARTIFACT_STORAGE": "s3",
        "WEBDIAG_AI_ARTIFACT_S3_ENDPOINT_URL": "http://storage.example",
        "WEBDIAG_AI_ARTIFACT_S3_BUCKET": "private-bucket",
        "WEBDIAG_AI_ARTIFACT_S3_REGION": "us-east-1",
        "WEBDIAG_AI_ARTIFACT_S3_ACCESS_KEY_ID": "access",
        "WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY": "secret",
    }
    with pytest.raises(ArtifactConfigurationError):
        artifact_storage_from_env(base)

    local = artifact_storage_from_env(
        {
            "WEBDIAG_ENVIRONMENT": "development",
            "WEBDIAG_AI_ARTIFACT_STORAGE": "local",
            "WEBDIAG_AI_ARTIFACT_LOCAL_ROOT": str(tmp_path),
        }
    )
    assert isinstance(local, LocalArtifactStorage)


def test_storage_factory_builds_bounded_https_s3_client() -> None:
    calls: list[tuple[str, dict[str, object]]] = []
    client = FakeS3Client()

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
    assert calls[0][0] == "s3"
    assert calls[0][1]["endpoint_url"] == "https://storage.example"
    assert calls[0][1]["region_name"] == "eu-central-1"
    config = calls[0][1]["config"]
    assert config.connect_timeout == 5
    assert config.read_timeout == 30
    assert config.retries["total_max_attempts"] == 3
    assert config.proxies == {}
