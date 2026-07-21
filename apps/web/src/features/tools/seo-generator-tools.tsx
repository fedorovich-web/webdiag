import { FormEvent, useMemo, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";

type RobotsForm = {
  userAgent: string;
  allow: string;
  disallow: string;
  sitemap: string;
  crawlDelay: string;
};

type SitemapForm = {
  urls: string;
  lastmod: string;
  changefreq: string;
  priority: string;
};

type FaqForm = {
  url: string;
  questions: string;
};

const DEFAULT_ROBOTS: RobotsForm = {
  userAgent: "*",
  allow: "/",
  disallow: "/admin\n/private",
  sitemap: "https://example.com/sitemap.xml",
  crawlDelay: "",
};

const DEFAULT_SITEMAP: SitemapForm = {
  urls: "https://example.com/\nhttps://example.com/services\nhttps://example.com/contacts",
  lastmod: "",
  changefreq: "weekly",
  priority: "0.8",
};

const DEFAULT_FAQ: FaqForm = {
  url: "https://example.com/faq",
  questions: "What is WebDiag?\nWebDiag checks technical SEO and site quality.\n\nHow fast is it?\nMost lightweight checks run quickly; crawler and PageSpeed jobs are separate.",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { value: string; locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function cleanLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeRobotsPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "*") return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function jsonLdScript(value: unknown): string {
  return `<script type="application/ld+json">\n${JSON.stringify(value, null, 2)}\n</script>`;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function generateRobotsTxt(input: RobotsForm): string {
  const userAgent = input.userAgent.trim() || "*";
  const allow = cleanLines(input.allow).map(normalizeRobotsPath).filter(Boolean);
  const disallow = cleanLines(input.disallow).map(normalizeRobotsPath).filter(Boolean);
  const sitemap = input.sitemap.trim();
  const crawlDelay = input.crawlDelay.trim();
  const lines = [`User-agent: ${userAgent}`];

  for (const path of allow) lines.push(`Allow: ${path}`);
  for (const path of disallow) lines.push(`Disallow: ${path}`);
  if (crawlDelay) lines.push(`Crawl-delay: ${crawlDelay}`);
  if (sitemap) lines.push("", `Sitemap: ${sitemap}`);

  return `${lines.join("\n")}\n`;
}

export function validateRobotsTxt(input: RobotsForm): string | null {
  if (input.sitemap.trim() && !isHttpUrl(input.sitemap.trim())) {
    return "Sitemap must be an absolute HTTP(S) URL.";
  }
  if (input.crawlDelay.trim() && Number(input.crawlDelay.trim()) < 0) {
    return "Crawl-delay must be zero or a positive number.";
  }
  return null;
}

export function generateSitemapXml(input: SitemapForm): string {
  const urls = cleanLines(input.urls);
  const lastmod = input.lastmod.trim();
  const changefreq = input.changefreq.trim();
  const priority = input.priority.trim();
  const entries = urls.map((url) => {
    const fields = [`    <loc>${xmlEscape(url)}</loc>`];
    if (lastmod) fields.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
    if (changefreq) fields.push(`    <changefreq>${xmlEscape(changefreq)}</changefreq>`);
    if (priority) fields.push(`    <priority>${xmlEscape(priority)}</priority>`);
    return `  <url>\n${fields.join("\n")}\n  </url>`;
  });

  return [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}

export function validateSitemapInput(input: SitemapForm): string | null {
  const urls = cleanLines(input.urls);
  if (!urls.length) return "Add at least one URL.";
  const invalidUrl = urls.find((url) => !isHttpUrl(url));
  if (invalidUrl) return `Invalid URL: ${invalidUrl}`;
  const priority = input.priority.trim();
  if (priority) {
    const value = Number(priority);
    if (Number.isNaN(value) || value < 0 || value > 1) {
      return "Priority must be a number from 0.0 to 1.0.";
    }
  }
  return null;
}

function parseFaqPairs(value: string): { question: string; answer: string }[] {
  return value
    .split(/\n\s*\n/g)
    .map((block) => cleanLines(block))
    .flatMap((lines) => {
      const [question, ...answerLines] = lines;
      if (!question || answerLines.length === 0) return [];
      return [{ question, answer: answerLines.join(" ") }];
    });
}

export function generateFaqSchema(input: FaqForm): string {
  const pairs = parseFaqPairs(input.questions);
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((pair) => ({
      "@type": "Question",
      name: pair.question,
      acceptedAnswer: { "@type": "Answer", text: pair.answer },
    })),
  } as Record<string, unknown>;

  if (input.url.trim()) payload.url = input.url.trim();
  return jsonLdScript(payload);
}

export function validateFaqInput(input: FaqForm): string | null {
  if (input.url.trim() && !isHttpUrl(input.url.trim())) return "Page URL must be HTTP(S).";
  if (parseFaqPairs(input.questions).length === 0) {
    return "Add at least one question/answer block separated by a blank line.";
  }
  return null;
}

function useGenerated<T>(initial: T, create: (input: T) => string, validate: (input: T) => string | null) {
  const [input, setInput] = useState(initial);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  function run(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const validation = validate(input);
    if (validation) {
      setError(validation);
      setOutput("");
      return;
    }
    setError("");
    setOutput(create(input));
  }

  return { input, setInput, output, error, run };
}

export function RobotsTxtGeneratorTool({ locale }: { locale: Locale }) {
  const tool = useGenerated(DEFAULT_ROBOTS, generateRobotsTxt, validateRobotsTxt);
  const submitLabel = locale === "ru" ? "Сгенерировать robots.txt" : "Generate robots.txt";

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Правила" : "Rules"}>
      <form onSubmit={tool.run}>
        <label className="field"><span>User-agent</span><input value={tool.input.userAgent} onChange={(event) => tool.setInput({ ...tool.input, userAgent: event.target.value })} /></label>
        <label className="field"><span>Allow</span><textarea value={tool.input.allow} onChange={(event) => tool.setInput({ ...tool.input, allow: event.target.value })} rows={4} /></label>
        <label className="field"><span>Disallow</span><textarea value={tool.input.disallow} onChange={(event) => tool.setInput({ ...tool.input, disallow: event.target.value })} rows={4} /></label>
        <label className="field"><span>Sitemap URL</span><input value={tool.input.sitemap} onChange={(event) => tool.setInput({ ...tool.input, sitemap: event.target.value })} /></label>
        <label className="field"><span>Crawl-delay</span><input value={tool.input.crawlDelay} onChange={(event) => tool.setInput({ ...tool.input, crawlDelay: event.target.value })} inputMode="decimal" /></label>
        <button className="button" type="submit">{submitLabel}</button>
        <ErrorMessage value={tool.error} />
      </form>
    </Panel>
    <Panel title="robots.txt"><Output value={tool.output} locale={locale} /></Panel>
  </div>;
}

export function SitemapGeneratorTool({ locale }: { locale: Locale }) {
  const tool = useGenerated(DEFAULT_SITEMAP, generateSitemapXml, validateSitemapInput);
  const submitLabel = locale === "ru" ? "Сгенерировать sitemap.xml" : "Generate sitemap.xml";
  const urlCount = useMemo(() => cleanLines(tool.input.urls).length, [tool.input.urls]);

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "URL списка" : "URL list"}>
      <form onSubmit={tool.run}>
        <label className="field"><span>{locale === "ru" ? "URL, по одному на строку" : "URLs, one per line"}</span><textarea value={tool.input.urls} onChange={(event) => tool.setInput({ ...tool.input, urls: event.target.value })} rows={8} /></label>
        <label className="field"><span>lastmod</span><input placeholder="2026-07-21" value={tool.input.lastmod} onChange={(event) => tool.setInput({ ...tool.input, lastmod: event.target.value })} /></label>
        <label className="field"><span>changefreq</span><input value={tool.input.changefreq} onChange={(event) => tool.setInput({ ...tool.input, changefreq: event.target.value })} /></label>
        <label className="field"><span>priority</span><input value={tool.input.priority} onChange={(event) => tool.setInput({ ...tool.input, priority: event.target.value })} inputMode="decimal" /></label>
        <p className="tool-muted">{locale === "ru" ? `URL в списке: ${urlCount}` : `URLs in list: ${urlCount}`}</p>
        <button className="button" type="submit">{submitLabel}</button>
        <ErrorMessage value={tool.error} />
      </form>
    </Panel>
    <Panel title="sitemap.xml"><Output value={tool.output} locale={locale} /></Panel>
  </div>;
}

export function FaqSchemaGeneratorTool({ locale }: { locale: Locale }) {
  const tool = useGenerated(DEFAULT_FAQ, generateFaqSchema, validateFaqInput);
  const submitLabel = locale === "ru" ? "Сгенерировать FAQPage JSON-LD" : "Generate FAQPage JSON-LD";

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "FAQ данные" : "FAQ data"}>
      <form onSubmit={tool.run}>
        <label className="field"><span>{locale === "ru" ? "URL страницы" : "Page URL"}</span><input value={tool.input.url} onChange={(event) => tool.setInput({ ...tool.input, url: event.target.value })} /></label>
        <label className="field"><span>{locale === "ru" ? "Вопрос и ответ, блоками через пустую строку" : "Question and answer blocks separated by a blank line"}</span><textarea value={tool.input.questions} onChange={(event) => tool.setInput({ ...tool.input, questions: event.target.value })} rows={10} /></label>
        <button className="button" type="submit">{submitLabel}</button>
        <ErrorMessage value={tool.error} />
      </form>
    </Panel>
    <Panel title="FAQPage JSON-LD"><Output value={tool.output} locale={locale} /></Panel>
  </div>;
}
