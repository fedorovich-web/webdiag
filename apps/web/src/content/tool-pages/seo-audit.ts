import { toolPage } from "./shared";

export const seoAuditToolPages = [
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
