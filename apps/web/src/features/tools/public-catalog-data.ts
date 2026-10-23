import type { Locale } from "@webdiag/tool-registry";
import type { CatalogTool } from "./catalog-utils";
import { ACTIVE_AI_CATALOG_TOOLS, getAICatalogTools } from "./ai-tools-data";

interface PublicToolItem {
  readonly slug: string;
  readonly category: string;
  readonly local: boolean;
  readonly title: { readonly ru: string; readonly en: string };
  readonly description: { readonly ru: string; readonly en: string };
}

const PUBLIC_TOOL_CATEGORIES: Readonly<Record<string, { readonly ru: string; readonly en: string }>> = {
  "seo-audit": { ru: "SEO и аудит", en: "SEO and auditing" },
  "security-network": { ru: "Безопасность и сеть", en: "Security and networking" },
  "performance": { ru: "Производительность", en: "Performance" },
  "development-data": { ru: "Текст и данные", en: "Text and data" },
  "css-design": { ru: "Интерфейсы и CSS", en: "Interfaces and CSS" },
  "media-utilities": { ru: "Изображения", en: "Images" },
  "ai-tools": { ru: "AI-инструменты", en: "AI tools" },
};

const PUBLIC_TOOLS_DEFINITIONS: readonly PublicToolItem[] = [
  {
    "slug": "single-page-audit",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Технический аудит страницы",
      "en": "Single Page Technical Audit"
    },
    "description": {
      "ru": "Выполняет ограниченный технический аудит одного публичного URL: HTTP, редиректы, HTML, метаданные, indexability, Open Graph, JSON-LD, security headers, robots.txt и sitemap.xml.",
      "en": "Runs a bounded technical audit of one public URL: HTTP, redirects, HTML, metadata, indexability, Open Graph, JSON-LD, security headers, robots.txt, and sitemap.xml."
    }
  },
  {
    "slug": "whole-site-audit",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Ограниченный аудит сайта",
      "en": "Bounded Site Audit"
    },
    "description": {
      "ru": "Запускает из авторизованного проекта ограниченный обход одного origin: до 100 публичных HTML-страниц с учётом robots.txt, без JavaScript и без заявления о полном покрытии сайта.",
      "en": "Runs an authenticated, project-bound crawl of one origin: up to 100 public HTML pages with robots.txt handling, no JavaScript execution, and no claim of complete site coverage."
    }
  },
  {
    "slug": "meta-tags-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка мета-тегов",
      "en": "Meta Tags Checker"
    },
    "description": {
      "ru": "Проверяет метаданные страницы как единый SEO-сигнал: title, description, robots, canonical, H1-сводку, Open Graph, Twitter/X и JSON-LD coverage.",
      "en": "Checks page metadata as one SEO signal: title, description, robots, canonical, H1 summary, Open Graph, Twitter/X, and JSON-LD coverage."
    }
  },
  {
    "slug": "serp-preview",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Предпросмотр поискового сниппета",
      "en": "SERP Snippet Preview"
    },
    "description": {
      "ru": "Строит предпросмотр поискового сниппета по реальному HTML: display URL, title, description, источники fallback и предупреждения по качеству snippet.",
      "en": "Builds a search snippet preview from real HTML: display URL, title, description, fallback sources, and snippet quality warnings."
    }
  },
  {
    "slug": "open-graph-preview",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Предпросмотр Open Graph и Twitter/X Card",
      "en": "Open Graph and Twitter/X Card Preview"
    },
    "description": {
      "ru": "Проверяет rich preview для соцсетей и мессенджеров: Open Graph, Twitter/X Card, fallback title/description, image URL и недостающие поля.",
      "en": "Checks rich previews for social networks and messengers: Open Graph, Twitter/X Card, fallback title/description, image URL, and missing fields."
    }
  },
  {
    "slug": "canonical-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка canonical",
      "en": "Canonical Checker"
    },
    "description": {
      "ru": "Проверяет canonical для одного URL: наличие link rel=canonical, абсолютный/относительный href, совпадение с финальным URL и noindex-сигналы.",
      "en": "Checks canonical for a single URL: link rel=canonical presence, absolute/relative href, match with the final URL, and noindex signals."
    }
  },
  {
    "slug": "hreflang-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка hreflang",
      "en": "Hreflang Checker"
    },
    "description": {
      "ru": "Проверяет hreflang-разметку страницы: alternate-ссылки, x-default, self-reference, дубли языковых кодов и структурную корректность multilingual SEO.",
      "en": "Checks page hreflang markup: alternate links, x-default, self-reference, duplicate language codes, and structural multilingual SEO consistency."
    }
  },
  {
    "slug": "robots-txt-tester",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка robots.txt",
      "en": "Robots.txt Tester"
    },
    "description": {
      "ru": "Проверяет robots.txt для одного URL: доступность файла, разрешён ли путь для user-agent, matching rule и Sitemap directives.",
      "en": "Checks robots.txt for a single URL: file availability, whether the path is allowed for a user-agent, matching rule, and Sitemap directives."
    }
  },
  {
    "slug": "robots-txt-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор robots.txt",
      "en": "Robots.txt Generator"
    },
    "description": {
      "ru": "Генерирует robots.txt из явных правил: user-agent, Allow/Disallow, Sitemap и Crawl-delay без обращения к сайту и без скрытых допущений.",
      "en": "Generates robots.txt from explicit rules: user-agent, Allow/Disallow, Sitemap, and Crawl-delay without fetching the site or making hidden assumptions."
    }
  },
  {
    "slug": "sitemap-validator",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка sitemap.xml",
      "en": "Sitemap.xml Validator"
    },
    "description": {
      "ru": "Проверяет sitemap.xml или sitemap index: доступность, валидность XML, количество URL и наличие конкретной страницы.",
      "en": "Checks a sitemap.xml or sitemap index: availability, XML validity, URL count, and whether a target page is listed."
    }
  },
  {
    "slug": "sitemap-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор sitemap.xml из списка URL",
      "en": "Sitemap.xml Generator from URL List"
    },
    "description": {
      "ru": "Генерирует sitemap.xml из списка URL с optional lastmod, changefreq и priority, экранирует XML и валидирует HTTP(S) адреса.",
      "en": "Generates sitemap.xml from a URL list with optional lastmod, changefreq, and priority, escaping XML and validating HTTP(S) URLs."
    }
  },
  {
    "slug": "redirect-chain-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка цепочки редиректов",
      "en": "Redirect Chain Checker"
    },
    "description": {
      "ru": "Проверяет HTTP-статус, финальный URL и цепочку редиректов для одной страницы через безопасный WebDiag API.",
      "en": "Checks the HTTP status, final URL, and redirect chain for a single page through the safe WebDiag API."
    }
  },
  {
    "slug": "bulk-http-status-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Массовая проверка HTTP-статусов",
      "en": "Bulk HTTP Status Checker"
    },
    "description": {
      "ru": "Проверяет HTTP-статусы и редиректы для списка до 50 URL через безопасный WebDiag API с отдельным результатом для каждого адреса.",
      "en": "Checks HTTP statuses and redirects for up to 50 URLs through the safe WebDiag API with an isolated result for each address."
    }
  },
  {
    "slug": "broken-link-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Поиск битых ссылок",
      "en": "Broken Link Checker"
    },
    "description": {
      "ru": "Проверяет ссылки одной страницы через bounded static HTML scan: внутренние и внешние HTTP(S) URL, 4xx/5xx, недоступные цели и редиректы без полного краулинга сайта.",
      "en": "Checks links on one page through a bounded static HTML scan: internal and external HTTP(S) URLs, 4xx/5xx, unreachable targets, and redirects without full-site crawling."
    }
  },
  {
    "slug": "broken-image-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Поиск битых изображений",
      "en": "Broken Image Checker"
    },
    "description": {
      "ru": "Проверяет битые изображения одной страницы: img, srcset, picture/source и social images, HTTP-статусы, редиректы и non-image responses.",
      "en": "Checks broken images on one page: img, srcset, picture/source, and social images, HTTP statuses, redirects, and non-image responses."
    }
  },
  {
    "slug": "image-seo-audit",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "SEO-аудит изображений",
      "en": "Image SEO Audit"
    },
    "description": {
      "ru": "Проверяет SEO-сигналы изображений на странице: alt, изображения-ссылки, размеры, lazy-loading, responsive markup и social preview images.",
      "en": "Checks page image SEO signals: alt text, linked images, dimensions, lazy-loading, responsive markup, and social preview images."
    }
  },
  {
    "slug": "heading-structure-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка структуры заголовков",
      "en": "Heading Structure Checker"
    },
    "description": {
      "ru": "Проверяет структуру заголовков H1–H6 в статическом HTML: количество H1, пропуски уровней, пустые заголовки и общий outline страницы без выделения H1 в отдельный слабый инструмент.",
      "en": "Checks the H1–H6 heading structure in static HTML: H1 count, skipped levels, empty headings, and the full page outline without splitting H1 into a weak standalone tool."
    }
  },
  {
    "slug": "link-analyzer",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Анализ внутренних и внешних ссылок",
      "en": "Internal and External Link Analyzer"
    },
    "description": {
      "ru": "Анализирует ссылочную структуру страницы: внутренние, внешние, якорные, mailto/tel ссылки, rel=nofollow/sponsored/ugc и target=_blank без noopener.",
      "en": "Analyzes page link structure: internal, external, same-page, mailto/tel links, rel=nofollow/sponsored/ugc, and target=_blank without noopener."
    }
  },
  {
    "slug": "keyword-density-analyzer",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Анализ частоты слов и фраз",
      "en": "Keyword and Phrase Frequency Analyzer"
    },
    "description": {
      "ru": "Анализирует видимый текст страницы: частотность слов, биграмм и триграмм, плотность терминов и риск переспама как часть нормального content-аудита, а не как SEO-магия.",
      "en": "Analyzes visible page text: word, bigram, and trigram frequency, term density, and overuse risk as a content-audit signal rather than SEO magic."
    }
  },
  {
    "slug": "readability-analyzer",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Анализ читабельности текста",
      "en": "Readability Analyzer"
    },
    "description": {
      "ru": "Оценивает читабельность видимого текста по мультиязычным эвристикам: объём, предложения, абзацы, длинные фразы, время чтения и рекомендации по упрощению.",
      "en": "Evaluates visible-text readability with multilingual heuristics: word count, sentences, paragraphs, long sentences, reading time, and simplification recommendations."
    }
  },
  {
    "slug": "duplicate-meta-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Поиск повторяющихся title и description",
      "en": "Duplicate Title and Description Checker"
    },
    "description": {
      "ru": "Группирует одинаковые непустые title и description в выборке до 100 HTML-страниц одного ограниченного обхода проекта.",
      "en": "Groups identical non-empty titles and descriptions within the sample of up to 100 HTML pages from one bounded project crawl."
    }
  },
  {
    "slug": "orphan-page-finder",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Кандидаты в страницы без внутренних ссылок",
      "en": "Unlinked Page Candidates"
    },
    "description": {
      "ru": "Показывает кандидатов из sitemap, на которые не найдены внутренние ссылки в выборке до 100 HTML-страниц; результат не доказывает, что страница является сиротой на всём сайте.",
      "en": "Shows sitemap candidates with no internal links found in a sample of up to 100 HTML pages; the result does not prove that a page is orphaned across the complete site."
    }
  },
  {
    "slug": "indexability-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка индексируемости страницы",
      "en": "Page Indexability Checker"
    },
    "description": {
      "ru": "Проверяет индексируемость страницы по статическим SEO-сигналам: HTTP status, robots.txt, meta robots, X-Robots-Tag, canonical и redirects.",
      "en": "Checks page indexability using static SEO signals: HTTP status, robots.txt, meta robots, X-Robots-Tag, canonical, and redirects."
    }
  },
  {
    "slug": "query-parameter-analyzer",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Анализ URL-параметров",
      "en": "Query Parameter Analyzer"
    },
    "description": {
      "ru": "Локально разбирает query-пары, повторы, пустые значения, tracking/pagination/sort/filter/search/session name-patterns и кандидат без известных tracking-параметров без изменения исходного URL.",
      "en": "Locally inspects query pairs, repeats, empty values, tracking/pagination/sort/filter/search/session name patterns, and a candidate without known tracking parameters without changing the source URL."
    }
  },
  {
    "slug": "structured-data-validator",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка структурированных данных",
      "en": "Structured Data Validator"
    },
    "description": {
      "ru": "Проверяет JSON-LD структурированные данные на странице: количество блоков, валидность JSON, найденные Schema.org типы, ошибки парсинга и практическую рекомендацию.",
      "en": "Checks JSON-LD structured data on a page: block count, JSON validity, detected Schema.org types, parse errors, and a practical recommendation."
    }
  },
  {
    "slug": "schema-markup-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор Schema.org JSON-LD",
      "en": "Schema.org JSON-LD Generator"
    },
    "description": {
      "ru": "Генерирует поддерживаемые шаблоны Schema.org JSON-LD для Organization, LocalBusiness, FAQPage и BreadcrumbList без AI-фантазирования.",
      "en": "Generates supported Schema.org JSON-LD templates for Organization, LocalBusiness, FAQPage, and BreadcrumbList without AI fabrication."
    }
  },
  {
    "slug": "faq-schema-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор FAQ Schema JSON-LD",
      "en": "FAQ Schema JSON-LD Generator"
    },
    "description": {
      "ru": "Генерирует FAQPage JSON-LD из утверждённых вопросов и ответов без AI-фантазирования, rich-result обещаний и отправки данных на backend.",
      "en": "Generates FAQPage JSON-LD from approved questions and answers without AI fabrication, rich-result promises, or backend submission."
    }
  },
  {
    "slug": "technology-detector",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Определение технологий сайта",
      "en": "Website Technology Detector"
    },
    "description": {
      "ru": "Определяет технологии сайта по безопасному static HTML scan и HTTP-заголовкам: CMS, frontend-фреймворки, CDN, hosting, analytics и server headers.",
      "en": "Detects website technologies through a safe static HTML scan and HTTP headers: CMS, frontend frameworks, CDN, hosting, analytics, and server headers."
    }
  },
  {
    "slug": "favicon-checker",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка favicon и web app icons",
      "en": "Favicon and Web App Icon Checker"
    },
    "description": {
      "ru": "Проверяет favicon и web app icons: rel=icon, SVG/ICO fallback, apple-touch-icon, manifest и доступность объявленных иконок.",
      "en": "Checks favicon and web app icons: rel=icon, SVG/ICO fallback, apple-touch-icon, manifest, and declared icon availability."
    }
  },
  {
    "slug": "html-validator",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка HTML-разметки",
      "en": "HTML Markup Validator"
    },
    "description": {
      "ru": "Проверяет базовую HTML-разметку страницы: doctype, html/head/body, lang, title, viewport, дубли id, неожиданные закрывающие и незакрытые теги.",
      "en": "Checks basic HTML markup structure for a page: doctype, html/head/body, lang, title, viewport, duplicate IDs, unexpected closing tags, and unclosed tags."
    }
  },
  {
    "slug": "ssl-certificate-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка SSL-сертификата",
      "en": "SSL Certificate Checker"
    },
    "description": {
      "ru": "Проверяет SSL-сертификат домена: срок действия, issuer, SAN, соответствие hostname и базовый статус продления.",
      "en": "Checks a domain SSL certificate: validity window, issuer, SAN coverage, hostname match, and renewal status."
    }
  },
  {
    "slug": "tls-configuration-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка конфигурации TLS",
      "en": "TLS Configuration Checker"
    },
    "description": {
      "ru": "Проверяет TLS handshake: версию TLS, cipher suite, ALPN/HTTP2 signal и сертификат без заявления полного SSL Labs аудита.",
      "en": "Checks a TLS handshake: TLS version, cipher suite, ALPN/HTTP2 signal, and certificate status without claiming a full SSL Labs audit."
    }
  },
  {
    "slug": "pem-certificate-viewer",
    "category": "security-network",
    "local": true,
    "title": {
      "ru": "Просмотр PEM-сертификатов и CSR",
      "en": "PEM Certificate and CSR Viewer"
    },
    "description": {
      "ru": "Локально разбирает цепочку PEM X.509-сертификатов, показывает subject, issuer, сроки, SAN, алгоритмы и SHA-256 fingerprint без сетевой проверки.",
      "en": "Locally inspects a PEM X.509 certificate chain, showing subject, issuer, validity, SANs, algorithms, and SHA-256 fingerprints without network verification."
    }
  },
  {
    "slug": "security-headers-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка заголовков безопасности",
      "en": "Security Headers Checker"
    },
    "description": {
      "ru": "Проверяет основные HTTP-заголовки безопасности страницы: HSTS, CSP, nosniff, защиту от фрейминга, Referrer-Policy и Permissions-Policy.",
      "en": "Checks core HTTP security headers for a page: HSTS, CSP, nosniff, frame protection, Referrer-Policy, and Permissions-Policy."
    }
  },
  {
    "slug": "csp-analyzer",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Анализ Content Security Policy",
      "en": "Content Security Policy Analyzer"
    },
    "description": {
      "ru": "Разбирает CSP response header, Report-Only и static meta policy: директивы, unsafe-inline, unsafe-eval, wildcard sources и отсутствие ключевых ограничений без fake security score.",
      "en": "Parses CSP response headers, Report-Only, and static meta policies: directives, unsafe-inline, unsafe-eval, wildcard sources, and missing key restrictions without a fake security score."
    }
  },
  {
    "slug": "cors-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка CORS",
      "en": "CORS Checker"
    },
    "description": {
      "ru": "Проверяет CORS response headers для заданного Origin: ACAO, credentials, Vary: Origin и wildcard risks.",
      "en": "Checks CORS response headers for a given Origin: ACAO, credentials, Vary: Origin, and wildcard risks."
    }
  },
  {
    "slug": "server-timing-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализ Server-Timing",
      "en": "Server-Timing Analyzer"
    },
    "description": {
      "ru": "Разбирает Server-Timing header одного HTTP-ответа: metrics, dur, desc и наличие backend timing signals без synthetic performance claims.",
      "en": "Parses the Server-Timing header for one HTTP response: metrics, dur, desc, and backend timing signals without synthetic performance claims."
    }
  },
  {
    "slug": "cookie-policy-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка политики cookie",
      "en": "Cookie Policy Checker"
    },
    "description": {
      "ru": "Проверяет Set-Cookie headers одного ответа: Secure, HttpOnly, SameSite, persistent cookies и атрибуты без browser session tracking.",
      "en": "Checks Set-Cookie headers for one response: Secure, HttpOnly, SameSite, persistent cookies, and attributes without browser session tracking."
    }
  },
  {
    "slug": "http-headers-analyzer",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Анализ HTTP-заголовков",
      "en": "HTTP Headers Analyzer"
    },
    "description": {
      "ru": "Анализирует полный набор HTTP response headers: status, redirects, Server/X-Powered-By disclosure, cache/content metadata и raw header inventory.",
      "en": "Analyzes the full HTTP response header set: status, redirects, Server/X-Powered-By disclosure, cache/content metadata, and raw header inventory."
    }
  },
  {
    "slug": "http-compression-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка Brotli и Gzip",
      "en": "Brotli and Gzip Compression Checker"
    },
    "description": {
      "ru": "Проверяет HTTP compression policy для ответа: gzip/Brotli/deflate signal, Vary: Accept-Encoding и compressible content type.",
      "en": "Checks HTTP compression policy for a response: gzip/Brotli/deflate signal, Vary: Accept-Encoding, and compressible content type."
    }
  },
  {
    "slug": "http-protocol-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка HTTP/2 и HTTP/3",
      "en": "HTTP/2 and HTTP/3 Checker"
    },
    "description": {
      "ru": "Проверяет HTTP/2 через TLS ALPN и HTTP/3 advertisement через Alt-Svc без fake QUIC negotiation claims.",
      "en": "Checks HTTP/2 through TLS ALPN and HTTP/3 advertisement through Alt-Svc without fake QUIC negotiation claims."
    }
  },
  {
    "slug": "dns-lookup",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка DNS-записей",
      "en": "DNS Lookup"
    },
    "description": {
      "ru": "Проверяет A, AAAA, CNAME, MX, NS и TXT записи домена через bounded DNS lookup без обхода по URL.",
      "en": "Checks A, AAAA, CNAME, MX, NS, and TXT records for a domain through a bounded DNS lookup without URL crawling."
    }
  },
  {
    "slug": "dns-propagation-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Сравнение DNS-резолверов",
      "en": "DNS Resolver Comparison"
    },
    "description": {
      "ru": "Сравнивает один тип DNS-записи через четыре публичных recursive resolver: answer sets, частичные ошибки и backend latency без заявления о глобальном распространении DNS.",
      "en": "Compares one DNS record type across four public recursive resolvers: answer sets, partial errors, and backend latency without claiming global DNS propagation."
    }
  },
  {
    "slug": "dnssec-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка DNSSEC",
      "en": "DNSSEC Checker"
    },
    "description": {
      "ru": "Проверяет публикацию DS и DNSKEY записей домена как DNSSEC publication check без обещания полной validation-chain проверки.",
      "en": "Checks DS and DNSKEY publication for a domain as a DNSSEC publication check without claiming full validation-chain proof."
    }
  },
  {
    "slug": "spf-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка SPF",
      "en": "SPF Checker"
    },
    "description": {
      "ru": "Проверяет SPF TXT-запись домена, множественные SPF, final all policy, include/redirect и риск DNS-lookup лимита.",
      "en": "Checks a domain SPF TXT record, duplicate SPF records, final all policy, include/redirect usage, and DNS lookup-limit risk."
    }
  },
  {
    "slug": "dkim-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка DKIM",
      "en": "DKIM Checker"
    },
    "description": {
      "ru": "Проверяет DKIM TXT запись по домену и selector, извлекает теги k=/p= и оценивает наличие публичного ключа без проверки фактической подписи писем.",
      "en": "Checks a DKIM TXT record by domain and selector, extracts k=/p= tags, and evaluates public-key presence without validating real email signatures."
    }
  },
  {
    "slug": "dmarc-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка DMARC",
      "en": "DMARC Checker"
    },
    "description": {
      "ru": "Проверяет DMARC TXT запись _dmarc, policy p=/sp=, pct, rua/ruf и alignment-теги без обещания inbox deliverability.",
      "en": "Checks the _dmarc TXT record, p=/sp= policy, pct, rua/ruf, and alignment tags without promising inbox deliverability."
    }
  },
  {
    "slug": "mx-record-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка MX-записей",
      "en": "MX Record Checker"
    },
    "description": {
      "ru": "Проверяет MX-записи домена, приоритеты, null MX и наличие A/AAAA адресов у почтовых хостов.",
      "en": "Checks domain MX records, priorities, null MX, and A/AAAA address coverage for mail hosts."
    }
  },
  {
    "slug": "whois-lookup",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "RDAP-проверка домена",
      "en": "Domain RDAP Lookup"
    },
    "description": {
      "ru": "Получает регистрационные данные домена через IANA RDAP bootstrap и registry RDAP: статусы, события, nameservers, registrar и abuse contact без legacy WHOIS scraping и claims о доступности.",
      "en": "Retrieves domain registration data through IANA RDAP bootstrap and registry RDAP: statuses, events, nameservers, registrar, and abuse contact without legacy WHOIS scraping or availability claims."
    }
  },
  {
    "slug": "ip-information",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "RDAP-информация об IP-сети",
      "en": "IP RDAP Network Lookup"
    },
    "description": {
      "ru": "Показывает registry allocation data для публичного IPv4/IPv6 через IANA RDAP bootstrap: диапазон, CIDR, network handle, status и abuse contact без геолокации или reputation claims.",
      "en": "Shows registry allocation data for a public IPv4/IPv6 address through IANA RDAP bootstrap: range, CIDR, network handle, status, and abuse contact without geolocation or reputation claims."
    }
  },
  {
    "slug": "mixed-content-checker",
    "category": "security-network",
    "local": false,
    "title": {
      "ru": "Проверка смешанного контента",
      "en": "Mixed Content Checker"
    },
    "description": {
      "ru": "Ищет HTTP subresource candidates в HTTPS HTML: script, iframe, stylesheet, images, srcset и media без runtime browser DOM.",
      "en": "Finds HTTP subresource candidates in HTTPS HTML: scripts, iframes, stylesheets, images, srcset, and media without runtime browser DOM."
    }
  },
  {
    "slug": "core-web-vitals-checker",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Проверка Core Web Vitals",
      "en": "Core Web Vitals Checker"
    },
    "description": {
      "ru": "Проверяет Core Web Vitals и PageSpeed через backend-интеграцию с Google PageSpeed API: mobile/desktop, lab и field data, оценки четырёх категорий Lighthouse и ограниченный список проверок для исправления.",
      "en": "Checks Core Web Vitals and PageSpeed through a backend Google PageSpeed API integration: mobile/desktop, lab and field data, four Lighthouse category scores, and a bounded fix list."
    }
  },
  {
    "slug": "page-weight-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализ веса страницы",
      "en": "Page Weight Analyzer"
    },
    "description": {
      "ru": "Анализирует статический вес страницы: HTML, найденные ресурсы, известный размер, тяжёлые assets и использование современных форматов изображений.",
      "en": "Analyzes static page weight: HTML, discovered resources, known size, heavy assets, and modern image format usage."
    }
  },
  {
    "slug": "resource-waterfall-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализ загрузки ресурсов",
      "en": "Resource Waterfall Analyzer"
    },
    "description": {
      "ru": "Показывает до 40 строк временной шкалы network-requests из Google PageSpeed Lighthouse: тип, начало, длительность и известный размер. Query и fragment удаляются; response bodies, headers, cookies и trace не сохраняются.",
      "en": "Shows up to 40 network-requests timeline rows from Google PageSpeed Lighthouse: type, start, duration, and known size. Query strings and fragments are removed; response bodies, headers, cookies, and traces are not stored."
    }
  },
  {
    "slug": "image-performance-checker",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Проверка производительности изображений",
      "en": "Image Performance Checker"
    },
    "description": {
      "ru": "Анализирует производительность изображений: форматы AVIF/WebP/JPEG/PNG/SVG, вес, responsive markup, width/height, lazy-loading и рекомендации по оптимизации.",
      "en": "Analyzes image performance: AVIF/WebP/JPEG/PNG/SVG formats, weight, responsive markup, width/height, lazy-loading, and optimization recommendations."
    }
  },
  {
    "slug": "font-performance-checker",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализатор загрузки веб-шрифтов",
      "en": "Font Loading Analyzer"
    },
    "description": {
      "ru": "Разбирает static HTML и bounded CSS: @font-face, font-display, источники и форматы, preload correlation, cache headers и Content-Length без browser runtime и fake performance score.",
      "en": "Parses static HTML and bounded CSS: @font-face, font-display, sources and formats, preload correlation, cache headers, and Content-Length without browser runtime or a fake performance score."
    }
  },
  {
    "slug": "cache-policy-checker",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Проверка HTTP-кэширования",
      "en": "HTTP Cache Policy Checker"
    },
    "description": {
      "ru": "Проверяет HTTP-кэширование URL: Cache-Control, validators, Vary, static asset policy и рекомендации для CDN/browser cache.",
      "en": "Checks HTTP caching for a URL: Cache-Control, validators, Vary, static asset policy, and CDN/browser cache recommendations."
    }
  },
  {
    "slug": "render-blocking-resources-checker",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Поиск блокирующих рендер ресурсов",
      "en": "Render-Blocking Resources Checker"
    },
    "description": {
      "ru": "Показывает до 20 строк точного audit render-blocking-resources из Google PageSpeed Lighthouse. Если provider не вернул этот audit, результат помечается недоступным без эвристической подмены.",
      "en": "Shows up to 20 rows from the exact Google PageSpeed Lighthouse render-blocking-resources audit. If the provider omits the audit, the result is marked unavailable without a heuristic substitute."
    }
  },
  {
    "slug": "json-formatter-validator",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Форматирование и проверка JSON",
      "en": "JSON Formatter and Validator"
    },
    "description": {
      "ru": "Проверяет синтаксис и превращает JSON в аккуратный читаемый вид.",
      "en": "Checks syntax and turns JSON into a clean, readable format."
    }
  },
  {
    "slug": "json-schema-validator",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Проверка JSON Schema",
      "en": "JSON Schema Validator"
    },
    "description": {
      "ru": "Проверяет JSON instance по документированному bounded subset JSON Schema 2020-12: type, properties, required, arrays, числовые и строковые ограничения, combinators и локальные $ref без remote schema fetch.",
      "en": "Validates a JSON instance against a documented bounded JSON Schema 2020-12 subset: types, properties, required fields, arrays, numeric and string constraints, combinators, and local $ref without remote schema fetching."
    }
  },
  {
    "slug": "jsonpath-tester",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "JSONPath Query Lab",
      "en": "JSONPath Query Lab"
    },
    "description": {
      "ru": "Выполняет bounded JSONPath-запросы по локальному JSON: properties, indices, wildcards, recursive descent, unions, slices и простые filters без eval и script expressions.",
      "en": "Runs bounded JSONPath queries against local JSON: properties, indices, wildcards, recursive descent, unions, slices, and simple filters without eval or script expressions."
    }
  },
  {
    "slug": "yaml-json-converter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "YAML ↔ JSON Converter",
      "en": "YAML ↔ JSON Converter"
    },
    "description": {
      "ru": "Преобразует JSON и безопасный configuration subset YAML локально в браузере: mappings, sequences и scalars; anchors, aliases, custom tags, merge keys и block scalars отклоняются.",
      "en": "Converts JSON and a safe YAML configuration subset locally in the browser: mappings, sequences, and scalars; anchors, aliases, custom tags, merge keys, and block scalars are rejected."
    }
  },
  {
    "slug": "toml-json-converter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "TOML ↔ JSON Converter",
      "en": "TOML ↔ JSON Converter"
    },
    "description": {
      "ru": "Преобразует bounded TOML configuration subset и JSON локально в браузере: tables, array tables, dotted keys, arrays и inline tables с явными ограничениями TOML/JSON типов.",
      "en": "Converts a bounded TOML configuration subset and JSON locally in the browser: tables, array tables, dotted keys, arrays, and inline tables with explicit TOML/JSON type limits."
    }
  },
  {
    "slug": "xml-formatter-validator",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "XML Formatter и Validator",
      "en": "XML Formatter and Validator"
    },
    "description": {
      "ru": "Проверяет well-formed XML и форматирует структуру с сохранением mixed content. DTD, ENTITY, XSD и external entity resolution отключены; обработка выполняется локально.",
      "en": "Checks well-formed XML and formats its structure while preserving mixed content. DTD, ENTITY, XSD, and external entity resolution are disabled; processing runs locally."
    }
  },
  {
    "slug": "csv-json-converter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "CSV Data Workbench",
      "en": "CSV Data Workbench"
    },
    "description": {
      "ru": "Проверяет и преобразует CSV/JSON локально: delimiter detection, quoted и multiline fields, inconsistent rows, header diagnostics и spreadsheet-formula signals в одном workflow.",
      "en": "Validates and converts CSV/JSON locally: delimiter detection, quoted and multiline fields, inconsistent rows, header diagnostics, and spreadsheet-formula signals in one workflow."
    }
  },
  {
    "slug": "sql-formatter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "SQL Formatter",
      "en": "SQL Formatter"
    },
    "description": {
      "ru": "Форматирует SQL локально с bounded tokenizer: основные clauses, joins, списки, вложенные subqueries, строки, комментарии и quoted identifiers без выполнения запроса и без ложной проверки конкретной СУБД.",
      "en": "Formats SQL locally with a bounded tokenizer: common clauses, joins, lists, nested subqueries, strings, comments, and quoted identifiers without executing the query or claiming database-specific validation."
    }
  },
  {
    "slug": "graphql-formatter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "GraphQL Formatter",
      "en": "GraphQL Formatter"
    },
    "description": {
      "ru": "Форматирует GraphQL documents локально: operations, variables, arguments, directives, fragments, selection sets, comments и strings с проверкой lexical structure и delimiters без schema validation или выполнения.",
      "en": "Formats GraphQL documents locally: operations, variables, arguments, directives, fragments, selection sets, comments, and strings with lexical and delimiter checks, but no schema validation or execution."
    }
  },
  {
    "slug": "regex-tester",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Safe Regex Lab",
      "en": "Safe Regex Lab"
    },
    "description": {
      "ru": "Тестирует JavaScript regular expressions в отдельном Web Worker с hard timeout, bounded input и match caps, показывает captures и эвристические ReDoS review signals без eval и без выполнения на сервере.",
      "en": "Tests JavaScript regular expressions in a dedicated Web Worker with a hard timeout, bounded input, and match caps, showing captures and heuristic ReDoS review signals without eval or server-side execution."
    }
  },
  {
    "slug": "cron-expression-workbench",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Cron Expression Workbench",
      "en": "Cron Expression Workbench"
    },
    "description": {
      "ru": "Собирает, разбирает и объясняет 5-польные Unix cron-выражения локально, проверяет ranges, lists и steps и показывает до 10 следующих запусков в UTC через bounded Web Worker без выполнения scheduler.",
      "en": "Builds, parses, and explains five-field Unix cron expressions locally, validates ranges, lists, and steps, and previews up to 10 next UTC occurrences in a bounded Web Worker without running a scheduler."
    }
  },
  {
    "slug": "jwt-inspection-lab",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "JWT Inspection Lab",
      "en": "JWT Inspection Lab"
    },
    "description": {
      "ru": "Строго декодирует compact JWT/JWS локально, показывает header, payload и claims exp, nbf, iat, iss и aud, отмечает alg=none и временные риски без проверки подписи, сети, логирования или сохранения токена.",
      "en": "Strictly decodes compact JWT/JWS locally, displays the header, payload, and exp, nbf, iat, iss, and aud claims, and flags alg=none and timing risks without signature verification, network access, logging, or token storage."
    }
  },
  {
    "slug": "url-encoder-decoder",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Кодирование и декодирование URL",
      "en": "URL Encoder and Decoder"
    },
    "description": {
      "ru": "Кодирует текст для URL и восстанавливает исходное значение.",
      "en": "Encodes text for URLs and restores the original value."
    }
  },
  {
    "slug": "html-entities-converter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "HTML Entities Encoder / Decoder",
      "en": "HTML Entities Encoder and Decoder"
    },
    "description": {
      "ru": "Кодирует HTML-значимые символы и декодирует именованные и числовые HTML-сущности локально с ограничением размера ввода.",
      "en": "Encodes HTML-significant characters and decodes named and numeric HTML entities locally with bounded input."
    }
  },
  {
    "slug": "base64-converter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Кодирование и декодирование Base64",
      "en": "Base64 Encoder and Decoder"
    },
    "description": {
      "ru": "Преобразует UTF-8 текст в Base64 и обратно.",
      "en": "Converts UTF-8 text to Base64 and back."
    }
  },
  {
    "slug": "diff-checker",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Сравнение текста и кода",
      "en": "Text and Code Diff Checker"
    },
    "description": {
      "ru": "Сравнивает два текста построчно локально, показывает добавления, удаления и замены и формирует ограниченный unified diff.",
      "en": "Compares two texts line by line locally, reports additions, deletions, and replacements, and produces a bounded unified diff."
    }
  },
  {
    "slug": "hash-generator",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Генератор SHA-хешей",
      "en": "SHA Hash Generator"
    },
    "description": {
      "ru": "Создаёт SHA-256, SHA-384 или SHA-512 для введённого текста.",
      "en": "Creates a SHA-256, SHA-384, or SHA-512 hash for entered text."
    }
  },
  {
    "slug": "color-converter",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Конвертер цветов",
      "en": "Color Converter"
    },
    "description": {
      "ru": "Преобразует HEX-цвета локально: нормализует short/full HEX, показывает RGB и HSL CSS values, числовые каналы и preview без загрузки данных на backend.",
      "en": "Converts HEX colors locally: normalizes short/full HEX, shows RGB and HSL CSS values, numeric channels, and a preview without uploading data to the backend."
    }
  },
  {
    "slug": "color-contrast-checker",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Проверка контраста цветов",
      "en": "Color Contrast Checker"
    },
    "description": {
      "ru": "Сравнивает два HEX-цвета и показывает, достаточно ли контраста для текста.",
      "en": "Compares two HEX colors and shows whether text contrast is sufficient."
    }
  },
  {
    "slug": "color-palette-extractor",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Извлечение палитры из изображения",
      "en": "Image Color Palette Extractor"
    },
    "description": {
      "ru": "Извлекает детерминированную палитру из уменьшенной выборки одного JPEG, PNG, WebP или AVIF локально в браузере и показывает HEX, RGB и долю выборки.",
      "en": "Extracts a deterministic sampled palette from one JPEG, PNG, WebP, or AVIF locally in the browser and reports HEX, RGB, and sample share."
    }
  },
  {
    "slug": "gradient-generator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Генератор CSS-градиентов",
      "en": "CSS Gradient Generator"
    },
    "description": {
      "ru": "Собирает CSS-градиенты локально: linear/radial mode, угол или форма, две цветовые точки, позиции, live preview и копируемый CSS без скриптов, изображений и remote assets.",
      "en": "Builds CSS gradients locally: linear/radial mode, angle or shape, two color stops, positions, live preview, and copyable CSS without scripts, images, or remote assets."
    }
  },
  {
    "slug": "box-shadow-generator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Генератор box-shadow",
      "en": "Box Shadow Generator"
    },
    "description": {
      "ru": "Генерирует box-shadow из явных числовых параметров: offset, blur, spread, HEX color и opacity, показывает preview и копируемую CSS declaration без сторонних библиотек.",
      "en": "Generates box-shadow from explicit numeric parameters: offset, blur, spread, HEX color, and opacity, with a preview and copyable CSS declaration without third-party libraries."
    }
  },
  {
    "slug": "border-radius-generator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Генератор border-radius",
      "en": "Border Radius Generator"
    },
    "description": {
      "ru": "Генерирует border-radius для четырёх углов, проверяет допустимые px-значения, показывает preview формы и выдаёт короткую CSS declaration без canvas или runtime CSS parsing.",
      "en": "Generates border-radius for four corners, validates px values, shows a shape preview, and emits a compact CSS declaration without canvas or runtime CSS parsing."
    }
  },
  {
    "slug": "clip-path-generator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Генератор clip-path",
      "en": "Clip Path Generator"
    },
    "description": {
      "ru": "Генерирует bounded CSS clip-path локально: inset, circle, ellipse и четырёхточечный polygon с проверкой процентных значений, preview и copyable CSS declaration.",
      "en": "Generates bounded CSS clip-path locally: inset, circle, ellipse, and a four-point polygon with percentage validation, preview, and a copyable CSS declaration."
    }
  },
  {
    "slug": "css-filter-playground",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "CSS Filter Playground",
      "en": "CSS Filter Playground"
    },
    "description": {
      "ru": "Генерирует CSS filter declaration локально: blur, brightness, contrast, grayscale, saturate и hue-rotate с bounded ranges, preview и copyable output.",
      "en": "Generates CSS filter declarations locally: blur, brightness, contrast, grayscale, saturate, and hue-rotate with bounded ranges, preview, and copyable output."
    }
  },
  {
    "slug": "css-specificity-calculator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Калькулятор специфичности CSS",
      "en": "CSS Specificity Calculator"
    },
    "description": {
      "ru": "Считает специфичность CSS selector list локально: ID, class/attribute/pseudo-class и type/pseudo-element buckets, :where() zeroing и bounded :is/:not/:has handling.",
      "en": "Calculates CSS selector-list specificity locally: ID, class/attribute/pseudo-class, and type/pseudo-element buckets, :where() zeroing, and bounded :is/:not/:has handling."
    }
  },
  {
    "slug": "px-rem-converter",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Конвертер px ↔ rem",
      "en": "px ↔ rem Converter"
    },
    "description": {
      "ru": "Быстро переводит значения из пикселей в rem и обратно.",
      "en": "Quickly converts values between pixels and rem."
    }
  },
  {
    "slug": "typography-scale-generator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Генератор типографической шкалы",
      "en": "Typography Scale Generator"
    },
    "description": {
      "ru": "Генерирует типографическую шкалу локально из base px, ratio и диапазона шагов: px/rem значения, CSS custom properties и bounded token output.",
      "en": "Generates a typography scale locally from base px, ratio, and step range: px/rem values, CSS custom properties, and bounded token output."
    }
  },
  {
    "slug": "css-grid-generator",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "CSS Grid Generator",
      "en": "CSS Grid Generator"
    },
    "description": {
      "ru": "Генерирует базовый CSS Grid container локально: repeat/minmax columns, rows, gap и bounded min column size без layout editor или stylesheet parsing.",
      "en": "Generates a basic CSS Grid container locally: repeat/minmax columns, rows, gap, and bounded min column size without a layout editor or stylesheet parsing."
    }
  },
  {
    "slug": "flexbox-playground",
    "category": "css-design",
    "local": true,
    "title": {
      "ru": "Flexbox Playground",
      "en": "Flexbox Playground"
    },
    "description": {
      "ru": "Генерирует Flexbox container declaration локально: direction, justify-content, align-items, gap и wrap с bounded output без child item rules.",
      "en": "Generates Flexbox container declarations locally: direction, justify-content, align-items, gap, and wrap with bounded output and no child item rules."
    }
  },
  {
    "slug": "image-optimizer",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Сжатие PNG, JPEG, WebP и AVIF",
      "en": "PNG, JPEG, WebP and AVIF Image Compressor"
    },
    "description": {
      "ru": "Локально перекодирует одно изображение в браузере: AVIF/WebP/JPEG/PNG output, качество для lossy-форматов, сравнение исходного и итогового веса без загрузки файла на сервер.",
      "en": "Locally re-encodes one image in the browser: AVIF/WebP/JPEG/PNG output, lossy quality control, and source/output byte comparison without uploading the file."
    }
  },
  {
    "slug": "image-format-converter",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Конвертер PNG, JPEG, WebP и AVIF",
      "en": "PNG, JPEG, WebP and AVIF Converter"
    },
    "description": {
      "ru": "Конвертирует одно растровое изображение в PNG, JPEG, WebP или AVIF через browser Canvas, если текущий браузер поддерживает выбранный декодер/энкодер.",
      "en": "Converts one raster image to PNG, JPEG, WebP, or AVIF through browser Canvas when the current browser supports the selected decoder/encoder."
    }
  },
  {
    "slug": "image-resizer",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Изменение размера изображения",
      "en": "Image Resizer"
    },
    "description": {
      "ru": "Меняет ширину и высоту одного изображения локально в браузере, сохраняет пропорции и выводит WebP/AVIF/JPEG/PNG без серверной загрузки.",
      "en": "Resizes one image locally in the browser, preserves aspect ratio, and outputs WebP/AVIF/JPEG/PNG without server upload."
    }
  },
  {
    "slug": "image-cropper",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Обрезка изображения",
      "en": "Image Cropper"
    },
    "description": {
      "ru": "Обрезает одно изображение по прямоугольной области локально в браузере и сохраняет результат в WebP/AVIF/JPEG/PNG при поддержке браузера.",
      "en": "Crops one image by a rectangular area locally in the browser and saves WebP/AVIF/JPEG/PNG output when supported by the browser."
    }
  },
  {
    "slug": "favicon-generator",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Генератор favicon",
      "en": "Favicon Generator"
    },
    "description": {
      "ru": "Создаёт пять PNG favicon и web app icon файлов из центральной квадратной области одного JPEG, PNG, WebP или AVIF локально в браузере.",
      "en": "Creates five PNG favicon and web app icon files from the centered square crop of one JPEG, PNG, WebP, or AVIF locally in the browser."
    }
  },
  {
    "slug": "qr-code-generator",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Генератор QR-кодов",
      "en": "QR Code Generator"
    },
    "description": {
      "ru": "Создаёт QR-код из bounded text и читает один QR-код из локального JPEG, PNG, WebP или AVIF без загрузки файла на сервер.",
      "en": "Generates a QR code from bounded text and reads one QR code from a local JPEG, PNG, WebP, or AVIF without uploading the file."
    }
  },
  {
    "slug": "uuid-generator",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Генератор UUID v4",
      "en": "UUID v4 Generator"
    },
    "description": {
      "ru": "Создаёт новый UUID v4 одним нажатием.",
      "en": "Creates a new UUID v4 in one click."
    }
  },
  {
    "slug": "svg-optimizer",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Оптимизация SVG",
      "en": "SVG Optimizer"
    },
    "description": {
      "ru": "Оптимизирует безопасный SVG локально в браузере: удаляет комментарии, XML/DOCTYPE, metadata и лишние пробелы, блокируя active SVG content.",
      "en": "Optimizes safe SVG locally in the browser: removes comments, XML/DOCTYPE, metadata, and redundant whitespace while blocking active SVG content."
    }
  },
  {
    "slug": "image-metadata-viewer",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Просмотр и удаление метаданных изображения",
      "en": "Image Metadata Viewer and Remover"
    },
    "description": {
      "ru": "Показывает EXIF, XMP, ICC, IPTC/JFIF и PNG/WebP/AVIF metadata signals и удаляет метаданные локальным Canvas re-encode без загрузки файла на сервер.",
      "en": "Shows EXIF, XMP, ICC, IPTC/JFIF, and PNG/WebP/AVIF metadata signals and removes metadata with local Canvas re-encode without server upload."
    }
  },
  {
    "slug": "responsive-image-srcset-generator",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Генератор srcset для адаптивных изображений",
      "en": "Responsive Image Srcset Generator"
    },
    "description": {
      "ru": "Собирает проверенный srcset и экранированный img-фрагмент из 1–20 существующих URL и width descriptors; не создаёт и не загружает файлы.",
      "en": "Builds a validated srcset and escaped img fragment from 1–20 existing URLs and width descriptors; it does not create or upload image files."
    }
  },
  {
    "slug": "image-aspect-ratio-calculator",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Калькулятор пропорций изображения",
      "en": "Image Aspect Ratio Calculator"
    },
    "description": {
      "ru": "Сокращает соотношение сторон и рассчитывает недостающий размер.",
      "en": "Reduces an aspect ratio and calculates the missing dimension."
    }
  },
  {
    "slug": "image-data-uri-converter",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Конвертер изображения в Data URI",
      "en": "Image to Data URI Converter"
    },
    "description": {
      "ru": "Создаёт точный Data URI для одного JPEG, PNG, WebP или AVIF до 1 МиБ и отдельный PNG placeholder до 24 px локально в браузере.",
      "en": "Creates an exact Data URI for one JPEG, PNG, WebP, or AVIF up to 1 MiB and a separate PNG placeholder up to 24 px locally in the browser."
    }
  },
  {
    "slug": "unix-timestamp-converter",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Конвертер Unix timestamp",
      "en": "Unix Timestamp Converter"
    },
    "description": {
      "ru": "Преобразует Unix timestamp в дату ISO 8601 и обратно.",
      "en": "Converts a Unix timestamp to an ISO 8601 date and back."
    }
  },
  {
    "slug": "ulid-generator",
    "category": "development-data",
    "local": true,
    "title": {
      "ru": "Генератор ULID",
      "en": "ULID Generator"
    },
    "description": {
      "ru": "Создаёт новый сортируемый ULID одним нажатием.",
      "en": "Creates a new sortable ULID in one click."
    }
  },
  {
    "slug": "add-watermark-to-image",
    "category": "media-utilities",
    "local": true,
    "title": {
      "ru": "Добавить водяной знак на изображение",
      "en": "Add Watermark to Image"
    },
    "description": {
      "ru": "Добавляет текстовый водяной знак к одному изображению локально в браузере: позиция, прозрачность, размер текста и вывод AVIF/WebP/JPEG/PNG.",
      "en": "Adds a text watermark to one image locally in the browser: position, opacity, text size, and AVIF/WebP/JPEG/PNG output."
    }
  },
  {
    "slug": "third-party-script-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализ сторонних скриптов",
      "en": "Third-party Script Analyzer"
    },
    "description": {
      "ru": "Строит bounded static HTML inventory script src: same-host и cross-host candidates, async/defer/module, parser-blocking signals, дубли, SRI и hostname-pattern groups без исполнения JavaScript.",
      "en": "Builds a bounded static HTML script-src inventory: same-host and cross-host candidates, async/defer/module, parser-blocking signals, duplicates, SRI, and hostname-pattern groups without executing JavaScript."
    }
  },
  {
    "slug": "resource-hints-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализ Resource Hints",
      "en": "Resource Hints Analyzer"
    },
    "description": {
      "ru": "Проверяет static HTML resource hints: preconnect, dns-prefetch, preload, prefetch, modulepreload и preinit, включая дубли, as, crossorigin и excessive preconnect signals без fake performance score.",
      "en": "Checks static HTML resource hints: preconnect, dns-prefetch, preload, prefetch, modulepreload, and preinit, including duplicates, as, crossorigin, and excessive-preconnect signals without a fake performance score."
    }
  },
  {
    "slug": "javascript-bundle-surface-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализатор поверхности JavaScript-бандлов",
      "en": "JavaScript Bundle Surface Analyzer"
    },
    "description": {
      "ru": "Проверяет bounded static JavaScript delivery surface: уникальные script src, status/MIME, declared bytes, compression, cache, redirects и parser-blocking candidates без исполнения кода.",
      "en": "Checks a bounded static JavaScript delivery surface: unique script src values, status/MIME, declared bytes, compression, cache, redirects, and parser-blocking candidates without executing code."
    }
  },
  {
    "slug": "css-delivery-analyzer",
    "category": "performance",
    "local": false,
    "title": {
      "ru": "Анализатор доставки CSS",
      "en": "CSS Delivery Analyzer"
    },
    "description": {
      "ru": "Анализирует external и inline CSS: bounded fetch, decoded sample, @import, @font-face, MIME, compression, cache и duplicate links без unused-CSS и render-blocking claims.",
      "en": "Analyzes external and inline CSS: bounded fetches, decoded samples, @import, @font-face, MIME, compression, cache, and duplicate links without unused-CSS or render-blocking claims."
    }
  },
  {
    "slug": "url-normalization-analyzer",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Анализ нормализации URL",
      "en": "URL Normalization Analyzer"
    },
    "description": {
      "ru": "Локально строит детерминированную синтаксическую форму HTTP/HTTPS URL: регистр scheme/host, default port, IDNA, dot segments и percent-encoding, сохраняя routing-sensitive slash/query semantics.",
      "en": "Locally builds a deterministic HTTP/HTTPS syntax form for scheme/host casing, default ports, IDNA, dot segments, and percent encoding while preserving routing-sensitive slash and query semantics."
    }
  },
  {
    "slug": "redirect-map-validator",
    "category": "seo-audit",
    "local": false,
    "title": {
      "ru": "Проверка карты редиректов",
      "en": "Redirect Map Validator"
    },
    "description": {
      "ru": "Проверяет до 25 явно заданных source→target правил: первый redirect hop, optional status, дубли, конфликты, self redirects, chains и cycles через SafeHttpFetcher без crawler и автопоиска правил.",
      "en": "Validates up to 25 explicit source-to-target rules: first redirect hop, optional status, duplicates, conflicts, self redirects, chains, and cycles through SafeHttpFetcher without crawling or auto-discovering rules."
    }
  },
  {
    "slug": "landmark-structure-analyzer",
    "category": "css-design",
    "local": false,
    "title": {
      "ru": "Анализ структуры landmarks",
      "en": "Landmark Structure Analyzer"
    },
    "description": {
      "ru": "Проверяет bounded static HTML landmarks: main, navigation, banner, contentinfo, complementary, search, form и region, включая имена, дубли и структурные конфликты без fake WCAG claim.",
      "en": "Checks bounded static HTML landmarks: main, navigation, banner, contentinfo, complementary, search, form, and region, including names, duplicates, and structural conflicts without a fake WCAG claim."
    }
  },
  {
    "slug": "form-accessibility-analyzer",
    "category": "css-design",
    "local": false,
    "title": {
      "ru": "Анализ доступности форм",
      "en": "Form Accessibility Analyzer"
    },
    "description": {
      "ru": "Анализирует bounded static HTML forms: labels, aria-labelledby/describedby, placeholder-only controls, fieldset/legend, duplicate IDs и radio/checkbox grouping без исполнения формы.",
      "en": "Analyzes bounded static HTML forms: labels, aria-labelledby/describedby, placeholder-only controls, fieldset/legend, duplicate IDs, and radio/checkbox grouping without executing the form."
    }
  },
  {
    "slug": "interactive-accessible-name-analyzer",
    "category": "css-design",
    "local": false,
    "title": {
      "ru": "Анализ доступных имён ссылок и кнопок",
      "en": "Link and Button Accessible Name Analyzer"
    },
    "description": {
      "ru": "Проверяет static HTML accessible names ссылок, кнопок и role=link/button: text, alt, ARIA, generic names, nested interactive и keyboard-focus signals без browser accessibility tree.",
      "en": "Checks static HTML accessible names for links, buttons, and role=link/button: text, alt, ARIA, generic names, nested interactive elements, and keyboard-focus signals without a browser accessibility tree."
    }
  },
  {
    "slug": "organization-schema-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор Organization Schema JSON-LD",
      "en": "Organization Schema JSON-LD Generator"
    },
    "description": {
      "ru": "Генерирует Organization, Corporation, NGO или LocalBusiness JSON-LD из явно введённых name, URL, logo, address, sameAs и ContactPoint без placeholder-данных, AI и обещаний rich results.",
      "en": "Generates Organization, Corporation, NGO, or LocalBusiness JSON-LD from explicit name, URL, logo, address, sameAs, and ContactPoint data without placeholders, AI, or rich-result promises."
    }
  },
  {
    "slug": "breadcrumb-schema-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор Breadcrumb Schema JSON-LD",
      "en": "Breadcrumb Schema JSON-LD Generator"
    },
    "description": {
      "ru": "Генерирует ordered BreadcrumbList JSON-LD из 2–20 явно заданных пунктов, валидирует HTTP(S) URL и разрешает отсутствие item только у последнего crumb без crawler или canonical-claims.",
      "en": "Generates ordered BreadcrumbList JSON-LD from 2–20 explicit items, validates HTTP(S) URLs, and permits an omitted item only for the final crumb without crawling or canonical claims."
    }
  },
  {
    "slug": "product-schema-generator",
    "category": "seo-audit",
    "local": true,
    "title": {
      "ru": "Генератор Product Schema JSON-LD",
      "en": "Product Schema JSON-LD Generator"
    },
    "description": {
      "ru": "Генерирует Product и optional Offer JSON-LD из проверенных name, image, SKU, brand, GTIN, price, currency, availability и condition без выдуманных ratings, reviews или availability.",
      "en": "Generates Product and optional Offer JSON-LD from verified name, image, SKU, brand, GTIN, price, currency, availability, and condition without invented ratings, reviews, or availability."
    }
  }
];

export const PUBLIC_CATALOG_TOOL_COUNT = PUBLIC_TOOLS_DEFINITIONS.length + ACTIVE_AI_CATALOG_TOOLS.length;

export function getPublicCatalogTools(locale: Locale): CatalogTool[] {
  const isRu = locale === "ru";
  const publicCatalogTools: CatalogTool[] = PUBLIC_TOOLS_DEFINITIONS.map((tool) => ({
    slug: tool.slug,
    title: isRu ? tool.title.ru : tool.title.en,
    description: isRu ? tool.description.ru : tool.description.en,
    category: tool.category,
    categoryTitle: isRu
      ? PUBLIC_TOOL_CATEGORIES[tool.category]?.ru ?? tool.category
      : PUBLIC_TOOL_CATEGORIES[tool.category]?.en ?? tool.category,
    local: tool.local,
  }));
  const aiTools = getAICatalogTools(locale);
  return [...publicCatalogTools, ...aiTools];
}

export function getPublicCatalogCategories(locale: Locale, tools: readonly CatalogTool[]) {
  const isRu = locale === "ru";
  const categoryCounts = new Map<string, number>();
  for (const tool of tools) {
    categoryCounts.set(tool.category, (categoryCounts.get(tool.category) ?? 0) + 1);
  }
  return Object.entries(PUBLIC_TOOL_CATEGORIES)
    .filter(([id]) => (categoryCounts.get(id) ?? 0) > 0)
    .map(([id, title]) => ({
      id,
      count: categoryCounts.get(id) ?? 0,
      title: isRu ? title.ru : title.en,
    }));
}
