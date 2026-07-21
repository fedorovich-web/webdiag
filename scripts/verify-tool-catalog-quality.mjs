import { readFile } from "node:fs/promises";

const rootUrl = new URL("../", import.meta.url);
const readText = (relativePath) => readFile(new URL(relativePath, rootUrl), "utf8");
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

export const forbiddenReadySlugPatterns = [
  /(?:^|-)h1(?:-|$)/i,
  /title-length-checker/i,
  /description-length-checker/i,
  /meta-description-length-checker/i,
  /(?:^|-)alt-(?:attribute|tag)-checker/i,
  /single-header-checker/i,
  /hsts-checker/i,
  /x-frame-options-checker/i,
  /x-content-type-options-checker/i,
  /referrer-policy-checker/i,
  /permissions-policy-checker/i,
];

export const forbiddenReadyTitlePatterns = [
  /\bH1\b\s+(?:Checker|Проверка)/i,
  /(?:проверка|checker)\s+H1/i,
  /title\s+length\s+checker/i,
  /description\s+length\s+checker/i,
  /проверка\s+длины\s+title/i,
  /проверка\s+длины\s+description/i,
  /alt\s+attribute\s+checker/i,
];

export const requiredStrategyMarkers = [
  "Product Value Gate",
  "Anti-microtool rule",
  "Performance and PageSpeed policy",
  "AI tools policy",
  "Image/media tools policy",
  "Monitoring policy",
  "Batch implementation rule",
  "H1 Checker",
  "Core Web Vitals/PageSpeed Checker",
  "Add Watermark to Image",
  "Background Remover",
];

export function validateToolCatalogQuality(tools, strategyDocument) {
  const failures = [];
  const readyTools = tools.filter((tool) => tool.state === "ready");

  for (const marker of requiredStrategyMarkers) {
    if (!strategyDocument.includes(marker)) {
      failures.push(`TOOL_CATALOG_STRATEGY.md is missing required marker: ${marker}`);
    }
  }

  for (const tool of readyTools) {
    for (const pattern of forbiddenReadySlugPatterns) {
      if (pattern.test(tool.slug)) {
        failures.push(`${tool.id}/${tool.slug}: forbidden weak microtool slug cannot be ready.`);
      }
    }

    const localizedTitles = [tool.title?.ru ?? "", tool.title?.en ?? ""];
    for (const title of localizedTitles) {
      for (const pattern of forbiddenReadyTitlePatterns) {
        if (pattern.test(title)) {
          failures.push(`${tool.id}/${tool.slug}: forbidden weak microtool title cannot be ready: ${title}`);
        }
      }
    }

    if (!tool.description?.ru || !tool.description?.en) {
      failures.push(`${tool.id}/${tool.slug}: ready tool needs RU/EN public descriptions.`);
      continue;
    }

    if (tool.executorClass !== "browser" && (tool.description.ru.length < 80 || tool.description.en.length < 80)) {
      failures.push(`${tool.id}/${tool.slug}: server-backed ready tool description is too thin for a public tool.`);
    }
  }

  const headingStructure = tools.find((tool) => tool.slug === "heading-structure-checker");
  if (!headingStructure) {
    failures.push("Registry must keep heading-structure-checker as the aggregate replacement for H1 microtools.");
  }
  if (headingStructure?.slug === "h1-checker") {
    failures.push("Registry must not replace heading-structure-checker with h1-checker.");
  }

  const coreWebVitals = tools.find((tool) => tool.slug === "core-web-vitals-checker");
  if (!coreWebVitals) {
    failures.push("Registry must keep core-web-vitals-checker for the PageSpeed/Core Web Vitals integration path.");
  }

  const imageWatermark = strategyDocument.includes("Add Watermark to Image");
  if (!imageWatermark) failures.push("Image strategy must include Add Watermark to Image.");

  return failures;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tools = await readJson("packages/tool-registry/registry/tools.json");
  const strategyDocument = await readText("docs/TOOL_CATALOG_STRATEGY.md");
  const failures = validateToolCatalogQuality(tools, strategyDocument);

  if (failures.length > 0) {
    console.error(failures.join("\n"));
    process.exit(1);
  }

  const readyCount = tools.filter((tool) => tool.state === "ready").length;
  console.log(`Tool catalog quality verified: ${tools.length} tools, ${readyCount} ready tools, no weak ready microtools.`);
}
