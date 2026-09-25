# WebDiag production on Dokploy

This runbook adapts the verified single-host production Compose model to Dokploy.
It does not authorize a deployment and does not replace the generic production
instructions in `docs/INSTALLATION.md`.

## Topology

Use **Compose Type: Docker Compose**, not Docker Stack. WebDiag builds images from
the repository, while Docker Stack does not support the Compose `build` directive.

The Dokploy overlay is intentionally small:

- `docker-compose.yml`
- `docker-compose.account.override.yml`
- `docker-compose.production.yml`
- `docker-compose.dokploy.yml`

The last file removes host port publishing and keeps only container-network
ports `8000` (API) and `3000` (web). The API is never assigned a public
domain; the web container talks to it through `http://api:8000`.

Before configuring Dokploy, verify the merged model:

```bash
npm run verify:production-dokploy-compose -- --env-file /secure/path/webdiag.production.env
```

A successful result is:

```text
Dokploy production Compose preflight passed: services=3
```

This command first runs the normal core production preflight, then verifies that
the Dokploy overlay publishes no host ports and preserves API readiness and the
single `account_data` volume.

## Dokploy configuration

1. Create a **Compose** service and select **Docker Compose**.
2. Connect the approved Git source and release-approved branch/commit. Do not
   deploy a feature branch merely because this runbook exists.
3. Keep Compose Path at `./docker-compose.yml`.
4. Enable **Isolated Deployments**. Dokploy then places every service plus
   Traefik on one per-application network.
5. In **Environment**, copy the values from `.env.production.example`.
   `WEBDIAG_MONITORING_INTERNAL_TOKEN` and
   `WEBDIAG_CRAWLER_INTERNAL_TOKEN` are required, distinct, random secrets.
   Registration admission remains `30/min`, concurrency `2`, lease `30s`.
   `GOOGLE_PAGESPEED_API_KEY` is optional; without it PageSpeed remains a
   graceful skipped check.
6. In **Advanced → Command**, copy Dokploy's current default command from the UI
   first. Preserve its project name / `-p` value and replace only the Compose
   file selection so the effective command (Dokploy automatically prefixes
   `docker`) contains:

```text
compose -p <same-project-name-from-Dokploy> -f docker-compose.yml -f docker-compose.account.override.yml -f docker-compose.production.yml -f docker-compose.dokploy.yml up -d --build --remove-orphans
```

Do not invent a different `COMPOSE_PROJECT_NAME`: Dokploy uses it to identify
Compose services and scheduled jobs.

## Domain and TLS

Use Dokploy's native **Domains** tab. Add only the `web` service and container
port `3000`; do not create a public API domain. For the production site, point
the DNS record for `webdiag.ru` to the server and configure HTTPS/certificate
handling in Dokploy.

Before deploying, use **Preview Compose** and verify:

- Dokploy added Traefik labels to `web`;
- the generated load-balancer port is `3000`;
- isolated networking is attached to all three services;
- no service has a published host port;
- `api` remains reachable only through the Compose network.

Dokploy's native Domains flow adds the routing labels during deployment, so
Traefik labels are deliberately not committed to this repository.

## Post-deploy smoke gate

A deployment is not accepted until all of these are checked on the real domain:

- HTTPS and certificate chain are valid; HTTP redirects as intended;
- homepage, canonical, `robots.txt`, and sitemap use the production origin;
- register → session → logout works and secure cookies are present;
- duplicate/burst registration returns bounded 409/429/503 behavior rather than
  starting unbounded password hashing;
- one safe audit succeeds and PageSpeed is either recorded or honestly skipped;
- project ownership, monitoring lease/run, saved report, and share link work;
- API service is healthy through `/ready`;
- no API port or API hostname is reachable publicly.

## Backup and restore

`account_data` is a Docker named volume, so Dokploy Volume Backups can be used
as a secondary infrastructure copy. A raw live-volume copy is **not** considered
the WebDiag database recovery proof because SQLite may be in WAL mode.

The application-consistent procedure remains the recovery CLI documented in
`docs/INSTALLATION.md`: create the two-database online backup bundle, move it
to protected external storage, run `verify` on the transferred bundle, create
a staged `restore` candidate, and perform a real restore smoke drill before
public launch.

## Dokploy source references

The deployment assumptions above follow the current Dokploy documentation:

- https://docs.dokploy.com/docs/core/docker-compose
- https://docs.dokploy.com/docs/core/docker-compose/domains
- https://docs.dokploy.com/docs/core/docker-compose/utilities
- https://docs.dokploy.com/docs/core/troubleshooting/domains

Dokploy recommends native Compose Domains, supports Isolated Deployments, and
recommends container-network exposure rather than host port publishing for
Compose domain routing.
