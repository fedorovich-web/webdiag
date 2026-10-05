from __future__ import annotations

import hashlib
import hmac
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from webdiag_api.accounts.api import get_account_service, get_registration_admission
from webdiag_api.accounts.security import ScryptParameters
from webdiag_api.accounts.service import AccountService
from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.billing.api import get_billing_service
from webdiag_api.billing.service import BillingService
from webdiag_api.config import Settings
from webdiag_api.main import app


class MockAdmission:
    def acquire(self) -> str:
        return "mock-lease"

    def release(self, lease_id: str) -> None:
        pass


@pytest.fixture
def test_env(tmp_path: Path):
    account_db = str(tmp_path / "account.db")
    audit_db = str(tmp_path / "audit.db")
    settings = Settings(
        account_database_path=account_db,
        audit_database_path=audit_db,
        account_welcome_credits=10,
        lava_api_key="test-lava-api-key",
        lava_webhook_secret="test-lava-webhook-secret",
    )
    account_store = SqliteAccountStore(account_db)
    account_service = AccountService(
        account_store,
        session_ttl_seconds=3600,
        active_session_limit=10,
        scrypt_parameters=ScryptParameters(n=2**12),
        login_attempt_limit=5,
        login_attempt_window_seconds=900,
        login_block_seconds=900,
    )
    ai_store = SqliteAIStore(account_db)
    billing_service = BillingService(account_service, ai_store)

    app.dependency_overrides[get_account_service] = lambda: account_service
    app.dependency_overrides[get_billing_service] = lambda: billing_service
    app.dependency_overrides[get_registration_admission] = lambda: MockAdmission()

    yield {
        "settings": settings,
        "db_path": account_db,
        "account_service": account_service,
        "ai_store": ai_store,
        "billing_service": billing_service,
    }

    app.dependency_overrides.pop(get_account_service, None)
    app.dependency_overrides.pop(get_billing_service, None)
    app.dependency_overrides.pop(get_registration_admission, None)


def test_oauth_registration_grants_welcome_credits(test_env, monkeypatch):
    monkeypatch.setattr("webdiag_api.accounts.api.settings", test_env["settings"])
    monkeypatch.setattr("webdiag_api.config.settings", test_env["settings"])

    client = TestClient(app)

    # 1. Register new user via OAuth
    oauth_payload = {
        "provider": "yandex",
        "email": "yandex_test_user@yandex.ru",
        "display_name": "Яндекс Пользователь",
    }
    response = client.post("/v1/account/oauth", json=oauth_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "yandex_test_user@yandex.ru"
    assert data["user"]["display_name"] == "Яндекс Пользователь"
    user_id = data["user"]["id"]
    cookie = response.cookies.get("webdiag_session")
    assert cookie is not None

    # Check that 10 welcome credits were granted
    ai_store = test_env["ai_store"]
    credit_account = ai_store.get_credit_account(user_id=user_id)
    assert credit_account.available == 10

    # 2. Login again with same OAuth email - should not grant duplicate welcome credits
    response_again = client.post("/v1/account/oauth", json=oauth_payload)
    assert response_again.status_code == 200
    credit_account_again = ai_store.get_credit_account(user_id=user_id)
    assert credit_account_again.available == 10


def test_billing_invoice_creation(test_env, monkeypatch):
    monkeypatch.setattr("webdiag_api.billing.api.settings", test_env["settings"])
    monkeypatch.setattr("webdiag_api.billing.service.settings", test_env["settings"])
    monkeypatch.setattr("webdiag_api.accounts.api.settings", test_env["settings"])

    # Try creating invoice without auth -> 401
    anon_client = TestClient(app)
    anon_resp = anon_client.post("/v1/billing/invoice", json={"pack_id": "credit-pack-50"})
    assert anon_resp.status_code == 401

    # Register user to get session
    client = TestClient(app)
    reg_resp = client.post(
        "/v1/account/register",
        json={
            "email": "buyer@example.com",
            "password": "StrongPassword123!",
            "display_name": "Buyer",
        },
    )
    assert reg_resp.status_code == 201

    # Create invoice with auth
    invoice_resp = client.post(
        "/v1/billing/invoice",
        json={"pack_id": "credit-pack-50"},
    )
    assert invoice_resp.status_code == 200
    invoice_data = invoice_resp.json()
    assert invoice_data["pack_id"] == "credit-pack-50"
    assert invoice_data["amount"] == 390.0
    assert invoice_data["credits"] == 50
    assert "payment_url" in invoice_data

    # Try invalid pack -> 400
    invalid_resp = client.post(
        "/v1/billing/invoice",
        json={"pack_id": "non-existent-pack"},
    )
    assert invalid_resp.status_code == 400


def test_lava_webhook_handling_and_idempotency(test_env, monkeypatch):
    monkeypatch.setattr("webdiag_api.billing.api.settings", test_env["settings"])
    monkeypatch.setattr("webdiag_api.billing.service.settings", test_env["settings"])

    client = TestClient(app)

    # Register buyer
    reg_resp = client.post(
        "/v1/account/register",
        json={
            "email": "payer@example.com",
            "password": "StrongPassword123!",
            "display_name": "Payer",
        },
    )
    assert reg_resp.status_code == 201
    user_id = reg_resp.json()["user"]["id"]

    # Initial balance is welcome credits (10)
    ai_store = test_env["ai_store"]
    assert ai_store.get_credit_account(user_id=user_id).available == 10

    # 1. Test unauthorized webhook
    webhook_body = {
        "eventType": "payment.success",
        "contractId": "contract-12345",
        "amount": 890.0,
        "currency": "RUB",
        "buyer": {"email": "payer@example.com"},
        "clientUtm": {"utm_medium": user_id, "utm_campaign": "credit-pack-150"},
    }
    raw_payload = json.dumps(webhook_body).encode("utf-8")

    unauth_resp = client.post(
        "/v1/billing/webhook",
        content=raw_payload,
        headers={"Content-Type": "application/json"},
    )
    assert unauth_resp.status_code == 401

    # 2. Test authorized via Signature HMAC-SHA256
    signature = hmac.new(b"test-lava-webhook-secret", raw_payload, hashlib.sha256).hexdigest()
    auth_resp = client.post(
        "/v1/billing/webhook",
        content=raw_payload,
        headers={
            "Content-Type": "application/json",
            "Signature": signature,
        },
    )
    assert auth_resp.status_code == 200
    res_data = auth_resp.json()
    assert res_data["status"] == "ok"
    assert res_data["credited"] == 150

    # User balance should now be 10 + 150 = 160
    assert ai_store.get_credit_account(user_id=user_id).available == 160

    # 3. Test Idempotency: replay the same webhook
    replay_resp = client.post(
        "/v1/billing/webhook",
        content=raw_payload,
        headers={
            "Content-Type": "application/json",
            "Signature": signature,
        },
    )
    assert replay_resp.status_code == 200
    # Still 160, no duplicate credits added!
    assert ai_store.get_credit_account(user_id=user_id).available == 160

    # 4. Test authorized via X-Api-Key
    webhook_50 = {
        "eventType": "payment.success",
        "contractId": "contract-67890",
        "amount": 390.0,
        "currency": "RUB",
        "buyer": {"email": "payer@example.com"},
        "clientUtm": {"utm_medium": user_id, "utm_campaign": "credit-pack-50"},
    }
    raw_50 = json.dumps(webhook_50).encode("utf-8")
    resp_api_key = client.post(
        "/v1/billing/webhook",
        content=raw_50,
        headers={
            "Content-Type": "application/json",
            "X-Api-Key": "test-lava-webhook-secret",
        },
    )
    assert resp_api_key.status_code == 200
    assert resp_api_key.json()["credited"] == 50
    # Balance should now be 160 + 50 = 210
    assert ai_store.get_credit_account(user_id=user_id).available == 210

    # 5. Non-payment event should return 200 ignored
    other_event = {
        "eventType": "refund.success",
        "contractId": "some-contract",
    }
    raw_other = json.dumps(other_event).encode("utf-8")
    sig_other = hmac.new(b"test-lava-webhook-secret", raw_other, hashlib.sha256).hexdigest()
    resp_other = client.post(
        "/v1/billing/webhook",
        content=raw_other,
        headers={
            "Content-Type": "application/json",
            "Signature": sig_other,
        },
    )
    assert resp_other.status_code == 200
    assert resp_other.json()["status"] == "ignored"
