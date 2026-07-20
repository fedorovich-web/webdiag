# ADR-0002: Platform stack

Status: accepted with compatibility gate

## Decision

Next.js/React/TypeScript + FastAPI/Python + PostgreSQL + RabbitMQ/Dramatiq + Valkey.

## Alternatives

- Next.js-only backend: rejected for crawler, parsing and worker isolation.
- Django monolith: viable, but slower fit for typed API + separate frontend requirement.
- Celery: mature, but Dramatiq chosen for smaller surface and simpler MVP actors.
- Redis/Valkey-only broker: rejected as sole durable messaging decision; RabbitMQ is preferred for job delivery, Valkey remains cache/rate-limit layer.

## Reversibility

Medium. Frontend/API boundaries are explicit; worker broker can be replaced behind queue adapter.
