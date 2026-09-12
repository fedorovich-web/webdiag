from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from html import escape

from webdiag_api.auth.schemas import AuthLocale

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
    locale: AuthLocale = "ru",
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
        f'<p style="color:#666">{"Поддержка" if locale == "ru" else "Support"}: '
        f'<a href="mailto:{DEFAULT_SUPPORT_EMAIL}">'
        f"{DEFAULT_SUPPORT_EMAIL}</a></p></body></html>"
    )


def build_verification_email(
    *, recipient: str, verification_url: str, locale: AuthLocale = "ru"
) -> TransactionalEmail:
    if locale == "ru":
        subject = "Подтвердите email в WebDiag"
        title = "Подтвердите email"
        body = "Подтвердите адрес электронной почты для аккаунта WebDiag."
        action_label = "Подтвердить email"
        footer = "Если вы не создавали аккаунт, проигнорируйте это письмо."
    else:
        subject = "Verify your WebDiag email"
        title = "Confirm your email"
        body = "Confirm your email address for your WebDiag account."
        action_label = "Verify email"
        footer = "If you did not create this account, ignore this email."
    text = f"{body}\n\n{verification_url}\n\n{footer}"
    return TransactionalEmail(
        sender=DEFAULT_SENDER,
        reply_to=DEFAULT_SUPPORT_EMAIL,
        to=recipient,
        subject=subject,
        text=text,
        html=_layout(
            title=title,
            body=body,
            action_url=verification_url,
            action_label=action_label,
            locale=locale,
        ),
    )


def build_password_reset_email(
    *,
    recipient: str,
    reset_url: str,
    expires_at: datetime,
    locale: AuthLocale = "ru",
) -> TransactionalEmail:
    expires_label = expires_at.isoformat(timespec="minutes")
    if locale == "ru":
        subject = "Сброс пароля WebDiag"
        title = "Сброс пароля"
        body = f"Используйте ссылку ниже до {expires_label}, чтобы задать новый пароль."
        action_label = "Задать новый пароль"
        text = (
            "Вы запросили сброс пароля WebDiag.\n\n"
            f"{reset_url}\n\n"
            f"Ссылка действует до {expires_label}. Если запрос делали не вы, проигнорируйте письмо."
        )
    else:
        subject = "Reset your WebDiag password"
        title = "Reset your password"
        body = f"Use the link below before {expires_label} to set a new password."
        action_label = "Set a new password"
        text = (
            "You requested a WebDiag password reset.\n\n"
            f"{reset_url}\n\n"
            f"This link expires at {expires_label}. If you did not request it, ignore this email."
        )
    return TransactionalEmail(
        sender=DEFAULT_SENDER,
        reply_to=DEFAULT_SUPPORT_EMAIL,
        to=recipient,
        subject=subject,
        text=text,
        html=_layout(
            title=title,
            body=body,
            action_url=reset_url,
            action_label=action_label,
            locale=locale,
        ),
    )


def build_password_changed_email(
    *, recipient: str, locale: AuthLocale = "ru"
) -> TransactionalEmail:
    if locale == "ru":
        subject = "Пароль WebDiag изменён"
        text = (
            "Пароль вашего аккаунта WebDiag был изменён.\n\n"
            f"Если это были не вы, немедленно напишите на {DEFAULT_SUPPORT_EMAIL}."
        )
        title = "Пароль изменён"
        body = (
            "Пароль вашего аккаунта WebDiag был изменён. "
            "Если это были не вы, свяжитесь с поддержкой."
        )
    else:
        subject = "Your WebDiag password was changed"
        text = (
            "Your WebDiag account password was changed.\n\n"
            f"If this was not you, contact {DEFAULT_SUPPORT_EMAIL} immediately."
        )
        title = "Password changed"
        body = "Your WebDiag account password was changed. Contact support if this was not you."
    return TransactionalEmail(
        sender=DEFAULT_SENDER,
        reply_to=DEFAULT_SUPPORT_EMAIL,
        to=recipient,
        subject=subject,
        text=text,
        html=_layout(title=title, body=body, locale=locale),
    )
