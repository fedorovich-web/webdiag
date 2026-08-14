from __future__ import annotations

import hashlib
import hmac
import json
import time
import uuid

from webdiag_api.ai.artifacts import ArtifactStorage
from webdiag_api.ai.catalog import AIToolCatalog, AIToolState
from webdiag_api.ai.images import ImageValidationError, normalize_image
from webdiag_api.ai.input_resolver import AIInputResolutionError, AIInputResolver
from webdiag_api.ai.models import (
    AICatalogResponse,
    AIImageUploadResponseItem,
    AIRunCreateRequest,
    AIRunResponse,
    AIToolResponse,
    AIWorkerArtifact,
    AIWorkerArtifactReservation,
    AIWorkerClaim,
    CreditAccountResponse,
    CreditLedgerEntryResponse,
    utc_from_ns,
)
from webdiag_api.ai.pagination import AICursorError, decode_cursor, encode_cursor
from webdiag_api.ai.safety import derive_safety_identifier
from webdiag_api.ai.storage import (
    AIIdempotencyConflictError,
    AIInsufficientCreditsError,
    AIRunStateError,
    AIUploadQuotaError,
    AIUploadUnavailableError,
    CreditAccount,
    CreditLedgerEntry,
    SqliteAIStore,
    StoredAIArtifact,
    StoredAIClaim,
    StoredAIRun,
    StoredAIUpload,
)
from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    has_tool_contract,
    validate_output,
    validate_public_input,
)


class AIServiceError(RuntimeError):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


IMAGE_UPLOAD_TOOL_IDS = frozenset({"ai_alt_text_studio", "ai_image_edit_studio"})


class AIService:
    def __init__(
        self,
        store: SqliteAIStore,
        *,
        catalog: AIToolCatalog,
        input_max_bytes: int,
        output_max_bytes: int = 1_000_000,
        input_resolver: AIInputResolver | None = None,
        safety_identifier_secret: str = "",
        artifact_prefix: str = "ai-uploads",
    ) -> None:
        self._store = store
        self._catalog = catalog
        self._input_max_bytes = input_max_bytes
        self._output_max_bytes = output_max_bytes
        self._input_resolver = input_resolver
        self._safety_identifier_secret = safety_identifier_secret
        self._artifact_prefix = artifact_prefix

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

    def create_image_upload(
        self,
        *,
        user_id: str,
        data: bytes,
        content_type_hint: str | None,
        artifact_storage: ArtifactStorage,
    ) -> AIImageUploadResponseItem:
        self.require_image_upload_capability()
        if (
            content_type_hint is None
            or content_type_hint != content_type_hint.strip()
            or not 1 <= len(content_type_hint) <= 200
            or any(
                ord(character) < 0x20 or ord(character) > 0x7E
                for character in content_type_hint
            )
        ):
            raise AIServiceError(
                415,
                "ai_image_content_type_required",
                "Image Content-Type is required.",
            )
        try:
            normalized = normalize_image(data)
        except ImageValidationError as error:
            if error.code in {"image_too_large", "image_normalized_too_large"}:
                raise AIServiceError(413, "ai_image_too_large", "Image is too large.") from error
            raise AIServiceError(422, "ai_invalid_image", "Invalid image.") from error

        upload_id = str(uuid.uuid4())
        try:
            artifact = artifact_storage.put(
                artifact_id=upload_id,
                data=normalized.data,
                media_type=normalized.media_type,
            )
        except Exception as error:
            raise AIServiceError(
                503,
                "ai_upload_storage_unavailable",
                "Image upload storage is unavailable.",
            ) from error
        if (
            artifact.media_type != normalized.media_type
            or artifact.byte_size != normalized.byte_size
            or not hmac.compare_digest(artifact.sha256, normalized.sha256)
        ):
            self._compensate_artifact(artifact_storage, artifact.object_key)
            raise AIServiceError(
                503,
                "ai_upload_storage_unavailable",
                "Image upload storage is unavailable.",
            )
        try:
            upload = self._store.create_upload(
                user_id=user_id,
                upload_id=upload_id,
                object_key=artifact.object_key,
                media_type=artifact.media_type,
                byte_size=artifact.byte_size,
                width=normalized.width,
                height=normalized.height,
                sha256=artifact.sha256,
            )
        except AIUploadQuotaError as error:
            self._compensate_artifact(artifact_storage, artifact.object_key)
            raise AIServiceError(
                409,
                "ai_upload_limit_reached",
                "Active image upload limit reached.",
            ) from error
        except Exception:
            self._compensate_artifact(artifact_storage, artifact.object_key)
            raise
        return self._public_upload(upload)

    def require_image_upload_capability(self) -> None:
        if not any(
            tool.state is AIToolState.READY and tool.id in IMAGE_UPLOAD_TOOL_IDS
            for tool in self._catalog.all()
        ):
            raise AIServiceError(
                503,
                "ai_image_tools_unavailable",
                "AI image tools are unavailable.",
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
        input_value = request.input
        if has_tool_contract(definition.id):
            try:
                input_value = validate_public_input(definition.id, input_value)
            except AIToolContractError as error:
                raise AIServiceError(
                    422,
                    "ai_invalid_tool_input",
                    "Invalid AI tool input.",
                ) from error
        if definition.id == "ai_audit_action_plan":
            if self._input_resolver is None:
                raise AIServiceError(
                    503,
                    "ai_tool_unavailable",
                    "AI tool is unavailable.",
                )
            try:
                input_value = self._input_resolver.resolve(
                    user_id=user_id,
                    tool_id=definition.id,
                    validated_input=input_value,
                )
            except AIInputResolutionError as error:
                raise AIServiceError(error.status_code, error.code, error.message) from error
        source_upload_id: str | None = None
        if definition.id in {"ai_alt_text_studio", "ai_image_edit_studio"}:
            source_upload_id = str(input_value["upload_id"])
            upload = self._store.resolve_upload_for_run(
                user_id=user_id,
                upload_id=source_upload_id,
                idempotency_key=key,
            )
            if upload is None:
                raise AIServiceError(404, "ai_upload_not_found", "Image upload not found.")
            input_value = {
                key: value for key, value in input_value.items() if key != "upload_id"
            }
            input_value["image"] = {
                "object_key": upload.object_key,
                "media_type": upload.media_type,
                "byte_size": upload.byte_size,
                "width": upload.width,
                "height": upload.height,
                "sha256": upload.sha256,
            }
        input_json = json.dumps(
            input_value,
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
                source_upload_id=source_upload_id,
            )
        except AIInsufficientCreditsError as error:
            raise AIServiceError(402, "ai_insufficient_credits", "Insufficient credits.") from error
        except AIIdempotencyConflictError as error:
            raise AIServiceError(
                409,
                "ai_idempotency_conflict",
                "Idempotency key was already used for another request.",
            ) from error
        except AIUploadUnavailableError as error:
            raise AIServiceError(404, "ai_upload_not_found", "Image upload not found.") from error
        return self._public_run(run), created

    def get_run(self, *, user_id: str, run_id: str) -> AIRunResponse:
        run = self._store.get_run_for_user(user_id=user_id, run_id=run_id)
        if run is None:
            raise AIServiceError(404, "ai_run_not_found", "AI run not found.")
        return self._public_run(run)

    def list_runs(
        self,
        *,
        user_id: str,
        limit: int,
        cursor: str | None,
    ) -> tuple[tuple[AIRunResponse, ...], str | None]:
        decoded = self._decode_cursor(cursor, kind="runs")
        rows = self._store.list_runs_for_user(
            user_id=user_id,
            limit=limit + 1,
            after_created_at=decoded.created_at if decoded else None,
            after_id=decoded.item_id if decoded else None,
        )
        page = rows[:limit]
        next_cursor = (
            encode_cursor(
                kind="runs",
                created_at=page[-1].created_at,
                item_id=page[-1].id,
            )
            if len(rows) > limit
            else None
        )
        return tuple(self._public_run(run) for run in page), next_cursor

    def delete_run(self, *, user_id: str, run_id: str) -> None:
        try:
            run = self._store.delete_run_for_user(user_id=user_id, run_id=run_id)
        except AIRunStateError as error:
            raise AIServiceError(409, "ai_run_running", "AI run is currently running.") from error
        if run is None:
            raise AIServiceError(404, "ai_run_not_found", "AI run not found.")

    def get_credits(self, *, user_id: str) -> CreditAccount:
        return self._store.get_credit_account(user_id=user_id)

    def list_ledger(
        self,
        *,
        user_id: str,
        limit: int,
        cursor: str | None = None,
    ) -> tuple[tuple[CreditLedgerEntry, ...], str | None]:
        decoded = self._decode_cursor(cursor, kind="ledger")
        rows = self._store.list_ledger(
            user_id=user_id,
            limit=limit + 1,
            after_created_at=decoded.created_at if decoded else None,
            after_id=decoded.item_id if decoded else None,
        )
        page = rows[:limit]
        next_cursor = (
            encode_cursor(
                kind="ledger",
                created_at=page[-1].created_at,
                item_id=page[-1].id,
            )
            if len(rows) > limit
            else None
        )
        return page, next_cursor

    @staticmethod
    def _decode_cursor(value: str | None, *, kind: str):
        try:
            return decode_cursor(value, kind=kind)
        except AICursorError as error:
            raise AIServiceError(422, "ai_invalid_cursor", "Invalid pagination cursor.") from error

    @staticmethod
    def _compensate_artifact(artifact_storage: ArtifactStorage, object_key: str) -> None:
        try:
            artifact_storage.delete(object_key=object_key)
        except Exception as error:
            raise AIServiceError(
                503,
                "ai_upload_storage_unavailable",
                "Image upload storage is unavailable.",
            ) from error

    def claim_pending(self) -> AIWorkerClaim | None:
        claim = self._store.claim_pending(artifact_prefix=self._artifact_prefix)
        return self._public_claim(claim) if claim is not None else None

    def renew_lease(self, *, run_id: str, lease_token: str) -> int:
        return self._store.renew_lease(run_id=run_id, lease_token=lease_token)

    def mark_submitted(self, *, run_id: str, lease_token: str) -> None:
        self._store.mark_submitted(run_id=run_id, lease_token=lease_token)

    def complete_run(
        self,
        *,
        run_id: str,
        lease_token: str,
        output: dict[str, object],
        provider_request_id: str | None,
        input_units: int,
        output_units: int,
        artifact: AIWorkerArtifact | None = None,
        artifact_storage: ArtifactStorage | None = None,
    ) -> StoredAIRun:
        run = self._store.get_run(run_id=run_id)
        if run is None:
            raise AIServiceError(404, "ai_run_not_found", "AI run not found.")
        normalized_output = output
        stored_artifact: StoredAIArtifact | None = None
        try:
            if run.tool_id in {"ai_image_studio", "ai_image_edit_studio"}:
                reservation = self._store.get_artifact_reservation(run_id=run.id)
                if (
                    reservation is None
                    or artifact is None
                    or artifact.artifact_id != reservation.artifact_id
                    or artifact.object_key != reservation.object_key
                    or reservation.deletion_state not in {"reserved", "committed"}
                ):
                    raise AIToolContractError(
                        "image artifact does not match its reservation"
                    )
                stored_artifact = self._validate_generated_artifact(
                    run=run,
                    output=output,
                    artifact=artifact,
                    artifact_storage=artifact_storage,
                )
            elif artifact is not None:
                raise AIToolContractError("non-image run cannot contain an artifact")
            if has_tool_contract(run.tool_id):
                actual_input_sha256 = hashlib.sha256(run.input_json.encode()).hexdigest()
                if not hmac.compare_digest(actual_input_sha256, run.input_sha256):
                    raise AIToolContractError("persisted AI input digest does not match")
                input_value = json.loads(run.input_json)
                normalized_output = validate_output(run.tool_id, input_value, output)
        except (AIToolContractError, json.JSONDecodeError) as error:
            self._store.fail_run(
                run_id=run_id,
                lease_token=lease_token,
                error_code="ai_invalid_provider_output",
                provider_unknown=False,
            )
            raise AIServiceError(
                422,
                "ai_invalid_provider_output",
                "Invalid AI provider output.",
            ) from error
        output_json = json.dumps(
            normalized_output,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        )
        encoded = output_json.encode("utf-8")
        if len(encoded) > self._output_max_bytes:
            raise AIServiceError(413, "ai_output_too_large", "AI output is too large.")
        return self._store.complete_run(
            run_id=run_id,
            lease_token=lease_token,
            output_json=output_json,
            output_sha256=hashlib.sha256(encoded).hexdigest(),
            provider_request_id=provider_request_id,
            input_units=input_units,
            output_units=output_units,
            artifact=stored_artifact,
        )

    def read_artifact(
        self,
        *,
        user_id: str,
        run_id: str,
        artifact_id: str,
        artifact_storage: ArtifactStorage,
    ) -> tuple[bytes, str]:
        artifact = self._store.get_artifact_for_user(
            user_id=user_id,
            run_id=run_id,
            artifact_id=artifact_id,
        )
        if artifact is None:
            raise AIServiceError(404, "ai_artifact_not_found", "AI artifact not found.")
        try:
            data = artifact_storage.read(
                object_key=artifact.object_key,
                max_bytes=artifact.byte_size,
            )
            digest = hashlib.sha256(data).hexdigest()
            normalized = normalize_image(data)
            if (
                len(data) != artifact.byte_size
                or not hmac.compare_digest(digest, artifact.sha256)
                or normalized.data != data
                or normalized.media_type != artifact.media_type
            ):
                raise ValueError("stored AI artifact failed integrity validation")
        except Exception as error:
            raise AIServiceError(
                500,
                "ai_artifact_unavailable",
                "AI artifact is temporarily unavailable.",
            ) from error
        return data, artifact.media_type

    @staticmethod
    def _validate_generated_artifact(
        *,
        run: StoredAIRun,
        output: dict[str, object],
        artifact: AIWorkerArtifact | None,
        artifact_storage: ArtifactStorage | None,
    ) -> StoredAIArtifact:
        if artifact is None or artifact_storage is None:
            raise AIToolContractError("image run requires a private artifact")
        expected = {
            "artifact_id": artifact.artifact_id,
            "media_type": artifact.media_type,
            "byte_size": artifact.byte_size,
            "sha256": artifact.sha256,
        }
        if output != expected:
            raise AIToolContractError("image output does not match its private artifact")
        try:
            data = artifact_storage.read(
                object_key=artifact.object_key,
                max_bytes=artifact.byte_size,
            )
            normalized = normalize_image(data)
        except Exception as error:
            raise AIToolContractError("image artifact is unavailable") from error
        if (
            len(data) != artifact.byte_size
            or not hmac.compare_digest(hashlib.sha256(data).hexdigest(), artifact.sha256)
            or normalized.data != data
            or normalized.media_type != artifact.media_type
        ):
            raise AIToolContractError("image artifact failed integrity validation")
        return StoredAIArtifact(
            id=artifact.artifact_id,
            run_id=run.id,
            user_id=run.user_id,
            object_key=artifact.object_key,
            media_type=artifact.media_type,
            byte_size=artifact.byte_size,
            sha256=artifact.sha256,
            created_at=time.time_ns(),
            deletion_state="available",
        )

    def fail_run(
        self,
        *,
        run_id: str,
        lease_token: str,
        error_code: str,
        provider_unknown: bool,
    ) -> StoredAIRun:
        return self._store.fail_run(
            run_id=run_id,
            lease_token=lease_token,
            error_code=error_code,
            provider_unknown=provider_unknown,
        )

    def cleanup_uploads(
        self,
        *,
        artifact_storage: ArtifactStorage,
        limit: int,
    ) -> tuple[int, int]:
        pending = self._store.list_uploads_pending_deletion(limit=limit)
        deleted = 0
        failed = 0
        for upload in pending:
            try:
                artifact_storage.delete(object_key=upload.object_key)
            except Exception:
                failed += 1
                continue
            if self._store.mark_upload_deleted(upload_id=upload.id):
                deleted += 1
        return deleted, failed

    def cleanup_artifacts(
        self,
        *,
        artifact_storage: ArtifactStorage,
        limit: int,
    ) -> tuple[int, int]:
        reservations = self._store.list_artifact_reservations_pending_deletion(limit=limit)
        deleted = 0
        failed = 0
        for reservation in reservations:
            try:
                artifact_storage.delete(object_key=reservation.object_key)
            except Exception:
                failed += 1
                continue
            if self._store.mark_artifact_reservation_deleted(
                artifact_id=reservation.artifact_id
            ):
                deleted += 1
        remaining = limit - deleted - failed
        pending = self._store.list_artifacts_pending_deletion(limit=remaining) if remaining else ()
        for artifact in pending:
            try:
                artifact_storage.delete(object_key=artifact.object_key)
            except Exception:
                failed += 1
                continue
            if self._store.mark_artifact_deleted(artifact_id=artifact.id):
                deleted += 1
        return deleted, failed

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

    @staticmethod
    def _public_upload(upload: StoredAIUpload) -> AIImageUploadResponseItem:
        return AIImageUploadResponseItem(
            id=upload.id,
            media_type=upload.media_type,
            byte_size=upload.byte_size,
            width=upload.width,
            height=upload.height,
            sha256=upload.sha256,
            created_at=utc_from_ns(upload.created_at),
            expires_at=utc_from_ns(upload.expires_at),
        )

    def _public_claim(self, claim: StoredAIClaim) -> AIWorkerClaim:
        return AIWorkerClaim(
            run_id=claim.run_id,
            attempt_number=claim.attempt_number,
            lease_token=claim.lease_token,
            lease_expires_at=claim.lease_expires_at,
            tool_id=claim.tool_id,
            contract_version=claim.contract_version,
            model_policy=claim.model_policy,
            safety_identifier=(
                derive_safety_identifier(self._safety_identifier_secret, claim.user_id)
                if self._safety_identifier_secret
                else None
            ),
            artifact_reservation=(
                AIWorkerArtifactReservation(
                    artifact_id=claim.artifact_reservation.artifact_id,
                    object_key=claim.artifact_reservation.object_key,
                )
                if claim.artifact_reservation is not None
                else None
            ),
            input=json.loads(claim.input_json),
        )
