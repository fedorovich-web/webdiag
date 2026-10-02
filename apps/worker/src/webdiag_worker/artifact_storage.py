from __future__ import annotations

import os
import re
import hashlib
import secrets
import tempfile
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Protocol, cast
from urllib.parse import urlsplit

import boto3
from botocore.config import Config

MAX_ARTIFACT_BYTES = 4 * 1024 * 1024
_PREFIX_PATTERN = re.compile(r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*")


class ArtifactStorageError(RuntimeError):
    pass


class ArtifactConfigurationError(ArtifactStorageError):
    pass


class ArtifactKeyError(ArtifactStorageError):
    pass


class ArtifactTooLargeError(ArtifactStorageError):
    pass


@dataclass(frozen=True, slots=True)
class StoredArtifact:
    object_key: str
    media_type: str
    byte_size: int
    sha256: str


class StreamingBody(Protocol):
    def read(self, amount: int) -> bytes: ...

    def close(self) -> None: ...


class S3Client(Protocol):
    def put_object(self, **kwargs: object) -> object: ...

    def get_object(self, **kwargs: object) -> Mapping[str, object]: ...

    def delete_object(self, **kwargs: object) -> object: ...


class ArtifactStorage(Protocol):
    def put(self, *, artifact_id: str, data: bytes, media_type: str) -> StoredArtifact: ...

    def put_reserved(
        self,
        *,
        artifact_id: str,
        object_key: str,
        data: bytes,
        media_type: str,
    ) -> StoredArtifact: ...

    def read(self, *, object_key: str, max_bytes: int) -> bytes: ...

    def delete(self, *, object_key: str) -> None: ...


class LocalArtifactStorage:
    def __init__(self, root: str | Path, *, prefix: str = "ai-uploads") -> None:
        self._root = Path(root).resolve()
        self._prefix = _normalize_prefix(prefix)
        self._root.mkdir(parents=True, exist_ok=True)

    def put(self, *, artifact_id: str, data: bytes, media_type: str) -> StoredArtifact:
        _validate_put(artifact_id=artifact_id, data=data, media_type=media_type)
        object_key = _new_object_key(self._prefix)
        return self.put_reserved(
            artifact_id=artifact_id,
            object_key=object_key,
            data=data,
            media_type=media_type,
        )

    def put_reserved(
        self,
        *,
        artifact_id: str,
        object_key: str,
        data: bytes,
        media_type: str,
    ) -> StoredArtifact:
        _validate_put(artifact_id=artifact_id, data=data, media_type=media_type)
        _validate_object_key(object_key, self._prefix)
        target = self._resolve(object_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="wb",
                dir=target.parent,
                prefix=".artifact-",
                suffix=".tmp",
                delete=False,
            ) as temporary:
                temporary_path = Path(temporary.name)
                os.chmod(temporary_path, 0o600)
                temporary.write(data)
                temporary.flush()
                os.fsync(temporary.fileno())
            os.replace(temporary_path, target)
        finally:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
        return _stored_artifact(object_key=object_key, data=data, media_type=media_type)

    def read(self, *, object_key: str, max_bytes: int) -> bytes:
        _validate_max_bytes(max_bytes)
        path = self._resolve(object_key)
        if path.stat().st_size > max_bytes:
            raise ArtifactTooLargeError("artifact exceeds read limit")
        with path.open("rb") as artifact:
            data = artifact.read(max_bytes + 1)
        if len(data) > max_bytes:
            raise ArtifactTooLargeError("artifact exceeds read limit")
        return data

    def delete(self, *, object_key: str) -> None:
        self._resolve(object_key).unlink(missing_ok=True)

    def _resolve(self, object_key: str) -> Path:
        _validate_object_key(object_key, self._prefix)
        path = self._root.joinpath(*PurePosixPath(object_key).parts).resolve(strict=False)
        if not path.is_relative_to(self._root):
            raise ArtifactKeyError("invalid artifact key")
        return path


class S3ArtifactStorage:
    def __init__(self, *, client: S3Client, bucket: str, prefix: str = "ai-uploads") -> None:
        self._client = client
        self._bucket = _validate_bucket(bucket)
        self._prefix = _normalize_prefix(prefix)

    def put(self, *, artifact_id: str, data: bytes, media_type: str) -> StoredArtifact:
        _validate_put(artifact_id=artifact_id, data=data, media_type=media_type)
        object_key = _new_object_key(self._prefix)
        return self.put_reserved(
            artifact_id=artifact_id,
            object_key=object_key,
            data=data,
            media_type=media_type,
        )

    def put_reserved(
        self,
        *,
        artifact_id: str,
        object_key: str,
        data: bytes,
        media_type: str,
    ) -> StoredArtifact:
        _validate_put(artifact_id=artifact_id, data=data, media_type=media_type)
        _validate_object_key(object_key, self._prefix)
        self._client.put_object(
            ACL="private",
            Body=data,
            Bucket=self._bucket,
            ContentLength=len(data),
            ContentType=media_type,
            Key=object_key,
        )
        return _stored_artifact(object_key=object_key, data=data, media_type=media_type)

    def read(self, *, object_key: str, max_bytes: int) -> bytes:
        _validate_max_bytes(max_bytes)
        _validate_object_key(object_key, self._prefix)
        response = self._client.get_object(Bucket=self._bucket, Key=object_key)
        body = cast(StreamingBody, response.get("Body"))
        if body is None or not callable(getattr(body, "read", None)):
            raise ArtifactStorageError("S3 response has no readable body")
        try:
            content_length = response.get("ContentLength")
            if isinstance(content_length, int) and content_length > max_bytes:
                raise ArtifactTooLargeError("artifact exceeds read limit")
            return _read_bounded(body, max_bytes=max_bytes)
        finally:
            body.close()

    def delete(self, *, object_key: str) -> None:
        _validate_object_key(object_key, self._prefix)
        self._client.delete_object(Bucket=self._bucket, Key=object_key)


def artifact_storage_from_env(
    environ: Mapping[str, str] | None = None,
    *,
    client_factory: Callable[..., S3Client] | None = None,
) -> ArtifactStorage:
    values = os.environ if environ is None else environ
    environment = values.get("WEBDIAG_ENVIRONMENT", "development").strip().casefold()
    backend = values.get("WEBDIAG_AI_ARTIFACT_STORAGE", "").strip().casefold()
    prefix = values.get("WEBDIAG_AI_ARTIFACT_PREFIX", "ai-uploads")
    if backend == "local":
        if environment == "production":
            raise ArtifactConfigurationError("production artifact storage must use S3")
        return LocalArtifactStorage(
            _required(values, "WEBDIAG_AI_ARTIFACT_LOCAL_ROOT"),
            prefix=prefix,
        )
    if backend != "s3":
        raise ArtifactConfigurationError("artifact storage backend must be local or s3")
    endpoint_url = _validate_endpoint(
        _required(values, "WEBDIAG_AI_ARTIFACT_S3_ENDPOINT_URL")
    )
    factory = boto3.client if client_factory is None else client_factory
    options: dict[str, object] = {
        "endpoint_url": endpoint_url,
        "region_name": _required(values, "WEBDIAG_AI_ARTIFACT_S3_REGION"),
        "aws_access_key_id": _required(values, "WEBDIAG_AI_ARTIFACT_S3_ACCESS_KEY_ID"),
        "aws_secret_access_key": _required(
            values, "WEBDIAG_AI_ARTIFACT_S3_SECRET_ACCESS_KEY"
        ),
        "config": Config(
            connect_timeout=5,
            proxies={},
            read_timeout=30,
            retries={"total_max_attempts": 3, "mode": "standard"},
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
    }
    session_token = values.get("WEBDIAG_AI_ARTIFACT_S3_SESSION_TOKEN", "").strip()
    if session_token:
        options["aws_session_token"] = session_token
    client = factory("s3", **options)
    return S3ArtifactStorage(
        client=client,
        bucket=_required(values, "WEBDIAG_AI_ARTIFACT_S3_BUCKET"),
        prefix=prefix,
    )


def _validate_object_key(object_key: str, prefix: str) -> None:
    if not re.fullmatch(rf"{re.escape(prefix)}/[0-9a-f]{{2}}/[0-9a-f]{{62}}", object_key):
        raise ArtifactKeyError("invalid artifact key")


def _new_object_key(prefix: str) -> str:
    token = secrets.token_hex(32)
    return f"{prefix}/{token[:2]}/{token[2:]}"


def _validate_put(*, artifact_id: str, data: bytes, media_type: str) -> None:
    if not artifact_id or len(artifact_id) > 128 or "\x00" in artifact_id:
        raise ArtifactKeyError("invalid artifact ID")
    if not data or len(data) > MAX_ARTIFACT_BYTES:
        raise ArtifactTooLargeError("artifact exceeds storage limit")
    if media_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise ArtifactStorageError("unsupported artifact media type")


def _stored_artifact(*, object_key: str, data: bytes, media_type: str) -> StoredArtifact:
    return StoredArtifact(
        object_key=object_key,
        media_type=media_type,
        byte_size=len(data),
        sha256=hashlib.sha256(data).hexdigest(),
    )


def _normalize_prefix(prefix: str) -> str:
    normalized = prefix.strip().strip("/")
    if not normalized or not _PREFIX_PATTERN.fullmatch(normalized):
        raise ArtifactConfigurationError("invalid artifact prefix")
    return normalized


def _validate_bucket(bucket: str) -> str:
    normalized = bucket.strip()
    if not re.fullmatch(r"[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]", normalized):
        raise ArtifactConfigurationError("invalid S3 bucket")
    return normalized


def _validate_max_bytes(max_bytes: int) -> None:
    if max_bytes < 1 or max_bytes > MAX_ARTIFACT_BYTES:
        raise ValueError("invalid artifact read limit")


def _read_bounded(body: StreamingBody, *, max_bytes: int) -> bytes:
    output = bytearray()
    while len(output) <= max_bytes:
        chunk = body.read(min(64 * 1024, max_bytes + 1 - len(output)))
        if not chunk:
            return bytes(output)
        output.extend(chunk)
    raise ArtifactTooLargeError("artifact exceeds read limit")


def _required(environ: Mapping[str, str], name: str) -> str:
    value = environ.get(name, "")
    if not value or value != value.strip() or "\x00" in value:
        raise ArtifactConfigurationError(f"{name} is required")
    return value


def _validate_endpoint(value: str) -> str:
    parsed = urlsplit(value)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
    ):
        raise ArtifactConfigurationError("S3 endpoint must be an HTTPS origin or path")
    return value.rstrip("/")
