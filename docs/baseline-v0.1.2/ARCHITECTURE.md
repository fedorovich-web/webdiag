# ARCHITECTURE.md — WebDiag

Дата: 2026-07-16
Статус: **accepted baseline v0.1.0**

## 1. Структура решения

Предлагаемый monorepo:

```text
apps/
  web/              Next.js public site + dashboard
  api/              FastAPI API
  worker/           Dramatiq actors: fetch, crawl, Chromium, monitoring
packages/
  contracts/        versioned API schemas / generated clients
  product-registry/ tools, checks, limits, capabilities
  ui/               WebDiag design system
services/
  url-gateway/      единая URL security policy
infra/
  docker/
  migrations/
docs/
registry/
```

Репозиторий пока не создан; структура является утверждённым планом.

## 2. Технологический baseline

### Frontend

- Node.js 24 LTS.
- Next.js 16.2.x.
- React 19.2.x.
- TypeScript.
- App Router.
- Server Components по умолчанию.
- Client Components только для интерактивных инструментов.
- CSS variables и design tokens.
- Zod.
- Vitest + React Testing Library.
- Playwright + axe-core.
- Lighthouse CI.
- Stylelint.

### Backend

- Python 3.14.x, с compatibility gate перед окончательным pin.
- FastAPI 0.139.x.
- Pydantic v2.
- SQLAlchemy 2.x.
- Alembic.
- PostgreSQL 18.x.
- httpx.
- structlog.
- pytest, Ruff, Pyright.

### Async и инфраструктура

- RabbitMQ 4.x как durable broker для Dramatiq.
- Dramatiq 2.2.x.
- Valkey для rate limiting, cache, short-lived coordination и deduplication; не единственный источник durable job state.
- PostgreSQL — source of truth для пользователей, сайтов, jobs, findings, snapshots, monitoring events и product registry versions.
- Chromium/Playwright в отдельном worker image.
- Docker Compose для local/staging parity.
- Reverse proxy: Caddy либо Nginx выбирается отдельным deployment ADR.

## 3. Почему не 110 route handlers

Каждый инструмент является registry entry:

```text
ToolDefinition
  id
  slug
  version
  title
  category
  input_schema
  output_schema
  executor_class
  executor_key
  risk_tier
  auth_policy
  limits
  seo_metadata
  status
```

Общий flow:

```text
route from registry
→ validate input
→ resolve execution policy
→ enforce quota/rate limits
→ execute browser/fetch/DNS/crawl/Chromium/composite adapter
→ normalize result
→ render tool-specific presentation
```

## 4. Executor-классы

- `browser`: локальные вычисления.
- `safe_fetch`: HTTP только через URL Security Gateway.
- `dns_tls`: DNS, WHOIS, TLS.
- `crawler`: durable ограниченный обход.
- `chromium`: изолированный browser worker.
- `composite`: оркестрация общих компонентов.

## 5. Audit engine

Проверки хранятся в versioned registry. Каждый finding включает:

- check id;
- check version;
- severity;
- status;
- summary;
- evidence;
- recommendation;
- affected resource;
- measurement metadata;
- timestamp.

Изменение scoring/check methodology создаёт новую версию. Исторические результаты сохраняют используемые версии.

## 6. Данные

Минимальные сущности:

- users;
- sessions;
- projects;
- sites;
- audit_jobs;
- crawl_jobs;
- scanned_pages;
- findings;
- check_definitions;
- check_versions;
- reports;
- monitor_configs;
- monitor_events;
- incidents;
- notifications;
- usage_records;
- audit_log.

## 7. Single source of truth

`product-registry` управляет:

- числом инструментов;
- статусом инструмента;
- категориями;
- limits;
- доступностью функций;
- числом audit checks;
- версиями engines;
- поддерживаемыми каналами уведомлений.

Public site, dashboard, API, docs, sitemap и tests читают одни данные. Ручное дублирование числа «100» в шаблонах запрещено.

## 8. Internationalization

- Russian routes have no locale prefix; English routes use `/en/`.
- Tool slugs are locale-neutral.
- Product registry stores localized metadata.
- Content records use locale plus `translation_group_id`.
- Sitemap, canonical and hreflang are generated from publication state.

## 9. Content platform

Blog, guides and glossary use structured content with editorial states, sources and revision dates. Initial storage may be repository-backed MDX/content collections behind a replaceable content repository interface.
