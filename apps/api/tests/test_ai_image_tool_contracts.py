import pytest

from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    has_tool_contract,
    validate_output,
    validate_public_input,
)


@pytest.mark.parametrize("tool_id", ("ai_image_studio", "ai_image_edit_studio"))
def test_image_tools_have_strict_contracts(tool_id: str) -> None:
    assert has_tool_contract(tool_id)


def test_image_generation_contract_is_bounded_and_canonical() -> None:
    valid = {
        "locale": "ru",
        "prompt": "Чистая предметная фотография керамической чашки на белом фоне.",
        "aspect_ratio": "1:1",
        "quality": "high",
        "background": "opaque",
    }

    assert validate_public_input("ai_image_studio", valid) == valid
    with pytest.raises(AIToolContractError):
        validate_public_input("ai_image_studio", {**valid, "n": 2})
    with pytest.raises(AIToolContractError):
        validate_public_input("ai_image_studio", {**valid, "prompt": "x" * 4_001})
    with pytest.raises(AIToolContractError):
        validate_public_input("ai_image_studio", {**valid, "aspect_ratio": "10:1"})


def test_image_edit_contract_requires_one_owned_upload_reference() -> None:
    valid = {
        "locale": "en",
        "upload_id": "11111111-1111-4111-8111-111111111111",
        "prompt": "Remove the background and keep the product shape unchanged.",
        "aspect_ratio": "auto",
        "quality": "medium",
        "background": "opaque",
    }

    assert validate_public_input("ai_image_edit_studio", valid) == valid
    with pytest.raises(AIToolContractError):
        validate_public_input(
            "ai_image_edit_studio",
            {**valid, "upload_id": "not-a-uuid"},
        )


@pytest.mark.parametrize("tool_id", ("ai_image_studio", "ai_image_edit_studio"))
def test_image_output_exposes_only_opaque_artifact_metadata(tool_id: str) -> None:
    input_value = {
        "locale": "en",
        "prompt": "A product photograph.",
        "aspect_ratio": "1:1",
        "quality": "medium",
        "background": "opaque",
    }
    if tool_id == "ai_image_edit_studio":
        input_value["upload_id"] = "11111111-1111-4111-8111-111111111111"
    output = {
        "artifact_id": "22222222-2222-4222-8222-222222222222",
        "media_type": "image/png",
        "byte_size": 1_024,
        "sha256": "a" * 64,
    }

    assert validate_output(tool_id, input_value, output) == output
    with pytest.raises(AIToolContractError):
        validate_output(tool_id, input_value, {**output, "object_key": "private/key"})
    with pytest.raises(AIToolContractError):
        validate_output(tool_id, input_value, {**output, "byte_size": 4 * 1024 * 1024 + 1})
