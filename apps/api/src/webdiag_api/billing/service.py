from __future__ import annotations

import logging
import secrets
from decimal import Decimal, InvalidOperation
from typing import Any
from urllib.parse import urlsplit
from uuid import UUID

import httpx

from webdiag_api.accounts.service import AccountService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.billing.catalog import billing_product
from webdiag_api.billing.models import (
    BillingStatusResponse,
    ConfirmPaymentResponse,
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    PlanStatusResponse,
    WebhookResponse,
)
from webdiag_api.billing.storage import Invoice, SqliteBillingStore
from webdiag_api.config import settings

logger = logging.getLogger(__name__)


class BillingServiceError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class BillingService:
    def __init__(self, account_service: AccountService, ai_store: SqliteAIStore) -> None:
        self._store = SqliteBillingStore(account_service.database_path, ai_store)

    def get_status(self, user_id: str | None = None) -> BillingStatusResponse:
        plan = None
        if user_id:
            plan_id, expires_at = self._store.plan(user_id)
            plan = PlanStatusResponse(plan_id=plan_id, expires_at=expires_at)
        return BillingStatusResponse(
            provider="lava", is_live=self._configured(), currency="RUB", plan=plan
        )

    @staticmethod
    def _configured() -> bool:
        try:
            UUID(settings.lava_offer_id.strip())
        except ValueError:
            return False
        return bool(settings.lava_api_key.strip() and settings.lava_webhook_secret.strip())

    @staticmethod
    def _provider_request(method: str, path: str, payload: dict | None = None) -> dict:
        if settings.lava_base_url.rstrip("/") != "https://gate.lava.top":
            raise BillingServiceError(
                503, "billing_misconfigured", "Payment service is not configured."
            )
        try:
            with httpx.Client(timeout=15.0, follow_redirects=False, trust_env=False) as client:
                response = client.request(
                    method,
                    f"https://gate.lava.top{path}",
                    json=payload,
                    headers={
                        "X-Api-Key": settings.lava_api_key.strip(),
                        "Accept": "application/json",
                    },
                )
            if response.status_code not in {200, 201}:
                logger.warning("Lava request failed with HTTP %s", response.status_code)
                if response.status_code in {401, 403} or (
                    response.status_code == 404 and method == "POST" and path == "/api/v3/invoice"
                ):
                    raise BillingServiceError(
                        503, "billing_misconfigured", "Payment service is not configured."
                    )
                raise BillingServiceError(
                    502, "billing_provider_error", "Payment service rejected the request."
                )
            if len(response.content) > 65536:
                raise ValueError("oversized response")
            data = response.json()
            if not isinstance(data, dict):
                raise ValueError("invalid response")
            return data
        except (httpx.HTTPError, ValueError) as error:
            raise BillingServiceError(
                502, "billing_provider_unavailable", "Payment service is unavailable."
            ) from error

    def create_invoice(
        self, *, user_id: str, email: str, request: CreateInvoiceRequest, origin: str | None = None
    ) -> CreateInvoiceResponse:
        pack = billing_product(request.pack_id)
        if pack is None:
            raise BillingServiceError(400, "invalid_pack_id", "Unknown payment package.")
        if pack.plan_id:
            active_plan, _ = self._store.plan(user_id)
            if active_plan not in {"starter", pack.plan_id}:
                raise BillingServiceError(
                    409,
                    "billing_active_plan_change",
                    "Contact support to change an active paid plan "
                    "without losing its remaining period.",
                )
        if not self._configured():
            raise BillingServiceError(
                503, "billing_not_configured", "Payment service is not configured."
            )
        # Redirects never trust client headers or a buyer-supplied destination.
        return_base = settings.account_public_origin.rstrip("/")
        return_path = "/en/account/checkout" if pack.currency == "USD" else "/account/checkout"
        if request.return_url and request.return_url.rstrip("/") != return_base:
            raise BillingServiceError(
                400, "billing_invalid_return_url", "Invalid payment return URL."
            )
        payment_return = f"{return_base}{return_path}?pack={request.pack_id}&payment_return=1"
        data = self._provider_request(
            "POST",
            "/api/v3/invoice",
            {
                "email": email,
                "offerId": settings.lava_offer_id.strip(),
                "currency": pack.currency,
                "amount": pack.amount_minor / 100,
                "successful_return_url": payment_return,
                "failure_return_url": payment_return,
                "cancel_return_url": payment_return,
            },
        )
        try:
            invoice_id = str(UUID(data["id"]))
            payment_url = data["paymentUrl"]
            parsed = urlsplit(payment_url)
            if (
                parsed.scheme != "https"
                or not parsed.hostname
                or parsed.username
                or parsed.password
            ):
                raise ValueError("invalid payment URL")
            if len(payment_url) > 2048 or any(ord(c) < 32 for c in payment_url):
                raise ValueError("invalid payment URL")
            total = data.get("amountTotal")
            if total is not None and (
                not isinstance(total, dict)
                or self._kopeks(total.get("amount")) != pack.amount_minor
                or total.get("currency") != pack.currency
            ):
                raise ValueError("unexpected invoice amount")
        except (KeyError, TypeError, ValueError) as error:
            raise BillingServiceError(
                502, "billing_invalid_response", "Payment service returned an invalid invoice."
            ) from error
        invoice = Invoice(
            invoice_id,
            user_id,
            request.pack_id,
            pack.amount_minor,
            pack.credits,
            settings.lava_offer_id.strip(),
            "pending",
            currency=pack.currency,
            plan_id=pack.plan_id,
            duration_days=pack.duration_days,
        )
        self._store.create(invoice)
        return CreateInvoiceResponse(
            invoice_id=invoice.id,
            payment_url=payment_url,
            amount=invoice.amount_minor / 100,
            currency=invoice.currency,
            pack_id=invoice.pack_id,
            credits=invoice.credits,
            is_live=True,
        )

    @staticmethod
    def _kopeks(value: object) -> int:
        try:
            amount = Decimal(str(value))
            if not amount.is_finite() or not 0 < amount <= 10000000:
                raise ValueError("invalid amount")
            scaled = amount * 100
            if not amount.is_finite() or scaled <= 0 or scaled != scaled.to_integral_value():
                raise ValueError("invalid amount")
            return int(scaled)
        except (InvalidOperation, TypeError) as error:
            raise ValueError("invalid amount") from error

    def confirm_invoice(
        self, *, user_id: str, pack_id: str, invoice_id: str, payment_method: str = "card"
    ) -> ConfirmPaymentResponse:
        invoice = self._store.get(invoice_id)
        if invoice is None or invoice.user_id != user_id:
            raise BillingServiceError(
                404, "billing_invoice_not_found", "Payment invoice was not found."
            )
        if pack_id != invoice.pack_id:
            raise BillingServiceError(
                409, "billing_invoice_mismatch", "Payment package does not match."
            )
        if invoice.state != "paid":
            data = self._provider_request("GET", f"/api/v1/invoices/{invoice.id}")
            if data.get("id") != invoice.id:
                raise BillingServiceError(
                    502, "billing_invalid_response", "Payment invoice does not match."
                )
            if data.get("status") != "COMPLETED":
                return self._confirmation(invoice, "pending", payment_method)
            receipt = data.get("receipt")
            if not isinstance(receipt, dict) or not self._matches_payment(invoice, receipt):
                raise BillingServiceError(
                    409, "billing_payment_mismatch", "Payment amount does not match."
                )
            invoice = self._store.settle(invoice.id)
        return self._confirmation(invoice, "paid", payment_method)

    def _confirmation(self, invoice: Invoice, status: str, method: str) -> ConfirmPaymentResponse:
        period = self._store.period(invoice.id) if invoice.plan_id else None
        return ConfirmPaymentResponse(
            status=status,
            invoice_id=invoice.id,
            pack_id=invoice.pack_id,
            amount=invoice.amount_minor / 100,
            currency=invoice.currency,
            credits=invoice.credits,
            payment_method=method,
            plan_starts_at=period[0] if period else None,
            plan_expires_at=period[1] if period else None,
        )

    def verify_webhook_authentication(self, *, raw_body: bytes, headers: dict[str, str]) -> bool:
        secret = settings.lava_webhook_secret.strip()
        supplied = headers.get("x-api-key", "")
        return bool(secret and supplied and secrets.compare_digest(supplied, secret))

    def _matches_payment(self, invoice: Invoice, data: dict) -> bool:
        try:
            return (
                data.get("currency") == invoice.currency
                and self._kopeks(data.get("amount")) == invoice.amount_minor
            )
        except ValueError:
            return False

    def handle_webhook_event(self, body: dict[str, Any]) -> WebhookResponse:
        if body.get("eventType") != "payment.success":
            return WebhookResponse(status="ignored")
        invoice_id = body.get("contractId")
        if not isinstance(invoice_id, str):
            return WebhookResponse(status="ignored")
        invoice = self._store.get(invoice_id)
        if invoice is None:
            return WebhookResponse(status="ignored")
        if not self._matches_payment(invoice, body):
            raise BillingServiceError(
                409, "billing_payment_mismatch", "Payment amount does not match."
            )
        self._store.settle(invoice.id)
        return WebhookResponse(status="ok", credited=invoice.credits, contract_id=invoice.id)
