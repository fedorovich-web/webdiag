from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any

import httpx
from openai import (
    APIConnectionError,
    APIResponseValidationError,
    APIStatusError,
    APITimeoutError,
    OpenAI,
)
from pydantic import BaseModel

from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderOutcomeUnknownError,
    ProviderRequest,
    ProviderResult,
)
from webdiag_worker.tool_contracts import (
    AuditActionPlanOutput,
    FAQStudioOutput,
    MetaSerpOutput,
    SchemaProviderOutput,
)


@dataclass(frozen=True, slots=True)
class _ToolPolicy:
    model: str
    output_model: type[BaseModel]
    max_output_tokens: int
    instructions: str


_TOOL_POLICIES = {
    "ai_audit_action_plan": _ToolPolicy(
        model="gpt-5.6-terra",
        output_model=AuditActionPlanOutput,
        max_output_tokens=4_000,
        instructions=(
            "You produce a correction plan only from the supplied immutable WebDiag audit "
            "snapshot. Reference only supplied issue IDs and affected URLs. Do not invent "
            "measurements, reruns, traffic, rankings, incidents, or external evidence. "
            "Write in the locale requested by the input data."
        ),
    ),
    "ai_meta_serp_studio": _ToolPolicy(
        model="gpt-5.6-luna",
        output_model=MetaSerpOutput,
        max_output_tokens=2_000,
        instructions=(
            "Produce exactly three title and description variants using only the supplied "
            "page facts. Do not claim live SERP observation, search volume, ranking changes, "
            "or guaranteed results. Write in the locale requested by the input data."
        ),
    ),
    "ai_schema_studio": _ToolPolicy(
        model="gpt-5.6-luna",
        output_model=SchemaProviderOutput,
        max_output_tokens=3_000,
        instructions=(
            "Select only factual Schema.org property values explicitly present in the "
            "numbered source facts. Return each property with its zero-based source fact "
            "indexes. Do not invent identity, price, offer, rating, review, or contact data."
        ),
    ),
    "ai_faq_studio": _ToolPolicy(
        model="gpt-5.6-luna",
        output_model=FAQStudioOutput,
        max_output_tokens=3_000,
        instructions=(
            "Create the requested number of unique FAQ items grounded only in the supplied "
            "source content. Every evidence field must be an exact source substring. Do not "
            "claim live SERP, People Also Ask, search volume, rankings, or external evidence. "
            "Write in the locale requested by the input data."
        ),
    ),
}

_KNOWN_REJECTED_STATUS_CODES = frozenset({400, 401, 403, 404, 422})


class OpenAIProvider:
    def __init__(self, client: OpenAI) -> None:
        self._client = client

    @classmethod
    def from_env(cls, *, http_client: httpx.Client | None = None) -> OpenAIProvider:
        api_key = os.getenv("WEBDIAG_OPENAI_API_KEY", "")
        if (
            not api_key
            or len(api_key) > 512
            or any(character.isspace() or not character.isascii() for character in api_key)
        ):
            raise RuntimeError("WEBDIAG_OPENAI_API_KEY is required and must be visible ASCII")
        timeout = httpx.Timeout(
            connect=_bounded_timeout("WEBDIAG_OPENAI_CONNECT_TIMEOUT_SECONDS", 5),
            read=_bounded_timeout("WEBDIAG_OPENAI_READ_TIMEOUT_SECONDS", 120),
            write=_bounded_timeout("WEBDIAG_OPENAI_WRITE_TIMEOUT_SECONDS", 10),
            pool=_bounded_timeout("WEBDIAG_OPENAI_POOL_TIMEOUT_SECONDS", 5),
        )
        return cls(
            OpenAI(
                api_key=api_key,
                timeout=timeout,
                max_retries=0,
                http_client=http_client,
            )
        )

    def execute(self, request: ProviderRequest) -> ProviderResult:
        policy = _TOOL_POLICIES.get(request.tool_id)
        if (
            policy is None
            or request.contract_version != "v1"
            or request.model_policy != policy.model
            or request.safety_identifier is None
        ):
            raise KnownSafeProviderError("AI provider request was rejected locally")
        try:
            response = self._client.responses.create(
                model=policy.model,
                instructions=policy.instructions,
                input=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": json.dumps(
                                    request.input,
                                    ensure_ascii=False,
                                    sort_keys=True,
                                    separators=(",", ":"),
                                ),
                            }
                        ],
                    }
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": request.tool_id,
                        "strict": True,
                        "schema": policy.output_model.model_json_schema(),
                    }
                },
                max_output_tokens=policy.max_output_tokens,
                reasoning={"effort": "low"},
                safety_identifier=request.safety_identifier,
                store=False,
                parallel_tool_calls=False,
            )
        except APIStatusError as error:
            if error.status_code in _KNOWN_REJECTED_STATUS_CODES:
                raise KnownSafeProviderError("AI provider rejected the request") from error
            raise ProviderOutcomeUnknownError("AI provider outcome is unknown") from error
        except (APITimeoutError, APIConnectionError, APIResponseValidationError) as error:
            raise ProviderOutcomeUnknownError("AI provider outcome is unknown") from error
        except (ValueError, TypeError) as error:
            raise ProviderOutcomeUnknownError("AI provider response is invalid") from error

        if response.status != "completed":
            raise KnownSafeProviderError("AI provider did not complete the response")
        try:
            parsed = _parsed_output(response, policy.output_model)
        except KnownSafeProviderError:
            raise
        except (ValueError, TypeError) as error:
            raise ProviderOutcomeUnknownError("AI provider response is invalid") from error
        output = parsed.model_dump(mode="json")
        if request.tool_id == "ai_schema_studio":
            output = _schema_output(request.input, output)
        usage = response.usage
        input_units = usage.input_tokens if usage is not None else 0
        output_units = usage.output_tokens if usage is not None else 0
        return ProviderResult(
            output=output,
            provider_request_id=getattr(response, "_request_id", None),
            input_units=input_units,
            output_units=output_units,
        )


def _bounded_timeout(name: str, default: int) -> int:
    raw = os.getenv(name, str(default))
    try:
        value = int(raw)
    except ValueError as error:
        raise RuntimeError(f"{name} must be an integer") from error
    if not 1 <= value <= 600:
        raise RuntimeError(f"{name} must be between 1 and 600 seconds")
    return value


def _parsed_output(response: Any, output_model: type[BaseModel]) -> BaseModel:
    for item in response.output:
        if item.type != "message":
            continue
        for content in item.content:
            if content.type == "refusal":
                raise KnownSafeProviderError("AI provider refused the request")
            if content.type == "output_text":
                return output_model.model_validate_json(content.text)
    raise ProviderOutcomeUnknownError("AI provider response is invalid")


def _schema_output(
    input_value: dict[str, object],
    provider_output: dict[str, object],
) -> dict[str, object]:
    schema_type = input_value.get("schema_type")
    page_url = input_value.get("page_url")
    properties = provider_output.get("properties")
    warnings = provider_output.get("warnings")
    if not isinstance(schema_type, str) or not isinstance(page_url, str):
        raise ProviderOutcomeUnknownError("AI provider input is invalid")
    if not isinstance(properties, list) or not isinstance(warnings, list):
        raise ProviderOutcomeUnknownError("AI provider response is invalid")
    json_ld: dict[str, object] = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "url": page_url,
    }
    sources: dict[str, list[int]] = {}
    for item in properties:
        if not isinstance(item, dict):
            raise ProviderOutcomeUnknownError("AI provider response is invalid")
        name = item.get("name")
        value = item.get("value")
        indexes = item.get("source_fact_indexes")
        if not isinstance(name, str) or not isinstance(value, str) or not isinstance(indexes, list):
            raise ProviderOutcomeUnknownError("AI provider response is invalid")
        if name in json_ld:
            raise ProviderOutcomeUnknownError("AI provider response contains duplicate properties")
        json_ld[name] = value
        escaped = name.replace("~", "~0").replace("/", "~1")
        sources[f"/{escaped}"] = indexes
    return {"json_ld": json_ld, "property_sources": sources, "warnings": warnings}
