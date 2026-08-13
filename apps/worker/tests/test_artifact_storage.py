from pathlib import Path

import pytest

from webdiag_worker.artifact_storage import (
    ArtifactKeyError,
    ArtifactTooLargeError,
    LocalArtifactStorage,
    S3ArtifactStorage,
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
