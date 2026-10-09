from pathlib import Path

import pytest
from webdiag_worker.artifact_storage import artifact_storage_from_env as worker_storage_from_env

from webdiag_api.ai.artifact_storage import ArtifactConfigurationError, artifact_storage_from_env


def test_production_api_and_worker_share_private_local_artifacts(tmp_path: Path) -> None:
    environment = {
        "WEBDIAG_ENVIRONMENT": "production",
        "WEBDIAG_AI_ARTIFACT_STORAGE": "local",
        "WEBDIAG_AI_ARTIFACT_LOCAL_ROOT": str(tmp_path),
    }
    api = artifact_storage_from_env(environment)
    worker = worker_storage_from_env(environment)
    upload = api.put(artifact_id="upload", data=b"private upload", media_type="image/png")
    assert worker.read(object_key=upload.object_key, max_bytes=14) == b"private upload"
    result_key = "ai-uploads/ab/" + "c" * 62
    result = worker.put_reserved(
        artifact_id="result", object_key=result_key, data=b"private result", media_type="image/png"
    )
    assert api.read(object_key=result.object_key, max_bytes=14) == b"private result"
    assert api.read(object_key=upload.object_key, max_bytes=14) == b"private upload"
    api.delete(object_key=result.object_key)
    assert not (tmp_path / result_key).exists()


def test_production_local_storage_requires_an_absolute_persistent_path() -> None:
    environment = {
        "WEBDIAG_ENVIRONMENT": "production",
        "WEBDIAG_AI_ARTIFACT_STORAGE": "local",
        "WEBDIAG_AI_ARTIFACT_LOCAL_ROOT": "relative-artifacts",
    }
    with pytest.raises(ArtifactConfigurationError, match="absolute"):
        artifact_storage_from_env(environment)
    with pytest.raises(RuntimeError, match="absolute"):
        worker_storage_from_env(environment)
