import type { HomeContent } from "./types";

export const homeContent: HomeContent = {
  eyebrow: {
    ru: "Electric Pulse · SEO-аудит · диагностика",
    en: "Electric Pulse · SEO audit · diagnostics",
  },
  title: {
    ru: "Найдите ошибки сайта до потери SEO-трафика",
    en: "Find website issues before they cost SEO traffic",
  },
  description: {
    ru: "WebDiag находит проблемы обхода, индексации, мета-тегов, редиректов, скорости, безопасности и доступности. Отчёт сразу показывает, что блокирует рост, какие URL затронуты и с чего начать исправления.",
    en: "WebDiag finds crawlability, indexing, metadata, redirect, speed, security, and accessibility issues. The report shows what blocks growth, which URLs are affected, and what to fix first.",
  },
  primaryAction: { ru: "Проверить сайт", en: "Check website" },
  secondaryAction: { ru: "Что проверяется", en: "What is checked" },
  trustFacts: [
    { ru: "Обход сайта, индексация и sitemap", en: "Crawling, indexing, and sitemap" },
    { ru: "SEO, скорость, безопасность и доступность", en: "SEO, speed, security, and accessibility" },
    { ru: "AI-помощник после аудита", en: "AI assistant after the audit" },
  ],
  quickTasks: [
    {
      slug: "crawl-diagnostics",
      title: { ru: "Найти страницы и проблемы обхода", en: "Find pages and crawl issues" },
      description: { ru: "Sitemap, robots.txt, глубина, orphan URL, закрытые страницы и конфликтующие сигналы индексации.", en: "Sitemap, robots.txt, depth, orphan URLs, blocked pages, and conflicting indexing signals." },
    },
    {
      slug: "technical-seo",
      title: { ru: "Разобрать технические SEO-ошибки", en: "Review technical SEO issues" },
      description: { ru: "HTTP-статусы, редиректы, canonical, noindex, битые ссылки, HTTPS и цепочки переходов.", en: "HTTP statuses, redirects, canonicals, noindex, broken links, HTTPS, and redirect chains." },
    },
    {
      slug: "on-page-seo",
      title: { ru: "Проверить качество страниц", en: "Check page quality" },
      description: { ru: "Title, description, H1–H6, дубли, пустые значения, Open Graph, schema.org и слабые сниппеты.", en: "Titles, descriptions, H1–H6, duplicates, empty values, Open Graph, schema.org, and weak snippets." },
    },
    {
      slug: "web-quality",
      title: { ru: "Оценить скорость и доверие", en: "Review speed and trust" },
      description: { ru: "Core Web Vitals, SSL, mixed content, security headers, изображения на страницах и базовая доступность.", en: "Core Web Vitals, SSL, mixed content, security headers, on-page images, and baseline accessibility." },
    },
    {
      slug: "ai-assistant",
      title: { ru: "Подготовить исправления", en: "Prepare fixes" },
      description: { ru: "AI объясняет ошибки и помогает подготовить meta-теги, FAQ, schema.org и ТЗ по результатам аудита.", en: "AI explains issues and helps draft meta tags, FAQ, schema.org, and audit-based tasks." },
    },
    {
      slug: "monitoring",
      title: { ru: "Следить за регрессиями", en: "Monitor regressions" },
      description: { ru: "Повторные проверки, история оценок, новые ошибки, исправленные проблемы и контроль изменений.", en: "Scheduled checks, score history, new issues, resolved problems, and change control." },
    },
  ],
  auditAreas: [
    {
      id: "crawl-indexing",
      title: { ru: "Обход и индексация", en: "Crawling and indexing" },
      description: { ru: "Показывает, какие страницы не попадают в индекс, что закрыто правилами обхода и где конфликтуют robots.txt, canonical или noindex.", en: "Shows which pages do not reach the index, what is blocked by crawl rules, and where robots.txt, canonicals, or noindex conflict." },
      checks: [
        { ru: "robots.txt, sitemap.xml, canonical", en: "robots.txt, sitemap.xml, canonicals" },
        { ru: "noindex, x-robots-tag, закрытые URL", en: "noindex, x-robots-tag, blocked URLs" },
        { ru: "глубина, orphan URL, дубли", en: "depth, orphan URLs, duplicates" },
      ],
    },
    {
      id: "technical-seo",
      title: { ru: "Технические ошибки", en: "Technical issues" },
      description: { ru: "Находит статусы 3xx/4xx/5xx, цепочки редиректов, битые ссылки, HTTPS и mixed content, которые дают поисковым роботам неверные сигналы.", en: "Finds 3xx/4xx/5xx statuses, redirect chains, broken links, HTTPS, and mixed content that send wrong signals to crawlers." },
      checks: [
        { ru: "3xx/4xx/5xx и redirect chains", en: "3xx/4xx/5xx and redirect chains" },
        { ru: "битые ссылки и изображения", en: "broken links and images" },
        { ru: "HTTPS, mixed content, SSL", en: "HTTPS, mixed content, SSL" },
      ],
    },
    {
      id: "on-page-content",
      title: { ru: "On-page SEO и контент", en: "On-page SEO and content" },
      description: { ru: "Показывает страницы без title и description, дубли мета-тегов, проблемы H1–H6, schema.org, Open Graph и слабые сниппеты.", en: "Shows pages missing titles and descriptions, duplicate metadata, H1–H6 issues, schema.org, Open Graph, and weak snippets." },
      checks: [
        { ru: "title, description, H1–H6", en: "titles, descriptions, H1–H6" },
        { ru: "дубли, пустые значения, тонкие страницы", en: "duplicates, empty values, thin pages" },
        { ru: "Schema.org, Open Graph, FAQ", en: "Schema.org, Open Graph, FAQ" },
      ],
    },
    {
      id: "performance-accessibility",
      title: { ru: "Скорость и доступность", en: "Speed and accessibility" },
      description: { ru: "Показывает, какие ресурсы замедляют страницы, где проседают Core Web Vitals и какие элементы мешают доступности.", en: "Shows which assets slow pages down, where Core Web Vitals fail, and which elements hurt accessibility." },
      checks: [
        { ru: "Core Web Vitals и вес ресурсов", en: "Core Web Vitals and asset weight" },
        { ru: "alt, контраст, labels, aria", en: "alt, contrast, labels, aria" },
        { ru: "размеры изображений и lazy-loading", en: "image sizes and lazy loading" },
      ],
    },
    {
      id: "security-quality",
      title: { ru: "Безопасность и качество", en: "Security and quality" },
      description: { ru: "Проверяет SSL, HSTS, CSP, security headers и mixed content — сигналы, которые влияют на доверие и техническую чистоту сайта.", en: "Checks SSL, HSTS, CSP, security headers, and mixed content — signals that affect trust and technical quality." },
      checks: [
        { ru: "security headers", en: "security headers" },
        { ru: "HTTP→HTTPS, HSTS", en: "HTTP→HTTPS, HSTS" },
        { ru: "HTML-ошибки и предупреждения", en: "HTML errors and warnings" },
      ],
    },
    {
      id: "ai-visibility",
      title: { ru: "AI-помощник", en: "AI assistant" },
      description: { ru: "Включается после аудита: объясняет найденные ошибки простым языком и помогает подготовить короткие задачи для исправлений.", en: "Starts after the audit: explains detected issues in plain language and helps prepare short fix tasks." },
      checks: [
        { ru: "объяснения ошибок", en: "issue explanations" },
        { ru: "meta, FAQ, schema.org, ТЗ", en: "meta, FAQ, schema.org, tasks" },
        { ru: "структура ответа", en: "answer structure" },
      ],
    },
  ],
  categories: [
    {
      id: "development-data",
      title: { ru: "Разметка и данные", en: "Markup and data" },
      description: { ru: "JSON, кодирование, хеши, даты и технические значения для исправления ошибок аудита и проверки разметки.", en: "JSON, encoding, hashes, dates, and technical values for audit fixes and markup checks." },
      toolSlugs: ["json-formatter-validator", "url-encoder-decoder", "base64-converter", "hash-generator", "uuid-generator", "unix-timestamp-converter", "ulid-generator"],
    },
    {
      id: "css-design",
      title: { ru: "UI и accessibility", en: "UI and accessibility" },
      description: { ru: "Контраст, размеры и вспомогательные проверки для устранения проблем доступности и интерфейса.", en: "Contrast, sizing, and helper checks for accessibility and interface fixes." },
      toolSlugs: ["color-contrast-checker", "px-rem-converter"],
    },
    {
      id: "media-utilities",
      title: { ru: "Изображения на страницах", en: "Images on pages" },
      description: { ru: "Оптимизация, размер, формат и пропорции изображений после того, как аудит нашёл тяжёлые или проблемные файлы.", en: "Optimization, size, format, and aspect ratio after the audit detects heavy or problematic images." },
      toolSlugs: ["image-optimizer", "image-format-converter", "image-resizer", "image-cropper", "image-aspect-ratio-calculator"],
    },
  ],
  faq: [
    {
      question: { ru: "Что является ядром WebDiag?", en: "What is the WebDiag core?" },
      answer: { ru: "Ядро — технический SEO-аудит сайта: обход страниц, проверки, приоритеты ошибок, отчёты и мониторинг. Дополнительные утилиты нужны для исправления найденных проблем.", en: "The core is technical website SEO auditing: page crawling, checks, issue priorities, reports, and monitoring. Supporting utilities help fix detected issues." },
    },
    {
      question: { ru: "AI будет главным продуктом?", en: "Will AI be the main product?" },
      answer: { ru: "Нет. AI — вспомогательный слой: объясняет найденные ошибки, помогает подготовить meta-теги, FAQ, schema.org, ТЗ и оценить структуру страницы для поиска и AI-ответов. Основа остаётся фактическим аудитом сайта.", en: "No. AI is an assistant layer: it explains detected issues, drafts meta tags, FAQ, schema.org, tasks, and reviews AI Visibility. The foundation remains factual website auditing." },
    },
    {
      question: { ru: "Какие проверки входят в аудит?", en: "Which checks are included?" },
      answer: { ru: "Индексация, robots.txt, sitemap.xml, canonical, meta-теги, статусы, редиректы, битые ссылки, скорость, Core Web Vitals, SSL, security headers, accessibility, schema.org, контент и дубли.", en: "Indexing, robots.txt, sitemap.xml, canonicals, meta tags, statuses, redirects, broken links, speed, Core Web Vitals, SSL, security headers, accessibility, schema.org, content, and duplicates." },
    },
    {
      question: { ru: "Почему есть image optimizer и похожие инструменты?", en: "Why include image optimizer and similar tools?" },
      answer: { ru: "Они не являются позиционированием WebDiag. Это инструменты исправления: если аудит нашёл тяжёлые изображения, отсутствующие размеры, проблемы формата или влияние на LCP, пользователь может быстро подготовить исправленный файл.", en: "They are not the WebDiag positioning. They are fix tools: if the audit detects heavy images, missing dimensions, format issues, or LCP impact, the user can prepare a corrected file faster." },
    },
  ],
};
