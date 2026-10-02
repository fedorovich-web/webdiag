import type { Locale } from "@webdiag/tool-registry";
import type { AuditFrontendCheck, AuditFrontendIssue } from "../home/audit-contract";

export const RU_AUDIT_CHECK_NAMES: Readonly<Record<string, string>> = {
  "http.status": "HTTP-статус", "redirects.chain": "Цепочка редиректов", "content_type.html": "HTML content type",
  "metadata.title": "Title страницы", "metadata.description": "Meta description", "metadata.h1": "Структура H1",
  "metadata.canonical": "Canonical URL", "indexability.robots_meta": "Robots meta", "metadata.open_graph": "Метаданные Open Graph",
  "structured_data.json_ld": "Структурированные данные JSON-LD", "security.headers": "Security headers",
  "crawlability.robots_txt": "Robots.txt", "crawlability.sitemap_xml": "Обнаружение sitemap.xml",
};

const RU_CATEGORIES: Readonly<Record<string, string>> = {
  http: "HTTP", redirects: "редиректы", metadata: "метаданные", indexability: "индексация", crawlability: "сканирование",
  content: "контент", structured_data: "структурированные данные", security: "безопасность", performance: "производительность",
  accessibility: "доступность", media: "медиа", url: "URL",
};

interface Translation { title: string; description: string; summary: string; steps: readonly string[]; expectedImpact: string | null }

export const RU_AUDIT_ISSUES: Readonly<Record<string, Translation>> = {
  "http.status.server_error": { title: "Сервер вернул ошибку", description: "Проверяемый URL вернул HTTP-статус 5xx.", summary: "Исправьте серверную ошибку до оптимизации второстепенных SEO-сигналов.", steps: ["Проверьте application logs для этого URL.", "Проверьте состояние upstream, proxy и deployment."], expectedImpact: "Восстанавливает доступ страницы для пользователей и сканирования." },
  "http.status.client_error": { title: "Страница вернула ошибку клиента", description: "Проверяемый URL вернул HTTP-статус 4xx.", summary: "Восстановите страницу или перенаправьте URL на корректный адрес.", steps: ["Уточните, должен ли URL быть доступен для индексации.", "Верните 200 для активной страницы или 301 на canonical-замену."], expectedImpact: "Устраняет неработающую посадочную страницу и лишние запросы сканеров." },
  "redirects.chain.too_long": { title: "Слишком длинная цепочка редиректов", description: "До финального ответа URL проходит больше двух редиректов.", summary: "Замените промежуточные переходы одним прямым редиректом на canonical URL.", steps: ["Обновите правила так, чтобы исходный URL сразу указывал на финальный."], expectedImpact: "Снижает задержку и расход crawl budget." },
  "content_type.html.not_html": { title: "Ответ не является HTML", description: "Проверяемый URL не вернул HTML content type.", summary: "Для посадочной страницы верните HTML-документ.", steps: ["Проверьте routing и response headers этого URL."], expectedImpact: "Позволяет корректно выполнить проверки метаданных, индексации и контента." },
  "metadata.title.missing": { title: "Отсутствует title", description: "В HTML head страницы нет элемента title.", summary: "Добавьте уникальный title, который описывает тему страницы.", steps: ["Сохраняйте этот сигнал уникальным для каждого важного URL."], expectedImpact: "Улучшает качество поискового сниппета и ясность темы страницы." },
  "metadata.title.too_short": { title: "Title слишком короткий", description: "Title есть, но он слишком короткий, чтобы ясно описать страницу.", summary: "Перепишите title так, чтобы он передавал тему и назначение страницы.", steps: ["Сохраняйте этот сигнал уникальным для каждого важного URL."], expectedImpact: "Улучшает качество поискового сниппета и ясность темы страницы." },
  "metadata.description.missing": { title: "Отсутствует meta description", description: "В HTML head страницы нет meta description.", summary: "Добавьте краткое описание для сниппета страницы.", steps: ["Сохраняйте этот сигнал уникальным для каждого важного URL."], expectedImpact: "Улучшает качество поискового сниппета и ясность темы страницы." },
  "metadata.h1.missing": { title: "Отсутствует H1", description: "На странице нет основного заголовка H1.", summary: "Добавьте один понятный H1, соответствующий назначению страницы.", steps: ["Используйте видимый заголовок, который описывает основную тему страницы."], expectedImpact: "Улучшает структуру контента и ясность темы страницы." },
  "metadata.h1.multiple": { title: "Несколько заголовков H1", description: "На странице больше одного заголовка H1.", summary: "Оставьте один основной H1, а второстепенные заголовки понизьте до H2/H3.", steps: ["Проверьте структуру документа и оставьте один основной заголовок."], expectedImpact: "Улучшает семантическую последовательность для пользователей и сканеров." },
  "metadata.canonical.missing": { title: "Отсутствует canonical URL", description: "Страница не объявляет canonical URL.", summary: "Добавьте canonical link на предпочтительный индексируемый URL.", steps: ["Укажите в rel=canonical стабильный финальный URL этой страницы."], expectedImpact: "Снижает неоднозначность между дублирующимися URL." },
  "metadata.canonical.final_url_mismatch": { title: "Canonical не совпадает с финальным URL", description: "Canonical URL страницы отличается от адреса после редиректов.", summary: "Согласуйте canonical с финальным индексируемым URL.", steps: ["Подтвердите предпочтительный URL страницы.", "Укажите в canonical href тот же стабильный URL, который получают сканеры."], expectedImpact: "Снижает неоднозначность дубликатов и canonical-сигналов." },
  "indexability.robots_meta.noindex": { title: "Страница помечена noindex", description: "Robots meta содержит директиву noindex.", summary: "Удалите noindex, если страница должна появляться в поиске.", steps: ["До изменения директивы подтвердите ожидаемый режим индексации."], expectedImpact: "Позволяет индексировать страницу, если остальные условия сканирования выполнены." },
  "metadata.open_graph.incomplete": { title: "Неполные метаданные Open Graph", description: "Open Graph присутствует, но не содержит всех базовых сигналов для preview.", summary: "Добавьте title, description и image для Open Graph.", steps: ["Согласуйте og:title с темой title страницы.", "Добавьте краткий og:description.", "Укажите стабильный абсолютный URL изображения в og:image."], expectedImpact: "Улучшает preview ссылок в соцсетях и мессенджерах." },
  "structured_data.json_ld.invalid": { title: "Некорректные данные JSON-LD", description: "Один или несколько блоков application/ld+json не разбираются как JSON.", summary: "Исправьте JSON-LD до использования сигналов rich results.", steps: ["Проверьте каждый JSON-LD блок как строгий JSON.", "Согласуйте schema types с видимым содержимым страницы."], expectedImpact: "Не даёт парсерам структурированных данных отбросить schema evidence." },
  "security.headers.missing": { title: "Security headers требуют внимания", description: "В ответе отсутствуют или ослаблены базовые security headers.", summary: "Добавьте совместимые с сайтом базовые response security headers.", steps: ["Добавьте X-Content-Type-Options: nosniff.", "Настройте Content-Security-Policy после проверки нужных scripts и assets.", "Используйте Strict-Transport-Security на production HTTPS hosts.", "Добавьте Referrer-Policy и Permissions-Policy."], expectedImpact: "Снижает устранимые риски безопасности в браузере." },
  "crawlability.robots_txt.disallows_target": { title: "Robots.txt блокирует проверяемый URL", description: "Robots.txt содержит Disallow rule для пути проверяемого URL.", summary: "Разрешите URL в robots.txt, если его должны сканировать и индексировать.", steps: ["Проверьте совпавшее правило Disallow.", "Сузьте или удалите его для индексируемых посадочных страниц."], expectedImpact: "Восстанавливает доступ сканера к странице, которая должна находиться в поиске." },
  "crawlability.sitemap_xml.missing": { title: "Sitemap.xml не обнаружен", description: "На этом origin недоступен стандартный endpoint /sitemap.xml.", summary: "Опубликуйте sitemap.xml или объявите его адрес в robots.txt.", steps: ["По возможности опубликуйте sitemap.xml в корне сайта.", "Либо добавьте директивы Sitemap в robots.txt."], expectedImpact: "Улучшает обнаружение URL поисковыми сканерами." },
  "crawlability.sitemap_xml.invalid": { title: "Некорректный sitemap.xml", description: "Обнаруженный sitemap.xml не разбирается как валидный XML.", summary: "Исправьте XML-синтаксис и пересоберите sitemap.", steps: ["Проверьте sitemap.xml валидатором до публикации."], expectedImpact: "Позволяет сканерам надёжно прочитать список URL." },
  "crawlability.sitemap_xml.empty": { title: "Sitemap.xml не содержит URL", description: "В обнаруженном sitemap.xml нет элементов loc.", summary: "Добавьте в sitemap важные canonical URL.", steps: ["Пересоберите sitemap.xml из актуального списка production routes."], expectedImpact: "Улучшает обнаружение важных страниц поисковыми сканерами." },
};

export function localizeAuditCheck(check: AuditFrontendCheck, locale: Locale): AuditFrontendCheck {
  return locale === "en" ? check : { ...check, name: RU_AUDIT_CHECK_NAMES[check.id] ?? check.name, category: RU_CATEGORIES[check.category] ?? check.category };
}

export function localizeAuditIssue(issue: AuditFrontendIssue, locale: Locale): AuditFrontendIssue {
  if (locale === "en") return issue;
  const translated = RU_AUDIT_ISSUES[issue.id];
  return translated ? { ...issue, category: RU_CATEGORIES[issue.category] ?? issue.category, title: translated.title, description: translated.description, recommendation: translated } : { ...issue, category: RU_CATEGORIES[issue.category] ?? issue.category };
}
