from __future__ import annotations

import json
from dataclasses import dataclass

import httpx

from webdiag_api.accounts.models import OAuthYandexExchangeRequest
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.config import Settings


@dataclass(frozen=True)
class YandexIdentity:
    subject: str
    email: str
    display_name: str


def _json(client: httpx.Client, method: str, url: str, **kwargs) -> dict:
    with client.stream(method, url, **kwargs) as response:
        if response.status_code != 200:
            raise AccountServiceError(
                400, "yandex_exchange_failed", "Yandex sign-in was not completed."
            )
        body = bytearray()
        for chunk in response.iter_bytes():
            body.extend(chunk)
            if len(body) > 65536:
                raise ValueError("oversized response")
        value = json.loads(body)
        if not isinstance(value, dict):
            raise ValueError("invalid response")
        return value


def exchange_yandex_code(request: OAuthYandexExchangeRequest, settings: Settings) -> YandexIdentity:
    if not settings.yandex_client_id or not settings.yandex_client_secret:
        raise AccountServiceError(503, "yandex_not_configured", "Yandex sign-in is unavailable.")
    callback = f"{settings.account_public_origin}/api/account/yandex/callback"
    if request.redirect_uri != callback:
        raise AccountServiceError(400, "yandex_invalid_redirect", "Invalid Yandex callback.")
    try:
        with httpx.Client(timeout=10.0, follow_redirects=False, trust_env=False) as client:
            token = _json(
                client,
                "POST",
                "https://oauth.yandex.ru/token",
                data={
                    "grant_type": "authorization_code",
                    "code": request.code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                    "redirect_uri": callback,
                    "code_verifier": request.code_verifier,
                },
            )
            access_token = token.get("access_token")
            if not isinstance(access_token, str) or not 1 <= len(access_token) <= 4096:
                raise ValueError("missing token")
            profile = _json(
                client,
                "GET",
                "https://login.yandex.ru/info?format=json",
                headers={"Authorization": f"OAuth {access_token}"},
            )
        subject = profile.get("id")
        email = profile.get("default_email")
        name = (
            profile.get("real_name")
            or profile.get("display_name")
            or profile.get("login")
            or "Yandex User"
        )
        if not isinstance(subject, str) or not 1 <= len(subject) <= 128:
            raise ValueError("missing subject")
        if not isinstance(email, str) or not email:
            raise AccountServiceError(
                400, "yandex_email_not_provided", "Yandex did not provide an email."
            )
        if not isinstance(name, str):
            raise ValueError("invalid display name")
        return YandexIdentity(subject, email, name[:80])
    except (httpx.HTTPError, ValueError, TypeError) as error:
        raise AccountServiceError(
            502, "yandex_provider_unavailable", "Yandex sign-in is temporarily unavailable."
        ) from error
