from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum


class AIToolState(StrEnum):
    INTERNAL = "internal"
    READY = "ready"
    DISABLED = "disabled"


@dataclass(frozen=True, slots=True)
class AIToolDefinition:
    id: str
    contract_version: str
    state: AIToolState
    credit_price: int | None
    model_policy: str

    def __post_init__(self) -> None:
        if not self.id or not self.id.isascii() or not self.id.replace("_", "").isalnum():
            raise ValueError("AI tool ID is invalid")
        if not self.contract_version:
            raise ValueError("AI tool contract version is required")
        if not self.model_policy:
            raise ValueError("AI tool model policy is required")
        if isinstance(self.credit_price, bool):
            raise ValueError("AI tool credit price must be an integer")
        if self.credit_price is not None and not isinstance(self.credit_price, int):
            raise ValueError("AI tool credit price must be an integer")
        if self.state is AIToolState.READY and (
            self.credit_price is None or self.credit_price <= 0
        ):
            raise ValueError("ready AI tool requires a positive integer credit price")


class AIToolCatalog:
    def __init__(self, definitions: tuple[AIToolDefinition, ...]) -> None:
        by_id = {definition.id: definition for definition in definitions}
        if len(by_id) != len(definitions):
            raise ValueError("duplicate AI tool ID")
        self._definitions = tuple(sorted(definitions, key=lambda item: item.id))
        self._by_id = by_id

    def all(self) -> tuple[AIToolDefinition, ...]:
        return self._definitions

    def available(self) -> tuple[AIToolDefinition, ...]:
        return tuple(
            definition
            for definition in self._definitions
            if definition.state is AIToolState.READY
        )

    def get(self, tool_id: str) -> AIToolDefinition | None:
        return self._by_id.get(tool_id)


def _internal(tool_id: str, model_policy: str) -> AIToolDefinition:
    return AIToolDefinition(
        id=tool_id,
        contract_version="v1",
        state=AIToolState.INTERNAL,
        credit_price=None,
        model_policy=model_policy,
    )


DEFAULT_AI_CATALOG = AIToolCatalog(
    (
        _internal("ai_audit_action_plan", "gpt-5.6-terra"),
        _internal("ai_meta_serp_studio", "gpt-5.6-luna"),
        _internal("ai_schema_studio", "gpt-5.6-luna"),
        _internal("ai_faq_studio", "gpt-5.6-luna"),
        _internal("ai_alt_text_studio", "gpt-5.6-luna"),
        _internal("ai_content_brief", "gpt-5.6-terra"),
        _internal("ai_content_optimizer", "gpt-5.6-terra"),
        _internal("ai_search_intent_page_fit", "gpt-5.6-terra"),
        _internal("ai_competitor_gap_report", "gpt-5.6-terra"),
        _internal("ai_internal_linking_planner", "gpt-5.6-terra"),
        _internal("ai_redirect_migration_mapper", "gpt-5.6-terra"),
        _internal("ai_localization_workbench", "gpt-5.6-luna"),
        _internal("ai_regex_workbench", "gpt-5.6-luna"),
        _internal("ai_image_studio", "gpt-image-2"),
        _internal("ai_image_edit_studio", "gpt-image-2"),
    )
)
