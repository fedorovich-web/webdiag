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
      "ru": "Проверьте публичную страницу: HTTP, редиректы, метаданные, ограничения индексации, JSON-LD, заголовки безопасности, robots.txt и карту сайта.",
      "en": "Audit one public URL for HTTP, redirects, metadata, indexability, JSON-LD, security headers, robots.txt, and sitemap.xml with a clear fix order."
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
      "ru": "Проверьте до 100 публичных HTML-страниц одного сайта: статусы, метаданные, ссылки, robots.txt и карты сайта. Результат ограничен выборкой.",
      "en": "Audit up to 100 public HTML pages on one site: HTTP statuses, metadata, links, robots.txt, and sitemaps, with results limited to the crawl sample."
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
      "ru": "Проверьте title, description, robots, canonical, Open Graph, Twitter/X и наличие JSON-LD в исходном HTML одной страницы.",
      "en": "Check title, description, robots, canonical, Open Graph, Twitter/X, and JSON-LD summary for one page."
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
      "ru": "Посмотрите пример поискового результата по title и meta description страницы: заголовок, описание, адрес и предупреждения.",
      "en": "Preview a search result using the page title and meta description, with warnings about missing or unsuitable metadata."
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
      "ru": "Проверьте карточку ссылки для соцсетей и мессенджеров: Open Graph, Twitter/X Card, заголовок, описание, изображение и URL.",
      "en": "Check page rich previews for social networks and messengers: OG title, description, image, URL, and Twitter/X Card."
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
      "ru": "Проверьте link rel=canonical: наличие, совпадение с конечным URL, домен, noindex и число редиректов одной страницы.",
      "en": "Check a page link rel=canonical: presence, match with the final URL, host, noindex, and redirects."
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
      "ru": "Проверьте ссылки alternate hreflang, x-default, ссылку на текущую версию, повторы кодов и структуру языковых обозначений.",
      "en": "Check alternate hreflang, x-default, self-reference, duplicate language codes, and structural international SEO issues."
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
      "ru": "Проверьте доступность robots.txt, разрешение обхода URL для выбранного user-agent, сработавшее правило и директивы Sitemap.",
      "en": "Check whether robots.txt is available, whether a specific URL is allowed for a user-agent, and which Sitemap directives are declared."
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
      "ru": "Соберите robots.txt из правил User-agent, Allow, Disallow, Sitemap и Crawl-delay локально в браузере без запросов к сайту.",
      "en": "Build robots.txt from explicit rules: User-agent, Allow, Disallow, Sitemap, and Crawl-delay without fetching the site."
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
      "ru": "Проверьте доступность sitemap.xml, структуру XML, тип карты, число адресов и наличие выбранной страницы в файле.",
      "en": "Check sitemap.xml availability, XML validity, sitemap type, URL count, and whether an important page is listed."
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
      "ru": "Создайте sitemap.xml из списка HTTP(S) URL. При необходимости добавьте lastmod, changefreq и priority без отправки адресов на сервер.",
      "en": "Create sitemap.xml from an HTTP(S) URL list with optional lastmod, changefreq, and priority."
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
      "ru": "Проверьте HTTP-статус, конечный URL, Content-Type, заголовки ответа и все переходы цепочки редиректов одного адреса.",
      "en": "Check the HTTP status, final URL, content type, and redirect chain for a single page through the safe WebDiag API."
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
      "ru": "Проверьте HTTP-статусы, конечные URL, число редиректов и отдельные ошибки для списка до 50 публичных адресов.",
      "en": "Check HTTP statuses, final URLs, and per-address errors for up to 50 URLs through the SSRF-protected WebDiag backend."
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
      "ru": "Проверьте найденные в HTML ссылки на HTTP-ошибки 4xx, 5xx и недоступные адреса в пределах лимита проверки.",
      "en": "Find broken HTTP links in one page static HTML: 4xx, 5xx, unreachable URLs, and checked statuses with safe limits."
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
      "ru": "Проверьте изображения из HTML и социальных метатегов на ошибки 4xx, 5xx, недоступность и неверный Content-Type.",
      "en": "Check images from img, srcset, picture source, og:image, and twitter:image for 404, 5xx, unavailability, and wrong content-type."
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
      "ru": "Проверьте alt, изображения внутри ссылок, width/height, адаптивную разметку, отложенную загрузку и социальные изображения.",
      "en": "Check alt text, linked images, dimensions, lazy-loading, responsive markup, and Open Graph and Twitter/X images."
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
      "ru": "Проверьте иерархию H1–H6, число H1, пропуски уровней и пустые заголовки в исходном HTML одной страницы.",
      "en": "Check a page H1–H6 outline: H1 count, skipped levels, empty headings, and semantic structure recommendations."
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
      "ru": "Проверьте внутренние и внешние ссылки, тексты, rel, target, якоря, mailto и tel в исходном HTML страницы.",
      "en": "Inspect links in page HTML: internal and external addresses, nofollow, sponsored, UGC, target, anchors, mailto, and tel."
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
      "ru": "Посчитайте частые слова, пары и тройки слов в тексте страницы, их долю и возможные избыточные повторы.",
      "en": "Analyze visible page text: frequent words, bigrams, trigrams, term density, and possible overuse."
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
      "ru": "Проверьте объём текста, предложения, абзацы, длинные фразы, примерное время чтения и ориентировочную оценку читабельности.",
      "en": "Check text volume, sentences, paragraphs, long phrases, reading time, and a multilingual heuristic readability score."
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
      "ru": "Найдите совпадающие непустые title и description в выборке до 100 HTML-страниц из одного аудита проекта.",
      "en": "Find matching non-empty titles and descriptions in a sample of up to 100 HTML pages from a single project audit."
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
      "ru": "Сравните адреса из карт сайта с внутренними ссылками в выборке до 100 HTML-страниц и получите список страниц для ручной проверки.",
      "en": "Compare sitemap URLs with internal links in a sample of up to 100 HTML pages and get a list of pages for manual review."
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
      "ru": "Проверьте HTTP-статус, robots.txt, meta robots, X-Robots-Tag, canonical и редиректы на возможные ограничения индексации.",
      "en": "Check HTTP status, robots.txt, meta robots, X-Robots-Tag, canonical, and redirects as one indexability audit."
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
      "ru": "Разберите до 200 пар параметров URL локально: повторы, пустые значения и вероятные параметры аналитики, поиска, фильтров и сессии.",
      "en": "Locally inspect query pairs, repeats, empty values, and tracking, pagination, sort, filter, search, and session name patterns without changing the source URL."
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
      "ru": "Проверьте JSON-LD в HTML страницы: синтаксис JSON, объявленные типы Schema.org, число блоков и ошибки разбора.",
      "en": "Check JSON-LD in page HTML: JSON syntax, declared Schema.org types, block counts, and parsing errors."
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
      "ru": "Соберите JSON-LD по шаблонам Organization, LocalBusiness, FAQPage и BreadcrumbList из введённых данных локально в браузере.",
      "en": "Build Organization, LocalBusiness, FAQPage, and BreadcrumbList JSON-LD from your data locally in the browser."
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
      "ru": "Создайте FAQPage JSON-LD по введённым вопросам и ответам страницы локально в браузере без отправки текста на сервер.",
      "en": "Create FAQPage JSON-LD from your page’s questions and answers locally in the browser without uploading the text."
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
      "ru": "Определите CMS, веб-фреймворки, CDN, хостинг и аналитику по исходному HTML, путям ресурсов и HTTP-заголовкам.",
      "en": "Detect CMS, frontend frameworks, CDN, hosting, analytics, and server headers through safe static HTML scan and HTTP headers."
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
      "ru": "Проверьте rel=icon, SVG, /favicon.ico, apple-touch-icon, ссылку на manifest и доступность иконок сайта.",
      "en": "Check rel=icon, SVG favicon, /favicon.ico fallback, apple-touch-icon, manifest, and web app icon availability."
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
      "ru": "Проверьте doctype, html/head/body, lang, title, viewport, повторяющиеся id и несогласованные открывающие и закрывающие теги.",
      "en": "Check basic page HTML structure: doctype, html/head/body, lang, title, viewport, duplicate IDs, and unmatched tags."
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
      "ru": "Проверьте срок действия SSL-сертификата, издателя, SAN и соответствие доменному имени.",
      "en": "Check SSL certificate validity dates, issuer, SAN coverage, and hostname match for a public host."
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
      "ru": "Проверьте согласованную версию TLS, набор шифров, протокол ALPN и основные сведения о сертификате.",
      "en": "Check TLS version, cipher suite, ALPN/HTTP2 signal, and certificate health through a limited handshake."
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
      "ru": "Разберите PEM-цепочку X.509 в браузере: владелец, издатель, сроки, SAN, алгоритмы и отпечатки SHA-256 без отправки сертификатов на сервер.",
      "en": "Inspect a PEM X.509 chain locally: subject, issuer, validity, SANs, algorithms, and SHA-256 fingerprints without uploading certificates."
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
      "ru": "Проверьте HSTS, CSP, nosniff, защиту от встраивания во фрейм, Referrer-Policy и Permissions-Policy в ответе страницы.",
      "en": "Check HSTS, CSP, nosniff, frame protection, Referrer-Policy, and Permissions-Policy for a single page."
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
      "ru": "Разберите CSP из заголовков и HTML: директивы, Report-Only, unsafe-inline, unsafe-eval и слишком широкие источники.",
      "en": "Parse CSP headers, Report-Only, and static meta policies: directives, unsafe-inline, unsafe-eval, wildcard sources, and key restrictions."
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
      "ru": "Проверьте Access-Control-Allow-Origin, разрешение учётных данных, Vary: Origin и сочетание wildcard с credentials.",
      "en": "Check Access-Control-Allow-Origin, credentials, Vary: Origin, and wildcard risks for a given Origin."
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
      "ru": "Разберите метрики заголовка Server-Timing: имена, длительность dur и описания desc в одном HTTP-ответе.",
      "en": "Inspect Server-Timing metrics, names, duration values, and descriptions from a single HTTP response."
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
      "ru": "Проверьте атрибуты Set-Cookie: Secure, HttpOnly, SameSite, Max-Age и Expires в одном ответе сервера.",
      "en": "Check Set-Cookie attributes: Secure, HttpOnly, SameSite, persistent cookies, and baseline issues for one response."
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
      "ru": "Проверьте заголовки ответа: HTTP-статус, редиректы, Server, X-Powered-By, кэширование и тип содержимого.",
      "en": "Check page response headers: status, redirects, Server/X-Powered-By, cache, and content metadata."
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
      "ru": "Проверьте Content-Encoding, Vary: Accept-Encoding и наличие сжатия для текстовых ответов HTML, CSS, JS и JSON.",
      "en": "Check Content-Encoding, Vary: Accept-Encoding, and compressible content type for HTML/CSS/JS/JSON responses."
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
      "ru": "Проверьте согласование HTTP/2 через ALPN и объявление HTTP/3 в Alt-Svc. QUIC-подключение не выполняется.",
      "en": "Check HTTP/2 negotiation through ALPN and HTTP/3 advertisement in Alt-Svc. No QUIC connection is made."
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
      "ru": "Проверьте DNS-записи домена A, AAAA, CNAME, MX, NS и TXT, их значения, TTL и ошибки отдельных запросов.",
      "en": "Check A, AAAA, CNAME, MX, NS, and TXT records for a domain without URL crawling."
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
      "ru": "Сравните ответы Cloudflare, Google Public DNS, Quad9 и OpenDNS для одного типа DNS-записи.",
      "en": "Compare answers from Cloudflare, Google Public DNS, Quad9, and OpenDNS for one DNS record type."
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
      "ru": "Проверьте публикацию DS и DNSKEY домена и алгоритмы ключей. Полная криптографическая проверка цепочки доверия не выполняется.",
      "en": "Check published DS and DNSKEY records and key algorithms. Full cryptographic chain-of-trust validation is not performed."
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
      "ru": "Проверьте SPF в TXT-записях: дубли, механизм all, include, redirect и риск превышения лимита DNS-запросов.",
      "en": "Check SPF TXT, duplicate SPF records, final all policy, include/redirect, and DNS lookup-limit risk."
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
      "ru": "Проверьте DKIM-запись по домену и селектору: наличие TXT, тип ключа и опубликованный открытый ключ.",
      "en": "Check a domain’s DKIM TXT record using its selector: record count, key type, and published public key."
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
      "ru": "Проверьте TXT-запись DMARC: политики p и sp, долю pct, адреса rua/ruf и параметры adkim/aspf.",
      "en": "Check a domain’s DMARC TXT record: p and sp policies, pct, rua/ruf reporting addresses, and alignment tags."
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
      "ru": "Проверьте MX-записи домена, их приоритеты, null MX и наличие записей A/AAAA у каждого почтового сервера.",
      "en": "Check MX records, priorities, null MX, and A/AAAA address coverage for mail hosts."
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
      "ru": "Получите данные реестра домена по RDAP: статусы, даты, DNS-серверы, регистратора и контакт для жалоб.",
      "en": "Retrieve registry RDAP data through IANA bootstrap: statuses, events, nameservers, registrar, and abuse contact without WHOIS scraping."
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
      "ru": "Проверьте сведения реестра о публичном IPv4/IPv6: диапазон, CIDR, идентификатор сети, статусы и контакт для жалоб.",
      "en": "Check registry allocation data for a public IPv4/IPv6 address through IANA RDAP bootstrap: range, CIDR, handle, statuses, and abuse contact."
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
      "ru": "Найдите ссылки на ресурсы по HTTP в исходном HTML страницы HTTPS: скрипты, стили, изображения, фреймы и медиа.",
      "en": "Find HTTP subresource candidates inside HTTPS HTML: scripts, iframes, stylesheets, images, media, and srcset."
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
      "ru": "Проверьте Core Web Vitals, лабораторные измерения, доступные данные пользователей и четыре категории Lighthouse через Google PageSpeed.",
      "en": "Check Core Web Vitals, lab and field data, four Lighthouse categories, and a fix order through the Google PageSpeed API."
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
      "ru": "Проверьте размер HTML и найденных ресурсов, Content-Length, крупные файлы и использование JPEG, PNG, AVIF и WebP.",
      "en": "Check static HTML page weight, discovered resources, Content-Length, heavy assets, and JPEG/PNG vs AVIF/WebP signals."
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
      "ru": "Посмотрите до 40 сетевых запросов Google PageSpeed Lighthouse: тип, начало, длительность и известный размер.",
      "en": "Inspect up to 40 Google PageSpeed Lighthouse network requests: type, start, duration, and known size without exposing a raw trace."
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
      "ru": "Проверьте форматы изображений, известные размеры, width/height, srcset, picture и loading в исходном HTML.",
      "en": "Check AVIF/WebP/JPEG/PNG/SVG formats, image weight, responsive markup, width/height, lazy-loading, and optimization recommendations."
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
      "ru": "Проверьте @font-face, font-display, источники и форматы шрифтов, предзагрузку, размеры и заголовки ответов.",
      "en": "Check static @font-face rules, font-display, font sources and formats, preload correlation, Content-Length, cache headers, and font response status."
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
      "ru": "Проверьте Cache-Control, ETag, Last-Modified, Expires и Vary для кэша браузера и CDN.",
      "en": "Check Cache-Control, ETag, Last-Modified, Expires, Vary, and browser/CDN cache recommendations."
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
      "ru": "Посмотрите результат проверки render-blocking-resources в Google PageSpeed Lighthouse: до 20 ресурсов и оценку возможной экономии времени.",
      "en": "Inspect the Google PageSpeed Lighthouse render-blocking-resources audit: up to 20 resources and estimated time savings."
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
      "ru": "Проверьте синтаксис JSON и отформатируйте корректные данные с отступом в 2 пробела. Обработка выполняется локально в браузере.",
      "en": "Validate JSON syntax and format valid data with two-space indentation. Processing runs locally in your browser."
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
      "ru": "Проверьте JSON по поддерживаемым правилам JSON Schema 2020-12: типы, поля, обязательные значения, массивы, комбинации условий и локальные $ref.",
      "en": "Validate JSON against supported JSON Schema 2020-12 rules for types, properties, required fields, arrays, combinators, and local $ref."
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
      "ru": "Проверяйте JSONPath-запросы по локальному JSON: выбор полей, индексы, подстановки, рекурсивный поиск, объединения, срезы и простые фильтры без eval.",
      "en": "Test JSONPath queries against local JSON with properties, indices, wildcards, recursive descent, unions, slices, and simple filters without eval."
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
      "ru": "Преобразуйте JSON и поддерживаемые конфигурации YAML локально. Якоря, псевдонимы, пользовательские теги, ключи слияния и блочные строки отклоняются.",
      "en": "Convert JSON and supported YAML configurations locally in the browser. Anchors, aliases, custom tags, merge keys, and block scalars are rejected."
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
      "ru": "Преобразуйте TOML и JSON локально: поддерживаются таблицы, массивы таблиц, составные ключи, массивы и встроенные таблицы с ограничениями типов.",
      "en": "Convert supported TOML configurations and JSON locally, including tables, array tables, dotted keys, arrays, and inline tables, with type limits."
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
      "ru": "Проверьте структуру XML и отформатируйте её с отступом 2 или 4 пробела. DTD, ENTITY, XSD и загрузка внешних сущностей не поддерживаются.",
      "en": "Check well-formed XML and format its structure with two- or four-space indentation. DTD, ENTITY, XSD, and external entity resolution are disabled."
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
      "ru": "Проверяйте и преобразуйте CSV и JSON локально: определение разделителя, поля в кавычках и с переносами строк, проверка столбцов, заголовков и значений, похожих на формулы.",
      "en": "Validate and convert CSV/JSON locally with delimiter detection, quoted and multiline fields, inconsistent rows, headers, and formula-like signals."
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
      "ru": "Отформатируйте SQL локально: секции запроса, объединения таблиц, списки, вложенные запросы, строки и комментарии. SQL не отправляется на сервер и не выполняется.",
      "en": "Format SQL locally with readable clauses, joins, lists, nested subqueries, strings, and comments. Queries are neither uploaded nor executed."
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
      "ru": "Отформатируйте запросы, мутации, переменные, директивы и фрагменты GraphQL локально. Проверяются запись и парность скобок без проверки по схеме.",
      "en": "Format GraphQL queries, mutations, variables, directives, and fragments locally. Checks cover lexical structure and balanced delimiters, not schema validity."
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
      "ru": "Проверьте регулярное выражение JavaScript в отдельном Web Worker с ограничением времени и числа совпадений, группами захвата и предупреждениями ReDoS. Выражение не выполняется на сервере.",
      "en": "Test JavaScript regex in a dedicated Web Worker with a hard timeout, match caps, captures, and heuristic ReDoS signals. Patterns never run on the server."
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
      "ru": "Соберите или проверьте cron-выражение Unix из пяти полей, прочитайте пояснение и посмотрите до 10 следующих запусков в UTC прямо в браузере.",
      "en": "Build or validate a five-field Unix cron expression, read field explanations, and preview up to 10 next UTC occurrences in your browser."
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
      "ru": "Разберите JWT/JWS локально: просмотрите заголовок, содержимое, поля exp, nbf, iat, iss и aud и предупреждения безопасности без отправки токена на сервер.",
      "en": "Strictly decode compact JWT/JWS locally, inspect header, payload, exp, nbf, iat, iss, and aud, and review security warnings without uploading the token."
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
      "ru": "Кодируйте и декодируйте текст для URL с помощью encodeURIComponent и decodeURIComponent прямо в браузере.",
      "en": "Encode and decode text for URLs with encodeURIComponent and decodeURIComponent directly in your browser."
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
      "ru": "Кодируйте HTML-значимые символы и декодируйте именованные, десятичные и шестнадцатеричные HTML-сущности локально в браузере.",
      "en": "Encode HTML-significant characters and decode named, decimal, and hexadecimal HTML entities locally in your browser."
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
      "ru": "Кодируйте UTF-8 текст в Base64 и декодируйте Base64 обратно в текст прямо в браузере.",
      "en": "Encode UTF-8 text as Base64 and decode Base64 back to text directly in your browser."
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
      "ru": "Сравните два текста построчно, найдите добавления, удаления и замены и получите результат в формате unified diff локально в браузере.",
      "en": "Compare two texts line by line, find additions, deletions, and replacements, and generate a unified diff locally in your browser."
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
      "ru": "Вычислите SHA-256, SHA-384 или SHA-512 для введённого текста через Web Crypto API прямо в браузере.",
      "en": "Calculate SHA-256, SHA-384, or SHA-512 for entered text with the Web Crypto API directly in your browser."
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
      "ru": "Преобразуйте HEX-цвет в RGB и HSL, проверьте каналы и скопируйте CSS-значения прямо в браузере без загрузки данных на сервер.",
      "en": "Convert a HEX color to RGB and HSL, inspect channels, and copy CSS values directly in the browser without sending data to a server."
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
      "ru": "Рассчитайте контраст двух HEX-цветов и проверьте пороги WCAG для обычного и крупного текста прямо в браузере.",
      "en": "Calculate the contrast ratio of two HEX colors and check WCAG thresholds for normal and large text directly in your browser."
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
      "ru": "Получите детерминированную палитру выборки с HEX, RGB и долей цвета из JPEG, PNG, WebP или AVIF локально в браузере.",
      "en": "Get a deterministic sampled palette with HEX, RGB, and color share from a JPEG, PNG, WebP, or AVIF locally in your browser."
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
      "ru": "Создайте линейный или радиальный CSS-градиент из двух HEX-цветов. Настройте угол и позиции цветовых точек прямо в браузере.",
      "en": "Build linear and radial CSS gradients from two HEX colors, an angle, and stop positions directly in the browser without images or external libraries."
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
      "ru": "Настройте смещение, размытие, расширение, HEX-цвет и прозрачность тени box-shadow. Проверьте предпросмотр и скопируйте CSS.",
      "en": "Tune offset, blur, spread, HEX color, and opacity for box-shadow, preview the result, and copy ready CSS directly in the browser."
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
      "ru": "Настройте border-radius для каждого угла, оцените форму в предпросмотре и скопируйте короткую запись CSS-правила.",
      "en": "Set border-radius for each corner, inspect the shape in a preview, and copy a compact CSS declaration without canvas or external dependencies."
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
      "ru": "Настройте clip-path для inset, circle, ellipse или многоугольника из четырёх точек прямо в браузере и скопируйте CSS-правило.",
      "en": "Configure a clip-path using inset, circle, ellipse, or a four-point polygon in the browser and copy the CSS declaration."
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
      "ru": "Настройте blur, brightness, contrast, grayscale, saturate и hue-rotate, проверьте предпросмотр и скопируйте CSS-правило filter.",
      "en": "Tune blur, brightness, contrast, grayscale, saturate, and hue-rotate, check the preview, and copy the CSS filter declaration."
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
      "ru": "Рассчитайте специфичность CSS-селекторов по ID, классам и типам элементов с ограниченной поддержкой :where(), :is(), :not() и :has().",
      "en": "Calculate CSS selector-list specificity by IDs, classes, and element types, with limited support for :where(), :is(), :not(), and :has()."
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
      "ru": "Переводите значения между px и rem с выбранным базовым размером шрифта прямо в браузере.",
      "en": "Convert values between px and rem using a selected root font size directly in your browser."
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
      "ru": "Задайте базовый размер текста, коэффициент и диапазон шагов. Получите шкалу размеров в px, rem и пользовательские свойства CSS.",
      "en": "Set a base text size, ratio, and step range to generate sizes in px and rem with CSS custom properties."
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
      "ru": "Настройте контейнер CSS Grid: столбцы, строки, промежутки и минимальную ширину столбца minmax. Скопируйте готовый CSS из браузера.",
      "en": "Build a basic CSS Grid container: columns, rows, gap, and minmax column size with copyable CSS output directly in the browser."
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
      "ru": "Настройте flex-direction, justify-content, align-items, gap и перенос строк, затем скопируйте CSS-правила контейнера.",
      "en": "Configure flex-direction, justify-content, align-items, gap, and wrapping, then copy the container CSS."
    }
  },
  {
    "slug": "image-optimizer",
    "category": "media-utilities",
    "local": false,
    "title": {
      "ru": "Сжатие PNG, JPEG, WebP и AVIF",
      "en": "PNG, JPEG, WebP and AVIF Image Compressor"
    },
    "description": {
      "ru": "Сжимайте изображения в AVIF, WebP, JPEG или PNG с выбранным качеством. WebP, JPEG и PNG обрабатываются в браузере. Для AVIF файл отправляется на сервер WebDiag без сохранения.",
      "en": "Compress images as AVIF, WebP, JPEG, or PNG with selected quality. WebP, JPEG, and PNG are processed in the browser. AVIF uploads the file to the WebDiag server without storage."
    }
  },
  {
    "slug": "image-format-converter",
    "category": "media-utilities",
    "local": false,
    "title": {
      "ru": "Конвертер PNG, JPEG, WebP и AVIF",
      "en": "PNG, JPEG, WebP and AVIF Converter"
    },
    "description": {
      "ru": "Конвертируйте одно изображение в AVIF, WebP, JPEG или PNG с обработкой AVIF на сервере без сохранения файла.",
      "en": "Convert one image to AVIF, WebP, JPEG, or PNG with AVIF processed on the server without storing your file."
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
      "ru": "Измените ширину и высоту изображения с сохранением пропорций или задайте точные размеры. Сохраните результат в формате, который поддерживает браузер.",
      "en": "Resize an image while keeping its proportions or set an exact width and height. Save the result in an output format supported by your browser."
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
      "ru": "Обрежьте одно изображение по X, Y, ширине и высоте и скачайте результат в AVIF, WebP, JPEG или PNG.",
      "en": "Crop one image by X, Y, width, and height, then download the result as AVIF, WebP, JPEG, or PNG."
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
      "ru": "Создайте пять PNG-иконок для сайта и веб-приложения из JPEG, PNG, WebP или AVIF в браузере. Скачайте файлы отдельно или ZIP-архивом с разметкой.",
      "en": "Create five PNG icons for a site or web app from a JPEG, PNG, WebP, or AVIF in your browser. Download individual files or a ZIP with markup."
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
      "ru": "Создавайте QR-коды из текста и читайте один QR-код из локального JPEG, PNG, WebP или AVIF без загрузки файла.",
      "en": "Generate QR codes from text and read one QR code from a local JPEG, PNG, WebP, or AVIF without uploading the file."
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
      "ru": "Создайте случайный UUID версии 4 через криптографический генератор браузера. Один новый идентификатор за действие.",
      "en": "Generate a random UUID version 4 with the browser cryptographic generator. One new identifier per action."
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
      "ru": "Удалите из SVG комментарии, метаданные, объявления XML, DOCTYPE и лишние пробелы. Обработка выполняется в браузере без отправки кода на сервер.",
      "en": "Remove SVG comments, metadata, XML declarations, DOCTYPE, and redundant whitespace in your browser without sending the code to a server."
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
      "ru": "Проверьте наличие блоков EXIF, XMP, ICC, IPTC/JFIF и метаданных PNG, WebP или AVIF. Создайте копию изображения перекодированием в браузере.",
      "en": "Detect EXIF, XMP, ICC, IPTC/JFIF, and PNG, WebP, or AVIF metadata blocks. Create a new image copy by re-encoding it in your browser."
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
      "ru": "Соберите srcset и разметку img из готовых адресов и ширины изображений. HTTPS и пути от корня сайта; файлы нужно подготовить заранее.",
      "en": "Build srcset and img markup from existing HTTPS or site-relative image URLs and widths. The tool does not create image files."
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
      "ru": "Сократите соотношение ширины и высоты и рассчитайте недостающий размер по заданной пропорции.",
      "en": "Reduce a width-to-height ratio and calculate a missing dimension from a selected proportion."
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
      "ru": "Преобразуйте JPEG, PNG, WebP или AVIF до 1 МиБ в Data URI и создайте отдельную PNG-заглушку до 24 пикселей. Обработка выполняется в браузере.",
      "en": "Convert a JPEG, PNG, WebP, or AVIF up to 1 MiB to a Data URI and create a separate PNG placeholder up to 24 pixels. Processing runs in your browser."
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
      "ru": "Переведите время Unix в секундах в дату ISO 8601 в UTC или преобразуйте дату обратно в секунды прямо в браузере.",
      "en": "Convert a Unix timestamp in seconds to UTC ISO 8601 and a date back to Unix seconds directly in your browser."
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
      "ru": "Создайте стандартный 26-символьный ULID с временной и криптографически случайной частью прямо в браузере.",
      "en": "Generate a standard 26-character ULID with time and cryptographically random components directly in your browser."
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
      "ru": "Добавьте текстовый водяной знак в браузере. Выберите позицию, прозрачность и размер текста, затем сохраните изображение в поддерживаемом формате.",
      "en": "Add a text watermark in your browser. Choose its position, opacity, and text size, then save the image in a supported output format."
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
      "ru": "Проверьте скрипты исходного HTML: хосты, async, defer, module, повторы, integrity и возможные задержки разбора страницы.",
      "en": "Check a static HTML script inventory: same-host and cross-host candidates, async, defer, module, parser-blocking signals, duplicates, and SRI."
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
      "ru": "Проверьте preconnect, dns-prefetch, preload, prefetch, modulepreload и preinit: повторы, as, crossorigin и число соединений.",
      "en": "Check preconnect, dns-prefetch, preload, prefetch, modulepreload, and preinit: duplicates, as, crossorigin, and excessive-preconnect signals."
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
      "ru": "Проверьте внешние JavaScript-файлы из HTML: статусы, MIME, Content-Length, сжатие, кэширование, редиректы и атрибуты загрузки.",
      "en": "Check external JavaScript files found in HTML: HTTP status, MIME, Content-Length, compression, caching, redirects, and loading attributes."
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
      "ru": "Проверьте внешние и встроенные стили: размер выборки CSS, @import, @font-face, MIME, сжатие, кэширование и повторные подключения.",
      "en": "Check external and inline CSS: limited decoded samples, @import, @font-face, MIME, compression, cache, media, and duplicate stylesheet links."
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
      "ru": "Разберите HTTP(S) URL локально: регистр протокола и хоста, порт, IDNA, сегменты пути, кодирование символов, фрагмент и слеши.",
      "en": "Inspect HTTP/HTTPS URL syntax normalization: scheme and host casing, default ports, IDNA, dot segments, percent encoding, fragments, and routing-sensitive slash signals."
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
      "ru": "Проверьте до 25 правил редиректов из CSV или TSV: первый переход, ожидаемый статус, повторы, конфликты, цепочки и циклы.",
      "en": "Validate up to 25 explicit source-to-target rules: first redirect hop, optional status, duplicates, conflicts, self redirects, chains, and cycles through a safe fetcher."
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
      "ru": "Проверьте основные области страницы в исходном HTML: main, navigation, banner, contentinfo, complementary, search, form и region. Проверка не подтверждает соответствие WCAG.",
      "en": "Inspect main, navigation, banner, contentinfo, complementary, search, form, and region landmarks in source HTML. This check does not establish WCAG conformance."
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
      "ru": "Проверьте подписи полей, aria-labelledby, aria-describedby, поля только с подсказкой, fieldset/legend и группировку переключателей и флажков в исходном HTML.",
      "en": "Check labels, aria-labelledby, aria-describedby, placeholder-only controls, fieldset/legend, and radio/checkbox grouping in source HTML."
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
      "ru": "Проверьте имена ссылок, кнопок и элементов с role=link или role=button: текст, alt, ARIA, неясные названия и вложенные интерактивные элементы.",
      "en": "Check accessible names for links, buttons, and role=link/button: text, alt, ARIA, generic names, and nested interactive elements."
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
      "ru": "Создайте Organization, Corporation, NGO или LocalBusiness JSON-LD из данных организации: URL, логотипа, адреса, sameAs и контактов.",
      "en": "Create Organization, Corporation, NGO, or LocalBusiness JSON-LD from verified URL, logo, address, sameAs, and ContactPoint data without AI or placeholder values."
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
      "ru": "Соберите BreadcrumbList JSON-LD из 2–20 пунктов навигации с HTTP(S) URL. Адрес можно пропустить только у последнего пункта.",
      "en": "Build ordered BreadcrumbList JSON-LD from 2–20 items, validate HTTP(S) URLs, and optionally omit item only for the final current-page crumb."
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
      "ru": "Создайте Product и при необходимости Offer JSON-LD: название, изображения, SKU, бренд, GTIN, цена, валюта и наличие из введённых данных.",
      "en": "Create Product and optional Offer JSON-LD from your data: name, images, SKU, brand, GTIN, price, currency, availability, and condition."
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
