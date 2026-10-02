from __future__ import annotations

import hashlib
import io
import warnings
from dataclasses import dataclass

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_IMAGE_SIDE = 8192
MAX_IMAGE_PIXELS = 8_000_000

_FORMATS = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


class GeneratedImageError(ValueError):
    pass


@dataclass(frozen=True, slots=True)
class GeneratedImage:
    data: bytes
    media_type: str
    byte_size: int
    sha256: str


def normalize_generated_image(data: bytes, *, declared_media_type: str) -> GeneratedImage:
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise GeneratedImageError("generated image size is invalid")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data), formats=list(_FORMATS)) as source:
                image_format = source.format
                if image_format not in _FORMATS or _FORMATS[image_format] != declared_media_type:
                    raise GeneratedImageError("generated image media type is invalid")
                _validate_shape(source)
                source.verify()
            with Image.open(io.BytesIO(data), formats=[image_format]) as source:
                if source.format != image_format:
                    raise GeneratedImageError("generated image format changed")
                _validate_shape(source)
                source.load()
                oriented = ImageOps.exif_transpose(source)
                try:
                    oriented.load()
                    _validate_shape(oriented)
                    normalized = _encode(oriented, image_format)
                finally:
                    if oriented is not source:
                        oriented.close()
    except GeneratedImageError:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise GeneratedImageError("generated image exceeds pixel limits") from error
    except (OSError, SyntaxError, UnidentifiedImageError, ValueError) as error:
        raise GeneratedImageError("generated image is invalid") from error
    if len(normalized) > MAX_IMAGE_BYTES:
        raise GeneratedImageError("normalized generated image is too large")
    return GeneratedImage(
        data=normalized,
        media_type=declared_media_type,
        byte_size=len(normalized),
        sha256=hashlib.sha256(normalized).hexdigest(),
    )


def _validate_shape(image: Image.Image) -> None:
    if getattr(image, "n_frames", 1) != 1:
        raise GeneratedImageError("animated generated images are not supported")
    width, height = image.size
    if (
        width < 1
        or height < 1
        or width > MAX_IMAGE_SIDE
        or height > MAX_IMAGE_SIDE
        or width * height > MAX_IMAGE_PIXELS
    ):
        raise GeneratedImageError("generated image dimensions are invalid")


def _encode(image: Image.Image, image_format: str) -> bytes:
    has_alpha = "A" in image.getbands()
    clean = image.convert("RGBA" if has_alpha and image_format != "JPEG" else "RGB")
    clean.info.clear()
    output = io.BytesIO()
    try:
        if image_format == "JPEG":
            clean.save(output, format="JPEG", quality=90, optimize=True, progressive=False)
        elif image_format == "PNG":
            clean.save(output, format="PNG", optimize=True, compress_level=9)
        else:
            clean.save(output, format="WEBP", quality=90, method=6)
        return output.getvalue()
    finally:
        clean.close()
