# ADR-0001: Monorepo

Status: accepted

## Decision

Использовать один repository с `apps/web`, `apps/api`, `apps/worker`, общими registry/contracts/docs.

## Why

Один product registry должен синхронно управлять public site, API, dashboard, sitemap, docs и tests.

## Rejected

- Независимые frontend/backend repositories на старте: повышают drift и release friction.
- Один Next.js full-stack app для всех crawling/network jobs: недостаточная изоляция и неудобный Python ecosystem.
