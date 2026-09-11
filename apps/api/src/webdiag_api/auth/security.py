from __future__ import annotations

import hashlib
import secrets

from pwdlib import PasswordHash

_password_hash = PasswordHash.recommended()


def new_token() -> str:
    """Return a cryptographically secure opaque token suitable for one-time links/sessions."""
    return secrets.token_urlsafe(32)


def digest_token(token: str) -> str:
    """Return the SHA-256 digest persisted instead of the bearer token itself."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, encoded: str) -> bool:
    return _password_hash.verify(password, encoded)
