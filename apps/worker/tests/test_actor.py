import importlib

def test_actor_is_registered_with_stub_broker(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "stub")
    actors = importlib.import_module("webdiag_worker.actors")
    assert actors.health_probe.actor_name.endswith("health_probe")


def test_unknown_broker_backend_is_rejected(monkeypatch) -> None:
    monkeypatch.setenv("WEBDIAG_BROKER_BACKEND", "unknown")
    broker = importlib.import_module("webdiag_worker.broker")
    try:
        broker.create_broker()
    except ValueError as error:
        assert "Unsupported broker backend" in str(error)
    else:
        raise AssertionError("Unsupported broker backend was accepted")
