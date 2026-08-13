from __future__ import annotations

import json
import os
from dataclasses import dataclass

import httpx
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


_MODEL = "openai/gpt-5.6-luna"
_OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
_TOOL_POLICIES = {
    "ai_audit_action_plan": _ToolPolicy(
        model=_MODEL,
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
        model=_MODEL,
        output_model=MetaSerpOutput,
        max_output_tokens=2_000,
        instructions=(
            "Produce exactly three title and description variants using only the supplied "
            "page facts. Do not claim live SERP observation, search volume, ranking changes, "
            "or guaranteed results. Write in the locale requested by the input data."
        ),
    ),
    "ai_schema_studio": _ToolPolicy(
        model=_MODEL,
        output_model=SchemaProviderOutput,
        max_output_tokens=3_000,
        instructions=(
            "Select only factual Schema.org property values explicitly present in the "
            "numbered source facts. Return each property with its zero-based source fact "
            "indexes. Do not invent identity, price, offer, rating, review, or contact data."
        ),
    ),
    "ai_faq_studio": _ToolPolicy(
        model=_MODEL,
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

_KNOWN_REJECTED_STATUS_CODES = frozenset({400, 401, 402, 403, 404, 413, 422})


class OpenRouterProvider:
    def __init__(self, client: httpx.Client) -> None:
        self._client = client

    @classmethod
    def from_env(cls) -> OpenRouterProvider:
        api_key = os.getenv("WEBDIAG_OPENROUTER_API_KEY", "")
        if (
            not api_key
            or len(api_key) > 512
            or any(character.isspace() or not character.isascii() for character in api_key)
        ):
            raise RuntimeError(
                "WEBDIAG_OPENROUTER_API_KEY is required and must be visible ASCII"
            )
        timeout = httpx.Timeout(
            connect=_bounded_timeout("WEBDIAG_OPENROUTER_CONNECT_TIMEOUT_SECONDS", 5),
            read=_bounded_timeout("WEBDIAG_OPENROUTER_READ_TIMEOUT_SECONDS", 120),
            write=_bounded_timeout("WEBDIAG_OPENROUTER_WRITE_TIMEOUT_SECONDS", 10),
            pool=_bounded_timeout("WEBDIAG_OPENROUTER_POOL_TIMEOUT_SECONDS", 5),
        )
        return cls(
            httpx.Client(
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=timeout,
            )
        )

    def __enter__(self) -> OpenRouterProvider:
        return self

    def __exit__(self, *_args: object) -> None:
        self._client.close()

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
            response = self._client.post(
                _OPENROUTER_CHAT_URL,
                json={
                    "model": policy.model,
                    "messages": [
                        {"role": "system", "content": policy.instructions},
                        {
                            "role": "user",
                            "content": json.dumps(
                                request.input,
                                ensure_ascii=False,
                                sort_keys=True,
                                separators=(",", ":"),
                            ),
                        },
                    ],
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "name": request.tool_id,
                            "strict": True,
                            "schema": policy.output_model.model_json_schema(),
                        },
                    },
                    "max_tokens": policy.max_output_tokens,
                    "reasoning_effort": "low",
                    "stream": False,
                    "user": request.safety_identifier,
                    "provider": {
                        "allow_fallbacks": False,
                        "data_collection": "deny",
                        "require_parameters": True,
                        "zdr": True,
                    },
                },
            )
        except (httpx.TimeoutException, httpx.TransportError) as error:
            raise ProviderOutcomeUnknownError("AI provider outcome is unknown") from error
        if response.status_code in _KNOWN_REJECTED_STATUS_CODES:
            raise KnownSafeProviderError("AI provider rejected the request")
        if response.status_code != 200:
            raise ProviderOutcomeUnknownError("AI provider outcome is unknown")
        try:
            body = response.json()
            parsed = _parsed_output(body, policy.output_model)
            provider_request_id = _provider_request_id(body)
            input_units, output_units = _provider_usage(body)
        except KnownSafeProviderError:
            raise
        except (ValueError, TypeError, KeyError, IndexError, json.JSONDecodeError) as error:
            raise ProviderOutcomeUnknownError("AI provider response is invalid") from error
        output = parsed.model_dump(mode="json")
        if request.tool_id == "ai_schema_studio":
            output = _schema_output(request.input, output)
        return ProviderResult(
            output=output,
            provider_request_id=provider_request_id,
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


def _parsed_output(body: object, output_model: type[BaseModel]) -> BaseModel:
    if not isinstance(body, dict):
        raise ValueError("invalid provider response")
    choices = body.get("choices")
    if not isinstance(choices, list) or len(choices) != 1:
        raise ValueError("invalid provider choices")
    choice = choices[0]
    if not isinstance(choice, dict):
        raise ValueError("invalid provider choice")
    message = choice.get("message")
    if not isinstance(message, dict):
        raise ValueError("invalid provider message")
    refusal = message.get("refusal")
    if isinstance(refusal, str) and refusal:
        raise KnownSafeProviderError("AI provider refused the request")
    if choice.get("finish_reason") != "stop":
        raise ValueError("invalid provider finish reason")
    content = message.get("content")
    if not isinstance(content, str) or not content:
        raise ValueError("invalid provider content")
    return output_model.model_validate_json(content)


def _provider_request_id(body: object) -> str:
    if not isinstance(body, dict):
        raise ValueError("invalid provider response")
    value = body.get("id")
    if not isinstance(value, str) or not 1 <= len(value) <= 200:
        raise ValueError("invalid provider generation ID")
    return value


def _provider_usage(body: object) -> tuple[int, int]:
    if not isinstance(body, dict):
        raise ValueError("invalid provider response")
    usage = body.get("usage")
    if not isinstance(usage, dict):
        raise ValueError("invalid provider usage")
    values = (usage.get("prompt_tokens"), usage.get("completion_tokens"))
    if any(
        isinstance(value, bool) or not isinstance(value, int) or not 0 <= value <= 1_000_000_000
        for value in values
    ):
        raise ValueError("invalid provider usage")
    return values


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
