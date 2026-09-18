# WebDiag Homepage Redesign, SEO and Marketing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype-like public homepage with the approved Fresh Mint production design, consolidate homepage copy into one source of truth, improve SEO/marketing language, preserve every approved section, and keep backend behavior unchanged.

**Architecture:** Keep the redesign inside the public web surface on `feature/backend-production-readiness`. `apps/web/src/content/home.ts` becomes the canonical localized homepage content/SEO source consumed by the page and metadata; `HomePage` renders only that contract. `home-v11.css` is cleaned and retokenized rather than patched with another override layer, while header/footer receive only the public CTA/navigation changes required by the approved design.

**Tech Stack:** Next.js 16.3.4, React 19.2.8, TypeScript 5.9.3, Lucide React, Vitest, Playwright, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-12-homepage-redesign-seo-marketing-design.md`

## Global Constraints

- Work on `feature/backend-production-readiness`; do not create another branch.
- Do not modify backend domain logic, `apps/api/**`, worker code, databases, migrations, crawl/audit execution, account services, AI provider logic, authentication internals or backend security policies.
- Preserve all approved homepage sections: hero/report proof, popular tools, three-step flow, checks, report example, monitoring, knowledge/resources, FAQ, final CTA and full footer.
- Fresh Mint primary gradient: `linear-gradient(120deg, #34D399 0%, #22D3EE 52%, #60A5FA 100%)`.
- Fresh Mint hover gradient: `linear-gradient(120deg, #10B981 0%, #06B6D4 52%, #3B82F6 100%)`.
- Large tint: `linear-gradient(135deg, #ECFDF5 0%, #ECFEFF 52%, #EFF6FF 100%)`.
- No violet/purple stops in the primary brand gradient.
- Desktop normal section padding target: `110–130px`; major hero/product sections: `125–150px`; tablet `88–104px`; mobile `64–80px`.
- Ordinary section copy must sit directly on the section background; reserve cards/borders/shadows for actual interactive/data surfaces.
- Header CTA and hero CTA must have distinct intent and copy.
- Remove public roadmap/prototype language (`future scenario`, `audit engine not ready`, etc.).
- Do not invent customers, testimonials, rankings, traffic guarantees, unsupported checks, exports, notification channels or pricing.
- RU is editorial source; EN is a natural equivalent with parity.
- No dead code, placeholder comments, duplicate copy sources, temporary fallback UI, CSS override pile, weakened tests or unrelated refactors.

---

### Task 1: Lock the new homepage information architecture and content contract with failing tests

**Files:**
- Modify: `apps/web/e2e/home-design.spec.ts`
- Modify: `apps/web/e2e/metadata.spec.ts`
- Modify: `apps/web/src/content/types.ts`
- Modify: `apps/web/src/content/home.ts`

**Interfaces:**
- Produces: one `HomeContent` contract containing hero copy, SEO metadata copy, section labels/copy, popular tool slugs, check groups, report sample labels, monitoring copy, resource cards, FAQ and final CTA for both locales.
- Consumes: existing `LocalizedValue` and public tool registry paths.

- [ ] **Step 1: Change Playwright expectations first so the current homepage fails for the approved design**

Add/replace assertions in `home-design.spec.ts` for the new contract:

```ts
await expect(page.getByRole("heading", {
  level: 1,
  name: "Проверка сайта на технические и SEO-ошибки",
})).toBeVisible();
await expect(page.getByRole("link", { name: "Создать аккаунт" })).toBeVisible();
await expect(page.getByRole("button", { name: "Проверить сайт" })).toBeVisible();
await expect(page.getByText("Популярные инструменты", { exact: true })).toBeVisible();
await expect(page.getByText("Как проходит проверка", { exact: true })).toBeVisible();
await expect(page.getByText("Что проверяет WebDiag", { exact: true })).toBeVisible();
await expect(page.getByText("Пример отчёта", { exact: true })).toBeVisible();
await expect(page.getByText("Мониторинг изменений", { exact: true })).toBeVisible();
await expect(page.getByText("База знаний и полезные материалы", { exact: true })).toBeVisible();
await expect(page.getByText("Часто задаваемые вопросы", { exact: true })).toBeVisible();
await expect(page.getByText(/будущ(ий|его) сценарий|audit engine|пока недоступно/i)).toHaveCount(0);
```

Add a CSS-token assertion:

```ts
const tokens = await page.evaluate(() => {
  const root = getComputedStyle(document.documentElement);
  return {
    gradient: root.getPropertyValue("--wd-button-bg"),
    sectionY: Number.parseFloat(root.getPropertyValue("--wd-section-y")),
  };
});
expect(tokens.gradient).toContain("52%");
expect(tokens.gradient).toContain("34D399".toLowerCase());
expect(tokens.sectionY).toBeGreaterThanOrEqual(110);
```

- [ ] **Step 2: Add homepage title/description expectations to `metadata.spec.ts`**

```ts
await page.goto("/");
await expect(page).toHaveTitle(/Проверка сайта на ошибки/i);
await expect(page.locator('meta[name="description"]')).toHaveAttribute(
  "content",
  /провер.*сайт.*SEO|техническ.*ошиб/i,
);
```

- [ ] **Step 3: Run the focused browser tests and verify they fail against current copy/tokens**

Run:

```bash
npm --workspace @webdiag/web run test:browser -- e2e/home-design.spec.ts e2e/metadata.spec.ts
```

Expected: FAIL on the old H1/CTA/section-copy and/or old section spacing/gradient tokens.

- [ ] **Step 4: Expand `HomeContent` only as needed for the approved page instead of creating another parallel object**

The contract must include canonical metadata text and section data; use localized values rather than hard-coded branching inside `HomePage`. Keep existing category data used by footer/catalog intact or move it deliberately without changing its consumer contract.

- [ ] **Step 5: Rewrite `home.ts` as the canonical RU/EN marketing/SEO source**

At minimum set the canonical hero/SEO direction:

```ts
title: {
  ru: "Проверка сайта на технические и SEO-ошибки",
  en: "Check Your Website for Technical and SEO Issues",
},
description: {
  ru: "Проверьте сайт на технические и SEO-ошибки: мета-теги, robots.txt, sitemap, редиректы, HTTPS, скорость и другие сигналы. WebDiag показывает найденные проблемы и помогает определить, что исправлять первым.",
  en: "Check a website for technical and SEO issues including metadata, robots.txt, sitemap, redirects, HTTPS, performance and other signals. WebDiag surfaces problems and helps you prioritize fixes.",
},
```

Use factual wording for monitoring based on the current branch: scheduling/manual run/history are allowed; external notifications are not.

- [ ] **Step 6: Run TypeScript/unit gates for the content contract**

Run:

```bash
npm --workspace @webdiag/web run test
npm --workspace @webdiag/web run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the content contract**

```bash
git add apps/web/src/content/types.ts apps/web/src/content/home.ts apps/web/e2e/home-design.spec.ts apps/web/e2e/metadata.spec.ts
git commit -m "test(web): lock homepage redesign content contract"
```

---

### Task 2: Rebuild the homepage renderer around the canonical content while preserving every approved section

**Files:**
- Modify: `apps/web/src/features/home/home-page.tsx`
- Reuse: `apps/web/src/features/home/home-url-check-form.tsx`
- Reuse/modify only if necessary: `apps/web/src/features/home/home-report-tabs.tsx`
- Reuse/modify only if necessary: `apps/web/src/features/home/home-monitoring-chart.tsx`
- Reuse: `apps/web/src/features/home/home-faq-accordion.tsx`

**Interfaces:**
- Consumes: `homeContent`, `Locale`, `toolsPath`, existing interactive report/chart/form/FAQ components.
- Produces: semantic full homepage DOM with stable section class hooks for CSS and tests.

- [ ] **Step 1: Remove the duplicate `const content = { ru, en }` from `home-page.tsx`**

Replace per-component marketing data with:

```ts
import { homeContent } from "../../content/home";
import { localizeValue } from "../../content/types";

const t = <T extends { readonly ru: string; readonly en: string }>(value: T) =>
  localizeValue(value, locale);
```

Do not keep both old and new content objects.

- [ ] **Step 2: Render the approved section order without removing sections**

DOM order must be:

```text
hero + report proof
trust/platform band when retained as factual platform context
popular tools
how it works (3 steps)
what WebDiag checks
report example / prioritization
monitoring
knowledge/resources
FAQ
final CTA
```

Keep the full footer outside `HomePage` through the existing app layout.

- [ ] **Step 3: Make popular tools registry-backed, not fabricated**

Resolve configured slugs with `getPublicTool`/`publicTools`; omit an unavailable slug rather than rendering a dead link. Link to the real locale-aware tool route.

- [ ] **Step 4: Keep report/demo data explicitly demonstrative**

Use neutral demo labels such as `example.ru`/`site.ru`; do not imply a real customer audit. Preserve issue priorities and affected-page concepts as UI demonstration.

- [ ] **Step 5: Differentiate CTAs by intent**

Hero: URL submit `Проверить сайт`; secondary `Посмотреть пример отчёта`.
Monitoring: `Настроить мониторинг` or factual equivalent.
Tools: `Все инструменты`.
Resources: `Все материалы` only if route exists.
Final CTA: task-oriented site check form/button.

- [ ] **Step 6: Run focused browser test**

```bash
npm --workspace @webdiag/web run test:browser -- e2e/home-design.spec.ts
```

Expected: content/section assertions pass; style-token assertions may remain red until Task 3.

- [ ] **Step 7: Commit renderer cleanup**

```bash
git add apps/web/src/features/home
git commit -m "refactor(web): render homepage from canonical content"
```

---

### Task 3: Replace the old blue/violet/cardified CSS with the approved Fresh Mint system and real section spacing

**Files:**
- Modify: `apps/web/app/home-v11.css`
- Modify only if shared primitives require it: `apps/web/app/globals.css`

**Interfaces:**
- Produces CSS tokens/classes consumed by Task 2 markup and existing header/report/FAQ components.

- [ ] **Step 1: Replace brand and spacing tokens rather than appending override rules**

Use these exact root tokens:

```css
:root {
  --wd-brand-mint: #34d399;
  --wd-brand-cyan: #22d3ee;
  --wd-brand-blue: #60a5fa;
  --wd-brand-mint-hover: #10b981;
  --wd-brand-cyan-hover: #06b6d4;
  --wd-brand-blue-hover: #3b82f6;
  --wd-button-bg: linear-gradient(120deg, #34d399 0%, #22d3ee 52%, #60a5fa 100%);
  --wd-button-bg-hover: linear-gradient(120deg, #10b981 0%, #06b6d4 52%, #3b82f6 100%);
  --wd-brand-tint: linear-gradient(135deg, #ecfdf5 0%, #ecfeff 52%, #eff6ff 100%);
  --wd-section-y: 124px;
  --wd-section-y-major: 142px;
  --wd-section-y-tablet: 96px;
  --wd-section-y-mobile: 72px;
}
```

Remove violet brand dependencies from primary CTA/active brand surfaces; semantic error/warning/success colors stay independent.

- [ ] **Step 2: Make section backgrounds full width and containers transparent**

Core rule shape:

```css
.wd-section { padding: var(--wd-section-y) 0; }
.wd-hero { padding: var(--wd-section-y-major) 0; background: var(--wd-brand-tint); }
.wd-section-copy,
.wd-sticky-intro {
  border: 0;
  background: transparent;
  box-shadow: none;
  padding-inline: 0;
}
```

Do not remove card styling from genuine tool/report/monitoring/FAQ/article surfaces.

- [ ] **Step 3: Implement responsive section rhythm**

```css
@media (max-width: 1180px) {
  .wd-section { padding-block: var(--wd-section-y-tablet); }
  .wd-hero { padding-block: 112px; }
}
@media (max-width: 760px) {
  .wd-section { padding-block: var(--wd-section-y-mobile); }
  .wd-hero { padding-block: 80px; }
}
```

Avoid section-specific random margins that recreate inconsistent rhythm.

- [ ] **Step 4: Preserve accessibility/focus and interaction states**

Primary CTA hover uses `--wd-button-bg-hover`; focus-visible remains visible with at least a 2px outline/ring and is not replaced by shadow-only focus.

- [ ] **Step 5: Run focused homepage browser tests**

```bash
npm --workspace @webdiag/web run test:browser -- e2e/home-design.spec.ts
```

Expected: PASS for H1, section presence, Fresh Mint gradient and >=110px desktop section token.

- [ ] **Step 6: Commit visual system**

```bash
git add apps/web/app/home-v11.css apps/web/app/globals.css
git commit -m "feat(web): apply Fresh Mint homepage visual system"
```

---

### Task 4: Align header/footer CTA hierarchy and remove prototype copy

**Files:**
- Modify: `apps/web/src/components/site-header.tsx`
- Modify: `apps/web/src/components/site-footer.tsx`
- Modify: `apps/web/e2e/home-design.spec.ts`

**Interfaces:**
- Consumes: locale routes, existing SiteBrand/language/theme controls, canonical `homeContent.categories` where still needed.
- Produces: account-oriented header CTA and production footer copy/links.

- [ ] **Step 1: Change header primary CTA from audit duplication to onboarding**

Use locale copy:

```ts
const createAccount = locale === "ru" ? "Создать аккаунт" : "Create account";
const registerHref = locale === "ru" ? "/register" : "/en/register";
```

Keep `Войти`/`Sign in` separate; hero remains the place for `Проверить сайт`.

- [ ] **Step 2: Keep navigation factual**

Do not label blog/knowledge as planned in visible homepage copy if the route is real and usable; do not add dead route links.

- [ ] **Step 3: Replace footer roadmap language**

Footer summary must describe WebDiag as a site diagnostics/SEO tooling product without `будущего отчёта`, `developing a flow`, or audit-engine roadmap language.

- [ ] **Step 4: Add header/footer browser assertions**

```ts
await expect(page.getByRole("link", { name: "Создать аккаунт" })).toHaveAttribute("href", "/register");
await expect(page.getByRole("link", { name: "Войти" })).toHaveAttribute("href", "/login");
await expect(page.locator("footer")).not.toContainText(/будущ|future report|developing/i);
```

- [ ] **Step 5: Run focused browser test**

```bash
npm --workspace @webdiag/web run test:browser -- e2e/home-design.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit navigation/footer copy**

```bash
git add apps/web/src/components/site-header.tsx apps/web/src/components/site-footer.tsx apps/web/e2e/home-design.spec.ts
git commit -m "feat(web): align homepage CTA hierarchy"
```

---

### Task 5: Separate homepage and `/audit` SEO intent and bind metadata to canonical content

**Files:**
- Modify: `apps/web/app/(ru)/page.tsx`
- Modify: `apps/web/app/(en)/en/page.tsx`
- Modify if needed: `apps/web/src/lib/seo.ts`
- Modify: `apps/web/e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: canonical homepage content in `home.ts`, existing `pageMetadata`, canonical/hreflang helpers and website JSON-LD.
- Produces: unique RU/EN homepage metadata targeting website-check intent while `/audit` retains audit intent.

- [ ] **Step 1: Set homepage RU metadata to website-check intent**

Use a title in this direction, keeping it concise:

```ts
title: "Проверка сайта на ошибки онлайн — WebDiag"
```

Description must come from `homeContent.description.ru`, not a second literal.

- [ ] **Step 2: Set natural EN equivalent**

```ts
title: "Website Technical & SEO Checker — WebDiag"
```

Description comes from `homeContent.description.en`.

- [ ] **Step 3: Preserve canonical, RU/EN alternates and `WebSite` JSON-LD**

Do not add FAQ JSON-LD merely because FAQ content is visible.

- [ ] **Step 4: Strengthen metadata tests**

```ts
await page.goto("/");
await expect(page).toHaveTitle("Проверка сайта на ошибки онлайн — WebDiag");
await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://webdiag.ru");
await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
```

Repeat the title check for `/en`.

- [ ] **Step 5: Run metadata test**

```bash
npm --workspace @webdiag/web run test:browser -- e2e/metadata.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit SEO metadata**

```bash
git add 'apps/web/app/(ru)/page.tsx' 'apps/web/app/(en)/en/page.tsx' apps/web/src/lib/seo.ts apps/web/e2e/metadata.spec.ts
git commit -m "feat(seo): target homepage website-check intent"
```

---

### Task 6: Responsive, accessibility and regression hardening

**Files:**
- Modify: `apps/web/e2e/home-design.spec.ts`
- Modify if required by failures: reserved homepage/header/footer/CSS files only.
- Modify visual snapshots only after intentional visual review: `apps/web/e2e/visual.spec.ts-snapshots/home-*.png`

**Interfaces:**
- Verifies all earlier tasks without changing backend/API behavior.

- [ ] **Step 1: Add mobile/narrow assertions for section spacing and no horizontal overflow**

At 390px verify:

```ts
const dimensions = await page.evaluate(() => ({
  viewport: document.documentElement.clientWidth,
  scroll: document.documentElement.scrollWidth,
  sectionPadding: Number.parseFloat(
    getComputedStyle(document.querySelector(".wd-section")!).paddingTop,
  ),
}));
expect(dimensions.scroll).toBe(dimensions.viewport);
expect(dimensions.sectionPadding).toBeGreaterThanOrEqual(64);
```

- [ ] **Step 2: Verify RU/EN parity and CTA semantics**

Check one H1, real links, distinct header-vs-hero actions, and absence of public roadmap wording in both locales.

- [ ] **Step 3: Run web unit, lint and typecheck gates**

```bash
npm run test:web
npm run lint
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run registry/workspace gates because homepage consumes registry data**

```bash
npm run test:workspace
npm run verify:registry
npm run test:registry
npm run test:core
```

Expected: PASS.

- [ ] **Step 5: Run the full browser suite**

```bash
npm run test:browser
```

Expected: PASS. If visual snapshots fail only because the approved redesign changed pixels, inspect the diff before updating snapshots; do not auto-accept unrelated visual regressions.

- [ ] **Step 6: Run production build**

```bash
npm run build
```

Expected: PASS, including `verify:release` and `verify:built-site`.

- [ ] **Step 7: Review the final diff for ownership violations and dead code**

Run:

```bash
git diff --check
git diff --stat
git diff -- apps/api apps/worker
```

Expected: no whitespace errors; the backend diff must be empty for commits made by this redesign work.

- [ ] **Step 8: Commit hardening/snapshot updates only if necessary**

```bash
git add apps/web/e2e
git commit -m "test(web): harden homepage redesign regressions"
```

## Final Verification

Before declaring completion, run:

```bash
npm run test:workspace
npm run verify:registry
npm run test:registry
npm run test:core
npm run test:web
npm run lint
npm run typecheck
npm run build
npm run test:browser
```

Do not claim any unavailable/local-only gate as passed. Because Codex is working in parallel on backend, refresh branch state before each implementation batch and inspect overlapping files before pushing another commit.