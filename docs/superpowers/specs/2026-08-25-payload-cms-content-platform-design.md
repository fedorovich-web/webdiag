# Payload CMS content platform design

Date: 2026-08-25  
Status: approved in chat; pending implementation plan  
Branch: `feature/backend-production-readiness`

## Objective

Add Payload as the editorial content plane for every public WebDiag content
page without replacing the operational FastAPI backend or weakening the tool
registry, release gates, authentication, or security boundaries.

The CMS must support RU-first, fully bilingual RU/EN publishing. Public pages
read published content at request time. Missing content returns `404`;
temporary CMS failure produces a localized `503` response and does not fall
back to repository content or a last-known-good content cache.

## Confirmed product decisions

- Payload is a separate application and deployment unit under `apps/cms`.
- Payload Admin is served at `cms.webdiag.ru` behind Cloudflare Access or an
  equivalent private access layer.
- Only the owner and internal administrators use the CMS. There is no public
  registration or external-author workflow.
- All public editorial content moves to Payload, including the editorial
  descriptions of published tools.
- Operational tool identity, capability, implementation state, executor
  class, and security contracts remain code-owned in the tool registry and
  backend.
- Existing content moves collection by collection. A migrated collection has
  one source of truth; permanent dual-source operation is prohibited.
- Public pages query Payload at request time. Cross-request content caching and
  repository fallback are prohibited.
- A genuinely absent or unpublished document returns `404`. An unavailable,
  invalid, or timed-out CMS response is a temporary service failure and must
  result in `503` with a bounded `Retry-After` value.

## Current architecture affected by this change

WebDiag is an npm monorepo with a Next.js 16.3 public/account application,
shared tool registry and browser tool packages, a FastAPI API, a monitoring
scheduler, and an optional AI worker overlay.

Public editorial data is currently split between:

- fixed App Router pages under `apps/web/app`;
- typed home and tool-page records under `apps/web/src/content`;
- the tool registry under `packages/tool-registry`;
- localized metadata, sitemap, and structured-data helpers under
  `apps/web/src/lib`.

All current public routes are statically prerendered. Runtime CMS reads will
make CMS-backed routes dynamic and require a replacement for release checks
that currently inspect generated HTML files.

## Considered approaches

### 1. Separate Payload application — selected

`apps/cms` owns Payload configuration, collections, migrations, Admin UI, and
its REST API. `apps/web` remains the only public renderer and consumes the CMS
over a server-only boundary.

This preserves ownership boundaries, isolates CMS dependencies and Admin UI,
and permits independent access policy, health checks, and deployment.

The cost is an additional application service, a PostgreSQL database, media
storage, backup obligations, and expanded production verification.

### 2. Embed Payload in `apps/web` — rejected

Embedding reduces the number of deployable services but couples public-page
rendering, Admin UI, CMS migrations, dependency upgrades, and the public web
security surface. It also makes the existing standalone build and release
checks harder to reason about.

### 3. Publish static exports from Payload — rejected

Static export would reduce runtime failure modes, but it contradicts the
selected request-time publication behavior and introduces a separate publish
artifact workflow.

## System boundaries

### Payload owns

- public-page body content for home, audit, monitoring, pricing, and privacy;
- blog posts, knowledge-base articles, methodology, guides, and glossary;
- editorial tool-page fields such as SEO title, description, H1, lead, quick
  facts, instructions, supported behavior, limitations, use cases, technical
  notes, FAQ, sources, review dates, and related-tool references;
- page and article SEO fields and social images;
- media metadata and uploaded public-content assets;
- drafts, version history, preview, and administrative publishing workflow.

### Code and operational services own

- tool IDs, slugs, categories, state, executor class, and implementation
  availability;
- tool workspaces, API contracts, validation, quotas, security copy, and safe
  error presentation;
- accounts, sessions, projects, audits, issues, monitoring, reports, shares,
  credits, AI runs, and payment gates;
- navigation controls, form labels, account UI, and other operational UI copy;
- release policy, route policy, security headers, and fail-closed deployment
  configuration.

Payload content may describe an existing capability but cannot create or
activate one. A tool editorial record is publishable only when its slug maps to
one ready public registry entry.

## Deployment topology

The production content topology adds these components to the existing core:

- `cms`: Payload application and Admin UI;
- PostgreSQL: a dedicated CMS database and database role;
- S3-compatible object storage for production media;
- private routing from `web` to `cms`.

The preferred same-host path is an internal container-network URL supplied to
`web` through a server-only environment variable. If CMS and web are placed on
different hosts, the connection must use a service identity and TLS. Browser
code never receives the CMS internal URL or service credentials.

`cms.webdiag.ru` is protected by Cloudflare Access or an equivalent private
access layer. Payload authentication remains enabled as a second boundary.
Self-registration is absent, and administrator accounts are provisioned
through an explicit operator procedure.

Payload package versions are pinned in lockstep. Generated PostgreSQL
migrations are committed. Production schema changes run through an explicit
migration step before the new CMS revision becomes ready; production does not
rely on development schema push behavior.

The existing FastAPI SQLite ownership and single-writer rules are unchanged.
Adding the CMS does not authorize a FastAPI storage migration or AI overlay.

## Content model

### `users`

Authenticated owner and administrator accounts only. All create, update,
delete, publish, and Admin UI access requires an authorized CMS user.

### `public-pages`

One document per route key and locale. Initial route keys are `home`, `audit`,
`monitoring`, `pricing`, and `privacy`.

Each record contains:

- stable route key;
- locale (`ru` or `en`);
- translation group ID;
- title, description, H1, lead, and typed page sections;
- canonical and alternate-path data derived from the route key rather than
  accepting arbitrary canonical URLs;
- optional social image relationship;
- source and review metadata;
- Payload draft/version state.

### `articles`

One locale-specific document per blog, knowledge, methodology, guide, or
glossary entry. Each record contains a bounded section type, slug,
translation group ID, title, excerpt, structured rich-text body, SEO fields,
optional media, sources, and review metadata.

### `tool-editorial`

One locale-specific record per registry slug. The schema mirrors the existing
typed editorial contract without duplicating capability state. Related tools
are stored as registry slugs and validated against ready public entries.

### `media`

Media files used by public content. Production blobs are stored outside the
container filesystem. Alternative text is required at the point of localized
use, because one asset can require different contextual text in RU and EN.

## Locale and publication model

RU and EN are separate documents connected by `translationGroupId`. The
design intentionally does not depend on localized draft-status behavior.

Drafts may be prepared independently. Public reads expose a translation group
only after both required locale records are published and pass validation.
Until then neither locale is listed in sitemap or public collection pages.

This rule preserves reciprocal `hreflang`, an RU `x-default`, and the project
requirement that both languages receive independent editorial review. It also
prevents silent locale fallback. Public queries explicitly request one locale
and disable fallback behavior.

Collection and release validation enforce:

- incomplete RU/EN translation groups are withheld from public reads and fail
  release verification, while either locale may independently reach Payload's
  published state during editorial preparation;
- duplicate route-key/locale or section/slug/locale identities;
- unknown or non-ready tool slugs;
- related-tool links to unknown or non-ready tools;
- arbitrary script, raw HTML, iframe, or executable embed content;
- unsafe URL schemes or malformed internal links;
- missing required SEO, source, or review fields.

## Request and rendering flow

1. A request reaches a CMS-backed public route in `apps/web`.
2. The server derives a bounded route key, section/slug, and locale from the
   matched route. User input never selects the CMS origin or collection name.
3. A server-only CMS client performs one request-scoped fetch with a strict
   deadline, bounded response size, JSON content-type requirement, and
   `no-store` behavior.
4. The response is validated against a local runtime contract before any field
   is rendered or used for metadata.
5. Metadata and the page body share the same request-scoped result to avoid
   duplicate CMS reads. This deduplication is limited to the current request
   and is not a last-known-good content cache.
6. Rich text is rendered through an allowlisted node renderer. Raw HTML and
   executable embeds are not accepted in the first implementation.
7. Structured data is generated by WebDiag from validated fields and existing
   registry data. Payload does not accept arbitrary JSON-LD scripts.

The public browser never calls Payload directly.

## Error semantics

- Zero matching published records, an unpublished translation pair, or an
  invalid public slug maps to localized `404` through Next `notFound()`.
- Timeout, connection failure, non-success upstream status, wrong content
  type, oversized body, or invalid response contract maps to a localized
  temporary-unavailable experience.
- CMS response bodies, database details, internal hosts, secrets, and raw
  exceptions are never rendered or returned to the browser.
- Account and operational API routes do not depend on CMS health.

Next App Router pages do not provide a built-in arbitrary `503` fallback like
`notFound()` provides for `404`. Therefore production ingress must enforce the
final `503` status for CMS-backed route failures and add a bounded
`Retry-After` header. The implementation must prove the end-to-end status in a
real runtime smoke test; a friendly page with an incorrect `200`, `404`, or
generic `500` does not satisfy this design.

If the entire host is unavailable, the outer hosting/load-balancing layer owns
the outage response. WebDiag cannot render its application-level error page in
that condition.

## Access control and security

- Anonymous CMS reads are constrained to complete, published translation
  groups and a public projection of required fields.
- Create, update, delete, version, preview, and unpublished reads require an
  authorized owner or administrator.
- Any Payload Local API use with a user must explicitly enforce access control;
  it must not rely on the Local API override default.
- Admin and CMS API routes are protected by the private access layer in
  production. The internal web-to-CMS path is not exposed through browser
  configuration.
- Collection names, sort expressions, depth, pagination, and filters are
  server constants or bounded enums. Raw user-provided query fragments are
  prohibited.
- External and internal links are validated against explicit protocol and path
  rules. Rendering uses React text and typed nodes rather than injected HTML.
- Uploads require file-type, size, and dimension limits and must not trust file
  extensions alone.
- Secrets remain outside the repository and container build context.
- Logs use bounded error categories and request correlation data, not content
  bodies, credentials, or internal exception details.

## Migration strategy

### Phase 1: CMS foundation

Add `apps/cms`, pinned dependencies, PostgreSQL adapter, migrations, access
control, health/readiness behavior, server-only CMS client contracts, local
fixtures, and production configuration gates. No public route switches yet.

### Phase 2: Editorial sections

Import and switch blog, knowledge, methodology, guides, and glossary. Current
placeholder pages are replaced only by reviewed factual records; the migration
does not invent articles.

### Phase 3: Fixed public pages

Import and switch audit, monitoring, pricing, and privacy. Existing wording is
preserved unless separately reviewed. Product availability claims remain
bounded by code-owned release state.

### Phase 4: Tool editorial content

Import the existing 115 tool editorial records exactly, including RU/EN copy,
sources, related slugs, and review dates. Automated parity checks compare the
source projection with imported records before each route switches.

### Phase 5: Home, discovery, and cleanup

Switch the home page, dynamic article discovery, sitemap, metadata, and
structured-data inputs. Remove migrated repository content files and temporary
cutover code. The final state has no repository-content fallback for
CMS-owned fields.

Each phase is a logically complete patch with targeted verification. A route
or collection switches only after import parity, RU/EN review, security tests,
and browser checks pass.

## Media and backup requirements

Local development may use disposable local storage. Production activation
requires S3-compatible object storage; container-local uploads are not a
production source of truth.

The production CMS gate requires:

- PostgreSQL backup and restore evidence;
- media object backup/versioning policy and a restore drill;
- migration rollback or forward-repair procedure;
- secret-manager placement for database, Payload, storage, and service
  credentials;
- health checks covering the CMS process and database connectivity.

These requirements extend the existing external launch gates. Passing local
or CI tests does not certify the chosen host, domain, TLS, Cloudflare policy,
database recovery, or media recovery.

## Verification strategy

Implementation follows regression-first development. Required coverage
includes:

- unit tests for route resolution, runtime response validation, locale-pair
  publication, registry binding, related-tool validation, safe links, rich-text
  rendering, metadata, and error classification;
- Payload collection tests for anonymous published reads and denied draft,
  create, update, and delete access;
- PostgreSQL integration tests for migrations, uniqueness, locale pairs,
  versions, and publish queries;
- import parity tests for every migrated fixed page and all 115 tool editorial
  records;
- injection and XSS boundaries for slug/filter inputs, rich-text nodes, links,
  filenames, metadata, and structured data;
- runtime integration tests proving `404`, `503`, `Retry-After`, timeout,
  invalid JSON, oversized response, and error redaction behavior;
- RU/EN browser coverage for public pages, articles, tool pages, navigation,
  metadata, reciprocal alternates, and sitemap;
- desktop/mobile, light/dark, keyboard, overflow, and real screenshot review
  for every changed public template;
- updated production Compose preflight, image build, runtime smoke, dependency
  audit, lint, typecheck, and one fresh full relevant verification before the
  CMS phase is declared complete.

The existing static built-site verifier must not be silently weakened. It is
replaced or extended with a fixture-backed runtime verifier for dynamic CMS
routes while retaining checks for H1, metadata, canonical URLs, reciprocal
alternates, structured data, unpublished-registry leakage, and safe public
projections.

## Upstream references checked for this design

- Payload installation and supported runtime requirements:
  <https://payloadcms.com/docs/getting-started/installation>
- Payload PostgreSQL adapter and migrations:
  <https://payloadcms.com/docs/database/postgres>
- Payload localization:
  <https://payloadcms.com/docs/configuration/localization>
- Payload drafts and versions:
  <https://payloadcms.com/docs/versions/drafts>
- Payload access control and Local API override behavior:
  <https://payloadcms.com/docs/access-control/overview> and
  <https://payloadcms.com/docs/local-api/access-control>
- Payload production deployment and external media storage:
  <https://payloadcms.com/docs/production/deployment>
- Next.js `notFound()` status behavior:
  <https://nextjs.org/docs/app/api-reference/functions/not-found>

## Release boundaries

This design authorizes implementation in the existing
`feature/backend-production-readiness` branch and updates to Draft PR #3. It
does not authorize merge, release, deployment, main-branch changes, production
credentials, Cloudflare mutations, database provisioning, or public launch.

CMS production activation remains blocked until the hosting, domain/TLS,
private access, secret-manager, PostgreSQL recovery, S3 recovery, and strict
end-to-end `503` behavior are separately verified in the selected production
environment.

## Completion criteria

The CMS migration is complete only when:

- every intended public editorial field has exactly one owner;
- every public RU route has a reviewed EN counterpart and reciprocal
  alternates;
- all 115 published tools retain exact registry binding and truthful
  capability boundaries;
- public browser code contains no CMS secrets or internal CMS origin;
- drafts and incomplete locale pairs cannot leak publicly;
- CMS-backed routes produce verified `404` and end-to-end `503` semantics;
- no migrated route falls back to repository content or stale content;
- migration, backup, security, runtime, browser, and full verification gates
  pass with fresh evidence;
- Draft PR #3 documents the new topology and remaining external launch gates.
