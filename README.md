# WebDiag

Внутренний исходный проект WebDiag. Текущая версия хранится в корневом `package.json` и синхронизируется с workspace- и Python-пакетами.

Публичный выпуск заблокирован release gate: реестр — источник истины, и каждый объявленный инструмент должен иметь уникальные `id` и `slug` и состояние `ready`.

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
