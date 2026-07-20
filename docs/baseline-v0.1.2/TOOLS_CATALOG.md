# WebDiag: реестр 110 инструментов / Registry of 110 tools

Дата фиксации / Baseline date: 2026-07-16.

Статус: **accepted product scope**.

Все 110 инструментов сохраняются как отдельные рабочие сценарии. Полезные инструменты не удаляются ради искусственного ограничения количества.

All 110 tools are retained as separate working scenarios. Useful tools must not be removed merely to preserve an arbitrary count.

Russian routes: `/tools/...`. English routes: `/en/tools/...`.


## SEO и аудит / SEO and Auditing

WD-001. **Технический аудит страницы / Single Page Technical Audit** — `/tools/single-page-audit` · `/en/tools/single-page-audit` · `composite` · `R2` · `W4`
WD-002. **Аудит сайта с обходом страниц / Whole-Site Audit** — `/tools/whole-site-audit` · `/en/tools/whole-site-audit` · `crawler` · `R3` · `W4`
WD-003. **Проверка мета-тегов / Meta Tags Checker** — `/tools/meta-tags-checker` · `/en/tools/meta-tags-checker` · `safe_fetch` · `R1` · `W2`
WD-004. **Предпросмотр поискового сниппета / SERP Snippet Preview** — `/tools/serp-preview` · `/en/tools/serp-preview` · `browser` · `R0` · `W1`
WD-005. **Предпросмотр Open Graph / Open Graph Preview** — `/tools/open-graph-preview` · `/en/tools/open-graph-preview` · `safe_fetch` · `R1` · `W2`
WD-006. **Предпросмотр Twitter/X Card / Twitter/X Card Preview** — `/tools/twitter-card-preview` · `/en/tools/twitter-card-preview` · `safe_fetch` · `R1` · `W2`
WD-007. **Проверка canonical / Canonical Checker** — `/tools/canonical-checker` · `/en/tools/canonical-checker` · `safe_fetch` · `R1` · `W2`
WD-008. **Проверка hreflang / Hreflang Checker** — `/tools/hreflang-checker` · `/en/tools/hreflang-checker` · `safe_fetch` · `R2` · `W3`
WD-009. **Проверка robots.txt / Robots.txt Tester** — `/tools/robots-txt-tester` · `/en/tools/robots-txt-tester` · `safe_fetch` · `R1` · `W2`
WD-010. **Генератор robots.txt / Robots.txt Generator** — `/tools/robots-txt-generator` · `/en/tools/robots-txt-generator` · `browser` · `R0` · `W1`
WD-011. **Проверка sitemap.xml / Sitemap.xml Validator** — `/tools/sitemap-validator` · `/en/tools/sitemap-validator` · `safe_fetch` · `R2` · `W3`
WD-012. **Генератор sitemap.xml из списка URL / Sitemap.xml Generator from URL List** — `/tools/sitemap-generator` · `/en/tools/sitemap-generator` · `browser` · `R0` · `W1`
WD-013. **Проверка цепочки редиректов / Redirect Chain Checker** — `/tools/redirect-chain-checker` · `/en/tools/redirect-chain-checker` · `safe_fetch` · `R2` · `W3`
WD-014. **Массовая проверка HTTP-статусов / Bulk HTTP Status Checker** — `/tools/bulk-http-status-checker` · `/en/tools/bulk-http-status-checker` · `safe_fetch` · `R2` · `W3`
WD-015. **Поиск битых ссылок / Broken Link Checker** — `/tools/broken-link-checker` · `/en/tools/broken-link-checker` · `crawler` · `R3` · `W4`
WD-016. **Поиск битых изображений / Broken Image Checker** — `/tools/broken-image-checker` · `/en/tools/broken-image-checker` · `crawler` · `R3` · `W4`
WD-017. **SEO-аудит изображений / Image SEO Audit** — `/tools/image-seo-audit` · `/en/tools/image-seo-audit` · `safe_fetch` · `R2` · `W3`
WD-018. **Проверка структуры заголовков / Heading Structure Checker** — `/tools/heading-structure-checker` · `/en/tools/heading-structure-checker` · `safe_fetch` · `R1` · `W2`
WD-019. **Анализ внутренних и внешних ссылок / Internal and External Link Analyzer** — `/tools/link-analyzer` · `/en/tools/link-analyzer` · `safe_fetch` · `R1` · `W2`
WD-020. **Анализ частоты слов и фраз / Keyword and Phrase Frequency Analyzer** — `/tools/keyword-density-analyzer` · `/en/tools/keyword-density-analyzer` · `composite` · `R1` · `W2`
WD-021. **Анализ читабельности текста / Readability Analyzer** — `/tools/readability-analyzer` · `/en/tools/readability-analyzer` · `browser` · `R0` · `W1`
WD-022. **Поиск повторяющихся title и description / Duplicate Title and Description Checker** — `/tools/duplicate-meta-checker` · `/en/tools/duplicate-meta-checker` · `crawler` · `R3` · `W4`
WD-023. **Поиск страниц-сирот / Orphan Page Finder** — `/tools/orphan-page-finder` · `/en/tools/orphan-page-finder` · `crawler` · `R3` · `W4`
WD-024. **Проверка индексируемости страницы / Page Indexability Checker** — `/tools/indexability-checker` · `/en/tools/indexability-checker` · `safe_fetch` · `R1` · `W2`
WD-025. **Проверка пагинации и URL-параметров / Pagination and URL Parameter SEO Checker** — `/tools/pagination-seo-checker` · `/en/tools/pagination-seo-checker` · `safe_fetch` · `R2` · `W3`
WD-026. **Проверка структурированных данных / Structured Data Validator** — `/tools/structured-data-validator` · `/en/tools/structured-data-validator` · `composite` · `R1` · `W2`
WD-027. **Генератор Schema.org JSON-LD / Schema.org JSON-LD Generator** — `/tools/schema-markup-generator` · `/en/tools/schema-markup-generator` · `browser` · `R0` · `W1`
WD-028. **Определение технологий сайта / Website Technology Detector** — `/tools/technology-detector` · `/en/tools/technology-detector` · `composite` · `R2` · `W3`
WD-029. **Проверка favicon и web app icons / Favicon and Web App Icon Checker** — `/tools/favicon-checker` · `/en/tools/favicon-checker` · `safe_fetch` · `R1` · `W2`
WD-030. **Проверка HTML-разметки / HTML Markup Validator** — `/tools/html-validator` · `/en/tools/html-validator` · `composite` · `R1` · `W2`

## Безопасность и сеть / Security and Networking

WD-031. **Проверка SSL-сертификата / SSL Certificate Checker** — `/tools/ssl-certificate-checker` · `/en/tools/ssl-certificate-checker` · `dns_tls` · `R1` · `W2`
WD-032. **Проверка конфигурации TLS / TLS Configuration Checker** — `/tools/tls-configuration-checker` · `/en/tools/tls-configuration-checker` · `dns_tls` · `R2` · `W3`
WD-033. **Просмотр PEM-сертификатов и CSR / PEM Certificate and CSR Viewer** — `/tools/pem-certificate-viewer` · `/en/tools/pem-certificate-viewer` · `browser` · `R0` · `W1`
WD-034. **Проверка заголовков безопасности / Security Headers Checker** — `/tools/security-headers-checker` · `/en/tools/security-headers-checker` · `safe_fetch` · `R1` · `W2`
WD-035. **Анализ Content Security Policy / Content Security Policy Analyzer** — `/tools/csp-analyzer` · `/en/tools/csp-analyzer` · `composite` · `R1` · `W2`
WD-036. **Проверка CORS / CORS Checker** — `/tools/cors-checker` · `/en/tools/cors-checker` · `safe_fetch` · `R2` · `W3`
WD-037. **Анализ безопасности cookie / Cookie Security Analyzer** — `/tools/cookie-security-analyzer` · `/en/tools/cookie-security-analyzer` · `safe_fetch` · `R1` · `W2`
WD-038. **Анализ HTTP-заголовков / HTTP Headers Analyzer** — `/tools/http-headers-analyzer` · `/en/tools/http-headers-analyzer` · `safe_fetch` · `R1` · `W2`
WD-039. **Проверка Brotli и Gzip / Brotli and Gzip Compression Checker** — `/tools/http-compression-checker` · `/en/tools/http-compression-checker` · `safe_fetch` · `R1` · `W2`
WD-040. **Проверка HTTP/2 и HTTP/3 / HTTP/2 and HTTP/3 Checker** — `/tools/http-protocol-checker` · `/en/tools/http-protocol-checker` · `safe_fetch` · `R1` · `W2`
WD-041. **Проверка DNS-записей / DNS Lookup** — `/tools/dns-lookup` · `/en/tools/dns-lookup` · `dns_tls` · `R1` · `W2`
WD-042. **Проверка распространения DNS / DNS Propagation Checker** — `/tools/dns-propagation-checker` · `/en/tools/dns-propagation-checker` · `dns_tls` · `R2` · `W3`
WD-043. **Проверка DNSSEC / DNSSEC Checker** — `/tools/dnssec-checker` · `/en/tools/dnssec-checker` · `dns_tls` · `R2` · `W3`
WD-044. **Проверка SPF / SPF Checker** — `/tools/spf-checker` · `/en/tools/spf-checker` · `dns_tls` · `R1` · `W2`
WD-045. **Проверка DKIM / DKIM Checker** — `/tools/dkim-checker` · `/en/tools/dkim-checker` · `dns_tls` · `R1` · `W2`
WD-046. **Проверка DMARC / DMARC Checker** — `/tools/dmarc-checker` · `/en/tools/dmarc-checker` · `dns_tls` · `R1` · `W2`
WD-047. **Проверка MX-записей / MX Record Checker** — `/tools/mx-record-checker` · `/en/tools/mx-record-checker` · `dns_tls` · `R1` · `W2`
WD-048. **WHOIS-проверка домена / Domain WHOIS Lookup** — `/tools/whois-lookup` · `/en/tools/whois-lookup` · `dns_tls` · `R2` · `W3`
WD-049. **Информация об IP-адресе / IP Address Information** — `/tools/ip-information` · `/en/tools/ip-information` · `dns_tls` · `R1` · `W2`
WD-050. **Поиск смешанного HTTP/HTTPS-контента / Mixed Content Checker** — `/tools/mixed-content-checker` · `/en/tools/mixed-content-checker` · `chromium` · `R3` · `W4`

## Производительность / Performance and Accessibility

WD-051. **Проверка Core Web Vitals / Core Web Vitals Checker** — `/tools/core-web-vitals-checker` · `/en/tools/core-web-vitals-checker` · `composite` · `R3` · `W4`
WD-052. **Lighthouse-аудит страницы / Lighthouse Audit** — `/tools/lighthouse-audit` · `/en/tools/lighthouse-audit` · `chromium` · `R3` · `W4`
WD-053. **Анализ веса страницы / Page Weight Analyzer** — `/tools/page-weight-analyzer` · `/en/tools/page-weight-analyzer` · `chromium` · `R3` · `W4`
WD-054. **Анализ загрузки ресурсов / Resource Waterfall Analyzer** — `/tools/resource-waterfall-analyzer` · `/en/tools/resource-waterfall-analyzer` · `chromium` · `R3` · `W4`
WD-055. **Проверка производительности изображений / Image Performance Checker** — `/tools/image-performance-checker` · `/en/tools/image-performance-checker` · `chromium` · `R3` · `W4`
WD-056. **Проверка загрузки веб-шрифтов / Web Font Performance Checker** — `/tools/font-performance-checker` · `/en/tools/font-performance-checker` · `chromium` · `R3` · `W4`
WD-057. **Проверка HTTP-кэширования / HTTP Cache Policy Checker** — `/tools/cache-policy-checker` · `/en/tools/cache-policy-checker` · `safe_fetch` · `R2` · `W3`
WD-058. **Поиск блокирующих рендер ресурсов / Render-Blocking Resources Checker** — `/tools/render-blocking-resources-checker` · `/en/tools/render-blocking-resources-checker` · `chromium` · `R3` · `W4`
WD-059. **Проверка мобильного viewport / Mobile Viewport Checker** — `/tools/mobile-viewport-checker` · `/en/tools/mobile-viewport-checker` · `chromium` · `R2` · `W3`
WD-060. **Быстрый аудит доступности / Quick Accessibility Audit** — `/tools/accessibility-quick-audit` · `/en/tools/accessibility-quick-audit` · `chromium` · `R3` · `W4`

## Разработка и данные / Development and Data

WD-061. **JSON Formatter и Validator / JSON Formatter and Validator** — `/tools/json-formatter-validator` · `/en/tools/json-formatter-validator` · `browser` · `R0` · `W1`
WD-062. **JSON Schema Validator / JSON Schema Validator** — `/tools/json-schema-validator` · `/en/tools/json-schema-validator` · `browser` · `R0` · `W1`
WD-063. **JSONPath Tester / JSONPath Tester** — `/tools/jsonpath-tester` · `/en/tools/jsonpath-tester` · `browser` · `R0` · `W1`
WD-064. **YAML ↔ JSON / YAML ↔ JSON Converter** — `/tools/yaml-json-converter` · `/en/tools/yaml-json-converter` · `browser` · `R0` · `W1`
WD-065. **TOML ↔ JSON / TOML ↔ JSON Converter** — `/tools/toml-json-converter` · `/en/tools/toml-json-converter` · `browser` · `R0` · `W1`
WD-066. **XML Formatter и Validator / XML Formatter and Validator** — `/tools/xml-formatter-validator` · `/en/tools/xml-formatter-validator` · `browser` · `R0` · `W1`
WD-067. **CSV Validator / CSV Validator** — `/tools/csv-validator` · `/en/tools/csv-validator` · `browser` · `R0` · `W1`
WD-068. **CSV ↔ JSON / CSV ↔ JSON Converter** — `/tools/csv-json-converter` · `/en/tools/csv-json-converter` · `browser` · `R0` · `W1`
WD-069. **SQL Formatter / SQL Formatter** — `/tools/sql-formatter` · `/en/tools/sql-formatter` · `browser` · `R0` · `W1`
WD-070. **GraphQL Formatter / GraphQL Formatter** — `/tools/graphql-formatter` · `/en/tools/graphql-formatter` · `browser` · `R0` · `W1`
WD-071. **Regex Tester / Regular Expression Tester** — `/tools/regex-tester` · `/en/tools/regex-tester` · `browser` · `R0` · `W1`
WD-072. **Генератор cron-выражений / Cron Expression Generator** — `/tools/cron-generator` · `/en/tools/cron-generator` · `browser` · `R0` · `W1`
WD-073. **Расшифровка cron-выражений / Cron Expression Parser** — `/tools/cron-parser` · `/en/tools/cron-parser` · `browser` · `R0` · `W1`
WD-074. **JWT Decoder / JWT Decoder** — `/tools/jwt-decoder` · `/en/tools/jwt-decoder` · `browser` · `R0` · `W1`
WD-075. **URL Parser / URL Parser** — `/tools/url-parser` · `/en/tools/url-parser` · `browser` · `R0` · `W1`
WD-076. **URL Encoder / Decoder / URL Encoder and Decoder** — `/tools/url-encoder-decoder` · `/en/tools/url-encoder-decoder` · `browser` · `R0` · `W1`
WD-077. **HTML Entities Encoder / Decoder / HTML Entities Encoder and Decoder** — `/tools/html-entities-converter` · `/en/tools/html-entities-converter` · `browser` · `R0` · `W1`
WD-078. **Base64 Encoder / Decoder / Base64 Encoder and Decoder** — `/tools/base64-converter` · `/en/tools/base64-converter` · `browser` · `R0` · `W1`
WD-079. **Сравнение текста и кода / Text and Code Diff Checker** — `/tools/diff-checker` · `/en/tools/diff-checker` · `browser` · `R0` · `W1`
WD-080. **Генератор хешей / Hash Generator** — `/tools/hash-generator` · `/en/tools/hash-generator` · `browser` · `R0` · `W1`

## CSS и дизайн / CSS and Design

WD-081. **Конвертер цветов / Color Converter** — `/tools/color-converter` · `/en/tools/color-converter` · `browser` · `R0` · `W1`
WD-082. **Проверка контраста цветов / Color Contrast Checker** — `/tools/color-contrast-checker` · `/en/tools/color-contrast-checker` · `browser` · `R0` · `W1`
WD-083. **Извлечение палитры из изображения / Image Color Palette Extractor** — `/tools/color-palette-extractor` · `/en/tools/color-palette-extractor` · `browser` · `R0` · `W1`
WD-084. **Генератор CSS-градиентов / CSS Gradient Generator** — `/tools/gradient-generator` · `/en/tools/gradient-generator` · `browser` · `R0` · `W1`
WD-085. **Генератор box-shadow / Box Shadow Generator** — `/tools/box-shadow-generator` · `/en/tools/box-shadow-generator` · `browser` · `R0` · `W1`
WD-086. **Генератор border-radius / Border Radius Generator** — `/tools/border-radius-generator` · `/en/tools/border-radius-generator` · `browser` · `R0` · `W1`
WD-087. **Генератор clip-path / Clip Path Generator** — `/tools/clip-path-generator` · `/en/tools/clip-path-generator` · `browser` · `R0` · `W1`
WD-088. **CSS Filter Playground / CSS Filter Playground** — `/tools/css-filter-playground` · `/en/tools/css-filter-playground` · `browser` · `R0` · `W1`
WD-089. **Калькулятор специфичности CSS / CSS Specificity Calculator** — `/tools/css-specificity-calculator` · `/en/tools/css-specificity-calculator` · `browser` · `R0` · `W1`
WD-090. **Конвертер px ↔ rem / px ↔ rem Converter** — `/tools/px-rem-converter` · `/en/tools/px-rem-converter` · `browser` · `R0` · `W1`
WD-091. **Генератор типографической шкалы / Typography Scale Generator** — `/tools/typography-scale-generator` · `/en/tools/typography-scale-generator` · `browser` · `R0` · `W1`
WD-092. **CSS Grid Generator / CSS Grid Generator** — `/tools/css-grid-generator` · `/en/tools/css-grid-generator` · `browser` · `R0` · `W1`
WD-093. **Flexbox Playground / Flexbox Playground** — `/tools/flexbox-playground` · `/en/tools/flexbox-playground` · `browser` · `R0` · `W1`

## Медиа и утилиты / Media and Utilities

WD-094. **Оптимизация и сжатие изображений / Image Optimizer and Compressor** — `/tools/image-optimizer` · `/en/tools/image-optimizer` · `browser` · `R0` · `W1`
WD-095. **Конвертер PNG, JPEG, WebP и AVIF / PNG, JPEG, WebP and AVIF Converter** — `/tools/image-format-converter` · `/en/tools/image-format-converter` · `browser` · `R0` · `W1`
WD-096. **Изменение размера изображения / Image Resizer** — `/tools/image-resizer` · `/en/tools/image-resizer` · `browser` · `R0` · `W1`
WD-097. **Обрезка изображений / Image Cropper** — `/tools/image-cropper` · `/en/tools/image-cropper` · `browser` · `R0` · `W1`
WD-098. **Генератор favicon / Favicon Generator** — `/tools/favicon-generator` · `/en/tools/favicon-generator` · `browser` · `R0` · `W1`
WD-099. **Генератор QR-кодов / QR Code Generator** — `/tools/qr-code-generator` · `/en/tools/qr-code-generator` · `browser` · `R0` · `W1`
WD-100. **Генератор UUID / UUID Generator** — `/tools/uuid-generator` · `/en/tools/uuid-generator` · `browser` · `R0` · `W1`
WD-101. **Распознавание QR-кодов / QR Code Decoder** — `/tools/qr-code-decoder` · `/en/tools/qr-code-decoder` · `browser` · `R0` · `W1`
WD-102. **Оптимизация SVG / SVG Optimizer** — `/tools/svg-optimizer` · `/en/tools/svg-optimizer` · `browser` · `R0` · `W1`
WD-103. **Просмотр метаданных изображения / Image Metadata Viewer** — `/tools/image-metadata-viewer` · `/en/tools/image-metadata-viewer` · `browser` · `R0` · `W1`
WD-104. **Удаление метаданных изображения / Image Metadata Remover** — `/tools/image-metadata-remover` · `/en/tools/image-metadata-remover` · `browser` · `R0` · `W1`
WD-105. **Генератор srcset для адаптивных изображений / Responsive Image Srcset Generator** — `/tools/responsive-image-srcset-generator` · `/en/tools/responsive-image-srcset-generator` · `browser` · `R0` · `W1`
WD-106. **Калькулятор пропорций изображения / Image Aspect Ratio Calculator** — `/tools/image-aspect-ratio-calculator` · `/en/tools/image-aspect-ratio-calculator` · `browser` · `R0` · `W1`
WD-107. **Конвертер изображения в Data URI / Image to Data URI Converter** — `/tools/image-data-uri-converter` · `/en/tools/image-data-uri-converter` · `browser` · `R0` · `W1`
WD-108. **Генератор плейсхолдеров изображений / Image Placeholder Generator** — `/tools/image-placeholder-generator` · `/en/tools/image-placeholder-generator` · `browser` · `R0` · `W1`

## Разработка и данные / Development and Data

WD-109. **Конвертер Unix timestamp / Unix Timestamp Converter** — `/tools/unix-timestamp-converter` · `/en/tools/unix-timestamp-converter` · `browser` · `R0` · `W1`
WD-110. **Генератор ULID / ULID Generator** — `/tools/ulid-generator` · `/en/tools/ulid-generator` · `browser` · `R0` · `W1`
