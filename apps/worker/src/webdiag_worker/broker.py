import os
from typing import Protocol

from dramatiq.broker import Broker
from dramatiq.brokers.stub import StubBroker


class BrokerFactory(Protocol):
    def __call__(self) -> Broker: ...


def create_broker() -> Broker:
    backend = os.getenv("WEBDIAG_BROKER_BACKEND", "rabbitmq").strip().lower()
    if backend == "stub":
        return StubBroker()
    if backend != "rabbitmq":
        raise ValueError(f"Unsupported broker backend: {backend}")

    # Lazy import keeps local unit tests independent from the RabbitMQ client.
    from dramatiq.brokers.rabbitmq import RabbitmqBroker

    return RabbitmqBroker(
        url=os.getenv("WEBDIAG_BROKER_URL", "amqp://guest:guest@localhost:5672/"),
    )
