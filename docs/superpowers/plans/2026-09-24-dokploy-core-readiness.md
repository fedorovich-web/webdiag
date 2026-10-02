# Dokploy core deployment readiness

## Scope

Prepare the existing three-service production core for a single-host Dokploy Docker Compose deployment without changing the web UI or enabling optional AI runtime. Keep the current host-reverse-proxy Compose path unchanged. No deployment, branch movement, or live provider calls are part of this work.

## Implementation

1. Add a dedicated, self-contained Dokploy Compose model containing only `api`, `monitoring_scheduler`, and `web`. Preserve production settings and the single SQLite writer. Use one named volume for both SQLite files, no host-published ports, and `expose: 3000` only for web. Dokploy Domains and Isolated Deployments will supply routing/network configuration.
2. Add a regression test that renders both the current core model and the Dokploy model with `docker compose config --no-interpolate --format json`. Assert service inventory, secret references, production settings, health/dependency configuration, persistent volume topology, and no host-published ports. Compare equivalent service settings so future core changes cannot silently drift.
3. Add a Dokploy production preflight that renders the Dokploy file with actual operator-provided environment and validates security-critical settings without logging secrets. Do not use synthetic credentials to certify deployment.
4. Document the Dokploy UI setup, secret handling, TLS/DNS configuration, backup/restore drill, and exact runtime smoke checks. State what remains unverified until the real server/domain are available.

## Verification

Run the new regression test, existing workspace/security tests, Python backend suites, static checks, and Docker Compose structural validation. Production preflight requiring secrets must fail closed if real secrets are unavailable. Do not claim runtime/TLS/domain readiness from static checks.
