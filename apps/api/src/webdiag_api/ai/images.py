from __future__ import annotations

import hashlib
import io
import warnings
from dataclasses import dataclass

from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_IMAGE_SIDE = 8192
MAX_IMAGE_PIXELS = 8_000_000
ALLOWED_IMAGE_FORMATS = ("JPEG", "PNG", "WEBP")

_MEDIA_TYPES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
}


class ImageValidationError(ValueError):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


@dataclass(frozen=True, slots=True)
class NormalizedImage:
    media_type: str
    data: bytes
    byte_size: int
    width: int
    height: int
    pixel_count: int
    sha256: str


def normalize_image(data: bytes) -> NormalizedImage:
    if not data:
        raise ImageValidationError("image_empty")
    if len(data) > MAX_IMAGE_BYTES:
        raise ImageValidationError("image_too_large")

    try:
        with _reject_decompression_bombs():
            with Image.open(io.BytesIO(data), formats=list(ALLOWED_IMAGE_FORMATS)) as source:
                image_format = source.format
                if image_format not in _MEDIA_TYPES:
                    raise ImageValidationError("image_invalid")
                _validate_shape(source)
                source.verify()

            with Image.open(io.BytesIO(data), formats=[image_format]) as source:
                if source.format != image_format:
                    raise ImageValidationError("image_invalid")
                _validate_shape(source)
                source.load()
                oriented = ImageOps.exif_transpose(source)
                try:
                    oriented.load()
                    _validate_shape(oriented)
                    normalized_data = _encode_normalized_image(oriented, image_format)
                    width, height = oriented.size
                finally:
                    if oriented is not source:
                        oriented.close()
    except ImageValidationError:
        raise
    except (Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise ImageValidationError("image_decompression_bomb") from error
    except (OSError, SyntaxError, UnidentifiedImageError, ValueError) as error:
        raise ImageValidationError("image_invalid") from error

    if len(normalized_data) > MAX_IMAGE_BYTES:
        raise ImageValidationError("image_normalized_too_large")

    return NormalizedImage(
        media_type=_MEDIA_TYPES[image_format],
        data=normalized_data,
        byte_size=len(normalized_data),
        width=width,
        height=height,
        pixel_count=width * height,
        sha256=hashlib.sha256(normalized_data).hexdigest(),
    )


def _validate_shape(image: Image.Image) -> None:
    if getattr(image, "n_frames", 1) != 1:
        raise ImageValidationError("image_animation_not_allowed")
    width, height = image.size
    if width < 1 or height < 1:
        raise ImageValidationError("image_invalid")
    if width > MAX_IMAGE_SIDE or height > MAX_IMAGE_SIDE:
        raise ImageValidationError("image_dimensions_exceeded")
    if width * height > MAX_IMAGE_PIXELS:
        raise ImageValidationError("image_pixels_exceeded")


def _encode_normalized_image(image: Image.Image, image_format: str) -> bytes:
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


def _reject_decompression_bombs():
    return warnings.catch_warnings(action="error", category=Image.DecompressionBombWarning)
