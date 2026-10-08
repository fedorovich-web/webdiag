from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider

from webdiag_api.accounts.api import get_account_service
from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.billing.api import get_billing_service
from webdiag_api.billing.models import CreateInvoiceRequest
from webdiag_api.billing.service import BillingService, BillingServiceError
from webdiag_api.config import Settings
from webdiag_api.main import app


@pytest.fixture
def providers(tmp_path: Path, monkeypatch):
    path = str(tmp_path / "accounts.sqlite3")
    config = Settings(
        account_database_path=path,
        lava_api_key="test-api-key",
        lava_offer_id="34aac54f-76b5-4ea5-9c72-57a097317fb4",
        lava_webhook_secret="test-webhook-secret",
    )
    accounts = AccountService(
        SqliteAccountStore(path),
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
    )
    session = accounts.register(
        RegisterRequest(
            email="buyer@example.com", display_name="Buyer", password="correct password"
        )
    )
    credits = SqliteAIStore(path)
    billing = BillingService(accounts, credits)
    monkeypatch.setattr("webdiag_api.billing.service.settings", config)
    monkeypatch.setattr("webdiag_api.accounts.api.settings", config)
    app.dependency_overrides[get_account_service] = lambda: accounts
    app.dependency_overrides[get_billing_service] = lambda: billing
    yield accounts, session, credits, billing, config
    app.dependency_overrides.clear()


def test_oauth_does_not_authenticate_a_claimed_email(providers):
    with TestClient(app) as client:
        response = client.post(
            "/v1/account/oauth",
            json={"provider": "yandex", "email": "buyer@example.com", "display_name": "Attacker"},
        )
    assert response.status_code in {401, 404, 405}
    assert "webdiag_session" not in response.cookies


def test_missing_lava_configuration_fails_closed(providers):
    _, session, credits, billing, config = providers
    config.lava_api_key = ""
    with pytest.raises(BillingServiceError) as error:
        billing.create_invoice(
            user_id=session.response.user.id,
            email=session.response.user.email,
            request=CreateInvoiceRequest(pack_id="pack-50"),
        )
    assert error.value.status_code == 503
    assert credits.get_credit_account(user_id=session.response.user.id).available == 0


def test_lava_failure_does_not_return_a_sandbox_invoice(providers, monkeypatch):
    _, session, _, billing, _ = providers

    def fail(*args, **kwargs):
        raise httpx.ConnectError("provider unavailable")

    monkeypatch.setattr(httpx.Client, "request", fail)
    with pytest.raises(BillingServiceError) as error:
        billing.create_invoice(
            user_id=session.response.user.id,
            email=session.response.user.email,
            request=CreateInvoiceRequest(pack_id="pack-50"),
        )
    assert error.value.status_code == 502


def test_browser_cannot_confirm_an_invented_payment(providers):
    _, session, credits, _, _ = providers
    with TestClient(app) as client:
        client.cookies.set("webdiag_session", session.token)
        response = client.post(
            "/v1/billing/confirm",
            json={"pack_id": "pack-500", "invoice_id": "invented", "payment_method": "card"},
        )
    assert response.status_code == 404
    assert credits.get_credit_account(user_id=session.response.user.id).available == 0


def test_unconfigured_webhook_is_rejected(providers):
    _, _, _, billing, config = providers
    config.lava_api_key = ""
    config.lava_webhook_secret = ""
    assert not billing.verify_webhook_authentication(raw_body=b"{}", headers={})


def test_outbound_lava_key_cannot_authenticate_webhooks(providers):
    _, _, _, billing, config = providers
    assert not billing.verify_webhook_authentication(
        raw_body=b"{}", headers={"x-api-key": config.lava_api_key}
    )


def test_unknown_payment_cannot_grant_credits_by_email(providers):
    _, session, credits, billing, _ = providers
    result = billing.handle_webhook_event(
        {
            "eventType": "payment.success",
            "contractId": "unknown-contract",
            "amount": 390,
            "currency": "RUB",
            "buyer": {"email": session.response.user.email},
        }
    )
    assert result.status == "ignored"
    assert credits.get_credit_account(user_id=session.response.user.id).available == 0


def test_ai_without_a_provider_key_does_not_generate_fake_results(monkeypatch):
    for key in ("AI_GATEWAY_API_KEY", "OPENAI_API_KEY", "LLM_API_KEY", "AI_API_KEY"):
        monkeypatch.delenv(key, raising=False)
    with pytest.raises(RuntimeError):
        VercelAIGatewayProvider.from_env()
