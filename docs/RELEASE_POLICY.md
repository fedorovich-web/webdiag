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

The supported repository-level production preflight is:

```text
npm run verify:production-compose -- --env-file <path-outside-repository>
```

It renders the base, account, and production Compose files without starting
containers and checks the single-writer production policy, exact volume
topology, and environment allowlists. Production secret env-files are excluded
from Docker build context and should remain outside the repository. Passing it
does not certify a domain, TLS/reverse proxy, real secrets, S3 recovery,
provider cost, payment, release, or deployment.

The current package is an internal development scaffold, not a public release.
