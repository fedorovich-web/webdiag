import io

import pytest
from PIL import Image, PngImagePlugin

from webdiag_api.ai import images
from webdiag_api.ai.images import ImageValidationError, normalize_image


def _encoded_image(
    image_format: str,
    *,
    size: tuple[int, int] = (3, 2),
    mode: str = "RGB",
    save_options: dict[str, object] | None = None,
) -> bytes:
    output = io.BytesIO()
    with Image.new(mode, size, color=1) as image:
        image.save(output, format=image_format, **(save_options or {}))
    return output.getvalue()


@pytest.mark.parametrize(
    ("image_format", "media_type"),
    (("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")),
)
def test_normalize_image_detects_and_reencodes_allowlisted_formats(
    image_format: str,
    media_type: str,
) -> None:
    original = _encoded_image(image_format)

    normalized = normalize_image(original)

    assert normalized.media_type == media_type
    assert normalized.width == 3
    assert normalized.height == 2
    assert normalized.pixel_count == 6
    assert normalized.byte_size == len(normalized.data)
    assert len(normalized.sha256) == 64
    assert normalize_image(original) == normalized
    with Image.open(io.BytesIO(normalized.data)) as decoded:
        assert decoded.format == image_format
        decoded.load()


@pytest.mark.parametrize(
    ("data", "code"),
    (
        pytest.param(b"", "image_empty", id="empty"),
        pytest.param(
            b"x" * (4 * 1024 * 1024 + 1),
            "image_too_large",
            id="encoded-over-limit",
        ),
        pytest.param(_encoded_image("BMP"), "image_invalid", id="unsupported-bmp"),
        pytest.param(_encoded_image("PNG")[:-12], "image_invalid", id="truncated-png"),
    ),
)
def test_normalize_image_rejects_invalid_encoded_input(data: bytes, code: str) -> None:
    with pytest.raises(ImageValidationError) as raised:
        normalize_image(data)

    assert raised.value.code == code


def test_normalize_image_rejects_supported_animation() -> None:
    first = Image.new("RGB", (2, 2), color="red")
    second = Image.new("RGB", (2, 2), color="blue")
    output = io.BytesIO()
    try:
        first.save(
            output,
            format="PNG",
            save_all=True,
            append_images=[second],
            duration=100,
            loop=0,
        )
    finally:
        first.close()
        second.close()

    with pytest.raises(ImageValidationError) as raised:
        normalize_image(output.getvalue())

    assert raised.value.code == "image_animation_not_allowed"


@pytest.mark.parametrize(
    ("size", "code"),
    (((8193, 1), "image_dimensions_exceeded"), ((4001, 2000), "image_pixels_exceeded")),
)
def test_normalize_image_enforces_dimensions_and_pixel_budget(
    size: tuple[int, int],
    code: str,
) -> None:
    data = _encoded_image("PNG", size=size, mode="1")

    with pytest.raises(ImageValidationError) as raised:
        normalize_image(data)

    assert raised.value.code == code


def test_normalize_image_turns_decompression_warning_into_validation_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    data = _encoded_image("PNG", size=(5, 5))
    monkeypatch.setattr(Image, "MAX_IMAGE_PIXELS", 20)

    with pytest.raises(ImageValidationError) as raised:
        normalize_image(data)

    assert raised.value.code == "image_decompression_bomb"


def test_normalize_image_applies_orientation_and_removes_jpeg_metadata() -> None:
    exif = Image.Exif()
    exif[274] = 6
    exif[270] = "private description"
    data = _encoded_image("JPEG", size=(2, 3), save_options={"exif": exif})

    normalized = normalize_image(data)

    assert (normalized.width, normalized.height) == (3, 2)
    with Image.open(io.BytesIO(normalized.data)) as decoded:
        assert len(decoded.getexif()) == 0
        assert "exif" not in decoded.info


def test_normalize_image_removes_png_text_metadata() -> None:
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("Author", "private person")
    data = _encoded_image("PNG", save_options={"pnginfo": metadata})

    normalized = normalize_image(data)

    with Image.open(io.BytesIO(normalized.data)) as decoded:
        assert "Author" not in decoded.info


def test_normalize_image_rejects_normalized_output_over_limit(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        images,
        "_encode_normalized_image",
        lambda *_args, **_kwargs: b"x" * (4 * 1024 * 1024 + 1),
    )

    with pytest.raises(ImageValidationError) as raised:
        normalize_image(_encoded_image("PNG"))

    assert raised.value.code == "image_normalized_too_large"
