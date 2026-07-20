import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://webdiag.ru";
const registry = JSON.parse(await readFile(path.join(root, "packages/tool-registry/registry/tools.json"), "utf8"));
const publicTools = registry.filter((tool) => tool.state === "ready");
const internalTools = registry.filter((tool) => tool.state !== "ready");
const manifest = JSON.parse(await readFile(path.join(root, "apps/web/.next/prerender-manifest.json"), "utf8"));
const prerendered = new Set(Object.keys(manifest.routes));
const expected = ["/", "/en", "/tools", "/en/tools", "/robots.txt", "/sitemap.xml"];
for (const tool of publicTools) expected.push(`/tools/${tool.slug}`, `/en/tools/${tool.slug}`);
const missing = expected.filter((route) => !prerendered.has(route));
if (missing.length) throw new Error(`Expected prerendered routes are missing:\n${missing.join("\n")}`);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const value = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(value));
    else if (/\.(?:js|css)$/.test(entry.name)) files.push(value);
  }
  return files;
}

const staticDirectory = path.join(root, "apps/web/.next/static");
const staticFiles = await collectFiles(staticDirectory);
const clientBundle = (await Promise.all(staticFiles.map((file) => readFile(file, "utf8")))).join("\n");
const leaked = internalTools.filter((tool) => clientBundle.includes(tool.slug) || clientBundle.includes(tool.id));
if (leaked.length) {
  throw new Error(`Internal registry definitions leaked into client assets:\n${leaked.map((tool) => `${tool.id} ${tool.slug}`).join("\n")}`);
}
if (clientBundle.includes("riskTier") || clientBundle.includes("implementationWave")) {
  throw new Error("Internal registry fields leaked into client assets.");
}

function htmlPathForRoute(route) {
  if (route === "/") return path.join(root, "apps/web/.next/server/app/index.html");
  return path.join(root, "apps/web/.next/server/app", `${route.slice(1)}.html`);
}

function localizedUrls(route) {
  const english = route === "/en" || route.startsWith("/en/");
  const equivalent = english ? route.replace(/^\/en(?=\/|$)/, "") || "/" : route;
  const ruPath = equivalent;
  const enPath = equivalent === "/" ? "/en" : `/en${equivalent}`;
  const absolute = (value) => value === "/" ? siteUrl : `${siteUrl}${value}`;
  return {
    canonical: absolute(route),
    ru: absolute(ruPath),
    en: absolute(enPath),
    xDefault: absolute(ruPath),
    lang: english ? "en" : "ru",
  };
}

function assertMatch(html, pattern, message) {
  if (!pattern.test(html)) throw new Error(message);
}

const htmlRoutes = expected.filter((route) => !route.endsWith(".txt") && !route.endsWith(".xml"));
const renderedHtml = [];
for (const route of htmlRoutes) {
  const html = await readFile(htmlPathForRoute(route), "utf8");
  renderedHtml.push(html);
  const urls = localizedUrls(route);
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) throw new Error(`${route} must render exactly one H1; found ${h1Count}.`);
  assertMatch(html, new RegExp(`<html lang="${urls.lang}"`), `${route} has an incorrect html lang attribute.`);
  assertMatch(html, /<title>[^<]+<\/title>/, `${route} is missing a non-empty title.`);
  assertMatch(html, /<meta name="description" content="[^"]+"\/>/, `${route} is missing a meta description.`);
  assertMatch(html, new RegExp(`<link rel="canonical" href="${urls.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\/>`), `${route} has an incorrect canonical URL.`);
  for (const [language, href] of [["ru", urls.ru], ["en", urls.en], ["x-default", urls.xDefault]]) {
    const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assertMatch(html, new RegExp(`<link rel="alternate" hrefLang="${language}" href="${escaped}"\/>`), `${route} is missing the ${language} alternate.`);
  }
  assertMatch(html, /<meta property="og:title" content="[^"]+"\/>/, `${route} is missing Open Graph metadata.`);
  assertMatch(html, /<meta property="og:image" content="https:\/\/webdiag\.ru\/og\/webdiag\.png"\/>/, `${route} is missing the social image.`);
  assertMatch(html, /<meta name="twitter:card" content="summary_large_image"\/>/, `${route} is missing Twitter card metadata.`);
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((match) => match[1]);
  if (!jsonLd.length) throw new Error(`${route} is missing JSON-LD.`);
  for (const value of jsonLd) {
    try { JSON.parse(value); }
    catch (error) { throw new Error(`${route} contains invalid JSON-LD: ${error instanceof Error ? error.message : String(error)}`); }
  }
}

const htmlCorpus = renderedHtml.join("\n");
const leakedInHtml = internalTools.filter((tool) => htmlCorpus.includes(tool.slug) || htmlCorpus.includes(tool.id));
if (leakedInHtml.length) {
  throw new Error(`Internal registry definitions leaked into rendered HTML:\n${leakedInHtml.map((tool) => `${tool.id} ${tool.slug}`).join("\n")}`);
}

console.log(`Built site verified: ${expected.length} public routes prerendered; ${htmlRoutes.length} HTML routes have localized SEO metadata and JSON-LD; no internal tool definitions leaked.`);
