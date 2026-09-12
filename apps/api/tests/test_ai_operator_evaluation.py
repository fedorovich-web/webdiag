import json
from copy import deepcopy
from pathlib import Path

import httpx
import pytest
from scripts.ai_provider_evaluation import run_cli
from webdiag_worker.ai import ProviderArtifact, ProviderResult
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider


def _schema_manifest() -> dict[str, object]:
    return {
        "contract_version": "webdiag.ai.provider_eval_cases.v1",
        "tool_id": "ai_schema_studio",
        "cases": [
            {
                "case_id": "ru-organization",
                "provider_input": {
                    "locale": "ru",
                    "schema_type": "Organization",
                    "page_url": "https://ru.example.test/about",
                    "facts": ["WebDiag"],
                },
            },
            {
                "case_id": "en-organization",
                "provider_input": {
                    "locale": "en",
                    "schema_type": "Organization",
                    "page_url": "https://en.example.test/about",
                    "facts": ["WebDiag"],
                },
            },
        ],
    }


def _image_manifest() -> dict[str, object]:
    return {
        "contract_version": "webdiag.ai.provider_eval_cases.v1",
        "tool_id": "ai_image_studio",
        "cases": [
            {
                "case_id": "ru-product",
                "provider_input": {
                    "locale": "ru",
                    "prompt": "Предметная фотография керамической чашки на белом фоне.",
                    "aspect_ratio": "1:1",
                    "quality": "medium",
                    "background": "opaque",
                },
            },
            {
                "case_id": "en-product",
                "provider_input": {
                    "locale": "en",
                    "prompt": "A product photograph of a ceramic cup on a white background.",
                    "aspect_ratio": "1:1",
                    "quality": "medium",
                    "background": "opaque",
                },
            },
        ],
    }


def _image_edit_manifest(image: dict[str, object]) -> dict[str, object]:
    return {
        "contract_version": "webdiag.ai.provider_eval_cases.v1",
        "tool_id": "ai_image_edit_studio",
        "cases": [
            {
                "case_id": "ru-edit",
                "provider_input": {
                    "locale": "ru",
                    "prompt": "Удалить фон и сохранить форму предмета.",
                    "aspect_ratio": "auto",
                    "quality": "medium",
                    "background": "opaque",
                    "image": image,
                },
            },
            {
                "case_id": "en-edit",
                "provider_input": {
                    "locale": "en",
                    "prompt": "Remove the background and keep the product shape.",
                    "aspect_ratio": "auto",
                    "quality": "medium",
                    "background": "opaque",
                    "image": image,
                },
            },
        ],
    }


def _write_manifest(tmp_path: Path, manifest: dict[str, object]) -> Path:
    path = tmp_path / "cases.json"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    return path


def test_validation_mode_never_builds_provider_or_writes_evidence(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    provider_factory_calls = 0

    def provider_factory():
        nonlocal provider_factory_calls
        provider_factory_calls += 1
        raise AssertionError("validation mode must not build a provider")

    assert run_cli(
        ["--cases", str(cases_path)],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 0

    raw_output = capsys.readouterr().out
    report = json.loads(raw_output)
    assert report == {
        "case_count": 2,
        "contract_version": "webdiag.ai.provider_eval_validation.v1",
        "locales": ["en", "ru"],
        "network_calls": 0,
        "tool_id": "ai_schema_studio",
    }
    assert provider_factory_calls == 0
    assert not (tmp_path / ".webdiag").exists()
    assert "https://" not in raw_output
    assert "WebDiag" not in raw_output


@pytest.mark.parametrize(
    "invalid_kind",
    ("extra_manifest_key", "duplicate_case_id", "missing_en", "invalid_provider_input"),
)
def test_invalid_or_incomplete_manifest_is_rejected_before_provider_creation(
    tmp_path: Path,
    capsys,
    invalid_kind: str,
) -> None:
    manifest = deepcopy(_schema_manifest())
    cases = manifest["cases"]
    assert isinstance(cases, list)
    if invalid_kind == "extra_manifest_key":
        manifest["unexpected"] = True
    elif invalid_kind == "duplicate_case_id":
        cases[1]["case_id"] = cases[0]["case_id"]
    elif invalid_kind == "missing_en":
        cases[1]["provider_input"]["locale"] = "ru"
    else:
        cases[1]["provider_input"]["facts"] = []
    cases_path = _write_manifest(tmp_path, manifest)
    provider_factory_calls = 0

    def provider_factory():
        nonlocal provider_factory_calls
        provider_factory_calls += 1
        return object()

    assert run_cli(
        ["--cases", str(cases_path)],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err in {
        "provider evaluation cases are invalid\n",
        "provider evaluation cases require RU and EN\n",
    }
    assert provider_factory_calls == 0


def test_oversized_or_linked_manifest_is_rejected_before_provider_creation(
    tmp_path: Path,
    capsys,
) -> None:
    target = _write_manifest(tmp_path, _schema_manifest())
    linked_path = tmp_path / "linked-cases.json"
    try:
        linked_path.symlink_to(target)
    except OSError:
        pytest.skip("file symlinks are unavailable")
    provider_factory_calls = 0

    def provider_factory():
        nonlocal provider_factory_calls
        provider_factory_calls += 1
        return object()

    assert run_cli(
        ["--cases", str(linked_path)],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2
    assert capsys.readouterr().err == "provider evaluation cases are unavailable\n"
    assert provider_factory_calls == 0

    oversized_path = tmp_path / "oversized-cases.json"
    oversized_path.write_bytes(b"{" + b" " * 2_000_000)
    assert run_cli(
        ["--cases", str(oversized_path)],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2
    assert capsys.readouterr().err == "provider evaluation cases are invalid\n"
    assert provider_factory_calls == 0


def test_explicit_execution_writes_private_evidence_and_redacted_summary(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        sent = json.loads(request.content)
        provider_input = json.loads(sent["messages"][1]["content"])
        return httpx.Response(
            200,
            json={
                "id": f"gen_private_{provider_input['locale']}",
                "object": "chat.completion",
                "created": 1_786_000_000,
                "model": "openai/gpt-5.6-sol",
                "choices": [
                    {
                        "finish_reason": "stop",
                        "index": 0,
                        "message": {
                            "content": json.dumps(
                                {
                                    "properties": [
                                        {
                                            "name": "name",
                                            "value": "WebDiag",
                                            "source_fact_indexes": [0],
                                        }
                                    ],
                                    "warnings": [],
                                }
                            ),
                            "refusal": None,
                            "role": "assistant",
                        },
                    }
                ],
                "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 4,
                    "total_tokens": 16,
                    "cost": 0.000012,
                },
            },
        )

    def provider_factory() -> VercelAIGatewayProvider:
        return VercelAIGatewayProvider(
            httpx.Client(
                transport=httpx.MockTransport(handler),
                headers={"Authorization": "Bearer test-only-key"},
            )
        )

    output_path = tmp_path / ".webdiag" / "ai-evals" / "schema-evidence.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 0

    assert len(requests) == 2
    evidence = json.loads(output_path.read_text(encoding="utf-8"))
    assert evidence["contract_version"] == "webdiag.ai.provider_eval_evidence.v1"
    assert evidence["status"] == "complete"
    assert evidence["tool_id"] == "ai_schema_studio"
    assert {case["locale"] for case in evidence["cases"]} == {"ru", "en"}
    assert evidence["cases"][0]["provider_input"]
    assert evidence["cases"][0]["output"]
    raw_output = capsys.readouterr().out
    report = json.loads(raw_output)
    assert report == {
        "case_count": 2,
        "contract_version": "webdiag.ai.provider_eval_execution.v1",
        "evidence_sha256": report["evidence_sha256"],
        "manual_output_review_required": False,
        "provider_cost_nano_usd": 24_000,
        "status": "complete",
        "tool_id": "ai_schema_studio",
    }
    assert len(report["evidence_sha256"]) == 64
    assert "https://" not in raw_output
    assert "WebDiag" not in raw_output
    assert "gen_private" not in raw_output
    assert "test-only-key" not in raw_output


def test_semantic_rejection_writes_incomplete_private_evidence_without_retry(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={
                "id": "gen_private_invalid",
                "object": "chat.completion",
                "created": 1_786_000_000,
                "model": "openai/gpt-5.6-sol",
                "choices": [
                    {
                        "finish_reason": "stop",
                        "index": 0,
                        "message": {
                            "content": json.dumps(
                                {
                                    "properties": [
                                        {
                                            "name": "name",
                                            "value": "Invented Company",
                                            "source_fact_indexes": [0],
                                        }
                                    ],
                                    "warnings": [],
                                }
                            ),
                            "refusal": None,
                            "role": "assistant",
                        },
                    }
                ],
                "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 4,
                    "total_tokens": 16,
                    "cost": 0.000012,
                },
            },
        )

    def provider_factory() -> VercelAIGatewayProvider:
        return VercelAIGatewayProvider(
            httpx.Client(
                transport=httpx.MockTransport(handler),
                headers={"Authorization": "Bearer test-only-key"},
            )
        )

    output_path = tmp_path / ".webdiag" / "ai-evals" / "invalid-evidence.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    assert len(requests) == 1
    evidence = json.loads(output_path.read_text(encoding="utf-8"))
    assert evidence["status"] == "incomplete"
    assert evidence["cases"] == []
    assert evidence["failure"]["case_id"] == "ru-organization"
    assert evidence["failure"]["class"] == "invalid_output"
    assert evidence["failure"]["provider_output"]
    captured = capsys.readouterr()
    assert captured.err == "provider evaluation did not complete\n"
    report = json.loads(captured.out)
    assert report["status"] == "incomplete"
    assert report["failure_class"] == "invalid_output"
    assert report["provider_cost_nano_usd"] == 12_000
    assert "Invented Company" not in captured.out
    assert "gen_private" not in captured.out


@pytest.mark.parametrize(
    ("failure_mode", "failure_class"),
    (
        ("known_safe", "known_safe_failure"),
        ("unknown", "provider_unknown"),
    ),
)
def test_provider_failures_are_classified_with_bounded_transient_retry(
    tmp_path: Path,
    capsys,
    failure_mode: str,
    failure_class: str,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        if failure_mode == "known_safe":
            return httpx.Response(400, json={"error": "private provider detail"})
        raise httpx.ReadTimeout("private provider timeout detail", request=request)

    def provider_factory() -> VercelAIGatewayProvider:
        return VercelAIGatewayProvider(
            httpx.Client(
                transport=httpx.MockTransport(handler),
                headers={"Authorization": "Bearer test-only-key"},
            )
        )

    output_path = (
        tmp_path / ".webdiag" / "ai-evals" / f"{failure_mode}-evidence.json"
    )
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    assert len(requests) == (1 if failure_mode == "known_safe" else 3)
    evidence = json.loads(output_path.read_text(encoding="utf-8"))
    assert evidence["status"] == "incomplete"
    assert evidence["failure"] == {
        "case_id": "ru-organization",
        "class": failure_class,
    }
    captured = capsys.readouterr()
    assert captured.err == "provider evaluation did not complete\n"
    assert json.loads(captured.out)["failure_class"] == failure_class
    assert "private provider" not in captured.out + captured.err


@pytest.mark.parametrize("output_kind", ("outside", "existing"))
def test_invalid_output_target_is_rejected_before_provider_creation(
    tmp_path: Path,
    capsys,
    output_kind: str,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    if output_kind == "outside":
        output_path = tmp_path / "outside-evidence.json"
    else:
        output_path = tmp_path / ".webdiag" / "ai-evals" / "existing.json"
        output_path.parent.mkdir(parents=True)
        output_path.write_text("do not overwrite", encoding="utf-8")
    provider_factory_calls = 0

    def provider_factory():
        nonlocal provider_factory_calls
        provider_factory_calls += 1
        return object()

    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2
    capsys.readouterr()

    assert provider_factory_calls == 0
    if output_kind == "existing":
        assert output_path.read_text(encoding="utf-8") == "do not overwrite"
    else:
        assert not output_path.exists()


def test_linked_output_directory_is_rejected_before_provider_creation(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    outside = tmp_path / "outside-private"
    outside.mkdir()
    linked_webdiag = tmp_path / ".webdiag"
    try:
        linked_webdiag.symlink_to(outside, target_is_directory=True)
    except OSError:
        pytest.skip("directory symlinks are unavailable")
    provider_factory_calls = 0

    def provider_factory():
        nonlocal provider_factory_calls
        provider_factory_calls += 1
        return object()

    output_path = linked_webdiag / "ai-evals" / "evidence.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2
    assert "must not be a link" in capsys.readouterr().err
    assert provider_factory_calls == 0
    assert not (outside / "ai-evals").exists()


def test_image_evaluation_prefix_must_differ_before_provider_creation(
    tmp_path: Path,
    capsys,
    monkeypatch,
) -> None:
    cases_path = _write_manifest(tmp_path, _image_manifest())
    monkeypatch.setenv("WEBDIAG_AI_ARTIFACT_PREFIX", "same-prefix")
    monkeypatch.setenv("WEBDIAG_AI_EVALUATION_ARTIFACT_PREFIX", "same-prefix")
    provider_factory_calls = 0

    def provider_factory():
        nonlocal provider_factory_calls
        provider_factory_calls += 1
        return object()

    output_path = tmp_path / ".webdiag" / "ai-evals" / "evidence.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2
    assert "must differ" in capsys.readouterr().err
    assert provider_factory_calls == 0
    assert not output_path.exists()


def test_output_path_is_reserved_before_provider_factory_can_race(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    output_path = tmp_path / ".webdiag" / "ai-evals" / "reserved.json"
    race_succeeded = False

    class Provider:
        def __enter__(self):
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def execute(self, request) -> ProviderResult:
            return ProviderResult(
                output={
                    "json_ld": {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "url": request.input["page_url"],
                        "name": "WebDiag",
                    },
                    "property_sources": {"/name": [0]},
                    "warnings": [],
                },
                provider_request_id="gen_race_test",
                input_units=1,
                output_units=1,
                provider_cost_nano_usd=1,
            )

    def provider_factory() -> Provider:
        nonlocal race_succeeded
        try:
            with output_path.open("x", encoding="utf-8") as raced_output:
                raced_output.write("raced")
        except FileExistsError:
            pass
        else:
            race_succeeded = True
        return Provider()

    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 0
    capsys.readouterr()

    assert race_succeeded is False
    assert json.loads(output_path.read_text(encoding="utf-8"))["status"] == "complete"


def test_replaced_output_identity_is_not_deleted_or_reported_complete(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    output_path = tmp_path / ".webdiag" / "ai-evals" / "reserved.json"
    moved_path = output_path.with_name("moved-reservation.json")

    class Provider:
        def __enter__(self):
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def execute(self, request) -> ProviderResult:
            return ProviderResult(
                output={
                    "json_ld": {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "url": request.input["page_url"],
                        "name": "WebDiag",
                    },
                    "property_sources": {"/name": [0]},
                    "warnings": [],
                },
                provider_request_id="gen_private_identity",
                provider_cost_nano_usd=1,
            )

    def provider_factory() -> Provider:
        try:
            output_path.replace(moved_path)
        except PermissionError:
            pytest.skip("open output files cannot be renamed on this platform")
        output_path.write_text("replacement", encoding="utf-8")
        return Provider()

    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == "provider evaluation output identity changed\n"
    assert output_path.read_text(encoding="utf-8") == "replacement"
    assert json.loads(moved_path.read_text(encoding="utf-8"))["status"] == "complete"


def test_replaced_webdiag_ancestor_is_not_reported_complete(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    output_path = tmp_path / ".webdiag" / "ai-evals" / "reserved.json"
    moved_webdiag = tmp_path / "moved-webdiag"

    class Provider:
        def __enter__(self):
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def execute(self, request) -> ProviderResult:
            return ProviderResult(
                output={
                    "json_ld": {
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "url": request.input["page_url"],
                        "name": "WebDiag",
                    },
                    "property_sources": {"/name": [0]},
                    "warnings": [],
                },
                provider_request_id="gen_private_ancestor",
                provider_cost_nano_usd=1,
            )

    def provider_factory() -> Provider:
        webdiag_directory = tmp_path / ".webdiag"
        try:
            webdiag_directory.replace(moved_webdiag)
            webdiag_directory.symlink_to(moved_webdiag, target_is_directory=True)
        except (OSError, NotImplementedError):
            pytest.skip("open directory replacement is unavailable")
        return Provider()

    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == "provider evaluation output identity changed\n"
    moved_evidence = moved_webdiag / "ai-evals" / "reserved.json"
    assert json.loads(moved_evidence.read_text(encoding="utf-8"))["status"] == "complete"


def test_image_execution_uses_private_reservations_and_requires_manual_review(
    tmp_path: Path,
    capsys,
    monkeypatch,
) -> None:
    cases_path = _write_manifest(tmp_path, _image_manifest())
    reservations = []
    monkeypatch.setenv("WEBDIAG_AI_ARTIFACT_PREFIX", "ai-uploads")
    monkeypatch.setenv("WEBDIAG_AI_EVALUATION_ARTIFACT_PREFIX", "eval-artifacts")

    class Provider:
        def __enter__(self):
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def execute(self, request) -> ProviderResult:
            reservation = request.artifact_reservation
            assert reservation is not None
            reservations.append(reservation)
            artifact = ProviderArtifact(
                artifact_id=reservation.artifact_id,
                object_key=reservation.object_key,
                media_type="image/png",
                byte_size=1_024,
                sha256="a" * 64,
            )
            return ProviderResult(
                output={
                    "artifact_id": artifact.artifact_id,
                    "media_type": artifact.media_type,
                    "byte_size": artifact.byte_size,
                    "sha256": artifact.sha256,
                },
                provider_request_id="gen_private_image",
                input_units=10,
                output_units=20,
                provider_cost_nano_usd=25_000_000,
                artifact=artifact,
            )

    output_path = tmp_path / ".webdiag" / "ai-evals" / "image-evidence.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=Provider,
    ) == 0

    assert len(reservations) == 2
    assert all(value.object_key.startswith("eval-artifacts/") for value in reservations)
    evidence = json.loads(output_path.read_text(encoding="utf-8"))
    assert evidence["status"] == "complete"
    assert [case["artifact"]["object_key"] for case in evidence["cases"]] == [
        value.object_key for value in reservations
    ]
    report = json.loads(capsys.readouterr().out)
    assert report["manual_output_review_required"] is True
    assert report["provider_cost_nano_usd"] == 50_000_000
    assert "eval-artifacts/" not in json.dumps(report)
    assert "gen_private_image" not in json.dumps(report)


def test_provider_initialization_failure_is_redacted_and_removes_reservation(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _schema_manifest())
    output_path = tmp_path / ".webdiag" / "ai-evals" / "failed.json"

    def provider_factory():
        raise RuntimeError("private-provider-detail")

    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    captured = capsys.readouterr()
    assert captured.out == ""
    assert captured.err == "provider evaluation adapter is unavailable\n"
    assert "private-provider-detail" not in captured.err
    assert not output_path.exists()


def test_image_artifact_must_match_private_reservation(
    tmp_path: Path,
    capsys,
) -> None:
    cases_path = _write_manifest(tmp_path, _image_manifest())

    class Provider:
        def __enter__(self):
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def execute(self, request) -> ProviderResult:
            reservation = request.artifact_reservation
            assert reservation is not None
            artifact = ProviderArtifact(
                artifact_id=reservation.artifact_id,
                object_key="ai-evals/ai_image_studio/ff/" + "b" * 62,
                media_type="image/png",
                byte_size=1_024,
                sha256="a" * 64,
            )
            return ProviderResult(
                output={
                    "artifact_id": artifact.artifact_id,
                    "media_type": artifact.media_type,
                    "byte_size": artifact.byte_size,
                    "sha256": artifact.sha256,
                },
                provider_request_id="gen_private_mismatch",
                provider_cost_nano_usd=25_000_000,
                artifact=artifact,
            )

    output_path = tmp_path / ".webdiag" / "ai-evals" / "mismatch.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(output_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=Provider,
    ) == 2

    evidence = json.loads(output_path.read_text(encoding="utf-8"))
    assert evidence["status"] == "incomplete"
    assert evidence["failure"]["class"] == "invalid_artifact"
    assert evidence["failure"]["artifact_reservation"]["object_key"].startswith(
        "ai-evals/"
    )
    report = json.loads(capsys.readouterr().out)
    assert report["failure_class"] == "invalid_artifact"
    assert "ai-evals/" not in json.dumps(report)
    assert "gen_private_mismatch" not in json.dumps(report)


def test_gateway_provider_rejects_image_generation_without_network_access(
    tmp_path: Path,
    capsys,
    monkeypatch,
) -> None:
    cases_path = _write_manifest(tmp_path, _image_manifest())
    requests: list[httpx.Request] = []
    monkeypatch.setenv("WEBDIAG_AI_ARTIFACT_PREFIX", "ai-uploads")
    monkeypatch.setenv("WEBDIAG_AI_EVALUATION_ARTIFACT_PREFIX", "eval-artifacts")

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(500)

    def provider_factory() -> VercelAIGatewayProvider:
        return VercelAIGatewayProvider(
            httpx.Client(
                transport=httpx.MockTransport(handler),
                headers={"Authorization": "Bearer test-only-key"},
            )
        )

    evidence_path = tmp_path / ".webdiag" / "ai-evals" / "real-image.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(evidence_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    assert requests == []
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    assert evidence["cases"] == []
    report = json.loads(capsys.readouterr().out)
    assert report["status"] == "incomplete"
    assert report["failure_class"] == "known_safe_failure"


def test_gateway_provider_rejects_image_edit_without_network_access(
    tmp_path: Path,
    capsys,
    monkeypatch,
) -> None:
    source_key = "ai-uploads/aa/" + "b" * 62
    cases_path = _write_manifest(
        tmp_path,
        _image_edit_manifest(
            {
                "object_key": source_key,
                "media_type": "image/png",
                "byte_size": 1,
                "width": 3,
                "height": 2,
                "sha256": "0" * 64,
            }
        ),
    )
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(500)

    def provider_factory() -> VercelAIGatewayProvider:
        return VercelAIGatewayProvider(
            httpx.Client(
                transport=httpx.MockTransport(handler),
                headers={"Authorization": "Bearer test-only-key"},
            )
        )

    monkeypatch.setenv("WEBDIAG_AI_ARTIFACT_PREFIX", "ai-uploads")
    monkeypatch.setenv("WEBDIAG_AI_EVALUATION_ARTIFACT_PREFIX", "eval-artifacts")

    evidence_path = tmp_path / ".webdiag" / "ai-evals" / "real-edit.json"
    assert run_cli(
        [
            "--cases",
            str(cases_path),
            "--output",
            str(evidence_path),
            "--execute-paid-provider",
        ],
        repo_root=tmp_path,
        provider_factory=provider_factory,
    ) == 2

    assert requests == []
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    assert evidence["cases"] == []
    report = json.loads(capsys.readouterr().out)
    assert report["status"] == "incomplete"
    assert report["failure_class"] == "known_safe_failure"
