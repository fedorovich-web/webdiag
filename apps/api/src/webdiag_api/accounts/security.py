from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
from dataclasses import dataclass

_EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
_MIN_SCRYPT_N = 2**12
_MAX_SCRYPT_N = 2**16
_MAX_SCRYPT_R = 16
_MAX_SCRYPT_P = 4
_MIN_SCRYPT_LENGTH = 16
_MAX_SCRYPT_LENGTH = 64


class AccountValidationError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True, slots=True)
class ScryptParameters:
    n: int = 2**14
    r: int = 8
    p: int = 1
    length: int = 32

    def __post_init__(self) -> None:
        if not _MIN_SCRYPT_N <= self.n <= _MAX_SCRYPT_N or self.n & (self.n - 1):
            raise ValueError("scrypt N is outside the allowed power-of-two range")
        if not 1 <= self.r <= _MAX_SCRYPT_R:
            raise ValueError("scrypt r is outside the allowed range")
        if not 1 <= self.p <= _MAX_SCRYPT_P:
            raise ValueError("scrypt p is outside the allowed range")
        if not _MIN_SCRYPT_LENGTH <= self.length <= _MAX_SCRYPT_LENGTH:
            raise ValueError("scrypt output length is outside the allowed range")


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}")


def normalize_email(value: str) -> str:
    normalized = value.strip().casefold()
    if len(normalized) > 254 or not _EMAIL_PATTERN.fullmatch(normalized):
        raise AccountValidationError("account_invalid_email", "Enter a valid email address.")
    return normalized


def normalize_display_name(value: str) -> str:
    normalized = " ".join(value.strip().split())
    if not 2 <= len(normalized) <= 80:
        raise AccountValidationError(
            "account_invalid_display_name",
            "Display name must contain between 2 and 80 characters.",
        )
    return normalized


def validate_password(value: str, *, email: str | None = None) -> str:
    if not 12 <= len(value) <= 128:
        raise AccountValidationError(
            "account_weak_password",
            "Password must contain between 12 and 128 characters.",
        )
    if value.isspace():
        raise AccountValidationError(
            "account_weak_password", "Password cannot contain only spaces."
        )
    if email:
        local_part = email.split("@", 1)[0]
        if len(local_part) >= 4 and local_part in value.casefold():
            raise AccountValidationError(
                "account_weak_password",
                "Password must not contain the email local part.",
            )
    return value


def hash_password(password: str, parameters: ScryptParameters | None = None) -> str:
    selected = parameters or ScryptParameters()
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=selected.n,
        r=selected.r,
        p=selected.p,
        dklen=selected.length,
    )
    return (
        f"scrypt${selected.n}${selected.r}${selected.p}"
        f"${_encode(salt)}${_encode(digest)}"
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, raw_n, raw_r, raw_p, raw_salt, raw_digest = encoded.split("$", 5)
        if algorithm != "scrypt":
            return False
        parameters = ScryptParameters(
            n=int(raw_n),
            r=int(raw_r),
            p=int(raw_p),
            length=len(_decode(raw_digest)),
        )
        salt = _decode(raw_salt)
        expected = _decode(raw_digest)
        actual = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=parameters.n,
            r=parameters.r,
            p=parameters.p,
            dklen=parameters.length,
        )
    except (MemoryError, OverflowError, TypeError, ValueError):
        return False
    return hmac.compare_digest(actual, expected)


@dataclass(frozen=True, slots=True)
class SessionSecret:
    token: str
    token_hash: str


def create_session_secret() -> SessionSecret:
    token = secrets.token_urlsafe(32)
    return SessionSecret(token=token, token_hash=hash_session_token(token))


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
