from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class CreateInvoiceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pack_id: str = Field(min_length=1, max_length=64)


class CreateInvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    invoice_id: str
    payment_url: str
    amount: float
    currency: str = "RUB"
    pack_id: str
    credits: int


class WebhookResponse(BaseModel):
    model_config = ConfigDict(extra="allow")

    status: str
    detail: str | None = None
    credited: int | None = None
    contract_id: str | None = None
