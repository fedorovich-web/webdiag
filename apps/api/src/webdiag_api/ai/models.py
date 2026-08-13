from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class StrictAIModel(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class AIToolResponse(StrictAIModel):
    id: str
    contract_version: str
    credit_price: int = Field(gt=0)


class AICatalogResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.catalog.v1"] = "webdiag.ai.catalog.v1"
    tools: tuple[AIToolResponse, ...]


class AIImageUploadResponseItem(StrictAIModel):
    id: str
    media_type: Literal["image/jpeg", "image/png", "image/webp"]
    byte_size: int = Field(ge=1, le=4 * 1024 * 1024)
    width: int = Field(ge=1, le=8192)
    height: int = Field(ge=1, le=8192)
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    created_at: datetime
    expires_at: datetime


class AIImageUploadResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.upload.v1"] = "webdiag.ai.upload.v1"
    upload: AIImageUploadResponseItem


class AIRunCreateRequest(StrictAIModel):
    tool_id: str = Field(min_length=1, max_length=80)
    input: dict[str, object]


class AIRunResponse(StrictAIModel):
    id: str
    tool_id: str
    contract_version: str
    credit_price: int = Field(gt=0)
    state: Literal["pending", "running", "succeeded", "failed", "provider_unknown", "deleted"]
    output: dict[str, object] | None = None
    error_code: str | None = None
    created_at: datetime
    updated_at: datetime


class AIRunDetailResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.run.v1"] = "webdiag.ai.run.v1"
    run: AIRunResponse


class AIRunListResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.run_list.v1"] = "webdiag.ai.run_list.v1"
    runs: tuple[AIRunResponse, ...]
    next_cursor: str | None = None


class CreditAccountResponse(StrictAIModel):
    available: int = Field(ge=0)
    reserved: int = Field(ge=0)


class CreditBalanceResponse(StrictAIModel):
    contract_version: Literal["webdiag.credits.balance.v1"] = "webdiag.credits.balance.v1"
    account: CreditAccountResponse


class CreditLedgerEntryResponse(StrictAIModel):
    id: str
    operation_type: str
    available_delta: int
    reserved_delta: int
    run_id: str | None
    reason: str
    created_at: datetime


class CreditLedgerResponse(StrictAIModel):
    contract_version: Literal["webdiag.credits.ledger.v1"] = "webdiag.credits.ledger.v1"
    entries: tuple[CreditLedgerEntryResponse, ...]
    next_cursor: str | None = None


class AIWorkerClaim(StrictAIModel):
    run_id: str
    attempt_number: int = Field(gt=0)
    lease_token: str
    lease_expires_at: int
    tool_id: str
    contract_version: str
    model_policy: str
    safety_identifier: str | None = Field(default=None, min_length=32, max_length=64)
    input: dict[str, object]


class AIWorkerClaimResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.worker.v1"] = "webdiag.ai.worker.v1"
    claim: AIWorkerClaim | None


class AIWorkerLeaseRequest(StrictAIModel):
    lease_token: str = Field(min_length=32, max_length=256)


class AIWorkerLeaseResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.worker.v1"] = "webdiag.ai.worker.v1"
    lease_expires_at: int


class AIWorkerCompleteRequest(AIWorkerLeaseRequest):
    output: dict[str, object]
    provider_request_id: str | None = Field(default=None, min_length=1, max_length=200)
    input_units: int = Field(default=0, ge=0, le=1_000_000_000)
    output_units: int = Field(default=0, ge=0, le=1_000_000_000)


class AIWorkerFailRequest(AIWorkerLeaseRequest):
    error_code: str = Field(pattern=r"^[a-z0-9_]{1,120}$")
    outcome: Literal["known_safe", "provider_unknown"]


class AIWorkerRunResponse(StrictAIModel):
    contract_version: Literal["webdiag.ai.worker.v1"] = "webdiag.ai.worker.v1"
    state: Literal["running", "succeeded", "failed", "provider_unknown"]


def utc_from_ns(value: int) -> datetime:
    return datetime.fromtimestamp(value / 1_000_000_000, tz=UTC)
