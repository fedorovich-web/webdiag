import time
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from test_provider_regressions import providers as providers

from webdiag_api.accounts.models import RegisterRequest
from webdiag_api.billing.models import CreateInvoiceRequest
from webdiag_api.billing.service import BillingServiceError
from webdiag_api.main import app


@pytest.mark.parametrize(
    "first,second", [("plan-team-annual", "plan-pro"), ("plan-pro-annual", "plan-team")]
)
def test_an_active_paid_plan_cannot_be_replaced_by_a_different_tier(lava, first, second):
    _, session, _, billing, invoices, calls, create = lava
    invoice = create(first)
    invoices[invoice.invoice_id]["status"] = "COMPLETED"
    billing.confirm_invoice(
        user_id=session.response.user.id, pack_id=first, invoice_id=invoice.invoice_id
    )
    initial = billing.get_status(session.response.user.id).plan
    previous_calls = len(calls)
    with pytest.raises(BillingServiceError) as error:
        create(second)
    assert error.value.code == "billing_active_plan_change"
    assert len(calls) == previous_calls
    assert billing.get_status(session.response.user.id).plan == initial


@pytest.mark.parametrize(
    "first,second", [("plan-team-annual", "plan-pro"), ("plan-pro", "plan-team-annual")]
)
def test_different_pending_invoices_preserve_each_paid_period(lava, monkeypatch, first, second):
    _, session, _, billing, invoices, _, create = lava
    first_invoice, second_invoice = create(first), create(second)
    now = int(time.time())
    monkeypatch.setattr("webdiag_api.billing.storage.time.time", lambda: now)
    for invoice in [first_invoice, second_invoice]:
        invoices[invoice.invoice_id]["status"] = "COMPLETED"
        billing.confirm_invoice(
            user_id=session.response.user.id, pack_id=invoice.pack_id, invoice_id=invoice.invoice_id
        )
    active = billing.get_status(session.response.user.id).plan
    first_duration = 365 if "annual" in first else 30
    second_duration = 365 if "annual" in second else 30
    assert active.plan_id == ("team" if "team" in first else "pro")
    assert active.expires_at == now + first_duration * 86400
    monkeypatch.setattr(
        "webdiag_api.billing.storage.time.time", lambda: now + first_duration * 86400
    )
    queued = billing.get_status(session.response.user.id).plan
    assert queued.plan_id == ("team" if "team" in second else "pro")
    assert queued.expires_at == now + (first_duration + second_duration) * 86400


@pytest.fixture
def lava(providers, monkeypatch):
    accounts, session, credits, billing, config = providers
    invoices = {}
    calls = []

    def request(_client, method, url, **kwargs):
        calls.append((method, url, kwargs))
        if method == "POST":
            payload = kwargs["json"]
            invoice_id = str(uuid4())
            invoices[invoice_id] = {
                "id": invoice_id,
                "status": "NEW",
                "receipt": {"amount": payload["amount"], "currency": payload["currency"]},
            }
            return httpx.Response(
                201,
                json={
                    "id": invoice_id,
                    "paymentUrl": f"https://pay.lava.top/{invoice_id}",
                    "amountTotal": {"amount": payload["amount"], "currency": payload["currency"]},
                },
            )
        return httpx.Response(200, json=invoices[url.rsplit("/", 1)[-1]])

    monkeypatch.setattr(httpx.Client, "request", request)

    def create(pack="pack-50"):
        return billing.create_invoice(
            user_id=session.response.user.id,
            email=session.response.user.email,
            request=CreateInvoiceRequest(pack_id=pack),
        )

    return accounts, session, credits, billing, invoices, calls, create


def test_invoice_requires_authentication(providers):
    with TestClient(app) as client:
        assert client.post("/v1/billing/invoice", json={"pack_id": "pack-50"}).status_code == 401


def test_invoice_preserves_owner_product_and_authoritative_amount(lava):
    _, session, credits, billing, _, calls, create = lava
    invoice = create()
    assert invoice.is_live and invoice.amount == 390 and invoice.credits == 50
    saved = billing._store.get(invoice.invoice_id)
    assert saved.user_id == session.response.user.id
    assert saved.amount_minor == 39000
    assert credits.get_credit_account(user_id=saved.user_id).available == 0
    assert (
        calls[0][2]["json"]["successful_return_url"]
        == "https://app.webdiag.ru/account/checkout?pack=pack-50&payment_return=1"
    )
    assert "user=" not in calls[0][2]["json"]["successful_return_url"]


def test_unknown_pack_is_rejected(lava):
    with pytest.raises(BillingServiceError, match="Unknown payment package"):
        lava[-1]("unknown")


def test_lava_invoice_rejection_is_not_a_fake_success(lava, monkeypatch):
    monkeypatch.setattr(
        httpx.Client,
        "request",
        lambda *args, **kwargs: httpx.Response(400, json={"error": "bad offer"}),
    )
    with pytest.raises(BillingServiceError) as error:
        lava[-1]()
    assert error.value.status_code == 502


@pytest.mark.parametrize("status", [401, 403, 404])
def test_invalid_lava_credentials_or_offer_are_configuration_errors(lava, monkeypatch, status):
    monkeypatch.setattr(
        httpx.Client,
        "request",
        lambda *args, **kwargs: httpx.Response(status, json={"error": "private provider detail"}),
    )
    with pytest.raises(BillingServiceError) as error:
        lava[-1]()
    assert error.value.status_code == 503
    assert error.value.code == "billing_misconfigured"
    assert "private provider detail" not in error.value.message
    assert lava[3]._store.plan(lava[1].response.user.id)[0] == "starter"


def test_missing_invoice_is_not_reported_as_a_bad_offer(lava, monkeypatch):
    invoice = lava[-1]()
    monkeypatch.setattr(
        httpx.Client, "request", lambda *args, **kwargs: httpx.Response(404, json={})
    )
    with pytest.raises(BillingServiceError) as error:
        lava[3].confirm_invoice(
            user_id=lava[1].response.user.id, pack_id=invoice.pack_id, invoice_id=invoice.invoice_id
        )
    assert error.value.code == "billing_provider_error"


def test_changed_provider_amount_is_rejected(lava, monkeypatch):
    monkeypatch.setattr(
        httpx.Client,
        "request",
        lambda *args, **kwargs: httpx.Response(
            201,
            json={
                "id": str(uuid4()),
                "paymentUrl": "https://pay.lava.top/invoice",
                "amountTotal": {"amount": 1, "currency": "RUB"},
            },
        ),
    )
    with pytest.raises(BillingServiceError) as error:
        lava[-1]()
    assert error.value.code == "billing_invalid_response"


def test_verified_webhook_grants_credits_exactly_once(lava):
    _, session, credits, billing, _, _, create = lava
    invoice = create("pack-150")
    event = {
        "eventType": "payment.success",
        "contractId": invoice.invoice_id,
        "amount": 890,
        "currency": "RUB",
    }
    for _ in range(2):
        assert billing.handle_webhook_event(event).credited == 150
    assert credits.get_credit_account(user_id=session.response.user.id).available == 150


def test_mismatched_payment_does_not_grant_credits(lava):
    _, session, credits, billing, _, _, create = lava
    invoice = create()
    with pytest.raises(BillingServiceError):
        billing.handle_webhook_event(
            {
                "eventType": "payment.success",
                "contractId": invoice.invoice_id,
                "amount": 1,
                "currency": "RUB",
            }
        )
    assert credits.get_credit_account(user_id=session.response.user.id).available == 0


def test_confirm_checks_provider_and_does_not_trust_the_browser(lava):
    _, session, credits, billing, invoices, _, create = lava
    invoice = create()
    args = dict(
        user_id=session.response.user.id, pack_id=invoice.pack_id, invoice_id=invoice.invoice_id
    )
    assert billing.confirm_invoice(**args).status == "pending"
    assert credits.get_credit_account(user_id=args["user_id"]).available == 0
    invoices[invoice.invoice_id]["status"] = "COMPLETED"
    assert billing.confirm_invoice(**args).status == "paid"
    assert billing.confirm_invoice(**args).status == "paid"
    assert credits.get_credit_account(user_id=args["user_id"]).available == 50


def test_another_user_cannot_confirm_an_invoice(lava):
    accounts, _, _, billing, _, _, create = lava
    invoice = create()
    other = accounts.register(
        RegisterRequest(
            email="other@example.com", display_name="Other", password="different password"
        )
    )
    with pytest.raises(BillingServiceError) as error:
        billing.confirm_invoice(
            user_id=other.response.user.id, pack_id=invoice.pack_id, invoice_id=invoice.invoice_id
        )
    assert error.value.status_code == 404


def test_plan_and_credits_settle_atomically_and_replay_does_not_extend_plan(lava):
    _, session, credits, billing, _, _, create = lava
    invoice = create("plan-pro")
    event = {
        "eventType": "payment.success",
        "contractId": invoice.invoice_id,
        "amount": 990,
        "currency": "RUB",
    }
    billing.handle_webhook_event(event)
    before = billing.get_status(session.response.user.id).plan
    assert before.plan_id == "pro" and before.expires_at is not None
    billing.handle_webhook_event(event)
    assert billing.get_status(session.response.user.id).plan == before
    assert credits.get_credit_account(user_id=session.response.user.id).available == 150


def test_parallel_payment_callbacks_cannot_double_credit(lava):
    _, session, credits, billing, _, _, create = lava
    invoice = create()
    event = {
        "eventType": "payment.success",
        "contractId": invoice.invoice_id,
        "amount": 390,
        "currency": "RUB",
    }
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: billing.handle_webhook_event(event), range(2)))
    assert all(result.status == "ok" for result in results)
    assert credits.get_credit_account(user_id=session.response.user.id).available == 50


def test_settlement_failure_rolls_back_credits_and_plan(lava, monkeypatch):
    _, session, credits, billing, _, _, create = lava
    invoice = create("plan-team")
    original = credits.grant_credits_in_transaction

    def fail(*args, **kwargs):
        original(*args, **kwargs)
        raise RuntimeError("storage failure")

    monkeypatch.setattr(credits, "grant_credits_in_transaction", fail)
    with pytest.raises(RuntimeError):
        billing.handle_webhook_event(
            {
                "eventType": "payment.success",
                "contractId": invoice.invoice_id,
                "amount": 2990,
                "currency": "RUB",
            }
        )
    assert credits.get_credit_account(user_id=session.response.user.id).available == 0
    assert billing.get_status(session.response.user.id).plan.plan_id == "starter"
    assert billing._store.get(invoice.invoice_id).state == "pending"


def test_annual_plan_uses_the_existing_discounted_price_for_twelve_months(lava):
    _, session, credits, billing, _, _, create = lava
    invoice = create("plan-pro-annual")
    assert invoice.amount == 790 * 12
    assert invoice.credits == 150 * 12
    billing.handle_webhook_event(
        {
            "eventType": "payment.success",
            "contractId": invoice.invoice_id,
            "amount": invoice.amount,
            "currency": "RUB",
        }
    )
    assert credits.get_credit_account(user_id=session.response.user.id).available == 1800
    before = billing.get_status(session.response.user.id).plan
    import time

    assert 364 * 86400 < before.expires_at - int(time.time()) <= 365 * 86400


def test_english_plan_preserves_the_existing_usd_price(lava):
    invoice = lava[-1]("plan-team-annual-usd")
    assert invoice.currency == "USD"
    assert invoice.amount == 34 * 12
    assert invoice.credits == 500 * 12


def test_webhook_rejects_invalid_json_and_authentication(providers):
    *_, config = providers
    with TestClient(app) as client:
        assert client.post("/v1/billing/webhook", json={}).status_code == 401
        assert (
            client.post(
                "/v1/billing/webhook", json=[], headers={"x-api-key": config.lava_webhook_secret}
            ).status_code
            == 400
        )
        assert (
            client.post(
                "/v1/billing/webhook",
                json={"eventType": "payment.failed"},
                headers={"x-api-key": config.lava_webhook_secret},
            ).json()["status"]
            == "ignored"
        )
