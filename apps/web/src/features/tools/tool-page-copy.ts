import type { ExecutorClass, Locale } from "@webdiag/tool-registry";

export function getToolPageChromeCopy(locale: Locale, executorClass: ExecutorClass) {
  const isCrawler = executorClass === "crawler";
  const isServerBacked = ["safe_fetch", "composite", "crawler", "chromium"].includes(executorClass);

  if (locale === "ru") {
    return {
      home: "Главная",
      tools: "Инструменты",
      local: isCrawler ? "Доступно в проекте WebDiag" : isServerBacked ? "Проверяется через WebDiag API" : "Работает в браузере",
      workspace: isCrawler ? "Открыть проект" : "Попробуйте инструмент",
      note: isCrawler
        ? "После авторизации выберите проект и запустите один ограниченный обход для всех трёх представлений результатов."
        : isServerBacked ? "Введите URL: WebDiag безопасно выполнит сетевую проверку и покажет результат." : "Добавьте данные, выберите нужные параметры и получите готовый результат.",
      processing: isCrawler ? "Ограниченный обход через backend" : isServerBacked ? "Сетевая проверка через backend" : "Ваши данные остаются здесь",
      processingText: isCrawler
        ? "Backend проверяет ownership проекта и SSRF policy, остаётся в пределах одного origin и получает не более 25 HTML-страниц без исполнения JavaScript."
        : isServerBacked ? "Для HTTP/SEO-инструментов URL отправляется в WebDiag API, где применяются SSRF-защита, DNS/IP policy и лимиты редиректов." : "Текст и выбранные файлы обрабатываются в текущем браузере и не отправляются на сервер для получения результата.",
      how: "Как пользоваться", supports: "Что умеет инструмент", limitations: "Что важно учитывать", useCases: "Когда пригодится", technical: "Что происходит внутри", faq: "Вопросы и ответы", related: "Связанные инструменты", allTools: "Все инструменты", reviewed: "Проверено",
    } as const;
  }

  return {
    home: "Home",
    tools: "Tools",
    local: isCrawler ? "Available in a WebDiag project" : isServerBacked ? "Checked through WebDiag API" : "Runs in your browser",
    workspace: isCrawler ? "Open a project" : "Try the tool",
    note: isCrawler
      ? "After signing in, choose a project and run one bounded crawl for all three result views."
      : isServerBacked ? "Enter a URL: WebDiag will run a safe network check and show the result." : "Add your data, choose the settings, and get the result.",
    processing: isCrawler ? "Bounded backend crawl" : isServerBacked ? "Network check through backend" : "Your data stays here",
    processingText: isCrawler
      ? "The backend verifies project ownership and SSRF policy, stays on one origin, and fetches no more than 25 HTML pages without executing JavaScript."
      : isServerBacked ? "For HTTP/SEO tools, the URL is sent to the WebDiag API, where SSRF protection, DNS/IP policy, and redirect limits are applied." : "Text and selected files are processed in the current browser and are not sent to a server to produce the result.",
    how: "How to use it", supports: "What the tool can do", limitations: "What to keep in mind", useCases: "Common use cases", technical: "How it works inside", faq: "Questions and answers", related: "Related tools", allTools: "All tools", reviewed: "Reviewed",
  } as const;
}
