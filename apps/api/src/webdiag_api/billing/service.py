from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import uuid
from typing import Any

import httpx

from webdiag_api.accounts.service import AccountService
from webdiag_api.ai.storage import SqliteAIStore
from webdiag_api.billing.models import (
    CreateInvoiceRequest,
    CreateInvoiceResponse,
    WebhookResponse,
)
from webdiag_api.config import settings

logger = logging.getLogger(__name__)


CREDIT_PACKS: dict[str, dict[str, Any]] = {
    "credit-pack-50": {
        "credits": 50,
        "price_rub": 390.0,
        "title": "50 AI-кредитов WebDiag",
    },
    "credit-pack-150": {
        "credits": 150,
        "price_rub": 890.0,
        "title": "150 AI-кредитов WebDiag",
    },
    "credit-pack-500": {
        "credits": 500,
        "price_rub": 1990.0,
        "title": "500 AI-кредитов WebDiag",
    },
    "plan-pro": {
        "credits": 150,
        "price_rub": 990.0,
        "title": "Тариф Pro (150 AI-кредитов)",
    },
    "plan-team": {
        "credits": 500,
        "price_rub": 2990.0,
        "title": "Тариф Team (500 AI-кредитов)",
    },
}


class BillingServiceError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class BillingService:
    def __init__(self, account_service: AccountService, ai_store: SqliteAIStore) -> None:
        self._account_service = account_service
        self._ai_store = ai_store

    def create_invoice(
        self,
        *,
        user_id: str,
        email: str,
        request: CreateInvoiceRequest,
    ) -> CreateInvoiceResponse:
        pack = CREDIT_PACKS.get(request.pack_id)
        if not pack:
            raise BillingServiceError(400, "invalid_pack_id", f"Unknown package: {request.pack_id}")

        amount = float(pack["price_rub"])
        credits = int(pack["credits"])

        if settings.lava_api_key.strip():
            api_url = f"{settings.lava_base_url.rstrip('/')}/api/v3/invoice"
            offer_id = settings.lava_offer_id.strip() or "webdiag-credits"
            payload = {
                "email": email,
                "offerId": offer_id,
                "currency": "RUB",
                "amount": amount,
                "periodicity": "ONE_TIME",
                "successful_return_url": f"https://app.webdiag.ru/account?billing=success&pack={request.pack_id}",
                "failure_return_url": "https://app.webdiag.ru/pricing?billing=failed",
                "cancel_return_url": "https://app.webdiag.ru/pricing",
                "clientUtm": {
                    "utm_source": "webdiag",
                    "utm_medium": user_id,
                    "utm_campaign": request.pack_id,
                },
            }
            headers = {
                "X-Api-Key": settings.lava_api_key.strip(),
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            try:
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(api_url, json=payload, headers=headers)
                    if resp.status_code in (200, 201):
                        data = resp.json()
                        invoice_id = str(data.get("id") or uuid.uuid4())
                        payment_url = str(data.get("paymentUrl") or data.get("url") or "")
                        if payment_url:
                            return CreateInvoiceResponse(
                                invoice_id=invoice_id,
                                payment_url=payment_url,
                                amount=amount,
                                currency="RUB",
                                pack_id=request.pack_id,
                                credits=credits,
                            )
                    logger.error(
                        "Lava invoice creation API returned status %s: %s",
                        resp.status_code,
                        resp.text,
                    )
            except Exception as error:
                logger.exception("Failed to connect to Lava.top API: %s", error)

        # Fallback / Development simulation
        sim_id = f"sim-{uuid.uuid4().hex[:12]}"
        sim_url = f"https://app.webdiag.ru/account?billing=simulation&pack={request.pack_id}&invoice={sim_id}"
        return CreateInvoiceResponse(
            invoice_id=sim_id,
            payment_url=sim_url,
            amount=amount,
            currency="RUB",
            pack_id=request.pack_id,
            credits=credits,
        )

    def verify_webhook_authentication(
        self,
        *,
        raw_body: bytes,
        headers: dict[str, str],
    ) -> bool:
        secret = settings.lava_webhook_secret.strip()
        api_key = settings.lava_api_key.strip()

        # If no secret configured, allow in development/testing
        if not secret and not api_key:
            return True

        # 1. Check X-Api-Key header (Lava webhook API Key authentication)
        header_key = headers.get("x-api-key") or headers.get("X-Api-Key")
        if header_key:
            if secret and secrets.compare_digest(header_key, secret):
                return True
            if api_key and secrets.compare_digest(header_key, api_key):
                return True

        # 2. Check Signature / X-Signature header (HMAC-SHA256 signature)
        sig = headers.get("signature") or headers.get("x-signature")
        if sig and secret:
            computed_sig = hmac.new(
                secret.encode("utf-8"),
                raw_body,
                hashlib.sha256,
            ).hexdigest()
            if hmac.compare_digest(sig.strip().lower(), computed_sig.lower()):
                return True

        return False

    def handle_webhook_event(self, body: dict[str, Any]) -> WebhookResponse:
        event_type = (
            body.get("eventType")
            or body.get("event_type")
            or body.get("type")
            or ""
        )

        # Lava requires returning 2xx on ANY event including unknown or unhandled
        if event_type != "payment.success":
            logger.info("Ignoring non-success or auxiliary Lava webhook event: %s", event_type)
            return WebhookResponse(
                status="ignored",
                detail=f"Unhandled event type: {event_type}",
            )

        # Extract payment details
        # Lava structure can have data nested or top-level
        data = body.get("data") if isinstance(body.get("data"), dict) else body

        contract_id = str(
            data.get("contractId")
            or data.get("contract_id")
            or data.get("invoice_id")
            or data.get("id")
            or body.get("event_id")
            or uuid.uuid4()
        )

        client_utm = data.get("clientUtm") or {}
        user_id = client_utm.get("utm_medium") if isinstance(client_utm, dict) else None
        pack_id = client_utm.get("utm_campaign") if isinstance(client_utm, dict) else None

        # Look up user if user_id was not in utm_medium
        user = None
        if user_id:
            try:
                user = self._account_service._store.get_user(user_id)
            except Exception:
                user = None

        buyer = data.get("buyer") or {}
        buyer_email = buyer.get("email") if isinstance(buyer, dict) else data.get("email")

        if user is None and buyer_email:
            try:
                user = self._account_service._store.get_user_by_email(buyer_email.strip().lower())
            except Exception:
                user = None

        if user is None:
            logger.warning(
                "Lava payment %s received but user could not be found (utm_medium=%s, email=%s)",
                contract_id,
                user_id,
                buyer_email,
            )
            return WebhookResponse(
                status="user_not_found",
                detail=f"User could not be found for email: {buyer_email}",
                contract_id=contract_id,
            )

        # Determine package and credits
        amount = float(data.get("amount") or 0.0)
        credits_to_grant = 0
        pack_title = "AI-кредиты"

        if pack_id and pack_id in CREDIT_PACKS:
            pack_info = CREDIT_PACKS[pack_id]
            credits_to_grant = pack_info["credits"]
            pack_title = pack_info["title"]
        else:
            # Match by amount
            for pid, pinfo in CREDIT_PACKS.items():
                if abs(pinfo["price_rub"] - amount) < 1.0:
                    credits_to_grant = pinfo["credits"]
                    pack_title = pinfo["title"]
                    break

        if credits_to_grant <= 0:
            credits_to_grant = max(10, int(amount / 8))  # fallback ratio
            pack_title = f"{credits_to_grant} AI-кредитов"

        # Grant credits idempotently via correlation_id
        correlation_id = f"lava-{contract_id}"
        self._ai_store.grant_credits(
            user_id=user.id,
            quantity=credits_to_grant,
            reason=f"Lava.top payment {contract_id} ({pack_title})",
            correlation_id=correlation_id,
        )

        logger.info(
            "Granted %d credits to user %s (%s) for Lava transaction %s",
            credits_to_grant,
            user.id,
            user.email,
            contract_id,
        )

        return WebhookResponse(
            status="ok",
            credited=credits_to_grant,
            contract_id=contract_id,
            detail="Credits granted successfully",
        )
