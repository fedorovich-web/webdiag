from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass

from webdiag_api.ai.catalog import DEFAULT_AI_CATALOG, AIToolDefinition
from webdiag_api.ai.storage import (
    MAX_PROVIDER_EVALUATION_JSON_BYTES,
    ProviderEvaluationSample,
    SqliteAIStore,
)
from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    validate_output,
    validate_provider_input,
)


class ProviderEvaluationError(RuntimeError):
    pass


class ProviderEvaluationIncompleteError(ProviderEvaluationError):
    pass


@dataclass(frozen=True, slots=True)
class ProviderEvaluationReport:
    tool_id: str
    tool_contract_version: str
    model_policy: str
    sample_limit: int
    sampled_runs: int
    ru_runs: int
    en_runs: int
    input_units_total: int
    output_units_total: int
    minimum_nano_usd: int
    maximum_nano_usd: int
    p95_nano_usd: int
    total_nano_usd: int
    evidence_sha256: str
    manual_output_review_required: bool


def build_provider_evaluation_report(
    store: SqliteAIStore,
    *,
    tool_id: str,
    sample_limit: int = 100,
) -> ProviderEvaluationReport:
    definition = DEFAULT_AI_CATALOG.get(tool_id)
    if definition is None:
        raise ProviderEvaluationError("provider evaluation evidence is invalid")
    try:
        samples = store.provider_evaluation_samples(
            tool_id=tool_id,
            sample_limit=sample_limit,
        )
    except ValueError as error:
        raise ProviderEvaluationError("provider evaluation evidence is invalid") from error
    if not samples:
        raise ProviderEvaluationIncompleteError("provider evaluation evidence is incomplete")

    locales = {"ru": 0, "en": 0}
    costs: list[int] = []
    input_units_total = 0
    output_units_total = 0
    digest_rows: list[dict[str, object]] = []
    for sample in samples:
        input_value, _output_value = _validated_values(definition, sample)
        locale = input_value.get("locale")
        if locale not in locales:
            raise ProviderEvaluationError("provider evaluation evidence is invalid")
        locales[locale] += 1
        if sample.provider_cost_nano_usd is None:
            raise ProviderEvaluationIncompleteError(
                "provider evaluation evidence is incomplete"
            )
        if tool_id not in {"ai_image_studio", "ai_image_edit_studio"} and not (
            isinstance(sample.provider_request_id, str)
            and 1 <= len(sample.provider_request_id) <= 200
        ):
            raise ProviderEvaluationIncompleteError(
                "provider evaluation evidence is incomplete"
            )
        costs.append(sample.provider_cost_nano_usd)
        input_units_total += sample.input_units
        output_units_total += sample.output_units
        digest_rows.append(
            {
                "contract_version": sample.contract_version,
                "input_sha256": sample.input_sha256,
                "input_units": sample.input_units,
                "model_policy": sample.model_policy,
                "output_sha256": sample.output_sha256,
                "output_units": sample.output_units,
                "provider_cost_nano_usd": sample.provider_cost_nano_usd,
                "provider_request_id_sha256": (
                    hashlib.sha256(sample.provider_request_id.encode()).hexdigest()
                    if sample.provider_request_id is not None
                    else None
                ),
            }
        )
    if not all(locales.values()):
        raise ProviderEvaluationIncompleteError("provider evaluation evidence is incomplete")

    costs.sort()
    p95_index = ((95 * len(costs) + 99) // 100) - 1
    digest_payload = json.dumps(
        sorted(
            digest_rows,
            key=lambda row: (str(row["input_sha256"]), str(row["output_sha256"])),
        ),
        sort_keys=True,
        separators=(",", ":"),
    ).encode()
    return ProviderEvaluationReport(
        tool_id=tool_id,
        tool_contract_version=definition.contract_version,
        model_policy=definition.model_policy,
        sample_limit=sample_limit,
        sampled_runs=len(samples),
        ru_runs=locales["ru"],
        en_runs=locales["en"],
        input_units_total=input_units_total,
        output_units_total=output_units_total,
        minimum_nano_usd=costs[0],
        maximum_nano_usd=costs[-1],
        p95_nano_usd=costs[p95_index],
        total_nano_usd=sum(costs),
        evidence_sha256=hashlib.sha256(digest_payload).hexdigest(),
        manual_output_review_required=tool_id
        in {"ai_image_studio", "ai_image_edit_studio"},
    )


def _validated_values(
    definition: AIToolDefinition,
    sample: ProviderEvaluationSample,
) -> tuple[dict[str, object], dict[str, object]]:
    if (
        not isinstance(sample.input_json, str)
        or not isinstance(sample.output_json, str)
        or not 2 <= sample.input_bytes <= MAX_PROVIDER_EVALUATION_JSON_BYTES
        or not 2 <= sample.output_bytes <= MAX_PROVIDER_EVALUATION_JSON_BYTES
        or len(sample.input_json.encode()) != sample.input_bytes
        or len(sample.output_json.encode()) != sample.output_bytes
        or sample.contract_version != definition.contract_version
        or sample.model_policy != definition.model_policy
        or hashlib.sha256(sample.input_json.encode()).hexdigest() != sample.input_sha256
        or hashlib.sha256(sample.output_json.encode()).hexdigest() != sample.output_sha256
    ):
        raise ProviderEvaluationError("provider evaluation evidence is invalid")
    try:
        input_value = json.loads(sample.input_json)
        output_value = json.loads(sample.output_json)
    except json.JSONDecodeError as error:
        raise ProviderEvaluationError("provider evaluation evidence is invalid") from error
    if not isinstance(input_value, dict) or not isinstance(output_value, dict):
        raise ProviderEvaluationError("provider evaluation evidence is invalid")
    try:
        normalized_input = validate_provider_input(definition.id, input_value)
        if normalized_input != input_value:
            raise AIToolContractError("stored provider input is not canonical")
        validate_output(definition.id, normalized_input, output_value)
    except AIToolContractError as error:
        raise ProviderEvaluationError("provider evaluation evidence is invalid") from error
    return input_value, output_value
