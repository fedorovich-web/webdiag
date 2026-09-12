from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

AuthLocale = Literal["ru", "en"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    locale: AuthLocale = "ru"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    locale: AuthLocale = "ru"


class EmailActionRequest(BaseModel):
    email: EmailStr
    locale: AuthLocale = "ru"


class TokenActionRequest(BaseModel):
    token: str = Field(min_length=32, max_length=512)
    locale: AuthLocale = "ru"


class PasswordResetRequest(TokenActionRequest):
    new_password: str = Field(min_length=10, max_length=128)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)
    locale: AuthLocale = "ru"


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    status: str
    email_verified_at: datetime | None
    created_at: datetime
    updated_at: datetime
