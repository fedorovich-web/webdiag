import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateToolCatalogQuality } from "./verify-tool-catalog-quality.mjs";

const rootUrl = new URL("../", import.meta.url);
const readText = (relativePath) => readFile(new URL(relativePath, rootUrl), "utf8");
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

const tools = await readJson("packages/tool-registry/registry/tools.json");
const strategyDocument = await readText("docs/TOOL_CATALOG_STRATEGY.md");

test("catalog strategy records the no-microtool product policy", () => {
  for (const marker of [
    "Product Value Gate",
    "Anti-microtool rule",
    "Performance and PageSpeed policy",
    "AI tools policy",
    "Image/media tools policy",
    "Monitoring policy",
    "Batch implementation rule",
  ]) {
    assert.match(strategyDocument, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("ready registry tools pass the catalog product quality gate", () => {
  assert.deepEqual(validateToolCatalogQuality(tools, strategyDocument), []);
});

test("H1 checker cannot be promoted as a standalone public tool", () => {
  const invalid = [
    ...tools,
    {
      id: "WD-X01",
      slug: "h1-checker",
      title: { ru: "Проверка H1", en: "H1 Checker" },
      category: "seo-audit",
      executorClass: "safe_fetch",
      riskTier: "R1",
      access: "none",
      implementationWave: "W2",
      state: "ready",
      description: { ru: "Проверяет один тег H1 на странице.", en: "Checks one H1 tag on a page." },
    },
  ];
  assert.ok(validateToolCatalogQuality(invalid, strategyDocument).some((failure) => failure.includes("h1-checker")));
});

test("single-header microtools cannot be promoted as public tools", () => {
  const invalid = [
    ...tools,
    {
      id: "WD-X02",
      slug: "hsts-checker",
      title: { ru: "Проверка HSTS", en: "HSTS Checker" },
      category: "security-network",
      executorClass: "safe_fetch",
      riskTier: "R1",
      access: "none",
      implementationWave: "W2",
      state: "ready",
      description: {
        ru: "Проверяет только один HTTP-заголовок Strict-Transport-Security для страницы.",
        en: "Checks only one Strict-Transport-Security HTTP header for a page.",
      },
    },
  ];
  assert.ok(validateToolCatalogQuality(invalid, strategyDocument).some((failure) => failure.includes("hsts-checker")));
});

test("aggregate heading structure checker remains the intended replacement for H1 microtools", () => {
  const headingStructure = tools.find((tool) => tool.slug === "heading-structure-checker");
  assert.equal(headingStructure?.title.ru, "Проверка структуры заголовков");
  assert.equal(headingStructure?.state, "internal");
});
