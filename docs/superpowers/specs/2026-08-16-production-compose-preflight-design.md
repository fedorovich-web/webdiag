# Production Compose preflight design

Date: 2026-08-16

## Context

The checked-in Compose files are intentionally development-only. They build the
web image with the default `PUBLIC_RELEASE=false`, run API and artifact storage
in development mode, and accept development credential defaults. Reusing that
stack for a public launch would keep indexing disabled and would not enforce the
production settings already required by FastAPI.

WebDiag's current persistence contract supports one API writer backed by two
SQLite files. This stage therefore prepares a single-host Docker Compose
profile only. It does not select a hosting provider, domain, TLS terminator,
reverse proxy, S3 vendor, or secret manager, and it does not deploy anything.

## Decision

Add a third `docker-compose.production.yml` override used together with the
existing base and account overrides. It changes only production policy:

- the web image receives `PUBLIC_RELEASE=true` at build time and runtime;
- API uses `WEBDIAG_ENVIRONMENT=production`, secure account cookies, durable
  `/data` SQLite paths, distinct required internal secrets, and S3-only private
  artifact configuration;
- worker uses production S3, OpenRouter, internal API origins/secrets, and the
  existing RabbitMQ broker;
- scheduler receives only the internal credentials it needs;
- unused PostgreSQL and Valkey services are removed from the production model;
- API receives only the durable `account_data:/data` volume and worker receives
  no local artifact volume;
- broker management, API, and web ports remain bound to loopback for a host
  reverse proxy; no container publishes a public wildcard port;
- long-running application services use bounded restart policies and API/web
  health checks before dependent services start.

The web Dockerfile gains a bounded build argument with a safe false default so
ordinary development and CI behavior does not change. The production override
sets it to the literal string `true`; no client-visible secret is a build arg.

## Preflight

`scripts/verify-production-compose.mjs` renders the exact three-file stack
through `docker compose config --format json`. It reads the operator's current
environment or an explicit `--env-file`; CI supplies synthetic non-secret
fixtures.
It fails closed unless:

- all expected services exist;
- API and worker are production-mode and local artifact storage is absent;
- web build and runtime public-release values are exactly `true`;
- API, worker, and scheduler internal origins are Docker-internal clean origins;
- synthetic monitoring, crawler, AI, and safety secrets propagate only to the
  services that require them and remain distinct;
- worker alone receives the synthetic OpenRouter key;
- API and worker receive the same S3 endpoint, region, bucket, prefix, access
  key, and secret;
- every sensitive environment name is present on exactly its allowlisted
  services and nowhere else;
- the rendered named-volume inventory contains only `account_data`;
- application ports remain loopback-bound;
- no resolved environment value equals the documented development defaults or
  placeholder strings.

The verifier never prints the rendered Compose model or environment values.
Production operators run the same command with their secret-manager-populated
environment before any build or `up`.

## Secret and release boundaries

`.env.production.example` contains empty required assignments and non-secret
operational defaults only. Copying it unchanged must make Compose interpolation
fail. Real credentials remain outside Git, chat, the repository, and Docker
build contexts. CI creates a synthetic `.env.production` sentinel; the web
builder fails if that sentinel is copied despite `.dockerignore`.

Passing this preflight means the repository can render a fail-closed
single-host production stack. It is not deployment certification. Launch still
requires the selected domain/TLS/reverse proxy, real distinct secrets, a real
S3 probe and recovery drill, OpenRouter evaluation/cost approval for AI
activation, live health checks, and an explicit release/deploy decision.

## Verification

Regression tests inspect the production files and script contract before
implementation. The targeted workspace tests and production Compose verifier
run once after the group. Docker Compose configuration is rendered without
starting containers. CI builds all three images and starts the web image with a
bounded readiness loop, then requires the public `robots.txt` allow/sitemap
policy. A fresh repository verification and GitHub CI run are required before
handoff.
