# Установка и запуск WebDiag

Эта инструкция относится к исходному архиву `webdiag.zip`. Текущая версия указана в корневом `package.json`.

## 1. Нужно ли выполнять `npm init`

Нет. Проект уже инициализирован:

- корневой `package.json` существует;
- npm workspaces настроены;
- `package-lock.json` включён;
- Next.js, shared packages, FastAPI и worker уже находятся в структуре проекта.

После распаковки нужно установить зависимости командой `npm ci`, а не создавать новый проект через `npm init` или `create-next-app`.

## 2. Что установить на компьютер

Для локального запуска нужны:

- Node.js 24 LTS или совместимая версия из диапазона, указанного в `package.json`;
- npm 10;
- Python 3.13 или 3.14;
- Git — только если проект будет храниться в Git-репозитории;
- Docker Desktop — только для запуска полного набора контейнеров.

Проверка установленных версий:

```bash
node --version
npm --version
python --version
docker --version
docker compose version
```

Docker не обязателен для запуска одного frontend и API, но нужен для PostgreSQL, RabbitMQ, Valkey и полного Docker Compose окружения.

## 3. Куда распаковать архив

Пример для Windows:

```text
C:\Projects\webdiag
```

Пример для Linux/macOS:

```text
~/Projects/webdiag
```

После распаковки откройте именно корневую папку проекта — ту, где находятся `package.json`, `docker-compose.yml` и папка `apps`.

## 4. Настройка переменных окружения

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Windows Command Prompt

```cmd
copy .env.example .env
```

### Linux/macOS

```bash
cp .env.example .env
```

Файл `.env` предназначен для локальных значений. Не публикуйте реальные пароли и ключи в Git.

Текущее значение должно оставаться:

```env
PUBLIC_RELEASE=false
```

Публичный режим намеренно блокируется release gate.

## 5. Установка JavaScript-зависимостей

Из корневой папки проекта:

```bash
npm ci
```

Почему `npm ci`, а не `npm install`:

- используется зафиксированный `package-lock.json`;
- установка воспроизводима;
- команда не должна самопроизвольно менять lock-файл.

`npm install` нужен только при осознанном добавлении или обновлении зависимостей.

## 6. Установка Python-зависимостей

Создайте виртуальное окружение в корне проекта.

### Windows PowerShell

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
npm run python:install
npm run python:where
```

Активация `.venv` для npm-команд не требуется. `python:where` должен вывести путь внутри текущего проекта, например `C:\Projects\webdiag\.venv\Scripts\python.exe`.

### Windows Command Prompt

```cmd
py -3.14 -m venv .venv
.venv\Scripts\python.exe -m pip install --upgrade pip
npm run python:install
npm run python:where
```

### Linux/macOS

```bash
python3 -m venv .venv
.venv/bin/python -m pip install --upgrade pip
npm run python:install
npm run python:where
```

Команда устанавливает API и worker в editable-режиме вместе с dev-зависимостями. `npm run python:install`, `test:python`, `lint:python` и `verify:local` всегда используют Python из `.venv`, даже если окружение не активировано.

## 7. Быстрый локальный запуск

### Терминал 1 — frontend

```bash
npm run dev
```

Открыть:

```text
http://localhost:3000
```

### Терминал 2 — API

Для прямого запуска API используйте интерпретатор из `.venv` либо предварительно активируйте окружение:

Windows PowerShell:

```powershell
.\.venv\Scripts\python.exe -m uvicorn webdiag_api.main:app --app-dir apps/api/src --reload --host 127.0.0.1 --port 8000
```

Linux/macOS:

```bash
.venv/bin/python -m uvicorn webdiag_api.main:app --app-dir apps/api/src --reload --host 127.0.0.1 --port 8000
```

Проверка API:

```text
http://localhost:8000/health
http://localhost:8000/docs
```

### Worker

Worker требует RabbitMQ. Сначала запустите RabbitMQ:

```bash
docker compose up -d rabbitmq
```

Затем в отдельном терминале с активированной `.venv`:

#### Windows PowerShell

```powershell
$env:WEBDIAG_BROKER_URL="amqp://webdiag:change-me@localhost:5672/"
dramatiq webdiag_worker.actors
```

#### Windows Command Prompt

```cmd
set WEBDIAG_BROKER_URL=amqp://webdiag:change-me@localhost:5672/
dramatiq webdiag_worker.actors
```

#### Linux/macOS

```bash
export WEBDIAG_BROKER_URL="amqp://webdiag:change-me@localhost:5672/"
dramatiq webdiag_worker.actors
```

Интерфейс RabbitMQ Management после запуска контейнера:

```text
http://localhost:15672
```

Локальные логин и пароль берутся из `.env`.

### Закрытая AI-бета

Backend содержит строгие контракты 15 AI-инструментов и OpenRouter adapter, но
все инструменты остаются `internal`, не имеют цены в кредитах и недоступны
пользователю. Тринадцать text/vision-analysis contracts закреплены за
`openai/gpt-5.6-luna`; генерация и редактирование изображений используют
отдельные `openai/gpt-image-2` и OpenRouter Image API. Реальная provider
evaluation, проверка списанной стоимости и утверждение фиксированной цены не
выполнялись. Пока в каталоге нет ни одного `ready` tool, worker-команду
`run_pending_ai` планировать нельзя.

API и worker используют отдельный секрет длиной не менее 32 видимых ASCII-символов:

```text
WEBDIAG_AI_INTERNAL_TOKEN
WEBDIAG_AI_API_INTERNAL_URL
```

В production `WEBDIAG_AI_INTERNAL_TOKEN` обязателен и не может совпадать с `WEBDIAG_MONITORING_INTERNAL_TOKEN`. Секреты не добавляются в репозиторий и не передаются frontend.

Операторское начисление тестовых кредитов выполняется только на сервере. Для защиты от ошибки ID пользователя указывается дважды:

```powershell
node scripts/run-python.mjs -m webdiag_api.ai.cli grant-credits `
  --database-path .webdiag/accounts.sqlite3 `
  --user-id 00000000-0000-0000-0000-000000000000 `
  --confirm-user-id 00000000-0000-0000-0000-000000000000 `
  --quantity 100 `
  --reason "closed beta" `
  --correlation-id beta-2026-0001
```

Повтор той же команды с теми же данными идемпотентен. Повтор correlation ID с другими данными отклоняется. CLI не заменяет operator RBAC и не должен быть доступен через публичный HTTP endpoint.

## 8. Запуск всего окружения через Docker Compose

Docker Compose использует исходный код и собирает web, API и worker, а также запускает PostgreSQL, RabbitMQ и Valkey.

```bash
docker compose -f docker-compose.yml -f docker-compose.account.override.yml up --build
```

После запуска:

- Web: `http://localhost:3000`;
- API: `http://localhost:8000/health`;
- API docs: `http://localhost:8000/docs`;
- RabbitMQ Management: `http://localhost:15672`.

Запуск в фоне:

```bash
docker compose -f docker-compose.yml -f docker-compose.account.override.yml up -d --build
```

Просмотр состояния:

```bash
docker compose -f docker-compose.yml -f docker-compose.account.override.yml ps
```

Просмотр логов:

```bash
docker compose -f docker-compose.yml -f docker-compose.account.override.yml logs -f
```

Остановка:

```bash
docker compose -f docker-compose.yml -f docker-compose.account.override.yml down
```

Удаление контейнеров вместе с локальными томами базы данных и Valkey:

```bash
docker compose -f docker-compose.yml -f docker-compose.account.override.yml down -v
```

Последняя команда удаляет локальные данные окружения.

### Резервное копирование и подготовка восстановления SQLite

Операторский CLI работает сразу с двумя базами WebDiag и не доступен через HTTP.
Каталог результата должен отсутствовать, а его родительский каталог — уже
существовать. Для локальных путей по умолчанию пример выглядит так:

```bash
node scripts/run-python.mjs -m webdiag_api.recovery backup --account-database .webdiag/accounts.sqlite3 --audit-database .webdiag/audits.sqlite3 --output-dir recovery/backup
```

Успешная команда печатает `backup_created=recovery/backup`. В каталоге будут
ровно `accounts.sqlite3`, `audits.sqlite3` и `manifest.json`. Каждая база
снимается через SQLite online backup и проверяется отдельно. Это не атомарный
снимок общего состояния двух баз: изменения между двумя snapshot возможны.

После создания перенесите весь каталог в защищённое внешнее хранилище способом,
принятым в вашей инфраструктуре, и повторно проверьте уже перенесённую копию:

```bash
node scripts/run-python.mjs -m webdiag_api.recovery verify --backup-dir recovery/backup
```

Успех печатается как `backup_verified=recovery/backup`. SHA-256 обнаруживает
изменение файлов, но не является подписью. Контроль доступа к backup и правила
его внешнего хранения остаются ответственностью оператора.

Восстановление сначала создаёт новый проверенный кандидат и никогда не
перезаписывает существующий каталог или рабочие базы:

```bash
node scripts/run-python.mjs -m webdiag_api.recovery restore --backup-dir recovery/backup --output-dir recovery/restored
```

Успех печатается как `restore_created=recovery/restored`. Перед переключением:

1. Остановите API и `monitoring_scheduler`, чтобы обе базы были офлайн.
2. Укажите `WEBDIAG_ACCOUNT_DATABASE_PATH` на новый `accounts.sqlite3`, а
   `WEBDIAG_AUDIT_DATABASE_PATH` — на новый `audits.sqlite3` из одного restore-кандидата.
3. Запустите API и выполните smoke-проверку аутентификации, ownership,
   кредитов, monitoring и чтения одного существующего публичного аудита.
4. Только после приёмки запускайте scheduler. Старые базы сохраняйте до
   завершения приёмки.

Пути должны быть доступны API в его файловом пространстве; для контейнерного
запуска это означает путь внутри подключённого volume, а не путь хоста. CLI
возвращает `0` при успехе, `2` при ожидаемой ошибке recovery и `1` при
неожиданном внутреннем сбое. Он не печатает traceback или содержимое баз.

Production S3 recovery: непроверено. Реальный backup/restore из production S3
не выполнялся, и этот CLI не заменяет отдельную проверку объектного хранилища.

## 9. Проверки перед продолжением разработки

Активация `.venv` для npm-команд не требуется: они используют локальный интерпретатор напрямую.

Один раз установите Chromium, который соответствует зафиксированной версии Playwright:

```bash
npx playwright install chromium
```

Если в контролируемой среде уже есть совместимый Chromium и загрузка браузера запрещена, путь можно передать явно:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

Основные проверки:

```bash
npm run python:where
npm run verify:registry
npm test
npm run lint
npm run typecheck
npm run build
npm run test:browser
npm run test:python
npm run lint:python
```

Общий локальный запуск проверок:

```bash
npm run verify:local
```

`verify:local` включает production build, полный Playwright browser gate, утверждённые screenshot comparisons и Python-проверки. Он автоматически использует `.venv`, но не включает Docker Compose smoke. Visual baselines находятся в `apps/web/e2e/visual.spec.ts-snapshots` и должны обновляться только после ручного просмотра осознанного изменения интерфейса.

## 10. Production preview frontend

Сначала:

```bash
npm run build
```

Затем:

```bash
npm --workspace @webdiag/web run start
```

Открыть:

```text
http://localhost:3000
```

## 11. Инициализация Git

Git не обязателен для запуска, но нужен для нормальной разработки.

```bash
git init
git add .
git commit -m "chore: initialize WebDiag"
```

Remote-репозиторий в проекте не настроен. Его нельзя считать существующим, пока он не создан отдельно.

## 12. Частые ошибки

### `npm` не найден

Node.js не установлен или терминал был открыт до установки. Установите Node.js и откройте новое окно терминала.

### `python` не найден в Windows

Проверьте:

```powershell
py --version
```

При наличии Python Launcher команды можно выполнять через `py`, например:

```powershell
py -3.14 -m venv .venv
```

### Порт 3000, 8000, 5432, 5672, 6379 или 15672 занят

Найдите процесс, использующий порт, либо измените локальное сопоставление портов в `docker-compose.yml`.

### Worker не подключается к RabbitMQ

Проверьте:

```bash
docker compose ps rabbitmq
docker compose logs rabbitmq
```

И убедитесь, что `WEBDIAG_BROKER_URL` совпадает с логином и паролем в `.env`.

### Build блокируется при `PUBLIC_RELEASE=true`

Это ожидаемое поведение. Публичный release gate должен оставаться закрытым до выполнения утверждённых требований проекта.

## 13. Если `npm ci` сообщает E404 для `@webdiag/...`

В текущем исходнике внутренние пакеты разрешаются через npm workspaces и не скачиваются из публичного registry.

Проверьте, что команда запущена из корня проекта, где расположен корневой `package.json`. Затем выполните:

```powershell
npm run test:workspace
npm ci
```

`test:workspace` проверяет совпадение версий всех workspace-пакетов, локальные ссылки в `package-lock.json` и отсутствие внутренних registry URL.
