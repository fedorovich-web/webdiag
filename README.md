# WebDiag

Внутренний исходный проект WebDiag. Текущая версия хранится в корневом `package.json` и синхронизируется с workspace- и Python-пакетами.

Публичный выпуск заблокирован release gate, пока все 110 зарегистрированных инструментов не реализованы и не проверены.

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
.\.venv\Scripts\python.exe -m pip install --upgrade pip
npm run python:install
npm run verify:local
```

### Linux/macOS

```bash
npm ci
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
npm run python:install
npm run verify:local
```

Активация `.venv` для npm-команд не требуется. Не запускайте `npm init` или `create-next-app` внутри проекта.
