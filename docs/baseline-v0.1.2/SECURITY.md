# SECURITY.md — URL Security и Responsible Scanning

Дата: 2026-07-16
Статус: **P0 accepted baseline**

## 1. Базовый принцип

Ни один executor не имеет права выполнять произвольный запрос к пользовательскому URL напрямую. Все server-side URL проходят через единый URL Security Gateway.

## 2. Разрешённые протоколы

- `http`
- `https`

Остальные схемы запрещены, включая `file`, `ftp`, `gopher`, `data`, `javascript` и нестандартные прокси-схемы.

## 3. Блокируемые цели

- localhost и локальные имена;
- loopback IPv4/IPv6;
- private IPv4/IPv6;
- link-local;
- multicast;
- unspecified/reserved ranges;
- cloud metadata endpoints;
- Docker/Kubernetes/internal service domains;
- IP literal и DNS-ответы, попадающие в запрещённые диапазоны.

## 4. DNS и redirects

- IDN нормализуется в Punycode.
- DNS проверяется до соединения.
- Фактический peer IP проверяется повторно.
- Каждый redirect проходит полный цикл повторной валидации.
- Redirect limit обязателен.
- DNS rebinding должен блокироваться policy и egress controls.

## 5. Лимиты beta

- Только GET/HEAD; OPTIONS только для строго определённого CORS checker.
- Никаких POST, PUT, DELETE, PATCH к стороннему сайту.
- Стандартные порты 80/443; исключения отсутствуют в public beta.
- Response body: ограниченный размер.
- Header size: ограниченный размер.
- Connect/read/total timeouts.
- Per-host concurrency.
- Per-IP, per-account и per-tool rate limits.
- Crawl page/depth/time/byte budgets.
- Chromium CPU/memory/time limits.

Конкретные числовые лимиты будут храниться в versioned configuration, а не в маркетинговых текстах.

## 6. Responsible scanning

### Без подтверждения владения

Разрешены только пассивные публичные проверки:

- чтение открытой страницы;
- HEAD/GET;
- DNS/TLS/WHOIS;
- ограниченное чтение robots/sitemap;
- ограниченный crawl с низкой нагрузкой.

### С подтверждением владения

Интенсивные recurring scans, высокий page budget и чувствительные функции могут требовать DNS TXT, HTML file или meta-tag verification.

### Запрещено

- port scanning;
- brute force;
- exploit testing;
- credential testing;
- malware delivery/fetching;
- arbitrary file download;
- open proxy behavior;
- DDoS amplification;
- обход аутентификации;
- intrusive vulnerability scanning.

## 7. Privacy

- отчёты private by default;
- URL query strings минимизируются в логах;
- secrets и credentials никогда не логируются;
- локальные browser tools не отправляют ввод на сервер без необходимости;
- публичная публикация отчёта требует явного действия пользователя.

## 8. Обязательные negative tests

- localhost blocked;
- private IPv4 blocked;
- IPv6 loopback blocked;
- metadata endpoint blocked;
- DNS rebinding blocked;
- redirect to private IP blocked;
- oversized response rejected;
- redirect loop stopped;
- disallowed port rejected;
- crawl budget enforced;
- Chromium timeout enforced.
