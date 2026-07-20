# PRODUCT.md — WebDiag

Дата: 2026-07-16
Статус: **accepted baseline v0.1.0**

## 1. Продуктовая категория

WebDiag — российская платформа технического состояния и SEO-надежности сайтов.

Основной цикл:

`AUDIT → UNDERSTAND → MONITOR → DETECT CHANGE → PRIORITIZE → ALERT → FIX → VERIFY → HISTORY`

## 2. Аудитория

### Primary

- SEO-специалисты;
- технические SEO-специалисты;
- веб-разработчики;
- небольшие digital- и SEO-команды, контролирующие несколько сайтов.

### Secondary

- владельцы малого и среднего бизнеса;
- контент-менеджеры;
- маркетологи;
- веб-студии как пользователи SaaS, но не как продаваемая внутри WebDiag услуга.

## 3. Primary JTBD

«Регулярно понимать техническое состояние сайта, быстро замечать критические изменения и проверять, что проблема действительно исправлена».

## 4. Core product

- Single Page Audit.
- Limited Whole-Site Audit.
- Findings с evidence и рекомендациями.
- История аудитов.
- Сравнение результатов.
- Uptime monitoring.
- SSL monitoring.
- SEO change monitoring.
- Уведомления.
- Re-check / fix verification.

## 5. Acquisition layer

110 отдельных публичных инструментов из `TOOLS_CATALOG.md`.

Правило: каталог помогает получить первую ценность без тяжёлого onboarding и переводит пользователя в core workflow. Каталог не должен визуально или продуктово превращать WebDiag в бессвязный «склад утилит».

## 6. 30-дневная beta

Обязательный результат:

- 110 работающих инструментов без заглушек;
- 46 инструментов выполняются локально;
- единый безопасный сетевой gateway;
- ограниченный аудит страницы и сайта;
- сохранение истории для зарегистрированных пользователей;
- базовые uptime/SSL проверки;
- честные статусы `pass`, `warning`, `error`, `info`, `not_applicable`, `not_measured`, `failed_to_measure`;
- отсутствие недоказанных claims;
- private by default.

## 7. Не входит в 30-дневную beta

- rank tracker;
- generic AI image/text zoo;
- публичный индекс отчётов;
- enterprise RBAC;
- полноценный внешний API;
- сложный usage billing;
- marketplace интеграций;
- unlimited crawling;
- intrusive security scanning;
- агентские услуги разработки и SEO.

## 8. North Star и activation

### Activation event

Пользователь добавил сайт, запустил аудит и просмотрел минимум один finding с evidence и рекомендацией.

### Retention event

Пользователь вернулся к повторному аудиту, сравнению изменений или событию мониторинга.

### Initial North Star candidate

Количество активных сайтов, для которых за 30 дней был выполнен минимум один аудит и минимум одна повторная проверка или monitoring check.

Это гипотеза и должно быть подтверждено реальными данными после запуска.

## 9. Языки и контент

- Русский — основной язык продукта.
- English — полноценный второй язык.
- Блог, guides и glossary являются отдельным SEO/content acquisition layer.
- Контент не входит в число 110 инструментов.
- Image toolset включает отдельные convert, crop, optimize/compress и resize workflows.
