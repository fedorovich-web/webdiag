import type { Locale } from "@webdiag/tool-registry";
import { RU_AUDIT_ISSUES } from "./audit-taxonomy-i18n";
import type { AuditFrontendIssue } from "../home/audit-contract";

const RECOMMENDATION_DICTIONARY_RU: Readonly<Record<string, string>> = {
  "Some image responses could not be confirmed. Check HTTP status and Content-Type.":
    "Часть ответов изображений не удалось подтвердить. Проверьте HTTP-статусы и Content-Type.",
  "The page does not return a successful HTTP response. Fix its status before relying on metadata previews.":
    "Страница не возвращает успешный HTTP-ответ. Исправьте код ответа, прежде чем оценивать предпросмотр метаданных.",
  "Canonical URL is invalid. Use a valid HTTP or HTTPS page URL.":
    "Адрес Canonical некорректен. Укажите корректный HTTP- или HTTPS-адрес страницы.",
  "No HTTP links were available for checking in the static HTML.":
    "В статическом HTML не найдено HTTP-ссылок, доступных для проверки.",
  "No HTTP image URLs were available for checking in the static HTML.":
    "В статическом HTML не найдено HTTP-адресов изображений, доступных для проверки.",
  "Canonical URL is invalid or exceeds the supported length. Use a valid HTTP or HTTPS URL for the preferred page.":
    "Адрес Canonical некорректен или превышает допустимую длину. Укажите корректный HTTP- или HTTPS-адрес предпочтительной страницы.",
  "The page does not return a successful HTTP response. Fix the status code or redirect before using this URL as a canonical landing page.":
    "Страница не возвращает успешный HTTP-ответ. Исправьте код ответа или перенаправление, прежде чем использовать её адрес как канонический.",
  "The page declares noindex. Do not treat it as an indexable canonical target until robots meta directives match the SEO goal.":
    "Страница содержит директиву noindex. Если она должна индексироваться, проверьте директивы robots в HTML и HTTP-заголовках.",
  "Canonical link is missing. Add link rel=canonical to the preferred final URL to reduce duplicate URL ambiguity.":
    "Canonical отсутствует. Добавьте <link rel=\"canonical\"> с предпочтительным конечным адресом страницы.",
  "Canonical is relative. It can be resolved by browsers, but absolute canonical URLs are safer for migrations, syndication, and crawler diagnostics.":
    "Указан относительный Canonical. Используйте полный адрес с протоколом и доменом, чтобы избежать неоднозначности при переносе сайта и проверках.",
  "Canonical points to another host. Confirm that this is intentional cross-domain canonicalization; otherwise align it with the final indexable URL.":
    "Canonical указывает на другой домен. Проверьте, что это сделано намеренно; иначе укажите конечный адрес индексируемой страницы на нужном домене.",
  "Canonical does not match the final URL after redirects. Align canonical, redirects, internal links, and sitemap URLs to the same preferred address.":
    "Canonical не совпадает с конечным адресом после перенаправлений. Согласуйте Canonical, редиректы, внутренние ссылки и sitemap.",
  "Canonical matches the final URL, but the tested URL redirects before reaching it. Link internally to the canonical final URL to reduce crawl waste and tracking ambiguity.":
    "Canonical совпадает с конечным адресом, но проверяемый URL перенаправляет на него. Во внутренних ссылках используйте конечный канонический адрес.",
  "Canonical is present and matches the final URL. Keep it aligned with sitemap entries, internal links, and redirect rules after releases.":
    "Canonical указан и совпадает с конечным адресом. Сохраняйте соответствие с sitemap, внутренними ссылками и правилами перенаправлений.",
  "URL opens directly with a successful HTTP response. Keep it stable for users and search crawlers.":
    "URL открывается напрямую с успешным HTTP-ответом (200 OK). Сохраняйте его стабильным для пользователей и поисковых систем.",
  "The final URL returns a successful response. Review the redirect chain and remove avoidable hops when possible.":
    "Конечный URL возвращает успешный ответ. Проверьте цепочку редиректов и устраните лишние промежуточные перенаправления для ускорения загрузки.",
  "The URL still returns a redirect status after the configured redirect limit. Check canonical redirects and loops.":
    "URL продолжает возвращать статус редиректа после исчерпания лимита переходов. Проверьте правила перенаправлений на наличие зацикливаний.",
  "The URL returns 404. Restore the page, redirect it to a relevant replacement, or remove internal links to it.":
    "URL возвращает 404 (Страница не найдена). Восстановите страницу, настройте 301-редирект на подходящий раздел или удалите внутренние битые ссылки.",
  "The URL returns a client error. Check access rules, routing, canonical URLs, and links that point to this page.":
    "URL возвращает ошибку клиента (4xx). Проверьте права доступа, маршрутизацию, канонические адреса и ссылки, ведущие на эту страницу.",
  "The URL returns a server error. Check application logs, upstream services, cache, and deploy health before promoting traffic.":
    "URL возвращает ошибку сервера (5xx). Проверьте логи приложения, работу веб-сервера, базы данных и кэша перед подачей трафика.",

  "The tested URL does not return a successful response. Fix availability before treating security header coverage as final.":
    "Проверяемый URL не возвращает успешный ответ. Устраните ошибки доступности перед финальной настройкой заголовков безопасности.",
  "The final URL is not HTTPS. Migrate to HTTPS first, then configure HSTS and the remaining browser security headers.":
    "Финальный URL не использует HTTPS. Переведите сайт на безопасный протокол HTTPS, затем настройте HSTS и остальные заголовки безопасности.",
  "Security header posture looks controlled for this response. Continue reviewing CSP directives and cookie flags.":
    "Основные заголовки безопасности настроены корректно. Продолжайте аудит директив CSP и атрибутов cookie-файлов.",
  "Configure missing security headers to reduce clickjacking, MIME sniffing, and cross-site exposure.":
    "Настройте недостающие заголовки безопасности (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) для защиты от кликджекинга и XSS-атак.",
  "Critical security headers are missing or disabled. Prioritize HSTS, anti-clickjacking protection, and content isolation.":
    "Критические заголовки безопасности отсутствуют. В приоритетном порядке настройте HSTS, защиту от кликджекинга и изоляцию контента.",

  "The robots.txt request could not be completed. Check server routing and TLS availability.":
    "Не удалось получить файл robots.txt. Проверьте маршрутизацию веб-сервера, DNS и доступность HTTPS.",
  "No robots.txt was discovered at the origin root. Crawlers assume unconstrained access by default.":
    "Файл robots.txt не найден в корне сайта. Поисковые роботы по умолчанию сканируют все доступные разделы без ограничений.",
  "The audited URL is explicitly allowed for default crawlers by robots.txt.":
    "Проверяемый URL явно разрешён для сканирования поисковыми роботами в robots.txt.",
  "The audited URL is blocked by robots.txt. Search engines may not crawl this page or its linked resources.":
    "Проверяемый URL заблокирован правилом Disallow в robots.txt. Поисковые системы не смогут просканировать эту страницу.",
  "Robots.txt contains valid rules and discovers XML sitemaps for search engines.":
    "Файл robots.txt содержит корректные директивы и указывает на XML-карту сайта для поисковых систем.",
  "Robots.txt is available, but no Sitemap directive was found. Consider adding Sitemap: https://example.com/sitemap.xml.":
    "Файл robots.txt доступен, но не содержит директиву Sitemap. Рекомендуется указать адрес карты сайта в конце файла.",

  "The sitemap request could not be completed. Verify host resolution, SSL configuration, and server status.":
    "Не удалось загрузить sitemap.xml. Проверьте доступность хоста, SSL-сертификат и статус ответа сервера.",
  "The sitemap file could not be parsed as valid XML. Check XML syntax, encoding, and namespaces.":
    "Файл sitemap.xml содержит синтаксические ошибки XML. Проверьте кодировку UTF-8, структуру тегов и пространство имён.",
  "The XML sitemap is empty and contains no URL entries. Populate it with canonical URLs of indexable pages.":
    "XML-карта сайта пуста и не содержит URL-адресов. Добавьте канонические адреса страниц, открытых для индексации.",
  "The sitemap index is valid and references child sitemaps. Ensure all referenced sub-sitemaps are accessible.":
    "Индексный файл карты сайта корректен и ссылается на дочерние sitemap. Убедитесь, что все вложенные файлы доступны.",
  "The XML sitemap is valid and contains active URL entries for search engines.":
    "XML-карта сайта корректна и содержит актуальный список страниц для индексации поисковыми роботами.",

  "The page does not return a successful response. Resolve HTTP status before evaluating canonical signals.":
    "Страница не возвращает успешный ответ (200 OK). Устраните ошибки перед оценкой сигналов канонизации.",
  "Add a rel=\"canonical\" tag to specify the authoritative URL and prevent duplicate content penalties.":
    "Добавьте тег <link rel=\"canonical\">, чтобы указать предпочтительный адрес страницы и избежать дублирования контента.",
  "Canonical link must be an absolute URL including protocol and domain name.":
    "Канонический адрес должен быть абсолютным URL с указанием протокола HTTPS и доменного имени.",
  "Canonical URL does not match the final URL. Verify whether this page is intended to be canonical.":
    "Канонический адрес не совпадает с финальным URL страницы. Проверьте, должна ли эта страница быть канонической.",
  "Canonical points to an external domain. Ensure cross-domain canonicalization is intentional.":
    "Канонический адрес указывает на другой домен. Убедитесь, что междоменная канонизация настроена намеренно.",
  "Canonical tag is correctly configured and matches the canonical page address.":
    "Тег Canonical настроен корректно и полностью совпадает с финальным адресом страницы.",

  "The static HTML indexability signals look suitable for an indexable page.":
    "Сигналы индексируемости в статическом HTML корректны: страница открыта для поисковых систем.",
  "Fix invalid hreflang language tags before relying on international targeting.":
    "Исправьте некорректные языковые коды в тегах hreflang (согласно ISO 639-1 / ISO 3166-1).",
  "Remove duplicate hreflang values; each language-region target should be unique.":
    "Удалите дублирующиеся значения hreflang: каждая языковая и региональная версия должна быть уникальной.",
  "Add a self-referencing hreflang alternate for the current page URL.":
    "Добавьте самоссылающийся тег hreflang, указывающий на текущий URL страницы.",
  "Consider adding x-default for language selectors or global fallback pages.":
    "Рекомендуется добавить hreflang=\"x-default\" для страниц выбора языка или версии по умолчанию.",
  "Hreflang alternates are structurally consistent in the static HTML scan.":
    "Языковые альтернативы hreflang структурно согласованы и настроены корректно.",
  "Detected technologies are based on static HTML assets and response headers.":
    "Обнаруженные технологии определены на основе анализа статических ресурсов HTML и заголовков ответа сервера.",

  "Fix the HTTP response status before interpreting Server-Timing signals.":
    "Устраните ошибки HTTP-статуса перед анализом метрик Server-Timing.",
  "No Server-Timing header was returned for this response.":
    "Заголовок Server-Timing не передан в ответе сервера (диагностические метрики бэкенда скрыты).",
  "Server-Timing is present but no parseable metrics were found.":
    "Заголовок Server-Timing присутствует, но не содержит распознаваемых метрик производительности.",
  "Server-Timing metrics are visible for this bounded single-response check.":
    "Метрики Server-Timing успешно получены и отражают внутреннее время обработки запроса сервером.",
  "Fix the HTTP response status before interpreting cookie policy.":
    "Устраните ошибки ответа сервера перед аудитом безопасности cookie-файлов.",
  "No Set-Cookie headers were returned for this single response.":
    "Сервер не устанавливает cookie-файлы при этом запросе.",
  "Review Set-Cookie attributes: Secure, HttpOnly, and SameSite are expected.":
    "Проверьте атрибуты Set-Cookie: для безопасности обязательны флаги Secure, HttpOnly и политика SameSite.",
  "Set-Cookie attributes look controlled for this single response.":
    "Атрибуты Set-Cookie настроены безопасно: флаги Secure и HttpOnly активны.",
  "Replace active HTTP subresources with HTTPS URLs before deployment.":
    "Замените небезопасные HTTP-скрипты и стили на HTTPS, чтобы устранить блокировку смешанного контента.",
  "Fix the HTTP response status before interpreting mixed-content signals.":
    "Устраните ошибки ответа сервера перед проверкой смешанного контента.",
  "Mixed-content checks are only meaningful for HTTPS pages.":
    "Проверка смешанного контента имеет смысл только для страниц, работающих по протоколу HTTPS.",
  "Replace HTTP image/media resources with HTTPS URLs to avoid mixed content.":
    "Замените HTTP-ссылки на изображения и медиафайлы безопасными адресами HTTPS.",
  "No static HTTP subresource candidates were found in this HTTPS HTML response.":
    "Смешанный контент не обнаружен: все статические ресурсы страницы используют безопасный протокол HTTPS.",
  "Fix the HTTP response status before evaluating compression policy.":
    "Устраните ошибки ответа сервера перед оценкой алгоритмов сжатия данных.",
  "Compression is active; add Vary: Accept-Encoding for shared cache correctness.":
    "Сжатие контента активно. Добавьте заголовок Vary: Accept-Encoding для корректной работы промежуточных прокси и CDN.",
  "Compression is active for this safe request. Prefer Brotli for HTTPS text assets.":
    "Сжатие активно. Для текстовых ресурсов HTTPS рекомендуется использовать современный алгоритм Brotli (br).",
  "This response does not look like a high-value text compression candidate.":
    "Объём или тип ответа не требует обязательного сжатия данных.",
};

export function localizeRecommendation(value: string | null | undefined, locale: Locale): string {
  if (!value || typeof value !== "string") return "";
  if (locale !== "ru") return value;

  const trimmed = value.trim();
  const directMatch = RECOMMENDATION_DICTIONARY_RU[trimmed];
  if (directMatch) return directMatch;

  if (/^URL opens directly with a successful HTTP response/i.test(trimmed)) {
    return "URL открывается напрямую с успешным HTTP-ответом (200 OK). Сохраняйте его стабильным для пользователей и поисковых систем.";
  }
  if (/returns a client error/i.test(trimmed) || /returns 40/i.test(trimmed)) {
    return "URL возвращает ошибку клиента (4xx). Проверьте права доступа, маршрутизацию и ссылки на страницу.";
  }
  if (/returns a server error/i.test(trimmed) || /returns 50/i.test(trimmed)) {
    return "URL возвращает ошибку сервера (5xx). Проверьте логи приложения, конфигурацию веб-сервера и состояние базы данных.";
  }
  if (/redirect chain/i.test(trimmed)) {
    return "Проверьте цепочку редиректов и устраните лишние промежуточные перенаправления для оптимизации скорости.";
  }
  if (/robots\.txt/i.test(trimmed) && /blocked/i.test(trimmed)) {
    return "URL заблокирован правилами robots.txt. Поисковые роботы не смогут проиндексировать страницу.";
  }
  if (/robots\.txt/i.test(trimmed) && /allowed/i.test(trimmed)) {
    return "Страница разрешена для сканирования в файле robots.txt.";
  }
  if (/canonical/i.test(trimmed) && /missing/i.test(trimmed)) {
    return "Добавьте тег <link rel=\"canonical\"> для указания основного канонического адреса страницы.";
  }
  if (/security header/i.test(trimmed) && /missing/i.test(trimmed)) {
    return "Настройте ключевые заголовки безопасности (HSTS, CSP, X-Frame-Options) для защиты пользователей.";
  }
  if (/compression/i.test(trimmed) && /active/i.test(trimmed)) {
    return "Сжатие контента включено и работает эффективно. Рекомендуется поддержка Brotli (br).";
  }
  if (/sitemap/i.test(trimmed) && /valid/i.test(trimmed)) {
    return "Карта сайта sitemap.xml корректна и доступна для поисковых систем.";
  }

  return value;
}

export function localizeSingleAuditIssue(issue: AuditFrontendIssue, locale: Locale): AuditFrontendIssue {
  if (locale !== "ru") return issue;

  const translation = RU_AUDIT_ISSUES[issue.id];
  if (!translation) return issue;

  return {
    ...issue,
    title: translation.title,
    description: translation.description,
    recommendation: {
      summary: translation.summary,
      steps: translation.steps,
      expectedImpact: translation.expectedImpact,
    },
  };
}
