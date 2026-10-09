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


class OAuthConfigResponse(BaseModel):
    yandex_client_id: str = ""
    configured: bool = False


class OAuthYandexExchangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str = Field(min_length=1, max_length=1024)
    code_verifier: str = Field(min_length=43, max_length=128, pattern=r"^[A-Za-z0-9._~-]+$")
    redirect_uri: str = "https://app.webdiag.ru/api/account/yandex/callback"


class OAuthLinkRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: SecretStr = Field(min_length=43, max_length=128)


class OAuthRecoveryRequest(OAuthLinkRequest):
    code: str = Field(pattern=r"^\d{6}$")


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: SecretStr
    new_password: SecretStr


class AccountUser(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: datetime


class AccountSessionResponse(BaseModel):
    contract_version: Literal["webdiag.account.session.v1"] = "webdiag.account.session.v1"
    authenticated: Literal[True] = True
    user: AccountUser


class OAuthYandexExchangeResponse(AccountSessionResponse):
    created: bool


class AccountLogoutResponse(BaseModel):
    contract_version: Literal["webdiag.account.logout.v1"] = "webdiag.account.logout.v1"
    authenticated: Literal[False] = False


class AccountSessionSummaryResponse(BaseModel):
    contract_version: Literal["webdiag.account.sessions.v1"] = "webdiag.account.sessions.v1"
    active_session_count: int = Field(ge=1, le=20)


class AccountSessionsRevokedResponse(BaseModel):
    contract_version: Literal["webdiag.account.sessions_revoked.v1"] = (
        "webdiag.account.sessions_revoked.v1"
    )
    active_session_count: Literal[1] = 1
    revoked_session_count: int = Field(ge=0, le=19)


def utc_datetime(timestamp: int) -> datetime:
    return datetime.fromtimestamp(timestamp, tz=UTC)
