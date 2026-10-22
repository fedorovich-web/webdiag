import type { ExecutorClass, Locale } from "@webdiag/tool-registry";

export function getToolPageChromeCopy(locale: Locale, executorClass: ExecutorClass, slug?: string) {
  const isCrawler = executorClass === "crawler";
  const isProviderBrowser = executorClass === "chromium";
  const isServerBacked = executorClass !== "browser";
  const usesServerAvif = slug === "image-optimizer" || slug === "image-format-converter";

  if (locale === "ru") {
    return {
      home: "Главная",
      tools: "Инструменты",
      local: isCrawler ? "Доступно в проекте WebDiag" : isProviderBrowser ? "Проверяется через Google PageSpeed" : isServerBacked ? "Проверяется на сервере WebDiag" : usesServerAvif ? "AVIF — на сервере WebDiag" : "Работает в браузере",
      workspace: isCrawler ? "Открыть проект" : "Попробуйте инструмент",
      note: isCrawler
        ? "После авторизации выберите проект и запустите один ограниченный обход для всех трёх представлений результатов."
        : isProviderBrowser ? "Укажите адрес открытой страницы: WebDiag получит измерения скорости и рекомендации Google PageSpeed."
          : executorClass === "dns_tls" ? "Заполните поля формы и запустите проверку. WebDiag выполнит сетевые запросы и покажет доступные данные."
          : isServerBacked ? "Введите URL: WebDiag безопасно выполнит сетевую проверку и покажет результат." : "Добавьте данные, выберите нужные параметры и получите готовый результат.",
      processing: isCrawler ? "Обход страниц проекта" : isProviderBrowser ? "Измерения Google PageSpeed" : isServerBacked ? "Проверка на сервере WebDiag" : usesServerAvif ? "Обработка изображения" : "Обработка в браузере",
      processingText: isCrawler
        ? "WebDiag проверяет до 100 страниц проекта на одном сайте. Проверка учитывает правила robots.txt; содержимое, которое появляется только после выполнения JavaScript, не анализируется."
        : isProviderBrowser ? "Источник измерений — Google PageSpeed Insights. Если сервис не вернул данные, их недоступность будет показана в результате."
          : isServerBacked ? "Сетевые запросы выполняет сервер WebDiag. Результат относится к указанному адресу и времени проверки; дополнительные ограничения описаны ниже."
            : usesServerAvif ? "JPEG, PNG и WebP обрабатываются в браузере. Для AVIF файл отправляется в конвертер WebDiag, обрабатывается в памяти сервера и не сохраняется."
              : "Текст и выбранные файлы обрабатываются в текущем браузере и не отправляются на сервер для получения результата.",
      how: "Как пользоваться", supports: "Что умеет инструмент", limitations: "Что важно учитывать", useCases: "Когда пригодится", technical: "Что происходит внутри", faq: "Вопросы и ответы", related: "Связанные инструменты", allTools: "Все инструменты", reviewed: "Проверено",
    } as const;
  }

  return {
    home: "Home",
    tools: "Tools",
    local: isCrawler ? "Available in a WebDiag project" : isProviderBrowser ? "Checked through Google PageSpeed" : isServerBacked ? "Checked on the WebDiag server" : usesServerAvif ? "AVIF uses the WebDiag server" : "Runs in your browser",
    workspace: isCrawler ? "Open a project" : "Try the tool",
    note: isCrawler
      ? "After signing in, choose a project and run one bounded crawl for all three result views."
      : isProviderBrowser ? "Enter a public page URL to retrieve speed measurements and recommendations from Google PageSpeed."
        : executorClass === "dns_tls" ? "Complete the form and run the check. WebDiag will make network requests and show the available data."
        : isServerBacked ? "Enter a URL: WebDiag will run a safe network check and show the result." : "Add your data, choose the settings, and get the result.",
    processing: isCrawler ? "Project page crawl" : isProviderBrowser ? "Google PageSpeed measurements" : isServerBacked ? "Check on the WebDiag server" : usesServerAvif ? "Image processing" : "Processing in your browser",
    processingText: isCrawler
      ? "WebDiag checks up to 100 project pages on one site. The check respects robots.txt; content that appears only after JavaScript runs is not analysed."
      : isProviderBrowser ? "Measurements come from Google PageSpeed Insights. If the service does not return data, the result marks them as unavailable."
        : isServerBacked ? "The WebDiag server makes the network requests. Results describe the specified address at the time of the check; further limits are explained below."
          : usesServerAvif ? "JPEG, PNG, and WebP are processed in your browser. AVIF uploads the file to the WebDiag converter for processing in server memory without storage."
            : "Text and selected files are processed in the current browser and are not sent to a server to produce the result.",
    how: "How to use it", supports: "What the tool can do", limitations: "What to keep in mind", useCases: "Common use cases", technical: "How it works inside", faq: "Questions and answers", related: "Related tools", allTools: "All tools", reviewed: "Reviewed",
  } as const;
}
