from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class StrictProviderOutput(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class ActionPlanAction(StrictProviderOutput):
    issue_ids: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(
        min_length=1,
        max_length=20,
    )
    title: str = Field(min_length=1, max_length=300)
    rationale: str = Field(min_length=1, max_length=2_000)
    steps: list[Annotated[str, Field(min_length=1, max_length=2_000)]] = Field(
        min_length=1,
        max_length=12,
    )
    verification: str = Field(min_length=1, max_length=2_000)
    affected_urls: list[Annotated[str, Field(min_length=8, max_length=2_048)]] = Field(
        max_length=100
    )


class AuditActionPlanOutput(StrictProviderOutput):
    summary: str = Field(min_length=1, max_length=4_000)
    actions: list[ActionPlanAction] = Field(min_length=1, max_length=50)


class MetaVariant(StrictProviderOutput):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=300)
    rationale: str = Field(min_length=1, max_length=1_000)


class MetaSerpOutput(StrictProviderOutput):
    variants: list[MetaVariant] = Field(min_length=3, max_length=3)


class FAQItem(StrictProviderOutput):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=2_000)
    evidence: str = Field(min_length=1, max_length=1_000)


class FAQStudioOutput(StrictProviderOutput):
    items: list[FAQItem] = Field(min_length=3, max_length=10)


class SchemaProperty(StrictProviderOutput):
    name: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=2_000)
    source_fact_indexes: list[int] = Field(min_length=1, max_length=10)


class SchemaProviderOutput(StrictProviderOutput):
    properties: list[SchemaProperty] = Field(max_length=30)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )
