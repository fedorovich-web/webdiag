import { toolPage } from "./shared";

export const seoAuditToolPages = [

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
      { question: { ru: "Почему это не отдельные проверки title и H1?", en: "Why is this not separate title and H1 checks?" }, answer: { ru: "Потому что отдельные микропроверки дают слабую ценность. WebDiag показывает их как части цельного metadata-инструмента.", en: "Because separate microchecks have weak value. WebDiag shows them as parts of a complete metadata tool." } },
      { question: { ru: "Это заменяет полный SEO-аудит?", en: "Does this replace a full SEO audit?" }, answer: { ru: "Нет. Это single-page metadata check. Полный аудит сайта требует crawl, истории и дополнительных проверок.", en: "No. This is a single-page metadata check. A full site audit needs crawl, history, and additional checks." } },
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
      { question: { ru: "Почему сниппет может отличаться от Google?", en: "Why can the snippet differ from Google?" }, answer: { ru: "Google может переписать title/description под запрос. Инструмент показывает базовые HTML-сигналы, которыми сайт управляет напрямую.", en: "Google can rewrite title/description for a query. The tool shows the base HTML signals the site controls directly." } },
      { question: { ru: "Можно ли проверять Яндекс?", en: "Can this check Yandex?" }, answer: { ru: "Да как HTML-сигналы страницы, но не как реальный сниппет Яндекса. Для настоящей выдачи нужен отдельный SERP-модуль.", en: "Yes as page HTML signals, but not as the real Yandex snippet. A real SERP module is separate." } },
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
      { question: { ru: "Почему Twitter/X не отдельный инструмент?", en: "Why is Twitter/X not a separate tool?" }, answer: { ru: "Потому что клиентский сценарий один: проверить rich preview страницы. Twitter/X вынесен внутрь полноценного social preview инструмента.", en: "Because the user scenario is one: check the page rich preview. Twitter/X belongs inside a complete social preview tool." } },
      { question: { ru: "Проверяется ли размер og:image?", en: "Does it check og:image dimensions?" }, answer: { ru: "Пока нет. Для этого нужен отдельный image fetch/asset validation слой с лимитами, чтобы не ломать безопасность и скорость.", en: "Not yet. That needs a separate image fetch/asset validation layer with limits to preserve safety and speed." } },
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
      { question: { ru: "Почему HSTS может быть проблемой на HTTP?", en: "Why can HSTS be a problem on HTTP?" }, answer: { ru: "HSTS действует только на HTTPS-ответах. Если финальный URL остаётся HTTP, сначала нужно исправить HTTPS и редиректы.", en: "HSTS only works on HTTPS responses. If the final URL remains HTTP, fix HTTPS and redirects first." } },
      { question: { ru: "Высокая оценка означает, что сайт безопасен?", en: "Does a high score mean the site is secure?" }, answer: { ru: "Нет. Это проверка базовых browser security headers для одного URL, а не pentest, SAST или полный security audit.", en: "No. This checks basic browser security headers for one URL, not a pentest, SAST, or full security audit." } },
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
      { question: { ru: "Относительный canonical — это ошибка?", en: "Is a relative canonical an error?" }, answer: { ru: "Не всегда. Браузеры и парсеры могут его резолвить, но абсолютный canonical безопаснее для диагностики, миграций и внешних сигналов.", en: "Not always. Browsers and parsers can resolve it, but an absolute canonical is safer for diagnostics, migrations, and external signals." } },
      { question: { ru: "Почему canonical должен совпадать с final URL?", en: "Why should canonical match the final URL?" }, answer: { ru: "Так меньше неоднозначности для поисковых систем: редиректы, sitemap, внутренние ссылки и canonical указывают на один предпочтительный адрес.", en: "It reduces ambiguity for search engines: redirects, sitemap, internal links, and canonical point to the same preferred address." } },
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
      { question: { ru: "Если robots.txt недоступен, сайт закрыт от индексации?", en: "If robots.txt is unavailable, is the site blocked from indexing?" }, answer: { ru: "Нет. Недоступный robots.txt обычно означает, что явных crawl-ограничений не найдено. Для рабочих сайтов лучше явно публиковать robots.txt и Sitemap directives.", en: "No. An unavailable robots.txt usually means no explicit crawl restrictions were found. Production sites should publish robots.txt and Sitemap directives explicitly." } },
      { question: { ru: "Можно ли проверять Googlebot или Яндекс?", en: "Can I test Googlebot or Yandex?" }, answer: { ru: "Да, можно указать другой user-agent. Инструмент применит наиболее специфичную подходящую группу правил.", en: "Yes, you can enter another user-agent. The tool applies the most specific matching rule group." } },
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
      { question: { ru: "Нужно указывать sitemap.xml или страницу сайта?", en: "Should I enter sitemap.xml or a site page?" }, answer: { ru: "Можно оба варианта. Если ввести страницу сайта, WebDiag проверит /sitemap.xml на том же домене. Если ввести sitemap XML напрямую, будет проверен именно он.", en: "Both work. If you enter a site page, WebDiag checks /sitemap.xml on that domain. If you enter a sitemap XML directly, that exact URL is checked." } },
      { question: { ru: "Инструмент проверяет все дочерние sitemap index?", en: "Does it check every child sitemap in a sitemap index?" }, answer: { ru: "Нет. MVP показывает сам sitemap index и список дочерних loc. Рекурсивная проверка всех дочерних файлов должна идти отдельным этапом с лимитами.", en: "No. The MVP shows the sitemap index and child loc entries. Recursive checking of every child file should be a separate stage with limits." } },
    ],
    relatedToolSlugs: ["robots-txt-tester", "redirect-chain-checker", "url-encoder-decoder"],
    sourceUrls: ["https://www.sitemaps.org/protocol.html", "https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview"],
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
      { question: { ru: "Почему проверка идёт через сервер, а не локально в браузере?", en: "Why does this check run through the server instead of locally in the browser?" }, answer: { ru: "Браузер ограничен CORS и не даёт надёжно прочитать redirect chain и заголовки чужого сайта. Поэтому проверка выполняется через безопасный backend WebDiag.", en: "Browsers are limited by CORS and cannot reliably read another site's redirect chain and headers. The check therefore runs through the safe WebDiag backend." } },
      { question: { ru: "Это массовая проверка статусов?", en: "Is this a bulk status checker?" }, answer: { ru: "Нет. Текущий инструмент проверяет один URL. Массовая проверка должна идти отдельным этапом с лимитами, очередью и защитой от злоупотреблений.", en: "No. This tool checks one URL. Bulk checking needs a separate stage with limits, queueing, and abuse protection." } },
    ],
    relatedToolSlugs: ["url-encoder-decoder", "json-formatter-validator", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Status", "https://developer.mozilla.org/docs/Web/HTTP/Redirections"],
  }),
] as const;
