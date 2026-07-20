import dramatiq

from webdiag_worker.broker import create_broker

broker = create_broker()
dramatiq.set_broker(broker)


@dramatiq.actor(queue_name="system")
def health_probe(value: str) -> str:
    return value
