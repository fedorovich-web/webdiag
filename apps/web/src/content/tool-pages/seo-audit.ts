import { toolPage } from "./shared";

export const seoAuditToolPages = [

  toolPage({
    slug: "whole-site-audit",
    lastReviewedAt: "2026-10-22",
    reviewDueAt: "2027-04-22",
    seoTitle: { ru: "Ограниченный аудит сайта по проекту", en: "Bounded Project Site Audit" },
    metaDescription: { ru: "Запустите из проекта ограниченный обход одного origin: до 100 публичных HTML-страниц, статусы, метаданные, ссылки, robots.txt и sitemap без обещания полного покрытия.", en: "Run a project-bound crawl of one origin: up to 25 public HTML pages with status, metadata, links, robots.txt, and sitemap evidence without claiming complete coverage." },
    h1: { ru: "Ограниченный аудит сайта", en: "Bounded Site Audit" },
    lead: { ru: "Авторизованный обход проекта последовательно сканирует до 100 публичных HTML-страниц одного origin и сохраняет результат в истории для выявления битых ссылок, дублей и ошибок индексации.", en: "The authenticated project crawl fetches up to 25 public HTML pages on one origin and stores the result in project history to identify broken links, duplicates, and indexing issues." },
    quickFacts: [
      { ru: "До 100 HTML-страниц", en: "Up to 100 HTML pages" },
      { ru: "Один origin", en: "One origin" },
      { ru: "История в проекте", en: "Project history" },
    ],
    howToSteps: [
      { ru: "Авторизуйтесь и откройте проект с подтверждённым origin.", en: "Sign in and open a project with the intended origin." },
      { ru: "Запустите ограниченный обход из обзора проекта.", en: "Start the bounded crawl from the project overview." },
      { ru: "Проверьте полученные страницы, частичные ошибки, повторы и кандидатов без ссылок с учётом лимита выборки.", en: "Review fetched pages, partial failures, duplicates, and unlinked candidates in the context of the sample limit." },
    ],
    supportedFeatures: [
      { ru: "Собирает HTTP status, title, description и внутренние ссылки из статического HTML.", en: "Collects HTTP status, title, description, and internal links from static HTML." },
      { ru: "Остаётся в пределах одного origin и применяет SSRF/DNS/IP policy к переходам.", en: "Stays on one origin and applies SSRF and DNS/IP policy to navigation." },
      { ru: "Учитывает robots.txt и читает карты сайта, включая списки дочерних карт, в пределах лимитов обхода.", en: "Respects robots.txt and reads sitemaps, including child sitemap indexes, within crawl limits." },
    ],
    limitations: [
      { ru: "Лимит — 100 HTML-страниц; это не доказательство полного покрытия сайта.", en: "The limit is 100 HTML pages; this does not prove complete site coverage." },
      { ru: "Не исполняет JavaScript, не отправляет формы и не открывает страницы, требующие входа. Адреса с параметрами запроса исключаются из обхода.", en: "Does not execute JavaScript, submit forms, or access pages requiring sign-in. Query-string URLs are excluded from the crawl." },
    ],
    useCases: [
      { ru: "Получить ограниченную техническую выборку небольшого публичного сайта.", en: "Collect a bounded technical sample of a small public site." },
      { ru: "Зафиксировать состояние доступных страниц перед изменением шаблона.", en: "Record the state of reachable pages before a template change." },
      { ru: "Использовать один результат для проверки повторов и кандидатов без ссылок.", en: "Use one result to review duplicates and unlinked candidates." },
    ],
    technicalNotes: [
      { ru: "Запуск привязан к сессии и owned project; browser не передаёт произвольный origin обходчику.", en: "A run is bound to the session and owned project; the browser does not provide an arbitrary crawl origin." },
      { ru: "Результат хранится как ограниченный versioned DTO; ошибки отдельных страниц не подменяются успешными данными.", en: "Results are stored as a bounded, versioned DTO; individual page failures are not replaced with successful data." },
    ],
    faq: [
      { question: { ru: "Как запустить проверку нескольких страниц сайта?", en: "How do I check several pages of a site?" }, answer: { ru: "Войдите в кабинет, добавьте сайт в проект и запустите аудит проекта. WebDiag найдёт доступные страницы по ссылкам и картам сайта и проверит их в пределах установленного лимита. В текущей настройке — до 100 страниц за запуск.", en: "Sign in, add the site to a project, and start a project audit. WebDiag discovers pages through links and sitemaps and checks them within the configured limit. The current setting allows up to 100 pages per run." } },
      { question: { ru: "Почему проверено меньше страниц, чем есть на сайте?", en: "Why were fewer pages checked than my site contains?" }, answer: { ru: "Проверьте ограничения обхода и пояснения в отчёте: страницы могут быть недоступны, закрыты правилами robots.txt или не попасть в лимит. Страницы с параметрами адреса и содержимое, создаваемое JavaScript, не обходятся. Неполный результат не означает, что остальные страницы исправны.", en: "Review crawl limits and report explanations: pages may be unreachable, blocked by robots.txt, or outside the limit. Query-string pages and JavaScript-created content are not crawled. An incomplete result does not mean the remaining pages are issue-free." } }
    ],
    relatedToolSlugs: ["duplicate-meta-checker", "orphan-page-finder", "single-page-audit"],
    sourceUrls: ["https://developers.google.com/search/docs/crawling-indexing/robots/intro", "https://www.sitemaps.org/protocol.html"],
  }),

  toolPage({
    slug: "duplicate-meta-checker",
    lastReviewedAt: "2026-10-22",
    reviewDueAt: "2027-04-22",
    seoTitle: { ru: "Повторяющиеся title и description в обходе", en: "Duplicate Titles and Descriptions in a Crawl" },
    metaDescription: { ru: "Найдите одинаковые непустые title и description в выборке до 100 HTML-страниц одного авторизованного обхода проекта без заявления о проверке всего сайта.", en: "Find identical non-empty titles and descriptions within a sample of up to 100 HTML pages from one authenticated project crawl without claiming a full-site check." },
    h1: { ru: "Повторы title и description", en: "Duplicate Titles and Descriptions" },
    lead: { ru: "Представление группирует одинаковые непустые title и meta description среди страниц, фактически полученных одним ограниченным обходом проекта. URL вне выборки в вывод не попадают.", en: "This view groups identical non-empty titles and meta descriptions among pages actually fetched by one bounded project crawl. URLs outside the sample are not represented." },
    quickFacts: [
      { ru: "Один результат обхода", en: "One crawl result" },
      { ru: "Title + description", en: "Title + description" },
      { ru: "До 100 HTML-страниц", en: "Up to 100 HTML pages" },
    ],
    howToSteps: [
      { ru: "Откройте авторизованный проект и запустите ограниченный обход.", en: "Open an authenticated project and run a bounded crawl." },
      { ru: "Дождитесь сохранённого результата и откройте группы повторов.", en: "Wait for the stored result and open the duplicate groups." },
      { ru: "Проверьте смысл каждой группы вручную: одинаковые метаданные не всегда являются дефектом.", en: "Review the intent of each group manually: identical metadata is not always a defect." },
    ],
    supportedFeatures: [
      { ru: "Отдельно группирует точные совпадения непустых title и description.", en: "Groups exact matches of non-empty titles and descriptions separately." },
      { ru: "Показывает URL из сохранённого результата без повторного сетевого запроса.", en: "Shows URLs from the stored result without making another network request." },
      { ru: "Использует тот же ownership-protected результат, что и обзор обхода проекта.", en: "Uses the same ownership-protected result as the project crawl overview." },
    ],
    limitations: [
      { ru: "Сравнение ограничено полученной выборкой до 100 HTML-страниц и не охватывает неизвестные URL.", en: "Comparison is limited to the fetched sample of up to 100 HTML pages and does not cover unknown URLs." },
      { ru: "Инструмент не определяет поисковый intent и не решает, когда повтор допустим.", en: "The tool does not determine search intent or decide when a duplicate is acceptable." },
    ],
    useCases: [
      { ru: "Найти шаблонные title в полученной выборке категорий или услуг.", en: "Find template-level title duplication in the fetched category or service sample." },
      { ru: "Проверить повторяющиеся descriptions после изменения CMS-шаблона.", en: "Review repeated descriptions after a CMS template change." },
      { ru: "Подготовить список URL для ручной редакционной проверки.", en: "Prepare a URL list for manual editorial review." },
    ],
    technicalNotes: [
      { ru: "Группировка выполняется по точному сохранённому тексту; семантическое сходство и AI-классификация не используются.", en: "Grouping uses exact stored text; semantic similarity and AI classification are not used." },
      { ru: "Пустые значения не считаются группой повторов и должны оцениваться как отдельная проблема наличия метаданных.", en: "Empty values are not duplicate groups and should be reviewed separately as missing metadata." },
    ],
    faq: [
      { question: { ru: "Как найти одинаковые заголовки и описания на сайте?", en: "How can I find repeated titles and descriptions across my site?" }, answer: { ru: "Запустите аудит проекта и откройте список повторов. В нём собраны проверенные страницы с одинаковыми значениями Title или Description. Используйте адреса из каждой группы, чтобы проверить шаблон и назначение этих страниц.", en: "Run a project audit and open the duplicate report. It groups checked pages with matching Title or Description values. Use the listed addresses to inspect the template and purpose of those pages." } },
      { question: { ru: "Нужно ли менять каждый найденный повтор?", en: "Should I change every repeated value?" }, answer: { ru: "Сначала сравните страницы: одинаковые значения могут относиться к дублям, которые следует объединить, или к разным страницам, которым нужны свои описания. Проверка группирует совпадения без учёта регистра, но не определяет смысловую похожесть текста и не охватывает непроверенные страницы.", en: "Compare the pages first. They may be duplicates to consolidate or distinct pages needing their own descriptions. The check groups case-insensitive matches; it does not measure semantic similarity or cover unchecked pages." } }
    ],
    relatedToolSlugs: ["whole-site-audit", "meta-tags-checker", "orphan-page-finder"],
    sourceUrls: ["https://developers.google.com/search/docs/appearance/title-link", "https://developers.google.com/search/docs/appearance/snippet"],
  }),

  toolPage({
    slug: "orphan-page-finder",
    lastReviewedAt: "2026-10-22",
    reviewDueAt: "2027-04-22",
    seoTitle: { ru: "Кандидаты без внутренних ссылок по sitemap", en: "Sitemap URLs Without Discovered Internal Links" },
    metaDescription: { ru: "Сравните URL из карт сайта с внутренними ссылками в выборке до 100 HTML-страниц и получите кандидатов для ручной проверки, а не недоказанный список сирот.", en: "Compare URLs from sitemaps with internal links in a sample of up to 100 HTML pages and get review candidates rather than an unproven orphan list." },
    h1: { ru: "Кандидаты без внутренних ссылок", en: "Unlinked Page Candidates" },
    lead: { ru: "Представление показывает URL из карт сайта, на которые не найдены внутренние ссылки в ограниченной выборке обхода. Это кандидаты для проверки: лимит и неполный link graph не позволяют доказать, что страница является сиротой на всём сайте.", en: "This view shows URLs from sitemaps for which no internal links were found in the bounded crawl sample. These are review candidates: the limit and incomplete link graph cannot prove that a page is orphaned across the full site." },
    quickFacts: [
      { ru: "Sitemap vs links", en: "Sitemap vs links" },
      { ru: "Только кандидаты", en: "Candidates only" },
      { ru: "До 100 HTML-страниц", en: "Up to 100 HTML pages" },
    ],
    howToSteps: [
      { ru: "Убедитесь, что проект использует нужный origin и публичный sitemap urlset.", en: "Confirm that the project uses the intended origin and public sitemaps." },
      { ru: "Запустите ограниченный обход и дождитесь сохранённого результата.", en: "Run the bounded crawl and wait for the stored result." },
      { ru: "Проверьте каждый кандидат по навигации, контекстным ссылкам и более полным данным до изменения сайта.", en: "Review each candidate against navigation, contextual links, and broader evidence before changing the site." },
    ],
    supportedFeatures: [
      { ru: "Сравнивает нормализованные URL карт сайта с обнаруженными внутренними ссылками.", en: "Compares normalized URLs from sitemaps with discovered internal links." },
      { ru: "Остаётся в пределах одного origin и не принимает cross-origin URL за часть проекта.", en: "Stays on one origin and does not treat cross-origin URLs as part of the project." },
      { ru: "Показывает кандидатов из сохранённого обхода вместе с размером sitemap-выборки.", en: "Shows candidates from the stored crawl together with the sitemap sample size." },
    ],
    limitations: [
      { ru: "До 100 HTML-страниц недостаточно для доказательства отсутствия ссылки на всём сайте.", en: "A sample of up to 100 HTML pages cannot prove the absence of a link across the full site." },
      { ru: "При неполном обходе или неполных данных карт сайта кандидаты не показываются: отсутствие ссылки нельзя подтвердить.", en: "Candidates are withheld when the crawl or sitemap data are incomplete, because missing links cannot be established." },
    ],
    useCases: [
      { ru: "Найти URL для ручной проверки внутренней перелинковки.", en: "Find URLs for manual internal-link review." },
      { ru: "Сопоставить небольшую sitemap-выборку с фактически обнаруженными ссылками.", en: "Compare a small sitemap sample with links actually discovered." },
      { ru: "Проверить кандидатов после изменения меню или структуры разделов.", en: "Review candidates after changing navigation or section structure." },
    ],
    technicalNotes: [
      { ru: "Кандидат — это разность URL sitemap и обнаруженного link graph после нормализации в пределах origin.", en: "A candidate is the difference between sitemap URLs and the discovered link graph after same-origin normalization." },
      { ru: "Термин orphan намеренно не используется как подтверждённый статус без полного графа и дополнительных источников.", en: "The term orphan is intentionally not used as a confirmed status without a complete graph and additional evidence." },
    ],
    faq: [
      { question: { ru: "Как найти страницы, на которые забыли поставить ссылки?", en: "How can I find pages missing internal links?" }, answer: { ru: "После аудита проекта откройте это представление. WebDiag сопоставляет адреса из карты сайта с найденными внутренними ссылками. Кандидаты для проверки показываются, когда данные обхода и карты сайта достаточно полные для такого сравнения.", en: "Open this view after a project audit. WebDiag compares sitemap addresses with discovered internal links. It shows review candidates when crawl and sitemap coverage are sufficiently complete for that comparison." } },
      { question: { ru: "Что делать с найденным кандидатом?", en: "What should I do with a candidate page?" }, answer: { ru: "Откройте страницу и решите, нужна ли она посетителям и поиску. Для нужной страницы проверьте ссылки из меню, категорий или связанных материалов. Результат относится к выполненному обходу: он не доказывает отсутствие ссылки в любой части сайта.", en: "Open it and decide whether visitors and search engines need it. For a useful page, review links from navigation, categories, or related content. The result describes the completed crawl; it does not prove no link exists anywhere on the site." } }
    ],
    relatedToolSlugs: ["whole-site-audit", "duplicate-meta-checker", "sitemap-validator"],
    sourceUrls: ["https://www.sitemaps.org/protocol.html", "https://developers.google.com/search/docs/crawling-indexing/links-crawlable"],
  }),

  toolPage({
    slug: "single-page-audit",
    seoTitle: { ru: "Технический аудит одной страницы сайта", en: "Single Page Technical Audit" },
    metaDescription: { ru: "Проверьте один публичный URL: HTTP, редиректы, метаданные, indexability, JSON-LD, security headers, robots.txt и sitemap.xml с порядком исправлений.", en: "Audit one public URL for HTTP, redirects, metadata, indexability, JSON-LD, security headers, robots.txt, and sitemap.xml with a clear fix order." },
    h1: { ru: "Технический аудит страницы", en: "Single Page Technical Audit" },
    lead: { ru: "Проверьте одну публичную страницу и получите список технических и SEO-проблем с рекомендациями в порядке приоритета. В отчёт входят доступные данные robots.txt, карты сайта и измерения Google PageSpeed при ответе сервиса.", en: "Check one public page for technical and SEO issues and get recommendations in priority order. The report includes available robots.txt and sitemap data, plus Google PageSpeed measurements when the service responds." },
    quickFacts: [
      { ru: "22 группы проверок", en: "22 check groups" },
      { ru: "Один URL без обхода", en: "One URL without crawling" },
      { ru: "Проверенные данные и ограничения", en: "Observed data and limits" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP(S) URL конкретной страницы.", en: "Enter the public HTTP(S) URL of one page." },
      { ru: "Дождитесь загрузки страницы и доступных результатов проверки.", en: "Wait for the page fetch and available check results." },
      { ru: "Исправляйте проблемы в порядке P0-P3 и повторите аудит после изменений.", en: "Fix issues in P0-P3 order and rerun the audit after changes." },
    ],
    supportedFeatures: [
      { ru: "HTTP status, redirect chain и HTML content type.", en: "HTTP status, redirect chain, and HTML content type." },
      { ru: "Title, description, H1, canonical, robots meta, Open Graph и JSON-LD.", en: "Title, description, H1, canonical, robots meta, Open Graph, and JSON-LD." },
      { ru: "Security headers, robots.txt и discovery одного sitemap.xml.", en: "Security headers, robots.txt, and discovery of one sitemap.xml." },
    ],
    limitations: [
      { ru: "Собственный разбор HTML не исполняет JavaScript. Измерения скорости поступают отдельно из Google PageSpeed и могут быть недоступны.", en: "The HTML analysis does not execute JavaScript. Performance measurements come separately from Google PageSpeed and may be unavailable." },
      { ru: "Проверяется один URL; ссылки и страницы из sitemap не обходятся.", en: "Only one URL is audited; links and sitemap pages are not crawled." },
    ],
    useCases: [
      { ru: "Проверить страницу перед публикацией или после релиза.", en: "Review a page before publishing or after a release." },
      { ru: "Получить единый порядок исправления технических проблем.", en: "Get one ordered list of technical fixes." },
      { ru: "Сравнить повторный результат после исправлений вручную.", en: "Manually compare a rerun after fixes." },
    ],
    technicalNotes: [
      { ru: "Backend валидирует URL, DNS и фактический peer IP на каждом redirect и ограничивает redirects, timeout, compressed и decoded body.", en: "The backend validates the URL, DNS, and connected peer IP at every redirect and bounds redirects, timeouts, compressed bodies, and decoded bodies." },
      { ru: "Публичный frontend получает checks, issues, affected URLs и рекомендации без raw evidence, response headers и внутренних metadata.", en: "The public frontend receives checks, issues, affected URLs, and recommendations without raw evidence, response headers, or internal metadata." },
    ],
    faq: [
      { question: { ru: "С чего начать работу с результатом аудита страницы?", en: "Where should I start with a page audit result?" }, answer: { ru: "Укажите адрес нужной страницы и дождитесь отчёта. Начните со списка проблем в порядке приоритета, затем изучите фактические значения и рекомендации. После исправлений запустите проверку того же адреса ещё раз.", en: "Enter the page address and wait for the report. Start with issues in priority order, then review the observed values and recommendations. Rerun the same address after applying fixes." } },
      { question: { ru: "Высокий балл гарантирует хорошие позиции в поиске?", en: "Does a high score guarantee good search rankings?" }, answer: { ru: "Баллы отражают только выполненные проверки этой страницы. Они не прогнозируют позиции или посещаемость. Недоступные измерения показаны отдельно; для других страниц нужен аудит проекта, а данные Google PageSpeed зависят от ответа этого сервиса.", en: "The score reflects only the checks completed for this page. It does not predict rankings or traffic. Unavailable measurements are marked separately. Use a project audit for other pages; Google PageSpeed data depends on that service's response." } }
    ],
    relatedToolSlugs: ["meta-tags-checker", "indexability-checker", "security-headers-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP", "https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag"],
  }),

  toolPage({
    slug: "javascript-bundle-surface-analyzer",
    seoTitle: { ru: "Анализ JavaScript-бандлов страницы", en: "JavaScript Bundle Surface Analyzer" },
    metaDescription: { ru: "Проверьте bounded static JavaScript delivery surface: script src, status, MIME, Content-Length, compression, cache, redirects и parser-blocking candidates.", en: "Check a bounded static JavaScript delivery surface: script src, status, MIME, Content-Length, compression, cache, redirects, and parser-blocking candidates." },
    h1: { ru: "Анализатор поверхности JavaScript-бандлов", en: "JavaScript Bundle Surface Analyzer" },
    lead: { ru: "Инструмент разбирает static HTML, дедуплицирует внешние script src и безопасно проверяет заголовки ограниченного числа JS-ответов. Он показывает declared transfer bytes, MIME, compression, cache и loading attributes без исполнения JavaScript.", en: "The tool parses static HTML, deduplicates external script src values, and safely checks headers for a bounded number of JavaScript responses. It reports declared transfer bytes, MIME, compression, cache, and loading attributes without executing JavaScript." },
    quickFacts: [
      { ru: "До 24 unique JS assets", en: "Up to 24 unique JS assets" },
      { ru: "Headers-only asset checks", en: "Headers-only asset checks" },
      { ru: "Без исполнения кода", en: "No code execution" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL HTML-страницы.", en: "Paste a public HTML page URL." },
      { ru: "WebDiag найдёт external script src и проверит bounded set ответов через SafeHttpFetcher.", en: "WebDiag discovers external script src values and checks a bounded response set through SafeHttpFetcher." },
      { ru: "Сравните unique scripts, declared bytes, parser-blocking candidates, compression, cache и failed assets.", en: "Review unique scripts, declared bytes, parser-blocking candidates, compression, cache, and failed assets." },
    ],
    supportedFeatures: [
      { ru: "Дедупликация script src и разделение module/classic.", en: "Script-src deduplication and module/classic separation." },
      { ru: "Проверка status, final URL, MIME, Content-Length, Content-Encoding, Cache-Control и redirects.", en: "Checks status, final URL, MIME, Content-Length, Content-Encoding, Cache-Control, and redirects." },
      { ru: "Heuristic findings для большого asset surface и classic parser-blocking candidates без fake score.", en: "Heuristic findings for a large asset surface and classic parser-blocking candidates without a fake score." },
    ],
    limitations: [
      { ru: "Инструмент не исполняет JavaScript и не видит dynamic imports, runtime-injected scripts, code coverage или main-thread cost.", en: "The tool does not execute JavaScript and cannot see dynamic imports, runtime-injected scripts, code coverage, or main-thread cost." },
      { ru: "Content-Length может отражать encoded transfer size и не равен parse/compile/execute cost.", en: "Content-Length can represent encoded transfer size and is not parse, compile, or execution cost." },
    ],
    useCases: [
      { ru: "Проверить рост числа bundles после релиза.", en: "Review bundle-count growth after a release." },
      { ru: "Найти failed, duplicated или MIME-mismatched script responses.", en: "Find failed, duplicated, or MIME-mismatched script responses." },
      { ru: "Проверить compression и long-cache signals у внешних JS assets.", en: "Review compression and long-cache signals for external JavaScript assets." },
    ],
    technicalNotes: [
      { ru: "HTML загружается bounded GET, а найденные JS assets проверяются headers-only GET через тот же SSRF-safe fetcher.", en: "HTML uses a bounded GET, while discovered JavaScript assets use headers-only GET requests through the same SSRF-safe fetcher." },
      { ru: "Private/local targets, unsafe redirects и DNS rebinding paths блокируются для каждого вложенного URL.", en: "Private/local targets, unsafe redirects, and DNS-rebinding paths are blocked for every nested URL." },
    ],
    faq: [
      { question: { ru: "Что можно узнать о JavaScript на опубликованной странице?", en: "What can I learn about JavaScript on a published page?" }, answer: { ru: "Введите адрес страницы. Инструмент найдёт подключённые в HTML скрипты и покажет доступные сведения об их передаче. Это помогает выбрать файлы, которые стоит проверить при разборе медленной загрузки.", en: "Enter the page address. The tool finds scripts referenced in HTML and shows available delivery information. This helps select files to investigate when troubleshooting slow loading." } },
      { question: { ru: "Покажет ли отчёт неиспользуемые функции внутри скрипта?", en: "Will the report identify unused functions inside a script?" }, answer: { ru: "Внутренний состав сборки здесь не разбирается и JavaScript не выполняется. Чтобы найти ненужные модули, используйте отчёт сборщика проекта. Для измерения загрузки в браузере дополнительно запустите проверку скорости страницы.", en: "The tool does not analyse a build's internal modules or execute JavaScript. Use your project's bundler report to find unnecessary modules. Run the page speed check for browser loading measurements." } }
    ],
    relatedToolSlugs: ["third-party-script-analyzer", "resource-hints-analyzer", "page-weight-analyzer"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTML/Element/script", "https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Encoding"],
  }),
  toolPage({
    slug: "css-delivery-analyzer",
    seoTitle: { ru: "Анализ доставки CSS", en: "CSS Delivery Analyzer" },
    metaDescription: { ru: "Проверьте external и inline CSS: bounded decoded sample, @import, @font-face, MIME, compression, cache, media и duplicate stylesheet links.", en: "Check external and inline CSS: bounded decoded samples, @import, @font-face, MIME, compression, cache, media, and duplicate stylesheet links." },
    h1: { ru: "Анализатор доставки CSS", en: "CSS Delivery Analyzer" },
    lead: { ru: "Инструмент разбирает stylesheet links и inline style blocks, безопасно загружает ограниченный набор CSS и показывает decoded sample, @import, @font-face, MIME, compression, cache и delivery errors.", en: "The tool parses stylesheet links and inline style blocks, safely fetches a bounded CSS set, and reports decoded samples, @import, @font-face, MIME, compression, cache, and delivery errors." },
    quickFacts: [
      { ru: "До 16 unique stylesheets", en: "Up to 16 unique stylesheets" },
      { ru: "External + inline CSS", en: "External + inline CSS" },
      { ru: "Без unused-CSS claims", en: "No unused-CSS claims" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL HTML-страницы.", en: "Paste a public HTML page URL." },
      { ru: "WebDiag найдёт stylesheet links, inline style blocks и загрузит bounded CSS sample.", en: "WebDiag discovers stylesheet links and inline style blocks, then fetches a bounded CSS sample." },
      { ru: "Проверьте duplicate links, @import chains, decoded bytes, MIME, compression и failed stylesheets.", en: "Review duplicate links, @import chains, decoded bytes, MIME, compression, and failed stylesheets." },
    ],
    supportedFeatures: [
      { ru: "Same-host/cross-host inventory и media/alternate/disabled signals.", en: "Same-host/cross-host inventory and media/alternate/disabled signals." },
      { ru: "Подсчёт inline bytes, sampled decoded bytes, @import и @font-face.", en: "Counts inline bytes, sampled decoded bytes, @import, and @font-face." },
      { ru: "Проверка response status, text/css MIME, Content-Encoding, Cache-Control и redirects.", en: "Checks response status, text/css MIME, Content-Encoding, Cache-Control, and redirects." },
    ],
    limitations: [
      { ru: "Статический анализ не определяет unused CSS, actual cascade, critical CSS coverage или реальный render-blocking impact.", en: "Static analysis cannot determine unused CSS, the actual cascade, critical-CSS coverage, or real render-blocking impact." },
      { ru: "Вложенные @import URL считаются, но не обходятся рекурсивно.", en: "Nested @import URLs are counted but not recursively crawled." },
    ],
    useCases: [
      { ru: "Найти duplicate stylesheet requests и MIME errors.", en: "Find duplicate stylesheet requests and MIME errors." },
      { ru: "Проверить наличие @import discovery chains.", en: "Check for @import discovery chains." },
      { ru: "Оценить bounded decoded CSS surface после релиза.", en: "Review the bounded decoded CSS surface after a release." },
    ],
    technicalNotes: [
      { ru: "Каждый CSS URL повторно проходит public-target policy и bounded decoded-body limit.", en: "Every CSS URL is revalidated by the public-target policy and bounded decoded-body limit." },
      { ru: "Размер sample не является browser transfer waterfall или unused-CSS measurement.", en: "The sampled size is not a browser transfer waterfall or an unused-CSS measurement." },
    ],
    faq: [
      { question: { ru: "Как понять, какие файлы стилей проверить в первую очередь?", en: "Which stylesheets should I investigate first?" }, answer: { ru: "Укажите адрес страницы и изучите найденные подключения CSS, параметры загрузки и замечания. Начните с отмеченных файлов и цепочек подключения. Результат показывает сведения из HTML и доступных ресурсов, а не время отрисовки в браузере.", en: "Enter the page address and review detected CSS links, loading settings, and findings. Start with flagged files and loading chains. The result describes HTML and accessible resources rather than browser rendering time." } },
      { question: { ru: "Нужно ли сразу удалять CSS, отмеченный в отчёте?", en: "Should I immediately remove CSS flagged in the report?" }, answer: { ru: "Сначала выясните, где используются его стили. Файл может быть необходим для части страницы или другого размера экрана. Инструмент не определяет все использованные правила, поэтому проверяйте изменения на копии сайта.", en: "First determine where its styles are needed. A file may be required for part of the page or another screen size. The tool does not identify every used rule, so test changes on a copy of the site." } }
    ],
    relatedToolSlugs: ["resource-hints-analyzer", "font-performance-checker", "page-weight-analyzer"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTML/Element/link", "https://developer.mozilla.org/docs/Web/CSS/@import"],
  }),
  toolPage({
    slug: "font-performance-checker",
    seoTitle: { ru: "Анализ загрузки веб-шрифтов", en: "Font Loading Analyzer" },
    metaDescription: { ru: "Проверьте static @font-face, font-display, font sources и formats, preload correlation, Content-Length, cache headers и font response status.", en: "Check static @font-face rules, font-display, font sources and formats, preload correlation, Content-Length, cache headers, and font response status." },
    h1: { ru: "Анализатор загрузки веб-шрифтов", en: "Font Loading Analyzer" },
    lead: { ru: "WebDiag разбирает inline и bounded external CSS, собирает @font-face и font URLs, сопоставляет font preloads и безопасно проверяет ограниченный набор font response headers.", en: "WebDiag parses inline and bounded external CSS, collects @font-face rules and font URLs, correlates font preloads, and safely checks a bounded set of font response headers." },
    quickFacts: [
      { ru: "@font-face inventory", en: "@font-face inventory" },
      { ru: "Preload correlation", en: "Preload correlation" },
      { ru: "До 24 font assets", en: "Up to 24 font assets" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag проверит inline CSS и до 12 external stylesheets на @font-face.", en: "WebDiag checks inline CSS and up to 12 external stylesheets for @font-face rules." },
      { ru: "Проверьте font-display, families, sources, WOFF2 signals, matched preloads, bytes и cache headers.", en: "Review font-display, families, sources, WOFF2 signals, matched preloads, bytes, and cache headers." },
    ],
    supportedFeatures: [
      { ru: "Разбор family, style, weight, font-display, local() и URL sources.", en: "Parses family, style, weight, font-display, local(), and URL sources." },
      { ru: "Сопоставление link rel=preload as=font с найденными @font-face URL.", en: "Correlates link rel=preload as=font with discovered @font-face URLs." },
      { ru: "Проверка font MIME, Content-Length, cache policy, redirects и public-target safety.", en: "Checks font MIME, Content-Length, cache policy, redirects, and public-target safety." },
    ],
    limitations: [
      { ru: "Инструмент не выполняет CSS cascade и не знает, какой font face реально выбрал браузер для текста.", en: "The tool does not execute the CSS cascade and cannot know which font face the browser actually selected for text." },
      { ru: "FOIT/FOUT, layout shift и timing требуют browser runtime или field data.", en: "FOIT/FOUT, layout shift, and timing require browser runtime or field data." },
    ],
    useCases: [
      { ru: "Найти @font-face без явного font-display.", en: "Find @font-face rules without an explicit font-display." },
      { ru: "Найти preload URL, которые не совпадают с static CSS sources.", en: "Find preload URLs that do not match static CSS sources." },
      { ru: "Проверить количество families/weights и known declared font bytes.", en: "Review family/weight counts and known declared font bytes." },
    ],
    technicalNotes: [
      { ru: "CSS parser bounded и не выполняет JavaScript-generated stylesheets или runtime CSSOM.", en: "The CSS parser is bounded and does not execute JavaScript-generated stylesheets or the runtime CSSOM." },
      { ru: "Не все fonts нужно preload: инструмент проверяет согласованность существующих preload, а не требует preload для каждого файла.", en: "Not every font should be preloaded: the tool checks consistency of existing preloads rather than requiring a preload for every file." },
    ],
    faq: [
      { question: { ru: "Что проверка покажет о загрузке шрифтов?", en: "What does the font loading check show?" }, answer: { ru: "Введите адрес страницы. Отчёт покажет найденные подключения и настройки шрифтов, включая указания браузеру на способ их отображения. Используйте замечания, чтобы выбрать настройки для проверки вместе с разработчиком.", en: "Enter a page address. The report shows detected font references and settings, including instructions controlling how fonts are displayed. Use the findings to choose settings to review with a developer." } },
      { question: { ru: "Стоит ли заранее загружать все шрифты сайта?", en: "Should I preload every font on my site?" }, answer: { ru: "Предварительная загрузка нужна только тем файлам, которые действительно важны в начале показа страницы. Лишние загрузки могут конкурировать с изображениями и другими ресурсами. Сначала измерьте страницу, затем сравните результат после изменения.", en: "Preload only files that are genuinely important for the initial page display. Unnecessary loads can compete with images and other resources. Measure the page first, then compare it after making changes." } }
    ],
    relatedToolSlugs: ["css-delivery-analyzer", "resource-hints-analyzer", "cache-policy-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/@font-face", "https://developer.mozilla.org/docs/Web/CSS/@font-face/font-display"],
  }),

  toolPage({
    slug: "core-web-vitals-checker",
    seoTitle: { ru: "Проверка Core Web Vitals и PageSpeed", en: "Core Web Vitals and PageSpeed Checker" },
    metaDescription: { ru: "Проверьте Core Web Vitals, lab и field data, четыре категории Lighthouse и порядок исправлений через Google PageSpeed API.", en: "Check Core Web Vitals, lab and field data, four Lighthouse categories, and a fix order through the Google PageSpeed API." },
    h1: { ru: "Проверка Core Web Vitals", en: "Core Web Vitals Checker" },
    lead: { ru: "Запустите mobile, desktop или обе стратегии PageSpeed, чтобы увидеть Core Web Vitals, оценки Performance, Accessibility, Best Practices и SEO, а также приоритетные проверки для исправления.", en: "Run mobile, desktop, or both PageSpeed strategies to review Core Web Vitals, Performance, Accessibility, Best Practices, and SEO scores, plus prioritized checks to fix." },
    quickFacts: [
      { ru: "Google PageSpeed API", en: "Google PageSpeed API" },
      { ru: "Mobile/Desktop", en: "Mobile/Desktop" },
      { ru: "Lab + Field data", en: "Lab + Field data" },
      { ru: "4 категории Lighthouse", en: "4 Lighthouse categories" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Выберите mobile, desktop или обе стратегии.", en: "Choose mobile, desktop, or both strategies." },
      { ru: "Проверьте оценки категорий, lab metrics, field data и порядок исправления проверок.", en: "Review category scores, lab metrics, field data, and the ordered checks to fix." },
    ],
    supportedFeatures: [
      { ru: "Backend-интеграция с Google PageSpeed API через env GOOGLE_PAGESPEED_API_KEY.", en: "Backend Google PageSpeed API integration through GOOGLE_PAGESPEED_API_KEY env." },
      { ru: "Разделяет Lighthouse lab metrics и Chrome UX field data, если field data доступна.", en: "Separates Lighthouse lab metrics from Chrome UX field data when field data is available." },
      { ru: "Показывает оценки четырёх категорий и до 20 failed или partial проверок из их auditRefs.", en: "Shows four category scores and up to 20 failed or partial checks from their auditRefs." },
      { ru: "Graceful unavailable state: отсутствие ключа или ошибка провайдера не превращается в fake score.", en: "Graceful unavailable state: missing key or provider errors never become a fake score." },
    ],
    limitations: [
      { ru: "PageSpeed проверяет только публично доступные URL и не работает для закрытого localhost/staging без отдельной инфраструктуры.", en: "PageSpeed checks only publicly accessible URLs and does not work for private localhost/staging without separate infrastructure." },
      { ru: "Результат зависит от Google API, лимитов, региона и доступности field data.", en: "The result depends on Google API, quotas, region, and field data availability." },
      { ru: "Инструмент не отдаёт raw audit details, trace, screenshot или network waterfall.", en: "The tool does not expose raw audit details, traces, screenshots, or a network waterfall." },
    ],
    useCases: [
      { ru: "Оценить релиз landing page перед запуском трафика.", en: "Evaluate a landing page release before driving traffic." },
      { ru: "Понять, какие Lighthouse opportunities дают максимальную экономию.", en: "Identify which Lighthouse opportunities provide the largest savings." },
      { ru: "Разделить lab-проблемы и реальные Core Web Vitals field signals.", en: "Separate lab issues from real Core Web Vitals field signals." },
    ],
    technicalNotes: [
      { ru: "Frontend не вызывает Google напрямую: запрос идёт через WebDiag backend и нормализованный DTO.", en: "The frontend does not call Google directly: requests go through the WebDiag backend and normalized DTO." },
      { ru: "Тесты используют mocked provider response; реальные external calls не выполняются в test suite.", en: "Tests use mocked provider responses; real external calls do not run in the test suite." },
    ],
    faq: [
      { question: { ru: "Почему оценка скорости меняется при повторной проверке?", en: "Why does the speed score change between checks?" }, answer: { ru: "Измерение зависит от ответа сайта, выбранного устройства и условий запуска Google PageSpeed. Сравнивайте несколько запусков с одинаковой стратегией. Результат одного измерения не описывает опыт каждого посетителя.", en: "Measurements depend on the site's response, selected device, and Google PageSpeed test conditions. Compare several runs using the same strategy. One measurement does not represent every visitor's experience." } },
      { question: { ru: "Почему нет данных реальных пользователей или всего результата?", en: "Why are real-user data or the entire result missing?" }, answer: { ru: "Пользовательские данные доступны не для каждого адреса: Google должен располагать достаточной выборкой. Если сам PageSpeed не ответил или измерение недоступно, WebDiag показывает это отдельно. Попробуйте позже; отсутствующее значение не считается успешной проверкой.", en: "Real-user data are not available for every address because Google needs a sufficient sample. If PageSpeed does not respond or a measurement is unavailable, WebDiag marks it separately. Try again later; missing data are not treated as a pass." } }
    ],
    relatedToolSlugs: ["page-weight-analyzer", "cache-policy-checker", "image-optimizer"],
    sourceUrls: ["https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed", "https://web.dev/vitals/"],
  }),
  toolPage({
    slug: "cache-policy-checker",
    seoTitle: { ru: "Проверка HTTP-кэширования", en: "HTTP Cache Policy Checker" },
    metaDescription: { ru: "Проверьте Cache-Control, ETag, Last-Modified, Expires, Vary и рекомендации для browser/CDN cache.", en: "Check Cache-Control, ETag, Last-Modified, Expires, Vary, and browser/CDN cache recommendations." },
    h1: { ru: "Проверка HTTP-кэширования", en: "HTTP Cache Policy Checker" },
    lead: { ru: "Введите URL страницы или статического ресурса, чтобы проверить явность cache policy, validators, Vary и соответствие правилам для HTML или hashed static assets.", en: "Enter a page or static asset URL to check explicit cache policy, validators, Vary, and whether the rules fit HTML or hashed static assets." },
    quickFacts: [
      { ru: "Cache-Control", en: "Cache-Control" },
      { ru: "ETag / Last-Modified", en: "ETag / Last-Modified" },
      { ru: "CDN/browser cache", en: "CDN/browser cache" },
    ],
    howToSteps: [
      { ru: "Вставьте URL HTML, CSS, JS, изображения или шрифта.", en: "Paste an HTML, CSS, JS, image, or font URL." },
      { ru: "Запустите проверку заголовков без скачивания тела ответа.", en: "Run the header check without downloading the response body." },
      { ru: "Проверьте score, cache directives, validators и Vary policy.", en: "Review score, cache directives, validators, and Vary policy." },
    ],
    supportedFeatures: [
      { ru: "Определяет static asset по URL/content-type и применяет другой стандарт оценки, чем для HTML.", en: "Detects static assets by URL/content-type and applies a different evaluation standard than for HTML." },
      { ru: "Проверяет Cache-Control, validators, Expires fallback и Vary: Accept-Encoding.", en: "Checks Cache-Control, validators, Expires fallback, and Vary: Accept-Encoding." },
      { ru: "Работает через SafeHttpFetcher с SSRF-защитой и read_body=false.", en: "Runs through SafeHttpFetcher with SSRF protection and read_body=false." },
    ],
    limitations: [
      { ru: "Инструмент не знает вашу CDN purge policy и не доказывает корректность персонализации.", en: "The tool does not know your CDN purge policy and cannot prove personalization safety." },
      { ru: "Для runtime cache waterfall нужен browser/PageSpeed слой.", en: "Runtime cache waterfall requires the browser/PageSpeed layer." },
    ],
    useCases: [
      { ru: "Проверить, что hashed CSS/JS/шрифты кэшируются долго и immutable.", en: "Verify that hashed CSS/JS/fonts use long-lived immutable caching." },
      { ru: "Найти HTML с опасным long public cache.", en: "Find HTML with risky long public caching." },
      { ru: "Проверить, есть ли validators для revalidation.", en: "Check whether validators exist for revalidation." },
    ],
    technicalNotes: [
      { ru: "Тело финального ответа не скачивается; используются status, final URL и headers.", en: "The final response body is not downloaded; status, final URL, and headers are used." },
      { ru: "Static asset heuristics учитывает расширение URL и content-type.", en: "Static asset heuristics use both URL extension and content-type." },
    ],
    faq: [
      { question: { ru: "Что можно узнать о кешировании страницы или файла?", en: "What can I learn about a page or file's caching?" }, answer: { ru: "Укажите его адрес. Инструмент прочитает настройки ответа, которые определяют хранение копий браузером и промежуточными сервисами. Сверьте замечания с назначением ресурса: для страницы и неизменяемого файла стилей правила могут различаться.", en: "Enter its address. The tool reads response settings controlling copies stored by browsers and intermediaries. Review findings in context: a page and an unchanging stylesheet may need different rules." } },
      { question: { ru: "Можно ли поставить большой срок хранения для всех ресурсов?", en: "Can I set a long cache lifetime for every resource?" }, answer: { ru: "Не применяйте один срок ко всему сайту. Изменяемые страницы и личные данные требуют отдельных правил. Долгое хранение обычно удобнее для файлов с версией в имени; проверьте, как посетители получат обновление после выпуска новой версии сайта.", en: "Do not apply one lifetime to the whole site. Changing pages and personal data need their own rules. Long lifetimes are often more suitable for versioned filenames; check how visitors will receive updates after a site release." } }
    ],
    relatedToolSlugs: ["core-web-vitals-checker", "page-weight-analyzer", "security-headers-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control", "https://developer.mozilla.org/docs/Web/HTTP/Headers/Vary"],
  }),
  toolPage({
    slug: "page-weight-analyzer",
    seoTitle: { ru: "Анализ веса страницы и ресурсов", en: "Page Weight and Resource Summary Analyzer" },
    metaDescription: { ru: "Проверьте статический вес HTML-страницы, найденные ресурсы, Content-Length, тяжёлые assets и JPEG/PNG vs AVIF/WebP сигналы.", en: "Check static HTML page weight, discovered resources, Content-Length, heavy assets, and JPEG/PNG vs AVIF/WebP signals." },
    h1: { ru: "Анализ веса страницы", en: "Page Weight Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы получить bounded static HTML scan: размер HTML, найденные img/script/link/source ресурсы, известный вес, тяжёлые файлы и сигналы по современным форматам изображений.", en: "Enter a page URL to get a bounded static HTML scan: HTML size, discovered img/script/link/source resources, known weight, heavy files, and modern image format signals." },
    quickFacts: [
      { ru: "Static HTML scan", en: "Static HTML scan" },
      { ru: "Resource bytes", en: "Resource bytes" },
      { ru: "AVIF/WebP signals", en: "AVIF/WebP signals" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag загрузит HTML и безопасно проверит до 40 найденных статических ресурсов.", en: "WebDiag loads HTML and safely inspects up to 40 discovered static resources." },
      { ru: "Проверьте known bytes, unknown sizes, legacy images и самые тяжёлые assets.", en: "Review known bytes, unknown sizes, legacy images, and largest assets." },
    ],
    supportedFeatures: [
      { ru: "Ищет img/srcset/source/script/link/preload/icon/poster ресурсы в HTML.", en: "Finds img/srcset/source/script/link/preload/icon/poster resources in HTML." },
      { ru: "Определяет ресурсные типы и modern image signals по content-type/URL.", en: "Detects resource types and modern image signals by content-type/URL." },
      { ru: "Показывает bounded scan mode, чтобы не выдавать static scan за полный браузерный waterfall.", en: "Shows bounded scan mode so a static scan is not misrepresented as a full browser waterfall." },
    ],
    limitations: [
      { ru: "Не исполняет JavaScript и не видит runtime/background-image ресурсы из CSS.", en: "Does not execute JavaScript and does not see runtime/background-image resources from CSS." },
      { ru: "LCP image и фактический transfer size требуют PageSpeed или browser waterfall.", en: "LCP image and actual transfer size require PageSpeed or browser waterfall." },
    ],
    useCases: [
      { ru: "Быстро найти тяжёлые JPEG/PNG и JS/CSS assets до полноценного Lighthouse анализа.", en: "Quickly find heavy JPEG/PNG and JS/CSS assets before a full Lighthouse analysis." },
      { ru: "Проверить, используются ли AVIF/WebP варианты для найденных изображений.", en: "Check whether AVIF/WebP variants are used for discovered images." },
      { ru: "Оценить базовый вес страницы после релиза или смены темы.", en: "Evaluate baseline page weight after a release or theme change." },
    ],
    technicalNotes: [
      { ru: "HTML body ограничен лимитом SafeHttpFetcher; ресурсы проверяются read_body=false по headers.", en: "HTML body is capped by SafeHttpFetcher; resources are checked with read_body=false headers." },
      { ru: "Инструмент не заменяет Core Web Vitals checker, а закрывает быстрый resource summary слой.", en: "The tool does not replace the Core Web Vitals checker; it covers the fast resource summary layer." },
    ],
    faq: [
      { question: { ru: "Почему вес в отчёте отличается от браузера?", en: "Why does the reported page weight differ from my browser?" }, answer: { ru: "Инструмент оценивает доступные сведения о странице и найденных ресурсах без исполнения JavaScript. Браузер может загрузить дополнительные файлы или использовать кеш. Неизвестные размеры и неполная выборка ограничивают итог отчёта.", en: "The tool estimates available page and resource data without running JavaScript. A browser may load additional files or use its cache. Unknown sizes and incomplete coverage limit the report's total." } },
      { question: { ru: "Какие файлы лучше уменьшать сначала?", en: "Which files should I reduce first?" }, answer: { ru: "Начните с самых крупных ресурсов, перечисленных в результате, и проверьте, нужны ли они в таком размере. Для изображений сравните размеры, формат и качество. После замены измерьте загрузку страницы, чтобы проверить фактический эффект.", en: "Start with the largest listed resources and check whether that size is necessary. For images, compare dimensions, format, and quality. Measure page loading after replacing files to verify the actual effect." } }
    ],
    relatedToolSlugs: ["core-web-vitals-checker", "cache-policy-checker", "image-format-converter"],
    sourceUrls: ["https://web.dev/learn/performance/image-performance", "https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images/"],
  }),

  toolPage({
    slug: "resource-waterfall-analyzer",
    seoTitle: { ru: "Временная шкала загрузки ресурсов", en: "Resource Loading Timeline Analyzer" },
    metaDescription: { ru: "Проверьте до 40 network-requests из Google PageSpeed Lighthouse: тип, начало, длительность и известный размер без raw trace.", en: "Inspect up to 40 Google PageSpeed Lighthouse network requests: type, start, duration, and known size without exposing a raw trace." },
    h1: { ru: "Анализ загрузки ресурсов", en: "Resource Waterfall Analyzer" },
    lead: { ru: "Введите публичный URL, чтобы получить ограниченную временную шкалу network-requests из Google PageSpeed Lighthouse. WebDiag показывает нормализованные строки, а не полный DevTools trace.", en: "Enter a public URL to get a bounded network-requests timeline from Google PageSpeed Lighthouse. WebDiag shows normalized rows, not a full DevTools trace." },
    quickFacts: [{ ru: "До 40 запросов", en: "Up to 40 requests" }, { ru: "Mobile / Desktop", en: "Mobile / Desktop" }, { ru: "Query удаляется", en: "Query strings removed" }],
    howToSteps: [
      { ru: "Вставьте публичный http(s) URL.", en: "Paste a public http(s) URL." },
      { ru: "Выберите mobile или desktop стратегию.", en: "Choose a mobile or desktop strategy." },
      { ru: "Сравните начало, длительность и известный transfer size показанных ресурсов.", en: "Compare start time, duration, and known transfer size for the returned resources." },
    ],
    supportedFeatures: [
      { ru: "Использует audit network-requests из ответа Google PageSpeed Lighthouse.", en: "Uses the network-requests audit from the Google PageSpeed Lighthouse response." },
      { ru: "Показывает не более 40 строк и явно разделяет найденные и возвращённые запросы.", en: "Returns no more than 40 rows and explicitly separates found and returned requests." },
      { ru: "Удаляет userinfo, query и fragment из URL ресурсов.", en: "Removes user info, query strings, and fragments from resource URLs." },
    ],
    limitations: [
      { ru: "Это ограниченная визуализация provider evidence, а не полный Chrome DevTools waterfall или trace.", en: "This is a bounded view of provider evidence, not a complete Chrome DevTools waterfall or trace." },
      { ru: "PageSpeed может не вернуть audit или отдельные размеры; такие поля остаются недоступными.", en: "PageSpeed may omit the audit or individual sizes; those fields remain unavailable." },
      { ru: "Порядок и длительность зависят от конкретного provider run и не являются field data.", en: "Order and duration depend on the specific provider run and are not field data." },
    ],
    useCases: [
      { ru: "Найти поздно стартующие или долгие ресурсы в конкретном Lighthouse run.", en: "Find late-starting or long-running resources in a specific Lighthouse run." },
      { ru: "Сопоставить transfer size и resource type перед более глубоким профилированием.", en: "Compare transfer size and resource type before deeper profiling." },
      { ru: "Проверить mobile и desktop стратегии без передачи PageSpeed API key в браузер.", en: "Check mobile and desktop strategies without exposing the PageSpeed API key to the browser." },
    ],
    technicalNotes: [
      { ru: "Backend сначала валидирует URL, затем вызывает PageSpeed API с server-side key.", en: "The backend validates the URL before calling PageSpeed API with a server-side key." },
      { ru: "Response bodies, request/response headers, cookies, screenshots и trace не входят в контракт.", en: "Response bodies, request/response headers, cookies, screenshots, and traces are excluded from the contract." },
    ],
    faq: [
      { question: { ru: "Как читать временную шкалу загрузки ресурсов?", en: "How do I read the resource loading timeline?" }, answer: { ru: "Смотрите, когда начинается каждый запрос и сколько он длится. Это помогает заметить поздно обнаруженные или долго загружающиеся файлы. Данные поступают из Google PageSpeed, поэтому относятся к конкретному измерению страницы.", en: "Look at when each request starts and how long it lasts. This helps identify files discovered late or taking a long time to load. The data come from Google PageSpeed and describe that particular page measurement." } },
      { question: { ru: "Почему в списке не все запросы страницы?", en: "Why does the list omit some page requests?" }, answer: { ru: "WebDiag показывает не более 40 записей; общее число найденных запросов приводится отдельно. Список может быть недоступен, если Google не вернул нужные данные. Параметры после ? и # в адресах ресурсов скрыты в отчёте.", en: "WebDiag shows up to 40 entries and lists the overall request count separately. The list may be unavailable if Google did not return the required data. Resource address components after ? and # are hidden in the report." } }
    ],
    relatedToolSlugs: ["core-web-vitals-checker", "page-weight-analyzer", "render-blocking-resources-checker"],
    sourceUrls: ["https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed", "https://github.com/GoogleChrome/lighthouse/blob/main/docs/understanding-results.md"],
    lastReviewedAt: "2026-08-14",
    reviewDueAt: "2027-02-14",
  }),

  toolPage({
    slug: "render-blocking-resources-checker",
    seoTitle: { ru: "Проверка блокирующих рендер ресурсов", en: "Render-Blocking Resources Checker" },
    metaDescription: { ru: "Проверьте точный audit render-blocking-resources из Google PageSpeed Lighthouse с оценкой экономии и bounded rows.", en: "Inspect the exact Google PageSpeed Lighthouse render-blocking-resources audit with estimated savings and bounded rows." },
    h1: { ru: "Поиск блокирующих рендер ресурсов", en: "Render-Blocking Resources Checker" },
    lead: { ru: "Введите публичный URL, чтобы проверить точный legacy audit render-blocking-resources из PageSpeed. Если provider не вернул audit, WebDiag показывает unavailable state и не придумывает результат.", en: "Enter a public URL to inspect the exact legacy render-blocking-resources audit from PageSpeed. If the provider omits the audit, WebDiag shows an unavailable state instead of inventing a result." },
    quickFacts: [{ ru: "Точный Lighthouse audit", en: "Exact Lighthouse audit" }, { ru: "До 20 строк", en: "Up to 20 rows" }, { ru: "Без эвристики", en: "No heuristic fallback" }],
    howToSteps: [
      { ru: "Вставьте публичный URL и выберите mobile или desktop.", en: "Paste a public URL and choose mobile or desktop." },
      { ru: "Запустите provider check через WebDiag backend.", en: "Run the provider check through the WebDiag backend." },
      { ru: "Проверьте audit score, provider display value, estimated savings и возвращённые строки.", en: "Review the audit score, provider display value, estimated savings, and returned rows." },
    ],
    supportedFeatures: [
      { ru: "Читает только audit с ID render-blocking-resources и не выводит догадки по CSS/JS.", en: "Reads only the audit with the render-blocking-resources ID and does not infer results from CSS or JavaScript." },
      { ru: "Показывает до 20 нормализованных строк с known bytes и estimated wasted time.", en: "Shows up to 20 normalized rows with known bytes and estimated wasted time." },
      { ru: "Удаляет query и fragment из resource URL перед ответом frontend.", en: "Removes query strings and fragments from resource URLs before responding to the frontend." },
    ],
    limitations: [
      { ru: "Lighthouse развивает Performance Insights и может не вернуть legacy audit в конкретной версии или запуске.", en: "Lighthouse is evolving toward Performance Insights and may omit this legacy audit in a specific version or run." },
      { ru: "Estimated savings — lab estimate provider, а не измеренная экономия после исправления.", en: "Estimated savings are a provider lab estimate, not measured savings after a fix." },
      { ru: "Инструмент не изменяет CSS/JS и не доказывает, что удаление конкретного файла безопасно.", en: "The tool does not modify CSS or JavaScript and cannot prove that removing a specific file is safe." },
    ],
    useCases: [
      { ru: "Проверить наличие provider-confirmed blocking resources перед оптимизацией critical path.", en: "Check for provider-confirmed blocking resources before optimizing the critical path." },
      { ru: "Сравнить mobile и desktop audit для одной страницы.", en: "Compare mobile and desktop audits for one page." },
      { ru: "Зафиксировать unavailable state при смене Lighthouse contract без ложного зелёного результата.", en: "Record an unavailable state when the Lighthouse contract changes without producing a false green result." },
    ],
    technicalNotes: [
      { ru: "Backend принимает только публичный URL, вызывает PageSpeed и возвращает strict DTO.", en: "The backend accepts only a public URL, calls PageSpeed, and returns a strict DTO." },
      { ru: "Отсутствие audit отличается от доступного audit без возвращённых item rows.", en: "A missing audit is distinct from an available audit with no returned item rows." },
    ],
    faq: [
      { question: { ru: "Что означает ресурс, который мешает первому показу страницы?", en: "What is a resource that blocks the initial page display?" }, answer: { ru: "Браузер может ждать загрузки или обработки файла перед отображением содержимого. Инструмент показывает соответствующее измерение Google PageSpeed и найденные ресурсы. Перед изменением убедитесь, что выбранный файл действительно нужен в начале загрузки.", en: "A browser may wait for a file to load or be processed before displaying content. This tool shows the relevant Google PageSpeed measurement and resources. Before changing a file, check whether it is needed during initial loading." } },
      { question: { ru: "Пустой список означает, что задержек нет?", en: "Does an empty list mean nothing delays rendering?" }, answer: { ru: "Сначала посмотрите, доступно ли само измерение. Google может не вернуть его или список файлов для этого запуска. Отсутствие данных отличается от успешного результата и не подтверждает, что ничего не задерживает страницу.", en: "First check whether the measurement itself is available. Google may omit it or its file list for a run. Missing data differ from a successful result and do not prove that nothing delays the page." } }
    ],
    relatedToolSlugs: ["resource-waterfall-analyzer", "core-web-vitals-checker", "css-delivery-analyzer"],
    sourceUrls: ["https://developers.google.com/speed/docs/insights/rest/v5/pagespeedapi/runpagespeed", "https://github.com/GoogleChrome/lighthouse/discussions/16462"],
    lastReviewedAt: "2026-08-14",
    reviewDueAt: "2027-02-14",
  }),


  toolPage({
    slug: "image-performance-checker",
    seoTitle: { ru: "Проверка производительности изображений", en: "Image Performance Checker" },
    metaDescription: { ru: "Проверьте форматы AVIF/WebP/JPEG/PNG/SVG, вес изображений, responsive markup, width/height, lazy-loading и рекомендации по оптимизации.", en: "Check AVIF/WebP/JPEG/PNG/SVG formats, image weight, responsive markup, width/height, lazy-loading, and optimization recommendations." },
    h1: { ru: "Проверка производительности изображений", en: "Image Performance Checker" },
    lead: { ru: "Введите URL страницы, чтобы найти изображения, определить форматы и вес, увидеть legacy JPEG/PNG, oversized assets, отсутствие размеров и рекомендации AVIF/WebP без отдельного мусорного PNG-checker.", en: "Enter a page URL to find images, detect formats and weight, see legacy JPEG/PNG, oversized assets, missing dimensions, and AVIF/WebP recommendations without a separate low-value PNG checker." },
    quickFacts: [
      { ru: "AVIF/WebP", en: "AVIF/WebP" },
      { ru: "Image bytes", en: "Image bytes" },
      { ru: "Responsive markup", en: "Responsive markup" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag загрузит HTML и безопасно проверит найденные image candidates.", en: "WebDiag loads the HTML and safely inspects discovered image candidates." },
      { ru: "Оцените форматы, known bytes, oversized images, responsive delivery и lazy-loading.", en: "Review formats, known bytes, oversized images, responsive delivery, and lazy-loading." },
    ],
    supportedFeatures: [
      { ru: "Находит img, srcset, picture/source и social preview images в static HTML.", en: "Finds img, srcset, picture/source, and social preview images in static HTML." },
      { ru: "Классифицирует AVIF, WebP, JPEG, PNG, SVG, GIF, ICO и unknown форматы.", en: "Classifies AVIF, WebP, JPEG, PNG, SVG, GIF, ICO, and unknown formats." },
      { ru: "Рекомендует AVIF/WebP только как часть полноценного image performance анализа.", en: "Recommends AVIF/WebP only as part of a complete image performance analysis." },
    ],
    limitations: [
      { ru: "Static HTML scan не исполняет JS и не видит CSS background-image/runtime assets.", en: "Static HTML scan does not execute JS and does not see CSS background-image/runtime assets." },
      { ru: "LCP image и фактический transfer size подтверждаются PageSpeed/browser waterfall.", en: "LCP image and actual transfer size are confirmed with PageSpeed/browser waterfall." },
    ],
    useCases: [
      { ru: "Найти тяжёлые JPG/PNG, которые стоит заменить на AVIF/WebP.", en: "Find heavy JPG/PNG images that should move to AVIF/WebP." },
      { ru: "Проверить width/height и responsive image markup после релиза.", en: "Check width/height and responsive image markup after a release." },
      { ru: "Подготовить список image fixes перед Core Web Vitals оптимизацией.", en: "Prepare image fixes before Core Web Vitals optimization." },
    ],
    technicalNotes: [
      { ru: "Ресурсы проверяются через SafeHttpFetcher с SSRF-защитой и bounded лимитом.", en: "Resources are checked through SafeHttpFetcher with SSRF protection and bounded limits." },
      { ru: "Это не отдельный AVIF/PNG checker, а полноценный image performance tool.", en: "This is not a separate AVIF/PNG checker, but a complete image performance tool." },
    ],
    faq: [
      { question: { ru: "Какие изображения стоит оптимизировать в первую очередь?", en: "Which images should I optimise first?" }, answer: { ru: "Укажите адрес страницы и изучите найденные ресурсы и замечания к ним. Начните с крупных изображений и файлов неподходящего формата. После изменений проверьте качество картинки и повторно измерьте загрузку страницы.", en: "Enter the page address and review the discovered resources and findings. Start with large images and potentially unsuitable formats. Check visual quality and remeasure page loading after changes." } },
      { question: { ru: "Нужно ли переводить каждое изображение в AVIF или WebP?", en: "Should every image be converted to AVIF or WebP?" }, answer: { ru: "Формат выбирают по содержимому и требованиям к прозрачности и качеству. Фотография, логотип и схема могут требовать разных решений. Рекомендация в отчёте — повод сравнить варианты, а не автоматическое требование заменить все файлы.", en: "Choose the format based on content, transparency, and quality requirements. Photos, logos, and diagrams may need different choices. A report recommendation is a reason to compare alternatives, not an automatic requirement to replace every file." } }
    ],
    relatedToolSlugs: ["page-weight-analyzer", "core-web-vitals-checker", "image-seo-audit"],
    sourceUrls: ["https://web.dev/learn/performance/image-performance", "https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images/"],
  }),
  toolPage({
    slug: "link-analyzer",
    seoTitle: { ru: "Анализ внутренних и внешних ссылок", en: "Internal and External Link Analyzer" },
    metaDescription: { ru: "Проверьте структуру ссылок страницы: внутренние, внешние, nofollow, sponsored, UGC, target blank, якоря, mailto и tel без полноценного crawler-обхода.", en: "Check a page link structure: internal, external, nofollow, sponsored, UGC, target blank, anchors, mailto, and tel without pretending to run a full crawler." },
    h1: { ru: "Анализ ссылок страницы", en: "Page Link Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы получить bounded static HTML анализ ссылок: внутренние и внешние URL, rel-сигналы, якорные ссылки, небезопасный target=_blank и потенциальные SEO-проблемы.", en: "Enter a page URL to get a bounded static HTML link analysis: internal and external URLs, rel signals, anchor links, unsafe target=_blank, and likely SEO issues." },
    quickFacts: [
      { ru: "Static HTML scan", en: "Static HTML scan" },
      { ru: "Internal/external links", en: "Internal/external links" },
      { ru: "rel и target signals", en: "rel and target signals" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы, которую нужно проверить.", en: "Paste the public page URL you want to inspect." },
      { ru: "WebDiag загрузит HTML и извлечёт HTTP(S), якорные, mailto и tel ссылки.", en: "WebDiag fetches the HTML and extracts HTTP(S), anchor, mailto, and tel links." },
      { ru: "Проверьте распределение внутренних/внешних ссылок, rel-сигналы и рекомендации.", en: "Review internal/external distribution, rel signals, and recommendations." },
    ],
    supportedFeatures: [
      { ru: "Считает internal, external, same-page, mailto, tel и non-http ссылки без запуска браузера.", en: "Counts internal, external, same-page, mailto, tel, and non-http links without launching a browser." },
      { ru: "Показывает rel=nofollow, sponsored, ugc и target=_blank без noopener/noreferrer.", en: "Shows rel=nofollow, sponsored, ugc, and target=_blank without noopener/noreferrer." },
      { ru: "Работает через backend SafeHttpFetcher с SSRF-защитой и лимитом HTML-ответа.", en: "Runs through backend SafeHttpFetcher with SSRF protection and an HTML response limit." },
    ],
    limitations: [
      { ru: "Инструмент анализирует статический HTML одной страницы и не исполняет JavaScript.", en: "The tool analyzes static HTML for one page and does not execute JavaScript." },
      { ru: "Это не полный crawler: он не строит граф всего сайта и не проверяет каждый URL на доступность.", en: "This is not a full crawler: it does not build the whole-site graph or verify every URL availability." },
    ],
    useCases: [
      { ru: "Проверить ссылочную структуру посадочной страницы перед SEO-релизом.", en: "Check a landing page link structure before an SEO release." },
      { ru: "Найти внешние ссылки без корректных rel-сигналов.", en: "Find external links without correct rel signals." },
      { ru: "Обнаружить target=_blank без noopener/noreferrer в публичной разметке.", en: "Detect target=_blank without noopener/noreferrer in public markup." },
    ],
    technicalNotes: [
      { ru: "URL нормализуются относительно final URL страницы, включая relative href.", en: "URLs are normalized against the page final URL, including relative href values." },
      { ru: "Динамические ссылки, добавленные JS после загрузки, должны проверяться будущим browser/crawler слоем.", en: "Links inserted by JavaScript after load require the future browser/crawler layer." },
    ],
    faq: [
      { question: { ru: "Что покажет анализ ссылок одной страницы?", en: "What does a single-page link analysis show?" }, answer: { ru: "Он разделит найденные в HTML ссылки по типам и покажет их адреса, текст и выбранные атрибуты. Это помогает проверить навигацию и исходящие ссылки. Для HTTP-статусов целевых страниц используйте поиск битых ссылок.", en: "It groups links found in HTML and shows their addresses, text, and selected attributes. This helps review navigation and outgoing links. Use the broken link checker for destination HTTP statuses." } },
      { question: { ru: "Почему ссылка, которую видно на сайте, отсутствует в отчёте?", en: "Why is a visible site link missing from the report?" }, answer: { ru: "Она может добавляться после выполнения JavaScript или действия пользователя. Инструмент разбирает полученный HTML и не нажимает элементы страницы. Проверьте такую ссылку отдельно в браузере.", en: "It may be added by JavaScript or a user action. The tool reads retrieved HTML without interacting with the page. Check such links separately in a browser." } }
    ],
    relatedToolSlugs: ["broken-link-checker", "redirect-chain-checker", "canonical-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTML/Element/a", "https://developer.mozilla.org/docs/Web/HTML/Attributes/rel/noopener"],
  }),
  toolPage({
    slug: "broken-link-checker",
    seoTitle: { ru: "Проверка битых ссылок на странице", en: "Broken Link Checker for a Page" },
    metaDescription: { ru: "Найдите битые HTTP-ссылки в статическом HTML одной страницы: 4xx, 5xx, недоступные URL и проверенные статусы с безопасными лимитами.", en: "Find broken HTTP links in one page static HTML: 4xx, 5xx, unreachable URLs, and checked statuses with safe limits." },
    h1: { ru: "Проверка битых ссылок", en: "Broken Link Checker" },
    lead: { ru: "Введите URL страницы, чтобы WebDiag извлёк HTTP(S)-ссылки из HTML и безопасно проверил ограниченный набор уникальных URL на ошибки ответа.", en: "Enter a page URL so WebDiag extracts HTTP(S) links from HTML and safely checks a bounded set of unique URLs for response errors." },
    quickFacts: [
      { ru: "HTTP(S) links", en: "HTTP(S) links" },
      { ru: "4xx / 5xx", en: "4xx / 5xx" },
      { ru: "Bounded checks", en: "Bounded checks" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Инструмент извлечёт уникальные HTTP(S)-ссылки из статического HTML.", en: "The tool extracts unique HTTP(S) links from static HTML." },
      { ru: "Проверьте broken list, skipped count, статусы и рекомендации по исправлению.", en: "Review the broken list, skipped count, statuses, and remediation recommendations." },
    ],
    supportedFeatures: [
      { ru: "Проверяет до безопасного лимита уникальных HTTP(S)-ссылок за запуск.", en: "Checks up to a safe limit of unique HTTP(S) links per run." },
      { ru: "Отмечает 4xx, 5xx и network/policy errors как broken candidates.", en: "Marks 4xx, 5xx, and network/policy errors as broken candidates." },
      { ru: "Не скачивает тела целевых страниц: проверка выполняется read_body=false.", en: "Does not download target page bodies: checks run with read_body=false." },
    ],
    limitations: [
      { ru: "Статический HTML scan не видит ссылки, созданные JavaScript после загрузки.", en: "Static HTML scan does not see links created by JavaScript after load." },
      { ru: "Инструмент проверяет одну страницу, а не весь сайт и не sitemap-recrawl.", en: "The tool checks one page, not the whole site and not a sitemap recrawl." },
    ],
    useCases: [
      { ru: "Найти 404/500 ссылки на коммерческой странице перед публикацией.", en: "Find 404/500 links on a commercial page before publishing." },
      { ru: "Проверить внешние ссылки после миграции, редизайна или смены CMS.", en: "Check external links after a migration, redesign, or CMS change." },
      { ru: "Снизить SEO-риски от ссылок на удалённые страницы и битые ресурсы.", en: "Reduce SEO risk from links to deleted pages and broken resources." },
    ],
    technicalNotes: [
      { ru: "Проверка использует SafeHttpFetcher, DNS/IP policy, redirect limits и no-body mode.", en: "Checks use SafeHttpFetcher, DNS/IP policy, redirect limits, and no-body mode." },
      { ru: "mailto, tel, anchor и non-http ссылки не считаются broken HTTP URL и попадают в skipped.", en: "mailto, tel, anchor, and non-http links are not broken HTTP URLs and are counted as skipped." },
    ],
    faq: [
      { question: { ru: "Как исправлять найденные неработающие ссылки?", en: "How should I fix broken links?" }, answer: { ru: "Проверьте адрес и результат запроса. Для ссылки на удалённую страницу найдите актуальную замену либо удалите ссылку из контента. При сетевой ошибке сначала повторите проверку: временный сбой не доказывает, что страница удалена.", en: "Review the address and request result. Replace links to removed pages with relevant working destinations or remove them from the content. Retry network errors first, since a temporary failure does not prove a page was deleted." } },
      { question: { ru: "Проверяются ли все ссылки на всём сайте?", en: "Does one run check every link on the whole site?" }, answer: { ru: "За один запуск разбирается одна страница и ограниченный список найденных адресов. Пропущенные элементы отмечены отдельно. Для проверки нескольких страниц создайте проект и запустите аудит сайта.", en: "One run inspects a single page and a limited list of discovered addresses. Skipped items are marked separately. Create a project and run a site audit to inspect several pages." } }
    ],
    relatedToolSlugs: ["link-analyzer", "redirect-chain-checker", "sitemap-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Status", "https://developer.mozilla.org/docs/Web/HTTP/Methods/HEAD"],
  }),
  toolPage({
    slug: "broken-image-checker",
    seoTitle: { ru: "Проверка битых изображений страницы", en: "Broken Image Checker for a Page" },
    metaDescription: { ru: "Проверьте изображения из img, srcset, picture source, og:image и twitter:image на 404, 5xx, недоступность и неверный content-type.", en: "Check images from img, srcset, picture source, og:image, and twitter:image for 404, 5xx, unavailability, and wrong content-type." },
    h1: { ru: "Проверка битых изображений", en: "Broken Image Checker" },
    lead: { ru: "Введите URL страницы, чтобы найти битые изображения в статическом HTML и социальных превью: недоступные файлы, ошибочные статусы и ответы без image content-type.", en: "Enter a page URL to find broken images in static HTML and social previews: unavailable files, error statuses, and responses without an image content-type." },
    quickFacts: [
      { ru: "img / picture / srcset", en: "img / picture / srcset" },
      { ru: "OG/Twitter images", en: "OG/Twitter images" },
      { ru: "Content-Type", en: "Content-Type" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы с изображениями.", en: "Paste a page URL that contains images." },
      { ru: "WebDiag соберёт img/srcset/picture и social image candidates из HTML.", en: "WebDiag collects img/srcset/picture and social image candidates from the HTML." },
      { ru: "Проверьте broken images, неправильные content-type и skipped candidates.", en: "Review broken images, wrong content types, and skipped candidates." },
    ],
    supportedFeatures: [
      { ru: "Извлекает изображения из img src, srcset, picture source, poster и meta social image tags.", en: "Extracts images from img src, srcset, picture source, poster, and meta social image tags." },
      { ru: "Проверяет HTTP-статус, финальный URL и image/* content-type без скачивания тела.", en: "Checks HTTP status, final URL, and image/* content-type without downloading the body." },
      { ru: "Отдельно показывает ограничение количества проверенных candidates, чтобы не превращаться в crawler.", en: "Shows checked candidate limits separately so the tool does not become an uncontrolled crawler." },
    ],
    limitations: [
      { ru: "CSS background-image и runtime lazy images требуют browser/network waterfall слоя.", en: "CSS background-image and runtime lazy images require a browser/network waterfall layer." },
      { ru: "Инструмент проверяет доступность, но не оценивает качество сжатия — для этого есть Image Performance Checker.", en: "The tool checks availability, not compression quality; use Image Performance Checker for that." },
    ],
    useCases: [
      { ru: "Найти сломанные product/hero изображения после деплоя или миграции CDN.", en: "Find broken product/hero images after deployment or CDN migration." },
      { ru: "Проверить og:image и twitter:image перед публикацией страницы в соцсетях.", en: "Check og:image and twitter:image before publishing a page to social platforms." },
      { ru: "Увидеть изображения, которые возвращают HTML/redirect/error вместо image content-type.", en: "See images that return HTML, redirects, or errors instead of an image content-type." },
    ],
    technicalNotes: [
      { ru: "URL изображений нормализуются относительно final URL страницы и дедуплицируются.", en: "Image URLs are normalized against the page final URL and deduplicated." },
      { ru: "Проверка использует backend SafeHttpFetcher в read_body=false режиме с redirect и SSRF limits.", en: "Checks use backend SafeHttpFetcher in read_body=false mode with redirect and SSRF limits." },
    ],
    faq: [
      { question: { ru: "Почему изображение считается неработающим?", en: "Why is an image reported as broken?" }, answer: { ru: "Проверьте указанный в результате адрес и ответ сервера. Вместо картинки сервер мог вернуть ошибку, страницу HTML или недоступный ресурс. Исправьте ссылку или файл и запустите проверку повторно.", en: "Review the listed address and server response. The server may have returned an error, HTML page, or unreachable resource instead of an image. Fix the reference or file and run the check again." } },
      { question: { ru: "Будут ли проверены фоновые картинки из CSS?", en: "Will background images from CSS be checked?" }, answer: { ru: "Инструмент ищет адреса изображений в HTML, включая поддерживаемую разметку вариантов размеров и превью. Фоновые изображения из отдельных CSS-файлов и картинки, добавляемые JavaScript, не охвачены таким разбором.", en: "The tool finds image references in HTML, including supported responsive and preview markup. It does not cover background images in separate CSS files or images added by JavaScript." } }
    ],
    relatedToolSlugs: ["image-performance-checker", "image-seo-audit", "open-graph-preview"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTML/Element/img", "https://developer.mozilla.org/docs/Web/HTML/Element/picture"],
  }),
  toolPage({
    slug: "image-seo-audit",
    seoTitle: { ru: "Полный SEO-аудит изображений", en: "Complete Image SEO Audit" },
    metaDescription: { ru: "Проверьте alt-тексты, изображения-ссылки, размеры, lazy-loading, responsive markup и og/twitter image без слабого отдельного Alt Checker.", en: "Check alt text, linked images, dimensions, lazy-loading, responsive markup, and og/twitter image without a weak standalone Alt Checker." },
    h1: { ru: "Полный SEO-аудит изображений", en: "Complete Image SEO Audit" },
    lead: { ru: "Проверьте изображения страницы как SEO-сигналы: alt coverage, изображения внутри ссылок, пустые декоративные alt, размеры, responsive markup, lazy-loading и social preview image.", en: "Check page images as SEO signals: alt coverage, linked images, empty decorative alt, dimensions, responsive markup, lazy-loading, and social preview image." },
    quickFacts: [
      { ru: "Alt coverage", en: "Alt coverage" },
      { ru: "Linked images", en: "Linked images" },
      { ru: "PNG/JPEG/WebP", en: "PNG/JPEG/WebP" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste a page URL." },
      { ru: "Запустите static HTML scan через WebDiag API.", en: "Run a static HTML scan through the WebDiag API." },
      { ru: "Исправьте alt, linked images, dimensions и social preview image по приоритетам.", en: "Fix alt, linked images, dimensions, and social preview image by priority." },
    ],
    supportedFeatures: [
      { ru: "Отличает missing alt, empty decorative alt и изображения-ссылки без текста.", en: "Distinguishes missing alt, empty decorative alt, and linked images without text." },
      { ru: "Проверяет width/height, srcset/picture и loading strategy.", en: "Checks width/height, srcset/picture, and loading strategy." },
      { ru: "Показывает og:image и twitter:image как часть image SEO.", en: "Shows og:image and twitter:image as part of image SEO." },
    ],
    limitations: [
      { ru: "Не исполняет JavaScript и не проверяет изображения, появляющиеся только после runtime rendering.", en: "Does not execute JavaScript and does not check images created only by runtime rendering." },
      { ru: "Не генерирует AI-alt и не выдумывает описания изображений.", en: "Does not generate AI alt text and does not invent image descriptions." },
    ],
    useCases: [
      { ru: "Проверить CMS-шаблон каталога/блога на alt и размеры изображений.", en: "Check a CMS catalog/blog template for image alt text and dimensions." },
      { ru: "Найти изображения-ссылки без текстового эквивалента.", en: "Find linked images without a text equivalent." },
      { ru: "Проверить social preview image перед публикацией страницы.", en: "Check social preview image before publishing a page." },
    ],
    technicalNotes: [
      { ru: "H1/alt/png не выделяются в мусорные микротулы; alt остаётся подпроверкой внутри image SEO.", en: "H1/alt/png are not split into low-value microtools; alt remains a subcheck inside image SEO." },
      { ru: "Проверка выполняется по static HTML и безопасному URL policy.", en: "The check runs on static HTML and safe URL policy." },
    ],
    faq: [
      { question: { ru: "Зачем изображению текст alt?", en: "Why does an image need alt text?" }, answer: { ru: "Alt описывает смысл изображения, когда оно недоступно или его читает программа экранного доступа. Укажите полезное описание по контексту страницы. Инструмент помогает найти пропуски, но не оценивает точность описания самой картинки.", en: "Alt text conveys an image's purpose when it cannot be seen or is read by a screen reader. Write a useful description in the page's context. The tool helps find missing values but does not judge how accurately they describe the image." } },
      { question: { ru: "Когда пустой alt допустим?", en: "When is an empty alt value appropriate?" }, answer: { ru: "У чисто декоративного изображения пустое значение может быть правильным. Если картинка служит ссылкой или передаёт важную информацию, проверьте, понятно ли её назначение без изображения. Не заполняйте все пропуски одинаковым набором ключевых слов.", en: "An empty value can be correct for a purely decorative image. If an image acts as a link or carries important information, check whether its purpose is clear without seeing it. Do not fill every missing value with the same keywords." } }
    ],
    relatedToolSlugs: ["image-performance-checker", "meta-tags-checker", "open-graph-preview"],
    sourceUrls: ["https://web.dev/learn/accessibility/images", "https://developers.google.com/search/docs/appearance/google-images"],
  }),
  toolPage({
    slug: "favicon-checker",
    seoTitle: { ru: "Проверка favicon и web app icons", en: "Favicon and Web App Icon Checker" },
    metaDescription: { ru: "Проверьте rel=icon, SVG favicon, /favicon.ico fallback, apple-touch-icon, manifest и доступность web app icons.", en: "Check rel=icon, SVG favicon, /favicon.ico fallback, apple-touch-icon, manifest, and web app icon availability." },
    h1: { ru: "Проверка favicon и app icons", en: "Favicon and App Icons Checker" },
    lead: { ru: "Введите URL страницы, чтобы проверить объявленные иконки сайта: SVG favicon, ICO fallback, apple-touch-icon, web app manifest и доступность файлов.", en: "Enter a page URL to check declared site icons: SVG favicon, ICO fallback, apple-touch-icon, web app manifest, and file availability." },
    quickFacts: [
      { ru: "SVG favicon", en: "SVG favicon" },
      { ru: "Apple touch icon", en: "Apple touch icon" },
      { ru: "Manifest", en: "Manifest" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste a page URL." },
      { ru: "WebDiag найдёт link rel=icon/apple-touch-icon/manifest и проверит fallback /favicon.ico.", en: "WebDiag finds link rel=icon/apple-touch-icon/manifest and checks fallback /favicon.ico." },
      { ru: "Проверьте форматы, размеры, статусы и недостающие app icon сигналы.", en: "Review formats, sizes, statuses, and missing app icon signals." },
    ],
    supportedFeatures: [
      { ru: "Проверяет declared icons и fallback /favicon.ico.", en: "Checks declared icons and fallback /favicon.ico." },
      { ru: "Определяет SVG/PNG/ICO по content-type и URL.", en: "Detects SVG/PNG/ICO by content-type and URL." },
      { ru: "Показывает manifest URL без fake PWA validation.", en: "Shows manifest URL without fake PWA validation." },
    ],
    limitations: [
      { ru: "Не выполняет полный PWA audit и не валидирует содержимое manifest в этом MVP.", en: "Does not run a full PWA audit and does not validate manifest contents in this MVP." },
      { ru: "Не проверяет реальные отображения иконок в каждом браузере/OS.", en: "Does not verify icon rendering in every browser/OS." },
    ],
    useCases: [
      { ru: "Проверить favicon после редизайна или смены домена.", en: "Check favicon after a redesign or domain migration." },
      { ru: "Найти битые icon links и отсутствующий apple-touch-icon.", en: "Find broken icon links and missing apple-touch-icon." },
      { ru: "Подготовить сайт к аккуратному отображению в вкладках, закладках и mobile home screen.", en: "Prepare the site for clean display in tabs, bookmarks, and mobile home screen." },
    ],
    technicalNotes: [
      { ru: "Проверка использует bounded safe fetch; /favicon.ico добавляется как compatibility fallback.", en: "The check uses bounded safe fetch; /favicon.ico is added as a compatibility fallback." },
      { ru: "Это app icon coverage checker, не генератор favicon.", en: "This is an app icon coverage checker, not a favicon generator." },
    ],
    faq: [
      { question: { ru: "Почему иконка сайта может не появляться во вкладке?", en: "Why might the site icon not appear in a browser tab?" }, answer: { ru: "Проверьте адреса иконок, доступность файлов и разметку их подключения. Браузер также может хранить прежнюю иконку в кеше. Отчёт помогает проверить опубликованные файлы, но не очищает кеш посетителей.", en: "Check icon addresses, file availability, and their page references. A browser may also cache an old icon. The report helps inspect published files but does not clear visitors' caches." } },
      { question: { ru: "Заменяет ли эта проверка тест установки сайта как приложения?", en: "Does this check test installation as a web app?" }, answer: { ru: "Она проверяет найденные иконки и наличие связанных объявлений, а не весь процесс установки веб-приложения. Поведение на телефоне и совместимость конкретных размеров нужно дополнительно проверить на нужных устройствах.", en: "It checks detected icons and related declarations, not the complete web app installation process. Test mobile behaviour and the required icon sizes on the devices you support." } }
    ],
    relatedToolSlugs: ["image-performance-checker", "image-format-converter", "html-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTML/Attributes/rel/icon", "https://developer.mozilla.org/docs/Web/Manifest"],
  }),


  toolPage({
    slug: "structured-data-validator",
    seoTitle: { ru: "Проверка структурированных данных JSON-LD", en: "Structured Data Validator" },
    metaDescription: { ru: "Проверьте JSON-LD на странице: валидность JSON, Schema.org типы, ошибки парсинга и рекомендации без fake rich-result обещаний.", en: "Check page JSON-LD: JSON validity, Schema.org types, parse errors, and recommendations without fake rich-result promises." },
    h1: { ru: "Проверка структурированных данных", en: "Structured Data Validator" },
    lead: { ru: "Введите URL, чтобы проверить JSON-LD блоки на странице: сколько их найдено, какие Schema.org типы объявлены, есть ли синтаксические ошибки и что нужно исправить перед rich-result тестами.", en: "Enter a URL to inspect JSON-LD blocks on a page: how many were found, which Schema.org types are declared, whether syntax errors exist, and what to fix before rich-result tests." },
    quickFacts: [
      { ru: "JSON-LD", en: "JSON-LD" },
      { ru: "Schema.org types", en: "Schema.org types" },
      { ru: "Parse errors", en: "Parse errors" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы со структурированными данными.", en: "Paste the page URL that contains structured data." },
      { ru: "Запустите проверку через WebDiag API.", en: "Run the check through the WebDiag API." },
      { ru: "Оцените валидность JSON-LD, найденные типы и ошибки по каждому блоку.", en: "Review JSON-LD validity, detected types, and errors for each block." },
    ],
    supportedFeatures: [
      { ru: "Извлекает все script type=application/ld+json из HTML страницы.", en: "Extracts all script type=application/ld+json blocks from the page HTML." },
      { ru: "Показывает валидные и невалидные блоки, Schema.org типы и количество JSON-LD nodes.", en: "Shows valid and invalid blocks, Schema.org types, and JSON-LD node counts." },
      { ru: "Использует SafeHttpFetcher с SSRF-защитой и лимитом размера HTML.", en: "Uses SafeHttpFetcher with SSRF protection and HTML body size limits." },
    ],
    limitations: [
      { ru: "Инструмент проверяет синтаксис JSON-LD и типы, но не гарантирует eligibility для rich results.", en: "The tool checks JSON-LD syntax and types, but does not guarantee rich result eligibility." },
      { ru: "JavaScript-rendered structured data в MVP не исполняется.", en: "JavaScript-rendered structured data is not executed in this MVP." },
    ],
    useCases: [
      { ru: "Найти сломанный JSON-LD после правки шаблонов CMS.", en: "Find broken JSON-LD after CMS template changes." },
      { ru: "Проверить, какие типы Schema.org реально отдаются в HTML.", en: "Check which Schema.org types are actually delivered in HTML." },
      { ru: "Подготовить страницу к последующей проверке в Google rich results tools.", en: "Prepare a page for later verification in Google rich results tools." },
    ],
    technicalNotes: [
      { ru: "Проверка выполняет синтаксический JSON parse и рекурсивно собирает @type значения.", en: "The check performs syntactic JSON parsing and recursively collects @type values." },
      { ru: "Это не внешняя интеграция с Google Rich Results Test и не Schema.org reasoner.", en: "This is not an external Google Rich Results Test integration and not a Schema.org reasoner." },
    ],
    faq: [
      { question: { ru: "Как проверить разметку Schema.org на странице?", en: "How can I check Schema.org markup on a page?" }, answer: { ru: "Укажите адрес страницы. Инструмент найдёт блоки JSON-LD в полученном HTML, проверит поддерживаемые признаки и покажет найденные типы и замечания. Если блоков несколько, изучите каждый результат.", en: "Enter the page address. The tool finds JSON-LD blocks in retrieved HTML, checks supported properties, and shows detected types and findings. Review each result if there are several blocks." } },
      { question: { ru: "Корректная разметка гарантирует расширенный результат в поиске?", en: "Does valid markup guarantee an enhanced search result?" }, answer: { ru: "Нет. Поисковая система учитывает свои требования и содержимое страницы и сама решает, как показать результат. Исправляйте найденные ошибки и следите, чтобы разметка описывала реальные опубликованные данные.", en: "No. Search engines consider their requirements and page content and decide how to display results. Fix reported issues and ensure the markup describes real published information." } }
    ],
    relatedToolSlugs: ["schema-markup-generator", "html-validator", "meta-tags-checker"],
    sourceUrls: ["https://schema.org/docs/jsonldcontext.json", "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"],
  }),
  toolPage({
    slug: "schema-markup-generator",
    seoTitle: { ru: "Генератор Schema.org JSON-LD", en: "Schema.org JSON-LD Generator" },
    metaDescription: { ru: "Создайте поддерживаемые шаблоны Schema.org JSON-LD: Organization, LocalBusiness, FAQPage и BreadcrumbList без AI-фантазирования.", en: "Create supported Schema.org JSON-LD templates: Organization, LocalBusiness, FAQPage, and BreadcrumbList without AI fabrication." },
    h1: { ru: "Генератор Schema.org JSON-LD", en: "Schema.org JSON-LD Generator" },
    lead: { ru: "Соберите базовую JSON-LD разметку из явных полей. Инструмент не выдумывает факты, не обещает rich results и оставляет финальную проверку за Structured Data Validator.", en: "Build basic JSON-LD markup from explicit fields. The tool does not invent facts, does not promise rich results, and leaves final verification to the Structured Data Validator." },
    quickFacts: [
      { ru: "Browser-only", en: "Browser-only" },
      { ru: "4 шаблона", en: "4 templates" },
      { ru: "Без AI fake output", en: "No AI fake output" },
    ],
    howToSteps: [
      { ru: "Выберите тип Schema.org шаблона.", en: "Choose the Schema.org template type." },
      { ru: "Заполните только фактические данные, которые есть на странице.", en: "Fill in only factual data that exists on the page." },
      { ru: "Скопируйте JSON-LD и затем проверьте опубликованную страницу валидатором.", en: "Copy the JSON-LD and then validate the published page." },
    ],
    supportedFeatures: [
      { ru: "Генерирует Organization, LocalBusiness, FAQPage и BreadcrumbList шаблоны.", en: "Generates Organization, LocalBusiness, FAQPage, and BreadcrumbList templates." },
      { ru: "Работает в браузере без отправки введённых данных на backend.", en: "Runs in the browser without sending entered data to the backend." },
      { ru: "Создаёт script type=application/ld+json, готовый для вставки в HTML.", en: "Creates script type=application/ld+json ready to paste into HTML." },
    ],
    limitations: [
      { ru: "Это генератор шаблонов, а не AI-копирайтер и не гарантия rich results.", en: "This is a template generator, not an AI copywriter and not a rich result guarantee." },
      { ru: "Нужно вручную убедиться, что разметка описывает видимый контент страницы.", en: "You must manually ensure the markup describes visible page content." },
    ],
    useCases: [
      { ru: "Быстро собрать базовую Organization или LocalBusiness разметку.", en: "Quickly build basic Organization or LocalBusiness markup." },
      { ru: "Подготовить FAQPage JSON-LD из утверждённых вопросов и ответов.", en: "Prepare FAQPage JSON-LD from approved questions and answers." },
      { ru: "Сформировать BreadcrumbList для шаблонной страницы.", en: "Generate BreadcrumbList for a templated page." },
    ],
    technicalNotes: [
      { ru: "Генератор формирует JSON.stringify output с фиксированной структурой для поддерживаемых типов.", en: "The generator produces JSON.stringify output with a fixed structure for supported types." },
      { ru: "После публикации результат нужно проверить через Structured Data Validator.", en: "After publishing, the result should be checked through the Structured Data Validator." },
    ],
    faq: [
      { question: { ru: "Как получить разметку для организации или страницы?", en: "How can I generate markup for an organisation or page?" }, answer: { ru: "Выберите доступный тип, заполните поля своими сведениями и скопируйте полученный JSON-LD. Затем разместите код на соответствующей странице и проверьте опубликованный результат. Генератор использует введённые значения и не собирает сведения о бизнесе сам.", en: "Choose an available type, enter your own details, and copy the generated JSON-LD. Add it to the relevant page and check the published result. The generator uses supplied values rather than collecting business details itself." } },
      { question: { ru: "Можно ли добавить в разметку придуманные цены или отзывы?", en: "Can I add invented prices or reviews to the markup?" }, answer: { ru: "Добавляйте только подтверждённые сведения, которые соответствуют странице. Нужный тип должен поддерживаться формой. Само наличие сгенерированного кода не подтверждает право на расширенный результат в поиске.", en: "Use only verified information matching the page. The required type must be supported by the form. Generating code does not by itself establish eligibility for an enhanced search result." } }
    ],
    relatedToolSlugs: ["structured-data-validator", "meta-tags-checker", "html-validator"],
    sourceUrls: ["https://schema.org", "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"],
  }),
  toolPage({
    slug: "html-validator",
    seoTitle: { ru: "Проверка HTML-разметки страницы", en: "HTML Markup Validator" },
    metaDescription: { ru: "Проверьте базовую HTML-структуру страницы: doctype, html/head/body, lang, title, viewport, duplicate IDs и unmatched tags.", en: "Check basic page HTML structure: doctype, html/head/body, lang, title, viewport, duplicate IDs, and unmatched tags." },
    h1: { ru: "Проверка HTML-разметки", en: "HTML Markup Validator" },
    lead: { ru: "Введите URL, чтобы получить практическую проверку HTML-структуры страницы. Это не fake W3C-клон, а детерминированная диагностика самых частых проблем шаблонов.", en: "Enter a URL to get a practical HTML structure check. This is not a fake W3C clone, but deterministic diagnostics for common template issues." },
    quickFacts: [
      { ru: "HTML structure", en: "HTML structure" },
      { ru: "Duplicate IDs", en: "Duplicate IDs" },
      { ru: "Mobile viewport", en: "Mobile viewport" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste the page URL." },
      { ru: "Запустите проверку HTML-разметки через backend.", en: "Run the HTML markup check through the backend." },
      { ru: "Исправьте проблемы doctype, lang, title, viewport, duplicate IDs и unmatched tags.", en: "Fix doctype, lang, title, viewport, duplicate IDs, and unmatched tag issues." },
    ],
    supportedFeatures: [
      { ru: "Проверяет doctype, html/head/body, html lang, title и viewport.", en: "Checks doctype, html/head/body, html lang, title, and viewport." },
      { ru: "Находит duplicate id attributes, unexpected closing tags и unclosed non-void tags.", en: "Finds duplicate id attributes, unexpected closing tags, and unclosed non-void tags." },
      { ru: "Использует безопасную backend-загрузку HTML с SSRF-защитой.", en: "Uses safe backend HTML fetching with SSRF protection." },
    ],
    limitations: [
      { ru: "Это WebDiag markup inspection, а не полная W3C conformance validation.", en: "This is WebDiag markup inspection, not full W3C conformance validation." },
      { ru: "JavaScript-rendered DOM после hydration в MVP не анализируется.", en: "The JavaScript-rendered DOM after hydration is not analyzed in this MVP." },
    ],
    useCases: [
      { ru: "Проверить шаблон после миграции CMS или SSR/SSG релиза.", en: "Check a template after a CMS migration or SSR/SSG release." },
      { ru: "Найти duplicate IDs, которые ломают anchors, labels, ARIA и scripts.", en: "Find duplicate IDs that break anchors, labels, ARIA, and scripts." },
      { ru: "Быстро увидеть, есть ли базовые проблемы HTML до SEO-аудита.", en: "Quickly see basic HTML issues before an SEO audit." },
    ],
    technicalNotes: [
      { ru: "Парсер анализирует исходный HTML ответ и не исполняет JavaScript.", en: "The parser analyzes the raw HTML response and does not execute JavaScript." },
      { ru: "Отчёт специально формулируется как practical inspection, чтобы не имитировать внешний W3C validator.", en: "The report is intentionally framed as practical inspection so it does not imitate an external W3C validator." },
    ],
    faq: [
      { question: { ru: "Какие ошибки поможет найти проверка HTML?", en: "Which errors can the HTML check help find?" }, answer: { ru: "Введите адрес страницы. Инструмент проверит поддерживаемые признаки структуры и типовые проблемы, например повторяющиеся идентификаторы элементов. Используйте список замечаний для исправления шаблона; полное соответствие всем правилам HTML здесь не проверяется.", en: "Enter the page address. The tool checks supported structure rules and common issues such as duplicate element IDs. Use findings to fix your template; this is not a complete check of every HTML rule." } },
      { question: { ru: "Почему нужно исправлять одинаковые id у элементов?", en: "Why should I fix duplicate element IDs?" }, answer: { ru: "По id работают ссылки на фрагменты страницы, связи подписей с полями и часть скриптов. Повторы могут сделать выбор элемента неоднозначным. После исправления проверьте работу связанных элементов и повторите анализ.", en: "Fragment links, label connections, and some scripts rely on IDs. Duplicates can make element selection ambiguous. After fixing them, test the affected elements and rerun the analysis." } }
    ],
    relatedToolSlugs: ["structured-data-validator", "meta-tags-checker", "canonical-checker"],
    sourceUrls: ["https://html.spec.whatwg.org", "https://developer.mozilla.org/docs/Web/HTML"],
  }),
  toolPage({
    slug: "meta-tags-checker",
    seoTitle: { ru: "Проверка мета-тегов страницы онлайн", en: "Meta Tags Checker" },
    metaDescription: { ru: "Проверьте title, description, robots, canonical, Open Graph, Twitter/X и JSON-LD summary для одной страницы.", en: "Check title, description, robots, canonical, Open Graph, Twitter/X, and JSON-LD summary for one page." },
    h1: { ru: "Проверка мета-тегов", en: "Meta Tags Checker" },
    lead: { ru: "Введите URL, чтобы получить сводную проверку SEO-метаданных страницы: title, description, robots, canonical, H1-сводку, social tags и JSON-LD coverage без нарезки на слабые микротулы.", en: "Enter a URL to get an aggregate SEO metadata review: title, description, robots, canonical, H1 summary, social tags, and JSON-LD coverage without weak microtool fragmentation." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "SEO metadata", en: "SEO metadata" },
      { ru: "Aggregate checks", en: "Aggregate checks" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес страницы, которую нужно проверить.", en: "Paste the page address you need to check." },
      { ru: "Запустите проверку и дождитесь ответа WebDiag API.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Оцените title, description, robots, canonical, social metadata и JSON-LD summary.", en: "Review title, description, robots, canonical, social metadata, and JSON-LD summary." },
    ],
    supportedFeatures: [
      { ru: "Проверяет метаданные как один цельный SEO-сценарий, а не отдельные слабые проверки title/H1/description.", en: "Checks metadata as one complete SEO scenario, not separate weak title/H1/description checks." },
      { ru: "Показывает длину title/description, canonical summary, robots directives и coverage соцметаданных.", en: "Shows title/description length, canonical summary, robots directives, and social metadata coverage." },
      { ru: "Использует backend SafeHttpFetcher с SSRF-защитой и лимитом размера HTML.", en: "Uses the backend SafeHttpFetcher with SSRF protection and HTML body size limits." },
    ],
    limitations: [
      { ru: "Инструмент проверяет одну страницу и не ищет дубли метаданных по всему сайту.", en: "The tool checks one page and does not search for duplicate metadata across the site." },
      { ru: "H1 здесь только сводный сигнал; полная иерархия заголовков должна идти в Heading Structure Checker.", en: "H1 is only a summary signal here; the full heading hierarchy belongs in Heading Structure Checker." },
    ],
    useCases: [
      { ru: "Быстро проверить, готова ли посадочная страница к индексации и нормальному сниппету.", en: "Quickly check whether a landing page is ready for indexing and a sane snippet." },
      { ru: "Перед релизом увидеть отсутствующие или слабые HTML metadata signals.", en: "Before release, see missing or weak HTML metadata signals." },
      { ru: "Сравнить canonical, robots и social metadata после миграции или смены CMS.", en: "Compare canonical, robots, and social metadata after migration or CMS changes." },
    ],
    technicalNotes: [
      { ru: "Инструмент извлекает HTML metadata из загруженной страницы и не выполняет JavaScript-рендеринг.", en: "The tool extracts HTML metadata from the fetched page and does not perform JavaScript rendering." },
      { ru: "Canonical резолвится относительно финального URL после редиректов.", en: "Canonical is resolved relative to the final URL after redirects." },
    ],
    faq: [
      { question: { ru: "Что проверить в Title и Description в первую очередь?", en: "What should I check first in Title and Description?" }, answer: { ru: "Убедитесь, что они заполнены и описывают конкретную страницу. Сопоставьте найденные значения с её заголовком и содержимым. Инструмент показывает данные из HTML; качество формулировок и соответствие задаче оценивает редактор.", en: "Make sure they are present and describe the specific page. Compare the detected values with its heading and content. The tool shows HTML data; an editor should assess wording quality and relevance." } },
      { question: { ru: "Почему после изменения текста проверка показывает старое значение?", en: "Why does the check still show the old value after I edit it?" }, answer: { ru: "Проверьте, что изменение опубликовано по тому же адресу и сервер не отдаёт сохранённую копию. Теги, которые появляются только после выполнения JavaScript, могут отсутствовать в полученном HTML. Повторите проверку после обновления страницы на сервере.", en: "Verify that the edit is published at the same address and the server is not serving a cached copy. Tags added only by JavaScript may be missing from retrieved HTML. Rerun the check once the server response is updated." } }
    ],
    relatedToolSlugs: ["serp-preview", "open-graph-preview", "canonical-checker"],
    sourceUrls: ["https://developers.google.com/search/docs/appearance/title-link", "https://developers.google.com/search/docs/appearance/snippet"],
  }),
  toolPage({
    slug: "serp-preview",
    seoTitle: { ru: "Предпросмотр поискового сниппета", en: "SERP Snippet Preview" },
    metaDescription: { ru: "Соберите preview поискового результата по реальному title и meta description страницы с предупреждениями по качеству snippet.", en: "Build a search result preview from the real page title and meta description with snippet quality warnings." },
    h1: { ru: "Предпросмотр поискового сниппета", en: "SERP Snippet Preview" },
    lead: { ru: "Введите URL, чтобы увидеть, как страница может выглядеть в поисковой выдаче: display URL, title, description, источники fallback и предупреждения по сниппету.", en: "Enter a URL to see how a page may appear in search results: display URL, title, description, fallback sources, and snippet warnings." },
    quickFacts: [
      { ru: "SERP preview", en: "SERP preview" },
      { ru: "Title/description", en: "Title/description" },
      { ru: "Snippet warnings", en: "Snippet warnings" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste the page URL." },
      { ru: "Запустите preview и проверьте, откуда взяты title и description.", en: "Run the preview and check where title and description came from." },
      { ru: "Исправьте отсутствующие, слишком короткие или перегруженные сниппет-сигналы.", en: "Fix missing, too short, or bloated snippet signals." },
    ],
    supportedFeatures: [
      { ru: "Строит search snippet preview по реальному HTML, а не по ручному вводу.", en: "Builds a search snippet preview from real HTML, not manual input." },
      { ru: "Показывает fallback, если title или description отсутствуют.", en: "Shows fallback sources when title or description is missing." },
      { ru: "Отдельно показывает предупреждение, если страница содержит noindex.", en: "Separately warns when the page contains noindex." },
    ],
    limitations: [
      { ru: "Поисковые системы могут переписывать сниппеты; инструмент показывает контролируемые HTML-сигналы, а не гарантированный SERP.", en: "Search engines may rewrite snippets; the tool shows controllable HTML signals, not a guaranteed SERP." },
      { ru: "Инструмент не анализирует реальные позиции и CTR.", en: "The tool does not analyze actual rankings or CTR." },
    ],
    useCases: [
      { ru: "Проверить посадочную страницу перед запуском рекламы или SEO-релизом.", en: "Check a landing page before paid traffic or an SEO release." },
      { ru: "Согласовать сниппет с клиентом без ручного копирования HTML.", en: "Review a snippet with a client without manually copying HTML." },
      { ru: "Увидеть, не потерялся ли title или description после шаблонных правок.", en: "See whether title or description was lost after template changes." },
    ],
    technicalNotes: [
      { ru: "Preview строится из title и meta description, извлечённых backend-проверкой HTML.", en: "The preview is built from title and meta description extracted by the backend HTML check." },
      { ru: "Это не запрос к Google Search Console и не SERP scraping.", en: "This is not a Google Search Console request and not SERP scraping." },
    ],
    faq: [
      { question: { ru: "Как посмотреть возможный вид страницы в поиске?", en: "How can I preview a possible search result for my page?" }, answer: { ru: "Укажите адрес страницы. Предпросмотр использует найденные заголовок, описание и адрес. Он помогает оценить текст перед публикацией или после изменения, но не запрашивает фактическую поисковую выдачу.", en: "Enter the page address. The preview uses the detected title, description, and URL. It helps review wording before or after publication but does not retrieve live search results." } },
      { question: { ru: "Почему Google или Яндекс показывают другой текст?", en: "Why do Google or Yandex display different wording?" }, answer: { ru: "Поисковая система может выбрать собственный заголовок или фрагмент текста в зависимости от запроса и актуальных данных о странице. Сравнивайте предпросмотр с исходными тегами, а фактическую выдачу проверяйте отдельно.", en: "A search engine may choose its own title or text excerpt based on the query and current page data. Compare this preview with your source tags, and inspect actual search results separately." } }
    ],
    relatedToolSlugs: ["meta-tags-checker", "open-graph-preview", "canonical-checker"],
    sourceUrls: ["https://developers.google.com/search/docs/appearance/title-link", "https://developers.google.com/search/docs/appearance/snippet"],
  }),
  toolPage({
    slug: "open-graph-preview",
    seoTitle: { ru: "Предпросмотр Open Graph и Twitter/X Card", en: "Open Graph and Twitter/X Card Preview" },
    metaDescription: { ru: "Проверьте rich preview страницы для соцсетей и мессенджеров: OG title, description, image, URL и Twitter/X Card.", en: "Check page rich previews for social networks and messengers: OG title, description, image, URL, and Twitter/X Card." },
    h1: { ru: "Предпросмотр Open Graph и Twitter/X Card", en: "Open Graph and Twitter/X Card Preview" },
    lead: { ru: "Введите URL, чтобы проверить карточки предпросмотра для соцсетей и мессенджеров: Open Graph, Twitter/X Card, fallback-данные, изображение и недостающие поля.", en: "Enter a URL to check social and messenger preview cards: Open Graph, Twitter/X Card, fallback data, image, and missing fields." },
    quickFacts: [
      { ru: "Open Graph", en: "Open Graph" },
      { ru: "Twitter/X Card", en: "Twitter/X Card" },
      { ru: "Rich preview", en: "Rich preview" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste the page URL." },
      { ru: "Запустите проверку и сравните Open Graph и Twitter/X preview.", en: "Run the check and compare Open Graph and Twitter/X preview." },
      { ru: "Исправьте недостающие title, description, image или card type.", en: "Fix missing title, description, image, or card type." },
    ],
    supportedFeatures: [
      { ru: "Извлекает og:title, og:description, og:image, og:url, og:type и twitter:* metadata.", en: "Extracts og:title, og:description, og:image, og:url, og:type, and twitter:* metadata." },
      { ru: "Резолвит относительные изображения относительно финального URL после редиректов.", en: "Resolves relative images against the final URL after redirects." },
      { ru: "Показывает fallback из обычных title/description, если соцметаданные частично отсутствуют.", en: "Shows fallback from normal title/description when social metadata is partially missing." },
    ],
    limitations: [
      { ru: "Инструмент не скачивает и не валидирует фактический размер изображения в MVP.", en: "The MVP does not download or validate the actual image dimensions." },
      { ru: "Разные соцсети могут кешировать preview, поэтому после исправлений может потребоваться очистка cache у платформы.", en: "Different platforms can cache previews, so platform cache refresh may be needed after fixes." },
    ],
    useCases: [
      { ru: "Проверить preview страницы перед публикацией в Telegram, VK, X или мессенджерах.", en: "Check a page preview before sharing in Telegram, VK, X, or messengers." },
      { ru: "Найти отсутствующее og:image после миграции шаблонов или CDN.", en: "Find missing og:image after template or CDN migration." },
      { ru: "Согласовать rich preview с маркетингом до запуска кампании.", en: "Review rich preview with marketing before a campaign launch." },
    ],
    technicalNotes: [
      { ru: "Twitter/X preview может использовать fallback из Open Graph, если собственные twitter:* поля отсутствуют.", en: "Twitter/X preview can use Open Graph fallback when explicit twitter:* fields are missing." },
      { ru: "Это один полноценный social preview tool, а не два слабых дубликата OG и Twitter.", en: "This is one complete social preview tool, not two weak duplicated OG and Twitter tools." },
    ],
    faq: [
      { question: { ru: "Как проверить картинку и текст при отправке ссылки?", en: "How can I check the image and text shown when sharing a link?" }, answer: { ru: "Вставьте адрес страницы. Инструмент покажет найденные данные Open Graph и Twitter/X Card — заголовок, описание и адрес изображения для карточки ссылки. Исправьте недостающие поля в разметке страницы и повторите проверку.", en: "Paste the page address. The tool shows detected Open Graph and Twitter/X Card data: the title, description, and preview image address. Add missing fields to the page markup and rerun the check." } },
      { question: { ru: "Почему карточка в мессенджере отличается от предпросмотра?", en: "Why does a messenger's card differ from this preview?" }, answer: { ru: "Мессенджер может хранить старую карточку или применять собственные правила отображения. Предпросмотр показывает данные текущего HTML, но не очищает кеш стороннего сервиса. Доступность и фактический размер картинки при необходимости проверьте отдельно.", en: "A messenger may cache an earlier card or use its own display rules. The preview shows current HTML data but does not clear third-party caches. Check image availability and actual dimensions separately when needed." } }
    ],
    relatedToolSlugs: ["meta-tags-checker", "serp-preview", "security-headers-checker"],
    sourceUrls: ["https://ogp.me/", "https://developer.x.com/en/docs/x-for-websites/cards/overview/abouts-cards"],
  }),
  toolPage({
    slug: "security-headers-checker",
    seoTitle: { ru: "Проверка заголовков безопасности онлайн", en: "Security Headers Checker" },
    metaDescription: { ru: "Проверьте HSTS, CSP, nosniff, защиту от фрейминга, Referrer-Policy и Permissions-Policy для одной страницы.", en: "Check HSTS, CSP, nosniff, frame protection, Referrer-Policy, and Permissions-Policy for a single page." },
    h1: { ru: "Проверка заголовков безопасности", en: "Security Headers Checker" },
    lead: { ru: "Введите URL, чтобы проверить основные HTTP-заголовки, которые снижают риск XSS, clickjacking, утечек referrer-данных и небезопасной работы браузерных API.", en: "Enter a URL to check the core HTTP headers that reduce XSS, clickjacking, referrer leakage, and unsafe browser API exposure." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "HTTP headers", en: "HTTP headers" },
      { ru: "Security score", en: "Security score" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес страницы или домена, который нужно проверить.", en: "Paste the page or domain address you need to check." },
      { ru: "Запустите проверку и дождитесь ответа WebDiag API.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Оцените HSTS, CSP, nosniff, защиту от фрейминга, Referrer-Policy и Permissions-Policy.", en: "Review HSTS, CSP, nosniff, frame protection, Referrer-Policy, and Permissions-Policy." },
    ],
    supportedFeatures: [
      { ru: "Безопасная загрузка заголовков через backend с SSRF-защитой и лимитами редиректов.", en: "Safe header fetching through the backend with SSRF protection and redirect limits." },
      { ru: "Показывает итоговую оценку, уровень риска, найденные и отсутствующие заголовки.", en: "Shows the score, risk level, present headers, and missing headers." },
      { ru: "Даёт практическую рекомендацию по HTTPS, CSP, HSTS и browser hardening.", en: "Provides practical advice for HTTPS, CSP, HSTS, and browser hardening." },
    ],
    limitations: [
      { ru: "Инструмент проверяет один URL и не доказывает, что заголовки одинаково настроены на всём сайте.", en: "The tool checks one URL and does not prove that headers are consistent across the whole site." },
      { ru: "Он не проводит pentest и не анализирует фактическую уязвимость JavaScript-кода.", en: "It is not a pentest and does not analyze actual JavaScript vulnerabilities." },
    ],
    useCases: [
      { ru: "Проверить, не потерялись ли security headers после смены CDN, nginx, middleware или хостинга.", en: "Check whether security headers were lost after CDN, nginx, middleware, or hosting changes." },
      { ru: "Быстро понять, есть ли базовая защита от clickjacking, MIME sniffing и избыточной передачи referrer-данных.", en: "Quickly see whether basic protection exists against clickjacking, MIME sniffing, and excessive referrer leakage." },
      { ru: "Передать разработчику короткий список missing headers без ручного просмотра DevTools.", en: "Give a developer a compact missing-header list without manual DevTools inspection." },
    ],
    technicalNotes: [
      { ru: "Для результата используется статус, финальный URL после редиректов и HTTP response headers; тело страницы не скачивается.", en: "The result uses status, the final URL after redirects, and HTTP response headers; the page body is not downloaded." },
      { ru: "Frame protection считается найденной, если есть X-Frame-Options или CSP frame-ancestors.", en: "Frame protection is considered present when X-Frame-Options or CSP frame-ancestors is available." },
    ],
    faq: [
      { question: { ru: "Что делать с замечаниями к защитным заголовкам?", en: "What should I do with security header findings?" }, answer: { ru: "Откройте пояснение к каждому заголовку и передайте результат разработчику или администратору сервера. Подбирайте настройки под функции сайта и проверяйте изменения до публикации: некоторые ограничения могут мешать работе нужных ресурсов.", en: "Read each header's explanation and share the result with your developer or server administrator. Choose settings that fit the site and test changes before publishing, as restrictions may interfere with required resources." } },
      { question: { ru: "Все проверки пройдены. Значит, сайт защищён от взлома?", en: "If all checks pass, is the site protected against hacking?" }, answer: { ru: "Результат относится только к проверенным заголовкам ответа указанной страницы. Он не оценивает код приложения, пароли или все возможные уязвимости. Используйте его как одну из частей проверки безопасности сайта.", en: "The result covers only the checked response headers at the specified address. It does not assess application code, passwords, or every possible vulnerability. Use it as one part of your site's security review." } }
    ],
    relatedToolSlugs: ["redirect-chain-checker", "canonical-checker", "robots-txt-tester"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy", "https://developer.mozilla.org/docs/Web/HTTP/Headers/Strict-Transport-Security"],
  }),
  toolPage({
    slug: "canonical-checker",
    seoTitle: { ru: "Проверка canonical URL онлайн", en: "Canonical URL Checker" },
    metaDescription: { ru: "Проверьте link rel=canonical для страницы: наличие, совпадение с финальным URL, host, noindex и редиректы.", en: "Check a page link rel=canonical: presence, match with the final URL, host, noindex, and redirects." },
    h1: { ru: "Проверка canonical URL", en: "Canonical URL Checker" },
    lead: { ru: "Введите URL страницы, чтобы проверить canonical href, финальный адрес после редиректов, noindex-сигналы и совпадение с предпочтительным SEO-URL.", en: "Enter a page URL to check canonical href, the final URL after redirects, noindex signals, and alignment with the preferred SEO URL." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "Canonical href", en: "Canonical href" },
      { ru: "Final URL match", en: "Final URL match" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес страницы, которую нужно проверить на canonical.", en: "Paste the page address you need to check for canonicalization." },
      { ru: "Запустите проверку и дождитесь ответа WebDiag API.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Сравните canonical href, resolved canonical и финальный URL после редиректов.", en: "Compare canonical href, resolved canonical, and the final URL after redirects." },
    ],
    supportedFeatures: [
      { ru: "Безопасная загрузка HTML-страницы через backend с SSRF-защитой и лимитом размера ответа.", en: "Safe HTML page fetching through the backend with SSRF protection and response size limits." },
      { ru: "Извлекает первый link rel=canonical и резолвит относительный href относительно финального URL.", en: "Extracts the first link rel=canonical and resolves a relative href against the final URL." },
      { ru: "Показывает mismatch с final URL, host mismatch, noindex и количество редиректов.", en: "Shows final URL mismatch, host mismatch, noindex, and redirect count." },
    ],
    limitations: [
      { ru: "Инструмент проверяет одну страницу и не ищет canonical-конфликты по всему сайту.", en: "The tool checks one page and does not search for canonical conflicts across the whole site." },
      { ru: "JavaScript-rendered canonical, который появляется только после client-side hydration, в MVP не исполняется.", en: "JavaScript-rendered canonical tags that appear only after client-side hydration are not executed in this MVP." },
    ],
    useCases: [
      { ru: "Проверить, совпадает ли canonical с финальным URL после HTTPS, www/non-www или trailing slash редиректов.", en: "Check whether canonical matches the final URL after HTTPS, www/non-www, or trailing slash redirects." },
      { ru: "Найти страницы без canonical после миграции, смены шаблона или релиза CMS.", en: "Find pages without canonical after a migration, template change, or CMS release." },
      { ru: "Проверить, нет ли accidental noindex на важной посадочной странице.", en: "Check for accidental noindex on an important landing page." },
    ],
    technicalNotes: [
      { ru: "Сравнение URL нормализует host casing, default ports, trailing slash и fragment.", en: "URL comparison normalizes host casing, default ports, trailing slash, and fragments." },
      { ru: "Относительный canonical резолвится через финальный URL, но в рекомендациях помечается как менее надёжный.", en: "A relative canonical is resolved through the final URL, but the recommendation flags it as less robust." },
    ],
    faq: [
      { question: { ru: "Как понять, какой адрес страницы считается основным?", en: "How can I identify a page's preferred address?" }, answer: { ru: "Введите адрес страницы и посмотрите найденный canonical — указание предпочтительного адреса для поисковой системы. Сравните его с назначением страницы, редиректами и внутренними ссылками. Относительный адрес в разметке разрешается относительно страницы.", en: "Enter the page address and inspect its canonical, a preferred URL declaration for search engines. Compare it with the page's purpose, redirects, and internal links. Relative declarations are resolved against the page." } },
      { question: { ru: "Canonical ведёт на другую страницу. Это нужно исправлять?", en: "Should I fix a canonical pointing to another page?" }, answer: { ru: "Такое указание может быть намеренным для дублирующегося содержимого. Если текущая страница должна быть самостоятельной, проверьте настройку и другие сигналы индексации. Инструмент показывает объявленный адрес, но не решает, какую страницу поисковая система выберет основной.", en: "That can be intentional for duplicate content. If the current page should stand independently, review the setting and other indexing signals. The tool shows the declared address but cannot determine which URL a search engine will choose." } }
    ],
    relatedToolSlugs: ["redirect-chain-checker", "sitemap-validator", "robots-txt-tester"],
    sourceUrls: ["https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls", "https://developer.mozilla.org/docs/Web/HTML/Attributes/rel"],
  }),
  toolPage({
    slug: "robots-txt-tester",
    seoTitle: { ru: "Проверка robots.txt для URL", en: "Robots.txt Tester for a URL" },
    metaDescription: { ru: "Проверьте, доступен ли robots.txt, разрешён ли конкретный URL для user-agent и какие Sitemap directives объявлены.", en: "Check whether robots.txt is available, whether a specific URL is allowed for a user-agent, and which Sitemap directives are declared." },
    h1: { ru: "Проверка robots.txt", en: "Robots.txt Tester" },
    lead: { ru: "Введите URL и user-agent, чтобы понять, разрешён ли путь для поискового робота, какое правило сработало и есть ли Sitemap directives для ускорения индексации.", en: "Enter a URL and user-agent to see whether the path is allowed for a search crawler, which rule matched, and whether Sitemap directives are declared." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "Allow/Disallow", en: "Allow/Disallow" },
      { ru: "Sitemap directives", en: "Sitemap directives" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы, которую нужно проверить для индексации.", en: "Paste the page URL you need to test for crawling." },
      { ru: "Оставьте WebDiagBot или укажите другой user-agent, например Googlebot.", en: "Keep WebDiagBot or enter another user-agent, for example Googlebot." },
      { ru: "Проверьте статус robots.txt, matching rule и список Sitemap directives.", en: "Review robots.txt status, the matching rule, and the Sitemap directives list." },
    ],
    supportedFeatures: [
      { ru: "Безопасная загрузка /robots.txt с SSRF-защитой и лимитом размера ответа.", en: "Safe /robots.txt fetching with SSRF protection and response size limits." },
      { ru: "Проверка конкретного пути URL по Allow/Disallow для выбранного user-agent.", en: "Checks a specific URL path against Allow/Disallow rules for the selected user-agent." },
      { ru: "Показывает matched rule, количество Disallow rules и найденные Sitemap directives.", en: "Shows the matched rule, Disallow rule count, and discovered Sitemap directives." },
    ],
    limitations: [
      { ru: "Инструмент проверяет один URL и не сканирует весь сайт.", en: "The tool checks one URL and does not crawl the whole site." },
      { ru: "robots.txt управляет crawl-доступом, но сам по себе не гарантирует удаление страницы из индекса.", en: "robots.txt controls crawl access, but does not by itself guarantee that a page is removed from the index." },
    ],
    useCases: [
      { ru: "Проверить, не закрыта ли важная посадочная страница от поисковых роботов.", en: "Check whether an important landing page is blocked from search crawlers." },
      { ru: "Понять, какое правило robots.txt влияет на каталог, фильтр, блог или сервисную страницу.", en: "Find which robots.txt rule affects a catalog, filter, blog, or service page." },
      { ru: "Проверить, объявлен ли Sitemap после релиза, миграции или смены CMS.", en: "Verify Sitemap declarations after a release, migration, or CMS change." },
    ],
    technicalNotes: [
      { ru: "WebDiag строит URL /robots.txt от origin проверяемого адреса и анализирует файл существующим robots parser.", en: "WebDiag builds the /robots.txt URL from the tested address origin and analyzes it with the existing robots parser." },
      { ru: "Allow выигрывает у Disallow при равной специфичности, а более специфичное правило перекрывает более широкое.", en: "Allow wins over Disallow at equal specificity, and a more specific rule overrides a broader one." },
    ],
    faq: [
      { question: { ru: "Как проверить, разрешён ли роботу обход нужной страницы?", en: "How can I check whether a crawler may access a page?" }, answer: { ru: "Введите полный адрес страницы и имя робота, например Googlebot. WebDiag получит robots.txt этого сайта и сопоставит правила с путём страницы. Результат относится к обходу, а не к фактическому наличию страницы в поиске.", en: "Enter the complete page address and crawler name, such as Googlebot. WebDiag retrieves the site's robots.txt and matches its rules against the page path. This concerns crawling, not whether the page is in search results." } },
      { question: { ru: "Что означает недоступный robots.txt?", en: "What does an unavailable robots.txt mean?" }, answer: { ru: "Сначала посмотрите статус ответа и пояснение проверки: отсутствующий файл, ошибка сервера и сетевой сбой — разные случаи. Само сообщение о недоступности не доказывает, что сайт закрыт от индексации. Проверьте файл и повторите запрос после устранения ошибки.", en: "Review the response status and explanation first: a missing file, server error, and network failure are different cases. An unavailable result alone does not prove that the site is blocked from indexing. Inspect the file and retry after resolving the issue." } }
    ],
    relatedToolSlugs: ["redirect-chain-checker", "url-encoder-decoder", "json-formatter-validator"],
    sourceUrls: ["https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt", "https://www.rfc-editor.org/rfc/rfc9309"],
  }),
  toolPage({
    slug: "sitemap-validator",
    seoTitle: { ru: "Проверка sitemap.xml онлайн", en: "Sitemap.xml Validator" },
    metaDescription: { ru: "Проверьте доступность sitemap.xml, валидность XML, тип sitemap, количество URL и наличие важной страницы в файле.", en: "Check sitemap.xml availability, XML validity, sitemap type, URL count, and whether an important page is listed." },
    h1: { ru: "Проверка sitemap.xml", en: "Sitemap.xml Validator" },
    lead: { ru: "Введите sitemap.xml или адрес сайта, чтобы проверить статус файла, XML-структуру, количество URL и наличие конкретной посадочной страницы в sitemap.", en: "Enter a sitemap.xml or a site address to check file status, XML structure, URL count, and whether a specific landing page is listed." },
    quickFacts: [
      { ru: "Sitemap URL", en: "Sitemap URL" },
      { ru: "XML validation", en: "XML validation" },
      { ru: "Поиск URL", en: "URL lookup" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес sitemap.xml или любую страницу сайта — WebDiag попробует /sitemap.xml для этого домена.", en: "Paste a sitemap.xml address or any site page — WebDiag will try /sitemap.xml for that domain." },
      { ru: "При необходимости укажите целевой URL, который должен быть в sitemap.", en: "Optionally enter the target URL that should be listed in the sitemap." },
      { ru: "Проверьте статус, тип XML, количество URL и примеры найденных loc-адресов.", en: "Review status, XML type, URL count, and sample loc addresses." },
    ],
    supportedFeatures: [
      { ru: "Безопасная загрузка sitemap через backend с SSRF-защитой и лимитом размера ответа.", en: "Safe sitemap fetching through the backend with SSRF protection and response size limits." },
      { ru: "Определяет urlset и sitemapindex, показывает количество URL или дочерних sitemap.", en: "Detects urlset and sitemapindex, showing URL count or child sitemap count." },
      { ru: "Проверяет, присутствует ли выбранный целевой URL среди loc-адресов.", en: "Checks whether a selected target URL is present in the loc entries." },
    ],
    limitations: [
      { ru: "Инструмент проверяет один sitemap за запуск и не раскрывает все дочерние sitemap index автоматически.", en: "The tool checks one sitemap per run and does not recursively expand every sitemap index child." },
      { ru: "Это не crawler: он не доказывает, что все страницы сайта включены в sitemap.", en: "This is not a crawler: it does not prove that every page on the site is included in the sitemap." },
    ],
    useCases: [
      { ru: "Проверить, опубликован ли sitemap после релиза, миграции или смены CMS.", en: "Verify that a sitemap is published after a release, migration, or CMS change." },
      { ru: "Понять, попала ли важная коммерческая страница в sitemap discovery.", en: "Check whether an important commercial page is included for sitemap discovery." },
      { ru: "Найти очевидные XML-ошибки перед отправкой sitemap в поисковые системы.", en: "Find obvious XML errors before submitting a sitemap to search engines." },
    ],
    technicalNotes: [
      { ru: "Если введён не XML-файл, WebDiag строит /sitemap.xml от origin указанного URL.", en: "If the input is not an XML file, WebDiag builds /sitemap.xml from the input URL origin." },
      { ru: "Сравнение целевого URL нормализует регистр хоста, default ports и trailing slash.", en: "Target URL comparison normalizes host casing, default ports, and trailing slash." },
    ],
    faq: [
      { question: { ru: "Какой адрес нужен для проверки карты сайта?", en: "Which address should I enter to check a sitemap?" }, answer: { ru: "Можно указать прямой адрес XML-карты. Если ввести обычную страницу, инструмент проверит /sitemap.xml на том же сайте. Дополнительный адрес страницы нужен только если хотите узнать, присутствует ли она в проверяемой карте.", en: "You can enter the XML sitemap's direct address. Entering an ordinary page makes the tool check /sitemap.xml on that site. The additional page address is needed only to check whether that page appears in the sitemap." } },
      { question: { ru: "Будут ли проверены все страницы и дочерние карты?", en: "Will every page and child sitemap be checked?" }, answer: { ru: "Инструмент проверяет полученный XML и показывает найденные адреса. Для файла со списком карт дочерние карты не обходятся рекурсивно. Проверка карты также не означает, что каждая указанная страница доступна или проиндексирована.", en: "The tool checks the retrieved XML and shows discovered addresses. For a sitemap index, child sitemaps are not recursively fetched. A valid sitemap also does not prove every listed page is accessible or indexed." } }
    ],
    relatedToolSlugs: ["robots-txt-tester", "redirect-chain-checker", "url-encoder-decoder"],
    sourceUrls: ["https://www.sitemaps.org/protocol.html", "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview"],
  }),
  toolPage({
    slug: "bulk-http-status-checker",
    seoTitle: { ru: "Массовая проверка HTTP-статусов до 50 URL", en: "Bulk HTTP Status Checker for Up to 50 URLs" },
    metaDescription: { ru: "Проверьте HTTP-статусы, финальные URL и ошибки для списка до 50 адресов через backend WebDiag с SSRF-защитой.", en: "Check HTTP statuses, final URLs, and per-address errors for up to 50 URLs through the SSRF-protected WebDiag backend." },
    h1: { ru: "Массовая проверка HTTP-статусов", en: "Bulk HTTP Status Checker" },
    lead: { ru: "Вставьте до 50 HTTP(S) URL, чтобы получить упорядоченный результат по каждому адресу без скрытого сканирования сайта.", en: "Paste up to 50 HTTP(S) URLs to get an ordered result for each address without a hidden site crawl." },
    quickFacts: [
      { ru: "До 50 URL", en: "Up to 50 URLs" },
      { ru: "Пять одновременных запросов", en: "Five concurrent requests" },
      { ru: "Отдельные ошибки", en: "Isolated errors" },
    ],
    howToSteps: [
      { ru: "Вставьте URL по одному в строке.", en: "Paste one URL per line." },
      { ru: "Запустите проверку и дождитесь завершения ограниченной пачки.", en: "Run the check and wait for the bounded batch to finish." },
      { ru: "Разберите успешные статусы, редиректы и ошибки отдельных адресов.", en: "Review successful statuses, redirects, and per-address errors." },
    ],
    supportedFeatures: [
      { ru: "Сохраняет исходный порядок и возвращает результат для каждого введённого URL.", en: "Preserves input order and returns one result for every submitted URL." },
      { ru: "Показывает финальный URL, HTTP-статус, количество редиректов и доступные заголовки ответа.", en: "Shows the final URL, HTTP status, redirect count, and available response headers." },
      { ru: "Изолирует ошибки URL: один недоступный или запрещённый адрес не отменяет всю пачку.", en: "Isolates URL failures so one unavailable or rejected address does not cancel the batch." },
    ],
    limitations: [
      { ru: "Инструмент проверяет только явно введённые URL и не ищет ссылки на сайте.", en: "The tool checks only submitted URLs and does not discover links across a site." },
      { ru: "Тело страницы не скачивается и содержимое HTML не анализируется.", en: "Page bodies are not downloaded and HTML content is not analyzed." },
    ],
    useCases: [
      { ru: "Проверить список посадочных страниц после миграции или релиза.", en: "Check a list of landing pages after a migration or release." },
      { ru: "Найти 404 и 5xx в подготовленном наборе важных URL.", en: "Find 404 and 5xx responses in a prepared set of important URLs." },
      { ru: "Сверить финальные адреса после настройки массовых редиректов.", en: "Verify final destinations after configuring a redirect batch." },
    ],
    technicalNotes: [
      { ru: "Каждый URL проходит backend-проверку публичного HTTP(S) адреса, DNS/IP policy и peer verification.", en: "Every URL passes backend public HTTP(S), DNS/IP policy, and connected-peer verification." },
      { ru: "Backend выполняет не более пяти проверок одновременно и ограничивает пачку 50 URL.", en: "The backend runs no more than five checks concurrently and caps each batch at 50 URLs." },
    ],
    faq: [
      { question: { ru: "Как проверить сразу несколько адресов?", en: "How can I check several addresses at once?" }, answer: { ru: "Вставьте до 50 HTTP- или HTTPS-адресов, каждый с новой строки. Для каждого появится собственный результат: статус ответа, редиректы либо ошибка запроса. Автоматический поиск дополнительных страниц не выполняется.", en: "Paste up to 50 HTTP or HTTPS addresses, one per line. Each gets its own result with response status, redirects, or a request error. The tool does not automatically discover additional pages." } },
      { question: { ru: "Почему часть адресов проверена, а часть завершилась ошибкой?", en: "Why do some addresses succeed while others fail?" }, answer: { ru: "Запросы обрабатываются независимо. Для проблемной строки проверьте адрес и пояснение: сервер может быть недоступен либо адрес не подходит для публичной проверки. Ошибка одной строки не означает, что остальные результаты недействительны.", en: "Addresses are processed independently. Check the affected address and explanation: the server may be unreachable or unsuitable for a public check. One failed row does not invalidate the remaining results." } }
    ],
    relatedToolSlugs: ["redirect-chain-checker", "broken-link-checker", "redirect-map-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Status", "https://developer.mozilla.org/docs/Web/HTTP/Redirections"],
  }),

  toolPage({
    slug: "redirect-chain-checker",
    seoTitle: { ru: "Проверка HTTP-статуса и цепочки редиректов", en: "HTTP Status & Redirect Chain Checker" },
    metaDescription: { ru: "Проверьте HTTP-статус, финальный URL, content-type и цепочку редиректов для одной страницы через безопасный WebDiag API.", en: "Check the HTTP status, final URL, content type, and redirect chain for a single page through the safe WebDiag API." },
    h1: { ru: "Проверка HTTP-статуса и редиректов", en: "HTTP Status & Redirect Chain Checker" },
    lead: { ru: "Введите URL, чтобы увидеть статус ответа, финальный адрес после редиректов и цепочку переходов, которая влияет на SEO, индексацию и пользовательский путь.", en: "Enter a URL to inspect its response status, final address after redirects, and the redirect chain that affects SEO, indexing, and user flow." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "HTTP status", en: "HTTP status" },
      { ru: "Цепочка редиректов", en: "Redirect chain" },
    ],
    howToSteps: [
      { ru: "Вставьте полный адрес страницы или домен.", en: "Paste a full page address or a domain." },
      { ru: "Запустите проверку и дождитесь ответа WebDiag API.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Проверьте финальный URL, статус ответа и лишние переходы в цепочке.", en: "Review the final URL, response status, and unnecessary hops in the chain." },
    ],
    supportedFeatures: [
      { ru: "Показ финального HTTP-статуса после безопасной обработки редиректов.", en: "Final HTTP status after safe redirect handling." },
      { ru: "Отображение каждого redirect hop: исходный URL, целевой URL и status code.", en: "Each redirect hop: source URL, target URL, and status code." },
      { ru: "Краткая сводка по content-type, content-length, cache-control и server header, если они есть.", en: "A compact summary of content-type, content-length, cache-control, and server header when present." },
    ],
    limitations: [
      { ru: "Инструмент проверяет один URL за запуск и не является crawler для всего сайта.", en: "The tool checks one URL per run and is not a full-site crawler." },
      { ru: "Содержимое страницы не анализируется: цель инструмента — статус, заголовки и редиректы.", en: "Page content is not analyzed: this tool focuses on status, headers, and redirects." },
    ],
    useCases: [
      { ru: "Проверить, не ведёт ли важная посадочная страница через лишние 301/302 переходы.", en: "Check whether an important landing page goes through unnecessary 301/302 hops." },
      { ru: "Найти 404, 500 или временные редиректы в ссылках, которые влияют на SEO и рекламу.", en: "Find 404, 500, or temporary redirects in URLs that affect SEO and paid traffic." },
      { ru: "Проверить финальный URL после смены домена, HTTPS, слэша или canonical redirect.", en: "Verify the final URL after a domain, HTTPS, trailing-slash, or canonical redirect change." },
    ],
    technicalNotes: [
      { ru: "Запрос выполняется через backend WebDiag с SSRF-защитой, DNS/IP policy и ограничением редиректов.", en: "The request runs through the WebDiag backend with SSRF protection, DNS/IP policy, and redirect limits." },
      { ru: "Финальное тело ответа не скачивается для результата инструмента; используются статус, заголовки и redirect metadata.", en: "The final response body is not downloaded for the tool result; status, headers, and redirect metadata are used." },
    ],
    faq: [
      { question: { ru: "Как узнать, куда ведёт старый адрес страницы?", en: "How can I see where an old page address leads?" }, answer: { ru: "Введите исходный адрес. Отчёт покажет последовательность перенаправлений, их статусы и конечный адрес. Проверьте, что посетитель попадает на нужную страницу без лишних промежуточных переходов.", en: "Enter the original address. The report shows the redirect sequence, response statuses, and final destination. Check that visitors reach the intended page without unnecessary intermediate redirects." } },
      { question: { ru: "Почему браузер открывает страницу, а проверка сообщает об ошибке?", en: "Why does my browser open a page while the check reports an error?" }, answer: { ru: "Сервер может по-разному отвечать посетителю и автоматической проверке. Изучите ошибку, ограничения цепочки и доступность конечного адреса. WebDiag проверяет HTTP-переходы; перенаправления через JavaScript не выполняются.", en: "A server can respond differently to a visitor and an automated check. Review the error, chain limits, and final address availability. WebDiag follows HTTP redirects; it does not execute JavaScript redirects." } }
    ],
    relatedToolSlugs: ["url-encoder-decoder", "json-formatter-validator", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Status", "https://developer.mozilla.org/docs/Web/HTTP/Redirections"],
  }),

  toolPage({
    slug: "heading-structure-checker",
    seoTitle: { ru: "Проверка структуры заголовков H1–H6", en: "Heading Structure Checker" },
    metaDescription: { ru: "Проверьте H1–H6 outline страницы: количество H1, пропуски уровней, пустые заголовки и рекомендации по семантической структуре.", en: "Check a page H1–H6 outline: H1 count, skipped levels, empty headings, and semantic structure recommendations." },
    h1: { ru: "Проверка структуры заголовков", en: "Heading Structure Checker" },
    lead: { ru: "Введите URL страницы, чтобы проверить всю структуру заголовков. H1 здесь является подпроверкой, а не отдельным слабым инструментом.", en: "Enter a page URL to check the full heading structure. H1 is treated as one subcheck, not as a weak standalone tool." },
    quickFacts: [
      { ru: "H1–H6 outline", en: "H1–H6 outline" },
      { ru: "Пропуски уровней", en: "Skipped levels" },
      { ru: "Static HTML", en: "Static HTML" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag загрузит HTML и извлечёт h1–h6 заголовки.", en: "WebDiag loads the HTML and extracts h1–h6 headings." },
      { ru: "Проверьте H1, иерархию, пустые headings и рекомендации.", en: "Review H1, hierarchy, empty headings, and recommendations." },
    ],
    supportedFeatures: [
      { ru: "Показывает общий outline страницы, а не только один H1.", en: "Shows the full page outline, not just one H1." },
      { ru: "Фиксирует пропуски уровней: например, переход H1 → H3.", en: "Flags skipped levels such as H1 → H3." },
      { ru: "Использует безопасную backend-загрузку с SSRF-защитой.", en: "Uses safe backend fetching with SSRF protection." },
    ],
    limitations: [
      { ru: "Static HTML scan не видит заголовки, добавленные JavaScript после загрузки.", en: "Static HTML scan does not see headings inserted by JavaScript after load." },
      { ru: "Инструмент не оценивает смысл текста как поисковый алгоритм.", en: "The tool does not judge text meaning as a search algorithm." },
    ],
    useCases: [
      { ru: "Проверить SEO-структуру посадочной страницы перед релизом.", en: "Check landing-page SEO structure before release." },
      { ru: "Найти пустые или перескакивающие заголовки в шаблоне CMS.", en: "Find empty or skipped headings in a CMS template." },
      { ru: "Подготовить content fixes для UX, SEO и accessibility.", en: "Prepare content fixes for UX, SEO, and accessibility." },
    ],
    technicalNotes: [
      { ru: "H1 не вынесен в отдельный микротул; это одна проверка внутри aggregate outline tool.", en: "H1 is not a separate microtool; it is one check inside an aggregate outline tool." },
      { ru: "Результат ограничен одной страницей и static HTML.", en: "The result is limited to one page and static HTML." },
    ],
    faq: [
      { question: { ru: "Как проверить порядок заголовков на странице?", en: "How can I check a page's heading order?" }, answer: { ru: "Укажите адрес и изучите найденные H1–H6 в порядке их появления в HTML. Проверьте пустые заголовки, пропуски уровней и связь структуры с содержанием. Визуальный размер текста сам по себе не определяет уровень заголовка.", en: "Enter the address and review detected H1–H6 headings in HTML order. Check empty headings, skipped levels, and whether the structure matches the content. Visual text size alone does not define a heading level." } },
      { question: { ru: "Инструмент проверит, правильно ли написаны заголовки?", en: "Will the tool assess whether headings are well written?" }, answer: { ru: "Он показывает структуру и выбранные технические замечания. Понятность формулировок и соответствие теме нужно оценить по самой странице. Заголовки, добавляемые только JavaScript, могут отсутствовать в результате.", en: "It shows the structure and selected technical findings. Review the actual page to assess wording and relevance. Headings added only by JavaScript may be missing from the result." } }
    ],
    relatedToolSlugs: ["meta-tags-checker", "readability-analyzer", "keyword-density-analyzer"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTML/Element/Heading_Elements"],
  }),
  toolPage({
    slug: "keyword-density-analyzer",
    seoTitle: { ru: "Анализ частоты слов и фраз", en: "Keyword and Phrase Frequency Analyzer" },
    metaDescription: { ru: "Проанализируйте видимый текст страницы: частые слова, биграммы, триграммы, плотность терминов и возможный переспам.", en: "Analyze visible page text: frequent words, bigrams, trigrams, term density, and possible overuse." },
    h1: { ru: "Анализ частоты слов и фраз", en: "Keyword and Phrase Frequency Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы увидеть распределение терминов. Инструмент не обещает магический SEO-рейтинг, а показывает evidence для редакторского аудита.", en: "Enter a page URL to see term distribution. The tool does not promise magic SEO ranking; it provides evidence for editorial review." },
    quickFacts: [
      { ru: "Words", en: "Words" },
      { ru: "Bigrams/trigrams", en: "Bigrams/trigrams" },
      { ru: "Overuse signals", en: "Overuse signals" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag извлечёт видимый текст без script/style блоков.", en: "WebDiag extracts visible text without script/style blocks." },
      { ru: "Проверьте частые слова, фразы и возможный переспам.", en: "Review frequent words, phrases, and possible overuse." },
    ],
    supportedFeatures: [
      { ru: "Считает частотность слов, биграмм и триграмм.", en: "Counts words, bigrams, and trigrams." },
      { ru: "Использует базовые RU/EN stopword-фильтры.", en: "Uses basic RU/EN stopword filters." },
      { ru: "Показывает плотность терминов без обещаний ранжирования.", en: "Shows term density without ranking promises." },
    ],
    limitations: [
      { ru: "Не заменяет семантический анализ и не знает интент поисковой выдачи.", en: "Does not replace semantic analysis and does not know SERP intent." },
      { ru: "JS-injected content не входит в static HTML scan.", en: "JS-injected content is not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Найти переспам после SEO-правок текста.", en: "Find overuse after SEO copy edits." },
      { ru: "Проверить, совпадает ли фактический текст с темой страницы.", en: "Check whether visible text matches the page topic." },
      { ru: "Подготовить редакционные рекомендации для посадочной страницы.", en: "Prepare editorial recommendations for a landing page." },
    ],
    technicalNotes: [
      { ru: "Density считается от общего количества слов в видимом тексте.", en: "Density is calculated against total visible-text word count." },
      { ru: "Это content audit signal, а не ranking-factor simulator.", en: "This is a content audit signal, not a ranking-factor simulator." },
    ],
    faq: [
      { question: { ru: "Как найти слова, которые повторяются слишком часто?", en: "How can I find words repeated too often?" }, answer: { ru: "Введите адрес страницы и изучите частотность слов и фраз в полученном тексте. Затем прочитайте отмеченные фрагменты: повтор может быть уместным термином или признаком перегруженного текста. Решение о правке зависит от контекста.", en: "Enter the page address and review word and phrase frequencies in the retrieved text. Then read the relevant passages: repetition may be appropriate terminology or a sign of awkward writing. Decide in context." } },
      { question: { ru: "Какая плотность ключевых слов гарантирует продвижение?", en: "Which keyword density guarantees better rankings?" }, answer: { ru: "Универсального процента, который гарантирует позиции, нет. Показатель помогает заметить повторы и сравнить варианты текста, но не заменяет оценку его полезности и соответствия запросу. Не добавляйте слова только ради числа в отчёте.", en: "No universal percentage guarantees rankings. The metric helps identify repetition and compare text versions, but it does not replace reviewing usefulness and query relevance. Do not add words merely to reach a report number." } }
    ],
    relatedToolSlugs: ["heading-structure-checker", "readability-analyzer", "meta-tags-checker"],
    sourceUrls: ["https://developers.google.com/search/docs/fundamentals/creating-helpful-content"],
  }),
  toolPage({
    slug: "readability-analyzer",
    seoTitle: { ru: "Анализ читабельности текста", en: "Readability Analyzer" },
    metaDescription: { ru: "Проверьте объём текста, предложения, абзацы, длинные фразы, время чтения и мультиязычную эвристическую оценку читабельности.", en: "Check text volume, sentences, paragraphs, long phrases, reading time, and a multilingual heuristic readability score." },
    h1: { ru: "Анализ читабельности", en: "Readability Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы оценить, насколько текст легко читать и сканировать. Инструмент честно использует мультиязычные эвристики, а не притворяется точной формулой для всех языков.", en: "Enter a page URL to estimate how easy the text is to read and scan. The tool honestly uses multilingual heuristics rather than pretending one exact formula fits every language." },
    quickFacts: [
      { ru: "Reading time", en: "Reading time" },
      { ru: "Long sentences", en: "Long sentences" },
      { ru: "Multilingual heuristic", en: "Multilingual heuristic" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag извлечёт видимый текст и разобьёт его на слова и предложения.", en: "WebDiag extracts visible text and splits it into words and sentences." },
      { ru: "Проверьте score, длинные предложения, объём и рекомендации.", en: "Review score, long sentences, volume, and recommendations." },
    ],
    supportedFeatures: [
      { ru: "Считает слова, предложения, абзацы и примерное время чтения.", en: "Counts words, sentences, paragraphs, and estimated reading time." },
      { ru: "Фиксирует длинные предложения, мешающие сканированию.", en: "Flags long sentences that hurt scanning." },
      { ru: "Показывает честный heuristic score 0–100.", en: "Shows an honest heuristic 0–100 score." },
    ],
    limitations: [
      { ru: "Это не академическая формула для конкретного языка и не оценка смысла текста.", en: "This is not an academic formula for a specific language and not a meaning assessment." },
      { ru: "Текст, добавленный JavaScript, не входит в static HTML scan.", en: "Text inserted by JavaScript is not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Проверить коммерческий текст перед публикацией.", en: "Check commercial copy before publishing." },
      { ru: "Найти слишком длинные фразы и плотные абзацы.", en: "Find overly long sentences and dense paragraphs." },
      { ru: "Подготовить UX/copy recommendations для SEO-аудита.", en: "Prepare UX/copy recommendations for an SEO audit." },
    ],
    technicalNotes: [
      { ru: "Score основан на длине предложений, длине слов и количестве длинных предложений.", en: "The score is based on sentence length, word length, and long-sentence count." },
      { ru: "Формула помечена как multilingual heuristic, чтобы не выдавать её за точный Flesch-score.", en: "The formula is labeled as multilingual heuristic rather than a precise Flesch score." },
    ],
    faq: [
      { question: { ru: "Что поможет понять оценка читабельности?", en: "What can a readability result help me understand?" }, answer: { ru: "Инструмент считает признаки текста, например длину предложений и абзацев, и помогает заметить перегруженные места. Используйте результат как подсказку для редактирования, затем перечитайте текст с учётом знаний вашей аудитории.", en: "The tool counts features such as sentence and paragraph length to help spot dense passages. Use it as editing guidance, then reread the text with your audience's knowledge in mind." } },
      { question: { ru: "Подходит ли проверка для русского текста и профессиональных статей?", en: "Can I use it for Russian text and specialist articles?" }, answer: { ru: "Результат можно использовать для оценки структуры русского текста, но это приблизительные признаки, а не проверка понимания читателем. Сложный термин может быть необходим специалисту. Инструмент не проверяет факты и смысл статьи.", en: "It can help review Russian text structure, but these are approximate indicators rather than a test of reader understanding. A specialist term may be necessary for the audience. The tool does not fact-check or assess the article's meaning." } }
    ],
    relatedToolSlugs: ["keyword-density-analyzer", "heading-structure-checker", "meta-tags-checker"],
    sourceUrls: ["https://developers.google.com/search/docs/fundamentals/creating-helpful-content"],
  }),

  toolPage({
    slug: "indexability-checker",
    seoTitle: { ru: "Проверка индексируемости страницы", en: "Page Indexability Checker" },
    metaDescription: { ru: "Проверьте HTTP status, robots.txt, meta robots, X-Robots-Tag, canonical и redirects как единый indexability audit.", en: "Check HTTP status, robots.txt, meta robots, X-Robots-Tag, canonical, and redirects as one indexability audit." },
    h1: { ru: "Проверка индексируемости страницы", en: "Page Indexability Checker" },
    lead: { ru: "Введите URL, чтобы увидеть, нет ли жёстких блокировок индексации: noindex, robots.txt disallow, X-Robots-Tag, проблемного canonical или неуспешного HTTP status.", en: "Enter a URL to see whether hard indexability blockers exist: noindex, robots.txt disallow, X-Robots-Tag, problematic canonical, or unsuccessful HTTP status." },
    quickFacts: [
      { ru: "robots.txt", en: "robots.txt" },
      { ru: "Meta/X-Robots", en: "Meta/X-Robots" },
      { ru: "Canonical", en: "Canonical" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag загрузит HTML и robots.txt через safe fetch.", en: "WebDiag fetches HTML and robots.txt through safe fetch." },
      { ru: "Проверьте hard blockers, warnings и итоговый indexable candidate signal.", en: "Review hard blockers, warnings, and the final indexable candidate signal." },
    ],
    supportedFeatures: [
      { ru: "Проверяет HTTP status, redirect count, robots.txt allow/disallow и noindex-сигналы.", en: "Checks HTTP status, redirect count, robots.txt allow/disallow, and noindex signals." },
      { ru: "Сравнивает canonical с финальным URL после redirects.", en: "Compares canonical with the final URL after redirects." },
      { ru: "Не делает вид, что знает фактическую индексацию поисковика: это technical candidate check.", en: "Does not pretend to know actual search-engine indexing: this is a technical candidate check." },
    ],
    limitations: [
      { ru: "Фактическое наличие страницы в индексе Google/Яндекс не проверяется.", en: "Actual Google/Yandex index presence is not checked." },
      { ru: "JS-runtime изменения robots/canonical не входят в static HTML scan.", en: "JS-runtime robots/canonical changes are not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Проверить посадочную страницу перед публикацией.", en: "Check a landing page before publishing." },
      { ru: "Найти случайный noindex после релиза.", en: "Find accidental noindex after a release." },
      { ru: "Проверить, не канонизируется ли страница на другой URL.", en: "Check whether the page canonicalizes to another URL." },
    ],
    technicalNotes: [
      { ru: "Robots.txt анализ использует тот же parser allow/disallow precedence, что и audit engine.", en: "Robots.txt analysis uses the same allow/disallow precedence parser as the audit engine." },
      { ru: "Инструмент возвращает indexable_candidate, а не гарантированный search index state.", en: "The tool returns indexable_candidate, not guaranteed search index state." },
    ],
    faq: [
      { question: { ru: "Как проверить, нет ли запрета на индексацию страницы?", en: "How can I check whether a page has an indexing restriction?" }, answer: { ru: "Введите адрес страницы. Отчёт покажет найденные технические указания, например запрет noindex или canonical на другой адрес. Сравните их с назначением страницы и исправляйте только нежелательные ограничения.", en: "Enter the page address. The report shows detected technical signals, such as noindex or a canonical pointing elsewhere. Compare them with the page's purpose and correct only unintended restrictions." } },
      { question: { ru: "Если ограничений нет, страница уже находится в Google или Яндексе?", en: "If no restrictions are found, is the page already in Google or Yandex?" }, answer: { ru: "Это отдельный вопрос: поисковая система сама решает, включать ли страницу в индекс. Проверка WebDiag не запрашивает фактический статус индексации у поисковика. Для своего сайта уточняйте его в Google Search Console или Яндекс Вебмастере.", en: "Index inclusion is a separate decision made by the search engine. This WebDiag check does not retrieve actual indexing status from it. Use Google Search Console or Yandex Webmaster to confirm the status of your own site." } }
    ],
    relatedToolSlugs: ["canonical-checker", "robots-txt-tester", "meta-tags-checker"],
    sourceUrls: ["https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag"],
  }),
  toolPage({
    slug: "hreflang-checker",
    seoTitle: { ru: "Проверка hreflang-разметки", en: "Hreflang Checker" },
    metaDescription: { ru: "Проверьте alternate hreflang, x-default, self-reference, дубли языковых кодов и структурные ошибки international SEO.", en: "Check alternate hreflang, x-default, self-reference, duplicate language codes, and structural international SEO issues." },
    h1: { ru: "Проверка hreflang", en: "Hreflang Checker" },
    lead: { ru: "Введите URL мультиязычной страницы, чтобы проверить hreflang-ссылки в HTML: языковые коды, x-default, self-reference и дубли.", en: "Enter a multilingual page URL to inspect HTML hreflang links: language codes, x-default, self-reference, and duplicates." },
    quickFacts: [
      { ru: "alternate links", en: "alternate links" },
      { ru: "x-default", en: "x-default" },
      { ru: "self-reference", en: "self-reference" },
    ],
    howToSteps: [
      { ru: "Вставьте URL одной языковой версии.", en: "Paste the URL of one language version." },
      { ru: "WebDiag соберёт link rel=alternate hreflang из static HTML.", en: "WebDiag collects link rel=alternate hreflang from static HTML." },
      { ru: "Проверьте валидность кодов, x-default, дубли и self-reference.", en: "Review language-code validity, x-default, duplicates, and self-reference." },
    ],
    supportedFeatures: [
      { ru: "Проверяет x-default, self-reference и дубли hreflang значений.", en: "Checks x-default, self-reference, and duplicate hreflang values." },
      { ru: "Нормализует relative href относительно final URL.", en: "Normalizes relative href values against the final URL." },
      { ru: "Показывает html lang как дополнительный contextual signal.", en: "Shows html lang as an additional contextual signal." },
    ],
    limitations: [
      { ru: "Не проверяет reciprocal links на всех альтернативных страницах — это задача crawler/full-site слоя.", en: "Does not verify reciprocal links on every alternate page; that belongs to the crawler/full-site layer." },
      { ru: "JS-injected hreflang не входит в static HTML scan.", en: "JS-injected hreflang is not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Проверить international landing pages перед релизом.", en: "Check international landing pages before release." },
      { ru: "Найти дубли en/en-US или ошибочные language-region коды.", en: "Find duplicated en/en-US or invalid language-region codes." },
      { ru: "Проверить наличие x-default для глобального выбора языка.", en: "Check x-default for a global language selector." },
    ],
    technicalNotes: [
      { ru: "Language tag validation намеренно structural; поисковые reciprocity правила проверяются будущим crawler batch.", en: "Language tag validation is intentionally structural; search reciprocity rules require a future crawler batch." },
      { ru: "Инструмент не делает сетевых запросов ко всем alternate href, чтобы не превращаться в crawler.", en: "The tool does not request every alternate href to avoid becoming a crawler." },
    ],
    faq: [
      { question: { ru: "Когда сайту нужна разметка hreflang?", en: "When does a site need hreflang markup?" }, answer: { ru: "Она помогает указать языковые или региональные варианты одной страницы. Если у сайта есть такие версии, введите адрес и проверьте найденные ссылки и коды языков. Для обычной страницы на одном языке она, как правило, не нужна.", en: "It identifies language or regional versions of a page. If your site has those versions, enter an address and review detected links and language codes. An ordinary page with only one language generally does not need it." } },
      { question: { ru: "Подтверждает ли проверка правильность всех языковых версий?", en: "Does this validate every language version?" }, answer: { ru: "Проверяется разметка полученной страницы. Ответные ссылки на других версиях и соответствие переведённого содержимого нужно проверить дополнительно. Успешный результат одной страницы не подтверждает всю структуру многоязычного сайта.", en: "It inspects the retrieved page's markup. Check return links on other versions and translated content separately. A successful single-page result does not validate the whole multilingual site structure." } }
    ],
    relatedToolSlugs: ["indexability-checker", "canonical-checker", "sitemap-validator"],
    sourceUrls: ["https://developers.google.com/search/docs/specialty/international/localized-versions"],
  }),
  toolPage({
    slug: "technology-detector",
    seoTitle: { ru: "Определение технологий сайта", en: "Website Technology Detector" },
    metaDescription: { ru: "Определите CMS, frontend-фреймворки, CDN, hosting, analytics и server headers по безопасному static HTML scan и HTTP headers.", en: "Detect CMS, frontend frameworks, CDN, hosting, analytics, and server headers through safe static HTML scan and HTTP headers." },
    h1: { ru: "Определение технологий сайта", en: "Website Technology Detector" },
    lead: { ru: "Введите URL, чтобы получить технологический профиль сайта по HTTP-заголовкам, generator meta, asset paths и безопасным static HTML fingerprints.", en: "Enter a URL to get a technology profile from HTTP headers, generator meta, asset paths, and safe static HTML fingerprints." },
    quickFacts: [
      { ru: "CMS/framework", en: "CMS/framework" },
      { ru: "CDN/hosting", en: "CDN/hosting" },
      { ru: "Headers/assets", en: "Headers/assets" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "WebDiag проверит HTML и HTTP headers без выполнения JavaScript.", en: "WebDiag inspects HTML and HTTP headers without executing JavaScript." },
      { ru: "Проверьте detected technologies, confidence и evidence.", en: "Review detected technologies, confidence, and evidence." },
    ],
    supportedFeatures: [
      { ru: "Определяет WordPress, Drupal, Joomla, Shopify, Wix, Tilda, Webflow и common frameworks по fingerprints.", en: "Detects WordPress, Drupal, Joomla, Shopify, Wix, Tilda, Webflow, and common frameworks by fingerprints." },
      { ru: "Показывает CDN/hosting/server signals из response headers.", en: "Shows CDN/hosting/server signals from response headers." },
      { ru: "Каждый сигнал имеет confidence и evidence.", en: "Every signal includes confidence and evidence." },
    ],
    limitations: [
      { ru: "Это static detector, не полноценный Wappalyzer-клон и не browser runtime scan.", en: "This is a static detector, not a full Wappalyzer clone or browser runtime scan." },
      { ru: "Современные build pipelines могут скрывать или переименовывать fingerprints.", en: "Modern build pipelines may hide or rename fingerprints." },
    ],
    useCases: [
      { ru: "Быстро понять стек сайта перед аудитом.", en: "Quickly understand a site stack before an audit." },
      { ru: "Обнаружить CDN/hosting headers для performance/security review.", en: "Find CDN/hosting headers for performance/security review." },
      { ru: "Собрать context для дальнейших рекомендаций по CMS и frontend.", en: "Collect context for later CMS and frontend recommendations." },
    ],
    technicalNotes: [
      { ru: "Инструмент не отправляет HTML сторонним fingerprint-провайдерам.", en: "The tool does not send HTML to third-party fingerprint providers." },
      { ru: "Low-confidence detections требуют ручной проверки.", en: "Low-confidence detections require manual review." },
    ],
    faq: [
      { question: { ru: "Как узнать, на какой системе работает сайт?", en: "How can I identify the system behind a site?" }, answer: { ru: "Введите адрес страницы. Инструмент сопоставит признаки в HTML и ответе сервера с известными технологиями и покажет обнаруженные совпадения. Используйте результат как отправную точку, а важные выводы подтвердите у владельца или разработчика.", en: "Enter the page address. The tool matches HTML and server response clues against known technologies and shows detections. Use them as a starting point and confirm important conclusions with the owner or developer." } },
      { question: { ru: "Почему известная мне технология не определилась?", en: "Why was a technology I know about not detected?" }, answer: { ru: "Сайт может скрывать признаки, а часть компонентов появляется только при работе JavaScript. Отсутствие в списке не доказывает, что технология не используется. По такому отчёту также нельзя сделать полный вывод о безопасности сайта.", en: "The site may hide its clues, and some components appear only when JavaScript runs. Absence from the list does not prove the technology is unused. The report also cannot establish the site's overall security." } }
    ],
    relatedToolSlugs: ["security-headers-checker", "page-weight-analyzer", "core-web-vitals-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Headers/Server"],
  }),

  toolPage({
    slug: "robots-txt-generator",
    seoTitle: { ru: "Генератор robots.txt", en: "Robots.txt Generator" },
    metaDescription: { ru: "Соберите robots.txt из явных правил: User-agent, Allow, Disallow, Sitemap и Crawl-delay без обращения к сайту.", en: "Build robots.txt from explicit rules: User-agent, Allow, Disallow, Sitemap, and Crawl-delay without fetching the site." },
    h1: { ru: "Генератор robots.txt", en: "Robots.txt Generator" },
    lead: { ru: "Сформируйте robots.txt вручную из подтверждённых правил. Инструмент не сканирует сайт и не выдумывает закрытые разделы.", en: "Create robots.txt manually from confirmed rules. The tool does not crawl the site or invent private sections." },
    quickFacts: [
      { ru: "Browser-only", en: "Browser-only" },
      { ru: "Allow/Disallow", en: "Allow/Disallow" },
      { ru: "Sitemap directive", en: "Sitemap directive" },
    ],
    howToSteps: [
      { ru: "Укажите user-agent и правила Allow/Disallow.", en: "Enter the user-agent and Allow/Disallow rules." },
      { ru: "Добавьте Sitemap URL и Crawl-delay только если это реально нужно.", en: "Add Sitemap URL and Crawl-delay only when actually needed." },
      { ru: "Скопируйте файл и проверьте его через Robots.txt Tester после публикации.", en: "Copy the file and verify it with Robots.txt Tester after publishing." },
    ],
    supportedFeatures: [
      { ru: "Нормализует относительные пути к /path.", en: "Normalizes relative paths to /path." },
      { ru: "Проверяет, что Sitemap является HTTP(S) URL.", en: "Checks that Sitemap is an HTTP(S) URL." },
      { ru: "Работает полностью в браузере без отправки правил на backend.", en: "Runs fully in the browser without sending rules to the backend." },
    ],
    limitations: [
      { ru: "Инструмент не знает структуру вашего сайта и не заменяет SEO-стратегию индексации.", en: "The tool does not know your site structure and does not replace indexing strategy." },
      { ru: "После публикации файл нужно проверить тестером robots.txt на фактическом домене.", en: "After publishing, verify the file with the robots.txt tester on the real domain." },
    ],
    useCases: [
      { ru: "Подготовить базовый robots.txt для нового сайта.", en: "Prepare a basic robots.txt for a new site." },
      { ru: "Быстро собрать безопасный шаблон для staging/служебных разделов.", en: "Quickly build a safe template for staging or utility sections." },
      { ru: "Добавить Sitemap directive без ручной ошибки синтаксиса.", en: "Add a Sitemap directive without syntax mistakes." },
    ],
    technicalNotes: [
      { ru: "Generator intentionally deterministic: output зависит только от введённых полей.", en: "The generator is intentionally deterministic: output depends only on entered fields." },
      { ru: "Это не crawler и не robots policy adviser.", en: "This is not a crawler and not a robots policy adviser." },
    ],
    faq: [
      { question: { ru: "Какие данные нужны для создания robots.txt?", en: "What information do I need to create robots.txt?" }, answer: { ru: "Укажите имя робота, пути, которые нужно разрешить или запретить, и при необходимости адрес карты сайта. Генератор соберёт текст только из заданных правил. Он не изучает структуру сайта и не выбирает закрываемые разделы за вас.", en: "Specify the crawler name, paths to allow or disallow, and a sitemap address if needed. The generator builds text from those rules. It does not inspect your site or decide which sections to block." } },
      { question: { ru: "Что сделать после создания файла?", en: "What should I do after generating the file?" }, answer: { ru: "Разместите robots.txt в корне нужного сайта и проверьте правила для важных страниц отдельным тестером. Особенно внимательно проверьте запрет всего сайта. Сгенерированный текст сам по себе ничего не меняет на сервере.", en: "Place robots.txt at the root of the intended site and test the rules for important pages with the separate checker. Pay particular attention to rules blocking the whole site. Generated text does not change your server by itself." } }
    ],
    relatedToolSlugs: ["robots-txt-tester", "sitemap-generator", "indexability-checker"],
    sourceUrls: ["https://developers.google.com/search/docs/crawling-indexing/robots/intro"],
  }),
  toolPage({
    slug: "sitemap-generator",
    seoTitle: { ru: "Генератор sitemap.xml", en: "Sitemap.xml Generator" },
    metaDescription: { ru: "Создайте sitemap.xml из списка HTTP(S) URL с optional lastmod, changefreq и priority.", en: "Create sitemap.xml from an HTTP(S) URL list with optional lastmod, changefreq, and priority." },
    h1: { ru: "Генератор sitemap.xml", en: "Sitemap.xml Generator" },
    lead: { ru: "Соберите XML sitemap из явного списка URL. Инструмент экранирует XML, проверяет HTTP(S) адреса и не притворяется crawler-обходом сайта.", en: "Build an XML sitemap from an explicit URL list. The tool escapes XML, validates HTTP(S) URLs, and does not pretend to crawl the site." },
    quickFacts: [
      { ru: "Browser-only", en: "Browser-only" },
      { ru: "XML escaping", en: "XML escaping" },
      { ru: "HTTP(S) URLs", en: "HTTP(S) URLs" },
    ],
    howToSteps: [
      { ru: "Вставьте URL, по одному на строку.", en: "Paste URLs, one per line." },
      { ru: "При необходимости задайте lastmod, changefreq и priority.", en: "Optionally set lastmod, changefreq, and priority." },
      { ru: "Скопируйте XML и проверьте опубликованный файл через Sitemap Validator.", en: "Copy the XML and check the published file through Sitemap Validator." },
    ],
    supportedFeatures: [
      { ru: "Генерирует стандартный urlset sitemap.xml.", en: "Generates a standard urlset sitemap.xml." },
      { ru: "Экранирует &, <, >, кавычки и apostrophe внутри URL.", en: "Escapes &, <, >, quotes, and apostrophes inside URLs." },
      { ru: "Валидирует priority как число 0.0–1.0.", en: "Validates priority as a number from 0.0 to 1.0." },
    ],
    limitations: [
      { ru: "Не обходит сайт и не находит страницы автоматически.", en: "Does not crawl the site or discover pages automatically." },
      { ru: "Для больших сайтов нужен crawler/job слой и инкрементальные sitemap index files.", en: "Large sites require crawler/job infrastructure and incremental sitemap index files." },
    ],
    useCases: [
      { ru: "Быстро подготовить sitemap для небольшого сайта или landing set.", en: "Quickly prepare a sitemap for a small site or landing set." },
      { ru: "Собрать временный sitemap перед автоматизацией crawler layer.", en: "Build a temporary sitemap before crawler-layer automation." },
      { ru: "Проверить XML escaping для URL с query parameters.", en: "Check XML escaping for URLs with query parameters." },
    ],
    technicalNotes: [
      { ru: "Output полностью deterministic и строится локально в браузере.", en: "Output is fully deterministic and built locally in the browser." },
      { ru: "Это generator, а не validator: опубликованный файл нужно проверять Sitemap Validator.", en: "This is a generator, not a validator: verify the published file with Sitemap Validator." },
    ],
    faq: [
      { question: { ru: "Как подготовить список страниц для sitemap.xml?", en: "How should I prepare a page list for sitemap.xml?" }, answer: { ru: "Вставьте полные HTTP- или HTTPS-адреса, по одному на строку. Выберите страницы, которые должны быть доступны для поиска. Генератор создаёт XML из вашего списка и не ищет новые страницы автоматически.", en: "Paste complete HTTP or HTTPS addresses, one per line. Choose pages you intend to make discoverable. The generator creates XML from your list without discovering additional pages automatically." } },
      { question: { ru: "Нужно ли заполнять дату изменения и частоту обновления?", en: "Must I fill in the modification date and update frequency?" }, answer: { ru: "Эти поля необязательны. Указывайте дату изменения только когда она соответствует действительности; не придумывайте значения ради заполнения. После размещения файла проверьте XML и доступность перечисленных страниц.", en: "Those fields are optional. Supply a modification date only when it is accurate; do not invent values just to fill fields. After publishing the file, validate the XML and check the listed pages' availability." } }
    ],
    relatedToolSlugs: ["sitemap-validator", "robots-txt-generator", "indexability-checker"],
    sourceUrls: ["https://www.sitemaps.org/protocol.html"],
  }),
  toolPage({
    slug: "faq-schema-generator",
    seoTitle: { ru: "Генератор FAQ Schema JSON-LD", en: "FAQ Schema JSON-LD Generator" },
    metaDescription: { ru: "Создайте FAQPage JSON-LD из утверждённых вопросов и ответов без AI-фантазирования и обещаний rich results.", en: "Create FAQPage JSON-LD from approved questions and answers without AI fabrication or rich-result promises." },
    h1: { ru: "Генератор FAQ Schema", en: "FAQ Schema Generator" },
    lead: { ru: "Соберите FAQPage JSON-LD только из фактических вопросов и ответов, которые уже есть или будут опубликованы на странице.", en: "Build FAQPage JSON-LD only from factual questions and answers that already exist or will be published on the page." },
    quickFacts: [
      { ru: "FAQPage", en: "FAQPage" },
      { ru: "JSON-LD", en: "JSON-LD" },
      { ru: "No AI output", en: "No AI output" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы FAQ или страницы с FAQ-блоком.", en: "Paste the URL of the FAQ page or page with a FAQ block." },
      { ru: "Добавьте пары вопрос/ответ блоками через пустую строку.", en: "Add question/answer pairs separated by a blank line." },
      { ru: "Скопируйте JSON-LD и проверьте опубликованную страницу валидатором структурированных данных.", en: "Copy the JSON-LD and validate the published page with Structured Data Validator." },
    ],
    supportedFeatures: [
      { ru: "Генерирует script type=application/ld+json с @type FAQPage.", en: "Generates script type=application/ld+json with @type FAQPage." },
      { ru: "Не выдумывает вопросы и ответы: использует только введённые пользователем данные.", en: "Does not invent questions or answers: uses only user-entered data." },
      { ru: "Работает в браузере без отправки контента на backend.", en: "Runs in the browser without sending content to the backend." },
    ],
    limitations: [
      { ru: "Не обещает rich snippets: eligibility зависит от поисковой системы и качества страницы.", en: "Does not promise rich snippets: eligibility depends on the search engine and page quality." },
      { ru: "FAQ-разметка должна соответствовать видимому контенту страницы.", en: "FAQ markup must match visible page content." },
    ],
    useCases: [
      { ru: "Подготовить FAQPage JSON-LD для service page или knowledge page.", en: "Prepare FAQPage JSON-LD for a service page or knowledge page." },
      { ru: "Избежать ручных ошибок в структуре Question/Answer.", en: "Avoid manual mistakes in the Question/Answer structure." },
      { ru: "Быстро проверить формат перед публикацией.", en: "Quickly check the format before publishing." },
    ],
    technicalNotes: [
      { ru: "Генератор создаёт синтаксически корректный JSON-LD, но не проверяет published DOM.", en: "The generator creates syntactically valid JSON-LD but does not verify the published DOM." },
      { ru: "После внедрения используйте Structured Data Validator на конечном URL.", en: "After implementation, use Structured Data Validator on the final URL." },
    ],
    faq: [
      { question: { ru: "Какие вопросы и ответы нужно добавить в генератор?", en: "Which questions and answers should I enter?" }, answer: { ru: "Используйте готовые вопросы и проверенные ответы, опубликованные или подготовленные для этой страницы. Вводите каждую пару отдельным блоком. Инструмент преобразует ваш текст в код разметки, а не пишет ответы за вас.", en: "Use prepared questions and verified answers published or intended for the page. Enter each pair as a separate block. The tool converts your text into markup; it does not write the answers for you." } },
      { question: { ru: "Куда поместить полученный код FAQ?", en: "Where should I put the generated FAQ code?" }, answer: { ru: "Добавьте код на ту страницу, где посетителям доступны соответствующие вопросы и ответы. Разметка должна совпадать с видимым содержанием. Её наличие не гарантирует, что поисковая система покажет вопросы в выдаче.", en: "Add it to the page where visitors can read the corresponding questions and answers. The markup must match visible content. Its presence does not guarantee that a search engine will display those questions in results." } }
    ],
    relatedToolSlugs: ["structured-data-validator", "schema-markup-generator", "html-validator"],
    sourceUrls: ["https://schema.org/FAQPage", "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"],
  }),
  toolPage({
    slug: "third-party-script-analyzer",
    seoTitle: { ru: "Анализ сторонних скриптов", en: "Third-party Script Analyzer" },
    metaDescription: { ru: "Проверьте static HTML script inventory: same-host и cross-host candidates, async, defer, module, parser-blocking signals, дубли и SRI.", en: "Check a static HTML script inventory: same-host and cross-host candidates, async, defer, module, parser-blocking signals, duplicates, and SRI." },
    h1: { ru: "Анализ сторонних скриптов", en: "Third-party Script Analyzer" },
    lead: { ru: "Введите URL, чтобы разобрать script elements в исходном HTML без исполнения JavaScript, runtime waterfall и fake tracker claims.", en: "Enter a URL to inspect script elements in source HTML without executing JavaScript, building a runtime waterfall, or making fake tracker claims." },
    quickFacts: [
      { ru: "static HTML", en: "static HTML" },
      { ru: "async / defer / module", en: "async / defer / module" },
      { ru: "hostname classification", en: "hostname classification" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL страницы.", en: "Enter a public page URL." },
      { ru: "Запустите bounded script inventory.", en: "Run the bounded script inventory." },
      { ru: "Проверьте cross-host, blocking candidates, дубли и host groups.", en: "Review cross-host scripts, blocking candidates, duplicates, and host groups." },
    ],
    supportedFeatures: [
      { ru: "Разделяет inline, external, same-host и cross-host candidates.", en: "Separates inline, external, same-host, and cross-host candidates." },
      { ru: "Показывает async, defer, module, nomodule, integrity и crossorigin.", en: "Shows async, defer, module, nomodule, integrity, and crossorigin." },
      { ru: "Группирует известные hostname patterns для analytics, tag manager, ads, social и CDN.", en: "Groups known hostname patterns for analytics, tag managers, ads, social platforms, and CDNs." },
    ],
    limitations: [
      { ru: "Third-party означает другой hostname, а не доказанного владельца или tracker.", en: "Third-party means a different hostname, not proven ownership or tracking." },
      { ru: "Не видит scripts, добавленные runtime JavaScript, consent flow или browser extensions.", en: "Does not see scripts added by runtime JavaScript, consent flows, or browser extensions." },
    ],
    useCases: [
      { ru: "Проверить script surface после подключения analytics или tag manager.", en: "Review the script surface after adding analytics or a tag manager." },
      { ru: "Найти parser-blocking candidates и duplicate src.", en: "Find parser-blocking candidates and duplicate src values." },
      { ru: "Подготовить inventory для performance и privacy review.", en: "Prepare an inventory for performance and privacy review." },
    ],
    technicalNotes: [
      { ru: "Инструмент делает один SafeHttpFetcher request и не скачивает JS resources.", en: "The tool makes one SafeHttpFetcher request and does not download JavaScript resources." },
      { ru: "Hostname groups являются прозрачной эвристикой, а не verdict о назначении скрипта.", en: "Hostname groups are a transparent heuristic, not a verdict about script purpose." },
    ],
    faq: [
      { question: { ru: "Как найти внешние скрипты на странице?", en: "How can I find external scripts on a page?" }, answer: { ru: "Введите адрес. Инструмент перечислит скрипты, подключённые в полученном HTML, и покажет выбранные признаки внешних сервисов. Проверьте, какие из них нужны сайту и кто отвечает за их подключение.", en: "Enter its address. The tool lists scripts referenced in retrieved HTML and shows selected external service clues. Review which scripts the site needs and who manages their inclusion." } },
      { question: { ru: "Отчёт показывает все системы аналитики и отслеживания?", en: "Does the report show every analytics or tracking service?" }, answer: { ru: "В нём нет скриптов, которые добавляются только после выполнения JavaScript или согласия посетителя. Сервис также может передавать данные через адрес вашего домена. Для полного разбора дополнительно изучите сетевые запросы страницы в браузере.", en: "It cannot list scripts added only after JavaScript runs or a visitor gives consent. A service may also send data through an address on your own domain. Review browser network requests for a fuller analysis." } }
    ],
    relatedToolSlugs: ["csp-analyzer", "page-weight-analyzer", "resource-hints-analyzer"],
    sourceUrls: ["https://html.spec.whatwg.org/multipage/scripting.html#the-script-element", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script"],
  }),
  toolPage({
    slug: "resource-hints-analyzer",
    seoTitle: { ru: "Анализ Resource Hints", en: "Resource Hints Analyzer" },
    metaDescription: { ru: "Проверьте preconnect, dns-prefetch, preload, prefetch, modulepreload и preinit: дубли, as, crossorigin и excessive preconnect signals.", en: "Check preconnect, dns-prefetch, preload, prefetch, modulepreload, and preinit: duplicates, as, crossorigin, and excessive-preconnect signals." },
    h1: { ru: "Анализ Resource Hints", en: "Resource Hints Analyzer" },
    lead: { ru: "Введите URL, чтобы проверить resource hints в static HTML без fake performance score и без утверждений, что каждый hint реально использован браузером.", en: "Enter a URL to check resource hints in static HTML without a fake performance score or claims that every hint is used by the browser." },
    quickFacts: [
      { ru: "preconnect / dns-prefetch", en: "preconnect / dns-prefetch" },
      { ru: "preload / modulepreload", en: "preload / modulepreload" },
      { ru: "дубли и attributes", en: "duplicates and attributes" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL страницы.", en: "Enter a public page URL." },
      { ru: "Запустите bounded static HTML analysis.", en: "Run bounded static HTML analysis." },
      { ru: "Проверьте количество hints, дубли, as и crossorigin signals.", en: "Review hint counts, duplicates, as values, and crossorigin signals." },
    ],
    supportedFeatures: [
      { ru: "Поддерживает preconnect, dns-prefetch, preload, prefetch, modulepreload и literal preinit.", en: "Supports preconnect, dns-prefetch, preload, prefetch, modulepreload, and literal preinit." },
      { ru: "Нормализует relative URLs и показывает same-host/cross-host signal.", en: "Normalizes relative URLs and shows same-host/cross-host signals." },
      { ru: "Отмечает duplicate hints, preload без as и excessive preconnect count.", en: "Flags duplicate hints, preload without as, and excessive preconnect counts." },
    ],
    limitations: [
      { ru: "Не измеряет реальный waterfall, priority или reuse connection.", en: "Does not measure the real waterfall, priority, or connection reuse." },
      { ru: "Наличие или отсутствие hint само по себе не является performance verdict.", en: "The presence or absence of a hint is not a performance verdict by itself." },
    ],
    useCases: [
      { ru: "Проверить head после изменений frontend performance setup.", en: "Review the head after frontend performance setup changes." },
      { ru: "Найти лишние preconnect и duplicate preload.", en: "Find excessive preconnects and duplicate preloads." },
      { ru: "Проверить crossorigin signal для cross-origin resources.", en: "Review crossorigin signals for cross-origin resources." },
    ],
    technicalNotes: [
      { ru: "Порог many preconnects является review signal, а не универсальным лимитом браузера.", en: "The many-preconnect threshold is a review signal, not a universal browser limit." },
      { ru: "Эффект hints нужно подтверждать browser profiling и real-user data.", en: "Hint effectiveness should be verified with browser profiling and real-user data." },
    ],
    faq: [
      { question: { ru: "Для чего нужны подсказки предварительной загрузки?", en: "What are resource loading hints for?" }, answer: { ru: "Они сообщают браузеру, к каким серверам или файлам стоит подготовиться заранее. Инструмент находит такие указания в HTML и отмечает выбранные проблемы. Применяйте их к ресурсам, важность которых подтверждена измерением загрузки.", en: "They tell the browser which servers or files it should prepare for in advance. The tool finds those declarations in HTML and flags selected concerns. Use them for resources whose importance is supported by loading measurements." } },
      { question: { ru: "Станет ли страница быстрее, если добавить много preload?", en: "Will adding many preload declarations make the page faster?" }, answer: { ru: "Лишние предварительные загрузки могут мешать другим запросам. Сначала выберите действительно нужные в начале показа файлы, затем сравните скорость до и после изменения. Этот отчёт проверяет разметку подсказок, а не гарантирует ускорение.", en: "Unnecessary preloads can compete with other requests. Identify files genuinely needed for initial display, then compare performance before and after the change. This report reviews declarations rather than guaranteeing a speed improvement." } }
    ],
    relatedToolSlugs: ["third-party-script-analyzer", "page-weight-analyzer", "core-web-vitals-checker"],
    sourceUrls: ["https://html.spec.whatwg.org/multipage/links.html#link-type-preconnect", "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload"],
  }),

  toolPage({
    slug: "url-normalization-analyzer",
    seoTitle: { ru: "Анализ нормализации URL", en: "URL Normalization Analyzer" },
    metaDescription: { ru: "Разберите синтаксическую нормализацию HTTP/HTTPS URL: scheme/host case, default port, IDNA, dot segments, percent-encoding, fragment и routing-sensitive slash signals.", en: "Inspect HTTP/HTTPS URL syntax normalization: scheme and host casing, default ports, IDNA, dot segments, percent encoding, fragments, and routing-sensitive slash signals." },
    h1: { ru: "Анализ нормализации URL", en: "URL Normalization Analyzer" },
    lead: { ru: "Инструмент локально строит детерминированную синтаксическую форму URL и отдельно отмечает изменения, которые нельзя безопасно применять без проверки роутинга.", en: "The tool locally builds a deterministic URL syntax form and separates changes that cannot be applied safely without checking routing behavior." },
    quickFacts: [
      { ru: "работает локально", en: "runs locally" },
      { ru: "IDNA и percent-encoding", en: "IDNA and percent encoding" },
      { ru: "без canonical-магии", en: "no canonical guesswork" },
    ],
    howToSteps: [
      { ru: "Вставьте полный HTTP/HTTPS URL.", en: "Paste a full HTTP/HTTPS URL." },
      { ru: "Сравните normalized и request URL.", en: "Compare the normalized and request URLs." },
      { ru: "Отдельно проверьте slash и query semantics на сервере.", en: "Verify slash and query semantics separately against the server." },
    ],
    supportedFeatures: [
      { ru: "Нормализует регистр scheme/hostname, default port и IDNA serialization.", en: "Normalizes scheme and hostname casing, default ports, and IDNA serialization." },
      { ru: "Разрешает dot segments и нормализует percent-encoding без декодирования reserved characters.", en: "Resolves dot segments and normalizes percent encoding without decoding reserved characters." },
      { ru: "Показывает fragment-free request URL и сохраняет query order.", en: "Shows the fragment-free request URL and preserves query order." },
    ],
    limitations: [
      { ru: "Не утверждает, какой URL должен быть rel=canonical.", en: "Does not claim which URL should be rel=canonical." },
      { ru: "Не схлопывает duplicate slashes и не удаляет trailing slash без проверки приложения.", en: "Does not collapse duplicate slashes or remove a trailing slash without application verification." },
    ],
    useCases: [
      { ru: "Сравнить URL перед настройкой редиректа или canonical.", en: "Compare URLs before configuring a redirect or canonical." },
      { ru: "Проверить IDN, default ports и неоднозначное percent-encoding.", en: "Review IDNs, default ports, and ambiguous percent encoding." },
      { ru: "Подготовить единообразные URL для migration spreadsheet.", en: "Prepare consistent URLs for a migration spreadsheet." },
    ],
    technicalNotes: [
      { ru: "Результат строится браузерным URL parser и не выполняет network request.", en: "The result uses the browser URL parser and makes no network request." },
      { ru: "Query order сохраняется, потому что backend semantics могут зависеть от порядка и повторов.", en: "Query order is preserved because backend semantics can depend on order and repeated keys." },
    ],
    faq: [
      { question: { ru: "Что покажет разбор адреса страницы?", en: "What does URL analysis show?" }, answer: { ru: "Вставьте полный адрес. Инструмент разделит его на части и покажет возможное нормализованное представление. Это помогает заметить необычную запись, параметры или фрагмент адреса без открытия страницы по сети.", en: "Paste a complete address. The tool separates its components and shows a possible normalised representation. It helps identify unusual syntax, parameters, or fragments without opening the page over the network." } },
      { question: { ru: "Можно ли сразу заменить адрес на предложенный вариант?", en: "Can I immediately replace an address with the suggested version?" }, answer: { ru: "Сначала проверьте, как ваш сайт обрабатывает такой адрес. Слеши, регистр пути и параметры могут влиять на выбор страницы. Анализ синтаксиса не подтверждает, что два адреса возвращают одинаковое содержимое.", en: "First check how your site handles that address. Slashes, path case, and parameters can affect page selection. Syntax analysis does not establish that two addresses return identical content." } }
    ],
    relatedToolSlugs: ["canonical-checker", "query-parameter-analyzer", "redirect-map-validator"],
    sourceUrls: ["https://url.spec.whatwg.org/", "https://www.rfc-editor.org/rfc/rfc3986"],
  }),
  toolPage({
    slug: "query-parameter-analyzer",
    seoTitle: { ru: "Анализ URL-параметров", en: "Query Parameter Analyzer" },
    metaDescription: { ru: "Локально разберите query-пары, повторы, пустые значения, tracking, pagination, sort, filter, search и session name-patterns без изменения исходного URL.", en: "Locally inspect query pairs, repeats, empty values, and tracking, pagination, sort, filter, search, and session name patterns without changing the source URL." },
    h1: { ru: "Анализ URL-параметров", en: "Query Parameter Analyzer" },
    lead: { ru: "Инструмент показывает структуру query string и прозрачные name-based categories, но не выдумывает indexation intent и не удаляет параметры автоматически.", en: "The tool shows query-string structure and transparent name-based categories without inventing indexation intent or removing parameters automatically." },
    quickFacts: [
      { ru: "до 200 query-пар", en: "up to 200 query pairs" },
      { ru: "работает локально", en: "runs locally" },
      { ru: "tracking removal candidate", en: "tracking-removal candidate" },
    ],
    howToSteps: [
      { ru: "Вставьте URL с query string.", en: "Paste a URL with a query string." },
      { ru: "Проверьте повторы, пустые значения и категории имён.", en: "Review repeats, empty values, and name categories." },
      { ru: "Подтвердите server/cache/crawl semantics до любых изменений.", en: "Confirm server, cache, and crawl semantics before making changes." },
    ],
    supportedFeatures: [
      { ru: "Сохраняет порядок пар и показывает repeated parameter names.", en: "Preserves pair order and shows repeated parameter names." },
      { ru: "Выделяет tracking, pagination, sorting, filtering, search и session name-patterns.", en: "Highlights tracking, pagination, sorting, filtering, search, and session name patterns." },
      { ru: "Показывает blank names/values, case variants и sensitive-looking names.", en: "Shows blank names and values, case variants, and sensitive-looking names." },
    ],
    limitations: [
      { ru: "Категории основаны на имени параметра, а не на доказанном поведении backend.", en: "Categories are based on parameter names, not proven backend behavior." },
      { ru: "Кандидат без tracking-параметров не является автоматической canonical рекомендацией.", en: "The tracking-free candidate is not an automatic canonical recommendation." },
    ],
    useCases: [
      { ru: "Проверить faceted navigation и crawl-space risks перед SEO-аудитом.", en: "Review faceted navigation and crawl-space risks before an SEO audit." },
      { ru: "Найти repeated keys и case variants перед API/cache debugging.", en: "Find repeated keys and case variants before API or cache debugging." },
      { ru: "Оценить tracking parameters перед формированием чистой ссылки.", en: "Review tracking parameters before preparing a clean share link." },
    ],
    technicalNotes: [
      { ru: "Инструмент не отправляет URL на backend и не обращается к сайту.", en: "The tool does not send the URL to the backend or contact the site." },
      { ru: "Повторные параметры могут интерпретироваться как list, first-value или last-value в зависимости от framework.", en: "Repeated parameters may be interpreted as a list, first value, or last value depending on the framework." },
    ],
    faq: [
      { question: { ru: "Как узнать, какие параметры есть в ссылке?", en: "How can I see which parameters a link contains?" }, answer: { ru: "Вставьте полный адрес вместе с частью после знака ?. Отчёт покажет имена, значения, повторения и выбранные признаки параметров. Разбор выполняется по тексту ссылки и не проверяет поведение сайта.", en: "Paste the complete address, including the part after ?. The report shows parameter names, values, duplicates, and selected classifications. It analyses the link text rather than testing the site's behaviour." } },
      { question: { ru: "Можно ли удалить параметры, помеченные как рекламные?", en: "Can I remove parameters marked as tracking?" }, answer: { ru: "Сначала выясните, нужны ли они для аналитики, выбора содержимого или проверки подписанной ссылки. Предложенный очищенный адрес — вариант для проверки. Не меняйте рабочие ссылки массово, пока не подтвердите их поведение.", en: "First establish whether they are needed for analytics, content selection, or signed link validation. A cleaned address is a candidate to test. Confirm behaviour before changing working links in bulk." } }
    ],
    relatedToolSlugs: ["url-normalization-analyzer", "canonical-checker", "indexability-checker"],
    sourceUrls: ["https://url.spec.whatwg.org/#urlsearchparams", "https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation"],
  }),
  toolPage({
    slug: "redirect-map-validator",
    seoTitle: { ru: "Проверка карты редиректов", en: "Redirect Map Validator" },
    metaDescription: { ru: "Проверьте до 25 explicit source→target правил: первый redirect hop, optional status, дубли, конфликты, self redirects, chains и cycles через безопасный fetcher.", en: "Validate up to 25 explicit source-to-target rules: first redirect hop, optional status, duplicates, conflicts, self redirects, chains, and cycles through a safe fetcher." },
    h1: { ru: "Проверка карты редиректов", en: "Redirect Map Validator" },
    lead: { ru: "Вставьте CSV или TSV карту миграции. WebDiag проверит только явно заданные source URL и сравнит первый redirect hop с ожидаемым target.", en: "Paste a CSV or TSV migration map. WebDiag checks only explicit source URLs and compares the first redirect hop with the expected target." },
    quickFacts: [
      { ru: "до 25 правил", en: "up to 25 rules" },
      { ru: "first-hop validation", en: "first-hop validation" },
      { ru: "duplicates / chains / cycles", en: "duplicates / chains / cycles" },
    ],
    howToSteps: [
      { ru: "Подготовьте source,target,status CSV или TSV.", en: "Prepare source,target,status CSV or TSV." },
      { ru: "Запустите bounded проверку public HTTP/HTTPS sources.", en: "Run the bounded check against public HTTP/HTTPS sources." },
      { ru: "Исправьте mismatches, conflicts, chains и cycles до deployment.", en: "Fix mismatches, conflicts, chains, and cycles before deployment." },
    ],
    supportedFeatures: [
      { ru: "Сравнивает observed first redirect target и optional 301/302/303/307/308 status.", en: "Compares the observed first redirect target and optional 301/302/303/307/308 status." },
      { ru: "Находит duplicate/conflicting sources, self redirects, map chains и cycles.", en: "Finds duplicate or conflicting sources, self redirects, map chains, and cycles." },
      { ru: "Повторно валидирует DNS и каждый redirect target через SafeHttpFetcher.", en: "Revalidates DNS and every redirect target through SafeHttpFetcher." },
    ],
    limitations: [
      { ru: "Не обходит сайт и не ищет отсутствующие redirect rules.", en: "Does not crawl the site or discover missing redirect rules." },
      { ru: "Проверяет текущий сетевой ответ, но не доказывает будущую конфигурацию CDN/web-server после deployment.", en: "Checks the current network response but cannot prove a future CDN or web-server configuration after deployment." },
    ],
    useCases: [
      { ru: "Проверить migration redirect spreadsheet после релиза.", en: "Validate a migration redirect spreadsheet after release." },
      { ru: "Найти цепочки и конфликтующие правила до импорта в nginx/CDN/CMS.", en: "Find chains and conflicting rules before importing into nginx, a CDN, or a CMS." },
      { ru: "Повторно проверить критические URL после изменения routing.", en: "Recheck critical URLs after routing changes." },
    ],
    technicalNotes: [
      { ru: "Каждый source выполняется как отдельный bounded safe fetch без чтения body.", en: "Each source is checked with a separate bounded safe fetch without reading the body." },
      { ru: "Сравнивается первый hop; дополнительные hops отмечаются как chain review signal.", en: "The first hop is compared; additional hops are reported as a chain review signal." },
    ],
    faq: [
      { question: { ru: "Как подготовить карту редиректов для проверки?", en: "How should I prepare a redirect map for validation?" }, answer: { ru: "Вставьте до 25 строк CSV или TSV: исходный адрес, целевой адрес и при необходимости ожидаемый код редиректа. Указывайте полные HTTP- или HTTPS-адреса. Инструмент проверит заданные правила и покажет расхождения.", en: "Paste up to 25 CSV or TSV rows with source address, target address, and an optional expected redirect status. Use complete HTTP or HTTPS addresses. The tool checks the supplied rules and reports mismatches." } },
      { question: { ru: "Конечная страница правильная, но правило отмечено как несовпадение. Почему?", en: "Why is a rule marked as mismatched when the final page is correct?" }, answer: { ru: "Проверяется первый переход с исходного адреса. Если он ведёт на промежуточную страницу, правило не совпадает с прямым перенаправлением на заявленную цель, даже когда цепочка заканчивается правильно. Изучите цепочку и настройку конкретного правила.", en: "The check compares the first redirect from the source. A redirect to an intermediate page does not match the declared direct target even if the chain eventually ends correctly. Review the chain and that rule's configuration." } }
    ],
    relatedToolSlugs: ["redirect-chain-checker", "url-normalization-analyzer", "canonical-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110.html#name-redirection-3xx", "https://developers.google.com/search/docs/crawling-indexing/301-redirects"],
  }),

  toolPage({
    slug: "organization-schema-generator",
    seoTitle: { ru: "Генератор Organization Schema JSON-LD", en: "Organization Schema JSON-LD Generator" },
    metaDescription: { ru: "Создайте Organization, Corporation, NGO или LocalBusiness JSON-LD из проверенных данных: URL, logo, address, sameAs и ContactPoint без AI и placeholder-значений.", en: "Create Organization, Corporation, NGO, or LocalBusiness JSON-LD from verified URL, logo, address, sameAs, and ContactPoint data without AI or placeholder values." },
    h1: { ru: "Генератор Organization Schema JSON-LD", en: "Organization Schema JSON-LD Generator" },
    lead: { ru: "Специализированный генератор собирает одну согласованную сущность организации из явно введённых фактов. Он не подставляет фиктивные контакты, рейтинги или адреса и не обещает поисковый rich result.", en: "This specialized generator builds one consistent organization entity from explicitly supplied facts. It does not invent contacts, ratings, or addresses and does not promise a search rich result." },
    quickFacts: [
      { ru: "Organization / Corporation / NGO / LocalBusiness", en: "Organization / Corporation / NGO / LocalBusiness" },
      { ru: "PostalAddress и ContactPoint", en: "PostalAddress and ContactPoint" },
      { ru: "Локально в браузере", en: "Runs locally in the browser" },
    ],
    howToSteps: [
      { ru: "Выберите наиболее точный поддерживаемый @type и укажите фактическое название.", en: "Choose the most accurate supported @type and enter the factual name." },
      { ru: "Добавьте только опубликованные URL, logo, address, sameAs и контактные данные.", en: "Add only published URL, logo, address, sameAs, and contact data." },
      { ru: "Скопируйте JSON-LD, проверьте его валидатором и сопоставьте с видимым контентом страницы.", en: "Copy the JSON-LD, validate it, and compare it with visible page content." },
    ],
    supportedFeatures: [
      { ru: "Формирует стабильный @id из URL или принимает явно заданный HTTP(S)/fragment identifier.", en: "Builds a stable @id from the URL or accepts an explicit HTTP(S) or fragment identifier." },
      { ru: "Поддерживает legalName, description, email, telephone, logo и до 20 sameAs URL.", en: "Supports legalName, description, email, telephone, logo, and up to 20 sameAs URLs." },
      { ru: "Создаёт PostalAddress и ContactPoint с areaServed и availableLanguage из явного ввода.", en: "Creates PostalAddress and ContactPoint structures with explicit areaServed and availableLanguage input." },
    ],
    limitations: [
      { ru: "Инструмент не проверяет юридическое существование организации и не подтверждает владение URL или social profiles.", en: "The tool does not verify legal existence or ownership of URLs and social profiles." },
      { ru: "JSON-LD должен соответствовать видимому контенту; генерация сама по себе не гарантирует индексацию или rich result.", en: "JSON-LD must match visible content; generation alone does not guarantee indexing or a rich result." },
    ],
    useCases: [
      { ru: "Подготовить основную Organization entity для corporate home page.", en: "Prepare the primary Organization entity for a corporate home page." },
      { ru: "Описать LocalBusiness с опубликованным адресом и контактной точкой.", en: "Describe a LocalBusiness with a published address and contact point." },
      { ru: "Унифицировать @id, logo и sameAs перед связыванием других schema entities.", en: "Standardize @id, logo, and sameAs before linking other schema entities." },
    ],
    technicalNotes: [
      { ru: "Значения сериализуются локально; символ < экранируется, чтобы пользовательский ввод не закрывал script element.", en: "Values are serialized locally; the less-than character is escaped so user input cannot close the script element." },
      { ru: "Пустые optional properties не выводятся, а placeholder-данные не создаются.", en: "Empty optional properties are omitted and placeholder data is never generated." },
    ],
    faq: [
      { question: { ru: "Что нужно указать для разметки организации?", en: "What information should I enter for organisation markup?" }, answer: { ru: "Заполните форму реальными сведениями об организации: названием, адресом сайта и нужными контактами. Необязательные поля можно оставить пустыми. Полученный JSON-LD нужно разместить на странице, которой эти сведения соответствуют.", en: "Provide real organisation details such as its name, website address, and relevant contacts. Leave optional fields blank when appropriate. Add the generated JSON-LD to a page matching those details." } },
      { question: { ru: "Генератор подтвердит правильность контактов и адреса?", en: "Will the generator verify the contact and address details?" }, answer: { ru: "Он проверяет поддерживаемые правила заполнения и собирает код, но не подтверждает регистрацию организации, доступность контактов или право на использование логотипа. Сверьте данные с опубликованной информацией о своём бизнесе.", en: "It checks supported input rules and generates code, but does not verify organisation registration, contact availability, or logo usage rights. Compare the details with your business's published information." } }
    ],
    relatedToolSlugs: ["schema-markup-generator", "structured-data-validator", "html-validator"],
    sourceUrls: ["https://schema.org/Organization", "https://schema.org/ContactPoint", "https://schema.org/PostalAddress"],
  }),
  toolPage({
    slug: "breadcrumb-schema-generator",
    seoTitle: { ru: "Генератор BreadcrumbList Schema JSON-LD", en: "BreadcrumbList Schema JSON-LD Generator" },
    metaDescription: { ru: "Соберите ordered BreadcrumbList JSON-LD из 2–20 пунктов, проверьте HTTP(S) URL и при необходимости оставьте item только у последнего текущего пункта пустым.", en: "Build ordered BreadcrumbList JSON-LD from 2–20 items, validate HTTP(S) URLs, and optionally omit item only for the final current-page crumb." },
    h1: { ru: "Генератор BreadcrumbList Schema JSON-LD", en: "BreadcrumbList Schema JSON-LD Generator" },
    lead: { ru: "Вставьте фактическую навигационную цепочку в порядке от главной страницы к текущей. Генератор назначит position последовательно и не будет обходить сайт или угадывать canonical URL.", en: "Paste the factual navigation trail from the home page to the current page. The generator assigns positions sequentially without crawling the site or guessing canonical URLs." },
    quickFacts: [
      { ru: "От 2 до 20 пунктов", en: "From 2 to 20 items" },
      { ru: "Name | URL или TSV", en: "Name | URL or TSV" },
      { ru: "Последний item URL можно пропустить", en: "Final item URL may be omitted" },
    ],
    howToSteps: [
      { ru: "Добавьте каждый breadcrumb как Name | URL, по одному пункту на строку.", en: "Add each breadcrumb as Name | URL, one item per line." },
      { ru: "Сохраните фактический порядок интерфейса; URL можно не указывать только у последнего пункта.", en: "Preserve the actual interface order; URL may be omitted only for the final item." },
      { ru: "Скопируйте BreadcrumbList и проверьте соответствие видимой навигации страницы.", en: "Copy the BreadcrumbList and verify that it matches the page's visible navigation." },
    ],
    supportedFeatures: [
      { ru: "Автоматически назначает position от 1 до количества строк.", en: "Automatically assigns positions from 1 through the row count." },
      { ru: "Проверяет абсолютные HTTP(S) URL и запрещает пропуск URL у промежуточного пункта.", en: "Validates absolute HTTP(S) URLs and rejects a missing URL for an intermediate item." },
      { ru: "Не выводит пустой item у текущей страницы, если последний URL намеренно пропущен.", en: "Omits item for the current page when the final URL is intentionally left blank." },
    ],
    limitations: [
      { ru: "Инструмент не извлекает breadcrumbs из HTML и не проверяет, отображаются ли они пользователю.", en: "The tool does not extract breadcrumbs from HTML or verify that users can see them." },
      { ru: "Порядок и URL должны быть подтверждены владельцем сайта; генератор не определяет canonical intent.", en: "The site owner must confirm order and URLs; the generator does not determine canonical intent." },
    ],
    useCases: [
      { ru: "Подготовить BreadcrumbList для страницы категории или карточки товара.", en: "Prepare BreadcrumbList markup for a category or product page." },
      { ru: "Проверить позиции и URL перед публикацией нового шаблона.", en: "Review positions and URLs before publishing a new template." },
      { ru: "Быстро заменить ручную JSON-нумерацию на детерминированный список.", en: "Replace manual JSON position numbering with a deterministic list." },
    ],
    technicalNotes: [
      { ru: "Парсер принимает pipe или tab delimiter и ограничивает список двадцатью непустыми строками.", en: "The parser accepts a pipe or tab delimiter and limits the list to twenty non-empty rows." },
      { ru: "Символы пользовательского ввода безопасно сериализуются внутри application/ld+json script.", en: "User input is safely serialized inside the application/ld+json script." },
    ],
    faq: [
      { question: { ru: "Как записать путь от главной до текущей страницы?", en: "How do I enter a trail from the homepage to the current page?" }, answer: { ru: "Добавьте пункты по одному на строку в формате «Название | URL», в порядке от начала пути к текущей странице. Генератор назначит позиции по этому порядку. Список должен соответствовать навигационной цепочке вашей страницы.", en: "Add one item per line as Name | URL, ordered from the start of the trail to the current page. The generator assigns positions in that order. Match the trail actually used on your page." } },
      { question: { ru: "Нужно ли заполнять адрес последнего пункта?", en: "Must I enter a URL for the final item?" }, answer: { ru: "Адрес можно пропустить только для последнего пункта — текущей страницы. Для остальных нужны полные адреса. Генератор не извлекает путь из меню сайта автоматически, поэтому проверьте введённую последовательность перед публикацией.", en: "The URL may be omitted only for the final item, the current page. Other items need complete addresses. The generator does not infer the trail from your site's menu, so review the sequence before publishing." } }
    ],
    relatedToolSlugs: ["schema-markup-generator", "structured-data-validator", "url-normalization-analyzer"],
    sourceUrls: ["https://schema.org/BreadcrumbList", "https://schema.org/ListItem", "https://developers.google.com/search/docs/appearance/structured-data/breadcrumb"],
  }),
  toolPage({
    slug: "product-schema-generator",
    seoTitle: { ru: "Генератор Product Schema JSON-LD", en: "Product Schema JSON-LD Generator" },
    metaDescription: { ru: "Создайте Product и optional Offer JSON-LD из фактических name, image, SKU, brand, GTIN, price, currency, availability и condition без выдуманных reviews.", en: "Create Product and optional Offer JSON-LD from factual name, image, SKU, brand, GTIN, price, currency, availability, and condition without invented reviews." },
    h1: { ru: "Генератор Product Schema JSON-LD", en: "Product Schema JSON-LD Generator" },
    lead: { ru: "Генератор формирует Product entity и добавляет Offer только при явно введённых price и priceCurrency. Ratings, reviews, seller, availability и condition никогда не подставляются автоматически.", en: "The generator builds a Product entity and adds Offer only when price and priceCurrency are explicitly supplied. Ratings, reviews, seller, availability, and condition are never invented." },
    quickFacts: [
      { ru: "Product + optional Offer", en: "Product + optional Offer" },
      { ru: "GTIN 8/12/13/14 validation", en: "GTIN 8/12/13/14 validation" },
      { ru: "До 10 image URL", en: "Up to 10 image URLs" },
    ],
    howToSteps: [
      { ru: "Укажите фактическое название и доступные product identifiers.", en: "Enter the factual name and available product identifiers." },
      { ru: "Добавьте Offer только когда опубликованы price, currency и соответствующие availability/condition данные.", en: "Add Offer only when price, currency, and corresponding availability or condition data are published." },
      { ru: "Проверьте JSON-LD и синхронизируйте его с видимой карточкой и текущими данными магазина.", en: "Validate the JSON-LD and keep it synchronized with the visible product page and current store data." },
    ],
    supportedFeatures: [
      { ru: "Поддерживает name, description, URL, @id, images, SKU, Brand, GTIN и MPN.", en: "Supports name, description, URL, @id, images, SKU, Brand, GTIN, and MPN." },
      { ru: "Создаёт Offer с price, ISO-like three-letter currency, availability, itemCondition, seller и priceValidUntil.", en: "Creates Offer with price, a three-letter currency, availability, itemCondition, seller, and priceValidUntil." },
      { ru: "Не выводит Offer при неполной паре price/priceCurrency и не создаёт aggregateRating или review.", en: "Does not output Offer for an incomplete price and currency pair and never creates aggregateRating or review." },
    ],
    limitations: [
      { ru: "Инструмент не проверяет склад, checkout, merchant feed или реальную доступность товара.", en: "The tool does not verify inventory, checkout, merchant feeds, or actual product availability." },
      { ru: "Поддерживается одна bounded Offer entity; variants, shippingDetails, returns и complex pricing требуют ручной модели.", en: "One bounded Offer entity is supported; variants, shippingDetails, returns, and complex pricing require a manual model." },
    ],
    useCases: [
      { ru: "Подготовить базовый Product JSON-LD для одной карточки товара.", en: "Prepare baseline Product JSON-LD for one product page." },
      { ru: "Проверить формат GTIN, currency и Offer перед внедрением в шаблон CMS.", en: "Review GTIN, currency, and Offer formatting before CMS template integration." },
      { ru: "Создать безопасный черновик без фиктивных рейтингов и отзывов.", en: "Create a safe draft without fabricated ratings and reviews." },
    ],
    technicalNotes: [
      { ru: "GTIN property выбирается по длине: gtin8, gtin12, gtin13 или gtin14.", en: "The GTIN property is selected by length: gtin8, gtin12, gtin13, or gtin14." },
      { ru: "Availability и itemCondition сериализуются как schema.org URL только из ограниченного списка формы.", en: "Availability and itemCondition are serialized as schema.org URLs only from the form's constrained list." },
    ],
    faq: [
      { question: { ru: "Какие данные нужны для разметки товара?", en: "What information is needed for product markup?" }, answer: { ru: "Укажите фактическое название и сведения, которые есть на странице товара. Если добавляете предложение о продаже, согласованно заполните цену и валюту. Проверьте результат перед размещением: генератор не получает данные из магазина сам.", en: "Enter the actual name and information shown on the product page. If adding a sales offer, supply a consistent price and currency. Review the result before publishing; the generator does not retrieve store data itself." } },
      { question: { ru: "Можно ли получить звёзды в поиске, просто добавив разметку?", en: "Can I get search result stars just by adding the markup?" }, answer: { ru: "Отображение решает поисковая система по своим правилам. Генератор не создаёт рейтинги и отзывы. Не добавляйте вымышленные оценки или сведения, которых нет на странице: разметка должна описывать реальные данные товара.", en: "Search engines decide what to display under their own rules. This generator does not create ratings or reviews. Do not add invented scores or information absent from the page; markup must describe real product data." } }
    ],
    relatedToolSlugs: ["structured-data-validator", "schema-markup-generator", "image-seo-audit"],
    sourceUrls: ["https://schema.org/Product", "https://schema.org/Offer", "https://developers.google.com/search/docs/appearance/structured-data/product"],
  }),
] as const;
