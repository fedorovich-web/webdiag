import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { constants } from "node:fs";

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

test("design iteration two uses a typed editorial layer for every ready tool", async () => {
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
  assert.doesNotMatch(home, /slice\(0,\s*6\)/);
  assert.match(content, /quickTasks/);
  assert.match(content, /image-resizer/);
  assert.match(content, /json-formatter-validator/);
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

test("mobile navigation owns the compact language control", async () => {
  const header = await read("apps/web/src/components/site-header.tsx");
  const css = await read("apps/web/app/globals.css");
  assert.match(header, /language-switcher-mobile/);
  assert.match(header, /language-switcher-desktop/);
  assert.match(css, /\.language-switcher-mobile \{ display: none; \}/);
  assert.match(css, /@media \(max-width: 620px\)/);
});

test("home stylesheet does not ship obsolete prototype-era audit CSS", async () => {
  const css = await read("apps/web/app/globals.css");
  assert.doesNotMatch(css, /audit-v[0-9]/);
  assert.doesNotMatch(css, /WebDiag 0\.5\.[6-9]/);
  assert.doesNotMatch(css, /font-weight:\s*(?:7[2-9]\d|8\d\d|9\d\d)/);
  assert.doesNotMatch(css, /#116f66|#5ed5c6/i);
});

test("random generators wait for an explicit client action", async () => {
  const source = await read("apps/web/src/features/tools/tool-renderer.tsx");
  assert.match(source, /const \[value, setValue\] = useState\(""\)/);
  assert.doesNotMatch(source, /useState\(\(\) => (?:create|generate)/);
  assert.doesNotMatch(source, /useEffect\(/);
  assert.match(source, /Generate UUID/);
  assert.match(source, /Generate ULID/);
});



test("self-hosted Manrope is optimized and wired through typography variables", async (t) => {
  const css = await read("apps/web/app/globals.css");
  const fontUrl = new URL("../apps/web/public/fonts/manrope-ru-en-400-700.woff2", import.meta.url);
  let font;
  try {
    await access(fontUrl, constants.R_OK);
    font = await readFile(fontUrl);
  } catch (error) {
    const exclusion = await read("HANDOFF_GENERATED/EXCLUSION_NOTICE.md").catch(() => "");
    assert.match(exclusion, /font binaries|woff2/i);
    t.diagnostic(`font binary is absent from the handoff archive by policy: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (font) {
    assert.equal(font.subarray(0, 4).toString("ascii"), "wOF2");
    assert.ok(font.byteLength < 35_000, `optimized font is unexpectedly large: ${font.byteLength}`);
  }
  assert.match(css, /font-family: "Manrope Web"/);
  assert.match(css, /font-weight: 400 700/);
  assert.match(css, /font-display: swap/);
  assert.match(css, /--font-display: var\(--font-family-primary\)/);
  assert.match(css, /--font-body: var\(--font-family-primary\)/);
  assert.match(css, /--font-ui: var\(--font-family-primary\)/);
  assert.match(css, /--font-mono: var\(--font-family-monospace\)/);
  assert.doesNotMatch(css, /Manrope-(?:Regular|Medium|SemiBold|Bold)\.woff2/);
  for (const path of layouts) {
    const source = await read(path);
    assert.match(source, /rel="preload"[^>]+manrope-ru-en-400-700\.woff2/);
  }
});

test("home design rules are tokenized and avoid the rejected regression patterns", async () => {
  const css = await read("apps/web/app/home-v11.css");
  const home = await read("apps/web/src/features/home/home-page.tsx");
  assert.match(css, /--wd-h1:clamp\(48px,4\.5vw,64px\)/);
  assert.match(css, /--wd-h2:clamp\(36px,3\.25vw,48px\)/);
  assert.match(css, /--wd-h3:28px/);
  assert.match(css, /--wd-text-sm:14px/);
  assert.match(css, /--wd-text:15px/);
  assert.match(css, /--wd-text-lg:16px/);
  assert.match(css, /--wd-button-bg:linear-gradient/);
  assert.match(css, /--wd-status-critical-bg/);
  assert.match(css, /--wd-tab-active-bg/);
  assert.match(css, /--wd-faq-question-size:16px/);
  assert.doesNotMatch(css, /font-size:\s*(?:11|12|13)px/);
  assert.doesNotMatch(css, /font-size:\s*(?:6[5-9]|7\d)px/);
  assert.doesNotMatch(css, /background:var\(--wd-t\)/);
  assert.doesNotMatch(home, /Activity/);
  assert.doesNotMatch(home, /Начать проверку/);
  assert.doesNotMatch(home, /wd-step-number/);
  assert.doesNotMatch(home, /<details|<summary/);
  const ruleCss = css.replace(/:root\{[^}]*\}/g, "").replace(/body\[data-theme=dark\]\{[^}]*\}/g, "");
  assert.doesNotMatch(ruleCss, /#[0-9a-fA-F]{3,8}/);
  assert.doesNotMatch(ruleCss, /rgba?\([^)]*\)/);
});
