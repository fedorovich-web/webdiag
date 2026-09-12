from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, SecretStr


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=254)
    display_name: str = Field(min_length=2, max_length=80)
    password: SecretStr


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=3, max_length=254)
    password: SecretStr


class AccountUser(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime


class AccountSessionResponse(BaseModel):
    contract_version: Literal["webdiag.account.session.v1"] = "webdiag.account.session.v1"
    authenticated: Literal[True] = True
    user: AccountUser


class AccountLogoutResponse(BaseModel):
    contract_version: Literal["webdiag.account.logout.v1"] = "webdiag.account.logout.v1"
    authenticated: Literal[False] = False


def utc_datetime(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp, tz=UTC)
