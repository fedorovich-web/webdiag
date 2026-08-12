from __future__ import annotations

import hashlib
import json

from webdiag_api.ai.catalog import AIToolCatalog, AIToolState
from webdiag_api.ai.models import (
    AICatalogResponse,
    AIRunCreateRequest,
    AIRunResponse,
    AIToolResponse,
    CreditAccountResponse,
    CreditLedgerEntryResponse,
    utc_from_ns,
)
from webdiag_api.ai.storage import (
    AIIdempotencyConflictError,
    AIInsufficientCreditsError,
    AIRunStateError,
    CreditAccount,
    CreditLedgerEntry,
    SqliteAIStore,
    StoredAIRun,
)


class AIServiceError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


class AIService:
    def __init__(
        self,
        store: SqliteAIStore,
        *,
        catalog: AIToolCatalog,
        input_max_bytes: int,
    ) -> None:
        self._store = store
        self._catalog = catalog
        self._input_max_bytes = input_max_bytes

    def catalog(self) -> AICatalogResponse:
        return AICatalogResponse(
            tools=tuple(
                AIToolResponse(
                    id=tool.id,
                    contract_version=tool.contract_version,
                    credit_price=tool.credit_price,
                )
                for tool in self._catalog.available()
                if tool.credit_price is not None
            )
        )

    def grant_beta_credits(
        self,
        *,
        user_id: str,
        quantity: int,
        reason: str,
        correlation_id: str,
    ) -> CreditLedgerEntry:
        return self._store.grant_credits(
            user_id=user_id,
            quantity=quantity,
            reason=reason,
            correlation_id=correlation_id,
        )

    def create_run(
        self,
        *,
        user_id: str,
        request: AIRunCreateRequest,
        idempotency_key: str,
    ) -> tuple[AIRunResponse, bool]:
        key = idempotency_key.strip()
        if idempotency_key != key or not 8 <= len(key) <= 128:
            raise AIServiceError(422, "ai_invalid_idempotency_key", "Invalid idempotency key.")
        if any(not 0x21 <= ord(character) <= 0x7E for character in key):
            raise AIServiceError(422, "ai_invalid_idempotency_key", "Invalid idempotency key.")
        definition = self._catalog.get(request.tool_id)
        if definition is None or definition.state is not AIToolState.READY:
            raise AIServiceError(503, "ai_tool_unavailable", "AI tool is unavailable.")
        if definition.credit_price is None:
            raise AIServiceError(503, "ai_tool_unavailable", "AI tool is unavailable.")
        input_json = json.dumps(
            request.input,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        encoded = input_json.encode("utf-8")
        if len(encoded) > self._input_max_bytes:
            raise AIServiceError(413, "ai_input_too_large", "AI input is too large.")
        try:
            run, created = self._store.create_run(
                user_id=user_id,
                tool_id=definition.id,
                contract_version=definition.contract_version,
                model_policy=definition.model_policy,
                credit_price=definition.credit_price,
                idempotency_key=key,
                input_json=input_json,
                input_sha256=hashlib.sha256(encoded).hexdigest(),
            )
        except AIInsufficientCreditsError as error:
            raise AIServiceError(402, "ai_insufficient_credits", "Insufficient credits.") from error
        except AIIdempotencyConflictError as error:
            raise AIServiceError(
                409,
                "ai_idempotency_conflict",
                "Idempotency key was already used for another request.",
            ) from error
        return self._public_run(run), created

    def get_run(self, *, user_id: str, run_id: str) -> AIRunResponse:
        run = self._store.get_run_for_user(user_id=user_id, run_id=run_id)
        if run is None:
            raise AIServiceError(404, "ai_run_not_found", "AI run not found.")
        return self._public_run(run)

    def list_runs(self, *, user_id: str, limit: int) -> tuple[AIRunResponse, ...]:
        return tuple(
            self._public_run(run)
            for run in self._store.list_runs_for_user(user_id=user_id, limit=limit)
        )

    def delete_run(self, *, user_id: str, run_id: str) -> None:
        try:
            run = self._store.delete_run_for_user(user_id=user_id, run_id=run_id)
        except AIRunStateError as error:
            raise AIServiceError(409, "ai_run_running", "AI run is currently running.") from error
        if run is None:
            raise AIServiceError(404, "ai_run_not_found", "AI run not found.")

    def get_credits(self, *, user_id: str) -> CreditAccount:
        return self._store.get_credit_account(user_id=user_id)

    def list_ledger(self, *, user_id: str, limit: int) -> tuple[CreditLedgerEntry, ...]:
        return self._store.list_ledger(user_id=user_id, limit=limit)

    @staticmethod
    def public_credit(account: CreditAccount) -> CreditAccountResponse:
        return CreditAccountResponse(available=account.available, reserved=account.reserved)

    @staticmethod
    def public_ledger(entry: CreditLedgerEntry) -> CreditLedgerEntryResponse:
        return CreditLedgerEntryResponse(
            id=entry.id,
            operation_type=entry.operation_type,
            available_delta=entry.available_delta,
            reserved_delta=entry.reserved_delta,
            run_id=entry.run_id,
            reason=entry.reason,
            created_at=utc_from_ns(entry.created_at),
        )

    @staticmethod
    def _public_run(run: StoredAIRun) -> AIRunResponse:
        output = json.loads(run.output_json) if run.output_json is not None else None
        return AIRunResponse(
            id=run.id,
            tool_id=run.tool_id,
            contract_version=run.contract_version,
            credit_price=run.credit_price,
            state=run.state,
            output=output,
            error_code=run.public_error_code,
            created_at=utc_from_ns(run.created_at),
            updated_at=utc_from_ns(run.updated_at),
        )
