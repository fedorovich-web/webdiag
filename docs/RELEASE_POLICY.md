# Release policy

`PUBLIC_RELEASE=false` is the default. In this mode robots disallow indexing and sitemap output is empty.

Setting `PUBLIC_RELEASE=true` invokes `scripts/verify-release.mjs`. The build fails unless:

- the registry is the source of truth for declared tools;
- every registry entry has a unique non-empty `id` and `slug`;
- every entry is either `ready` or an explicitly superseded `internal` definition
  whose `supersededBy` target exists, differs from itself, and is `ready`;
- all required application tests and checks are run by the release pipeline.

This registry gate does not activate the separate authenticated AI catalog. An
AI tool remains unavailable until its real provider evaluation, billed-cost,
security, integration, and approved fixed-credit-price gates pass. Those gates
are not inferred from `PUBLIC_RELEASE=true`.

The supported repository-level production core preflight is:

```text
npm run verify:production-compose -- --env-file <path-outside-repository>
```

It renders the base, account, and production Compose files without starting
containers and checks the three-service web/API/scheduler single-writer policy,
exact volume topology, environment allowlists, bounded public-registration work,
and the API readiness healthcheck.
The production healthcheck uses `/ready`, which fails closed when either configured
SQLite path is not read-write reachable; the cheaper `/health` endpoint remains a
process liveness check. Readiness does not replace a recovery-bundle integrity
verification or a real backup/restore drill. The core neither requires nor receives
RabbitMQ, OpenRouter, S3, or AI secrets.

The optional AI topology has a separate fail-closed preflight:

```text
npm run verify:production-ai-compose -- --env-file <path-outside-repository>
```

It adds `docker-compose.production.ai.yml` and verifies RabbitMQ, the AI worker,
private S3 parity, OpenRouter placement, distinct AI secrets, and the same bounded
public-registration policy as the core topology. Passing this
preflight does not activate any AI tool and does not replace the provider,
billed-cost, storage recovery, manual image, or fixed-credit approval gates.

Production secret env-files are excluded from Docker build context and should
remain outside the repository. Neither preflight certifies a domain,
TLS/reverse proxy, real secrets, S3 recovery, provider cost, payment, release,
or deployment.

The current package is an internal development scaffold, not a public release.
