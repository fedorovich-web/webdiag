# Проверка WebDiag

Команды выполняются из корня checkout после `npm ci`, создания `.venv` на Python
3.14 и `npm run python:install`. Точные команды и версии задают `package.json`,
Python project files и lock-файлы. Успех проверки относится к проверенному дереву
исходников и окружению; он не подтверждает следующую сборку или production.

## Локальные gates

```sh
npm run verify:local
```

Команда последовательно выполняет:

| Gate | Что проверяет |
| --- | --- |
| `verify:registry` | Уникальность, состояния, API-копию и качество каталога. |
| `verify:dead-code` | Неиспользуемые TypeScript entry points, imports и dependencies через Knip. Удаление требует проверки динамических путей отдельно. |
| `npm test` | Workspace, registry, core и web tests. |
| `lint`, `typecheck` | ESLint и TypeScript для приложений и общих пакетов. |
| `build` | Release gate, Next.js production build, standalone assets и проверку сгенерированных страниц/SEO. |
| `test:browser` | Playwright: публичные страницы, кабинет на fixtures, формы, клавиатура, accessibility и снимки для ручной проверки. |
| `test:python` | API, SQLite/storage/security, диагностические потоки и worker tests. |
| `lint:python`, `verify:python-lock` | Ruff, соответствие установленных зависимостей committed hashes и версиям. |

Публичную сборку также проверяют с `PUBLIC_RELEASE=true`. Переменная влияет
на индексацию и release gate, но не запускает providers или платежи.

Браузер устанавливается один раз через `npx playwright install chromium`.
Для Brave или другого установленного Chromium задайте
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` абсолютным путём к executable.
Снимки из `apps/web/test-results` просматриваются вручную; автоматических
screenshot baselines в текущем checkout нет.

Дополнительные проверки:

```sh
node scripts/run-python.mjs -m pip check
npm audit
npm run test:dokploy-compose
git diff --check
```

## Контейнерные конфигурации

Эти команды только рендерят Compose и проверяют политику, не запускают контейнеры:

```sh
npm run verify:production-compose -- --env-file <private-env-file>
npm run verify:production-dokploy-compose -- --env-file <private-env-file>
npm run verify:production-ai-compose -- --env-file <private-env-file>
```

Используйте синтетические значения для локальной проверки. Не печатайте rendered
environment с production credentials. CI дополнительно собирает и проверяет
runtime всех трёх образов; локальный build Next.js не заменяет эту проверку.

## Границы доказательств

- Fixtures и тестовые HTTP/provider adapters проверяют поведение без платных
  запросов, платежей, писем и уведомлений.
- CI подтверждается исполненными steps и их результатом. Run, остановленный
  ограничением аккаунта до первого step, не является успешным CI.
- Git commit, push и merge подтверждают доставку исходников. После merge отдельно
  проверяются autodeploy, фактическая ревизия и состояние web/API/scheduler.
- `/health` и `/ready` проверяют разные свойства. Они не подтверждают recovery,
  работу внешнего провайдера, доставку уведомления или успешный платёж.
- Backup/restore проверяется на staged-копиях по [INSTALLATION.md](INSTALLATION.md),
  без разрушительных миграций production-данных.
