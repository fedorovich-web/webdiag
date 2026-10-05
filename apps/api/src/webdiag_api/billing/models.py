from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class CreateInvoiceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pack_id: str = Field(min_length=1, max_length=64)
    return_url: str | None = Field(default=None, max_length=512)


class CreateInvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    invoice_id: str
    payment_url: str
    amount: float
    currency: str = "RUB"
    pack_id: str
    credits: int
    is_live: bool = False


class BillingStatusResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    provider: str = "lava"
    is_live: bool = False
    currency: str = "RUB"


class ConfirmPaymentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pack_id: str = Field(min_length=1, max_length=64)
    invoice_id: str = Field(min_length=1, max_length=64)
    payment_method: str = Field(default="card", max_length=32)


class ConfirmPaymentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: str
    invoice_id: str
    pack_id: str
    amount: float
    credits: int
    payment_method: str


class WebhookResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str
    detail: str | None = None
    credited: int | None = None
    contract_id: str | None = None

