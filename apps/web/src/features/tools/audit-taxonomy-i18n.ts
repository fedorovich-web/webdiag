import type { Locale } from "@webdiag/tool-registry";
import type { AuditFrontendCheck, AuditFrontendIssue } from "../home/audit-contract";

export const RU_AUDIT_CHECK_NAMES: Readonly<Record<string, string>> = {
  "performance.pagespeed_mobile": "Google PageSpeed (мобильные устройства)",
  "indexability.x_robots_tag": "Директивы X-Robots-Tag",
  "security.https": "Защищённое соединение HTTPS",
  "metadata.viewport": "Мобильный viewport",
  "accessibility.language": "Язык HTML-документа",
  "media.image_alt": "Альтернативный текст изображений",
  "media.image_dimensions": "Размеры изображений в HTML",
  "content.heading_order": "Порядок уровней заголовков",
  "metadata.unique_tags": "Повторяющиеся метатеги",

  "http.status": "HTTP-статус",
  "redirects.chain": "Цепочка редиректов",
  "content_type.html": "HTML content type",
  "metadata.title": "Title страницы",
  "metadata.description": "Meta description",
  "metadata.h1": "Структура H1",
  "metadata.canonical": "Canonical URL",
  "indexability.robots_meta": "Robots meta",
  "metadata.open_graph": "Метаданные Open Graph",
  "structured_data.json_ld": "Структурированные данные JSON-LD",
  "security.headers": "Security headers",
  "crawlability.robots_txt": "Robots.txt",
  "crawlability.sitemap_xml": "Обнаружение sitemap.xml",
};

export const DISPLAY_CHECK_NAMES: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  ru: {
    "http.status": "HTTP-статус ответа сервера",
    "redirects.chain": "Цепочка и длина редиректов",
    "content_type.html": "MIME-тип контента (HTML / charset)",
    "metadata.title": "Тег Title (Заголовок страницы)",
    "metadata.description": "Метатег Description (Описание страницы)",
    "metadata.h1": "Главный заголовок H1 и структура",
    "metadata.canonical": "Канонический адрес (Canonical URL)",
    "indexability.robots_meta": "Директивы индексации (Robots Meta)",
    "metadata.open_graph": "Микроразметка Open Graph (Соцсети)",
    "structured_data.json_ld": "Структурированные данные Schema.org (JSON-LD)",
    "security.headers": "Заголовки безопасности HTTP (HSTS, CSP)",
    "crawlability.robots_txt": "Файл директив Robots.txt",
    "crawlability.sitemap_xml": "Карта сайта Sitemap.xml",
    "performance.pagespeed_mobile": "Google PageSpeed и Core Web Vitals",
  },
  en: {
    "http.status": "HTTP Response Status Code",
    "redirects.chain": "Redirect Chain & Hops",
    "content_type.html": "HTML Content-Type & Charset",
    "metadata.title": "Page Title Tag",
    "metadata.description": "Meta Description Tag",
    "metadata.h1": "Primary H1 Heading Structure",
    "metadata.canonical": "Canonical URL Link",
    "indexability.robots_meta": "Robots Meta Directives",
    "metadata.open_graph": "Open Graph Social Metadata",
    "structured_data.json_ld": "Schema.org Structured Data (JSON-LD)",
    "security.headers": "HTTP Security Headers (HSTS, CSP)",
    "crawlability.robots_txt": "Robots.txt Directives & Availability",
    "crawlability.sitemap_xml": "XML Sitemap Discovery & Coverage",
    "performance.pagespeed_mobile": "Google PageSpeed & Core Web Vitals",
  },
};

export const RU_CATEGORIES: Readonly<Record<string, string>> = {
  http: "HTTP",
  redirects: "редиректы",
  metadata: "метаданные",
  indexability: "индексация",
  crawlability: "сканирование",
  content: "контент",
  structured_data: "структурированные данные",
  security: "безопасность",
  performance: "производительность",
  accessibility: "доступность",
  media: "медиа",
  url: "URL",
};

export const EN_CATEGORIES: Readonly<Record<string, string>> = {
  http: "HTTP",
  redirects: "Redirects",
  metadata: "Metadata",
  indexability: "Indexability",
  crawlability: "Crawlability",
  content: "Content",
  structured_data: "Structured Data",
  security: "Security",
  performance: "Performance",
  accessibility: "Accessibility",
  media: "Media",
  url: "URL",
};

interface Translation {
  title: string;
  description: string;
  summary: string;
  steps: readonly string[];
  expectedImpact: string | null;
}

const RU_SITE_AUDIT_ISSUES: Readonly<Record<string, Translation>> = {
  "site.metadata.duplicate_title": {
    title: "Повторяющиеся title",
    description: "Несколько проверенных страниц используют одинаковый title.",
    summary: "Напишите отдельный title для каждой важной страницы.",
    steps: ["Проверьте назначение каждой затронутой страницы.", "Замените повторяющиеся title с учётом содержимого страниц.", "Повторите аудит и проверьте, что дубли устранены."],
    expectedImpact: null,
  },
  "site.metadata.duplicate_description": {
    title: "Повторяющиеся метаописания",
    description: "Несколько проверенных страниц используют одинаковое метаописание.",
    summary: "Напишите отдельное метаописание для каждой важной страницы.",
    steps: ["Проверьте назначение каждой затронутой страницы.", "Замените повторяющиеся метаописания с учётом содержимого страниц.", "Повторите аудит и проверьте, что дубли устранены."],
    expectedImpact: null,
  },
  "site.crawlability.orphan_candidate": {
    title: "URL из sitemap без обнаруженных внутренних ссылок",
    description: "Эти URL из sitemap не найдены в ссылках проверенных страниц. Требуется проверить внутреннюю перелинковку.",
    summary: "Проверьте навигацию и контекстные ссылки на эти URL.",
    steps: ["Уточните, должна ли каждая страница индексироваться.", "Добавьте подходящую внутреннюю ссылку с доступной страницы.", "Повторите аудит и проверьте обнаружение URL."],
    expectedImpact: "Помогает обнаружению страниц без обещания их индексации.",
  },
  "site.http.fetch_failed": {
    title: "Не удалось загрузить страницы",
    description: "Не удалось получить проверяемый HTTP-ответ для этих обнаруженных URL.",
    summary: "Восстановите стабильный общедоступный HTTP-ответ для каждого URL.",
    steps: ["Проверьте сервер и доступность затронутых URL.", "Повторите аудит и проверьте фактический ответ."],
    expectedImpact: null,
  },
  "site.crawlability.robots_disallowed": {
    title: "Страницы исключены в robots.txt",
    description: "Запросы к этим обнаруженным URL не выполнялись из-за запрета в robots.txt.",
    summary: "Убедитесь, что каждое исключение в robots.txt намеренное.",
    steps: ["Проверьте правила robots.txt для затронутых URL.", "После необходимых изменений повторите аудит."],
    expectedImpact: null,
  },
  "site.http.non_html": {
    title: "Обнаруженные URL не являются HTML-страницами",
    description: "Эти обнаруженные URL вернули другой тип содержимого и не прошли анализ HTML-страницы.",
    summary: "Убедитесь, что такой тип ответа предусмотрен для каждого URL.",
    steps: ["Проверьте Content-Type и содержимое ответа для затронутых URL.", "После необходимых изменений повторите аудит."],
    expectedImpact: null,
  },
};

export const RU_AUDIT_ISSUES: Readonly<Record<string, Translation>> = {
  "http.status.server_error": {
    title: "Сервер вернул ошибку",
    description: "Проверяемый URL вернул HTTP-статус 5xx.",
    summary: "Исправьте серверную ошибку до оптимизации второстепенных SEO-сигналов.",
    steps: [
      "Проверьте application logs для этого URL.",
      "Проверьте состояние upstream, proxy и deployment.",
    ],
    expectedImpact: "Восстанавливает доступ страницы для пользователей и сканирования.",
  },
  "http.status.client_error": {
    title: "Страница вернула ошибку клиента",
    description: "Проверяемый URL вернул HTTP-статус 4xx.",
    summary: "Восстановите страницу или перенаправьте URL на корректный адрес.",
    steps: [
      "Уточните, должен ли URL быть доступен для индексации.",
      "Верните 200 для активной страницы или 301 на canonical-замену.",
    ],
    expectedImpact: "Устраняет неработающую посадочную страницу и лишние запросы сканеров.",
  },
  "redirects.chain.too_long": {
    title: "Слишком длинная цепочка редиректов",
    description: "До финального ответа URL проходит больше двух редиректов.",
    summary: "Замените промежуточные переходы одним прямым редиректом на canonical URL.",
    steps: [
      "Обновите правила так, чтобы исходный URL сразу указывал на финальный.",
    ],
    expectedImpact: "Снижает задержку и расход crawl budget.",
  },
  "content_type.html.not_html": {
    title: "Ответ не является HTML",
    description: "Проверяемый URL не вернул HTML content type.",
    summary: "Для посадочной страницы верните HTML-документ.",
    steps: [
      "Проверьте routing и response headers этого URL.",
    ],
    expectedImpact: "Позволяет корректно выполнить проверки метаданных, индексации и контента.",
  },
  "metadata.title.missing": {
    title: "Отсутствует title",
    description: "В HTML head страницы нет элемента title.",
    summary: "Добавьте уникальный title, который описывает тему страницы.",
    steps: [
      "Сохраняйте этот сигнал уникальным для каждого важного URL.",
    ],
    expectedImpact: "Улучшает качество поискового сниппета и ясность темы страницы.",
  },
  "metadata.title.too_short": {
    title: "Title слишком короткий",
    description: "Title есть, но он слишком короткий, чтобы ясно описать страницу.",
    summary: "Перепишите title так, чтобы он передавал тему и назначение страницы.",
    steps: [
      "Сохраняйте этот сигнал уникальным для каждого важного URL.",
    ],
    expectedImpact: "Улучшает качество поискового сниппета и ясность темы страницы.",
  },
  "metadata.description.missing": {
    title: "Отсутствует meta description",
    description: "В HTML head страницы нет meta description.",
    summary: "Добавьте краткое описание для сниппета страницы.",
    steps: [
      "Сохраняйте этот сигнал уникальным для каждого важного URL.",
    ],
    expectedImpact: "Улучшает качество поискового сниппета и ясность темы страницы.",
  },
  "metadata.h1.missing": {
    title: "Отсутствует H1",
    description: "На странице нет основного заголовка H1.",
    summary: "Добавьте один понятный H1, соответствующий назначению страницы.",
    steps: [
      "Используйте видимый заголовок, который описывает основную тему страницы.",
    ],
    expectedImpact: "Улучшает структуру контента и ясность темы страницы.",
  },
  "metadata.h1.multiple": {
    title: "Несколько заголовков H1",
    description: "На странице больше одного заголовка H1.",
    summary: "Оставьте один основной H1, а второстепенные заголовки понизьте до H2/H3.",
    steps: [
      "Проверьте структуру документа и оставьте один основной заголовок.",
    ],
    expectedImpact: "Улучшает семантическую последовательность для пользователей и сканеров.",
  },
  "metadata.canonical.missing": {
    title: "Отсутствует canonical URL",
    description: "Страница не объявляет canonical URL.",
    summary: "Добавьте canonical link на предпочтительный индексируемый URL.",
    steps: [
      "Укажите в rel=canonical стабильный финальный URL этой страницы.",
    ],
    expectedImpact: "Снижает неоднозначность между дублирующимися URL.",
  },
  "metadata.canonical.final_url_mismatch": {
    title: "Canonical не совпадает с финальным URL",
    description: "Canonical URL страницы отличается от адреса после редиректов.",
    summary: "Согласуйте canonical с финальным индексируемым URL.",
    steps: [
      "Подтвердите предпочтительный URL страницы.",
      "Укажите в canonical href тот же стабильный URL, который получают сканеры.",
    ],
    expectedImpact: "Снижает неоднозначность дубликатов и canonical-сигналов.",
  },
  "indexability.robots_meta.noindex": {
    title: "Страница помечена noindex",
    description: "Robots meta содержит директиву noindex.",
    summary: "Удалите noindex, если страница должна появляться в поиске.",
    steps: [
      "До изменения директивы подтвердите ожидаемый режим индексации.",
    ],
    expectedImpact: "Позволяет индексировать страницу, если остальные условия сканирования выполнены.",
  },
  "metadata.open_graph.incomplete": {
    title: "Неполные метаданные Open Graph",
    description: "Open Graph присутствует, но не содержит всех базовых сигналов для preview.",
    summary: "Добавьте title, description и image для Open Graph.",
    steps: [
      "Согласуйте og:title с темой title страницы.",
      "Добавьте краткий og:description.",
      "Укажите стабильный абсолютный URL изображения в og:image.",
    ],
    expectedImpact: "Улучшает preview ссылок в соцсетях и мессенджерах.",
  },
  "structured_data.json_ld.invalid": {
    title: "Некорректные данные JSON-LD",
    description: "Один или несколько блоков application/ld+json не разбираются как JSON.",
    summary: "Исправьте JSON-LD до использования сигналов rich results.",
    steps: [
      "Проверьте каждый JSON-LD блок как строгий JSON.",
      "Согласуйте schema types с видимым содержимым страницы.",
    ],
    expectedImpact: "Не даёт парсерам структурированных данных отбросить schema evidence.",
  },
  "security.headers.missing": {
    title: "Security headers требуют внимания",
    description: "В ответе отсутствуют или ослаблены базовые security headers.",
    summary: "Добавьте совместимые с сайтом базовые response security headers.",
    steps: [
      "Добавьте X-Content-Type-Options: nosniff.",
      "Настройте Content-Security-Policy после проверки нужных scripts и assets.",
      "Используйте Strict-Transport-Security на production HTTPS hosts.",
      "Добавьте Referrer-Policy и Permissions-Policy.",
    ],
    expectedImpact: "Снижает устранимые риски безопасности в браузере.",
  },
  "crawlability.robots_txt.disallows_target": {
    title: "Robots.txt блокирует проверяемый URL",
    description: "Robots.txt содержит Disallow rule для пути проверяемого URL.",
    summary: "Разрешите URL в robots.txt, если его должны сканировать и индексировать.",
    steps: [
      "Проверьте совпавшее правило Disallow.",
      "Сузьте или удалите его для индексируемых посадочных страниц.",
    ],
    expectedImpact: "Восстанавливает доступ сканера к странице, которая должна находиться в поиске.",
  },
  "crawlability.sitemap_xml.missing": {
    title: "Sitemap.xml не обнаружен",
    description: "На этом origin недоступен стандартный endpoint /sitemap.xml.",
    summary: "Опубликуйте sitemap.xml или объявите его адрес в robots.txt.",
    steps: [
      "По возможности опубликуйте sitemap.xml в корне сайта.",
      "Либо добавьте директивы Sitemap в robots.txt.",
    ],
    expectedImpact: "Улучшает обнаружение URL поисковыми сканерами.",
  },
  "crawlability.sitemap_xml.invalid": {
    title: "Некорректный sitemap.xml",
    description: "Обнаруженный sitemap.xml не разбирается как валидный XML.",
    summary: "Исправьте XML-синтаксис и пересоберите sitemap.",
    steps: [
      "Проверьте sitemap.xml валидатором до публикации.",
    ],
    expectedImpact: "Позволяет сканерам надёжно прочитать список URL.",
  },
  "crawlability.sitemap_xml.empty": {
    title: "Sitemap.xml не содержит URL",
    description: "В обнаруженном sitemap.xml нет элементов loc.",
    summary: "Добавьте в sitemap важные canonical URL.",
    steps: [
      "Пересоберите sitemap.xml из актуального списка production routes.",
    ],
    expectedImpact: "Улучшает обнаружение важных страниц поисковыми сканерами.",
  },
};

export const EXTRA_AUDIT_ISSUES: Readonly<Record<string, Translation>> = {
  "indexability.x_robots_tag.noindex": {"title": "HTTP-заголовок запрещает индексацию", "description": "В X-Robots-Tag найдено noindex или none.", "summary": "Проверьте X-Robots-Tag. Уберите запрет только для страниц, которые должны индексироваться.", "steps": ["Проверьте X-Robots-Tag. Уберите запрет только для страниц, которые должны индексироваться."], "expectedImpact": null},
  "security.https.missing": {"title": "Страница доступна по HTTP", "description": "Финальный адрес страницы использует HTTP.", "summary": "Настройте HTTPS и перенаправление с HTTP на защищённый адрес.", "steps": ["Настройте HTTPS и перенаправление с HTTP на защищённый адрес."], "expectedImpact": null},
  "metadata.viewport.missing": {"title": "Требуется настройка viewport", "description": "Viewport отсутствует или не задаёт width=device-width.", "summary": "Задайте width=device-width в meta viewport и проверьте адаптивность на мобильном устройстве.", "steps": ["Задайте width=device-width в meta viewport и проверьте адаптивность на мобильном устройстве."], "expectedImpact": null},
  "accessibility.language.missing": {"title": "Не указан язык документа", "description": "В HTML отсутствует непустой атрибут lang.", "summary": "Задайте html lang в соответствии с языком страницы.", "steps": ["Задайте html lang в соответствии с языком страницы."], "expectedImpact": null},
  "media.image_alt.missing": {"title": "У изображений отсутствует alt", "description": "Найдены img без атрибута alt.", "summary": "Добавьте описание значимым изображениям и alt=\"\" декоративным.", "steps": ["Добавьте описание значимым изображениям и alt=\"\" декоративным."], "expectedImpact": null},
  "media.image_dimensions.missing": {"title": "В HTML не указаны размеры изображений", "description": "У части изображений нет положительных width и height. CSS-размеры этой проверкой не оцениваются.", "summary": "Зарезервируйте место через width/height или CSS aspect-ratio и проверьте сдвиги в браузере.", "steps": ["Зарезервируйте место через width/height или CSS aspect-ratio и проверьте сдвиги в браузере."], "expectedImpact": null},
  "content.heading_order.skipped_level": {"title": "Пропущены уровни заголовков", "description": "В статической структуре есть переход через уровень, например H1 → H3.", "summary": "Используйте последовательные уровни заголовков по структуре документа.", "steps": ["Используйте последовательные уровни заголовков по структуре документа."], "expectedImpact": null},
  "metadata.unique_tags.duplicate": {"title": "Метатеги повторяются", "description": "Найдено несколько title, meta description или canonical.", "summary": "Оставьте один title, один meta description и один canonical для страницы.", "steps": ["Оставьте один title, один meta description и один canonical для страницы."], "expectedImpact": null},
  "http.response.server_error": {
    title: "Сервер вернул ошибку (5xx)",
    description: "Проверяемый URL вернул код ответа сервера 5xx.",
    summary: "Исправьте серверную ошибку до оптимизации второстепенных SEO-сигналов.",
    steps: [
      "Проверьте логи приложения и веб-сервера для этого URL.",
      "Проверьте состояние баз данных, upstream-сервисов и кэша.",
    ],
    expectedImpact: "Восстанавливает доступ к странице для пользователей и поисковых систем.",
  },
  "http.response.client_error": {
    title: "Ошибка клиента (4xx)",
    description: "Проверяемый URL вернул статус ошибки 4xx (например, 404 Not Found или 403 Forbidden).",
    summary: "Восстановите страницу или настройте редирект на актуальный адрес.",
    steps: [
      "Проверьте, существует ли страница и корректен ли запрашиваемый URL.",
      "Верните 200 OK для рабочей страницы или настройте 301-редирект на замену.",
    ],
    expectedImpact: "Устраняет битые ссылки и снижает неэффективный расход краулингового бюджета.",
  },
  "http.redirects.too_many": {
    title: "Слишком длинная цепочка редиректов",
    description: "До достижения финального ответа URL проходит более двух перенаправлений.",
    summary: "Замените цепочку редиректов одним прямым переходом на канонический URL.",
    steps: [
      "Обновите внутренние ссылки и правила веб-сервера, направляя сразу на финальный адрес.",
    ],
    expectedImpact: "Ускоряет загрузку страницы и исключает потерю ссылочного веса.",
  },
  "content.body.not_html": {
    title: "Ответ не является HTML-документом",
    description: "Сервер вернул ответ с Content-Type, отличным от text/html.",
    summary: "Убедитесь, что посадочная страница отдаёт корректный HTML-контент.",
    steps: [
      "Проверьте заголовки ответа Content-Type и конфигурацию веб-сервера.",
    ],
    expectedImpact: "Позволяет поисковым роботам просканировать и проиндексировать содержимое страницы.",
  },
  "performance.pagespeed_mobile.poor": {
    title: "Низкая скорость на мобильных устройствах",
    description: "Оценка Google PageSpeed для мобильных устройств ниже 50 баллов.",
    summary: "Оптимизируйте ключевые метрики Core Web Vitals (LCP, INP, CLS) для мобильных пользователей.",
    steps: [
      "Сжимайте изображения в форматы WebP или AVIF и настраивайте адаптивные размеры.",
      "Устраните блокирующие рендеринг скрипты (defer/async) и неиспользуемый CSS.",
      "Сократите время ответа сервера (TTFB) и настройте кэширование.",
    ],
    expectedImpact: "Повышает позиции в мобильном поиске Google/Яндекс и увеличивает конверсию.",
  },
  "performance.pagespeed_mobile.needs_improvement": {
    title: "Скорость мобильной версии требует оптимизации",
    description: "Оценка Google PageSpeed для мобильных устройств находится в диапазоне 50–89 баллов.",
    summary: "Устраните оставшиеся задержки загрузки для перехода в оптимальную зелёную зону (90+).",
    steps: [
      "Настройте отложенную загрузку (lazy-loading) для медиафайлов ниже первого экрана.",
      "Минифицируйте JavaScript и оптимизируйте загрузку веб-шрифтов.",
    ],
    expectedImpact: "Обеспечивает комфортный опыт пользователей и стабильное прохождение Core Web Vitals.",
  },
};

export interface AuditCheckGuide {
  readonly title: string;
  readonly category: string;
  readonly whatIsChecked: string;
  readonly impact: string;
  readonly whatToFix: readonly string[];
  readonly howToFix: readonly string[];
  readonly codeExample?: {
    readonly language: string;
    readonly code: string;
    readonly title: string;
  };
  readonly toolSlug: string;
  readonly toolTitle: string;
}

export const AUDIT_CHECK_GUIDES: Readonly<Record<Locale, Readonly<Record<string, AuditCheckGuide>>>> = {
  ru: {
    "http.status": {
      title: "HTTP-статус ответа сервера",
      category: "HTTP и протокол",
      whatIsChecked: "Код состояния HTTP, возвращаемый сервером при обращении к странице. Проверяется, что страница отдает успешный код 200 OK и не содержит критических ошибок сервера (500, 502, 503) или клиента (404, 403).",
      impact: "Критическое. Поисковые системы не индексируют страницы с ошибками 4xx/5xx и быстро исключают их из результатов поиска.",
      whatToFix: [
        "Если код 5xx — сервер падает от нагрузки или внутренней ошибки бэкенда.",
        "Если код 404 — страница удалена, переименована или в ссылке опечатка.",
        "Если код 403 — веб-сервер или WAF блокирует доступ бота.",
      ],
      howToFix: [
        "Для активных страниц верните статус 200 OK.",
        "Для перемещенных адресов настройте постоянный редирект 301.",
        "Для удаленных страниц настройте понятную страницу ошибки 404.",
      ],
      codeExample: {
        title: "Конфигурация Nginx для статусов ответов",
        language: "nginx",
        code: `location / {
    try_files $uri $uri/ /index.html;
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}`,
      },
      toolSlug: "http-headers-analyzer",
      toolTitle: "Анализатор HTTP-заголовков",
    },
    "redirects.chain": {
      title: "Цепочка редиректов",
      category: "редиректы",
      whatIsChecked: "Количество промежуточных перенаправлений (301, 302, 307, 308) до открытия финального адреса. Проверяется отсутствие петель и длина цепочки не более 1 перехода.",
      impact: "Высокое. Каждый лишний редирект замедляет загрузку на 150-400 мс, расходует краулинговый бюджет ботов и рассеивает ссылочный вес.",
      whatToFix: [
        "Устраните промежуточные звенья (например: HTTP -> HTTPS non-www -> HTTPS www).",
        "Замените временные 302 редиректы на постоянные 301.",
        "Устраните циклические редиректы (Redirect Loops).",
      ],
      howToFix: [
        "Настройте прямой 301-редирект с любого исходного адреса сразу на финальный канонический URL.",
        "Обновите внутренние ссылки на сайте, чтобы они не проходили через редирект.",
      ],
      codeExample: {
        title: "Прямой 301 редирект на HTTPS в Nginx",
        language: "nginx",
        code: `server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://example.com$request_uri;
}`,
      },
      toolSlug: "redirect-chain-checker",
      toolTitle: "Проверка цепочек редиректов",
    },
    "content_type.html": {
      title: "Тип контента HTML (Content-Type)",
      category: "HTTP",
      whatIsChecked: "Корректность заголовка ответа сервера Content-Type. Он обязан содержать MIME-тип text/html и кодировку charset=utf-8.",
      impact: "Высокое. При неверном типе контента браузер может предложить скачать страницу файлом, а поисковый бот откажется парсить страницу.",
      whatToFix: [
        "Убедитесь, что сервер не отдает text/plain или application/octet-stream.",
        "Проверьте явное объявление UTF-8 кодировки.",
      ],
      howToFix: [
        "Настройте директиву charset utf-8 на веб-сервере.",
        "Укажите в заголовке ответа: Content-Type: text/html; charset=utf-8.",
      ],
      codeExample: {
        title: "Настройка UTF-8 в Nginx",
        language: "nginx",
        code: `charset utf-8;
types {
    text/html html htm;
}`,
      },
      toolSlug: "html-validator",
      toolTitle: "Валидатор HTML",
    },
    "metadata.title": {
      title: "Тег Title (Заголовок страницы)",
      category: "метаданные",
      whatIsChecked: "Наличие title и базовая проверка длины: менее 10 символов отмечается как слишком короткий заголовок. Ключевые слова и кликабельность автоматически не оцениваются.",
      impact: "Критическое. Тег Title — важнейший онпейдж-фактор ранжирования в Яндекс и Google, формирующий синюю строку в поисковой выдаче.",
      whatToFix: [
        "Если тег отсутствует — добавить немедленно.",
        "Если Title короче 30 символов — дополнить преимуществами, брендом и регионом.",
        "Если длиннее 70 символов — укоротить самое важное в начало, чтобы не обрезалось.",
      ],
      howToFix: [
        "Шаблон: [Основная услуга/товар] в [Городе] — [УТП / Выгода] | [Бренд].",
        "Каждая страница сайта обязана иметь уникальный Title.",
      ],
      codeExample: {
        title: "Пример оптимизированного Title",
        language: "html",
        code: `<head>
  <title>Купить женские пуховики в Москве — Скидки до 40% | Brand</title>
</head>`,
      },
      toolSlug: "meta-tags-checker",
      toolTitle: "Анализатор метатегов",
    },
    "metadata.description": {
      title: "Метатег Description (Описание страницы)",
      category: "метаданные",
      whatIsChecked: "Наличие непустого meta description в HTML. Кликабельность и качество текста этой проверкой не измеряются.",
      impact: "Высокое для CTR. Поисковые системы часто используют этот текст как сниппет в результатах поиска.",
      whatToFix: [
        "Если Description отсутствует — поисковик выберет случайный текст со страницы.",
        "Не заполняйте Description бессвязным списком ключевых слов (спам).",
        "Не дублируйте один и тот же Description на разных страницах.",
      ],
      howToFix: [
        "Сформулируйте 1–2 понятных предложения с выгодами, ценами, условиями доставки и призывом к действию (CTA).",
      ],
      codeExample: {
        title: "Пример привлекательного Description",
        language: "html",
        code: `<meta name="description" content="Большой каталог оригинальных зимних пуховиков с натуральным пухом. Быстрая доставка по Москве и РФ. Примерка перед покупкой. Закажите онлайн!" />`,
      },
      toolSlug: "meta-tags-checker",
      toolTitle: "Анализатор метатегов",
    },
    "metadata.h1": {
      title: "Главный заголовок H1",
      category: "контент",
      whatIsChecked: "Количество непустых H1 в статическом HTML. Видимость и соответствие заголовка теме страницы требуют отдельной проверки.",
      impact: "Высокое. Заголовок H1 задает основную тему страницы для поисковых ботов и помогает посетителю мгновенно сориентироваться.",
      whatToFix: [
        "Если H1 отсутствует — добавить в шапку контента.",
        "Если H1 несколько — оставить один главный, остальные заменить на <h2>.",
        "Не оборачивать в <h1> логотипы сайта и служебные блоки.",
      ],
      howToFix: [
        "Используйте строгую иерархию: один <h1>, подразделы <h2>, вложенные пункты <h3>.",
      ],
      codeExample: {
        title: "Иерархия заголовков в HTML",
        language: "html",
        code: `<main>
  <h1>Зимние женские пуховики</h1>
  <p>Вводное описание каталога...</p>
  <h2>Короткие модели</h2>
  <h2>Длинные оверсайз модели</h2>
</main>`,
      },
      toolSlug: "heading-structure-checker",
      toolTitle: "Проверка структуры H1-H6",
    },
    "metadata.canonical": {
      title: "Канонический адрес (Canonical URL)",
      category: "индексация",
      whatIsChecked: "Наличие canonical и сравнение разрешённого адреса с финальным URL страницы. Доступность адреса canonical отдельно не запрашивается.",
      impact: "Критическое. Предотвращает дублирование контента при наличии UTM-меток, параметров сортировки, фильтров и пагинации.",
      whatToFix: [
        "Если canonical отсутствует — добавить ссылку на предпочтительный адрес страницы.",
        "Если canonical указывает на 404 или страницу с редиректом — исправить на рабочий URL.",
        "Убедиться, что протокол https:// указан явно.",
      ],
      howToFix: [
        "Добавьте тег в секцию <head> с абсолютным URL без параметров отслеживания.",
      ],
      codeExample: {
        title: "Тег Canonical в HTML",
        language: "html",
        code: `<link rel="canonical" href="https://example.com/catalog/coats" />`,
      },
      toolSlug: "canonical-checker",
      toolTitle: "Проверка Canonical URL",
    },
    "indexability.robots_meta": {
      title: "Директивы индексации (Robots Meta)",
      category: "индексация",
      whatIsChecked: "Директивы meta robots, googlebot и yandex: noindex и none. HTTP-заголовок X-Robots-Tag проверяется отдельным пунктом.",
      impact: "Критическое. Случайный тег noindex полностью исключает страницу из поисковой выдачи, сводя органический трафик к нулю.",
      whatToFix: [
        "Для всех продвигаемых страниц удалите директиву noindex.",
        "Для закрытых технических страниц (корзина, личный кабинет, админка) убедитесь в наличии noindex.",
      ],
      howToFix: [
        "Для индексируемых страниц используйте директиву index, follow с поддержкой больших картинок в сниппетах.",
      ],
      codeExample: {
        title: "Метатег Robots для открытых страниц",
        language: "html",
        code: `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
      },
      toolSlug: "indexability-checker",
      toolTitle: "Проверка индексации",
    },
    "metadata.open_graph": {
      title: "Микроразметка Open Graph",
      category: "метаданные",
      whatIsChecked: "Наличие метатегов og:title, og:description, og:image, og:url для привлекательного сниппета при отправке ссылок в Telegram, WhatsApp, VK и соцсетях.",
      impact: "Среднее. Влияет на социальный трафик, кликабельность ссылок в мессенджерах и виральность контента.",
      whatToFix: [
        "Добавьте обязательные теги og:title, og:description, og:image.",
        "Укажите картинку разрешением от 1200x630 пикселей в высоком качестве.",
      ],
      howToFix: [
        "Разместите полный набор Open Graph тегов в блоке <head>.",
      ],
      codeExample: {
        title: "Полный блок Open Graph разметки",
        language: "html",
        code: `<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:title" content="Заголовок для предпросмотра в мессенджерах" />
<meta property="og:description" content="Краткое привлекательное описание для соцсетей." />
<meta property="og:image" content="https://example.com/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />`,
      },
      toolSlug: "open-graph-preview",
      toolTitle: "Превью Open Graph",
    },
    "structured_data.json_ld": {
      title: "Структурированные данные Schema.org (JSON-LD)",
      category: "структурированные данные",
      whatIsChecked: "Наличие и валидность блоков <script type=\"application/ld+json\">, отсутствие синтаксических ошибок JSON, поддержка схем Organization, Product, Article, FAQPage, BreadcrumbList.",
      impact: "Высокое. Позволяет поисковым системам формировать расширенные сниппеты (звездочки рейтинга, цены, хлебные крошки, блок FAQ) прямо в поиске.",
      whatToFix: [
        "Исправьте ошибки синтаксиса JSON (незакрытые кавычки, лишние запятые).",
        "Добавьте разметку BreadcrumbList для хлебных крошек и Product для товаров.",
      ],
      howToFix: [
        "Внедрите структурированные данные по официальной спецификации Schema.org.",
      ],
      codeExample: {
        title: "Микроразметка организации Schema.org",
        language: "html",
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Название компании",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
</script>`,
      },
      toolSlug: "structured-data-validator",
      toolTitle: "Валидатор Schema.org",
    },
    "security.headers": {
      title: "Заголовки безопасности HTTP",
      category: "безопасность",
      whatIsChecked: "Наличие заголовков защиты браузера: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Content-Type-Options: nosniff, X-Frame-Options, Referrer-Policy.",
      impact: "Высокое. Защищает посетителей сайта от XSS-атак, Clickjacking-мошенничества и перехвата незашифрованного HTTP-трафика.",
      whatToFix: [
        "Включите HSTS с длительным сроком (max-age=31536000).",
        "Добавьте защиту от встраивания во фреймы X-Frame-Options: SAMEORIGIN.",
        "Добавьте защиту MIME-типов X-Content-Type-Options: nosniff.",
      ],
      howToFix: [
        "Добавьте директивы add_header в конфигурацию Nginx или соответствующий middleware сервера.",
      ],
      codeExample: {
        title: "Настройка Security Headers в Nginx",
        language: "nginx",
        code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
      },
      toolSlug: "security-headers-checker",
      toolTitle: "Анализатор Security Headers",
    },
    "crawlability.robots_txt": {
      title: "Файл директив Robots.txt",
      category: "сканирование",
      whatIsChecked: "Наличие файла /robots.txt, статус ответа сервера 200 OK, правила User-agent, корректность директив Disallow/Allow, наличие ссылки на sitemap.xml и доступность проверяемого URL для роботов.",
      impact: "Критическое. Неправильно составленный robots.txt может полностью закрыть весь сайт от индексации в поисковых системах (например, Disallow: /).",
      whatToFix: [
        "Если файл отсутствует — создайте текстовый файл robots.txt в корне сайта.",
        "Если целевой URL заблокирован правилом Disallow — добавьте исключение Allow.",
        "Обязательно добавьте директиву Sitemap со ссылкой на актуальную карту сайта.",
      ],
      howToFix: [
        "Отредактируйте robots.txt, разрешив обход важных разделов и закрыв служебные пути.",
      ],
      codeExample: {
        title: "Рекомендуемый файл robots.txt",
        language: "txt",
        code: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart/
Disallow: /api/
Disallow: /*?*sort=

Sitemap: https://example.com/sitemap.xml`,
      },
      toolSlug: "robots-txt-tester",
      toolTitle: "Тестер Robots.txt",
    },
    "crawlability.sitemap_xml": {
      title: "Карта сайта Sitemap.xml",
      category: "сканирование",
      whatIsChecked: "Доступность XML-карты сайта по стандартному адресу /sitemap.xml или по ссылке из robots.txt, валидность структуры XML, количество URL и наличие проверяемой страницы в списке.",
      impact: "Высокое. Sitemap.xml ускоряет обход и индексацию страниц в 2-4 раза, передавая поисковым роботам дату изменения lastmod и приоритет.",
      whatToFix: [
        "Если sitemap отсутствует — сгенерируйте и разместите файл в корне сайта.",
        "Если в файле более 50 000 URL или вес > 50 МБ — разбейте на части через sitemapindex.",
        "Исключите из карты сайта страницы со статусами 404, 301 и закрытые в noindex.",
      ],
      howToFix: [
        "Сформируйте валидный XML по протоколу sitemaps.org и укажите актуальные теги lastmod.",
      ],
      codeExample: {
        title: "Валидный шаблон sitemap.xml",
        language: "xml",
        code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-10-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      },
      toolSlug: "sitemap-validator",
      toolTitle: "Валидатор Sitemap",
    },
    "performance.pagespeed_mobile": {
      title: "Google PageSpeed и Core Web Vitals",
      category: "производительность",
      whatIsChecked: "Оценка производительности мобильного Lighthouse и ключевых сигналов Core Web Vitals: LCP (отрисовка крупного контента), INP (отклик), CLS (сдвиги верстки), FCP (первый рендер), TTFB (ответ сервера).",
      impact: "Фактор ранжирования Google и Яндекс. Медленные сайты теряют позиции в мобильной выдаче и теряют до 50% конверсии из-за долгой загрузки.",
      whatToFix: [
        "Устраните блокирующие рендеринг скрипты и стили.",
        "Сконвертируйте тяжелые изображения в WebP/AVIF.",
        "Задайте фиксированные размеры width и height для картинок, чтобы устранить CLS.",
      ],
      howToFix: [
        "Используйте отложенную загрузку скриптов (defer), сжатие Brotli и предзагрузку hero-изображений.",
      ],
      codeExample: {
        title: "Оптимизация LCP и стилей",
        language: "html",
        code: `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />
<script src="/app.js" defer></script>`,
      },
      toolSlug: "core-web-vitals-checker",
      toolTitle: "Проверка Core Web Vitals",
    },
  },
  en: {
    "http.status": {
      title: "HTTP Response Status Code",
      category: "HTTP",
      whatIsChecked: "The HTTP status code returned by the server when requesting the target URL. Verifies that the server responds with 200 OK without 4xx client errors or 5xx server failures.",
      impact: "Critical. Search crawlers do not index pages returning 4xx or 5xx error codes and rapidly purge them from search index.",
      whatToFix: [
        "If 5xx: Web server or upstream application backend is crashing.",
        "If 404: The URL has been moved or deleted without a redirect.",
        "If 403: Bot access is being blocked by a WAF or server configuration.",
      ],
      howToFix: [
        "Ensure live pages return HTTP 200 OK.",
        "Set up permanent 301 redirects for relocated URLs.",
        "Return an informative 404 page for discontinued content.",
      ],
      codeExample: {
        title: "Nginx HTTP Status Handling",
        language: "nginx",
        code: `location / {
    try_files $uri $uri/ /index.html;
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}`,
      },
      toolSlug: "http-headers-analyzer",
      toolTitle: "HTTP Headers Analyzer",
    },
    "redirects.chain": {
      title: "Redirect Chain & Hops",
      category: "Redirects",
      whatIsChecked: "The number of redirect hops (301, 302, 307, 308) before reaching the final URL. Verifies that there are no loops and no multi-hop hops.",
      impact: "High. Each redirect adds 150-400 ms of latency, exhausts crawler budget, and may dissipate PageRank.",
      whatToFix: [
        "Replace multi-hop redirects with a single direct redirect.",
        "Upgrade temporary 302 redirects to permanent 301 if permanent.",
      ],
      howToFix: [
        "Route all legacy variations directly to the final canonical URL in one step.",
      ],
      codeExample: {
        title: "Direct 301 Redirect in Nginx",
        language: "nginx",
        code: `server {
    listen 80;
    server_name example.com www.example.com;
    return 301 https://example.com$request_uri;
}`,
      },
      toolSlug: "redirect-chain-checker",
      toolTitle: "Redirect Chain Checker",
    },
    "content_type.html": {
      title: "HTML Content-Type & Charset",
      category: "HTTP",
      whatIsChecked: "The Content-Type response header. It must return text/html with explicit UTF-8 charset.",
      impact: "High. Browsers may download the file rather than render it, and crawlers might skip indexing.",
      whatToFix: [
        "Ensure server returns text/html; charset=utf-8.",
      ],
      howToFix: [
        "Configure default charset and mime-types in your server configuration.",
      ],
      codeExample: {
        title: "Nginx Charset Configuration",
        language: "nginx",
        code: `charset utf-8;
types {
    text/html html htm;
}`,
      },
      toolSlug: "html-validator",
      toolTitle: "HTML Validator",
    },
    "metadata.title": {
      title: "Page Title Tag",
      category: "Metadata",
      whatIsChecked: "Presence of a title and a baseline short-title check for fewer than 10 characters. Keyword relevance and click-through performance are not measured.",
      impact: "A descriptive title helps identify the page. Search engines may use or rewrite it in search results.",
      whatToFix: [
        "Add unique <title> if missing.",
        "Expand title if shorter than 30 characters.",
        "Trim if longer than 70 characters.",
      ],
      howToFix: [
        "Template: [Primary Keyword] — [Key Benefit / Value Prop] | [Brand Name].",
      ],
      codeExample: {
        title: "Optimized Title Tag",
        language: "html",
        code: `<head>
  <title>Women's Winter Coats — Free Shipping over $100 | Brand</title>
</head>`,
      },
      toolSlug: "meta-tags-checker",
      toolTitle: "Meta Tags Checker",
    },
    "metadata.description": {
      title: "Meta Description Tag",
      category: "Metadata",
      whatIsChecked: "Presence of a non-empty meta description in the HTML. Text quality and click-through performance are not measured.",
      impact: "High for search CTR. Search engines frequently use this snippet to display beneath the title in search results.",
      whatToFix: [
        "Add a unique descriptive tag if missing.",
        "Avoid keyword stuffing; write for human users.",
      ],
      howToFix: [
        "Craft 1-2 compelling sentences with pricing, guarantees, and a clear call to action.",
      ],
      codeExample: {
        title: "Compelling Meta Description",
        language: "html",
        code: `<meta name="description" content="Explore our collection of authentic winter coats with genuine down fill. Fast shipping and easy 30-day returns. Shop now for up to 30% off!" />`,
      },
      toolSlug: "meta-tags-checker",
      toolTitle: "Meta Tags Checker",
    },
    "metadata.h1": {
      title: "Primary H1 Heading Structure",
      category: "Content",
      whatIsChecked: "Presence of exactly one <h1> heading element in page content, reflecting the core subject of the document.",
      impact: "High. The H1 heading anchors the topic of the page for search algorithms and helps visitors immediately identify content.",
      whatToFix: [
        "Add one prominent H1 if missing.",
        "Downgrade extra H1 tags to H2 or H3.",
      ],
      howToFix: [
        "Keep one single <h1> per page; organize sub-sections into <h2> and <h3>.",
      ],
      codeExample: {
        title: "Semantic Heading Hierarchy",
        language: "html",
        code: `<main>
  <h1>Women's Winter Down Coats</h1>
  <p>Introductory text...</p>
  <h2>Short Fit Coats</h2>
  <h2>Long Parka Coats</h2>
</main>`,
      },
      toolSlug: "heading-structure-checker",
      toolTitle: "Heading Structure Checker",
    },
    "metadata.canonical": {
      title: "Canonical URL Link",
      category: "Indexability",
      whatIsChecked: "Presence of <link rel=\"canonical\"> with an absolute HTTPS URL matching the final page address.",
      impact: "Critical. Prevents duplicate content penalties caused by query parameters, tracking tags, and pagination.",
      whatToFix: [
        "Add a self-referencing canonical tag to all clean indexable pages.",
        "Ensure the canonical URL returns 200 OK.",
      ],
      howToFix: [
        "Place the canonical link in <head> pointing to the definitive version.",
      ],
      codeExample: {
        title: "Canonical Link Element",
        language: "html",
        code: `<link rel="canonical" href="https://example.com/catalog/coats" />`,
      },
      toolSlug: "canonical-checker",
      toolTitle: "Canonical Checker",
    },
    "indexability.robots_meta": {
      title: "Robots Meta Directives",
      category: "Indexability",
      whatIsChecked: "Directives in meta robots and X-Robots-Tag headers (noindex, nofollow, max-image-preview:large).",
      impact: "Critical. An unintended noindex directive will de-index the page from search engines.",
      whatToFix: [
        "Remove noindex from any page that should receive organic search traffic.",
      ],
      howToFix: [
        "Use index, follow with rich snippet support for all public landing pages.",
      ],
      codeExample: {
        title: "Standard Robots Meta Tag",
        language: "html",
        code: `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />`,
      },
      toolSlug: "indexability-checker",
      toolTitle: "Indexability Checker",
    },
    "metadata.open_graph": {
      title: "Open Graph Social Metadata",
      category: "Metadata",
      whatIsChecked: "Presence of og:title, og:description, og:image, and og:url tags for rich preview cards when sharing links.",
      impact: "Medium. Dramatically improves click-through rate when links are shared in Telegram, WhatsApp, Twitter, and Slack.",
      whatToFix: [
        "Add missing Open Graph tags.",
        "Provide a high-resolution image (1200x630px).",
      ],
      howToFix: [
        "Embed the complete Open Graph tag suite in <head>.",
      ],
      codeExample: {
        title: "Open Graph Suite",
        language: "html",
        code: `<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/page" />
<meta property="og:title" content="Social Share Title" />
<meta property="og:description" content="Engaging social snippet preview description." />
<meta property="og:image" content="https://example.com/og-image.jpg" />`,
      },
      toolSlug: "open-graph-preview",
      toolTitle: "Open Graph Preview",
    },
    "structured_data.json_ld": {
      title: "Schema.org Structured Data (JSON-LD)",
      category: "Structured Data",
      whatIsChecked: "Presence and valid syntax of <script type=\"application/ld+json\"> markup for rich Google search snippets.",
      impact: "High. Enables rich search features like star ratings, product pricing, FAQ accordions, and breadcrumbs in SERPs.",
      whatToFix: [
        "Fix invalid JSON syntax errors (quotes, missing brackets, trailing commas).",
        "Add Organization, BreadcrumbList, and Product schemas.",
      ],
      howToFix: [
        "Embed valid JSON-LD schemas meeting schema.org specifications.",
      ],
      codeExample: {
        title: "Schema.org Organization JSON-LD",
        language: "html",
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png"
}
</script>`,
      },
      toolSlug: "structured-data-validator",
      toolTitle: "Structured Data Validator",
    },
    "security.headers": {
      title: "HTTP Security Headers (HSTS, CSP)",
      category: "Security",
      whatIsChecked: "Presence of essential browser security response headers: Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, CSP.",
      impact: "High. Protects users against clickjacking, MIME sniffing, and man-in-the-middle downgrade attacks.",
      whatToFix: [
        "Enable HSTS with at least 1 year duration.",
        "Add X-Frame-Options: SAMEORIGIN.",
        "Add X-Content-Type-Options: nosniff.",
      ],
      howToFix: [
        "Configure security headers in your web server (Nginx/Apache/Caddy).",
      ],
      codeExample: {
        title: "Nginx Security Headers",
        language: "nginx",
        code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
      },
      toolSlug: "security-headers-checker",
      toolTitle: "Security Headers Checker",
    },
    "crawlability.robots_txt": {
      title: "Robots.txt Directives & Availability",
      category: "Crawlability",
      whatIsChecked: "Availability of /robots.txt at domain root, 200 OK status, Disallow/Allow directives, and Sitemap declarations.",
      impact: "Critical. Misconfigured robots.txt can inadvertently block your entire website from search engine indexing.",
      whatToFix: [
        "Create robots.txt if missing.",
        "Ensure target landing pages are not blocked by Disallow rules.",
        "Include the absolute link to your sitemap.xml.",
      ],
      howToFix: [
        "Publish a compliant robots.txt file allowing public search crawlers.",
      ],
      codeExample: {
        title: "Recommended robots.txt",
        language: "txt",
        code: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart/
Disallow: /api/

Sitemap: https://example.com/sitemap.xml`,
      },
      toolSlug: "robots-txt-tester",
      toolTitle: "Robots.txt Tester",
    },
    "crawlability.sitemap_xml": {
      title: "XML Sitemap Discovery & Coverage",
      category: "Crawlability",
      whatIsChecked: "Availability of sitemap.xml at root or via robots.txt, valid XML format, URL count, and presence of target URLs.",
      impact: "High. Sitemaps accelerate discovery and re-crawling of new and updated pages 2-4x faster.",
      whatToFix: [
        "Publish sitemap.xml at domain root if missing.",
        "Split sitemaps into chunks if containing >50,000 URLs.",
        "Exclude 404, 301, and noindexed URLs from the sitemap.",
      ],
      howToFix: [
        "Generate a valid XML sitemap conforming to sitemaps.org standards.",
      ],
      codeExample: {
        title: "Valid XML Sitemap Template",
        language: "xml",
        code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-10-05</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      },
      toolSlug: "sitemap-validator",
      toolTitle: "Sitemap Validator",
    },
    "performance.pagespeed_mobile": {
      title: "Google PageSpeed & Core Web Vitals",
      category: "Performance",
      whatIsChecked: "Lighthouse mobile performance scores and key Core Web Vitals signals (LCP, INP, CLS, FCP, TTFB).",
      impact: "Ranking factor in Google and Yandex. Slow pages suffer lower mobile rankings and up to 50% drop in user conversion.",
      whatToFix: [
        "Eliminate render-blocking resources.",
        "Convert heavy legacy images to WebP/AVIF.",
        "Set explicit width/height dimensions on images to prevent layout shift.",
      ],
      howToFix: [
        "Defer non-critical scripts, enable Brotli compression, and preload hero assets.",
      ],
      codeExample: {
        title: "Preload Hero Image and Defer Scripts",
        language: "html",
        code: `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high" />
<script src="/app.js" defer></script>`,
      },
      toolSlug: "core-web-vitals-checker",
      toolTitle: "Core Web Vitals Checker",
    },
  },
};

export function getAuditCheckGuide(checkId: string, locale: Locale): AuditCheckGuide | null {
  return AUDIT_CHECK_GUIDES[locale]?.[checkId] ?? AUDIT_CHECK_GUIDES.ru[checkId] ?? null;
}

export function localizeAuditCheck(check: AuditFrontendCheck, locale: Locale): AuditFrontendCheck {
  if (locale === "en") return check;
  return {
    ...check,
    name: RU_AUDIT_CHECK_NAMES[check.id] ?? check.name,
    category: RU_CATEGORIES[check.category.toLowerCase()] ?? check.category,
  };
}

export function getAuditIssueTranslation(issueId: string, locale: Locale): Translation | null {
  return locale === "ru"
    ? RU_AUDIT_ISSUES[issueId] ?? EXTRA_AUDIT_ISSUES[issueId] ?? RU_SITE_AUDIT_ISSUES[issueId] ?? null
    : null;
}

export function localizeAuditIssue(issue: AuditFrontendIssue, locale: Locale): AuditFrontendIssue {
  if (locale === "en") return issue;
  const translated = getAuditIssueTranslation(issue.id, locale);
  return translated
    ? {
        ...issue,
        category: RU_CATEGORIES[issue.category.toLowerCase()] ?? issue.category,
        title: translated.title,
        description: translated.description,
        recommendation: {
          summary: translated.summary,
          steps: translated.steps,
          expectedImpact: translated.expectedImpact,
        },
      }
    : {
        ...issue,
        category: RU_CATEGORIES[issue.category.toLowerCase()] ?? issue.category,
      };
}
