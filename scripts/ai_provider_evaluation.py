from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import stat
import sys
import uuid
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Protocol

from webdiag_api.ai.catalog import AIToolDefinition, DEFAULT_AI_CATALOG
from webdiag_api.ai.tool_contracts import (
    AIToolContractError,
    validate_output,
    validate_provider_input,
)
from webdiag_worker.ai import (
    KnownSafeProviderError,
    ProviderArtifactReservation,
    ProviderOutcomeUnknownError,
    ProviderRequest,
    ProviderResult,
)
from webdiag_worker.artifact_storage import (
    ArtifactStorage,
    StoredArtifact,
    artifact_storage_from_env,
)
from webdiag_worker.openrouter_provider import OpenRouterProvider

CASES_CONTRACT = "webdiag.ai.provider_eval_cases.v1"
VALIDATION_CONTRACT = "webdiag.ai.provider_eval_validation.v1"
EXECUTION_CONTRACT = "webdiag.ai.provider_eval_execution.v1"
EVIDENCE_CONTRACT = "webdiag.ai.provider_eval_evidence.v1"
MAX_CASE_FILE_BYTES = 2_000_000
MAX_CASES = 20
REPO_ROOT = Path(__file__).resolve().parent.parent


class _ProviderFactory(Protocol):
    def __call__(self) -> object: ...


class EvaluationConfigurationError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class EvaluationCase:
    case_id: str
    locale: str
    provider_input: dict[str, object]


@dataclass(frozen=True, slots=True)
class EvaluationManifest:
    definition: AIToolDefinition
    cases: tuple[EvaluationCase, ...]


@dataclass(slots=True)
class _ReservedOutput:
    path: Path
    output: BinaryIO
    file_stat: os.stat_result
    directory_stats: tuple[tuple[Path, os.stat_result], ...]

    def is_current(self) -> bool:
        try:
            if not os.path.samestat(
                self.file_stat,
                self.path.stat(follow_symlinks=False),
            ):
                return False
            for path, expected in self.directory_stats:
                current = path.lstat()
                if _stat_is_link_or_reparse(current) or not os.path.samestat(
                    expected,
                    current,
                ):
                    return False
            return True
        except OSError:
            return False


@dataclass(frozen=True, slots=True)
class _EvaluationArtifactStorage:
    input_storage: ArtifactStorage
    output_storage: ArtifactStorage
    output_prefix: str

    def put(
        self,
        *,
        artifact_id: str,
        data: bytes,
        media_type: str,
    ) -> StoredArtifact:
        return self.output_storage.put(
            artifact_id=artifact_id,
            data=data,
            media_type=media_type,
        )

    def put_reserved(
        self,
        *,
        artifact_id: str,
        object_key: str,
        data: bytes,
        media_type: str,
    ) -> StoredArtifact:
        return self.output_storage.put_reserved(
            artifact_id=artifact_id,
            object_key=object_key,
            data=data,
            media_type=media_type,
        )

    def read(self, *, object_key: str, max_bytes: int) -> bytes:
        return self.input_storage.read(object_key=object_key, max_bytes=max_bytes)

    def delete(self, *, object_key: str) -> None:
        if object_key.startswith(f"{self.output_prefix}/"):
            self.output_storage.delete(object_key=object_key)
            return
        self.input_storage.delete(object_key=object_key)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="ai-provider-evaluation")
    parser.add_argument("--cases", required=True)
    parser.add_argument("--output")
    parser.add_argument("--execute-paid-provider", action="store_true")
    return parser


def run_cli(
    argv: Sequence[str] | None = None,
    *,
    repo_root: Path = REPO_ROOT,
    provider_factory: _ProviderFactory | None = None,
) -> int:
    arguments = _parser().parse_args(argv)
    try:
        manifest = _load_manifest(Path(arguments.cases))
    except EvaluationConfigurationError as error:
        print(str(error), file=sys.stderr)
        return 2
    if not arguments.execute_paid_provider:
        print(
            json.dumps(
                {
                    "case_count": len(manifest.cases),
                    "contract_version": VALIDATION_CONTRACT,
                    "locales": sorted({case.locale for case in manifest.cases}),
                    "network_calls": 0,
                    "tool_id": manifest.definition.id,
                },
                sort_keys=True,
                separators=(",", ":"),
            )
        )
        return 0
    try:
        output_path = _resolve_output_path(repo_root, arguments.output)
        artifact_prefix = _evaluation_artifact_prefix(manifest.definition.id)
        reserved_output = _reserve_output(repo_root, output_path)
    except EvaluationConfigurationError as error:
        print(str(error), file=sys.stderr)
        return 2
    except RuntimeError:
        print("provider evaluation adapter is unavailable", file=sys.stderr)
        return 2
    keep_output = False
    try:
        evidence = _execute_manifest(
            manifest,
            provider_factory=provider_factory
            or _default_provider_factory(manifest.definition.id, artifact_prefix),
            artifact_prefix=artifact_prefix,
        )
        evidence_bytes = (
            json.dumps(
                evidence,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode()
            + b"\n"
        )
        reserved_output.output.write(evidence_bytes)
        reserved_output.output.flush()
        os.fsync(reserved_output.output.fileno())
        if not reserved_output.is_current():
            raise EvaluationConfigurationError(
                "provider evaluation output identity changed"
            )
        keep_output = True
    except EvaluationConfigurationError as error:
        print(str(error), file=sys.stderr)
        return 2
    except RuntimeError:
        print("provider evaluation adapter is unavailable", file=sys.stderr)
        return 2
    finally:
        reserved_output.output.close()
        if not keep_output and reserved_output.is_current():
            output_path.unlink(missing_ok=True)
    report = {
        "case_count": len(evidence["cases"]),
        "contract_version": EXECUTION_CONTRACT,
        "evidence_sha256": hashlib.sha256(evidence_bytes).hexdigest(),
        "manual_output_review_required": manifest.definition.id
        in {"ai_image_studio", "ai_image_edit_studio"},
        "provider_cost_nano_usd": _evidence_cost(evidence),
        "status": evidence["status"],
        "tool_id": manifest.definition.id,
    }
    failure = evidence.get("failure")
    if isinstance(failure, dict) and isinstance(failure.get("class"), str):
        report["failure_class"] = failure["class"]
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    if evidence["status"] != "complete":
        print("provider evaluation did not complete", file=sys.stderr)
        return 2
    return 0


def _resolve_output_path(repo_root: Path, raw_output: str | None) -> Path:
    if not isinstance(raw_output, str) or not raw_output:
        raise EvaluationConfigurationError("provider evaluation output is required")
    repository = repo_root.resolve()
    allowed_root = repository / ".webdiag" / "ai-evals"
    candidate = Path(raw_output)
    if not candidate.is_absolute():
        candidate = repository / candidate
    candidate = Path(os.path.abspath(candidate))
    try:
        candidate.relative_to(allowed_root)
    except ValueError as error:
        raise EvaluationConfigurationError(
            "provider evaluation output must stay under .webdiag/ai-evals"
        ) from error
    if candidate.parent != allowed_root:
        raise EvaluationConfigurationError(
            "provider evaluation output must be a direct .webdiag/ai-evals file"
        )
    if _is_link_or_reparse(candidate) or candidate.exists():
        raise EvaluationConfigurationError("provider evaluation output already exists")
    return candidate


def _execute_manifest(
    manifest: EvaluationManifest,
    *,
    provider_factory: _ProviderFactory,
    artifact_prefix: str | None,
) -> dict[str, object]:
    evidence_cases: list[dict[str, object]] = []
    provider_value = provider_factory()
    enter = getattr(provider_value, "__enter__", None)
    exit_method = getattr(provider_value, "__exit__", None)
    if not callable(enter) or not callable(exit_method):
        raise EvaluationConfigurationError("provider evaluation adapter is invalid")
    with provider_value as provider:
        for case in manifest.cases:
            input_bytes = json.dumps(
                case.provider_input,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode()
            input_sha256 = hashlib.sha256(input_bytes).hexdigest()
            reservation = _artifact_reservation(
                manifest.definition.id,
                artifact_prefix,
            )
            request = ProviderRequest(
                run_id=str(uuid.uuid4()),
                tool_id=manifest.definition.id,
                contract_version=manifest.definition.contract_version,
                model_policy=manifest.definition.model_policy,
                input=case.provider_input,
                safety_identifier=hashlib.sha256(
                    (
                        f"webdiag-eval:{manifest.definition.id}:"
                        f"{case.case_id}:{input_sha256}"
                    ).encode()
                ).hexdigest(),
                artifact_reservation=reservation,
            )
            prepare = getattr(provider, "prepare", None)
            try:
                prepared = prepare(request) if callable(prepare) else request
                result = provider.execute(prepared)
            except KnownSafeProviderError:
                return _evidence(
                    manifest,
                    evidence_cases,
                    status="incomplete",
                    failure=_failure(
                        case.case_id,
                        "known_safe_failure",
                        reservation=reservation,
                    ),
                )
            except ProviderOutcomeUnknownError:
                return _evidence(
                    manifest,
                    evidence_cases,
                    status="incomplete",
                    failure=_failure(
                        case.case_id,
                        "provider_unknown",
                        reservation=reservation,
                    ),
                )
            if not isinstance(result, ProviderResult):
                return _evidence(
                    manifest,
                    evidence_cases,
                    status="incomplete",
                    failure=_failure(
                        case.case_id,
                        "invalid_result",
                        reservation=reservation,
                    ),
                )
            try:
                output = validate_output(
                    manifest.definition.id,
                    case.provider_input,
                    result.output,
                )
            except AIToolContractError:
                return _evidence(
                    manifest,
                    evidence_cases,
                    status="incomplete",
                    failure=_failure(
                        case.case_id,
                        "invalid_output",
                        reservation=reservation,
                        input_units=result.input_units,
                        output_units=result.output_units,
                        provider_cost_nano_usd=result.provider_cost_nano_usd,
                        provider_output=result.output,
                        provider_request_id=result.provider_request_id,
                    ),
                )
            if not _artifact_matches_result(
                manifest.definition.id,
                reservation,
                result,
                output,
            ):
                return _evidence(
                    manifest,
                    evidence_cases,
                    status="incomplete",
                    failure=_failure(
                        case.case_id,
                        "invalid_artifact",
                        reservation=reservation,
                        input_units=result.input_units,
                        output_units=result.output_units,
                        provider_cost_nano_usd=result.provider_cost_nano_usd,
                        provider_output=result.output,
                        provider_request_id=result.provider_request_id,
                    ),
                )
            artifact = None
            if result.artifact is not None:
                artifact = {
                    "artifact_id": result.artifact.artifact_id,
                    "object_key": result.artifact.object_key,
                    "media_type": result.artifact.media_type,
                    "byte_size": result.artifact.byte_size,
                    "sha256": result.artifact.sha256,
                }
            evidence_cases.append(
                {
                    "artifact": artifact,
                    "case_id": case.case_id,
                    "input_sha256": input_sha256,
                    "input_units": result.input_units,
                    "locale": case.locale,
                    "output": output,
                    "output_units": result.output_units,
                    "provider_cost_nano_usd": result.provider_cost_nano_usd,
                    "provider_input": case.provider_input,
                    "provider_request_id": result.provider_request_id,
                }
            )
    return _evidence(manifest, evidence_cases, status="complete")


def _evidence(
    manifest: EvaluationManifest,
    cases: list[dict[str, object]],
    *,
    status: str,
    failure: dict[str, object] | None = None,
) -> dict[str, object]:
    evidence: dict[str, object] = {
        "cases": cases,
        "contract_version": EVIDENCE_CONTRACT,
        "model_policy": manifest.definition.model_policy,
        "status": status,
        "tool_contract_version": manifest.definition.contract_version,
        "tool_id": manifest.definition.id,
    }
    if failure is not None:
        evidence["failure"] = failure
    return evidence


def _failure(
    case_id: str,
    failure_class: str,
    *,
    reservation: ProviderArtifactReservation | None,
    **details: object,
) -> dict[str, object]:
    failure: dict[str, object] = {
        "case_id": case_id,
        "class": failure_class,
        **details,
    }
    if reservation is not None:
        failure["artifact_reservation"] = {
            "artifact_id": reservation.artifact_id,
            "object_key": reservation.object_key,
        }
    return failure


def _evidence_cost(evidence: dict[str, object]) -> int:
    raw_cases = evidence.get("cases")
    total = 0
    if isinstance(raw_cases, list):
        for case in raw_cases:
            if isinstance(case, dict) and isinstance(
                case.get("provider_cost_nano_usd"), int
            ):
                total += case["provider_cost_nano_usd"]
    failure = evidence.get("failure")
    if isinstance(failure, dict) and isinstance(
        failure.get("provider_cost_nano_usd"), int
    ):
        total += failure["provider_cost_nano_usd"]
    return total


def _artifact_reservation(
    tool_id: str,
    artifact_prefix: str | None,
) -> ProviderArtifactReservation | None:
    if tool_id not in {"ai_image_studio", "ai_image_edit_studio"}:
        return None
    if artifact_prefix is None:
        raise EvaluationConfigurationError(
            "provider evaluation artifact prefix is unavailable"
        )
    artifact_id = str(uuid.uuid4())
    digest = hashlib.sha256(f"{tool_id}:{artifact_id}".encode()).hexdigest()
    return ProviderArtifactReservation(
        artifact_id=artifact_id,
        object_key=f"{artifact_prefix}/{digest[:2]}/{digest[2:]}",
    )


def _artifact_matches_result(
    tool_id: str,
    reservation: ProviderArtifactReservation | None,
    result: ProviderResult,
    output: dict[str, object],
) -> bool:
    is_image_tool = tool_id in {"ai_image_studio", "ai_image_edit_studio"}
    if not is_image_tool:
        return reservation is None and result.artifact is None
    artifact = result.artifact
    if (
        reservation is None
        or artifact is None
        or artifact.artifact_id != reservation.artifact_id
        or artifact.object_key != reservation.object_key
    ):
        return False
    return output == {
        "artifact_id": artifact.artifact_id,
        "media_type": artifact.media_type,
        "byte_size": artifact.byte_size,
        "sha256": artifact.sha256,
    }


def _evaluation_artifact_prefix(tool_id: str) -> str | None:
    if tool_id not in {"ai_image_studio", "ai_image_edit_studio"}:
        return None
    prefix = os.getenv("WEBDIAG_AI_EVALUATION_ARTIFACT_PREFIX", "ai-evals")
    normalized = prefix.strip().strip("/")
    if not normalized or not re.fullmatch(
        r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*",
        normalized,
    ):
        raise EvaluationConfigurationError(
            "provider evaluation artifact prefix is invalid"
        )
    input_prefix = os.getenv("WEBDIAG_AI_ARTIFACT_PREFIX", "ai-uploads").strip().strip("/")
    if normalized == input_prefix:
        raise EvaluationConfigurationError(
            "provider evaluation artifact prefix must differ from the input prefix"
        )
    return normalized


def _default_provider_factory(
    tool_id: str,
    artifact_prefix: str | None,
) -> _ProviderFactory:
    def factory() -> OpenRouterProvider:
        if artifact_prefix is None:
            return OpenRouterProvider.from_env()
        input_storage = artifact_storage_from_env()
        output_environment = dict(os.environ)
        output_environment["WEBDIAG_AI_ARTIFACT_PREFIX"] = artifact_prefix
        output_storage = artifact_storage_from_env(output_environment)
        return OpenRouterProvider.from_env(
            artifact_storage=_EvaluationArtifactStorage(
                input_storage=input_storage,
                output_storage=output_storage,
                output_prefix=artifact_prefix,
            )
        )

    return factory


def _is_link_or_reparse(path: Path) -> bool:
    try:
        value = path.lstat()
    except FileNotFoundError:
        return False
    except OSError as error:
        raise EvaluationConfigurationError(
            "provider evaluation path is unavailable"
        ) from error
    return _stat_is_link_or_reparse(value)


def _stat_is_link_or_reparse(value: os.stat_result) -> bool:
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0)
    attributes = getattr(value, "st_file_attributes", 0)
    return stat.S_ISLNK(value.st_mode) or bool(attributes & reparse_flag)


def _ensure_private_output_directory(
    repo_root: Path,
    path: Path,
) -> tuple[tuple[Path, os.stat_result], ...]:
    repository = repo_root.resolve()
    webdiag_directory = repository / ".webdiag"
    evaluation_directory = webdiag_directory / "ai-evals"
    if path.parent != evaluation_directory:
        raise EvaluationConfigurationError(
            "provider evaluation output must stay under .webdiag/ai-evals"
        )
    directory_stats: list[tuple[Path, os.stat_result]] = []
    for directory in (webdiag_directory, evaluation_directory):
        try:
            directory.mkdir()
        except FileExistsError:
            pass
        except OSError as error:
            raise EvaluationConfigurationError(
                "provider evaluation output is unavailable"
            ) from error
        if _is_link_or_reparse(directory):
            raise EvaluationConfigurationError(
                "provider evaluation output directory must not be a link"
            )
        try:
            directory_stat = directory.stat(follow_symlinks=False)
        except OSError as error:
            raise EvaluationConfigurationError(
                "provider evaluation output is unavailable"
            ) from error
        if not stat.S_ISDIR(directory_stat.st_mode):
            raise EvaluationConfigurationError(
                "provider evaluation output directory is invalid"
            )
        directory_stats.append((directory, directory_stat))
    return tuple(directory_stats)


def _reserve_output(repo_root: Path, path: Path) -> _ReservedOutput:
    try:
        directory_stats = _ensure_private_output_directory(repo_root, path)
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        flags |= getattr(os, "O_NOFOLLOW", 0)
        flags |= getattr(os, "O_BINARY", 0)
        descriptor = os.open(
            path,
            flags,
            0o600,
        )
        output = os.fdopen(descriptor, "wb")
        reserved = _ReservedOutput(
            path=path,
            output=output,
            file_stat=os.fstat(output.fileno()),
            directory_stats=directory_stats,
        )
        if not reserved.is_current():
            output.close()
            if reserved.is_current():
                path.unlink(missing_ok=True)
            raise EvaluationConfigurationError(
                "provider evaluation output identity changed"
            )
        return reserved
    except FileExistsError as error:
        raise EvaluationConfigurationError(
            "provider evaluation output already exists"
        ) from error
    except OSError as error:
        raise EvaluationConfigurationError(
            "provider evaluation output is unavailable"
        ) from error


def _load_manifest(path: Path) -> EvaluationManifest:
    try:
        flags = os.O_RDONLY
        flags |= getattr(os, "O_NOFOLLOW", 0)
        flags |= getattr(os, "O_BINARY", 0)
        descriptor = os.open(path, flags)
        with os.fdopen(descriptor, "rb") as cases_file:
            file_stat = os.fstat(cases_file.fileno())
            if not stat.S_ISREG(file_stat.st_mode) or _is_link_or_reparse(path):
                raise EvaluationConfigurationError(
                    "provider evaluation cases are unavailable"
                )
            data = cases_file.read(MAX_CASE_FILE_BYTES + 1)
    except OSError as error:
        raise EvaluationConfigurationError(
            "provider evaluation cases are unavailable"
        ) from error
    if not 2 <= len(data) <= MAX_CASE_FILE_BYTES:
        raise EvaluationConfigurationError("provider evaluation cases are invalid")
    try:
        raw = json.loads(data)
    except (UnicodeDecodeError, json.JSONDecodeError, RecursionError) as error:
        raise EvaluationConfigurationError("provider evaluation cases are invalid") from error
    if not isinstance(raw, dict) or set(raw) != {
        "contract_version",
        "tool_id",
        "cases",
    }:
        raise EvaluationConfigurationError("provider evaluation cases are invalid")
    tool_id = raw.get("tool_id")
    definition = DEFAULT_AI_CATALOG.get(tool_id) if isinstance(tool_id, str) else None
    raw_cases = raw.get("cases")
    if (
        raw.get("contract_version") != CASES_CONTRACT
        or definition is None
        or not isinstance(raw_cases, list)
        or not 2 <= len(raw_cases) <= MAX_CASES
    ):
        raise EvaluationConfigurationError("provider evaluation cases are invalid")
    cases: list[EvaluationCase] = []
    case_ids: set[str] = set()
    for raw_case in raw_cases:
        if not isinstance(raw_case, dict) or set(raw_case) != {
            "case_id",
            "provider_input",
        }:
            raise EvaluationConfigurationError("provider evaluation cases are invalid")
        case_id = raw_case.get("case_id")
        provider_input = raw_case.get("provider_input")
        if (
            not isinstance(case_id, str)
            or not re.fullmatch(r"[a-z][a-z0-9_-]{2,63}", case_id)
            or case_id in case_ids
        ):
            raise EvaluationConfigurationError("provider evaluation cases are invalid")
        try:
            normalized = validate_provider_input(definition.id, provider_input)
        except AIToolContractError as error:
            raise EvaluationConfigurationError(
                "provider evaluation cases are invalid"
            ) from error
        if normalized != provider_input:
            raise EvaluationConfigurationError("provider evaluation cases are not canonical")
        locale = normalized.get("locale")
        if locale not in {"ru", "en"}:
            raise EvaluationConfigurationError("provider evaluation cases are invalid")
        case_ids.add(case_id)
        cases.append(
            EvaluationCase(
                case_id=case_id,
                locale=locale,
                provider_input=normalized,
            )
        )
    if {case.locale for case in cases} != {"ru", "en"}:
        raise EvaluationConfigurationError("provider evaluation cases require RU and EN")
    return EvaluationManifest(definition=definition, cases=tuple(cases))


def main(argv: Sequence[str] | None = None) -> int:
    return run_cli(argv)


if __name__ == "__main__":
    raise SystemExit(main())
