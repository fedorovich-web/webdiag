import { toolPage } from "./shared";

export const seoAuditToolPages = [

  toolPage({
    slug: "whole-site-audit",
    lastReviewedAt: "2026-10-22",
    reviewDueAt: "2027-04-22",
    seoTitle: { ru: "Технический аудит сайта в проекте", en: "Project Site Audit" },
    metaDescription: { ru: "Проверьте до 100 публичных HTML-страниц одного сайта: статусы, метаданные, ссылки, robots.txt и карты сайта. Результат ограничен выборкой.", en: "Audit up to 100 public HTML pages on one site: HTTP statuses, metadata, links, robots.txt, and sitemaps, with results limited to the crawl sample." },
    h1: { ru: "Технический аудит сайта", en: "Technical Site Audit" },
    lead: { ru: "Запустите аудит проекта, чтобы проверить до 100 публичных HTML-страниц и сохранить результат в истории. Отчёт поможет найти недоступные ссылки, повторы метаданных и ограничения индексации.", en: "Start a project audit to check up to 100 public HTML pages and save the result in project history. Review broken links, duplicate metadata, and technical indexing restrictions." },
    quickFacts: [
      { ru: "До 100 HTML-страниц", en: "Up to 100 HTML pages" },
      { ru: "Один сайт", en: "One origin" },
      { ru: "История в проекте", en: "Project history" },
    ],
    howToSteps: [
      { ru: "Войдите в аккаунт и откройте проект нужного сайта.", en: "Sign in and open a project with the intended origin." },
      { ru: "Запустите обход из обзора проекта.", en: "Start the limited crawl from the project overview." },
      { ru: "Проверьте страницы, ошибки, повторы метаданных и адреса без найденных внутренних ссылок с учётом лимита обхода.", en: "Review fetched pages, partial failures, duplicates, and unlinked candidates in the context of the sample limit." },
    ],
    supportedFeatures: [
      { ru: "Собирает HTTP-статусы, title, description и внутренние ссылки из исходного HTML.", en: "Collects HTTP status, title, description, and internal links from static HTML." },
      { ru: "Обходит только адреса с тем же протоколом, доменом и портом; обращения к локальным и частным адресам блокируются.", en: "Stays on one origin and applies SSRF and DNS/IP policy to navigation." },
      { ru: "Учитывает robots.txt и читает карты сайта, включая дочерние карты, в пределах лимитов обхода.", en: "Respects robots.txt and reads sitemaps, including child sitemap indexes, within crawl limits." },
    ],
    limitations: [
      { ru: "За один запуск проверяется до 100 HTML-страниц. Отчёт может охватывать часть сайта.", en: "The limit is 100 HTML pages; this does not prove complete site coverage." },
      { ru: "Не выполняет JavaScript, не отправляет формы и не открывает страницы, требующие входа. Адреса с параметрами запроса исключены из обхода.", en: "Does not execute JavaScript, submit forms, or access pages requiring sign-in. Query-string URLs are excluded from the crawl." },
    ],
    useCases: [
      { ru: "Получить техническую выборку страниц небольшого публичного сайта.", en: "Collect a limited technical sample of a small public site." },
      { ru: "Сохранить состояние доступных страниц перед изменением шаблона.", en: "Record the state of reachable pages before a template change." },
      { ru: "Проверить повторы метаданных и страницы без найденных внутренних ссылок по одному результату обхода.", en: "Use one result to review duplicates and unlinked candidates." },
    ],
    technicalNotes: [
      { ru: "Запуск доступен после входа в аккаунт и привязан к проекту пользователя.", en: "Sign-in is required, and each run is linked to a project owned by the user." },
      { ru: "Результат сохраняется в истории проекта; ошибки отдельных страниц показываются отдельно.", en: "Results are saved in project history, with individual page failures reported separately." },
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
    seoTitle: { ru: "Повторяющиеся title и description на сайте", en: "Duplicate Titles and Descriptions in a Crawl" },
    metaDescription: { ru: "Найдите совпадающие непустые title и description в выборке до 100 HTML-страниц из одного аудита проекта.", en: "Find matching non-empty titles and descriptions in a sample of up to 100 HTML pages from a single project audit." },
    h1: { ru: "Повторы title и description", en: "Duplicate Titles and Descriptions" },
    lead: { ru: "Отчёт группирует страницы с совпадающими непустыми title и description в сохранённом результате аудита проекта. Страницы, не попавшие в обход, не сравниваются.", en: "This view groups identical non-empty titles and meta descriptions among pages actually fetched by one limited project crawl. URLs outside the sample are not represented." },
    quickFacts: [
      { ru: "Один результат обхода", en: "One crawl result" },
      { ru: "Title и description", en: "Title + description" },
      { ru: "До 100 HTML-страниц", en: "Up to 100 HTML pages" },
    ],
    howToSteps: [
      { ru: "Войдите в аккаунт, откройте проект и запустите обход сайта.", en: "Open an authenticated project and run a limited crawl." },
      { ru: "После сохранения результата откройте группы повторов.", en: "Wait for the stored result and open the duplicate groups." },
      { ru: "Сравните назначение страниц в каждой группе, прежде чем менять метаданные.", en: "Review the intent of each group manually: identical metadata is not always a defect." },
    ],
    supportedFeatures: [
      { ru: "Отдельно группирует совпадающие непустые title и description.", en: "Groups matching non-empty titles and descriptions separately." },
      { ru: "Показывает адреса из сохранённого результата без повторных запросов к сайту.", en: "Shows URLs from the stored result without making another network request." },
      { ru: "Использует результат проекта, доступный его владельцу.", en: "Uses the saved project result, accessible to its owner." },
    ],
    limitations: [
      { ru: "Сравниваются только страницы полученной выборки, до 100 HTML-страниц.", en: "Comparison is limited to the fetched sample of up to 100 HTML pages and does not cover unknown URLs." },
      { ru: "Инструмент не определяет поисковую задачу страницы и не решает, допустим ли конкретный повтор.", en: "The tool does not determine search intent or decide when a duplicate is acceptable." },
    ],
    useCases: [
      { ru: "Найти одинаковые title в проверенных категориях или страницах услуг.", en: "Find template-level title duplication in the fetched category or service sample." },
      { ru: "Проверить повторы description после изменения шаблона CMS.", en: "Review repeated descriptions after a CMS template change." },
      { ru: "Подготовить список страниц для редакционной проверки.", en: "Prepare a URL list for manual editorial review." },
    ],
    technicalNotes: [
      { ru: "Сравнение не учитывает регистр, но не определяет смысловое сходство текста.", en: "Comparison ignores letter case but does not assess semantic similarity." },
      { ru: "Пустые значения не образуют группы повторов; отсутствие метаданных следует проверять отдельно.", en: "Empty values are not duplicate groups and should be reviewed separately as missing metadata." },
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
    seoTitle: { ru: "Поиск страниц без найденных внутренних ссылок", en: "Sitemap URLs Without Discovered Internal Links" },
    metaDescription: { ru: "Сравните адреса из карт сайта с внутренними ссылками в выборке до 100 HTML-страниц и получите список страниц для ручной проверки.", en: "Compare sitemap URLs with internal links in a sample of up to 100 HTML pages and get a list of pages for manual review." },
    h1: { ru: "Страницы без найденных внутренних ссылок", en: "Unlinked Page Candidates" },
    lead: { ru: "Отчёт показывает адреса из карт сайта, на которые не найдены внутренние ссылки в выборке обхода. Ограниченная выборка не подтверждает отсутствие ссылок на всём сайте.", en: "This view shows URLs from sitemaps for which no internal links were found in the limited crawl sample. These are review candidates: the limit and incomplete link graph cannot prove that a page is orphaned across the full site." },
    quickFacts: [
      { ru: "Карта сайта и ссылки", en: "Sitemap vs links" },
      { ru: "Кандидаты для проверки", en: "Candidates only" },
      { ru: "До 100 HTML-страниц", en: "Up to 100 HTML pages" },
    ],
    howToSteps: [
      { ru: "Проверьте адрес сайта в проекте и доступность публичных карт сайта.", en: "Confirm that the project uses the intended origin and public sitemaps." },
      { ru: "Запустите обход и дождитесь сохранения результата.", en: "Run the limited crawl and wait for the stored result." },
      { ru: "Проверьте навигацию и контекстные ссылки каждой найденной страницы перед изменением сайта.", en: "Review each candidate against navigation, contextual links, and broader evidence before changing the site." },
    ],
    supportedFeatures: [
      { ru: "Сопоставляет нормализованные адреса карт сайта с найденными внутренними ссылками.", en: "Compares normalized URLs from sitemaps with discovered internal links." },
      { ru: "Сравнивает только URL с тем же протоколом, доменом и портом.", en: "Stays on one origin and does not treat cross-origin URLs as part of the project." },
      { ru: "Показывает кандидатов из сохранённого обхода и размер выборки карт сайта.", en: "Shows candidates from the stored crawl together with the sitemap sample size." },
    ],
    limitations: [
      { ru: "Выборка до 100 страниц не позволяет подтвердить отсутствие ссылок на всём сайте.", en: "A sample of up to 100 HTML pages cannot prove the absence of a link across the full site." },
      { ru: "Если обход или данные карт сайта неполны, кандидаты не показываются.", en: "Candidates are withheld when the crawl or sitemap data are incomplete, because missing links cannot be established." },
    ],
    useCases: [
      { ru: "Найти страницы для ручной проверки внутренней перелинковки.", en: "Find URLs for manual internal-link review." },
      { ru: "Сопоставить адреса небольшой карты сайта с найденными ссылками.", en: "Compare a small sitemap sample with links actually discovered." },
      { ru: "Проверить перелинковку после изменения меню или структуры разделов.", en: "Review candidates after changing navigation or section structure." },
    ],
    technicalNotes: [
      { ru: "В список попадают адреса карт сайта, отсутствующие среди найденных внутренних ссылок после нормализации.", en: "A candidate is the difference between sitemap URLs and the discovered link graph after same-origin normalization." },
      { ru: "Проверьте кандидата по другим источникам: отсутствие ссылки в выборке ещё не делает страницу изолированной.", en: "Check candidates against other sources: a missing link in this sample does not establish that the page has no links elsewhere." },
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
    metaDescription: { ru: "Проверьте публичную страницу: HTTP, редиректы, метаданные, ограничения индексации, JSON-LD, заголовки безопасности, robots.txt и карту сайта.", en: "Audit one public URL for HTTP, redirects, metadata, indexability, JSON-LD, security headers, robots.txt, and sitemap.xml with a clear fix order." },
    h1: { ru: "Технический аудит страницы", en: "Single Page Technical Audit" },
    lead: { ru: "Проверьте одну публичную страницу и получите технические и SEO-замечания в порядке приоритета. Отчёт включает доступные данные robots.txt, карты сайта и измерения Google PageSpeed, если сервис вернул результат.", en: "Check one public page for technical and SEO issues and get recommendations in priority order. The report includes available robots.txt and sitemap data, plus Google PageSpeed measurements when the service responds." },
    quickFacts: [
      { ru: "22 группы проверок", en: "22 check groups" },
      { ru: "Одна страница", en: "One URL without crawling" },
      { ru: "Пояснения к результатам", en: "Observed data and limits" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP(S) URL конкретной страницы.", en: "Enter the public HTTP(S) URL of one page." },
      { ru: "Дождитесь загрузки страницы и доступных результатов проверки.", en: "Wait for the page fetch and available check results." },
      { ru: "Исправьте проблемы по приоритетам P0–P3 и повторите аудит после изменений.", en: "Fix issues in P0-P3 order and rerun the audit after changes." },
    ],
    supportedFeatures: [
      { ru: "Проверяет HTTP-статус, цепочку редиректов и тип содержимого HTML.", en: "HTTP status, redirect chain, and HTML content type." },
      { ru: "Разбирает title, description, H1, canonical, robots, Open Graph и JSON-LD.", en: "Title, description, H1, canonical, robots meta, Open Graph, and JSON-LD." },
      { ru: "Проверяет заголовки безопасности, robots.txt и доступность одной карты sitemap.xml.", en: "Security headers, robots.txt, and discovery of one sitemap.xml." },
    ],
    limitations: [
      { ru: "Разбор HTML не выполняет JavaScript. Измерения Google PageSpeed поступают отдельно и могут быть недоступны.", en: "The HTML analysis does not execute JavaScript. Performance measurements come separately from Google PageSpeed and may be unavailable." },
      { ru: "Проверяется один URL; страницы по ссылкам и из карты сайта не обходятся.", en: "Only one URL is audited; links and sitemap pages are not crawled." },
    ],
    useCases: [
      { ru: "Проверить страницу перед публикацией или после релиза.", en: "Review a page before publishing or after a release." },
      { ru: "Получить список технических проблем в порядке исправления.", en: "Get one ordered list of technical fixes." },
      { ru: "Вручную сравнить результаты до и после изменений.", en: "Manually compare a rerun after fixes." },
    ],
    technicalNotes: [
      { ru: "При загрузке проверяются URL, DNS и адрес подключённого сервера, включая редиректы. Время, число переходов и размер ответа ограничены.", en: "The backend validates the URL, DNS, and connected peer IP at every redirect and bounds redirects, timeouts, compressed bodies, and decoded bodies." },
      { ru: "Отчёт содержит проверки, замечания, затронутые URL и рекомендации; необработанные ответы и внутренние данные в него не включаются.", en: "The report includes checks, issues, affected URLs, and recommendations. Raw responses and internal metadata are excluded." },
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
    seoTitle: { ru: "Анализ JavaScript-файлов страницы", en: "JavaScript Bundle Surface Analyzer" },
    metaDescription: { ru: "Проверьте внешние JavaScript-файлы из HTML: статусы, MIME, Content-Length, сжатие, кэширование, редиректы и атрибуты загрузки.", en: "Check external JavaScript files found in HTML: HTTP status, MIME, Content-Length, compression, caching, redirects, and loading attributes." },
    h1: { ru: "Анализ JavaScript-файлов", en: "JavaScript Bundle Surface Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы собрать внешние script src из исходного HTML и проверить заголовки до 24 отдельных JS-файлов. Отчёт показывает заявленные размеры, сжатие, кэширование и атрибуты загрузки.", en: "The tool parses static HTML, deduplicates external script src values, and safely checks headers for a limited number of JavaScript responses. It reports declared transfer bytes, MIME, compression, cache, and loading attributes without executing JavaScript." },
    quickFacts: [
      { ru: "До 24 JS-файлов", en: "Up to 24 unique JS assets" },
      { ru: "Заголовки ресурсов", en: "Headers-only asset checks" },
      { ru: "Без выполнения кода", en: "No code execution" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL HTML-страницы.", en: "Paste a public HTML page URL." },
      { ru: "Запустите проверку найденных внешних скриптов.", en: "Run the check for external scripts found in the page HTML." },
      { ru: "Сравните число файлов, размеры, ошибки загрузки, сжатие и скрипты, способные задерживать разбор HTML.", en: "Review unique scripts, declared bytes, parser-blocking candidates, compression, cache, and failed assets." },
    ],
    supportedFeatures: [
      { ru: "Убирает повторные адреса script src и различает обычные скрипты и модули.", en: "Script-src deduplication and module/classic separation." },
      { ru: "Проверяет HTTP-статус, конечный URL, MIME, Content-Length, Content-Encoding, Cache-Control и редиректы.", en: "Checks status, final URL, MIME, Content-Length, Content-Encoding, Cache-Control, and redirects." },
      { ru: "Отмечает большое число файлов и обычные скрипты, способные задерживать разбор HTML.", en: "Flags large script inventories and classic scripts that may delay HTML parsing." },
    ],
    limitations: [
      { ru: "Не выполняет JavaScript и не видит динамический импорт, добавленные кодом скрипты, использование кода и нагрузку на основной поток.", en: "The tool does not execute JavaScript and cannot see dynamic imports, runtime-injected scripts, code coverage, or main-thread cost." },
      { ru: "Content-Length может описывать размер сжатого ответа и не показывает затраты на разбор, компиляцию и выполнение кода.", en: "Content-Length can represent encoded transfer size and is not parse, compile, or execution cost." },
    ],
    useCases: [
      { ru: "Проверить рост числа JS-файлов после релиза.", en: "Review bundle-count growth after a release." },
      { ru: "Найти повторные подключения, ошибки ответов и несоответствие MIME.", en: "Find failed, duplicated, or MIME-mismatched script responses." },
      { ru: "Сверить сжатие и кэширование внешних скриптов.", en: "Review compression and long-cache signals for external JavaScript assets." },
    ],
    technicalNotes: [
      { ru: "HTML загружается с ограничением размера; у JS-файлов проверяются только заголовки ответа.", en: "HTML uses a limited GET, while discovered JavaScript assets use headers-only GET requests through the same SSRF-safe fetcher." },
      { ru: "Каждый вложенный URL проверяется: частные адреса, небезопасные редиректы и подмена адреса через DNS блокируются.", en: "Private/local targets, unsafe redirects, and DNS-rebinding paths are blocked for every nested URL." },
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
    seoTitle: { ru: "Анализ загрузки CSS", en: "CSS Delivery Analyzer" },
    metaDescription: { ru: "Проверьте внешние и встроенные стили: размер выборки CSS, @import, @font-face, MIME, сжатие, кэширование и повторные подключения.", en: "Check external and inline CSS: limited decoded samples, @import, @font-face, MIME, compression, cache, media, and duplicate stylesheet links." },
    h1: { ru: "Анализ загрузки CSS", en: "CSS Delivery Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы проверить встроенные стили и до 16 внешних файлов CSS. Отчёт покажет объём полученной выборки, @import, @font-face, настройки загрузки и ошибки ответов.", en: "The tool parses stylesheet links and inline style blocks, safely fetches a limited CSS set, and reports decoded samples, @import, @font-face, MIME, compression, cache, and delivery errors." },
    quickFacts: [
      { ru: "До 16 файлов стилей", en: "Up to 16 unique stylesheets" },
      { ru: "Внешние и встроенные стили", en: "External + inline CSS" },
      { ru: "Без поиска неиспользуемых правил", en: "No unused-CSS detection" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL HTML-страницы.", en: "Paste a public HTML page URL." },
      { ru: "Запустите разбор подключений и загрузку выборки CSS.", en: "WebDiag discovers stylesheet links and inline style blocks, then fetches a limited CSS sample." },
      { ru: "Проверьте повторные подключения, @import, размеры, MIME, сжатие и ошибки файлов стилей.", en: "Review duplicate links, @import chains, decoded bytes, MIME, compression, and failed stylesheets." },
    ],
    supportedFeatures: [
      { ru: "Различает файлы с того же и других хостов; показывает media, alternate и disabled.", en: "Same-host/cross-host inventory and media/alternate/disabled signals." },
      { ru: "Считает объём встроенных стилей и полученной выборки CSS, правила @import и @font-face.", en: "Counts inline bytes, sampled decoded bytes, @import, and @font-face." },
      { ru: "Проверяет HTTP-статус, MIME text/css, Content-Encoding, Cache-Control и редиректы.", en: "Checks response status, text/css MIME, Content-Encoding, Cache-Control, and redirects." },
    ],
    limitations: [
      { ru: "Не определяет неиспользуемые правила, результат каскада CSS, критические стили и фактическую задержку отображения.", en: "Static analysis cannot determine unused CSS, the actual cascade, critical-CSS coverage, or real render-blocking impact." },
      { ru: "Считает вложенные @import, но не загружает их рекурсивно.", en: "Nested @import URLs are counted but not recursively crawled." },
    ],
    useCases: [
      { ru: "Найти повторные подключения стилей и ошибки MIME.", en: "Find duplicate stylesheet requests and MIME errors." },
      { ru: "Проверить наличие дополнительных подключений через @import.", en: "Check for @import discovery chains." },
      { ru: "Сравнить размер полученной выборки CSS после релиза.", en: "Compare the size of the fetched CSS sample after a release." },
    ],
    technicalNotes: [
      { ru: "Каждый CSS-адрес проверяется на публичную доступность; размер распакованного ответа ограничен.", en: "Every CSS URL is revalidated by the public-target policy and limited decoded-body limit." },
      { ru: "Размер полученной выборки не равен объёму сетевых загрузок браузера и не показывает долю неиспользуемых стилей.", en: "The sampled size is not a browser transfer waterfall or an unused-CSS measurement." },
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
    metaDescription: { ru: "Проверьте @font-face, font-display, источники и форматы шрифтов, предзагрузку, размеры и заголовки ответов.", en: "Check static @font-face rules, font-display, font sources and formats, preload correlation, Content-Length, cache headers, and font response status." },
    h1: { ru: "Анализ загрузки веб-шрифтов", en: "Font Loading Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы найти @font-face во встроенных и внешних стилях, сопоставить шрифты с предзагрузкой и проверить заголовки до 24 файлов шрифтов.", en: "WebDiag parses inline and limited external CSS, collects @font-face rules and font URLs, correlates font preloads, and safely checks a limited set of font response headers." },
    quickFacts: [
      { ru: "Правила @font-face", en: "@font-face inventory" },
      { ru: "Проверка предзагрузки", en: "Preload correlation" },
      { ru: "До 24 файлов шрифтов", en: "Up to 24 font assets" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите проверку встроенных стилей и до 12 внешних файлов CSS.", en: "WebDiag checks inline CSS and up to 12 external stylesheets for @font-face rules." },
      { ru: "Проверьте font-display, семейства, начертания, источники, WOFF2, предзагрузку, размеры и кэширование.", en: "Review font-display, families, sources, WOFF2 signals, matched preloads, bytes, and cache headers." },
    ],
    supportedFeatures: [
      { ru: "Разбирает семейство, стиль, насыщенность, font-display, local() и URL источников.", en: "Parses family, style, weight, font-display, local(), and URL sources." },
      { ru: "Сопоставляет link rel=preload as=font с адресами в @font-face.", en: "Correlates link rel=preload as=font with discovered @font-face URLs." },
      { ru: "Проверяет MIME, Content-Length, кэширование и редиректы файлов шрифтов с защитой от частных адресов.", en: "Checks font MIME, Content-Length, cache policy, redirects, and public-target safety." },
    ],
    limitations: [
      { ru: "Не рассчитывает каскад CSS и не определяет, какое начертание браузер выберет для конкретного текста.", en: "The tool does not execute the CSS cascade and cannot know which font face the browser actually selected for text." },
      { ru: "Задержку появления текста, смену шрифтов и сдвиги макета нужно измерять в браузере или по данным пользователей.", en: "FOIT/FOUT, layout shift, and timing require browser runtime or field data." },
    ],
    useCases: [
      { ru: "Найти @font-face без явно заданного font-display.", en: "Find @font-face rules without an explicit font-display." },
      { ru: "Найти адреса предзагрузки, не совпадающие с источниками шрифтов в CSS.", en: "Find preload URLs that do not match static CSS sources." },
      { ru: "Сверить число семейств и начертаний, а также известные размеры файлов.", en: "Review family/weight counts and known declared font bytes." },
    ],
    technicalNotes: [
      { ru: "Разбирается ограниченная выборка CSS; стили, создаваемые JavaScript, и изменения CSSOM во время работы страницы не анализируются.", en: "The CSS parser is limited and does not execute JavaScript-generated stylesheets or the runtime CSSOM." },
      { ru: "Проверяется согласованность существующей предзагрузки. Предзагрузка каждого шрифта не обязательна.", en: "Not every font should be preloaded: the tool checks consistency of existing preloads rather than requiring a preload for every file." },
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
    metaDescription: { ru: "Проверьте Core Web Vitals, лабораторные измерения, доступные данные пользователей и четыре категории Lighthouse через Google PageSpeed.", en: "Check Core Web Vitals, lab and field data, four Lighthouse categories, and a fix order through the Google PageSpeed API." },
    h1: { ru: "Проверка Core Web Vitals", en: "Core Web Vitals Checker" },
    lead: { ru: "Выберите проверку для телефона, компьютера или обоих устройств. Отчёт покажет доступные Core Web Vitals, оценки производительности, доступности, рекомендаций Lighthouse и SEO, а также проверки в порядке приоритета.", en: "Run mobile, desktop, or both PageSpeed strategies to review Core Web Vitals, Performance, Accessibility, Best Practices, and SEO scores, plus prioritized checks to fix." },
    quickFacts: [
      { ru: "Google PageSpeed API", en: "Google PageSpeed API" },
      { ru: "Телефон и компьютер", en: "Mobile/Desktop" },
      { ru: "Тесты и данные пользователей", en: "Lab + Field data" },
      { ru: "4 категории Lighthouse", en: "4 Lighthouse categories" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Выберите телефон, компьютер или оба варианта.", en: "Choose mobile, desktop, or both strategies." },
      { ru: "Изучите оценки, лабораторные измерения, доступные данные пользователей и приоритетные замечания.", en: "Review category scores, lab metrics, field data, and the ordered checks to fix." },
    ],
    supportedFeatures: [
      { ru: "Получает результаты проверки из Google PageSpeed API.", en: "Retrieves test results from the Google PageSpeed API." },
      { ru: "Разделяет лабораторные измерения Lighthouse и данные Chrome UX о реальных пользователях, если они доступны.", en: "Separates Lighthouse lab metrics from Chrome UX field data when field data is available." },
      { ru: "Показывает четыре оценки категорий и до 20 проверок с ошибками или частичным результатом.", en: "Shows four category scores and up to 20 failed or partially completed checks." },
      { ru: "Отдельно сообщает, когда измерение недоступно или Google не вернул результат.", en: "Reports when a measurement is unavailable or Google does not return a result." },
    ],
    limitations: [
      { ru: "Проверяет публичные URL; localhost и закрытые тестовые сайты недоступны Google PageSpeed.", en: "PageSpeed checks only publicly accessible URLs and does not work for private localhost/staging without separate infrastructure." },
      { ru: "Доступность результата зависит от Google API, его лимитов, региона проверки и наличия пользовательских данных.", en: "The result depends on Google API, quotas, region, and field data availability." },
      { ru: "Не показывает полные подробности всех проверок, трассировки, скриншоты и диаграмму сетевых запросов.", en: "The tool does not expose raw audit details, traces, screenshots, or a network waterfall." },
    ],
    useCases: [
      { ru: "Проверить посадочную страницу перед запуском трафика.", en: "Evaluate a landing page release before driving traffic." },
      { ru: "Выбрать приоритетные исправления по замечаниям Lighthouse.", en: "Identify which Lighthouse opportunities provide the largest savings." },
      { ru: "Сопоставить лабораторные измерения и доступные показатели реальных пользователей.", en: "Separate lab issues from real Core Web Vitals field signals." },
    ],
    technicalNotes: [
      { ru: "Запрос к Google выполняется сервером WebDiag; ключ API не передаётся в браузер.", en: "Google requests are made by the WebDiag server; the API key is not sent to the browser." },
      { ru: "Отсутствие пользовательских данных отмечается отдельно и не заменяется лабораторными значениями.", en: "Missing real-user data are reported separately and are not replaced with lab measurements." },
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
    metaDescription: { ru: "Проверьте Cache-Control, ETag, Last-Modified, Expires и Vary для кэша браузера и CDN.", en: "Check Cache-Control, ETag, Last-Modified, Expires, Vary, and browser/CDN cache recommendations." },
    h1: { ru: "Проверка HTTP-кэширования", en: "HTTP Cache Policy Checker" },
    lead: { ru: "Введите URL страницы или файла, чтобы проверить правила кэширования и повторной проверки свежести. Рекомендации учитывают различия между HTML и статическими файлами с версией в имени.", en: "Enter a page or static asset URL to check explicit cache policy, validators, Vary, and whether the rules fit HTML or hashed static assets." },
    quickFacts: [
      { ru: "Cache-Control", en: "Cache-Control" },
      { ru: "ETag / Last-Modified", en: "ETag / Last-Modified" },
      { ru: "Кэш CDN и браузера", en: "CDN/browser cache" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы, CSS, JS, изображения или шрифта.", en: "Paste an HTML, CSS, JS, image, or font URL." },
      { ru: "Запустите проверку заголовков ответа.", en: "Run the header check without downloading the response body." },
      { ru: "Проверьте оценку, директивы кэширования, ETag, Last-Modified и Vary.", en: "Review score, cache directives, validators, and Vary policy." },
    ],
    supportedFeatures: [
      { ru: "Определяет статические файлы по URL и типу содержимого и оценивает их отдельно от HTML.", en: "Detects static assets by URL/content-type and applies a different evaluation standard than for HTML." },
      { ru: "Проверяет Cache-Control, ETag, Last-Modified, Expires и Vary: Accept-Encoding.", en: "Checks Cache-Control, validators, Expires fallback, and Vary: Accept-Encoding." },
      { ru: "Запрашивает только заголовки ответа с защитой от обращений к частным адресам.", en: "Checks response headers without downloading the body, with protection against requests to private addresses." },
    ],
    limitations: [
      { ru: "Не знает порядок очистки вашего CDN-кэша и не подтверждает безопасность кэширования персональных данных.", en: "The tool does not know your CDN purge policy and cannot prove personalization safety." },
      { ru: "Фактическое использование кэша при загрузке страницы нужно проверять в браузере.", en: "Check actual cache use during page loading in a browser." },
    ],
    useCases: [
      { ru: "Проверить долгое кэширование неизменяемых CSS, JS и шрифтов с версией в имени.", en: "Verify that hashed CSS/JS/fonts use long-lived immutable caching." },
      { ru: "Найти HTML с длительным публичным кэшированием, требующим внимания.", en: "Find HTML with risky long public caching." },
      { ru: "Узнать, заданы ли ETag и Last-Modified для повторной проверки свежести.", en: "Check whether validators exist for revalidation." },
    ],
    technicalNotes: [
      { ru: "Используются HTTP-статус, конечный URL и заголовки; тело конечного ответа не скачивается.", en: "The final response body is not downloaded; status, final URL, and headers are used." },
      { ru: "Тип статического файла определяется по расширению URL и Content-Type.", en: "Static asset heuristics use both URL extension and content-type." },
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
    metaDescription: { ru: "Проверьте размер HTML и найденных ресурсов, Content-Length, крупные файлы и использование JPEG, PNG, AVIF и WebP.", en: "Check static HTML page weight, discovered resources, Content-Length, heavy assets, and JPEG/PNG vs AVIF/WebP signals." },
    h1: { ru: "Анализ веса страницы", en: "Page Weight Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы узнать размер HTML, состав найденных ресурсов и их известные размеры. Отчёт выделяет крупные файлы и показывает форматы изображений.", en: "Enter a page URL to get a limited static HTML scan: HTML size, discovered img/script/link/source resources, known weight, heavy files, and modern image format signals." },
    quickFacts: [
      { ru: "Исходный HTML", en: "Static HTML scan" },
      { ru: "Размеры ресурсов", en: "Resource bytes" },
      { ru: "Форматы AVIF/WebP", en: "AVIF/WebP signals" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите загрузку HTML и проверку до 40 найденных статических ресурсов.", en: "WebDiag loads HTML and safely inspects up to 40 discovered static resources." },
      { ru: "Проверьте известные размеры, файлы без указанного размера и самые крупные ресурсы.", en: "Review known bytes, unknown sizes, legacy images, and largest assets." },
    ],
    supportedFeatures: [
      { ru: "Ищет ресурсы img, srcset, source, script, link, preload, icon и poster в HTML.", en: "Finds img/srcset/source/script/link/preload/icon/poster resources in HTML." },
      { ru: "Определяет типы ресурсов и форматы изображений по Content-Type и URL.", en: "Detects resource types and modern image signals by content-type/URL." },
      { ru: "Показывает объём проверенной выборки и ограничения проверки.", en: "Shows the size and limits of the checked resource sample." },
    ],
    limitations: [
      { ru: "Не выполняет JavaScript и не видит ресурсы, добавленные кодом, и фоновые изображения из CSS.", en: "Does not execute JavaScript and does not see runtime/background-image resources from CSS." },
      { ru: "Для определения LCP-изображения и фактического объёма передач нужны PageSpeed или измерения в браузере.", en: "LCP image and actual transfer size require PageSpeed or browser waterfall." },
    ],
    useCases: [
      { ru: "Найти крупные изображения, JS и CSS перед подробным анализом Lighthouse.", en: "Quickly find heavy JPEG/PNG and JS/CSS assets before a full Lighthouse analysis." },
      { ru: "Проверить использование AVIF и WebP у найденных изображений.", en: "Check whether AVIF/WebP variants are used for discovered images." },
      { ru: "Сверить размеры ресурсов после релиза или смены темы.", en: "Evaluate baseline page weight after a release or theme change." },
    ],
    technicalNotes: [
      { ru: "Размер HTML ограничен; у вложенных ресурсов проверяются заголовки без скачивания тела ответа.", en: "HTML size is limited; nested resources are checked using headers without downloading their bodies." },
      { ru: "Сводка размеров отражает ресурсы исходного HTML и не заменяет измерения Core Web Vitals.", en: "The summary covers resources found in the source HTML and does not replace Core Web Vitals measurements." },
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
    metaDescription: { ru: "Посмотрите до 40 сетевых запросов Google PageSpeed Lighthouse: тип, начало, длительность и известный размер.", en: "Inspect up to 40 Google PageSpeed Lighthouse network requests: type, start, duration, and known size without exposing a raw trace." },
    h1: { ru: "Анализ загрузки ресурсов", en: "Resource Waterfall Analyzer" },
    lead: { ru: "Введите публичный URL, чтобы увидеть временную шкалу до 40 сетевых запросов из Google PageSpeed Lighthouse. Отчёт содержит выбранные данные запуска, а не полную трассировку DevTools.", en: "Enter a public URL to get a limited network-requests timeline from Google PageSpeed Lighthouse. WebDiag shows normalized rows, not a full DevTools trace." },
    quickFacts: [{ ru: "До 40 запросов", en: "Up to 40 requests" }, { ru: "Телефон / компьютер", en: "Mobile / Desktop" }, { ru: "Без параметров URL", en: "Query strings removed" }],
    howToSteps: [
      { ru: "Вставьте публичный HTTP(S) URL.", en: "Paste a public http(s) URL." },
      { ru: "Выберите телефон или компьютер.", en: "Choose a mobile or desktop strategy." },
      { ru: "Сравните начало, длительность и известный объём передачи ресурсов.", en: "Compare start time, duration, and known transfer size for the returned resources." },
    ],
    supportedFeatures: [
      { ru: "Использует проверку network-requests из ответа Google PageSpeed Lighthouse.", en: "Uses the network-requests audit from the Google PageSpeed Lighthouse response." },
      { ru: "Показывает до 40 строк и отдельно указывает число найденных и показанных запросов.", en: "Returns no more than 40 rows and explicitly separates found and returned requests." },
      { ru: "Удаляет из адресов ресурсов учётные данные, параметры запроса и фрагменты.", en: "Removes user info, query strings, and fragments from resource URLs." },
    ],
    limitations: [
      { ru: "Отчёт ограничен доступными данными PageSpeed и не содержит полной диаграммы или трассировки Chrome DevTools.", en: "The report is limited to data supplied by PageSpeed and does not include a complete Chrome DevTools waterfall or trace." },
      { ru: "PageSpeed может не вернуть проверку или размер отдельного ресурса; такие значения будут недоступны.", en: "PageSpeed may omit the audit or individual sizes; those fields remain unavailable." },
      { ru: "Порядок и длительность относятся к конкретному запуску и не описывают опыт реальных пользователей.", en: "Order and duration depend on the specific provider run and are not field data." },
    ],
    useCases: [
      { ru: "Найти поздно начинающиеся и длительные запросы в конкретном запуске Lighthouse.", en: "Find late-starting or long-running resources in a specific Lighthouse run." },
      { ru: "Сопоставить объём передачи и типы ресурсов перед подробным анализом.", en: "Compare transfer size and resource type before deeper profiling." },
      { ru: "Сравнить проверки для телефона и компьютера.", en: "Check mobile and desktop strategies without exposing the PageSpeed API key to the browser." },
    ],
    technicalNotes: [
      { ru: "Перед обращением к PageSpeed сервер проверяет URL; ключ API хранится на сервере.", en: "The backend validates the URL before calling PageSpeed API with a server-side key." },
      { ru: "Тела ответов, заголовки запросов и ответов, cookie, скриншоты и трассировки в отчёт не включаются.", en: "Response bodies, request and response headers, cookies, screenshots, and traces are excluded from the report." },
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
    seoTitle: { ru: "Проверка ресурсов, задерживающих отображение", en: "Render-Blocking Resources Checker" },
    metaDescription: { ru: "Посмотрите результат проверки render-blocking-resources в Google PageSpeed Lighthouse: до 20 ресурсов и оценку возможной экономии времени.", en: "Inspect the Google PageSpeed Lighthouse render-blocking-resources audit: up to 20 resources and estimated time savings." },
    h1: { ru: "Ресурсы, задерживающие отображение", en: "Render-Blocking Resources Checker" },
    lead: { ru: "Введите публичный URL, чтобы получить проверку render-blocking-resources из PageSpeed. Если сервис не вернул эту проверку, результат будет отмечен как недоступный.", en: "Enter a public URL to retrieve the render-blocking-resources audit from PageSpeed. If the service omits this audit, WebDiag marks the result as unavailable." },
    quickFacts: [{ ru: "Данные Lighthouse", en: "Lighthouse audit data" }, { ru: "До 20 ресурсов", en: "Up to 20 rows" }, { ru: "Оценка экономии времени", en: "Estimated time savings" }],
    howToSteps: [
      { ru: "Вставьте публичный URL и выберите телефон или компьютер.", en: "Paste a public URL and choose mobile or desktop." },
      { ru: "Запустите проверку PageSpeed.", en: "Run the PageSpeed check." },
      { ru: "Изучите оценку, пояснения Lighthouse, возможную экономию и список ресурсов.", en: "Review the audit score, provider display value, estimated savings, and returned rows." },
    ],
    supportedFeatures: [
      { ru: "Читает проверку Lighthouse с идентификатором render-blocking-resources.", en: "Reads only the audit with the render-blocking-resources ID and does not infer results from CSS or JavaScript." },
      { ru: "Показывает до 20 ресурсов с доступными размерами и оценкой потерянного времени.", en: "Shows up to 20 normalized rows with known bytes and estimated wasted time." },
      { ru: "Удаляет параметры запроса и фрагменты из адресов ресурсов перед показом отчёта.", en: "Removes query strings and fragments from resource URLs before responding to the frontend." },
    ],
    limitations: [
      { ru: "Проверка render-blocking-resources может отсутствовать в конкретной версии или запуске Lighthouse.", en: "Lighthouse is evolving toward Performance Insights and may omit this legacy audit in a specific version or run." },
      { ru: "Оценка экономии рассчитана Lighthouse в лабораторных условиях; это не измеренный эффект после исправления.", en: "Estimated savings are a provider lab estimate, not measured savings after a fix." },
      { ru: "Инструмент не меняет CSS и JavaScript и не подтверждает безопасность удаления конкретного файла.", en: "The tool does not modify CSS or JavaScript and cannot prove that removing a specific file is safe." },
    ],
    useCases: [
      { ru: "Найти отмеченные Lighthouse ресурсы перед оптимизацией начальной загрузки.", en: "Check for provider-confirmed blocking resources before optimizing the critical path." },
      { ru: "Сравнить проверки для телефона и компьютера.", en: "Compare mobile and desktop audits for one page." },
      { ru: "Проверить, вернул ли PageSpeed сведения о задерживающих ресурсах.", en: "Check whether PageSpeed returned the render-blocking resource audit." },
    ],
    technicalNotes: [
      { ru: "Принимаются только публичные URL; запрос к PageSpeed выполняется с серверным ключом.", en: "Only public URLs are accepted; PageSpeed is called using a server-side API key." },
      { ru: "Отчёт не содержит трассировок, скриншотов, тел ответов и закрытых заголовков.", en: "A missing audit is distinct from an available audit with no returned item rows." },
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
    seoTitle: { ru: "Проверка загрузки изображений", en: "Image Performance Checker" },
    metaDescription: { ru: "Проверьте форматы изображений, известные размеры, width/height, srcset, picture и loading в исходном HTML.", en: "Check AVIF/WebP/JPEG/PNG/SVG formats, image weight, responsive markup, width/height, lazy-loading, and optimization recommendations." },
    h1: { ru: "Проверка загрузки изображений", en: "Image Performance Checker" },
    lead: { ru: "Введите URL страницы, чтобы проверить подключения изображений, форматы, указанные размеры, адаптивную разметку и настройки загрузки.", en: "Enter a page URL to inspect image references, formats, known file sizes, dimensions, responsive markup, and loading settings." },
    quickFacts: [
      { ru: "AVIF / WebP", en: "AVIF/WebP" },
      { ru: "Размеры изображений", en: "Image bytes" },
      { ru: "Адаптивная разметка", en: "Responsive markup" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите разбор изображений и доступных заголовков файлов.", en: "WebDiag loads the HTML and safely inspects discovered image candidates." },
      { ru: "Проверьте крупные изображения, форматы, размеры и атрибуты загрузки.", en: "Review formats, known bytes, oversized images, responsive delivery, and lazy-loading." },
    ],
    supportedFeatures: [
      { ru: "Собирает изображения из img, srcset, picture и метатегов социальных карточек.", en: "Finds img, srcset, picture/source, and social preview images in static HTML." },
      { ru: "Проверяет форматы и известные размеры файлов по заголовкам ответа.", en: "Classifies AVIF, WebP, JPEG, PNG, SVG, GIF, ICO, and unknown formats." },
      { ru: "Проверяет width, height, loading и адаптивные источники.", en: "Checks image dimensions, responsive sources, and lazy-loading markup." },
    ],
    limitations: [
      { ru: "Не определяет фактическое LCP-изображение и не измеряет отрисовку в браузере.", en: "Static HTML scan does not execute JS and does not see CSS background-image/runtime assets." },
      { ru: "Не выполняет JavaScript и не оценивает визуальное качество сжатия.", en: "LCP image and actual transfer size are confirmed with PageSpeed/browser waterfall." },
    ],
    useCases: [
      { ru: "Найти крупные JPEG и PNG для дальнейшей оптимизации.", en: "Find heavy JPG/PNG images that should move to AVIF/WebP." },
      { ru: "Проверить размеры и адаптивные источники в шаблоне CMS.", en: "Check width/height and responsive image markup after a release." },
      { ru: "Сверить настройки загрузки изображений после релиза.", en: "Prepare image fixes before Core Web Vitals optimization." },
    ],
    technicalNotes: [
      { ru: "Анализ ограничен исходным HTML и доступной выборкой ресурсов.", en: "Analysis is limited to source HTML and the available resource sample." },
      { ru: "Content-Length может отсутствовать и не заменяет измерение загрузки изображения в браузере.", en: "Content-Length may be missing and does not replace browser measurements of image loading." },
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
    seoTitle: { ru: "Анализ ссылок на странице", en: "Internal and External Link Analyzer" },
    metaDescription: { ru: "Проверьте внутренние и внешние ссылки, тексты, rel, target, якоря, mailto и tel в исходном HTML страницы.", en: "Inspect links in page HTML: internal and external addresses, nofollow, sponsored, UGC, target, anchors, mailto, and tel." },
    h1: { ru: "Анализ ссылок страницы", en: "Page Link Analyzer" },
    lead: { ru: "Введите URL страницы, чтобы получить список ссылок и проверить их тексты, атрибуты и распределение между внутренними и внешними адресами.", en: "Enter a page URL to get a limited static HTML link analysis: internal and external URLs, rel signals, anchor links, unsafe target=_blank, and likely SEO issues." },
    quickFacts: [
      { ru: "Внутренние и внешние ссылки", en: "Static HTML scan" },
      { ru: "Тексты ссылок", en: "Internal/external links" },
      { ru: "Атрибуты rel", en: "rel and target signals" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste the public page URL you want to inspect." },
      { ru: "Запустите извлечение ссылок из исходного HTML.", en: "WebDiag fetches the HTML and extracts HTTP(S), anchor, mailto, and tel links." },
      { ru: "Проверьте тексты, адреса и атрибуты ссылок.", en: "Review internal/external distribution, rel signals, and recommendations." },
    ],
    supportedFeatures: [
      { ru: "Разделяет внутренние и внешние ссылки.", en: "Counts internal, external, same-page, mailto, tel, and non-http links without launching a browser." },
      { ru: "Показывает тексты ссылок, nofollow, sponsored, ugc и target=_blank без noopener/noreferrer.", en: "Shows rel=nofollow, sponsored, ugc, and target=_blank without noopener/noreferrer." },
      { ru: "Разрешает относительные адреса относительно конечного URL страницы.", en: "Resolves relative link addresses against the final page URL." },
    ],
    limitations: [
      { ru: "Не обходит целевые страницы и не проверяет доступность каждой ссылки.", en: "The tool analyzes static HTML for one page and does not execute JavaScript." },
      { ru: "Не видит ссылки, добавленные JavaScript после загрузки HTML.", en: "This is not a full crawler: it does not build the whole-site graph or verify every URL availability." },
    ],
    useCases: [
      { ru: "Проверить перелинковку посадочной страницы.", en: "Check a landing page link structure before an SEO release." },
      { ru: "Найти ссылки без понятного текста.", en: "Find external links without correct rel signals." },
      { ru: "Сверить внешние ссылки и их атрибуты после изменения шаблона.", en: "Detect target=_blank without noopener/noreferrer in public markup." },
    ],
    technicalNotes: [
      { ru: "Результат строится по исходному HTML одной страницы.", en: "URLs are normalized against the page final URL, including relative href values." },
      { ru: "Для проверки HTTP-ошибок используйте инструмент поиска битых ссылок.", en: "Links inserted by JavaScript after load require a separate browser check." },
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
    seoTitle: { ru: "Проверка битых ссылок страницы", en: "Broken Link Checker for a Page" },
    metaDescription: { ru: "Проверьте найденные в HTML ссылки на HTTP-ошибки 4xx, 5xx и недоступные адреса в пределах лимита проверки.", en: "Find broken HTTP links in one page static HTML: 4xx, 5xx, unreachable URLs, and checked statuses with safe limits." },
    h1: { ru: "Проверка битых ссылок", en: "Broken Link Checker" },
    lead: { ru: "Введите URL страницы, чтобы извлечь HTTP(S)-ссылки и проверить ограниченный набор уникальных адресов на ошибки ответа.", en: "Enter a page URL so WebDiag extracts HTTP(S) links from HTML and safely checks a limited set of unique URLs for response errors." },
    quickFacts: [
      { ru: "Ссылки HTTP(S)", en: "HTTP(S) links" },
      { ru: "4xx / 5xx", en: "4xx / 5xx" },
      { ru: "Ограниченная выборка", en: "Bounded checks" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите проверку ссылок, найденных в исходном HTML.", en: "The tool extracts unique HTTP(S) links from static HTML." },
      { ru: "Проверьте ошибки, пропущенные адреса, статусы и рекомендации.", en: "Review the broken list, skipped count, statuses, and remediation recommendations." },
    ],
    supportedFeatures: [
      { ru: "Проверяет ограниченное число уникальных HTTP(S)-ссылок за запуск.", en: "Checks up to a safe limit of unique HTTP(S) links per run." },
      { ru: "Отмечает 4xx, 5xx, сетевые ошибки и заблокированные адреса для дальнейшей проверки.", en: "Marks 4xx, 5xx, and network/policy errors as broken candidates." },
      { ru: "Запрашивает заголовки целевых страниц без скачивания их содержимого.", en: "Checks target response headers without downloading page bodies." },
    ],
    limitations: [
      { ru: "Не видит ссылки, добавленные JavaScript после загрузки.", en: "Static HTML scan does not see links created by JavaScript after load." },
      { ru: "Проверяет ссылки одной страницы и не обходит весь сайт или страницы карты сайта.", en: "The tool checks one page, not the whole site and not a sitemap recrawl." },
    ],
    useCases: [
      { ru: "Найти ссылки с ответами 404 и 500 перед публикацией страницы.", en: "Find 404/500 links on a commercial page before publishing." },
      { ru: "Проверить внешние ссылки после миграции, редизайна или смены CMS.", en: "Check external links after a migration, redesign, or CMS change." },
      { ru: "Подготовить список недоступных адресов для исправления.", en: "Reduce SEO risk from links to deleted pages and broken resources." },
    ],
    technicalNotes: [
      { ru: "Время, редиректы и число запросов ограничены; обращения к частным адресам блокируются.", en: "Limits request time, redirect count, and request count; requests to private addresses are blocked." },
      { ru: "Ссылки mailto, tel, фрагменты и другие адреса без HTTP(S) не проверяются и считаются пропущенными.", en: "mailto, tel, anchor, and non-http links are not broken HTTP URLs and are counted as skipped." },
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
    metaDescription: { ru: "Проверьте изображения из HTML и социальных метатегов на ошибки 4xx, 5xx, недоступность и неверный Content-Type.", en: "Check images from img, srcset, picture source, og:image, and twitter:image for 404, 5xx, unavailability, and wrong content-type." },
    h1: { ru: "Проверка битых изображений", en: "Broken Image Checker" },
    lead: { ru: "Введите URL страницы, чтобы найти недоступные изображения, ошибочные HTTP-статусы и ответы с типом содержимого, не соответствующим изображению.", en: "Enter a page URL to find broken images in static HTML and social previews: unavailable files, error statuses, and responses without an image content-type." },
    quickFacts: [
      { ru: "img / picture / srcset", en: "img / picture / srcset" },
      { ru: "Изображения Open Graph и X", en: "OG/Twitter images" },
      { ru: "Content-Type", en: "Content-Type" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы с изображениями.", en: "Paste a page URL that contains images." },
      { ru: "Запустите сбор адресов из img, srcset, picture и социальных метатегов.", en: "WebDiag collects img/srcset/picture and social image candidates from the HTML." },
      { ru: "Проверьте недоступные изображения, неверные типы содержимого и пропущенные адреса.", en: "Review broken images, wrong content types, and skipped candidates." },
    ],
    supportedFeatures: [
      { ru: "Извлекает адреса из img src, srcset, picture source, poster и социальных метатегов.", en: "Extracts images from img src, srcset, picture source, poster, and meta social image tags." },
      { ru: "Проверяет HTTP-статус, конечный URL и Content-Type image/* без скачивания тела ответа.", en: "Checks HTTP status, final URL, and image/* content-type without downloading the body." },
      { ru: "Показывает, сколько изображений проверено и сколько пропущено из-за лимита.", en: "Shows how many image addresses were checked and how many were skipped because of the limit." },
    ],
    limitations: [
      { ru: "Не видит фоновые изображения CSS и изображения, добавленные JavaScript; их нужно проверять в браузере.", en: "CSS background images and images inserted by JavaScript require browser checks." },
      { ru: "Проверяет доступность, но не визуальное качество сжатия.", en: "Checks image availability; visual compression quality is not assessed." },
    ],
    useCases: [
      { ru: "Найти недоступные изображения товаров и главного блока после релиза или миграции CDN.", en: "Find broken product/hero images after deployment or CDN migration." },
      { ru: "Проверить og:image и twitter:image перед публикацией ссылки в соцсетях.", en: "Check og:image and twitter:image before publishing a page to social platforms." },
      { ru: "Найти адреса изображений, возвращающие HTML или ошибку.", en: "See images that return HTML, redirects, or errors instead of an image content-type." },
    ],
    technicalNotes: [
      { ru: "Адреса разрешаются относительно конечного URL страницы; повторы исключаются.", en: "Image URLs are normalized against the page final URL and deduplicated." },
      { ru: "У ресурсов проверяются заголовки с ограничением редиректов и защитой от частных адресов.", en: "Checks response headers with redirect limits and protection against requests to private addresses." },
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
    seoTitle: { ru: "SEO-аудит изображений страницы", en: "Page Image SEO Audit" },
    metaDescription: { ru: "Проверьте alt, изображения внутри ссылок, width/height, адаптивную разметку, отложенную загрузку и социальные изображения.", en: "Check alt text, linked images, dimensions, lazy-loading, responsive markup, and Open Graph and Twitter/X images." },
    h1: { ru: "SEO-аудит изображений", en: "Page Image SEO Audit" },
    lead: { ru: "Проверьте разметку изображений: наличие alt, изображения внутри ссылок, пустые alt, размеры, адаптивные источники, отложенную загрузку и изображения социальных карточек.", en: "Check page images as SEO signals: alt coverage, linked images, empty decorative alt, dimensions, responsive markup, lazy-loading, and social preview image." },
    quickFacts: [
      { ru: "Атрибуты alt", en: "Alt coverage" },
      { ru: "Изображения в ссылках", en: "Linked images" },
      { ru: "PNG / JPEG / WebP", en: "PNG/JPEG/WebP" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste a page URL." },
      { ru: "Запустите анализ исходного HTML.", en: "Run a static HTML scan through the WebDiag API." },
      { ru: "Проверьте alt, изображения в ссылках, размеры и социальные метатеги.", en: "Fix alt, linked images, dimensions, and social preview image by priority." },
    ],
    supportedFeatures: [
      { ru: "Различает отсутствующие alt, пустые alt и изображения внутри ссылок без текста.", en: "Distinguishes missing alt, empty decorative alt, and linked images without text." },
      { ru: "Проверяет width/height, srcset/picture и настройки загрузки.", en: "Checks width/height, srcset/picture, and loading strategy." },
      { ru: "Показывает изображения og:image и twitter:image.", en: "Shows og:image and twitter:image as part of image SEO." },
    ],
    limitations: [
      { ru: "Не выполняет JavaScript и не проверяет изображения, появляющиеся только после его выполнения.", en: "Does not execute JavaScript and does not check images created only by runtime rendering." },
      { ru: "Не составляет описания изображений; содержательность alt нужно проверить вручную.", en: "Does not write image descriptions; review alt text relevance manually." },
    ],
    useCases: [
      { ru: "Проверить alt и размеры изображений в шаблоне каталога или блога.", en: "Check a CMS catalog/blog template for image alt text and dimensions." },
      { ru: "Найти изображения-ссылки без текстового эквивалента.", en: "Find linked images without a text equivalent." },
      { ru: "Сверить изображение социальной карточки перед публикацией страницы.", en: "Check social preview image before publishing a page." },
    ],
    technicalNotes: [
      { ru: "Пустой alt может быть уместен для декоративного изображения; назначение нужно оценить вручную.", en: "An empty alt can be appropriate for decorative images; review the purpose manually." },
      { ru: "Разбор выполняется по исходному HTML с ограничением размера ответа и защитой от частных адресов.", en: "The check runs on static HTML and safe URL policy." },
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
    seoTitle: { ru: "Проверка favicon и иконок веб-приложения", en: "Favicon and Web App Icon Checker" },
    metaDescription: { ru: "Проверьте rel=icon, SVG, /favicon.ico, apple-touch-icon, ссылку на manifest и доступность иконок сайта.", en: "Check rel=icon, SVG favicon, /favicon.ico fallback, apple-touch-icon, manifest, and web app icon availability." },
    h1: { ru: "Проверка favicon и иконок сайта", en: "Favicon and App Icons Checker" },
    lead: { ru: "Введите URL страницы, чтобы проверить объявления иконок, запасной адрес /favicon.ico, apple-touch-icon, ссылку на манифест и доступность файлов.", en: "Enter a page URL to check declared site icons: SVG favicon, ICO fallback, apple-touch-icon, web app manifest, and file availability." },
    quickFacts: [
      { ru: "SVG favicon", en: "SVG favicon" },
      { ru: "apple-touch-icon", en: "Apple touch icon" },
      { ru: "Манифест", en: "Manifest" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste a page URL." },
      { ru: "Запустите поиск rel=icon, apple-touch-icon, manifest и проверку /favicon.ico.", en: "WebDiag finds link rel=icon/apple-touch-icon/manifest and checks fallback /favicon.ico." },
      { ru: "Проверьте форматы, размеры, статусы и недостающие объявления иконок.", en: "Review formats, sizes, statuses, and missing app icon signals." },
    ],
    supportedFeatures: [
      { ru: "Проверяет объявленные иконки и запасной адрес /favicon.ico.", en: "Checks declared icons and fallback /favicon.ico." },
      { ru: "Определяет SVG, PNG и ICO по Content-Type и URL.", en: "Detects SVG/PNG/ICO by content-type and URL." },
      { ru: "Показывает адрес манифеста веб-приложения.", en: "Shows the web app manifest URL." },
    ],
    limitations: [
      { ru: "Не выполняет полный аудит PWA и не проверяет содержимое манифеста.", en: "Does not run a full PWA audit or validate manifest contents." },
      { ru: "Не проверяет отображение иконок во всех браузерах и операционных системах.", en: "Does not verify icon rendering in every browser/OS." },
    ],
    useCases: [
      { ru: "Сверить favicon после редизайна или смены домена.", en: "Check favicon after a redesign or domain migration." },
      { ru: "Найти недоступные иконки и отсутствие apple-touch-icon.", en: "Find broken icon links and missing apple-touch-icon." },
      { ru: "Проверить подключения иконок для вкладок, закладок и главного экрана телефона.", en: "Prepare the site for clean display in tabs, bookmarks, and mobile home screen." },
    ],
    technicalNotes: [
      { ru: "Загрузка ограничена по времени и размеру; /favicon.ico проверяется как запасной адрес для совместимости.", en: "The check uses limited safe fetch; /favicon.ico is added as a compatibility fallback." },
      { ru: "Инструмент проверяет подключения и доступность иконок; создание файлов выполняется отдельно.", en: "This is an app icon coverage checker, not a favicon generator." },
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
    metaDescription: { ru: "Проверьте JSON-LD в HTML страницы: синтаксис JSON, объявленные типы Schema.org, число блоков и ошибки разбора.", en: "Check JSON-LD in page HTML: JSON syntax, declared Schema.org types, block counts, and parsing errors." },
    h1: { ru: "Проверка структурированных данных", en: "Structured Data Validator" },
    lead: { ru: "Введите URL, чтобы проверить блоки JSON-LD в исходном HTML: найти синтаксические ошибки, увидеть объявленные типы Schema.org и число объектов.", en: "Enter a URL to inspect JSON-LD blocks on a page: how many were found, which Schema.org types are declared, whether syntax errors exist, and what to fix before rich-result tests." },
    quickFacts: [
      { ru: "JSON-LD", en: "JSON-LD" },
      { ru: "Типы Schema.org", en: "Schema.org types" },
      { ru: "Ошибки разбора", en: "Parse errors" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы со структурированными данными.", en: "Paste the page URL that contains structured data." },
      { ru: "Запустите проверку страницы.", en: "Run the check through the WebDiag API." },
      { ru: "Изучите найденные типы и ошибки каждого блока JSON-LD.", en: "Review JSON-LD validity, detected types, and errors for each block." },
    ],
    supportedFeatures: [
      { ru: "Извлекает блоки script type=application/ld+json из HTML.", en: "Extracts all script type=application/ld+json blocks from the page HTML." },
      { ru: "Показывает корректные и некорректные блоки, типы Schema.org и число объектов.", en: "Shows valid and invalid blocks, Schema.org types, and JSON-LD node counts." },
      { ru: "Загружает HTML с ограничением размера и защитой от обращений к частным адресам.", en: "Fetches HTML within a size limit, with protection against requests to private addresses." },
    ],
    limitations: [
      { ru: "Проверка синтаксиса и типов не подтверждает право на расширенный результат поиска.", en: "The tool checks JSON-LD syntax and types, but does not guarantee rich result eligibility." },
      { ru: "Разметка, добавленная JavaScript, не анализируется.", en: "Structured data added by JavaScript are not analyzed." },
    ],
    useCases: [
      { ru: "Найти ошибки JSON-LD после изменения шаблона CMS.", en: "Find broken JSON-LD after CMS template changes." },
      { ru: "Узнать, какие типы Schema.org отдаются в исходном HTML.", en: "Check which Schema.org types are actually delivered in HTML." },
      { ru: "Подготовить разметку к проверке в Google Rich Results Test.", en: "Prepare a page for later verification in Google rich results tools." },
    ],
    technicalNotes: [
      { ru: "Выполняется разбор JSON с рекурсивным сбором значений @type.", en: "The check performs syntactic JSON parsing and recursively collects @type values." },
      { ru: "Инструмент не запускает Google Rich Results Test и не проверяет все смысловые ограничения Schema.org.", en: "This is not an external Google Rich Results Test integration and not a Schema.org reasoner." },
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
    metaDescription: { ru: "Соберите JSON-LD по шаблонам Organization, LocalBusiness, FAQPage и BreadcrumbList из введённых данных локально в браузере.", en: "Build Organization, LocalBusiness, FAQPage, and BreadcrumbList JSON-LD from your data locally in the browser." },
    h1: { ru: "Генератор Schema.org JSON-LD", en: "Schema.org JSON-LD Generator" },
    lead: { ru: "Выберите тип разметки и заполните поля данными страницы. Генератор соберёт JSON-LD для вставки в HTML; соответствие содержимому и требованиям поиска нужно проверить перед публикацией.", en: "Choose a markup type and enter page data to build JSON-LD for HTML. Check its content and search requirements before publication." },
    quickFacts: [
      { ru: "Локально в браузере", en: "In your browser" },
      { ru: "4 шаблона", en: "4 templates" },
      { ru: "Из введённых данных", en: "Uses your input" },
    ],
    howToSteps: [
      { ru: "Выберите тип разметки Schema.org.", en: "Choose the Schema.org template type." },
      { ru: "Заполните поля фактическими данными, опубликованными на странице.", en: "Fill in only factual data that exists on the page." },
      { ru: "Скопируйте JSON-LD и проверьте разметку после внедрения.", en: "Copy the JSON-LD and then validate the published page." },
    ],
    supportedFeatures: [
      { ru: "Создаёт разметку Organization, LocalBusiness, FAQPage и BreadcrumbList.", en: "Generates Organization, LocalBusiness, FAQPage, and BreadcrumbList templates." },
      { ru: "Обрабатывает данные в браузере без отправки на сервер.", en: "Runs in the browser without sending entered data to the backend." },
      { ru: "Формирует блок script type=application/ld+json для вставки в HTML.", en: "Creates script type=application/ld+json ready to paste into HTML." },
    ],
    limitations: [
      { ru: "Наличие разметки не гарантирует расширенный результат поиска.", en: "This is a template generator, not an AI copywriter and not a rich result guarantee." },
      { ru: "Разметка должна описывать видимое содержимое страницы.", en: "You must manually ensure the markup describes visible page content." },
    ],
    useCases: [
      { ru: "Собрать основную разметку Organization или LocalBusiness.", en: "Quickly build basic Organization or LocalBusiness markup." },
      { ru: "Подготовить FAQPage по утверждённым вопросам и ответам.", en: "Prepare FAQPage JSON-LD from approved questions and answers." },
      { ru: "Сформировать BreadcrumbList для навигационной цепочки.", en: "Generate BreadcrumbList for a templated page." },
    ],
    technicalNotes: [
      { ru: "JSON создаётся из введённых значений по структуре выбранного шаблона.", en: "The generator produces JSON.stringify output with a fixed structure for supported types." },
      { ru: "После публикации проверьте конечный URL инструментом проверки структурированных данных.", en: "After publishing, the result should be checked through the Structured Data Validator." },
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
    metaDescription: { ru: "Проверьте doctype, html/head/body, lang, title, viewport, повторяющиеся id и несогласованные открывающие и закрывающие теги.", en: "Check basic page HTML structure: doctype, html/head/body, lang, title, viewport, duplicate IDs, and unmatched tags." },
    h1: { ru: "Проверка HTML-разметки", en: "HTML Markup Validator" },
    lead: { ru: "Введите URL, чтобы проверить основные элементы HTML и найти распространённые ошибки шаблона: повторяющиеся id, незакрытые теги и недостающие объявления.", en: "Enter a URL to check essential HTML elements and find common template issues, including duplicate IDs, unclosed tags, and missing declarations." },
    quickFacts: [
      { ru: "Структура HTML", en: "HTML structure" },
      { ru: "Повторяющиеся id", en: "Duplicate IDs" },
      { ru: "Мобильный viewport", en: "Mobile viewport" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste the page URL." },
      { ru: "Запустите проверку HTML-разметки.", en: "Run the HTML markup check through the backend." },
      { ru: "Изучите замечания по doctype, lang, title, viewport, id и закрытию тегов.", en: "Fix doctype, lang, title, viewport, duplicate IDs, and unmatched tag issues." },
    ],
    supportedFeatures: [
      { ru: "Проверяет doctype, html/head/body, lang, title и viewport.", en: "Checks doctype, html/head/body, html lang, title, and viewport." },
      { ru: "Находит повторяющиеся id, лишние закрывающие и незакрытые непустые теги.", en: "Finds duplicate id attributes, unexpected closing tags, and unclosed non-void tags." },
      { ru: "Загружает HTML с ограничением размера и защитой от частных адресов.", en: "Uses safe backend HTML fetching with SSRF protection." },
    ],
    limitations: [
      { ru: "Проверка охватывает выбранные правила HTML и не заменяет полную проверку соответствия стандарту W3C.", en: "This is WebDiag markup inspection, not full W3C conformance validation." },
      { ru: "DOM, изменённый JavaScript после загрузки, не анализируется.", en: "The DOM modified by JavaScript after loading is not analyzed." },
    ],
    useCases: [
      { ru: "Проверить шаблон после миграции CMS или изменения серверной генерации HTML.", en: "Check a template after a CMS migration or SSR/SSG release." },
      { ru: "Найти повторяющиеся id, которые могут нарушать работу якорей, подписей, ARIA и скриптов.", en: "Find duplicate IDs that break anchors, labels, ARIA, and scripts." },
      { ru: "Проверить основные элементы HTML перед SEO-аудитом.", en: "Quickly see basic HTML issues before an SEO audit." },
    ],
    technicalNotes: [
      { ru: "Парсер анализирует исходный ответ HTML и не выполняет JavaScript.", en: "The parser analyzes the raw HTML response and does not execute JavaScript." },
      { ru: "Для полной проверки стандарта используйте специализированный валидатор HTML.", en: "The report is intentionally framed as practical inspection so it does not imitate an external W3C validator." },
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
    seoTitle: { ru: "Проверка метатегов страницы онлайн", en: "Meta Tags Checker" },
    metaDescription: { ru: "Проверьте title, description, robots, canonical, Open Graph, Twitter/X и наличие JSON-LD в исходном HTML одной страницы.", en: "Check title, description, robots, canonical, Open Graph, Twitter/X, and JSON-LD summary for one page." },
    h1: { ru: "Проверка метатегов", en: "Meta Tags Checker" },
    lead: { ru: "Введите URL, чтобы проверить SEO-метаданные страницы: title, description, robots, canonical, сведения о H1, социальных карточках и JSON-LD.", en: "Enter a URL to review title, description, robots, canonical, H1 summary, social metadata, and JSON-LD." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "SEO-метаданные", en: "SEO metadata" },
      { ru: "Общая сводка", en: "Aggregate checks" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес страницы.", en: "Paste the page address you need to check." },
      { ru: "Запустите проверку и дождитесь отчёта.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Изучите title, description, robots, canonical, социальные метатеги и сведения о JSON-LD.", en: "Review title, description, robots, canonical, social metadata, and JSON-LD summary." },
    ],
    supportedFeatures: [
      { ru: "Собирает основные SEO-метаданные в одном отчёте.", en: "Collects the main SEO metadata in one report." },
      { ru: "Показывает длину title и description, сведения о canonical, директивы robots и наличие социальных метатегов.", en: "Shows title/description length, canonical summary, robots directives, and social metadata coverage." },
      { ru: "Загружает HTML с ограничением размера и защитой от обращений к частным адресам.", en: "Fetches HTML within a size limit, with protection against requests to private addresses." },
    ],
    limitations: [
      { ru: "Проверяет одну страницу и не ищет повторы метаданных по всему сайту.", en: "The tool checks one page and does not search for duplicate metadata across the site." },
      { ru: "Сведения о H1 краткие; для полной иерархии используйте проверку структуры заголовков.", en: "H1 is only a summary signal here; the full heading hierarchy belongs in Heading Structure Checker." },
    ],
    useCases: [
      { ru: "Проверить метаданные посадочной страницы перед публикацией.", en: "Quickly check whether a landing page is ready for indexing and a sane snippet." },
      { ru: "Найти отсутствующие поля после изменения шаблона.", en: "Find missing metadata after a template change." },
      { ru: "Сверить canonical, robots и социальные метатеги после миграции CMS.", en: "Compare canonical, robots, and social metadata after migration or CMS changes." },
    ],
    technicalNotes: [
      { ru: "Данные извлекаются из исходного HTML без выполнения JavaScript.", en: "The tool extracts HTML metadata from the fetched page and does not perform JavaScript rendering." },
      { ru: "Относительный canonical разрешается относительно конечного URL после редиректов.", en: "Canonical is resolved relative to the final URL after redirects." },
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
    metaDescription: { ru: "Посмотрите пример поискового результата по title и meta description страницы: заголовок, описание, адрес и предупреждения.", en: "Preview a search result using the page title and meta description, with warnings about missing or unsuitable metadata." },
    h1: { ru: "Предпросмотр поискового сниппета", en: "SERP Snippet Preview" },
    lead: { ru: "Введите URL, чтобы увидеть пример поискового сниппета: адрес, заголовок, описание и замечания к исходным метаданным страницы.", en: "Enter a URL to see how a page may appear in search results: display URL, title, description, fallback sources, and snippet warnings." },
    quickFacts: [
      { ru: "Поисковый сниппет", en: "SERP preview" },
      { ru: "Title и description", en: "Title/description" },
      { ru: "Предупреждения", en: "Snippet warnings" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste the page URL." },
      { ru: "Запустите предпросмотр и проверьте источники заголовка и описания.", en: "Run the preview and check where title and description came from." },
      { ru: "Исправьте отсутствующие, слишком короткие или перегруженные метаданные.", en: "Fix missing, too short, or bloated snippet signals." },
    ],
    supportedFeatures: [
      { ru: "Строит пример сниппета по данным загруженного HTML.", en: "Builds a sample search snippet from the fetched page HTML." },
      { ru: "Показывает запасные значения, если title или description отсутствуют.", en: "Shows fallback sources when title or description is missing." },
      { ru: "Отдельно предупреждает о noindex на странице.", en: "Separately warns when the page contains noindex." },
    ],
    limitations: [
      { ru: "Поисковая система может изменить заголовок и описание; пример не гарантирует вид результата в выдаче.", en: "Search engines may rewrite snippets; the tool shows controllable HTML signals, not a guaranteed SERP." },
      { ru: "Не проверяет позиции страницы и CTR.", en: "The tool does not analyze actual rankings or CTR." },
    ],
    useCases: [
      { ru: "Проверить метаданные перед запуском рекламы или SEO-релизом.", en: "Check a landing page before paid traffic or an SEO release." },
      { ru: "Согласовать пример сниппета с редактором или клиентом.", en: "Review a snippet with a client without manually copying HTML." },
      { ru: "Узнать, сохранились ли title и description после изменения шаблона.", en: "See whether title or description was lost after template changes." },
    ],
    technicalNotes: [
      { ru: "Для предпросмотра используются title и meta description, извлечённые из HTML.", en: "The preview is built from title and meta description extracted by the backend HTML check." },
      { ru: "Инструмент не запрашивает Google Search Console и не собирает поисковую выдачу.", en: "This is not a Google Search Console request and not SERP scraping." },
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
    metaDescription: { ru: "Проверьте карточку ссылки для соцсетей и мессенджеров: Open Graph, Twitter/X Card, заголовок, описание, изображение и URL.", en: "Check page rich previews for social networks and messengers: OG title, description, image, URL, and Twitter/X Card." },
    h1: { ru: "Предпросмотр Open Graph и Twitter/X Card", en: "Open Graph and Twitter/X Card Preview" },
    lead: { ru: "Введите URL, чтобы проверить метаданные социальных карточек, увидеть пример заголовка, описания и изображения и найти недостающие поля.", en: "Enter a URL to check social and messenger preview cards: Open Graph, Twitter/X Card, fallback data, image, and missing fields." },
    quickFacts: [
      { ru: "Open Graph", en: "Open Graph" },
      { ru: "Twitter/X Card", en: "Twitter/X Card" },
      { ru: "Карточка ссылки", en: "Rich preview" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы.", en: "Paste the page URL." },
      { ru: "Запустите проверку и сравните карточки Open Graph и Twitter/X.", en: "Run the check and compare Open Graph and Twitter/X preview." },
      { ru: "Исправьте отсутствующие заголовок, описание, изображение или тип карточки.", en: "Fix missing title, description, image, or card type." },
    ],
    supportedFeatures: [
      { ru: "Извлекает og:title, og:description, og:image, og:url, og:type и метатеги twitter:*.", en: "Extracts og:title, og:description, og:image, og:url, og:type, and twitter:* metadata." },
      { ru: "Разрешает относительные адреса изображений относительно конечного URL страницы.", en: "Resolves relative images against the final URL after redirects." },
      { ru: "Использует обычные title и description как запасные значения при отсутствии социальных метатегов.", en: "Shows fallback from normal title/description when social metadata is partially missing." },
    ],
    limitations: [
      { ru: "Не скачивает изображение и не проверяет его фактические размеры.", en: "Does not download the image or validate its actual dimensions." },
      { ru: "Соцсеть может сохранить старую карточку в кэше; после исправления может потребоваться обновление через саму платформу.", en: "Different platforms can cache previews, so platform cache refresh may be needed after fixes." },
    ],
    useCases: [
      { ru: "Проверить карточку страницы перед публикацией ссылки в Telegram, VK, X или мессенджерах.", en: "Check a page preview before sharing in Telegram, VK, X, or messengers." },
      { ru: "Найти отсутствующее og:image после миграции шаблонов или CDN.", en: "Find missing og:image after template or CDN migration." },
      { ru: "Согласовать пример карточки перед запуском кампании.", en: "Review rich preview with marketing before a campaign launch." },
    ],
    technicalNotes: [
      { ru: "Если собственные поля twitter:* отсутствуют, используются доступные значения Open Graph.", en: "Twitter/X preview can use Open Graph fallback when explicit twitter:* fields are missing." },
      { ru: "Результат основан на метатегах одной страницы; итоговый вид карточки зависит от платформы.", en: "The result is based on one page’s metadata; the final card appearance depends on the platform." },
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
    metaDescription: { ru: "Проверьте HSTS, CSP, nosniff, защиту от встраивания во фрейм, Referrer-Policy и Permissions-Policy в ответе страницы.", en: "Check HSTS, CSP, nosniff, frame protection, Referrer-Policy, and Permissions-Policy for a single page." },
    h1: { ru: "Проверка заголовков безопасности", en: "Security Headers Checker" },
    lead: { ru: "Введите URL, чтобы проверить основные HTTP-заголовки безопасности и получить замечания по защите от встраивания во фрейм, обработке MIME, передаче referrer и доступу к API браузера.", en: "Enter a URL to check the core HTTP headers that reduce XSS, clickjacking, referrer leakage, and unsafe browser API exposure." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "HTTP-заголовки", en: "HTTP headers" },
      { ru: "Оценка заголовков", en: "Security score" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес страницы или домена.", en: "Paste the page or domain address you need to check." },
      { ru: "Запустите проверку и дождитесь отчёта.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Изучите HSTS, CSP, nosniff, защиту от фреймов, Referrer-Policy и Permissions-Policy.", en: "Review HSTS, CSP, nosniff, frame protection, Referrer-Policy, and Permissions-Policy." },
    ],
    supportedFeatures: [
      { ru: "Загружает заголовки ответа с ограничением редиректов и защитой от частных адресов.", en: "Safe header fetching through the backend with SSRF protection and redirect limits." },
      { ru: "Показывает оценку, уровень риска и найденные и отсутствующие заголовки.", en: "Shows the score, risk level, present headers, and missing headers." },
      { ru: "Даёт рекомендации по HTTPS, CSP, HSTS и ограничениям возможностей браузера.", en: "Provides practical advice for HTTPS, CSP, HSTS, and browser hardening." },
    ],
    limitations: [
      { ru: "Проверяет один URL и не подтверждает одинаковую настройку заголовков на всём сайте.", en: "The tool checks one URL and does not prove that headers are consistent across the whole site." },
      { ru: "Не проводит тестирование на проникновение и не анализирует уязвимости JavaScript-кода.", en: "It is not a pentest and does not analyze actual JavaScript vulnerabilities." },
    ],
    useCases: [
      { ru: "Сверить заголовки безопасности после смены CDN, nginx, промежуточного обработчика или хостинга.", en: "Check whether security headers were lost after CDN, nginx, middleware, or hosting changes." },
      { ru: "Проверить основные настройки защиты от встраивания, определения MIME и передачи referrer.", en: "Quickly see whether basic protection exists against clickjacking, MIME sniffing, and excessive referrer leakage." },
      { ru: "Передать разработчику список отсутствующих заголовков.", en: "Give a developer a compact missing-header list without manual DevTools inspection." },
    ],
    technicalNotes: [
      { ru: "Используются HTTP-статус, конечный URL и заголовки; тело страницы не скачивается.", en: "The result uses status, the final URL after redirects, and HTTP response headers; the page body is not downloaded." },
      { ru: "Защита от встраивания определяется по X-Frame-Options или директиве CSP frame-ancestors.", en: "Frame protection is considered present when X-Frame-Options or CSP frame-ancestors is available." },
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
    metaDescription: { ru: "Проверьте link rel=canonical: наличие, совпадение с конечным URL, домен, noindex и число редиректов одной страницы.", en: "Check a page link rel=canonical: presence, match with the final URL, host, noindex, and redirects." },
    h1: { ru: "Проверка canonical URL", en: "Canonical URL Checker" },
    lead: { ru: "Введите URL, чтобы посмотреть canonical, конечный адрес после редиректов, различия между ними и ограничения noindex.", en: "Enter a page URL to check canonical href, the final URL after redirects, noindex signals, and alignment with the preferred SEO URL." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "Значение canonical", en: "Canonical href" },
      { ru: "Сравнение адресов", en: "Final URL match" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес проверяемой страницы.", en: "Paste the page address you need to check for canonicalization." },
      { ru: "Запустите проверку и дождитесь отчёта.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Сравните исходный href canonical, его абсолютный адрес и конечный URL страницы.", en: "Compare canonical href, resolved canonical, and the final URL after redirects." },
    ],
    supportedFeatures: [
      { ru: "Загружает HTML с ограничением размера и защитой от обращений к частным адресам.", en: "Safe HTML page fetching through the backend with SSRF protection and response size limits." },
      { ru: "Извлекает первый link rel=canonical и разрешает относительный href относительно конечного URL.", en: "Extracts the first link rel=canonical and resolves a relative href against the final URL." },
      { ru: "Показывает несовпадения URL и домена, noindex и число редиректов.", en: "Shows final URL mismatch, host mismatch, noindex, and redirect count." },
    ],
    limitations: [
      { ru: "Не ищет конфликты canonical по всему сайту.", en: "The tool checks one page and does not search for canonical conflicts across the whole site." },
      { ru: "Canonical, добавленный JavaScript после загрузки, не анализируется.", en: "Canonical tags added by JavaScript after loading are not analyzed." },
    ],
    useCases: [
      { ru: "Сверить canonical после редиректов на HTTPS, www или адрес с завершающим слешем.", en: "Check whether canonical matches the final URL after HTTPS, www/non-www, or trailing slash redirects." },
      { ru: "Найти отсутствие canonical после миграции или смены шаблона CMS.", en: "Find pages without canonical after a migration, template change, or CMS release." },
      { ru: "Проверить случайный noindex на важной посадочной странице.", en: "Check for accidental noindex on an important landing page." },
    ],
    technicalNotes: [
      { ru: "При сравнении нормализуются регистр хоста, стандартные порты, завершающий слеш и фрагмент.", en: "URL comparison normalizes host casing, default ports, trailing slash, and fragments." },
      { ru: "Относительный canonical разрешается по конечному URL и отмечается в рекомендациях как менее надёжный вариант.", en: "A relative canonical is resolved through the final URL, but the recommendation flags it as less robust." },
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
    metaDescription: { ru: "Проверьте доступность robots.txt, разрешение обхода URL для выбранного user-agent, сработавшее правило и директивы Sitemap.", en: "Check whether robots.txt is available, whether a specific URL is allowed for a user-agent, and which Sitemap directives are declared." },
    h1: { ru: "Проверка robots.txt", en: "Robots.txt Tester" },
    lead: { ru: "Введите URL и user-agent, чтобы узнать, разрешён ли путь для выбранного робота, какое правило сработало и какие карты сайта объявлены.", en: "Enter a URL and user-agent to see whether the path is allowed for a search crawler, which rule matched, and whether Sitemap directives are declared." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "Allow / Disallow", en: "Allow/Disallow" },
      { ru: "Директивы Sitemap", en: "Sitemap directives" },
    ],
    howToSteps: [
      { ru: "Вставьте URL страницы, доступ робота к которой нужно проверить.", en: "Paste the page URL you need to test for crawling." },
      { ru: "Оставьте WebDiagBot или укажите другой user-agent, например Googlebot.", en: "Keep WebDiagBot or enter another user-agent, for example Googlebot." },
      { ru: "Проверьте статус robots.txt, сработавшее правило и директивы Sitemap.", en: "Review robots.txt status, the matching rule, and the Sitemap directives list." },
    ],
    supportedFeatures: [
      { ru: "Загружает /robots.txt с ограничением размера и защитой от частных адресов.", en: "Safe /robots.txt fetching with SSRF protection and response size limits." },
      { ru: "Сопоставляет путь URL с Allow/Disallow для выбранного user-agent.", en: "Checks a specific URL path against Allow/Disallow rules for the selected user-agent." },
      { ru: "Показывает сработавшее правило, число правил Disallow и директивы Sitemap.", en: "Shows the matched rule, Disallow rule count, and discovered Sitemap directives." },
    ],
    limitations: [
      { ru: "Проверяет один URL и не обходит весь сайт.", en: "The tool checks one URL and does not crawl the whole site." },
      { ru: "Правила robots.txt управляют обходом и сами по себе не гарантируют удаление страницы из индекса.", en: "robots.txt controls crawl access, but does not by itself guarantee that a page is removed from the index." },
    ],
    useCases: [
      { ru: "Проверить доступ робота к важной посадочной странице.", en: "Check whether an important landing page is blocked from search crawlers." },
      { ru: "Узнать, какое правило влияет на каталог, фильтр, блог или служебную страницу.", en: "Find which robots.txt rule affects a catalog, filter, blog, or service page." },
      { ru: "Проверить объявление карты сайта после релиза или миграции CMS.", en: "Verify Sitemap declarations after a release, migration, or CMS change." },
    ],
    technicalNotes: [
      { ru: "Файл /robots.txt запрашивается по протоколу, домену и порту проверяемого URL.", en: "WebDiag builds the /robots.txt URL from the tested address origin and analyzes it with the existing robots parser." },
      { ru: "Более специфичное правило имеет приоритет; при равной специфичности Allow выигрывает у Disallow.", en: "Allow wins over Disallow at equal specificity, and a more specific rule overrides a broader one." },
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
    metaDescription: { ru: "Проверьте доступность sitemap.xml, структуру XML, тип карты, число адресов и наличие выбранной страницы в файле.", en: "Check sitemap.xml availability, XML validity, sitemap type, URL count, and whether an important page is listed." },
    h1: { ru: "Проверка sitemap.xml", en: "Sitemap.xml Validator" },
    lead: { ru: "Введите адрес sitemap.xml или сайта, чтобы проверить ответ сервера, XML-структуру, число адресов и наличие выбранного URL в карте.", en: "Enter a sitemap.xml or a site address to check file status, XML structure, URL count, and whether a specific landing page is listed." },
    quickFacts: [
      { ru: "Адрес карты сайта", en: "Sitemap URL" },
      { ru: "Проверка XML", en: "XML validation" },
      { ru: "Поиск URL", en: "URL lookup" },
    ],
    howToSteps: [
      { ru: "Вставьте адрес sitemap.xml или страницы сайта. Во втором случае WebDiag проверит /sitemap.xml этого сайта.", en: "Paste a sitemap.xml address or any site page — WebDiag will try /sitemap.xml for that domain." },
      { ru: "При необходимости укажите URL, который должен быть в карте.", en: "Optionally enter the target URL that should be listed in the sitemap." },
      { ru: "Проверьте статус, тип XML, число адресов и примеры значений loc.", en: "Review status, XML type, URL count, and sample loc addresses." },
    ],
    supportedFeatures: [
      { ru: "Загружает карту с ограничением размера и защитой от обращений к частным адресам.", en: "Safe sitemap fetching through the backend with SSRF protection and response size limits." },
      { ru: "Распознаёт urlset и sitemapindex, считает URL или дочерние карты.", en: "Detects urlset and sitemapindex, showing URL count or child sitemap count." },
      { ru: "Ищет выбранный URL среди значений loc.", en: "Checks whether a selected target URL is present in the loc entries." },
    ],
    limitations: [
      { ru: "Проверяет один файл за запуск и не раскрывает все дочерние карты автоматически.", en: "The tool checks one sitemap per run and does not recursively expand every sitemap index child." },
      { ru: "Не обходит сайт и не подтверждает, что карта содержит все его страницы.", en: "This is not a crawler: it does not prove that every page on the site is included in the sitemap." },
    ],
    useCases: [
      { ru: "Проверить публикацию карты после релиза, миграции или смены CMS.", en: "Verify that a sitemap is published after a release, migration, or CMS change." },
      { ru: "Узнать, включена ли важная страница в карту сайта.", en: "Check whether an important commercial page is included for sitemap discovery." },
      { ru: "Найти ошибки XML перед отправкой карты в поисковую систему.", en: "Find obvious XML errors before submitting a sitemap to search engines." },
    ],
    technicalNotes: [
      { ru: "Если указан не XML-файл, /sitemap.xml строится по протоколу, домену и порту введённого URL.", en: "If the input is not an XML file, WebDiag builds /sitemap.xml from the input URL origin." },
      { ru: "При сравнении целевого URL нормализуются регистр хоста, стандартные порты и завершающий слеш.", en: "Target URL comparison normalizes host casing, default ports, and trailing slash." },
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
    metaDescription: { ru: "Проверьте HTTP-статусы, конечные URL, число редиректов и отдельные ошибки для списка до 50 публичных адресов.", en: "Check HTTP statuses, final URLs, and per-address errors for up to 50 URLs through the SSRF-protected WebDiag backend." },
    h1: { ru: "Массовая проверка HTTP-статусов", en: "Bulk HTTP Status Checker" },
    lead: { ru: "Вставьте до 50 HTTP(S) URL, чтобы получить результат для каждого адреса в исходном порядке. Проверяются только введённые ссылки.", en: "Paste up to 50 HTTP(S) URLs to get an ordered result for each address without a hidden site crawl." },
    quickFacts: [
      { ru: "До 50 URL", en: "Up to 50 URLs" },
      { ru: "До пяти запросов одновременно", en: "Five concurrent requests" },
      { ru: "Ошибки каждого адреса", en: "Isolated errors" },
    ],
    howToSteps: [
      { ru: "Вставьте URL по одному на строку.", en: "Paste one URL per line." },
      { ru: "Запустите проверку списка.", en: "Run the check and wait for the limited batch to finish." },
      { ru: "Изучите статусы, редиректы и ошибки отдельных адресов.", en: "Review successful statuses, redirects, and per-address errors." },
    ],
    supportedFeatures: [
      { ru: "Сохраняет исходный порядок и возвращает результат каждого введённого URL.", en: "Preserves input order and returns one result for every submitted URL." },
      { ru: "Показывает конечный URL, HTTP-статус, число редиректов и доступные заголовки ответа.", en: "Shows the final URL, HTTP status, redirect count, and available response headers." },
      { ru: "Ошибка одного недоступного или запрещённого адреса не отменяет остальные проверки.", en: "Isolates URL failures so one unavailable or rejected address does not cancel the batch." },
    ],
    limitations: [
      { ru: "Не ищет новые ссылки на сайте: проверяется только введённый список.", en: "The tool checks only submitted URLs and does not discover links across a site." },
      { ru: "Тело ответа не скачивается, HTML не анализируется.", en: "Page bodies are not downloaded and HTML content is not analyzed." },
    ],
    useCases: [
      { ru: "Проверить список посадочных страниц после миграции или релиза.", en: "Check a list of landing pages after a migration or release." },
      { ru: "Найти 404 и 5xx среди важных URL.", en: "Find 404 and 5xx responses in a prepared set of important URLs." },
      { ru: "Сверить конечные адреса после настройки массовых редиректов.", en: "Verify final destinations after configuring a redirect batch." },
    ],
    technicalNotes: [
      { ru: "Каждый URL, DNS-ответ и адрес подключённого сервера проверяются на публичную доступность.", en: "Every URL passes backend public HTTP(S), DNS/IP policy, and connected-peer verification." },
      { ru: "За запуск проверяется до 50 URL, не более пяти одновременно.", en: "The backend runs no more than five checks concurrently and caps each batch at 50 URLs." },
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
    metaDescription: { ru: "Проверьте HTTP-статус, конечный URL, Content-Type, заголовки ответа и все переходы цепочки редиректов одного адреса.", en: "Check the HTTP status, final URL, content type, and redirect chain for a single page through the safe WebDiag API." },
    h1: { ru: "Проверка HTTP-статуса и редиректов", en: "HTTP Status & Redirect Chain Checker" },
    lead: { ru: "Введите URL, чтобы увидеть статус ответа, конечный адрес и последовательность редиректов. Отчёт поможет найти ошибки и лишние переходы.", en: "Enter a URL to inspect its response status, final address after redirects, and the redirect chain that affects SEO, indexing, and user flow." },
    quickFacts: [
      { ru: "Один URL", en: "Single URL" },
      { ru: "HTTP-статус", en: "HTTP status" },
      { ru: "Цепочка редиректов", en: "Redirect chain" },
    ],
    howToSteps: [
      { ru: "Вставьте полный адрес страницы или домен.", en: "Paste a full page address or a domain." },
      { ru: "Запустите проверку и дождитесь отчёта.", en: "Run the check and wait for the WebDiag API response." },
      { ru: "Проверьте конечный URL, HTTP-статус и лишние переходы.", en: "Review the final URL, response status, and unnecessary hops in the chain." },
    ],
    supportedFeatures: [
      { ru: "Показывает конечный HTTP-статус после обработки редиректов.", en: "Final HTTP status after safe redirect handling." },
      { ru: "Для каждого перехода показывает исходный и целевой URL и код ответа.", en: "Each redirect hop: source URL, target URL, and status code." },
      { ru: "Показывает Content-Type, Content-Length, Cache-Control и Server, если они доступны.", en: "A compact summary of content-type, content-length, cache-control, and server header when present." },
    ],
    limitations: [
      { ru: "Проверяет один URL за запуск и не обходит весь сайт.", en: "The tool checks one URL per run and is not a full-site crawler." },
      { ru: "Анализирует статусы, заголовки и переходы; содержимое страницы не проверяется.", en: "Page content is not analyzed: this tool focuses on status, headers, and redirects." },
    ],
    useCases: [
      { ru: "Найти лишние переходы 301/302 у важной страницы.", en: "Check whether an important landing page goes through unnecessary 301/302 hops." },
      { ru: "Проверить 404, 500 и временные редиректы в ссылках для SEO и рекламы.", en: "Find 404, 500, or temporary redirects in URLs that affect SEO and paid traffic." },
      { ru: "Сверить конечный URL после смены домена, перехода на HTTPS или изменения правил адресов.", en: "Verify the final URL after a domain, HTTPS, trailing-slash, or canonical redirect change." },
    ],
    technicalNotes: [
      { ru: "Запросы ограничены по времени и числу редиректов; DNS и IP проверяются для защиты от обращений к частным адресам.", en: "The request runs through the WebDiag backend with SSRF protection, DNS/IP policy, and redirect limits." },
      { ru: "Тело конечного ответа не скачивается; используются статусы, заголовки и сведения о переходах.", en: "The final response body is not downloaded for the tool result; status, headers, and redirect metadata are used." },
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
    metaDescription: { ru: "Проверьте иерархию H1–H6, число H1, пропуски уровней и пустые заголовки в исходном HTML одной страницы.", en: "Check a page H1–H6 outline: H1 count, skipped levels, empty headings, and semantic structure recommendations." },
    h1: { ru: "Проверка структуры заголовков", en: "Heading Structure Checker" },
    lead: { ru: "Введите URL, чтобы увидеть последовательность заголовков H1–H6, проверить число H1 и найти пропущенные уровни и пустые заголовки.", en: "Enter a page URL to inspect headings from H1 to H6, count H1 elements, and find skipped levels and empty headings." },
    quickFacts: [
      { ru: "Иерархия H1–H6", en: "H1–H6 outline" },
      { ru: "Пропуски уровней", en: "Skipped levels" },
      { ru: "Исходный HTML", en: "Static HTML" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите извлечение заголовков H1–H6 из HTML.", en: "WebDiag loads the HTML and extracts h1–h6 headings." },
      { ru: "Проверьте H1, последовательность уровней, пустые заголовки и рекомендации.", en: "Review H1, hierarchy, empty headings, and recommendations." },
    ],
    supportedFeatures: [
      { ru: "Показывает общую структуру заголовков страницы.", en: "Shows the full page outline, not just one H1." },
      { ru: "Отмечает пропуски уровней, например переход от H1 к H3.", en: "Flags skipped levels such as H1 → H3." },
      { ru: "Загружает HTML с ограничением размера и защитой от частных адресов.", en: "Uses safe backend fetching with SSRF protection." },
    ],
    limitations: [
      { ru: "Не видит заголовки, добавленные JavaScript после загрузки.", en: "Static HTML scan does not see headings inserted by JavaScript after load." },
      { ru: "Не оценивает смысл текста и соответствие поисковому запросу.", en: "The tool does not judge text meaning as a search algorithm." },
    ],
    useCases: [
      { ru: "Проверить структуру посадочной страницы перед релизом.", en: "Check landing-page SEO structure before release." },
      { ru: "Найти пустые заголовки и пропуски уровней в шаблоне CMS.", en: "Find empty or skipped headings in a CMS template." },
      { ru: "Подготовить правки структуры текста для удобства чтения и доступности.", en: "Prepare content fixes for UX, SEO, and accessibility." },
    ],
    technicalNotes: [
      { ru: "Число H1 оценивается вместе с остальной иерархией заголовков.", en: "The H1 count is reviewed alongside the rest of the heading hierarchy." },
      { ru: "Результат относится к исходному HTML одной страницы.", en: "The result is limited to one page and static HTML." },
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
    metaDescription: { ru: "Посчитайте частые слова, пары и тройки слов в тексте страницы, их долю и возможные избыточные повторы.", en: "Analyze visible page text: frequent words, bigrams, trigrams, term density, and possible overuse." },
    h1: { ru: "Анализ частоты слов и фраз", en: "Keyword and Phrase Frequency Analyzer" },
    lead: { ru: "Введите URL, чтобы увидеть частоту слов и фраз в тексте страницы. Отчёт поможет выбрать повторы для редакционной проверки.", en: "Enter a page URL to see term distribution. The tool does not promise magic SEO ranking; it provides evidence for editorial review." },
    quickFacts: [
      { ru: "Частые слова", en: "Words" },
      { ru: "Пары и тройки слов", en: "Bigrams/trigrams" },
      { ru: "Возможные избыточные повторы", en: "Overuse signals" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите извлечение текста без блоков script и style.", en: "WebDiag extracts visible text without script/style blocks." },
      { ru: "Изучите частые слова, фразы и возможные избыточные повторы.", en: "Review frequent words, phrases, and possible overuse." },
    ],
    supportedFeatures: [
      { ru: "Считает частоту отдельных слов, пар и троек слов.", en: "Counts words, bigrams, and trigrams." },
      { ru: "Использует базовые фильтры служебных слов для русского и английского.", en: "Uses basic RU/EN stopword filters." },
      { ru: "Показывает долю терминов в тексте.", en: "Shows term density without ranking promises." },
    ],
    limitations: [
      { ru: "Не заменяет смысловой анализ и не определяет поисковую задачу страницы.", en: "Does not replace semantic analysis and does not know SERP intent." },
      { ru: "Текст, добавленный JavaScript, не анализируется.", en: "JS-injected content is not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Найти избыточные повторы после SEO-правок.", en: "Find overuse after SEO copy edits." },
      { ru: "Сверить наиболее частые слова с темой страницы.", en: "Check whether visible text matches the page topic." },
      { ru: "Подготовить редакционные замечания к посадочной странице.", en: "Prepare editorial recommendations for a landing page." },
    ],
    technicalNotes: [
      { ru: "Доля термина считается от общего числа слов извлечённого текста.", en: "Density is calculated against total visible-text word count." },
      { ru: "Частота слов служит ориентиром для редактора и не предсказывает позиции в поиске.", en: "This is a content audit signal, not a ranking-factor simulator." },
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
    metaDescription: { ru: "Проверьте объём текста, предложения, абзацы, длинные фразы, примерное время чтения и ориентировочную оценку читабельности.", en: "Check text volume, sentences, paragraphs, long phrases, reading time, and a multilingual heuristic readability score." },
    h1: { ru: "Анализ читабельности", en: "Readability Analyzer" },
    lead: { ru: "Введите URL, чтобы оценить длину предложений и слов, найти длинные фразы и узнать примерное время чтения. Общая оценка помогает выбрать места для редакторской проверки.", en: "Enter a page URL to find long sentences, inspect word and sentence lengths, and estimate reading time. The overall score helps identify passages for editorial review." },
    quickFacts: [
      { ru: "Время чтения", en: "Reading time" },
      { ru: "Длинные предложения", en: "Long sentences" },
      { ru: "Ориентировочная оценка", en: "Multilingual heuristic" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите извлечение текста и подсчёт слов и предложений.", en: "WebDiag extracts visible text and splits it into words and sentences." },
      { ru: "Проверьте оценку, длинные предложения, объём и рекомендации.", en: "Review score, long sentences, volume, and recommendations." },
    ],
    supportedFeatures: [
      { ru: "Считает слова, предложения, абзацы и примерное время чтения.", en: "Counts words, sentences, paragraphs, and estimated reading time." },
      { ru: "Отмечает длинные предложения.", en: "Flags long sentences that hurt scanning." },
      { ru: "Показывает ориентировочную оценку от 0 до 100.", en: "Shows an approximate readability score from 0 to 100." },
    ],
    limitations: [
      { ru: "Формула не адаптирована к правилам конкретного языка и не оценивает смысл текста.", en: "This is not an academic formula for a specific language and not a meaning assessment." },
      { ru: "Текст, добавленный JavaScript, не анализируется.", en: "Text inserted by JavaScript is not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Проверить коммерческий текст перед публикацией.", en: "Check commercial copy before publishing." },
      { ru: "Найти длинные фразы и плотные абзацы.", en: "Find overly long sentences and dense paragraphs." },
      { ru: "Подготовить редакционные правки для удобства чтения.", en: "Prepare UX/copy recommendations for an SEO audit." },
    ],
    technicalNotes: [
      { ru: "Оценка учитывает длину слов, длину предложений и долю длинных предложений.", en: "The score is based on sentence length, word length, and long-sentence count." },
      { ru: "Используется общая эвристика для разных языков; результат не является точной оценкой по формуле Флеша.", en: "The formula is labeled as multilingual heuristic rather than a precise Flesch score." },
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
    metaDescription: { ru: "Проверьте HTTP-статус, robots.txt, meta robots, X-Robots-Tag, canonical и редиректы на возможные ограничения индексации.", en: "Check HTTP status, robots.txt, meta robots, X-Robots-Tag, canonical, and redirects as one indexability audit." },
    h1: { ru: "Проверка индексируемости страницы", en: "Page Indexability Checker" },
    lead: { ru: "Введите URL, чтобы найти технические ограничения: noindex, запрет обхода в robots.txt, X-Robots-Tag, отличающийся canonical и ошибочный HTTP-статус.", en: "Enter a URL to see whether hard indexability blockers exist: noindex, robots.txt disallow, X-Robots-Tag, problematic canonical, or unsuccessful HTTP status." },
    quickFacts: [
      { ru: "robots.txt", en: "robots.txt" },
      { ru: "Meta / X-Robots", en: "Meta/X-Robots" },
      { ru: "Canonical", en: "Canonical" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите загрузку HTML и robots.txt.", en: "WebDiag fetches HTML and robots.txt through safe fetch." },
      { ru: "Проверьте ограничения, предупреждения и итоговый вывод о технической готовности к индексации.", en: "Review hard blockers, warnings, and the final indexable candidate signal." },
    ],
    supportedFeatures: [
      { ru: "Проверяет HTTP-статус, число редиректов, Allow/Disallow в robots.txt и noindex.", en: "Checks HTTP status, redirect count, robots.txt allow/disallow, and noindex signals." },
      { ru: "Сравнивает canonical с конечным URL после редиректов.", en: "Compares canonical with the final URL after redirects." },
      { ru: "Объединяет технические признаки, влияющие на возможность индексации.", en: "Combines technical signals that affect eligibility for indexing." },
    ],
    limitations: [
      { ru: "Наличие страницы в индексе Google или Яндекса не проверяется.", en: "Actual Google/Yandex index presence is not checked." },
      { ru: "Изменения robots и canonical, внесённые JavaScript, не анализируются.", en: "JS-runtime robots/canonical changes are not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Проверить посадочную страницу перед публикацией.", en: "Check a landing page before publishing." },
      { ru: "Найти случайный noindex после релиза.", en: "Find accidental noindex after a release." },
      { ru: "Узнать, указывает ли canonical на другой адрес.", en: "Check whether the page canonicalizes to another URL." },
    ],
    technicalNotes: [
      { ru: "При разборе robots.txt учитывается приоритет правил Allow и Disallow.", en: "Robots.txt analysis uses the same allow/disallow precedence parser as the audit engine." },
      { ru: "Положительный вывод означает отсутствие найденных технических препятствий и не подтверждает включение страницы в индекс.", en: "The tool returns indexable_candidate, not guaranteed search index state." },
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
    metaDescription: { ru: "Проверьте ссылки alternate hreflang, x-default, ссылку на текущую версию, повторы кодов и структуру языковых обозначений.", en: "Check alternate hreflang, x-default, self-reference, duplicate language codes, and structural international SEO issues." },
    h1: { ru: "Проверка hreflang", en: "Hreflang Checker" },
    lead: { ru: "Введите URL языковой версии, чтобы проверить ссылки hreflang в HTML: коды, x-default, повторы и ссылку на текущую страницу.", en: "Enter a multilingual page URL to inspect HTML hreflang links: language codes, x-default, self-reference, and duplicates." },
    quickFacts: [
      { ru: "Ссылки alternate", en: "alternate links" },
      { ru: "x-default", en: "x-default" },
      { ru: "Ссылка на текущую версию", en: "self-reference" },
    ],
    howToSteps: [
      { ru: "Вставьте URL одной языковой версии.", en: "Paste the URL of one language version." },
      { ru: "Запустите сбор link rel=alternate hreflang из исходного HTML.", en: "WebDiag collects link rel=alternate hreflang from static HTML." },
      { ru: "Проверьте структуру кодов, x-default, повторы и ссылку на текущую версию.", en: "Review language-code validity, x-default, duplicates, and self-reference." },
    ],
    supportedFeatures: [
      { ru: "Проверяет x-default, ссылку на текущую версию и повторяющиеся значения hreflang.", en: "Checks x-default, self-reference, and duplicate hreflang values." },
      { ru: "Разрешает относительные href относительно конечного URL страницы.", en: "Normalizes relative href values against the final URL." },
      { ru: "Показывает html lang как дополнительную информацию.", en: "Shows html lang as an additional contextual signal." },
    ],
    limitations: [
      { ru: "Не проверяет обратные hreflang-ссылки на всех альтернативных страницах.", en: "Does not verify reciprocal hreflang links on every alternate page." },
      { ru: "Разметка, добавленная JavaScript, не анализируется.", en: "JS-injected hreflang is not included in the static HTML scan." },
    ],
    useCases: [
      { ru: "Сверить языковые версии посадочной страницы перед релизом.", en: "Check international landing pages before release." },
      { ru: "Найти повторяющиеся обозначения и ошибки формата язык-регион.", en: "Find duplicated en/en-US or invalid language-region codes." },
      { ru: "Проверить x-default для страницы выбора языка.", en: "Check x-default for a global language selector." },
    ],
    technicalNotes: [
      { ru: "Проверяется структура языковых кодов; взаимные ссылки между версиями нужно проверять отдельно.", en: "Checks language-code structure; reciprocal links between versions need a separate check." },
      { ru: "Инструмент не загружает все адреса alternate href.", en: "The tool does not request every alternate href to avoid becoming a crawler." },
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
    metaDescription: { ru: "Определите CMS, веб-фреймворки, CDN, хостинг и аналитику по исходному HTML, путям ресурсов и HTTP-заголовкам.", en: "Detect CMS, frontend frameworks, CDN, hosting, analytics, and server headers through safe static HTML scan and HTTP headers." },
    h1: { ru: "Определение технологий сайта", en: "Website Technology Detector" },
    lead: { ru: "Введите URL, чтобы получить список вероятных технологий сайта по заголовкам ответа, метатегу generator и характерным путям ресурсов.", en: "Enter a URL to get a technology profile from HTTP headers, generator meta, asset paths, and safe static HTML fingerprints." },
    quickFacts: [
      { ru: "CMS и фреймворки", en: "CMS/framework" },
      { ru: "CDN и хостинг", en: "CDN/hosting" },
      { ru: "HTML и заголовки", en: "Headers/assets" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Запустите проверку HTML и HTTP-заголовков без выполнения JavaScript.", en: "WebDiag inspects HTML and HTTP headers without executing JavaScript." },
      { ru: "Изучите найденные технологии, степень уверенности и признаки обнаружения.", en: "Review detected technologies, confidence, and evidence." },
    ],
    supportedFeatures: [
      { ru: "Ищет признаки WordPress, Drupal, Joomla, Shopify, Wix, Tilda, Webflow и распространённых фреймворков.", en: "Detects WordPress, Drupal, Joomla, Shopify, Wix, Tilda, Webflow, and common frameworks by fingerprints." },
      { ru: "Показывает признаки CDN, хостинга и сервера из заголовков ответа.", en: "Shows CDN/hosting/server signals from response headers." },
      { ru: "Для каждого результата показывает признаки и степень уверенности.", en: "Every signal includes confidence and evidence." },
    ],
    limitations: [
      { ru: "Анализируется исходный HTML; поведение страницы в браузере не проверяется.", en: "Analyzes source HTML without checking page behavior in a browser." },
      { ru: "Сборка сайта может скрывать или менять признаки технологий.", en: "Modern build pipelines may hide or rename fingerprints." },
    ],
    useCases: [
      { ru: "Узнать вероятный стек сайта перед аудитом.", en: "Quickly understand a site stack before an audit." },
      { ru: "Найти сведения о CDN и хостинге для проверки производительности или безопасности.", en: "Find CDN/hosting headers for performance/security review." },
      { ru: "Собрать контекст для рекомендаций по CMS и веб-приложению.", en: "Collect context for later CMS and frontend recommendations." },
    ],
    technicalNotes: [
      { ru: "HTML не отправляется сторонним сервисам определения технологий.", en: "The tool does not send HTML to third-party fingerprint providers." },
      { ru: "Результаты с низкой уверенностью требуют ручной проверки.", en: "Low-confidence detections require manual review." },
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
    metaDescription: { ru: "Соберите robots.txt из правил User-agent, Allow, Disallow, Sitemap и Crawl-delay локально в браузере без запросов к сайту.", en: "Build robots.txt from explicit rules: User-agent, Allow, Disallow, Sitemap, and Crawl-delay without fetching the site." },
    h1: { ru: "Генератор robots.txt", en: "Robots.txt Generator" },
    lead: { ru: "Укажите правила доступа роботов, чтобы собрать файл robots.txt. Генератор использует только введённые настройки и не определяет структуру сайта.", en: "Create robots.txt manually from confirmed rules. The tool does not crawl the site or invent private sections." },
    quickFacts: [
      { ru: "Локально в браузере", en: "In your browser" },
      { ru: "Allow / Disallow", en: "Allow/Disallow" },
      { ru: "Директива Sitemap", en: "Sitemap directive" },
    ],
    howToSteps: [
      { ru: "Укажите user-agent и правила Allow/Disallow.", en: "Enter the user-agent and Allow/Disallow rules." },
      { ru: "При необходимости добавьте адрес карты сайта и Crawl-delay.", en: "Add Sitemap URL and Crawl-delay only when actually needed." },
      { ru: "Скопируйте файл и проверьте его тестером robots.txt после публикации.", en: "Copy the file and verify it with Robots.txt Tester after publishing." },
    ],
    supportedFeatures: [
      { ru: "Приводит относительные пути к виду /path.", en: "Normalizes relative paths to /path." },
      { ru: "Проверяет HTTP(S) URL для директивы Sitemap.", en: "Checks that Sitemap is an HTTP(S) URL." },
      { ru: "Обрабатывает правила в браузере без отправки на сервер.", en: "Runs fully in the browser without sending rules to the backend." },
    ],
    limitations: [
      { ru: "Не определяет, какие разделы сайта нужно закрыть от роботов.", en: "The tool does not know your site structure and does not replace indexing strategy." },
      { ru: "После публикации проверьте действие правил на нужных адресах сайта.", en: "After publishing, verify the file with the robots.txt tester on the real domain." },
    ],
    useCases: [
      { ru: "Подготовить robots.txt для нового сайта.", en: "Prepare a basic robots.txt for a new site." },
      { ru: "Собрать правила обхода служебных разделов.", en: "Quickly build a safe template for staging or utility sections." },
      { ru: "Добавить директиву Sitemap без ручного форматирования.", en: "Add a Sitemap directive without syntax mistakes." },
    ],
    technicalNotes: [
      { ru: "Результат зависит только от введённых полей.", en: "The result depends only on your input." },
      { ru: "Правила robots.txt ограничивают обход и не заменяют защиту закрытых разделов паролем.", en: "robots.txt rules control crawling and do not replace password protection for private sections." },
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
    metaDescription: { ru: "Создайте sitemap.xml из списка HTTP(S) URL. При необходимости добавьте lastmod, changefreq и priority без отправки адресов на сервер.", en: "Create sitemap.xml from an HTTP(S) URL list with optional lastmod, changefreq, and priority." },
    h1: { ru: "Генератор sitemap.xml", en: "Sitemap.xml Generator" },
    lead: { ru: "Вставьте список адресов, чтобы собрать XML-карту сайта. Генератор проверяет HTTP(S) URL и экранирует специальные символы; страницы для списка нужно подготовить самостоятельно.", en: "Paste a list of addresses to build an XML sitemap. The generator validates HTTP(S) URLs and escapes special characters; prepare the page list yourself." },
    quickFacts: [
      { ru: "Локально в браузере", en: "In your browser" },
      { ru: "Корректный XML", en: "XML escaping" },
      { ru: "Адреса HTTP(S)", en: "HTTP(S) URLs" },
    ],
    howToSteps: [
      { ru: "Вставьте URL по одному на строку.", en: "Paste URLs, one per line." },
      { ru: "При необходимости задайте lastmod, changefreq и priority.", en: "Optionally set lastmod, changefreq, and priority." },
      { ru: "Скопируйте XML и проверьте файл после публикации.", en: "Copy the XML and check the published file through Sitemap Validator." },
    ],
    supportedFeatures: [
      { ru: "Создаёт карту сайта в формате urlset.", en: "Generates a standard urlset sitemap.xml." },
      { ru: "Экранирует амперсанд, угловые скобки, кавычки и апострофы в адресах.", en: "Escapes &, <, >, quotes, and apostrophes inside URLs." },
      { ru: "Проверяет диапазон priority от 0,0 до 1,0.", en: "Validates priority as a number from 0.0 to 1.0." },
    ],
    limitations: [
      { ru: "Не обходит сайт и не находит страницы автоматически.", en: "Does not crawl the site or discover pages automatically." },
      { ru: "Для большого сайта может потребоваться автоматическое обновление и разделение карты на несколько файлов с индексом.", en: "Large sites require crawler/job infrastructure and incremental sitemap index files." },
    ],
    useCases: [
      { ru: "Подготовить карту небольшого сайта или набора посадочных страниц.", en: "Prepare a sitemap for a small site or a set of landing pages." },
      { ru: "Собрать карту по готовому списку перед настройкой автоматического обновления.", en: "Build a sitemap from a prepared list before setting up automated updates." },
      { ru: "Правильно включить в XML адреса с параметрами запроса.", en: "Check XML escaping for URLs with query parameters." },
    ],
    technicalNotes: [
      { ru: "Файл создаётся в браузере без отправки списка адресов на сервер.", en: "The file is created in the browser without sending your URL list to the server." },
      { ru: "После публикации проверьте доступность и содержимое карты инструментом проверки sitemap.xml.", en: "This is a generator, not a validator: verify the published file with Sitemap Validator." },
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
    metaDescription: { ru: "Создайте FAQPage JSON-LD по введённым вопросам и ответам страницы локально в браузере без отправки текста на сервер.", en: "Create FAQPage JSON-LD from your page’s questions and answers locally in the browser without uploading the text." },
    h1: { ru: "Генератор FAQ Schema", en: "FAQ Schema Generator" },
    lead: { ru: "Добавьте вопросы и ответы, опубликованные на странице или подготовленные к публикации, чтобы собрать разметку FAQPage JSON-LD.", en: "Build FAQPage JSON-LD only from factual questions and answers that already exist or will be published on the page." },
    quickFacts: [
      { ru: "FAQPage", en: "FAQPage" },
      { ru: "JSON-LD", en: "JSON-LD" },
      { ru: "Из введённых вопросов и ответов", en: "Uses your questions and answers" },
    ],
    howToSteps: [
      { ru: "Укажите URL страницы с вопросами и ответами.", en: "Paste the URL of the FAQ page or page with a FAQ block." },
      { ru: "Вставьте пары вопрос–ответ, разделяя блоки пустой строкой.", en: "Add question/answer pairs separated by a blank line." },
      { ru: "Скопируйте JSON-LD и проверьте разметку после публикации.", en: "Copy the JSON-LD and validate the published page with Structured Data Validator." },
    ],
    supportedFeatures: [
      { ru: "Создаёт блок script type=application/ld+json с типом FAQPage.", en: "Generates script type=application/ld+json with @type FAQPage." },
      { ru: "Использует только введённые вопросы и ответы.", en: "Uses only the questions and answers you enter." },
      { ru: "Обрабатывает текст в браузере без отправки на сервер.", en: "Runs in the browser without sending content to the backend." },
    ],
    limitations: [
      { ru: "Разметка не гарантирует расширенный сниппет: решение зависит от поисковой системы и страницы.", en: "Does not promise rich snippets: eligibility depends on the search engine and page quality." },
      { ru: "Вопросы и ответы в разметке должны совпадать с видимым содержимым страницы.", en: "FAQ markup must match visible page content." },
    ],
    useCases: [
      { ru: "Подготовить FAQPage для страницы услуги или справочного материала.", en: "Prepare FAQPage JSON-LD for a service page or knowledge page." },
      { ru: "Собрать структуру Question/Answer без ручного написания JSON.", en: "Avoid manual mistakes in the Question/Answer structure." },
      { ru: "Проверить формат разметки перед публикацией.", en: "Quickly check the format before publishing." },
    ],
    technicalNotes: [
      { ru: "Генератор создаёт JSON-LD и не проверяет опубликованный HTML.", en: "The generator creates syntactically valid JSON-LD but does not verify the published DOM." },
      { ru: "После внедрения проверьте конечный URL инструментом проверки структурированных данных.", en: "After implementation, use Structured Data Validator on the final URL." },
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
    metaDescription: { ru: "Проверьте скрипты исходного HTML: хосты, async, defer, module, повторы, integrity и возможные задержки разбора страницы.", en: "Check a static HTML script inventory: same-host and cross-host candidates, async, defer, module, parser-blocking signals, duplicates, and SRI." },
    h1: { ru: "Анализ сторонних скриптов", en: "Third-party Script Analyzer" },
    lead: { ru: "Введите URL, чтобы собрать скрипты из исходного HTML, увидеть внешние хосты, параметры загрузки и повторные подключения.", en: "Enter a URL to list scripts in source HTML, inspect external hosts and loading attributes, and find repeated references." },
    quickFacts: [
      { ru: "Исходный HTML", en: "static HTML" },
      { ru: "async / defer / module", en: "async / defer / module" },
      { ru: "Группировка по хостам", en: "hostname classification" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL страницы.", en: "Enter a public page URL." },
      { ru: "Запустите анализ подключённых скриптов.", en: "Run the limited script inventory." },
      { ru: "Проверьте внешние хосты, повторы и скрипты, способные задерживать разбор HTML.", en: "Review cross-host scripts, blocking candidates, duplicates, and host groups." },
    ],
    supportedFeatures: [
      { ru: "Различает встроенные и внешние скрипты, тот же хост и другие хосты.", en: "Separates inline, external, same-host, and cross-host candidates." },
      { ru: "Показывает async, defer, module, nomodule, integrity и crossorigin.", en: "Shows async, defer, module, nomodule, integrity, and crossorigin." },
      { ru: "Группирует известные хосты аналитики, менеджеров тегов, рекламы, соцсетей и CDN.", en: "Groups known hostname patterns for analytics, tag managers, ads, social platforms, and CDNs." },
    ],
    limitations: [
      { ru: "Другой хост не подтверждает принадлежность сторонней организации или отслеживание пользователя.", en: "Third-party means a different hostname, not proven ownership or tracking." },
      { ru: "Не видит скрипты, добавленные JavaScript, после согласия пользователя или расширением браузера.", en: "Does not see scripts added by runtime JavaScript, consent flows, or browser extensions." },
    ],
    useCases: [
      { ru: "Сверить подключения после добавления аналитики или менеджера тегов.", en: "Review script references after adding analytics or a tag manager." },
      { ru: "Найти повторные src и скрипты, способные задерживать разбор HTML.", en: "Find parser-blocking candidates and duplicate src values." },
      { ru: "Подготовить список скриптов для проверки производительности и приватности.", en: "Prepare an inventory for performance and privacy review." },
    ],
    technicalNotes: [
      { ru: "Выполняется один запрос HTML; содержимое JS-файлов не скачивается.", en: "Makes one HTML request without downloading JavaScript files." },
      { ru: "Категория определяется по имени хоста и требует проверки перед выводом о назначении скрипта.", en: "Hostname groups are a transparent heuristic, not a verdict about script purpose." },
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
    seoTitle: { ru: "Анализ подсказок загрузки ресурсов", en: "Resource Hints Analyzer" },
    metaDescription: { ru: "Проверьте preconnect, dns-prefetch, preload, prefetch, modulepreload и preinit: повторы, as, crossorigin и число соединений.", en: "Check preconnect, dns-prefetch, preload, prefetch, modulepreload, and preinit: duplicates, as, crossorigin, and excessive-preconnect signals." },
    h1: { ru: "Подсказки загрузки ресурсов", en: "Resource Hints Analyzer" },
    lead: { ru: "Введите URL, чтобы проверить объявления предварительных соединений и загрузок в HTML: найти повторы, недостающие атрибуты и большое число preconnect.", en: "Enter a URL to check resource hints in source HTML for duplicates, missing attributes, and a high preconnect count." },
    quickFacts: [
      { ru: "preconnect / dns-prefetch", en: "preconnect / dns-prefetch" },
      { ru: "preload / modulepreload", en: "preload / modulepreload" },
      { ru: "Повторы и атрибуты", en: "duplicates and attributes" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL страницы.", en: "Enter a public page URL." },
      { ru: "Запустите анализ исходного HTML.", en: "Run limited static HTML analysis." },
      { ru: "Проверьте число подсказок, повторы и атрибуты as и crossorigin.", en: "Review hint counts, duplicates, as values, and crossorigin signals." },
    ],
    supportedFeatures: [
      { ru: "Распознаёт preconnect, dns-prefetch, preload, prefetch, modulepreload и явно объявленный preinit.", en: "Supports preconnect, dns-prefetch, preload, prefetch, modulepreload, and literal preinit." },
      { ru: "Разрешает относительные адреса и различает тот же и другие хосты.", en: "Normalizes relative URLs and shows same-host/cross-host signals." },
      { ru: "Отмечает повторы, preload без as и большое число preconnect.", en: "Flags duplicate hints, preload without as, and excessive preconnect counts." },
    ],
    limitations: [
      { ru: "Не измеряет порядок и приоритет фактических загрузок и повторное использование соединений.", en: "Does not measure the real waterfall, priority, or connection reuse." },
      { ru: "Объявление подсказки не подтверждает, что браузер её использовал или страница ускорилась.", en: "The presence or absence of a hint is not a performance verdict by itself." },
    ],
    useCases: [
      { ru: "Проверить head после изменения настроек загрузки.", en: "Review the head after frontend performance setup changes." },
      { ru: "Найти повторные preload и preconnect, требующие пересмотра.", en: "Find excessive preconnects and duplicate preloads." },
      { ru: "Сверить crossorigin для ресурсов с другого источника.", en: "Review crossorigin signals for cross-origin resources." },
    ],
    technicalNotes: [
      { ru: "Порог числа preconnect служит поводом для проверки и не является общим лимитом браузера.", en: "The many-preconnect threshold is a review signal, not a universal browser limit." },
      { ru: "Эффект изменений нужно измерять в браузере или по данным реальных пользователей.", en: "Hint effectiveness should be verified with browser profiling and real-user data." },
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
    metaDescription: { ru: "Разберите HTTP(S) URL локально: регистр протокола и хоста, порт, IDNA, сегменты пути, кодирование символов, фрагмент и слеши.", en: "Inspect HTTP/HTTPS URL syntax normalization: scheme and host casing, default ports, IDNA, dot segments, percent encoding, fragments, and routing-sensitive slash signals." },
    h1: { ru: "Анализ нормализации URL", en: "URL Normalization Analyzer" },
    lead: { ru: "Вставьте URL, чтобы получить его нормализованную запись и увидеть изменения, которые требуют проверки маршрутизации сайта перед применением.", en: "The tool locally builds a deterministic URL syntax form and separates changes that cannot be applied safely without checking routing behavior." },
    quickFacts: [
      { ru: "Локально в браузере", en: "runs locally" },
      { ru: "IDNA и кодирование символов", en: "IDNA and percent encoding" },
      { ru: "Без выбора canonical", en: "no canonical guesswork" },
    ],
    howToSteps: [
      { ru: "Вставьте полный HTTP(S) URL.", en: "Paste a full HTTP/HTTPS URL." },
      { ru: "Сравните нормализованный адрес и адрес запроса без фрагмента.", en: "Compare the normalized and request URLs." },
      { ru: "Проверьте на сервере значение слешей и параметров запроса.", en: "Verify slash and query semantics separately against the server." },
    ],
    supportedFeatures: [
      { ru: "Нормализует регистр протокола и хоста, стандартный порт и запись международного домена через IDNA.", en: "Normalizes scheme and hostname casing, default ports, and IDNA serialization." },
      { ru: "Разрешает сегменты пути с точками и нормализует процентное кодирование, сохраняя закодированные зарезервированные символы.", en: "Resolves dot segments and normalizes percent encoding without decoding reserved characters." },
      { ru: "Показывает адрес запроса без фрагмента и сохраняет порядок параметров.", en: "Shows the fragment-free request URL and preserves query order." },
    ],
    limitations: [
      { ru: "Не определяет предпочтительный адрес для rel=canonical.", en: "Does not claim which URL should be rel=canonical." },
      { ru: "Не объединяет повторные слеши и не удаляет завершающий слеш без проверки приложения.", en: "Does not collapse duplicate slashes or remove a trailing slash without application verification." },
    ],
    useCases: [
      { ru: "Сравнить адреса перед настройкой редиректа или canonical.", en: "Compare URLs before configuring a redirect or canonical." },
      { ru: "Проверить международный домен, стандартный порт и кодирование символов.", en: "Review IDNs, default ports, and ambiguous percent encoding." },
      { ru: "Привести записи адресов к единому виду в таблице миграции.", en: "Prepare consistent URLs for a migration spreadsheet." },
    ],
    technicalNotes: [
      { ru: "Результат создаётся стандартным парсером URL в браузере без сетевого запроса.", en: "The result uses the browser URL parser and makes no network request." },
      { ru: "Порядок и повторы параметров сохраняются, поскольку они могут влиять на обработку запроса сервером.", en: "Query order is preserved because backend semantics can depend on order and repeated keys." },
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
    metaDescription: { ru: "Разберите до 200 пар параметров URL локально: повторы, пустые значения и вероятные параметры аналитики, поиска, фильтров и сессии.", en: "Locally inspect query pairs, repeats, empty values, and tracking, pagination, sort, filter, search, and session name patterns without changing the source URL." },
    h1: { ru: "Анализ URL-параметров", en: "Query Parameter Analyzer" },
    lead: { ru: "Вставьте URL, чтобы разобрать параметры и сгруппировать их по характерным именам. Инструмент сохраняет исходный адрес и не удаляет параметры автоматически.", en: "Paste a URL to inspect its parameters and group them by naming patterns. The original URL is preserved, and parameters are not removed automatically." },
    quickFacts: [
      { ru: "До 200 пар параметров", en: "up to 200 query pairs" },
      { ru: "Локально в браузере", en: "runs locally" },
      { ru: "Вариант без меток аналитики", en: "tracking-removal candidate" },
    ],
    howToSteps: [
      { ru: "Вставьте URL с параметрами запроса.", en: "Paste a URL with a query string." },
      { ru: "Проверьте повторы, пустые значения и категории имён.", en: "Review repeats, empty values, and name categories." },
      { ru: "Перед изменением адреса проверьте влияние параметров на сервер, кэш и обход сайта.", en: "Confirm server, cache, and crawl semantics before making changes." },
    ],
    supportedFeatures: [
      { ru: "Сохраняет порядок пар и показывает повторяющиеся имена параметров.", en: "Preserves pair order and shows repeated parameter names." },
      { ru: "Выделяет характерные имена параметров аналитики, пагинации, сортировки, фильтров, поиска и сессии.", en: "Highlights tracking, pagination, sorting, filtering, search, and session name patterns." },
      { ru: "Показывает пустые имена и значения, различия регистра и имена, похожие на чувствительные данные.", en: "Shows blank names and values, case variants, and sensitive-looking names." },
    ],
    limitations: [
      { ru: "Категория определяется по имени и не подтверждает фактическое назначение параметра.", en: "Categories are based on parameter names, not proven backend behavior." },
      { ru: "Вариант без меток аналитики требует проверки и не является автоматической рекомендацией canonical.", en: "The tracking-free candidate is not an automatic canonical recommendation." },
    ],
    useCases: [
      { ru: "Проверить параметры фильтров и объём возможных адресов перед SEO-аудитом.", en: "Review faceted navigation and crawl-space risks before an SEO audit." },
      { ru: "Найти повторные имена и различия регистра при отладке API или кэша.", en: "Find repeated keys and case variants before API or cache debugging." },
      { ru: "Проверить метки аналитики перед подготовкой ссылки для публикации.", en: "Review tracking parameters before preparing a clean share link." },
    ],
    technicalNotes: [
      { ru: "URL обрабатывается в браузере без отправки на сервер и обращения к сайту.", en: "The tool does not send the URL to the backend or contact the site." },
      { ru: "Сервер может воспринимать повторный параметр как список, первое или последнее значение — это зависит от приложения.", en: "Repeated parameters may be interpreted as a list, first value, or last value depending on the framework." },
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
    metaDescription: { ru: "Проверьте до 25 правил редиректов из CSV или TSV: первый переход, ожидаемый статус, повторы, конфликты, цепочки и циклы.", en: "Validate up to 25 explicit source-to-target rules: first redirect hop, optional status, duplicates, conflicts, self redirects, chains, and cycles through a safe fetcher." },
    h1: { ru: "Проверка карты редиректов", en: "Redirect Map Validator" },
    lead: { ru: "Вставьте карту миграции в CSV или TSV. WebDiag проверит указанные исходные URL и сравнит первый редирект с ожидаемым адресом назначения.", en: "Paste a CSV or TSV migration map. WebDiag checks only explicit source URLs and compares the first redirect hop with the expected target." },
    quickFacts: [
      { ru: "До 25 правил", en: "up to 25 rules" },
      { ru: "Первый переход", en: "first-hop validation" },
      { ru: "Повторы, цепочки и циклы", en: "duplicates / chains / cycles" },
    ],
    howToSteps: [
      { ru: "Подготовьте CSV или TSV с колонками source, target, status.", en: "Prepare source,target,status CSV or TSV." },
      { ru: "Запустите проверку публичных исходных HTTP(S) URL.", en: "Run the limited check against public HTTP/HTTPS sources." },
      { ru: "Исправьте несовпадения, конфликты, цепочки и циклы перед применением правил.", en: "Fix mismatches, conflicts, chains, and cycles before deployment." },
    ],
    supportedFeatures: [
      { ru: "Сравнивает фактическую цель первого перехода с ожидаемой и проверяет статус 301, 302, 303, 307 или 308, если он указан.", en: "Compares the observed first redirect target and optional 301/302/303/307/308 status." },
      { ru: "Находит повторные и конфликтующие исходные адреса, редиректы на себя, цепочки и циклы в карте.", en: "Finds duplicate or conflicting sources, self redirects, map chains, and cycles." },
      { ru: "Проверяет DNS и адреса назначения при обработке редиректов.", en: "Checks DNS and destination addresses when handling redirects." },
    ],
    limitations: [
      { ru: "Не обходит сайт и не ищет отсутствующие правила редиректов.", en: "Does not crawl the site or discover missing redirect rules." },
      { ru: "Проверяет текущие ответы; будущую настройку CDN или веб-сервера после публикации нужно проверять повторно.", en: "Checks the current network response but cannot prove a future CDN or web-server configuration after deployment." },
    ],
    useCases: [
      { ru: "Сверить карту миграции с ответами сайта после релиза.", en: "Validate a migration redirect spreadsheet after release." },
      { ru: "Найти цепочки и конфликтующие правила до импорта в nginx, CDN или CMS.", en: "Find chains and conflicting rules before importing into nginx, a CDN, or a CMS." },
      { ru: "Повторно проверить важные URL после изменения маршрутизации.", en: "Recheck critical URLs after routing changes." },
    ],
    technicalNotes: [
      { ru: "Каждый исходный URL проверяется отдельным запросом с ограничениями и без чтения тела ответа.", en: "Each source is checked with a separate limited safe fetch without reading the body." },
      { ru: "С ожидаемой целью сравнивается первый переход; дополнительные переходы отмечаются для проверки цепочки.", en: "The first hop is compared; additional hops are reported as a chain review signal." },
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
    metaDescription: { ru: "Создайте Organization, Corporation, NGO или LocalBusiness JSON-LD из данных организации: URL, логотипа, адреса, sameAs и контактов.", en: "Create Organization, Corporation, NGO, or LocalBusiness JSON-LD from verified URL, logo, address, sameAs, and ContactPoint data without AI or placeholder values." },
    h1: { ru: "Генератор Organization Schema JSON-LD", en: "Organization Schema JSON-LD Generator" },
    lead: { ru: "Укажите опубликованные данные организации, чтобы собрать одну сущность JSON-LD. Генератор использует введённые сведения без автоматического добавления адресов, контактов и рейтингов.", en: "Enter published organization details to build one JSON-LD entity. The generator uses your input without adding addresses, contacts, or ratings automatically." },
    quickFacts: [
      { ru: "Organization / Corporation / NGO / LocalBusiness", en: "Organization / Corporation / NGO / LocalBusiness" },
      { ru: "PostalAddress и ContactPoint", en: "PostalAddress and ContactPoint" },
      { ru: "Локально в браузере", en: "Runs locally in the browser" },
    ],
    howToSteps: [
      { ru: "Выберите подходящий тип @type и укажите название организации.", en: "Choose the most accurate supported @type and enter the factual name." },
      { ru: "Добавьте опубликованные адреса страниц, логотип, адрес организации, sameAs и контакты.", en: "Add only published URL, logo, address, sameAs, and contact data." },
      { ru: "Скопируйте JSON-LD, проверьте валидатором и сопоставьте с видимым содержимым страницы.", en: "Copy the JSON-LD, validate it, and compare it with visible page content." },
    ],
    supportedFeatures: [
      { ru: "Создаёт @id из URL или принимает явно заданный HTTP(S) адрес либо идентификатор фрагмента.", en: "Builds a stable @id from the URL or accepts an explicit HTTP(S) or fragment identifier." },
      { ru: "Поддерживает legalName, description, email, telephone, logo и до 20 адресов sameAs.", en: "Supports legalName, description, email, telephone, logo, and up to 20 sameAs URLs." },
      { ru: "Создаёт PostalAddress и ContactPoint с явно заданными areaServed и availableLanguage.", en: "Creates PostalAddress and ContactPoint structures with explicit areaServed and availableLanguage input." },
    ],
    limitations: [
      { ru: "Не проверяет юридическое существование организации и владение сайтами или профилями соцсетей.", en: "The tool does not verify legal existence or ownership of URLs and social profiles." },
      { ru: "JSON-LD должен соответствовать странице; генерация не гарантирует индексацию и расширенный результат поиска.", en: "JSON-LD must match visible content; generation alone does not guarantee indexing or a rich result." },
    ],
    useCases: [
      { ru: "Подготовить разметку Organization для главной страницы компании.", en: "Prepare the primary Organization entity for a corporate home page." },
      { ru: "Описать LocalBusiness с опубликованным адресом и контактами.", en: "Describe a LocalBusiness with a published address and contact point." },
      { ru: "Согласовать @id, logo и sameAs перед связыванием с другой разметкой.", en: "Standardize @id, logo, and sameAs before linking other schema entities." },
    ],
    technicalNotes: [
      { ru: "Значения обрабатываются локально; символ < экранируется для безопасной вставки в script.", en: "Values are serialized locally; the less-than character is escaped so user input cannot close the script element." },
      { ru: "Пустые необязательные свойства не включаются в результат; недостающие данные не подставляются.", en: "Empty optional properties are omitted and placeholder data is never generated." },
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
    metaDescription: { ru: "Соберите BreadcrumbList JSON-LD из 2–20 пунктов навигации с HTTP(S) URL. Адрес можно пропустить только у последнего пункта.", en: "Build ordered BreadcrumbList JSON-LD from 2–20 items, validate HTTP(S) URLs, and optionally omit item only for the final current-page crumb." },
    h1: { ru: "Генератор BreadcrumbList Schema JSON-LD", en: "BreadcrumbList Schema JSON-LD Generator" },
    lead: { ru: "Введите навигационную цепочку от главной страницы к текущей. Генератор последовательно назначит position и создаст BreadcrumbList по введённым названиям и адресам.", en: "Paste the factual navigation trail from the home page to the current page. The generator assigns positions sequentially without crawling the site or guessing canonical URLs." },
    quickFacts: [
      { ru: "От 2 до 20 пунктов", en: "From 2 to 20 items" },
      { ru: "Название | URL или TSV", en: "Name | URL or TSV" },
      { ru: "Последний URL необязателен", en: "Final item URL may be omitted" },
    ],
    howToSteps: [
      { ru: "Добавьте пункты в формате Название | URL, по одному на строку.", en: "Add each breadcrumb as Name | URL, one item per line." },
      { ru: "Сохраните порядок видимой навигации; URL можно пропустить только у последнего пункта.", en: "Preserve the actual interface order; URL may be omitted only for the final item." },
      { ru: "Скопируйте BreadcrumbList и сверьте с навигацией страницы.", en: "Copy the BreadcrumbList and verify that it matches the page's visible navigation." },
    ],
    supportedFeatures: [
      { ru: "Назначает position от 1 до числа пунктов.", en: "Automatically assigns positions from 1 through the row count." },
      { ru: "Проверяет абсолютные HTTP(S) URL и наличие адресов у промежуточных пунктов.", en: "Validates absolute HTTP(S) URLs and rejects a missing URL for an intermediate item." },
      { ru: "Не выводит item последнего пункта, если его URL не указан.", en: "Omits item for the current page when the final URL is intentionally left blank." },
    ],
    limitations: [
      { ru: "Не извлекает навигацию из HTML и не проверяет её видимость на странице.", en: "The tool does not extract breadcrumbs from HTML or verify that users can see them." },
      { ru: "Порядок и адреса нужно проверить вручную; предпочтительные URL генератор не выбирает.", en: "The site owner must confirm order and URLs; the generator does not determine canonical intent." },
    ],
    useCases: [
      { ru: "Подготовить BreadcrumbList для категории или карточки товара.", en: "Prepare BreadcrumbList markup for a category or product page." },
      { ru: "Сверить позиции и URL перед публикацией шаблона.", en: "Review positions and URLs before publishing a new template." },
      { ru: "Создать нумерацию пунктов без ручного редактирования JSON.", en: "Replace manual JSON position numbering with a deterministic list." },
    ],
    technicalNotes: [
      { ru: "Принимаются разделители | или табуляция; список ограничен двадцатью непустыми строками.", en: "The parser accepts a pipe or tab delimiter and limits the list to twenty non-empty rows." },
      { ru: "Введённые значения экранируются для безопасной вставки в script type=application/ld+json.", en: "User input is safely serialized inside the application/ld+json script." },
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
    metaDescription: { ru: "Создайте Product и при необходимости Offer JSON-LD: название, изображения, SKU, бренд, GTIN, цена, валюта и наличие из введённых данных.", en: "Create Product and optional Offer JSON-LD from your data: name, images, SKU, brand, GTIN, price, currency, availability, and condition." },
    h1: { ru: "Генератор Product Schema JSON-LD", en: "Product Schema JSON-LD Generator" },
    lead: { ru: "Заполните данные товара, чтобы собрать Product JSON-LD. Offer добавляется только при указании цены и валюты; отзывы, рейтинги, продавец, наличие и состояние автоматически не подставляются.", en: "The generator builds a Product entity and adds Offer only when price and priceCurrency are explicitly supplied. Ratings, reviews, seller, availability, and condition are never invented." },
    quickFacts: [
      { ru: "Product и необязательный Offer", en: "Product + optional Offer" },
      { ru: "Проверка GTIN 8/12/13/14", en: "GTIN 8/12/13/14 validation" },
      { ru: "До 10 адресов изображений", en: "Up to 10 image URLs" },
    ],
    howToSteps: [
      { ru: "Укажите название товара и доступные идентификаторы.", en: "Enter the factual name and available product identifiers." },
      { ru: "Добавьте Offer по опубликованным цене, валюте, наличию и состоянию товара.", en: "Add Offer only when price, currency, and corresponding availability or condition data are published." },
      { ru: "Проверьте JSON-LD и сверьте с видимой карточкой и текущими данными магазина.", en: "Validate the JSON-LD and keep it synchronized with the visible product page and current store data." },
    ],
    supportedFeatures: [
      { ru: "Поддерживает name, description, URL, @id, изображения, SKU, Brand, GTIN и MPN.", en: "Supports name, description, URL, @id, images, SKU, Brand, GTIN, and MPN." },
      { ru: "Создаёт Offer с ценой, трёхбуквенным кодом валюты, availability, itemCondition, seller и priceValidUntil.", en: "Creates Offer with price, a three-letter currency, availability, itemCondition, seller, and priceValidUntil." },
      { ru: "Не создаёт Offer без пары price/priceCurrency и не добавляет aggregateRating или review.", en: "Does not output Offer for an incomplete price and currency pair and never creates aggregateRating or review." },
    ],
    limitations: [
      { ru: "Не проверяет склад, оформление заказа, товарный фид и фактическое наличие товара.", en: "The tool does not verify inventory, checkout, merchant feeds, or actual product availability." },
      { ru: "Поддерживает одно предложение Offer. Варианты товара, доставка, возвраты и сложные цены требуют отдельной модели.", en: "One limited Offer entity is supported; variants, shippingDetails, returns, and complex pricing require a manual model." },
    ],
    useCases: [
      { ru: "Подготовить основную разметку Product для одной карточки.", en: "Prepare baseline Product JSON-LD for one product page." },
      { ru: "Проверить формат GTIN, валюты и Offer перед внедрением в CMS.", en: "Review GTIN, currency, and Offer formatting before CMS template integration." },
      { ru: "Собрать черновик по фактическим данным товара.", en: "Create a safe draft without fabricated ratings and reviews." },
    ],
    technicalNotes: [
      { ru: "Поле GTIN выбирается по длине: gtin8, gtin12, gtin13 или gtin14.", en: "The GTIN property is selected by length: gtin8, gtin12, gtin13, or gtin14." },
      { ru: "Для availability и itemCondition используются только варианты формы с адресами Schema.org.", en: "Availability and itemCondition are serialized as schema.org URLs only from the form's constrained list." },
    ],
    faq: [
      { question: { ru: "Какие данные нужны для разметки товара?", en: "What information is needed for product markup?" }, answer: { ru: "Укажите фактическое название и сведения, которые есть на странице товара. Если добавляете предложение о продаже, согласованно заполните цену и валюту. Проверьте результат перед размещением: генератор не получает данные из магазина сам.", en: "Enter the actual name and information shown on the product page. If adding a sales offer, supply a consistent price and currency. Review the result before publishing; the generator does not retrieve store data itself." } },
      { question: { ru: "Можно ли получить звёзды в поиске, просто добавив разметку?", en: "Can I get search result stars just by adding the markup?" }, answer: { ru: "Отображение решает поисковая система по своим правилам. Генератор не создаёт рейтинги и отзывы. Не добавляйте вымышленные оценки или сведения, которых нет на странице: разметка должна описывать реальные данные товара.", en: "Search engines decide what to display under their own rules. This generator does not create ratings or reviews. Do not add invented scores or information absent from the page; markup must describe real product data." } }
    ],
    relatedToolSlugs: ["structured-data-validator", "schema-markup-generator", "image-seo-audit"],
    sourceUrls: ["https://schema.org/Product", "https://schema.org/Offer", "https://developers.google.com/search/docs/appearance/structured-data/product"],
  }),
] as const;
