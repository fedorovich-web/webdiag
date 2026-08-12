import dramatiq

from webdiag_worker.broker import create_broker
from webdiag_worker.monitoring import run_due_monitors

broker = create_broker()
dramatiq.set_broker(broker)


@dramatiq.actor(queue_name="system")
def health_probe(value: str) -> str:
    return value


@dramatiq.actor(queue_name="monitoring")
def run_due_monitoring() -> int:
    return run_due_monitors()


@dramatiq.actor(queue_name="ai")
def run_pending_ai() -> bool:
    raise RuntimeError("AI provider adapter is not configured; A12.0 cannot execute real AI work")
