from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


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


class AltTextOutput(StrictProviderOutput):
    alt_text: str = Field(max_length=300)
    decorative: bool
    rationale: str = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def enforce_decorative_invariant(self):
        if self.decorative and self.alt_text:
            raise ValueError("decorative image alt text must be empty")
        if not self.decorative and not self.alt_text:
            raise ValueError("informative image alt text must not be empty")
        return self


class SchemaProperty(StrictProviderOutput):
    name: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=2_000)
    source_fact_indexes: list[int] = Field(min_length=1, max_length=10)


class SchemaProviderOutput(StrictProviderOutput):
    properties: list[SchemaProperty] = Field(max_length=30)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )


class BriefCoverage(StrictProviderOutput):
    source_fact_index: int = Field(ge=0, le=49)
    excerpt: str = Field(min_length=1, max_length=1_000)


class BriefSection(StrictProviderOutput):
    heading: str = Field(min_length=1, max_length=300)
    purpose: str = Field(min_length=1, max_length=1_000)
    coverage: list[BriefCoverage] = Field(min_length=1, max_length=10)


class ContentBriefOutput(StrictProviderOutput):
    suggested_title: str = Field(min_length=1, max_length=300)
    sections: list[BriefSection] = Field(min_length=1, max_length=20)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )


class ContentChange(StrictProviderOutput):
    kind: Literal["clarity", "structure", "relevance", "style"]
    before_excerpt: str = Field(min_length=1, max_length=2_000)
    after_excerpt: str = Field(min_length=1, max_length=2_000)
    rationale: str = Field(min_length=1, max_length=1_000)


class ContentOptimizerOutput(StrictProviderOutput):
    revised_content: str = Field(min_length=20, max_length=50_000)
    changes: list[ContentChange] = Field(max_length=30)
    preserved_fact_indexes: list[int] = Field(max_length=30)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )


PageType = Literal[
    "informational",
    "commercial",
    "transactional",
    "navigational",
    "local",
    "unknown",
]


class SearchIntentPageFitOutput(StrictProviderOutput):
    inferred_intent: PageType
    confidence: Literal["low", "medium", "high"]
    fit: Literal["aligned", "partial", "misaligned", "insufficient_evidence"]
    evidence: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=10
    )
    gaps: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )
    recommendations: list[
        Annotated[str, Field(min_length=1, max_length=1_000)]
    ] = Field(max_length=20)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )
