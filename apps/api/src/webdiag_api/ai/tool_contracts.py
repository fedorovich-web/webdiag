from __future__ import annotations

from typing import Annotated, Literal
from urllib.parse import urlsplit

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
    field_validator,
    model_validator,
)

from webdiag_api.security.url_policy import UrlPolicyError, validate_url

Locale = Literal["ru", "en"]
NonEmptyText = Annotated[str, Field(min_length=1, max_length=2_000)]
ShortText = Annotated[str, Field(min_length=1, max_length=300)]
CanonicalUUID = Annotated[
    str,
    Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    ),
]


class AIToolContractError(ValueError):
    """An AI tool input or output does not satisfy its versioned contract."""


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


def _normalize_public_url(value: str) -> str:
    try:
        return validate_url(value).normalized
    except UrlPolicyError as error:
        raise ValueError("URL must be a canonical public HTTP(S) URL") from error


def _normalize_content_page_url(value: str) -> str:
    parsed = urlsplit(_normalize_public_url(value))
    return parsed._replace(query="", fragment="").geturl()


class AuditActionPlanInput(_StrictModel):
    locale: Locale
    project_id: str = Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )
    audit_id: str = Field(
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )


class MetaSerpInput(_StrictModel):
    locale: Locale
    page_url: str = Field(min_length=8, max_length=2_048)
    current_title: str | None = Field(default=None, min_length=1, max_length=300)
    current_description: str | None = Field(default=None, min_length=1, max_length=1_000)
    h1: str | None = Field(default=None, min_length=1, max_length=500)
    content: str = Field(min_length=20, max_length=30_000)
    primary_query: str | None = Field(default=None, min_length=1, max_length=300)
    brand: str | None = Field(default=None, min_length=1, max_length=200)

    @field_validator("page_url")
    @classmethod
    def normalize_page_url(cls, value: str) -> str:
        return _normalize_public_url(value)


class SchemaStudioInput(_StrictModel):
    locale: Locale
    schema_type: Literal["WebPage", "Article", "Organization", "LocalBusiness", "Product"]
    page_url: str = Field(min_length=8, max_length=2_048)
    facts: list[Annotated[str, Field(min_length=1, max_length=2_000)]] = Field(
        min_length=1,
        max_length=50,
    )

    @field_validator("page_url")
    @classmethod
    def normalize_page_url(cls, value: str) -> str:
        return _normalize_public_url(value)


class FAQStudioInput(_StrictModel):
    locale: Locale
    source_content: str = Field(min_length=20, max_length=40_000)
    audience: str | None = Field(default=None, min_length=1, max_length=300)
    question_count: int = Field(default=5, ge=3, le=10)


class AltTextInput(_StrictModel):
    locale: Locale
    upload_id: CanonicalUUID
    page_context: str | None = Field(default=None, min_length=1, max_length=2_000)
    surrounding_text: str | None = Field(default=None, min_length=1, max_length=2_000)
    purpose: Literal["informative", "decorative", "unknown"]

    @field_validator("page_context", "surrounding_text")
    @classmethod
    def normalize_context(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _normalize_newlines(value).strip()
        if not normalized:
            raise ValueError("context must not be empty")
        return normalized


class ContentBriefInput(_StrictModel):
    locale: Locale
    audience: str = Field(min_length=1, max_length=300)
    objective: str = Field(min_length=1, max_length=1_000)
    working_title: str | None = Field(default=None, min_length=1, max_length=300)
    facts: list[Annotated[str, Field(min_length=1, max_length=2_000)]] = Field(
        min_length=1,
        max_length=50,
    )


class ContentOptimizerInput(_StrictModel):
    locale: Locale
    page_url: str = Field(min_length=8, max_length=2_048)
    content: str = Field(min_length=20, max_length=40_000)
    target_query: str | None = Field(default=None, min_length=1, max_length=300)
    objective: str | None = Field(default=None, min_length=1, max_length=1_000)
    factual_constraints: list[
        Annotated[str, Field(min_length=1, max_length=2_000)]
    ] = Field(default_factory=list, max_length=30)

    @field_validator("page_url")
    @classmethod
    def normalize_page_url(cls, value: str) -> str:
        return _normalize_content_page_url(value)


PageType = Literal[
    "informational",
    "commercial",
    "transactional",
    "navigational",
    "local",
    "unknown",
]


class SearchIntentPageFitInput(_StrictModel):
    locale: Locale
    page_url: str = Field(min_length=8, max_length=2_048)
    primary_query: str = Field(min_length=1, max_length=300)
    intended_page_type: PageType
    page_title: str | None = Field(default=None, min_length=1, max_length=300)
    h1: str | None = Field(default=None, min_length=1, max_length=500)
    content: str = Field(min_length=20, max_length=40_000)

    @field_validator("page_url")
    @classmethod
    def normalize_page_url(cls, value: str) -> str:
        return _normalize_content_page_url(value)


class ActionPlanAction(_StrictModel):
    issue_ids: list[Annotated[str, Field(min_length=1, max_length=200)]] = Field(
        min_length=1,
        max_length=20,
    )
    title: ShortText
    rationale: NonEmptyText
    steps: list[NonEmptyText] = Field(min_length=1, max_length=12)
    verification: NonEmptyText
    affected_urls: list[Annotated[str, Field(min_length=8, max_length=2_048)]] = Field(
        default_factory=list,
        max_length=100,
    )


class AuditActionPlanOutput(_StrictModel):
    summary: str = Field(min_length=1, max_length=4_000)
    actions: list[ActionPlanAction] = Field(min_length=1, max_length=50)


class MetaVariant(_StrictModel):
    title: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=300)
    rationale: str = Field(min_length=1, max_length=1_000)


class MetaSerpOutput(_StrictModel):
    variants: list[MetaVariant] = Field(min_length=3, max_length=3)


class SchemaStudioOutput(_StrictModel):
    json_ld: dict[str, object]
    property_sources: dict[str, list[int]]
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )


class FAQItem(_StrictModel):
    question: str = Field(min_length=1, max_length=500)
    answer: str = Field(min_length=1, max_length=2_000)
    evidence: str = Field(min_length=1, max_length=1_000)


class FAQStudioOutput(_StrictModel):
    items: list[FAQItem] = Field(min_length=3, max_length=10)


class AltTextOutput(_StrictModel):
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


class BriefCoverage(_StrictModel):
    source_fact_index: int = Field(ge=0, le=49)
    excerpt: str = Field(min_length=1, max_length=1_000)


class BriefSection(_StrictModel):
    heading: str = Field(min_length=1, max_length=300)
    purpose: str = Field(min_length=1, max_length=1_000)
    coverage: list[BriefCoverage] = Field(min_length=1, max_length=10)


class ContentBriefOutput(_StrictModel):
    suggested_title: str = Field(min_length=1, max_length=300)
    sections: list[BriefSection] = Field(min_length=1, max_length=20)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )


class ContentChange(_StrictModel):
    kind: Literal["clarity", "structure", "relevance", "style"]
    before_excerpt: str = Field(min_length=1, max_length=2_000)
    after_excerpt: str = Field(min_length=1, max_length=2_000)
    rationale: str = Field(min_length=1, max_length=1_000)


class ContentOptimizerOutput(_StrictModel):
    revised_content: str = Field(min_length=20, max_length=50_000)
    changes: list[ContentChange] = Field(max_length=30)
    preserved_fact_indexes: list[int] = Field(max_length=30)
    warnings: list[Annotated[str, Field(min_length=1, max_length=1_000)]] = Field(
        max_length=20
    )


class SearchIntentPageFitOutput(_StrictModel):
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


_INPUT_MODELS: dict[str, type[_StrictModel]] = {
    "ai_audit_action_plan": AuditActionPlanInput,
    "ai_meta_serp_studio": MetaSerpInput,
    "ai_schema_studio": SchemaStudioInput,
    "ai_faq_studio": FAQStudioInput,
    "ai_alt_text_studio": AltTextInput,
    "ai_content_brief": ContentBriefInput,
    "ai_content_optimizer": ContentOptimizerInput,
    "ai_search_intent_page_fit": SearchIntentPageFitInput,
}


def has_tool_contract(tool_id: str) -> bool:
    return tool_id in _INPUT_MODELS

_SCHEMA_PROPERTIES = {
    "WebPage": frozenset({"name", "description", "url", "inLanguage"}),
    "Article": frozenset(
        {"headline", "description", "url", "inLanguage", "datePublished", "dateModified"}
    ),
    "Organization": frozenset({"name", "description", "url", "email", "telephone"}),
    "LocalBusiness": frozenset(
        {"name", "description", "url", "email", "telephone", "address"}
    ),
    "Product": frozenset({"name", "description", "url", "sku", "brand"}),
}


def _validate(model: type[_StrictModel], value: object) -> dict[str, object]:
    try:
        parsed = model.model_validate(value, strict=True)
    except (ValidationError, ValueError, TypeError) as error:
        raise AIToolContractError("AI tool contract validation failed") from error
    return parsed.model_dump(mode="json")


def validate_public_input(tool_id: str, value: object) -> dict[str, object]:
    model = _INPUT_MODELS.get(tool_id)
    if model is None:
        raise AIToolContractError("unsupported AI tool contract")
    return _validate(model, value)


def _validate_action_plan(input_value: object, output_value: object) -> dict[str, object]:
    output = _validate(AuditActionPlanOutput, output_value)
    if not isinstance(input_value, dict) or not isinstance(input_value.get("issues"), list):
        raise AIToolContractError("action-plan provider input is invalid")
    issue_urls: dict[str, set[str]] = {}
    for issue in input_value["issues"]:
        if not isinstance(issue, dict) or not isinstance(issue.get("issue_id"), str):
            raise AIToolContractError("action-plan provider input is invalid")
        urls = issue.get("affected_urls")
        if not isinstance(urls, list) or not all(isinstance(url, str) for url in urls):
            raise AIToolContractError("action-plan provider input is invalid")
        issue_urls[issue["issue_id"]] = set(urls)
    for action in output["actions"]:
        referenced = action["issue_ids"]
        if any(issue_id not in issue_urls for issue_id in referenced):
            raise AIToolContractError("action references an unknown issue")
        allowed_urls = set().union(*(issue_urls[issue_id] for issue_id in referenced))
        if any(url not in allowed_urls for url in action["affected_urls"]):
            raise AIToolContractError("action references an unknown affected URL")
    return output


def _validate_meta(output_value: object) -> dict[str, object]:
    output = _validate(MetaSerpOutput, output_value)
    for variant in output["variants"]:
        variant["title_characters"] = len(variant["title"])
        variant["description_characters"] = len(variant["description"])
    return output


def _schema_leaf_paths(value: object, path: str = "") -> dict[str, object]:
    if isinstance(value, dict):
        result: dict[str, object] = {}
        for key, child in value.items():
            escaped = key.replace("~", "~0").replace("/", "~1")
            result.update(_schema_leaf_paths(child, f"{path}/{escaped}"))
        return result
    if isinstance(value, list):
        result = {}
        for index, child in enumerate(value):
            result.update(_schema_leaf_paths(child, f"{path}/{index}"))
        return result
    return {path: value}


def _validate_schema(input_value: object, output_value: object) -> dict[str, object]:
    output = _validate(SchemaStudioOutput, output_value)
    if not isinstance(input_value, dict):
        raise AIToolContractError("schema provider input is invalid")
    schema_type = input_value.get("schema_type")
    page_url = input_value.get("page_url")
    facts = input_value.get("facts")
    if schema_type not in _SCHEMA_PROPERTIES or not isinstance(page_url, str):
        raise AIToolContractError("schema provider input is invalid")
    if not isinstance(facts, list) or not all(isinstance(fact, str) for fact in facts):
        raise AIToolContractError("schema provider input is invalid")
    json_ld = output["json_ld"]
    if json_ld.get("@context") != "https://schema.org" or json_ld.get("@type") != schema_type:
        raise AIToolContractError("schema type or context is invalid")
    if any(
        key not in {"@context", "@type"} | _SCHEMA_PROPERTIES[schema_type]
        for key in json_ld
    ):
        raise AIToolContractError("schema property is not allowlisted")
    leaves = _schema_leaf_paths(json_ld)
    constants = {"/@context": "https://schema.org", "/@type": schema_type, "/url": page_url}
    sources = output["property_sources"]
    if any(path not in leaves for path in sources):
        raise AIToolContractError("schema source points to an unknown property")
    for path, value in leaves.items():
        if path in constants and value == constants[path]:
            continue
        indexes = sources.get(path)
        if not indexes or any(index < 0 or index >= len(facts) for index in indexes):
            raise AIToolContractError("schema property is not grounded")
        rendered = str(value)
        if not any(rendered in facts[index] for index in indexes):
            raise AIToolContractError("schema value is absent from its source fact")
    return output


def _normalize_newlines(value: str) -> str:
    return value.replace("\r\n", "\n").replace("\r", "\n")


def _validate_faq(input_value: object, output_value: object) -> dict[str, object]:
    output = _validate(FAQStudioOutput, output_value)
    if not isinstance(input_value, dict):
        raise AIToolContractError("FAQ provider input is invalid")
    source = input_value.get("source_content")
    question_count = input_value.get("question_count")
    if not isinstance(source, str) or not isinstance(question_count, int):
        raise AIToolContractError("FAQ provider input is invalid")
    if len(output["items"]) != question_count:
        raise AIToolContractError("FAQ item count does not match the request")
    folded_questions = [item["question"].strip().casefold() for item in output["items"]]
    if len(set(folded_questions)) != len(folded_questions):
        raise AIToolContractError("FAQ questions must be unique")
    normalized_source = _normalize_newlines(source)
    if any(
        _normalize_newlines(item["evidence"]) not in normalized_source
        for item in output["items"]
    ):
        raise AIToolContractError("FAQ evidence is absent from source content")
    return output


def _validate_content_brief(
    input_value: object,
    output_value: object,
) -> dict[str, object]:
    output = _validate(ContentBriefOutput, output_value)
    if not isinstance(input_value, dict):
        raise AIToolContractError("content-brief provider input is invalid")
    facts = input_value.get("facts")
    if not isinstance(facts, list) or not all(isinstance(fact, str) for fact in facts):
        raise AIToolContractError("content-brief provider input is invalid")
    normalized_facts = [_normalize_newlines(fact) for fact in facts]
    for section in output["sections"]:
        for coverage in section["coverage"]:
            index = coverage["source_fact_index"]
            if index >= len(normalized_facts):
                raise AIToolContractError("content brief references an unknown source fact")
            if _normalize_newlines(coverage["excerpt"]) not in normalized_facts[index]:
                raise AIToolContractError("content brief excerpt is absent from its source fact")
    return output


def _validate_content_optimizer(
    input_value: object,
    output_value: object,
) -> dict[str, object]:
    output = _validate(ContentOptimizerOutput, output_value)
    if not isinstance(input_value, dict):
        raise AIToolContractError("content-optimizer provider input is invalid")
    original = input_value.get("content")
    constraints = input_value.get("factual_constraints")
    if not isinstance(original, str) or not isinstance(constraints, list):
        raise AIToolContractError("content-optimizer provider input is invalid")
    if not all(isinstance(fact, str) for fact in constraints):
        raise AIToolContractError("content-optimizer provider input is invalid")
    normalized_original = _normalize_newlines(original)
    normalized_revision = _normalize_newlines(output["revised_content"])
    for change in output["changes"]:
        before = _normalize_newlines(change["before_excerpt"])
        after = _normalize_newlines(change["after_excerpt"])
        if before not in normalized_original:
            raise AIToolContractError("change excerpt is absent from original content")
        if after not in normalized_revision:
            raise AIToolContractError("change excerpt is absent from revised content")
        if before == after:
            raise AIToolContractError("change excerpts must be different")
    expected_indexes = list(range(len(constraints)))
    if sorted(output["preserved_fact_indexes"]) != expected_indexes:
        raise AIToolContractError("output does not preserve all factual constraints")
    if any(_normalize_newlines(fact) not in normalized_revision for fact in constraints):
        raise AIToolContractError("output does not preserve all factual constraints")
    return output


def _validate_search_intent_page_fit(
    input_value: object,
    output_value: object,
) -> dict[str, object]:
    output = _validate(SearchIntentPageFitOutput, output_value)
    if not isinstance(input_value, dict):
        raise AIToolContractError("search-intent provider input is invalid")
    sources = [
        input_value.get("primary_query"),
        input_value.get("page_title"),
        input_value.get("h1"),
        input_value.get("content"),
    ]
    if not all(source is None or isinstance(source, str) for source in sources):
        raise AIToolContractError("search-intent provider input is invalid")
    normalized_sources = [
        _normalize_newlines(source) for source in sources if isinstance(source, str)
    ]
    evidence = [_normalize_newlines(item) for item in output["evidence"]]
    if len(set(evidence)) != len(evidence):
        raise AIToolContractError("search-intent evidence must be unique")
    if any(not any(item in source for source in normalized_sources) for item in evidence):
        raise AIToolContractError("search-intent evidence is absent from supplied page data")
    if output["inferred_intent"] == "unknown":
        if output["fit"] != "insufficient_evidence":
            raise AIToolContractError("search intent and fit are inconsistent")
    elif output["fit"] == "insufficient_evidence" or not evidence:
        raise AIToolContractError("search intent and fit are inconsistent")
    return output


def validate_output(
    tool_id: str,
    input_value: object,
    output_value: object,
) -> dict[str, object]:
    if tool_id == "ai_audit_action_plan":
        return _validate_action_plan(input_value, output_value)
    if tool_id == "ai_meta_serp_studio":
        return _validate_meta(output_value)
    if tool_id == "ai_schema_studio":
        return _validate_schema(input_value, output_value)
    if tool_id == "ai_faq_studio":
        return _validate_faq(input_value, output_value)
    if tool_id == "ai_alt_text_studio":
        return _validate(AltTextOutput, output_value)
    if tool_id == "ai_content_brief":
        return _validate_content_brief(input_value, output_value)
    if tool_id == "ai_content_optimizer":
        return _validate_content_optimizer(input_value, output_value)
    if tool_id == "ai_search_intent_page_fit":
        return _validate_search_intent_page_fit(input_value, output_value)
    raise AIToolContractError("unsupported AI tool contract")
