import { toolPage } from "./shared";

export const seoAuditToolPages = [
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
