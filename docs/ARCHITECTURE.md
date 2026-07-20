# Architecture snapshot

- npm monorepo for the Next.js application and shared TypeScript packages.
- FastAPI service in a separate Python package.
- Dramatiq worker package prepared for RabbitMQ.
- Registry contains 110 definitions; public selectors expose only the 14 entries with verified implementations.
- Browser-only tool logic lives in `packages/tool-core` and is covered by unit tests.
- RU routes have no locale prefix; EN routes use `/en`.
- Public UI is light-first and supports only explicit `light` and `dark` preferences. Operating-system color preferences are intentionally ignored.
- The theme bootstrap reads `webdiag-theme` before hydration, defaults to light, and applies a stored dark choice before first paint.
- RU/EN navigation preserves the equivalent pathname, query string, and hash. On narrow viewports it moves into the native mobile menu.
- Home, catalog, and tool explanations are server-rendered. Interactive code is limited to actual tool workspaces, search/filtering, theme, locale, and mobile navigation.
- A typed editorial layer in `apps/web/src/content` supplies independent RU/EN SEO titles, leads, instructions, supported behavior, limitations, use cases, technical notes, FAQs, and related-tool links for every ready tool.
- Operational registry fields and long-form product content remain separate. Contract tests block unknown slugs, internal content records, and related links to unpublished tools.
- Localized metadata is generated centrally in `apps/web/src/lib/seo.ts`; visible JSON-LD is rendered as WebSite, ItemList, or BreadcrumbList according to page type.
- The sitemap exposes RU, EN, and `x-default` alternates when public release is enabled. Internal mode remains `noindex` and disallows crawling.
- Production verification checks all 32 rendered HTML pages for one H1, title, description, canonical, reciprocal language alternates, social metadata, valid JSON-LD, and unpublished-registry leakage.
- Public catalog client assets receive a minimal projection and are separately checked for internal fields and definitions.
- All current public routes remain statically prerendered.
