import importlib

import pytest


def test_actor_is_registered_with_stub_broker(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "stub")
    actors = importlib.import_module("webdiag_worker.actors")
    assert actors.health_probe.actor_name.endswith("health_probe")
    assert actors.run_pending_ai.actor_name.endswith("run_pending_ai")
    assert actors.cleanup_ai_artifacts_task.actor_name.endswith("cleanup_ai_artifacts_task")


def test_unknown_broker_backend_is_rejected(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "unknown")
    broker = importlib.import_module("webdiag_worker.broker")
    try:
        broker.create_broker()
    except ValueError as error:
        assert "Unsupported broker backend" in str(error)
    else:
        raise AssertionError("Unsupported broker backend was accepted")


def test_ai_actor_import_is_lazy_and_invocation_without_provider_key_fails_closed(
    monkeypatch,
) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "stub")
    monkeypatch.delenv("AI_GATEWAY_API_KEY", raising=False)
    actors = importlib.import_module("webdiag_worker.actors")

    with pytest.raises(RuntimeError, match="AI_GATEWAY_API_KEY"):
        actors.run_pending_ai.fn()


def test_ai_actor_executes_one_job_with_lazily_created_provider(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "stub")
    actors = importlib.import_module("webdiag_worker.actors")

    class Provider:
        exited = False

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            self.exited = True

    provider = Provider()
    seen = []

    monkeypatch.setattr(actors.VercelAIGatewayProvider, "from_env", lambda: provider)

    def run_one(value):
        seen.append(value)
        return True

    monkeypatch.setattr(actors, "run_one_ai_job", run_one)

    assert actors.run_pending_ai.fn() is True
    assert seen == [provider]
    assert provider.exited is True


def test_ai_cleanup_actor_executes_one_bounded_batch(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "stub")
    actors = importlib.import_module("webdiag_worker.actors")
    monkeypatch.setattr(actors, "cleanup_ai_artifacts", lambda: (4, 1))

    assert actors.cleanup_ai_artifacts_task.fn() == (4, 1)
