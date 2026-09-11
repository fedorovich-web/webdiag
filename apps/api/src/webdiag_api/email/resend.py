from __future__ import annotations

from typing import Any

import httpx

from webdiag_api.email.transactional import TransactionalEmail

RESEND_EMAILS_URL = "https://api.resend.com/emails"
REQUEST_TIMEOUT_SECONDS = 15.0


class ResendTransport:
    def __init__(self, *, api_key: str, client: httpx.AsyncClient | None = None) -> None:
        normalized_key = api_key.strip()
        if not normalized_key:
            raise ValueError("Resend API key must not be empty")
        self._api_key = normalized_key
        self._client = client

    async def send(self, message: TransactionalEmail, *, idempotency_key: str) -> str:
        normalized_key = idempotency_key.strip()
        if not normalized_key:
            raise ValueError("Idempotency key must not be empty")

        payload: dict[str, Any] = {
            "from": message.sender,
            "to": [message.to],
            "reply_to": message.reply_to,
            "subject": message.subject,
            "text": message.text,
            "html": message.html,
        }
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Idempotency-Key": normalized_key,
            "Content-Type": "application/json",
        }

        if self._client is not None:
            response = await self._client.post(
                RESEND_EMAILS_URL,
                json=payload,
                headers=headers,
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        else:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS) as client:
                response = await client.post(RESEND_EMAILS_URL, json=payload, headers=headers)

        if not response.is_success:
            raise RuntimeError(f"Resend request failed: {response.status_code}")

        try:
            response_payload: object = response.json()
        except ValueError as exc:
            raise RuntimeError("Resend returned an invalid response") from exc
        if not isinstance(response_payload, dict):
            raise RuntimeError("Resend returned an invalid response")
        message_id = response_payload.get("id")
        if not isinstance(message_id, str) or not message_id.strip():
            raise RuntimeError("Resend returned an invalid response")
        return message_id
