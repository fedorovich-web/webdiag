# WebDiag homepage redesign, SEO and marketing — design spec

Date: 2026-09-12
Target branch: `feature/backend-production-readiness`
Scope: public homepage and directly related public navigation/content/SEO presentation only.

## Goal

Replace the current prototype-like homepage with the approved production direction from the design review: light, spacious SaaS UI; Fresh Mint blue/teal gradient system; significantly larger vertical section spacing; no container-background boxes around ordinary section copy; clearer hierarchy; stronger product marketing; competitor-grounded copy; and technically correct SEO without unsupported product claims.

The public homepage should explain the real product in this order:

1. Website/URL check and clear value proposition.
2. Product proof via report preview.
3. Popular supporting tools.
4. Three-step checking flow.
5. What WebDiag checks.
6. Report example and issue prioritization.
7. Monitoring.
8. Knowledge/resources.
9. FAQ.
10. Final CTA.
11. Full footer.

No approved section is to be silently removed or replaced by a different layout during implementation.

## Non-goals / ownership boundary

This work does **not** modify backend domain logic, databases, storage, crawl/audit execution, worker code, account services, AI provider logic, migrations, authentication internals or backend security policies.

Parallel Codex backend work owns those areas. The homepage implementation owns public UI/content only. Shared files should be changed only when required for the public homepage and with minimal surface area.

Reserved frontend files/areas for this redesign include:

- `apps/web/src/features/home/**`
- `apps/web/app/home-v11.css`
- `apps/web/src/content/home.ts` and the homepage content contract if needed
- `apps/web/app/(ru)/page.tsx`
- `apps/web/app/(en)/en/page.tsx`
- `apps/web/src/components/site-header.tsx`
- `apps/web/src/components/site-footer.tsx`
- homepage/metadata/visual tests directly covering these files

## Current problems to remove

- Prototype/roadmap language visible to users, such as references to a “future scenario”, “future report” and an audit engine not being ready.
- Duplicate homepage copy sources: `home-page.tsx` contains its own large localized content object while `home.ts` is used by metadata/footer/catalog-related code.
- Excessive cardification: ordinary section introductions are rendered as bordered/shadowed white boxes on top of section backgrounds.
- Repeated value propositions and duplicated explanation sections.
- Weak CTA differentiation: header and hero must not use identical primary labels for different actions.
- Existing blue/indigo/violet accent system does not match the approved Fresh Mint direction.
- Section vertical rhythm is too tight.

## Visual system

### Brand accents

Primary Fresh Mint gradient:

`linear-gradient(120deg, #34D399 0%, #22D3EE 52%, #60A5FA 100%)`

Hover gradient:

`linear-gradient(120deg, #10B981 0%, #06B6D4 52%, #3B82F6 100%)`

Large background tint:

`linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 52%, #EFF6FF 100%)`

No purple/violet stops in the main brand gradient. Status colors remain semantic and independent.

### Surfaces

- Site background is full-width and continuous.
- Ordinary section text sits directly on the section/site background.
- Borders, radii and shadows are reserved for real interactive/data surfaces: report, form, tool card, monitoring panel, FAQ item, article card.
- Remove decorative bordered containers around section copy where they do not represent an interactive/object surface.

### Spacing

Desktop section vertical padding target: approximately 110–130 px for normal sections and 125–150 px for major hero/product sections, adjusted where adjacent full-width trust/CTA bands need their own rhythm.

Tablet: approximately 88–104 px.

Mobile: approximately 64–80 px.

Spacing must be tokenized rather than hard-coded independently per section unless a section has a justified exception.

## Header and CTA hierarchy

Header remains compact. Primary header action is account/onboarding-oriented, e.g. `Создать аккаунт`, not another duplicate `Проверить сайт` CTA.

Hero primary action is task-oriented: `Проверить сайт` / URL submit.

Secondary hero action is lower-emphasis and report-oriented, e.g. `Посмотреть пример отчёта`.

Downstream CTAs must describe their own destination/action rather than repeating the same generic label.

## Copy and marketing principles

Copy must be grounded in:

- real WebDiag capabilities in the current branch;
- common high-performing language patterns from current competitors such as reChecker, PR-CY, Sitechecker and Seobility;
- the user’s instruction to improve competitor wording rather than invent unsupported claims.

Use the domain vocabulary users search for: website check, site analysis, technical errors, SEO errors, technical SEO audit, indexing, robots.txt, sitemap, redirects, HTTPS, Core Web Vitals, affected URLs, priorities and recommendations.

Do not invent customer counts, testimonials, logos, rankings, guarantees, traffic-growth claims, prices, notification channels, exports or checks not supported by the product.

Do not expose implementation-roadmap wording to public visitors.

RU copy is the primary editorial source; EN is a natural equivalent, not a literal machine translation.

## Homepage content direction

Hero H1 direction:

`Проверка сайта на технические и SEO-ошибки`

Hero text direction:

Explain that the user can check a page/site for meta tags, robots.txt, sitemap, redirects, HTTPS, speed and other technical/SEO signals, then see found issues and understand what to fix first. Exact claim set must match implemented capabilities.

Popular tools should expose the strongest ready tools and link to real routes.

“How it works” remains three steps: enter URL → WebDiag checks → user gets a result/priorities.

“What WebDiag checks” groups checks by user task rather than internal implementation terminology.

Report example should demonstrate prioritization and affected pages without presenting fabricated customer data as a real audit.

Monitoring should describe only implemented scheduling/manual-run/history functionality present in the current branch; unsupported external notifications must not be claimed.

Knowledge/resources and FAQ should support search intent and internal linking without keyword stuffing.

## SEO

Homepage RU target intent cluster:

- проверка сайта
- проверка сайта на ошибки
- анализ сайта онлайн
- техническая проверка сайта

`/audit` remains the stronger target for:

- SEO аудит сайта
- технический SEO аудит
- аудит сайта онлайн

This separation should reduce self-cannibalization.

Homepage requirements:

- one descriptive H1;
- unique RU and EN title/description;
- canonical and hreflang preserved;
- semantic heading hierarchy;
- meaningful internal links to audit, monitoring, tools/categories, knowledge/blog when routes are real;
- structured data only when accurate;
- FAQ content may be visible regardless of whether FAQ rich-result eligibility exists; do not promise SERP rich results;
- avoid thin, duplicated or hidden SEO copy.

Homepage metadata and visible hero copy should share one canonical content source rather than drift independently.

## Implementation quality

- Consolidate duplicate homepage content instead of stacking another content object.
- Prefer focused components for large complex sections when this improves testability/readability.
- No temporary CSS override pile; replace or consolidate obsolete rules.
- No dead imports/components/data.
- No placeholder comments/TODOs in production code.
- No hard-coded fake functionality.
- No weakened tests merely to accept the redesign.
- Preserve accessibility, keyboard navigation and visible focus states.
- Respect RU/EN parity.

## Testing and verification

At minimum run/maintain:

- homepage unit/component tests where present;
- metadata tests;
- header/navigation tests;
- Playwright homepage/design/browser tests;
- lint;
- typecheck;
- build;
- visual/manual checks at desktop, narrow desktop/tablet and 390 px mobile in RU/EN and light/dark where supported.

Regression checks must ensure real links remain valid and no backend/API behavior is changed by this redesign.
