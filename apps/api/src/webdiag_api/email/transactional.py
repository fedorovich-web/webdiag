from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from html import escape

DEFAULT_SENDER = "WebDiag <no-reply@webdiag.ru>"
DEFAULT_SUPPORT_EMAIL = "support@webdiag.ru"


@dataclass(frozen=True, slots=True)
class TransactionalEmail:
    sender: str
    reply_to: str
    to: str
    subject: str
    text: str
    html: str


def _layout(
    *,
    title: str,
    body: str,
    action_url: str | None = None,
    action_label: str | None = None,
) -> str:
    action = ""
    if action_url and action_label:
        action = (
            '<p style="margin:24px 0">'
            f'<a href="{escape(action_url, quote=True)}" '
            'style="display:inline-block;padding:12px 18px;border-radius:8px;'
            'background:#5148e8;color:#fff;text-decoration:none">'
            f"{escape(action_label)}</a></p>"
        )
    return (
        "<!doctype html><html><body "
        'style="font-family:Arial,sans-serif;line-height:1.5;color:#171717">'
        f"<h1>{escape(title)}</h1><p>{escape(body)}</p>{action}"
        f'<p style="color:#666">Поддержка: <a href="mailto:{DEFAULT_SUPPORT_EMAIL}">'
        f"{DEFAULT_SUPPORT_EMAIL}</a></p></body></html>"
    )


def build_verification_email(*, recipient: str, verification_url: str) -> TransactionalEmail:
    subject = "Подтвердите email в WebDiag"
    text = (
        "Подтвердите адрес электронной почты для аккаунта WebDiag.\n\n"
        f"{verification_url}\n\n"
        "Если вы не создавали аккаунт, проигнорируйте это письмо."
    )
    return TransactionalEmail(
        sender=DEFAULT_SENDER,
        reply_to=DEFAULT_SUPPORT_EMAIL,
        to=recipient,
        subject=subject,
        text=text,
        html=_layout(
            title="Подтвердите email",
            body="Подтвердите адрес электронной почты для аккаунта WebDiag.",
            action_url=verification_url,
            action_label="Подтвердить email",
        ),
    )


def build_password_reset_email(
    *, recipient: str, reset_url: str, expires_at: datetime
) -> TransactionalEmail:
    expires_label = expires_at.isoformat(timespec="minutes")
    subject = "Сброс пароля WebDiag"
    text = (
        "Вы запросили сброс пароля WebDiag.\n\n"
        f"{reset_url}\n\n"
        f"Ссылка действует до {expires_label}. Если запрос делали не вы, проигнорируйте письмо."
    )
    return TransactionalEmail(
        sender=DEFAULT_SENDER,
        reply_to=DEFAULT_SUPPORT_EMAIL,
        to=recipient,
        subject=subject,
        text=text,
        html=_layout(
            title="Сброс пароля",
            body=f"Используйте ссылку ниже до {expires_label}, чтобы задать новый пароль.",
            action_url=reset_url,
            action_label="Задать новый пароль",
        ),
    )


def build_password_changed_email(*, recipient: str) -> TransactionalEmail:
    subject = "Пароль WebDiag изменён"
    text = (
        "Пароль вашего аккаунта WebDiag был изменён.\n\n"
        f"Если это были не вы, немедленно напишите на {DEFAULT_SUPPORT_EMAIL}."
    )
    body = (
        "Пароль вашего аккаунта WebDiag был изменён. "
        "Если это были не вы, свяжитесь с поддержкой."
    )
    return TransactionalEmail(
        sender=DEFAULT_SENDER,
        reply_to=DEFAULT_SUPPORT_EMAIL,
        to=recipient,
        subject=subject,
        text=text,
        html=_layout(title="Пароль изменён", body=body),
    )
