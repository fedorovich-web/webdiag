from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class StoredArtifact:
    object_key: str
    media_type: str
    byte_size: int
    sha256: str


class ArtifactStorage(Protocol):
    def put(self, *, run_id: str, data: bytes, media_type: str) -> StoredArtifact: ...

    def read(self, *, object_key: str, max_bytes: int) -> bytes: ...

    def delete(self, *, object_key: str) -> None: ...
