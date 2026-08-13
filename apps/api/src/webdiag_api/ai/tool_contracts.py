from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from webdiag_api.security.url_policy import UrlPolicyError, validate_url

Locale = Literal["ru", "en"]
NonEmptyText = Annotated[str, Field(min_length=1, max_length=2_000)]
ShortText = Annotated[str, Field(min_length=1, max_length=300)]


class AIToolContractError(ValueError):
    """An AI tool input or output does not satisfy its versioned contract."""


class _StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


def _normalize_public_url(value: str) -> str:
    try:
        return validate_url(value).normalized
    except UrlPolicyError as error:
        raise ValueError("URL must be a canonical public HTTP(S) URL") from error


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


_INPUT_MODELS: dict[str, type[_StrictModel]] = {
    "ai_audit_action_plan": AuditActionPlanInput,
    "ai_meta_serp_studio": MetaSerpInput,
    "ai_schema_studio": SchemaStudioInput,
    "ai_faq_studio": FAQStudioInput,
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
    raise AIToolContractError("unsupported AI tool contract")
