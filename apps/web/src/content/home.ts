import type { HomeContent } from "./types";

export const homeContent: HomeContent = {
  seoTitle: {
    ru: "Проверка сайта на ошибки — технический анализ онлайн | WebDiag",
    en: "Website Error Check & Technical Analysis Online | WebDiag",
  },
  eyebrow: {
    ru: "Техническая диагностика сайта",
    en: "Technical website diagnostics",
  },
  title: {
    ru: "Проверка сайта на технические и SEO-ошибки",
    en: "Check Your Website for Technical and SEO Issues",
  },
  description: {
    ru: "Проверьте страницу или сайт: мета-теги, robots.txt, sitemap.xml, редиректы, HTTPS, скорость и другие технические SEO-сигналы. WebDiag показывает найденные проблемы, затронутые URL и помогает понять, что исправлять в первую очередь.",
    en: "Check a page or website for metadata, robots.txt, sitemap.xml, redirects, HTTPS, performance and other technical SEO signals. WebDiag surfaces issues, affected URLs and helps you decide what to fix first.",
  },
  primaryAction: { ru: "Проверить сайт", en: "Check website" },
  secondaryAction: { ru: "Посмотреть пример отчёта", en: "View sample report" },
  heroNote: {
    ru: "Быстрая проверка URL без сложной настройки. Ниже — пример подробного отчёта с приоритетами и рекомендациями.",
    en: "Run a quick URL check without complex setup. Below you can see a detailed report example with priorities and recommendations.",
  },
  trustFacts: [
    { ru: "140+ инструментов для SEO и диагностики", en: "140+ tools for SEO and diagnostics" },
    { ru: "Понятные отчёты с приоритетами", en: "Clear reports with priorities" },
    { ru: "Повторные проверки и мониторинг", en: "Re-checks and monitoring" },
  ],

  platformsTitle: {
    ru: "Проверяйте сайты на популярных CMS, конструкторах и собственных стеках",
    en: "Check websites built with popular CMSs, site builders and custom stacks",
  },
  platforms: ["WordPress", "OpenCart", "1C-Битрикс", "Tilda", "Joomla", "MODX"],

  popularToolsTitle: { ru: "Популярные инструменты", en: "Popular tools" },
  popularToolsDescription: {
    ru: "Быстрые проверки для самых частых технических и SEO-задач.",
    en: "Focused checks for common technical and SEO tasks.",
  },
  popularToolsAction: { ru: "Все 140+ инструментов", en: "All 140+ tools" },
  popularTools: [
    {
      slug: "single-page-audit",
      title: { ru: "Проверка SEO", en: "SEO check" },
      description: { ru: "Техническая проверка одной страницы с итоговой оценкой и списком проблем.", en: "Technical check of a single page with a score and issue list." },
    },
    {
      slug: "core-web-vitals-checker",
      title: { ru: "Анализ скорости", en: "Performance analysis" },
      description: { ru: "Core Web Vitals, Lighthouse-сигналы и причины просадок производительности.", en: "Core Web Vitals, Lighthouse signals and performance bottlenecks." },
    },
    {
      slug: "robots-txt-tester",
      title: { ru: "Проверка robots.txt", en: "Robots.txt check" },
      description: { ru: "Проверьте доступность файла, правила обхода и Sitemap directives.", en: "Check file availability, crawl rules and Sitemap directives." },
    },
    {
      slug: "sitemap-validator",
      title: { ru: "Проверка sitemap.xml", en: "Sitemap.xml check" },
      description: { ru: "Проверка XML, доступности sitemap и наличия нужного URL.", en: "Validate XML, sitemap availability and target URL presence." },
    },
    {
      slug: "redirect-chain-checker",
      title: { ru: "Проверка редиректов", en: "Redirect check" },
      description: { ru: "HTTP-статус, финальный адрес и полная цепочка переходов.", en: "HTTP status, final destination and the complete redirect chain." },
    },
    {
      slug: "meta-tags-checker",
      title: { ru: "Проверка мета-тегов", en: "Meta tags check" },
      description: { ru: "Title, description, robots, canonical, Open Graph и JSON-LD.", en: "Title, description, robots, canonical, Open Graph and JSON-LD." },
    },
    {
      slug: "canonical-checker",
      title: { ru: "Проверка canonical", en: "Canonical check" },
      description: { ru: "Найдите отсутствующие, конфликтующие и некорректные canonical-ссылки.", en: "Find missing, conflicting or incorrect canonical references." },
    },
    {
      slug: "image-seo-audit",
      title: { ru: "Проверка изображений", en: "Image SEO check" },
      description: { ru: "Alt, размеры, lazy-loading, responsive-разметка и social preview images.", en: "Alt text, dimensions, lazy loading, responsive markup and social preview images." },
    },
  ],

  processTitle: { ru: "Как проходит проверка", en: "How the check works" },
  processDescription: {
    ru: "Три шага от URL до понятного списка задач — без необходимости разбираться во внутренних метриках WebDiag.",
    en: "Three steps from a URL to a clear task list without having to understand WebDiag internals.",
  },
  processSteps: [
    {
      title: { ru: "Укажите URL", en: "Enter a URL" },
      description: { ru: "Вставьте адрес страницы или сайта, который нужно проверить.", en: "Paste the page or website address you want to check." },
    },
    {
      title: { ru: "WebDiag проверит", en: "WebDiag checks it" },
      description: { ru: "Сервис анализирует технические и SEO-сигналы и группирует найденные проблемы.", en: "The service analyzes technical and SEO signals and groups detected issues." },
    },
    {
      title: { ru: "Получите результат", en: "Get the result" },
      description: { ru: "Смотрите приоритеты, затронутые URL и рекомендации по исправлению.", en: "Review priorities, affected URLs and recommended fixes." },
    },
  ],

  checksTitle: { ru: "Что проверяет WebDiag", en: "What WebDiag checks" },
  checksDescription: {
    ru: "Ключевые технические и SEO-сигналы, которые помогают находить проблемы индексации, структуры, скорости и качества страниц.",
    en: "Key technical and SEO signals that reveal indexing, structure, performance and page-quality issues.",
  },
  auditAreas: [
    {
      id: "robots",
      title: { ru: "Файл robots.txt", en: "Robots.txt" },
      description: { ru: "Доступность файла, правила Allow/Disallow и влияние на обход URL.", en: "File availability, Allow/Disallow rules and their effect on crawling." },
      checks: [{ ru: "robots.txt", en: "robots.txt" }],
    },
    {
      id: "sitemap",
      title: { ru: "Sitemap.xml", en: "Sitemap.xml" },
      description: { ru: "Структура sitemap, доступность, URL и ошибки XML.", en: "Sitemap structure, availability, URLs and XML errors." },
      checks: [{ ru: "sitemap.xml", en: "sitemap.xml" }],
    },
    {
      id: "redirects",
      title: { ru: "Редиректы и статусы", en: "Redirects and statuses" },
      description: { ru: "3xx/4xx/5xx, цепочки переходов, битые и недоступные страницы.", en: "3xx/4xx/5xx, redirect chains, broken and unreachable pages." },
      checks: [{ ru: "HTTP status", en: "HTTP status" }],
    },
    {
      id: "metadata",
      title: { ru: "Мета-теги и структура", en: "Metadata and structure" },
      description: { ru: "Title, description, H1–H6, robots, Open Graph и основные on-page сигналы.", en: "Title, description, H1–H6, robots, Open Graph and core on-page signals." },
      checks: [{ ru: "meta + headings", en: "meta + headings" }],
    },
    {
      id: "performance",
      title: { ru: "Скорость загрузки", en: "Page performance" },
      description: { ru: "Core Web Vitals, Lighthouse, тяжёлые ресурсы и проблемные шаблоны.", en: "Core Web Vitals, Lighthouse, heavy resources and slow templates." },
      checks: [{ ru: "CWV + Lighthouse", en: "CWV + Lighthouse" }],
    },
    {
      id: "security",
      title: { ru: "HTTPS и безопасность", en: "HTTPS and security" },
      description: { ru: "SSL, mixed content и базовые HTTP security headers.", en: "SSL, mixed content and baseline HTTP security headers." },
      checks: [{ ru: "SSL + headers", en: "SSL + headers" }],
    },
    {
      id: "links",
      title: { ru: "Внутренние ссылки", en: "Internal links" },
      description: { ru: "Битые ссылки, переходы, глубина и связь страниц внутри сайта.", en: "Broken links, destinations, depth and internal page relationships." },
      checks: [{ ru: "links", en: "links" }],
    },
    {
      id: "canonical",
      title: { ru: "Каноникализация", en: "Canonicalization" },
      description: { ru: "Canonical, noindex и конфликтующие сигналы индексирования.", en: "Canonical, noindex and conflicting indexing signals." },
      checks: [{ ru: "canonical + noindex", en: "canonical + noindex" }],
    },
    {
      id: "accessibility",
      title: { ru: "Доступность", en: "Accessibility" },
      description: { ru: "Alt, labels, контраст, ARIA и навигация с клавиатуры.", en: "Alt text, labels, contrast, ARIA and keyboard navigation." },
      checks: [{ ru: "a11y", en: "a11y" }],
    },
    {
      id: "content",
      title: { ru: "Контент и дубли", en: "Content and duplicates" },
      description: { ru: "Повторы мета-данных, слабые страницы и конкурирующие сигналы.", en: "Duplicate metadata, thin pages and competing signals." },
      checks: [{ ru: "duplicates", en: "duplicates" }],
    },
    {
      id: "indexing",
      title: { ru: "Индексирование", en: "Indexing" },
      description: { ru: "Robots, noindex, canonical и доступность страницы для поисковых систем.", en: "Robots, noindex, canonicals and crawler accessibility." },
      checks: [{ ru: "indexability", en: "indexability" }],
    },
    {
      id: "images",
      title: { ru: "Изображения", en: "Images" },
      description: { ru: "Битые файлы, alt, размеры, lazy-loading и responsive markup.", en: "Broken files, alt text, dimensions, lazy loading and responsive markup." },
      checks: [{ ru: "image SEO", en: "image SEO" }],
    },
  ],

  reportTitle: { ru: "Пример отчёта", en: "Report example" },
  reportDescription: {
    ru: "Не просто список ошибок: отчёт связывает проблему с конкретными URL, показывает её приоритет и даёт понятный следующий шаг.",
    en: "More than an error list: the report connects each issue to specific URLs, shows priority and gives a clear next step.",
  },
  reportAction: { ru: "Посмотреть полный пример отчёта", en: "View full report example" },

  monitoringTitle: { ru: "Мониторинг изменений", en: "Change monitoring" },
  monitoringDescription: {
    ru: "Добавьте проект в личный кабинет, запускайте повторные проверки вручную или по расписанию и смотрите историю изменений.",
    en: "Add a project to your account, run checks manually or on a schedule and review change history.",
  },
  monitoringBullets: [
    { ru: "Повторные проверки по расписанию", en: "Scheduled re-checks" },
    { ru: "Ручной запуск проверки", en: "Manual check runs" },
    { ru: "Новые и исправленные проблемы", en: "New and resolved issues" },
    { ru: "История состояния проекта", en: "Project health history" },
  ],
  monitoringAction: { ru: "Настроить мониторинг", en: "Set up monitoring" },

  knowledgeTitle: { ru: "База знаний и полезные материалы", en: "Knowledge base and useful resources" },
  knowledgeDescription: {
    ru: "Разбирайтесь в техническом SEO и сразу переходите к инструменту, который поможет перепроверить исправление.",
    en: "Learn technical SEO and jump directly to the tool that helps you verify the fix.",
  },
  knowledgeAction: { ru: "Все материалы", en: "All resources" },
  resources: [
    {
      title: { ru: "Основы технического SEO", en: "Technical SEO fundamentals" },
      description: { ru: "Что проверять в первую очередь и как отделять критичные ошибки от улучшений.", en: "What to check first and how to separate critical issues from improvements." },
      href: { ru: "/knowledge", en: "/en/knowledge" },
    },
    {
      title: { ru: "Как проверить robots.txt", en: "How to check robots.txt" },
      description: { ru: "Проверьте доступ поисковых роботов и найдите правило, которое блокирует нужный URL.", en: "Check crawler access and find the rule that blocks a target URL." },
      href: { ru: "/tools/robots-txt-tester", en: "/en/tools/robots-txt-tester" },
    },
    {
      title: { ru: "Core Web Vitals без лишних метрик", en: "Core Web Vitals without metric overload" },
      description: { ru: "Как читать LCP, CLS и другие показатели и с чего начинать оптимизацию страницы.", en: "How to read LCP, CLS and related signals and where to start optimizing a page." },
      href: { ru: "/tools/core-web-vitals-checker", en: "/en/tools/core-web-vitals-checker" },
    },
  ],

  faqTitle: { ru: "Часто задаваемые вопросы", en: "Frequently asked questions" },
  faq: [
    {
      question: { ru: "Нужна ли регистрация для проверки?", en: "Do I need an account to run a check?" },
      answer: { ru: "Быструю проверку публичного URL можно запустить с главной страницы. Личный кабинет нужен для проектов, сохранённой истории и мониторинга.", en: "You can run a quick check of a public URL from the homepage. An account is used for projects, saved history and monitoring." },
    },
    {
      question: { ru: "Что именно проверяет WebDiag?", en: "What does WebDiag check?" },
      answer: { ru: "Технические и SEO-сигналы: мета-теги, robots.txt, sitemap.xml, статусы и редиректы, canonical, индексируемость, ссылки, изображения, скорость, HTTPS и другие проверки, доступные в продукте.", en: "Technical and SEO signals including metadata, robots.txt, sitemap.xml, statuses and redirects, canonicals, indexability, links, images, performance, HTTPS and other checks available in the product." },
    },
    {
      question: { ru: "Чем быстрая проверка отличается от аудита проекта?", en: "How is a quick check different from a project audit?" },
      answer: { ru: "Быстрая проверка анализирует один URL. В личном кабинете можно работать с проектом, ограниченным обходом сайта, отчётами и повторными проверками.", en: "A quick check analyzes one URL. In the account workspace you can work with a project, bounded site crawl, reports and repeated checks." },
    },
    {
      question: { ru: "Показывает ли отчёт затронутые URL?", en: "Does the report show affected URLs?" },
      answer: { ru: "Да. Для проблем, найденных при аудите проекта, интерфейс показывает конкретные страницы и приоритет, чтобы задачу можно было сразу передать на исправление.", en: "Yes. For project-audit issues the interface shows specific pages and priority so the fix can be handed off directly." },
    },
    {
      question: { ru: "Можно ли перепроверить сайт после исправлений?", en: "Can I re-check after making fixes?" },
      answer: { ru: "Да. Точечные инструменты подходят для проверки отдельного сигнала, а в личном кабинете доступны повторные запуски и история проекта.", en: "Yes. Focused tools can verify an individual signal, while the account workspace supports repeat runs and project history." },
    },
    {
      question: { ru: "WebDiag заменяет SEO-специалиста?", en: "Does WebDiag replace an SEO specialist?" },
      answer: { ru: "Нет. WebDiag ускоряет техническую диагностику, группирует проблемы и помогает расставить приоритеты. Семантика, стратегия, контент и итоговые решения остаются задачей специалиста или команды.", en: "No. WebDiag speeds up technical diagnostics, groups issues and helps prioritize work. Search strategy, semantics, content and final decisions remain with the specialist or team." },
    },
  ],

  finalTitle: { ru: "Проверьте свой сайт прямо сейчас", en: "Check your website now" },
  finalDescription: {
    ru: "Введите URL и получите техническую проверку страницы. Для регулярного контроля добавьте сайт в личный кабинет и подключите мониторинг.",
    en: "Enter a URL and run a technical page check. For ongoing control, add the website to your account and enable monitoring.",
  },

  categories: [
    {
      id: "seo-audit",
      title: { ru: "SEO и аудит сайта", en: "SEO and site audit" },
      description: { ru: "Индексация, robots.txt, sitemap, canonical, мета-теги, статусы и редиректы.", en: "Indexing, robots.txt, sitemap, canonicals, metadata, statuses and redirects." },
      toolSlugs: ["single-page-audit", "meta-tags-checker", "robots-txt-tester", "sitemap-validator", "redirect-chain-checker"],
    },
    {
      id: "performance",
      title: { ru: "Производительность", en: "Performance" },
      description: { ru: "Core Web Vitals, Lighthouse и загрузка страницы.", en: "Core Web Vitals, Lighthouse and page loading." },
      toolSlugs: ["core-web-vitals-checker"],
    },
    {
      id: "security-network",
      title: { ru: "Безопасность и сеть", en: "Security and network" },
      description: { ru: "HTTPS, SSL, HTTP-заголовки и сетевые проверки.", en: "HTTPS, SSL, HTTP headers and network checks." },
      toolSlugs: [],
    },
    {
      id: "css-design",
      title: { ru: "Интерфейс и доступность", en: "UI and accessibility" },
      description: { ru: "Контраст, единицы измерения и вспомогательные UI-проверки.", en: "Contrast, sizing and supporting UI checks." },
      toolSlugs: ["color-contrast-checker", "px-rem-converter"],
    },
    {
      id: "media-utilities",
      title: { ru: "Изображения", en: "Images" },
      description: { ru: "Оптимизация, размеры, форматы и работа с медиа.", en: "Optimization, dimensions, formats and media utilities." },
      toolSlugs: ["image-optimizer", "image-format-converter", "image-resizer"],
    },
    {
      id: "development-data",
      title: { ru: "Разработка и данные", en: "Development and data" },
      description: { ru: "JSON, кодирование, хеши, UUID и технические преобразования.", en: "JSON, encoding, hashes, UUIDs and technical conversions." },
      toolSlugs: ["json-formatter-validator", "url-encoder-decoder", "base64-converter", "hash-generator", "uuid-generator"],
    },
  ],
};
