import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const layouts = ["apps/web/app/(ru)/layout.tsx", "apps/web/app/(en)/layout.tsx"];

test("theme hydration handling is scoped to the body theme attribute", async () => {
  for (const path of layouts) {
    const source = await read(path);
    assert.match(source, /<html[^>]*data-scroll-behavior="smooth"/);
    assert.match(source, /<body data-theme="light" data-theme-ready="false" suppressHydrationWarning>/);
    assert.doesNotMatch(source, /<html[^>]*suppressHydrationWarning/);
  }
});

test("theme production sources expose only explicit light and dark modes", async () => {
  for (const path of [
    "apps/web/src/lib/theme.ts",
    "apps/web/src/components/theme-bootstrap-script.tsx",
    "apps/web/src/components/theme-switcher.tsx",
    "apps/web/app/globals.css",
  ]) {
    const source = await read(path);
    assert.doesNotMatch(source, /["']system["']/);
    assert.doesNotMatch(source, /prefers-color-scheme/);
    assert.doesNotMatch(source, /matchMedia/);
  }
});

test("language control remains a two-link localized navigation", async () => {
  const source = await read("apps/web/src/components/language-switcher.tsx");
  assert.match(source, /\["ru", "en"\]/);
  assert.match(source, /aria-current/);
  assert.match(source, /localizedHref/);
  assert.doesNotMatch(source, /role="switch"/);
});

test("localized tool catalog remains statically renderable", async () => {
  for (const path of ["apps/web/app/(ru)/tools/page.tsx", "apps/web/app/(en)/en/tools/page.tsx"]) {
    const source = await read(path);
    assert.doesNotMatch(source, /searchParams/);
  }
});

test("public tool cards do not render internal registry identifiers", async () => {
  const catalog = await read("apps/web/src/features/tools/tool-catalog.tsx");
  const toolPage = await read("apps/web/src/features/tools/tool-page.tsx");
  assert.doesNotMatch(catalog, /tool\.id/);
  assert.doesNotMatch(toolPage, /tool\.id/);
});

test("client catalog receives a minimal public projection", async () => {
  const catalog = await read("apps/web/src/features/tools/tool-catalog.tsx");
  assert.doesNotMatch(catalog, /publicTools|toolsJson|riskTier|implementationWave|executorClass/);
});

test("both layouts expose a keyboard skip link", async () => {
  for (const path of layouts) assert.match(await read(path), /className="skip-link"/);
});

test("root verification includes built-site and browser gates", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.match(packageJson.scripts.build, /verify:built-site/);
  assert.match(packageJson.scripts["verify:local"], /test:browser/);
});

test("tool pages use the typed editorial layer", async () => {
  const index = await read("apps/web/src/content/tool-pages/index.ts");
  const toolPage = await read("apps/web/src/features/tools/tool-page.tsx");
  assert.match(index, /toolPageContents/);
  assert.match(toolPage, /getToolPageContent/);
  assert.match(toolPage, /supportedFeatures/);
  assert.match(toolPage, /limitations/);
  assert.doesNotMatch(toolPage, /publicTools\.filter/);
});

test("home recommendations are explicit and do not depend on registry order", async () => {
  const home = await read("apps/web/src/features/home/home-page.tsx");
  const content = await read("apps/web/src/content/home.ts");
  assert.doesNotMatch(home, /slice\(0,\s*\d+\)/);
  assert.match(content, /quickTasks/);
});

test("public availability copy contains no unapproved prices or payment claims", async () => {
  const sources = {
    home: await read("apps/web/src/features/home/home-page.tsx"),
    header: await read("apps/web/src/components/site-header.tsx"),
    pricingRu: await read("apps/web/app/(ru)/pricing/page.tsx"),
    pricingEn: await read("apps/web/app/(en)/en/pricing/page.tsx"),
    auditRu: await read("apps/web/app/(ru)/audit/page.tsx"),
    auditEn: await read("apps/web/app/(en)/en/audit/page.tsx"),
    monitoringRu: await read("apps/web/app/(ru)/monitoring/page.tsx"),
    monitoringEn: await read("apps/web/app/(en)/en/monitoring/page.tsx"),
    toolList: await read("apps/web/src/features/tools/tool-list.tsx"),
  };
  const combined = Object.values(sources).join("\n");
  const categories = JSON.parse(
    await read("packages/tool-registry/registry/categories.json"),
  );

  const priceMatches = combined.match(/\d[\d\s,]*\s*₽/gu);
  const paymentClaimMatches = combined.match(
    /(?:оплачиваются|платите за|цены предварительные|paid per run|pay for the|prices are preliminary|\/мес(?=["'\s,.)]|$)|\/mo(?=["'\s,.)]|$))/giu,
  );

  assert.deepEqual(priceMatches, null);
  assert.deepEqual(paymentClaimMatches, null);
  assert.doesNotMatch(combined, /release-gates?/i);
  assert.doesNotMatch(sources.toolList, /homeContent/);
  assert.match(sources.toolList, /categories as registryCategories/);
  const publicCategoryReferences = [
    ...combined.matchAll(/\?category=([a-z-]+)/g),
    ...sources.header.matchAll(/\bcategory:\s*"([a-z-]+)"/g),
  ].map((match) => match[1]);
  for (const category of publicCategoryReferences) {
    assert.ok(category in categories, `unknown public tool category: ${category}`);
  }
});

test("home audit UI consumes only frontend-shaped audit result contracts", async () => {
  const uiFiles = [
    "apps/web/src/features/home/home-url-check-form.tsx",
    "apps/web/src/features/home/home-audit-result-section.tsx",
  ];
  const forbiddenBackendFields = [
    [/summary\.run/, "backend summary.run"],
    [/issue\.issue_id/, "backend issue_id"],
    [/issue\.check_id/, "backend check_id"],
    [/\bissue_count\b/, "backend issue_count"],
    [/\bcheck_count\b/, "backend check_count"],
    [/\bhighest_severity\b/, "backend highest_severity"],
    [/\btop_priority\b/, "backend top_priority"],
  ];

  for (const path of uiFiles) {
    const source = await read(path);
    for (const [pattern, label] of forbiddenBackendFields) {
      assert.doesNotMatch(source, pattern, `${path} must not consume ${label}; map through AuditFrontendResult instead`);
    }
  }

  const contract = await read("apps/web/src/features/home/audit-contract.ts");
  assert.match(contract, /toAuditFrontendResult/);
  assert.match(contract, /issue_id/);
  assert.match(contract, /issueCount/);
});

test("SEO layer includes social metadata, structured data, and localized sitemap alternates", async () => {
  const seo = await read("apps/web/src/lib/seo.ts");
  const sitemap = await read("apps/web/app/sitemap.ts");
  const jsonLd = await read("apps/web/src/components/json-ld.tsx");
  assert.match(seo, /openGraph/);
  assert.match(seo, /summary_large_image/);
  assert.match(sitemap, /alternates/);
  assert.match(sitemap, /x-default/);
  assert.match(jsonLd, /application\/ld\+json/);
  assert.match(jsonLd, /replace\(\/<\/g/);
});

test("mobile navigation exposes separate desktop and mobile language controls", async () => {
  const header = await read("apps/web/src/components/site-header.tsx");
  assert.match(header, /language-switcher-mobile/);
  assert.match(header, /language-switcher-desktop/);
});

test("random generators wait for an explicit client action", async () => {
  const source = await read("apps/web/src/features/tools/tool-renderer.tsx");
  assert.match(source, /const \[value, setValue\] = useState\(""\)/);
  assert.doesNotMatch(source, /useState\(\(\) => (?:create|generate)/);
  assert.doesNotMatch(source, /useEffect\(/);
  assert.match(source, /Generate UUID/);
  assert.match(source, /Generate ULID/);
});
