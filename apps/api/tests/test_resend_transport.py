from __future__ import annotations

import json

import httpx
import pytest

from webdiag_api.email.resend import ResendTransport
from webdiag_api.email.transactional import build_verification_email


@pytest.mark.asyncio
async def test_resend_transport_sends_exact_transactional_contract() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"id": "email_123"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        transport = ResendTransport(api_key="re_test_key_123456789", client=client)
        message = build_verification_email(
            recipient="roman@example.com",
            verification_url="https://webdiag.ru/auth/verify-email?token=opaque",
        )

        message_id = await transport.send(message, idempotency_key="verify:user-id:token-digest")

    assert message_id == "email_123"
    assert len(requests) == 1
    request = requests[0]
    assert request.method == "POST"
    assert request.url == httpx.URL("https://api.resend.com/emails")
    assert request.headers["authorization"] == "Bearer re_test_key_123456789"
    assert request.headers["idempotency-key"] == "verify:user-id:token-digest"
    payload = json.loads(request.content)
    assert payload == {
        "from": "WebDiag <no-reply@webdiag.ru>",
        "to": ["roman@example.com"],
        "reply_to": "support@webdiag.ru",
        "subject": "Подтвердите email в WebDiag",
        "text": message.text,
        "html": message.html,
    }


@pytest.mark.asyncio
async def test_resend_transport_rejects_invalid_success_payload() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"unexpected": True})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        transport = ResendTransport(api_key="re_test_key_123456789", client=client)
        message = build_verification_email(
            recipient="roman@example.com",
            verification_url="https://webdiag.ru/auth/verify-email?token=opaque",
        )
        with pytest.raises(RuntimeError, match="invalid response"):
            await transport.send(message, idempotency_key="verify:user-id:token-digest")


@pytest.mark.asyncio
async def test_resend_transport_surfaces_provider_failure_without_fallback() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"message": "rate limited"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        transport = ResendTransport(api_key="re_test_key_123456789", client=client)
        message = build_verification_email(
            recipient="roman@example.com",
            verification_url="https://webdiag.ru/auth/verify-email?token=opaque",
        )
        with pytest.raises(RuntimeError, match="Resend request failed: 429"):
            await transport.send(message, idempotency_key="verify:user-id:token-digest")
