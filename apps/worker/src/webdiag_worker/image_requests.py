from __future__ import annotations
import base64
import hashlib
import hmac
from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderArtifact,
    ProviderArtifactReservation,
    ProviderRequest,
)
from webdiag_worker.artifact_storage import ArtifactStorage, artifact_storage_from_env
from webdiag_worker.image_output import GeneratedImage

IMAGE_TOOLS = frozenset({"ai_image_studio", "ai_image_edit_studio"})
IMAGE_SIZES = {
    "auto": "auto",
    "1:1": "1024x1024",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
    "4:3": "1536x1152",
    "3:4": "1152x1536",
    "16:9": "1536x864",
    "9:16": "864x1536",
    "21:9": "1792x768",
}


def validate_image_request(request: ProviderRequest, *, expected_model: str) -> None:
    value = request.input
    allowed_keys = {"locale", "prompt", "aspect_ratio", "quality", "background"}
    if request.tool_id == "ai_image_edit_studio":
        allowed_keys |= {"image", "_image_data_url"}
    if (
        request.tool_id not in IMAGE_TOOLS
        or request.contract_version != "v1"
        or request.model_policy != expected_model
        or not isinstance(request.safety_identifier, str)
        or not 1 <= len(request.safety_identifier) <= 200
        or not isinstance(request.artifact_reservation, ProviderArtifactReservation)
        or not set(value) <= allowed_keys
        or any(
            not isinstance(value.get(name, default), str)
            for name, default in (
                ("locale", ""),
                ("aspect_ratio", "auto"),
                ("quality", "medium"),
                ("background", "auto"),
            )
        )
        or value.get("locale") not in {"en", "ru"}
        or not isinstance(value.get("prompt"), str)
        or not 10 <= len(value["prompt"]) <= 4_000
        or "\x00" in value["prompt"]
        or value.get("aspect_ratio", "auto") not in IMAGE_SIZES
        or value.get("quality", "medium") not in {"auto", "low", "medium", "high"}
        or value.get("background", "auto") not in {"auto", "opaque"}
    ):
        raise KnownSafeProviderError("AI image provider request was rejected locally")


def prepare_image_input(
    request: ProviderRequest, artifact_storage: ArtifactStorage | None
) -> ProviderRequest:
    descriptor = request.input.get("image")
    if not isinstance(descriptor, dict) or set(descriptor) != {
        "object_key",
        "media_type",
        "byte_size",
        "width",
        "height",
        "sha256",
    }:
        raise KnownSafeProviderError("AI image descriptor is invalid")
    object_key = descriptor.get("object_key")
    media_type = descriptor.get("media_type")
    byte_size = descriptor.get("byte_size")
    width = descriptor.get("width")
    height = descriptor.get("height")
    digest = descriptor.get("sha256")
    if (
        not isinstance(object_key, str)
        or not isinstance(media_type, str)
        or media_type not in {"image/jpeg", "image/png", "image/webp"}
        or isinstance(byte_size, bool)
        or not isinstance(byte_size, int)
        or not 1 <= byte_size <= 4 * 1024 * 1024
        or any(
            isinstance(value, bool)
            or not isinstance(value, int)
            or not 1 <= value <= 8192
            for value in (width, height)
        )
        or width * height > 8_000_000
        or not isinstance(digest, str)
        or len(digest) != 64
        or any(character not in "0123456789abcdef" for character in digest)
    ):
        raise KnownSafeProviderError("AI image descriptor is invalid")
    try:
        storage = artifact_storage or artifact_storage_from_env()
        data = storage.read(object_key=object_key, max_bytes=byte_size)
    except Exception as error:
        raise KnownSafeProviderError("AI image object is unavailable") from error
    if len(data) != byte_size or not hmac.compare_digest(
        hashlib.sha256(data).hexdigest(), digest
    ):
        raise KnownSafeProviderError("AI image object integrity check failed")
    prepared_input = {
        key: value for key, value in request.input.items() if key != "image"
    }
    encoded = base64.b64encode(data).decode("ascii")
    prepared_input["_image_data_url"] = f"data:{media_type};base64,{encoded}"
    return ProviderRequest(
        run_id=request.run_id,
        tool_id=request.tool_id,
        contract_version=request.contract_version,
        model_policy=request.model_policy,
        input=prepared_input,
        safety_identifier=request.safety_identifier,
        artifact_reservation=request.artifact_reservation,
    )


def persist_generated_image(
    reservation: ProviderArtifactReservation,
    storage: ArtifactStorage,
    generated: GeneratedImage,
) -> ProviderArtifact:
    stored = storage.put_reserved(
        artifact_id=reservation.artifact_id,
        object_key=reservation.object_key,
        data=generated.data,
        media_type=generated.media_type,
    )
    if (
        stored.object_key != reservation.object_key
        or stored.byte_size != generated.byte_size
        or stored.media_type != generated.media_type
        or not hmac.compare_digest(stored.sha256, generated.sha256)
    ):
        raise ValueError("stored image integrity check failed")
    return ProviderArtifact(
        artifact_id=reservation.artifact_id,
        object_key=stored.object_key,
        media_type=stored.media_type,
        byte_size=stored.byte_size,
        sha256=stored.sha256,
    )


def image_artifact_output(artifact: ProviderArtifact) -> dict[str, object]:
    return {
        "artifact_id": artifact.artifact_id,
        "media_type": artifact.media_type,
        "byte_size": artifact.byte_size,
        "sha256": artifact.sha256,
    }
