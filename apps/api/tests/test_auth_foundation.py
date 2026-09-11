from __future__ import annotations

from datetime import UTC, datetime, timedelta

from webdiag_api.auth.security import digest_token, hash_password, new_token, verify_password
from webdiag_api.email.transactional import build_password_reset_email, build_verification_email


def test_auth_tokens_are_opaque_and_only_digests_are_persisted() -> None:
    raw = new_token()

    assert len(raw) >= 40
    assert len(digest_token(raw)) == 64
    assert digest_token(raw) == digest_token(raw)
    assert digest_token(raw) != raw


def test_passwords_use_one_way_hashes() -> None:
    encoded = hash_password("correct horse battery staple")

    assert encoded != "correct horse battery staple"
    assert verify_password("correct horse battery staple", encoded) is True
    assert verify_password("wrong password", encoded) is False


def test_verification_email_uses_webdiag_transactional_identity() -> None:
    message = build_verification_email(
        recipient="roman@example.com",
        verification_url="https://webdiag.ru/auth/verify-email?token=opaque-token",
    )

    assert message.sender == "WebDiag <no-reply@webdiag.ru>"
    assert message.reply_to == "support@webdiag.ru"
    assert message.to == "roman@example.com"
    assert "opaque-token" in message.text
    assert "opaque-token" in message.html


def test_password_reset_email_has_expiry_and_support_reply_to() -> None:
    expires_at = datetime.now(UTC) + timedelta(minutes=30)
    message = build_password_reset_email(
        recipient="roman@example.com",
        reset_url="https://webdiag.ru/auth/reset-password?token=opaque-token",
        expires_at=expires_at,
    )

    assert "сброс" in message.subject.lower()
    assert message.reply_to == "support@webdiag.ru"
    assert "opaque-token" in message.text
