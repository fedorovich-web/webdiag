import { toolPage } from "./shared";

export const seoAuditToolPages = [


  toolPage({
    slug: "core-web-vitals-checker",
    seoTitle: { ru: "Проверка Core Web Vitals и PageSpeed", en: "Core Web Vitals and PageSpeed Checker" },
    metaDescription: { ru: "Проверьте PageSpeed, Core Web Vitals, Lighthouse lab metrics, field data и opportunities через backend-интеграцию Google PageSpeed API.", en: "Check PageSpeed, Core Web Vitals, Lighthouse lab metrics, field data, and opportunities through the backend Google PageSpeed API integration." },
    h1: { ru: "Проверка Core Web Vitals", en: "Core Web Vitals Checker" },
    lead: { ru: "Запустите mobile, desktop или обе стратегии PageSpeed, чтобы увидеть performance score, LCP, FCP, CLS, TBT, INP field data и главные Lighthouse opportunities.", en: "Run mobile, desktop, or both PageSpeed strategies to see performance score, LCP, FCP, CLS, TBT, INP field data, and key Lighthouse opportunities." },
    quickFacts: [
      { ru: "Google PageSpeed API", en: "Google PageSpeed API" },
      { ru: "Mobile/Desktop", en: "Mobile/Desktop" },
      { ru: "Lab + Field data", en: "Lab + Field data" },
    ],
    howToSteps: [
      { ru: "Вставьте публичный URL страницы.", en: "Paste a public page URL." },
      { ru: "Выберите mobile, desktop или обе стратегии.", en: "Choose mobile, desktop, or both strategies." },
      { ru: "Проверьте score, lab metrics, field data availability и top opportunities.", en: "Review score, lab metrics, field data availability, and top opportunities." },
    ],
    supportedFeatures: [
      { ru: "Backend-интеграция с Google PageSpeed API через env GOOGLE_PAGESPEED_API_KEY.", en: "Backend Google PageSpeed API integration through GOOGLE_PAGESPEED_API_KEY env." },
      { ru: "Разделяет Lighthouse lab metrics и Chrome UX field data, если field data доступна.", en: "Separates Lighthouse lab metrics from Chrome UX field data when field data is available." },
      { ru: "Graceful unavailable state: отсутствие ключа или ошибка провайдера не превращается в fake score.", en: "Graceful unavailable state: missing key or provider errors never become a fake score." },
    ],
    limitations: [
      { ru: "PageSpeed проверяет только публично доступные URL и не работает для закрытого localhost/staging без отдельной инфраструктуры.", en: "PageSpeed checks only publicly accessible URLs and does not work for private localhost/staging without separate infrastructure." },
      { ru: "Результат зависит от Google API, лимитов, региона и доступности field data.", en: "The result depends on Google API, quotas, region, and field data availability." },
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
      { question: { ru: "Почему нет результата без API key?", en: "Why is there no result without an API key?" }, answer: { ru: "Чтобы не подделывать PageSpeed. В production нужно задать GOOGLE_PAGESPEED_API_KEY; без него WebDiag честно показывает unavailable state.", en: "To avoid fake PageSpeed data. Production must set GOOGLE_PAGESPEED_API_KEY; without it WebDiag honestly shows an unavailable state." } },
      { question: { ru: "Field data всегда есть?", en: "Is field data always available?" }, answer: { ru: "Нет. Chrome UX field data доступна только при достаточном объёме реальных пользовательских данных для URL или origin.", en: "No. Chrome UX field data is available only when there is enough real-user data for the URL or origin." } },
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
      { question: { ru: "Для всех файлов нужен max-age=31536000?", en: "Should every file use max-age=31536000?" }, answer: { ru: "Нет. Долгий immutable cache безопасен для content-hashed assets. Для HTML и неперсонализированных страниц правила должны учитывать purge и релизы.", en: "No. Long immutable caching is safe for content-hashed assets. HTML and non-personalized pages need rules that account for purge and releases." } },
      { question: { ru: "Почему важен Vary?", en: "Why does Vary matter?" }, answer: { ru: "При сжатии или content negotiation Vary помогает кэшам не смешивать разные варианты ответа для клиентов.", en: "With compression or content negotiation, Vary helps caches avoid mixing incompatible response variants." } },
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
      { question: { ru: "Почему это не полный waterfall?", en: "Why is this not a full waterfall?" }, answer: { ru: "Полный waterfall требует браузера или PageSpeed. Здесь безопасный быстрый static scan, чтобы не смешивать уровни проверки.", en: "A full waterfall requires a browser or PageSpeed. This is a safe fast static scan, so validation levels are not mixed." } },
      { question: { ru: "Будут ли рекомендации AVIF/WebP?", en: "Will it recommend AVIF/WebP?" }, answer: { ru: "Да. Legacy JPEG/PNG для тяжёлых растровых изображений помечаются как candidates для AVIF/WebP, но SVG/PNG сохраняются там, где это оправдано.", en: "Yes. Legacy JPEG/PNG heavy raster images are flagged as AVIF/WebP candidates, while SVG/PNG remain acceptable where justified." } },
    ],
    relatedToolSlugs: ["core-web-vitals-checker", "cache-policy-checker", "image-format-converter"],
    sourceUrls: ["https://web.dev/learn/performance/image-performance", "https://developer.chrome.com/docs/lighthouse/performance/uses-webp-images/"],
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
      { question: { ru: "Всегда ли нужно заменять PNG на AVIF?", en: "Should PNG always be replaced by AVIF?" }, answer: { ru: "Нет. Фото и тяжёлые raster assets обычно кандидаты для AVIF/WebP; SVG подходит для векторной графики, а PNG может быть оправдан для lossless UI-графики.", en: "No. Photos and heavy raster assets are usually AVIF/WebP candidates; SVG fits vector graphics, while PNG can be justified for lossless UI graphics." } },
      { question: { ru: "Почему это не полный waterfall?", en: "Why is this not a full waterfall?" }, answer: { ru: "Полный waterfall требует браузера/PageSpeed. Этот tool быстрый и безопасный static scan для image layer.", en: "A full waterfall requires a browser/PageSpeed. This tool is a fast and safe static scan for the image layer." } },
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
      { question: { ru: "Это проверка битых ссылок?", en: "Is this a broken link checker?" }, answer: { ru: "Нет. Link Analyzer показывает структуру ссылок и rel-сигналы. Для проверки статусов используйте Broken Link Checker.", en: "No. Link Analyzer shows link structure and rel signals. Use Broken Link Checker for status verification." } },
      { question: { ru: "Почему не исполняется JavaScript?", en: "Why is JavaScript not executed?" }, answer: { ru: "MVP intentionally uses a bounded safe HTML scan. Runtime DOM и SPA-ссылки добавляются позже через crawler/browser infrastructure.", en: "The MVP intentionally uses a bounded safe HTML scan. Runtime DOM and SPA links come later through crawler/browser infrastructure." } },
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
      { question: { ru: "Почему часть ссылок skipped?", en: "Why are some links skipped?" }, answer: { ru: "Skipped означает, что ссылка не HTTP(S) или превышен безопасный лимит проверки за один запуск.", en: "Skipped means the link is not HTTP(S) or the safe per-run check limit has been reached." } },
      { question: { ru: "Можно проверить весь сайт?", en: "Can it check the whole site?" }, answer: { ru: "Текущий инструмент проверяет одну страницу. Полный site crawler должен быть отдельным модулем с очередью, лимитами и историей.", en: "The current tool checks one page. A full site crawler must be a separate module with queueing, limits, and history." } },
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
      { question: { ru: "Это то же самое, что Image SEO Audit?", en: "Is this the same as Image SEO Audit?" }, answer: { ru: "Нет. Broken Image Checker проверяет доступность и content-type. Image SEO Audit проверяет alt, размеры, lazy loading и SEO-сигналы.", en: "No. Broken Image Checker checks availability and content type. Image SEO Audit checks alt, dimensions, lazy loading, and SEO signals." } },
      { question: { ru: "Почему не видны CSS background images?", en: "Why are CSS background images not shown?" }, answer: { ru: "MVP читает статический HTML. CSS/background/runtime resources будут частью будущего browser или crawler слоя.", en: "The MVP reads static HTML. CSS/background/runtime resources belong in the future browser or crawler layer." } },
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
      { question: { ru: "Почему нет отдельного Alt Checker?", en: "Why is there no separate Alt Checker?" }, answer: { ru: "Потому что alt — только часть image SEO. Отдельный Alt Checker был бы слабым микротулом.", en: "Because alt is only part of image SEO. A standalone Alt Checker would be a weak microtool." } },
      { question: { ru: "Пустой alt всегда ошибка?", en: "Is an empty alt always an error?" }, answer: { ru: "Нет. Для декоративного изображения alt='' корректен. Для изображения внутри ссылки пустой alt почти всегда проблема доступности и SEO.", en: "No. alt='' is correct for decorative images. For linked images, empty alt is usually an accessibility and SEO problem." } },
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
      { question: { ru: "Нужен ли SVG favicon?", en: "Do I need an SVG favicon?" }, answer: { ru: "Желательно. SVG даёт чёткую масштабируемую иконку, но /favicon.ico fallback всё ещё полезен для совместимости.", en: "Preferably yes. SVG gives a crisp scalable icon, while /favicon.ico fallback remains useful for compatibility." } },
      { question: { ru: "Это проверяет PWA?", en: "Does this check PWA?" }, answer: { ru: "Нет. Этот инструмент проверяет icon coverage и manifest presence. Полный PWA audit будет отдельным performance/app tool.", en: "No. This tool checks icon coverage and manifest presence. Full PWA audit is a separate performance/app tool." } },
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
      { question: { ru: "Почему это не обещает rich snippets?", en: "Why does it not promise rich snippets?" }, answer: { ru: "Потому что eligibility зависит от типа данных, контента страницы, политики поисковой системы и качества разметки. WebDiag честно показывает валидность и типы JSON-LD.", en: "Because eligibility depends on data type, page content, search engine policy, and markup quality. WebDiag honestly reports JSON-LD validity and types." } },
      { question: { ru: "Можно ли проверять несколько блоков JSON-LD?", en: "Can it check multiple JSON-LD blocks?" }, answer: { ru: "Да. Инструмент показывает каждый блок отдельно и суммирует найденные типы.", en: "Yes. The tool shows every block separately and summarizes detected types." } },
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
      { question: { ru: "Это AI-инструмент?", en: "Is this an AI tool?" }, answer: { ru: "Нет. Это детерминированный генератор шаблонов. Он не выдумывает адреса, рейтинги, цены или факты.", en: "No. This is a deterministic template generator. It does not invent addresses, ratings, prices, or facts." } },
      { question: { ru: "Почему шаблонов мало?", en: "Why only a few templates?" }, answer: { ru: "В MVP лучше поддерживать меньше типов, но без ложных обещаний. Новые типы надо добавлять отдельными проверяемыми шаблонами.", en: "In MVP it is better to support fewer types without false promises. New types should be added as separate verified templates." } },
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
      { question: { ru: "Это заменяет W3C validator?", en: "Does this replace the W3C validator?" }, answer: { ru: "Нет. Это встроенная WebDiag-проверка базовой структуры и типовых ошибок. Полную conformance validation нужно делать отдельной интеграцией или специализированным валидатором.", en: "No. This is a built-in WebDiag check for basic structure and common errors. Full conformance validation requires a separate integration or specialized validator." } },
      { question: { ru: "Почему duplicate IDs важны?", en: "Why do duplicate IDs matter?" }, answer: { ru: "Они ломают точечные ссылки, label/for, ARIA references и JavaScript selectors, поэтому это полезный сигнал качества HTML.", en: "They break fragment links, label/for, ARIA references, and JavaScript selectors, so this is a useful HTML quality signal." } },
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
      { question: { ru: "Почему нет отдельной проверки H1?", en: "Why is there no separate H1 checker?" }, answer: { ru: "Потому что H1 сам по себе слишком слабый инструмент. Он проверяется внутри полной структуры H1–H6.", en: "Because H1 alone is too thin for a standalone tool. It is checked inside the full H1–H6 structure." } },
      { question: { ru: "Это accessibility audit?", en: "Is this an accessibility audit?" }, answer: { ru: "Нет. Это content/SEO outline tool. Accessibility-проверки заголовков позже должны идти в отдельном accessibility audit.", en: "No. This is a content/SEO outline tool. Accessibility heading checks should later be part of a dedicated accessibility audit." } },
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
      { question: { ru: "Это keyword stuffing checker?", en: "Is this a keyword stuffing checker?" }, answer: { ru: "Частично. Он показывает повторы и плотность, но финальное решение требует редакторской оценки контекста.", en: "Partly. It shows repetition and density, but final decisions require editorial context." } },
      { question: { ru: "Можно ли доверять плотности как SEO-формуле?", en: "Can density be trusted as an SEO formula?" }, answer: { ru: "Нет. Плотность — диагностический сигнал, не формула ранжирования.", en: "No. Density is a diagnostic signal, not a ranking formula." } },
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
      { question: { ru: "Это подходит для русского текста?", en: "Does this work for Russian text?" }, answer: { ru: "Да как эвристика: инструмент считает длину, структуру и перегруженность. Он не притворяется точной русскоязычной академической формулой.", en: "Yes as a heuristic: it measures length, structure, and density. It does not pretend to be an exact Russian academic formula." } },
      { question: { ru: "Почему нет AI-оценки текста?", en: "Why is there no AI text scoring?" }, answer: { ru: "AI-анализ будет отдельным provider-based tool. Этот инструмент deterministic и проверяемый тестами.", en: "AI analysis will be a separate provider-based tool. This one is deterministic and testable." } },
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
      { question: { ru: "Это показывает, есть ли страница в индексе?", en: "Does this show whether the page is indexed?" }, answer: { ru: "Нет. Он показывает, есть ли технические блокировки индексации. Проверка фактической выдачи будет отдельным инструментом/интеграцией.", en: "No. It shows technical indexing blockers. Actual SERP/index presence needs a separate tool or integration." } },
      { question: { ru: "Почему canonical на другой URL не всегда fail?", en: "Why is a different canonical not always a fail?" }, answer: { ru: "Потому что это может быть намеренная консолидация дублей. Для текущего URL это warning: страница, вероятно, не должна ранжироваться как самостоятельная canonical target.", en: "Because it may intentionally consolidate duplicates. For the current URL it is a warning: the page likely should not rank as its own canonical target." } },
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
      { question: { ru: "Нужен ли hreflang одноязычному сайту?", en: "Does a single-language site need hreflang?" }, answer: { ru: "Обычно нет. Инструмент полезен для сайтов с несколькими языками или регионами.", en: "Usually no. The tool is useful for sites with multiple languages or regions." } },
      { question: { ru: "Почему reciprocal проверка не здесь?", en: "Why is reciprocal validation not here?" }, answer: { ru: "Потому что это уже обход набора URL. Его нужно делать в crawler/job инфраструктуре с лимитами и историей.", en: "Because that requires crawling a URL set. It belongs in crawler/job infrastructure with limits and history." } },
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
      { question: { ru: "Почему не все технологии найдены?", en: "Why are not all technologies detected?" }, answer: { ru: "Потому что инструмент не выполняет JavaScript и не анализирует runtime network waterfall. Это будет отдельный browser/crawler слой.", en: "Because the tool does not execute JavaScript or analyze runtime network waterfalls. That belongs to a separate browser/crawler layer." } },
      { question: { ru: "Можно ли использовать результат для security conclusions?", en: "Can the result be used for security conclusions?" }, answer: { ru: "Только как context. Для security нужны отдельные проверки headers, TLS, exposed versions и конфигурации.", en: "Only as context. Security conclusions require dedicated header, TLS, exposed-version, and configuration checks." } },
    ],
    relatedToolSlugs: ["security-headers-checker", "page-weight-analyzer", "core-web-vitals-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/HTTP/Headers/Server"],
  }),
] as const;
