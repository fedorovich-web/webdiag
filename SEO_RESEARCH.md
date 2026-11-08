# SEO & Competitor Research Matrix

**Date of Research:** 2026-11-07  
**Project:** WebDiag (`fedorovich-web/webdiag`)  
**Target Locales:** `ru` (primary), `en` (secondary)  
**Scope:** Technical SEO audit tools, website diagnostics, single-page checks, and monitoring services.

---

## 1. Competitor Benchmark Matrix

| Competitor | Locale | URL | Strengths | Weaknesses / Gaps | Value Proposition & Framing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Labrika** | `ru` | `https://labrika.ru/tech-audit` | Deep technical crawler, checks 200+ factors, visual issue prioritization, explains business impact. | Overwhelming UI, mandatory registration before seeing detailed single-URL audit, slow initial crawl. | "Полный технический аудит сайта за 10 минут: найдём все критические ошибки до того, как они уронят трафик." |
| **Serpstat (RU)** | `ru` | `https://serpstat.com/ru/` | Established brand, multi-tool ecosystem, comprehensive domain analysis, visibility graphs. | Complex interface for non-SEOs, pricey entry plans, single-page diagnostics buried in platform. | "Многофункциональная SEO-платформа для профессионалов: аудит сайта, анализ конкурентов и позиций." |
| **SEO-разбор** | `ru` | `https://seo-razbor.ru/` | Instant free single-page check, zero signup barrier, very fast summary of basic HTML/meta tags. | Superficial analysis (misses Core Web Vitals, shallow redirect analysis, lacks project monitoring, no API). | "Бесплатный экспресс-анализ сайта онлайн: быстрая проверка основных параметров страницы." |
| **SEOptimer** | `en` | `https://www.seoptimer.com/` | Clean letter-grade scoring (A+ to F), 5 clear categories (SEO, Usability, Performance, Social, Security), actionable priority checklist. | Generic recommendations, upsell walls on crawls > 1 page, limited deep diagnostics on modern JS frameworks. | "Comprehensive Website Audit & Reporting Tool: beautifully simple website review and reporting." |
| **Seobility** | `en` | `https://www.seobility.net/` | Structured into On-Page, Backlinks, Rankings; clear task list with "What it means" & "How to fix". | Free tier limited to 1 project / 1000 pages, slower crawl speed, dense desktop-only interface. | "All-in-One SEO Software & Website Crawler: better search rankings through continuous monitoring." |
| **SEO Site Checkup**| `en` | `https://seositecheckup.com/`| Instant single-box URL check, side-by-side competitor comparison, how-to-fix code snippets. | Aggressive paywall after 1 test, outdated UI design, scores feel arbitrary without context. | "Instantly analyze your SEO issues: professional SEO monitoring and diagnostic tools for agencies and webmasters." |

---

## 2. Common Patterns & Best Practices Identified

1. **Hierarchy & Severity Grouping:**
   - Leading tools categorize issues into 3–4 explicit severity tiers: **Критические ошибки (Critical)**, **Ошибки (Errors)**, **Предупреждения (Warnings)**, **Уведомления / Рекомендации (Notices)**.
   - Users immediately need to know: *"Will this break indexing today, or is it an optimization for next month?"*

2. **User Personas & Use-Case Anchoring:**
   - **Freelancers / Web Developers:** Need an audit before handing off a completed client project (*"Приёмка сайта у разработчиков"*).
   - **Business / Site Owners:** Need an audit before launching ad campaigns (*"Проверка перед запуском рекламы: не сливайте бюджет на битые страницы"*).
   - **In-House SEOs / Marketers:** Need ongoing monitoring (*"Контроль изменений после релизов"*).

3. **Zero-Friction First Touch:**
   - Immediate URL input above the fold with 0-click sample report preview.
   - Clear expectation setting: how long a scan takes (< 15 seconds for single URL, bounded site crawl for project workspace).

4. **Safety & Crawl Impact Reassurance:**
   - Clear statement that WebDiag diagnostics do not overload server resources, respect `robots.txt`, and run read-only requests.

---

## 3. WebDiag Strategic Positioning & Opportunities to Beat the Benchmark

| Dimension | Typical Competitor | WebDiag Advantage & Refinement |
| :--- | :--- | :--- |
| **Single-Page Diagnostic** | Either too shallow (SEO-разбор) or locked behind paywall (SEOptimer). | **Instant, free deep inspection** covering 12 audit areas (Robots, Sitemap, Redirects, Meta, CWV, SSL, Links, Canonical, A11y, Duplicates, Indexing, Images) without login. |
| **Issue Actionability** | Long unsorted dumps of URLs with little context. | **Direct mapping of issue to affected URLs** with concrete remediation advice and priority ranking. |
| **Tool Catalog** | 5–10 generic tools. | **Full suite of focused single-purpose tools** (robots.txt tester, redirect chain tracker, SSL checker, Core Web Vitals debugger, JSON-LD validator, etc.). |
| **Workflow Continuity** | Disconnected tools or rigid enterprise subscriptions. | Seamless transition from **Instant URL check** &rarr; **Full Project Audit** &rarr; **Automated Monitoring**. |

---

## 4. Copy & Messaging Recommendations for WebDiag

### A. Value Proposition Framing (Homepage Hero)
- **Current RU:** *"Проверка сайта на технические и SEO-ошибки"*
- **Enhanced RU:** *"Технический и SEO-аудит сайта: найдите и исправьте ошибки до того, как они повлияют на позиции"*
- **Current EN:** *"Check Your Website for Technical and SEO Issues"*
- **Enhanced EN:** *"Technical & SEO Website Diagnostics: Find and Fix Issues Before They Impact Search Rankings"*

### B. Objections to Address in FAQ & Trust Blocks
1. *"Безопасна ли проверка для работы сайта?"* &rarr; Да, WebDiag выполняет только безопасные GET/HEAD-запросы с бережной частотой обращений и соблюдением директив robots.txt.
2. *"Сколько времени занимает аудит?"* &rarr; Экспресс-проверка страницы занимает до 10-15 секунд. Аудит проекта в личном кабинете выполняется в фоновом режиме с уведомлениями.
3. *"Кому подходит WebDiag?"* &rarr; Владельцам сайтов (контроль подрядчиков), разработчикам (чек-лист перед сдачей проекта) и SEO-специалистам (ускорение рутинной диагностики).

### C. Primary Call to Action
- Clear microcopy below URL input: *"Без регистрации. Результаты за 15 секунд. Доступен пример готового отчёта."*
