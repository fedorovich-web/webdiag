import dramatiq

from webdiag_worker.ai import cleanup_ai_artifacts, run_one_ai_job
from webdiag_worker.broker import create_broker
from webdiag_worker.monitoring import run_due_monitors
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider

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
    with VercelAIGatewayProvider.from_env() as provider:
        return run_one_ai_job(provider)


@dramatiq.actor(queue_name="system")
def cleanup_ai_artifacts_task() -> tuple[int, int]:
    return cleanup_ai_artifacts()
