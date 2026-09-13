# WebDiag

Внутренний исходный проект WebDiag. Текущая версия хранится в корневом `package.json` и синхронизируется с workspace- и Python-пакетами.

Реестр остаётся источником истины. На текущем HEAD публичный registry gate
проходит: 115 инструментов имеют состояние `ready`, ещё 10 внутренних
определений явно связаны с готовыми заменами через `supersededBy`.

Это подтверждает целостность каталога, но не означает, что production-запуск
выполнен или разрешён. Для запуска основного контура ещё нужны выбранные
хостинг, домен, TLS/reverse proxy и secret manager, реальные production-секреты,
проверенный backup/restore drill и отдельное разрешение на deployment. AI-контур
остаётся выключенным до provider evaluation, проверки стоимости, S3 recovery
drill и утверждения цен. Payload CMS отдельно приостановлена из-за dependency
security gate; существующие публичные страницы продолжают использовать текущий
репозиторный источник контента.

## Начало работы

- [`docs/INSTALLATION.md`](docs/INSTALLATION.md) — установка и запуск;
- [`docs/VERIFICATION.md`](docs/VERIFICATION.md) — фактические проверки текущего патча;
- [`docs/DESIGN_FOUNDATION.md`](docs/DESIGN_FOUNDATION.md) — дизайн-система и UI-правила;
- [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) — обязательные правила проекта;
- [`docs/RELEASE_POLICY.md`](docs/RELEASE_POLICY.md) — политика публикации.

## Минимальная установка

### Windows PowerShell

```powershell
npm ci
py -3.14 -m venv .venv
npm run python:install
npm run verify:local
```

### Linux/macOS

```bash
npm ci
python3 -m venv .venv
npm run python:install
npm run verify:local
```

`python:install` устанавливает сторонние пакеты только из committed wheel-only
SHA-256 lock, затем добавляет локальные API и worker без разрешения их
зависимостей. Активация `.venv` для npm-команд не требуется. Не запускайте
`npm init` или `create-next-app` внутри проекта.
