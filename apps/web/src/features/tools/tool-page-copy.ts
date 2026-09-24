import type { ExecutorClass, Locale } from "@webdiag/tool-registry";

export function getToolPageChromeCopy(locale: Locale, executorClass: ExecutorClass) {
  const isCrawler = executorClass === "crawler";
  const isProviderBrowser = executorClass === "chromium";
  const isServerBacked = ["safe_fetch", "composite", "crawler", "chromium"].includes(executorClass);

  if (locale === "ru") {
    return {
      home: "Главная",
      tools: "Инструменты",
      local: isCrawler
        ? "Доступно в проекте WebDiag"
        : isProviderBrowser
          ? "Онлайн-проверка"
          : isServerBacked
            ? "Безопасная онлайн-проверка"
            : "Работает в браузере",
      workspace: isCrawler ? "Открыть проект" : "Попробуйте инструмент",
      note: isCrawler
        ? "Войдите в аккаунт, выберите проект и запустите проверку сайта."
        : isProviderBrowser
          ? "Введите публичный URL — WebDiag выполнит проверку и покажет понятный результат."
          : isServerBacked
            ? "Введите URL — WebDiag проверит страницу и покажет результат без лишних настроек."
            : "Добавьте данные, выберите нужные параметры и получите результат сразу.",
      processing: isCrawler
        ? "Проверка сайта в проекте"
        : isServerBacked
          ? "Безопасная проверка"
          : "Данные обрабатываются в браузере",
      processingText: isCrawler
        ? "Проверка работает только с выбранным проектом и соблюдает ограничения сканирования сайта."
        : isProviderBrowser
          ? "WebDiag проверяет только указанный публичный URL и возвращает данные, необходимые для отчёта."
          : isServerBacked
            ? "WebDiag проверяет только указанный адрес и ограничивает сетевые запросы для безопасной диагностики."
            : "Введённый текст и выбранные файлы обрабатываются на вашем устройстве.",
      how: "Как пользоваться",
      supports: "Что умеет инструмент",
      limitations: "Что важно учитывать",
      useCases: "Когда пригодится",
      technical: "Как работает проверка",
      faq: "Вопросы и ответы",
      related: "Связанные инструменты",
      allTools: "Все инструменты",
      reviewed: "Обновлено",
    } as const;
  }

  return {
    home: "Home",
    tools: "Tools",
    local: isCrawler
      ? "Available in a WebDiag project"
      : isProviderBrowser
        ? "Online check"
        : isServerBacked
          ? "Secure online check"
          : "Runs in your browser",
    workspace: isCrawler ? "Open a project" : "Try the tool",
    note: isCrawler
      ? "Sign in, choose a project, and start the website check."
      : isProviderBrowser
        ? "Enter a public URL — WebDiag will run the check and show a clear result."
        : isServerBacked
          ? "Enter a URL — WebDiag will check the page and show the result without extra setup."
          : "Add your data, choose the settings, and get the result immediately.",
    processing: isCrawler
      ? "Project website check"
      : isServerBacked
        ? "Secure check"
        : "Data is processed in your browser",
    processingText: isCrawler
      ? "The check runs only for the selected project and respects the website crawl limits."
      : isProviderBrowser
        ? "WebDiag checks only the public URL you provide and returns the data needed for the report."
        : isServerBacked
          ? "WebDiag checks only the address you provide and limits network requests for safe diagnostics."
          : "Entered text and selected files are processed on your device.",
    how: "How to use it",
    supports: "What the tool can do",
    limitations: "What to keep in mind",
    useCases: "Common use cases",
    technical: "How the check works",
    faq: "Questions and answers",
    related: "Related tools",
    allTools: "All tools",
    reviewed: "Updated",
  } as const;
}
