# Проверка исправлений провайдеров — 2026-10-08

База: Git main `b00dba0f0b28217e335e7f9ac62b1e53c15cf96a`. Код проверен в отдельной копии этого commit. Изменённые пользовательские checkout и detached worktree не переносились и не перезаписывались. Этот документ фиксирует локальную проверку; он не подтверждает публикацию или работу новых изменений в production.

## Исправления

- Yandex: один backend code exchange, PKCE/state, доверенный callback origin, идентичность по subject. Первое подключение к существующему email требует подтверждения письмом. Восстановление атомарно отключает старый пароль и все прежние сессии; повторный вход уже привязанного subject не сбрасывает доступ. Удалены вход по заявленному email и обход подтверждения локальным паролем.
- Иконка: оригинальный круглый SVG Yandex отображается через img/Next Image, без воздействия глобального stroke на его внутренние пути. Оформление кнопки сохранено.
- Lava: реальные счета с владельцем, SKU, суммой, валютой и периодом; проверка provider receipt или webhook X-Api-Key; атомарное и однократное зачисление. Сохранены существующие месячные/годовые тарифы и RU/EN цены. Отдельные оплаченные периоды не теряются при разных уведомлениях и порядке подтверждения счетов.
- Checkout: оболочка кабинета теперь отображает переданную страницу оплаты. Query status=success не является подтверждением оплаты. Не собираются данные карты в фиктивной форме.
- AI: убран эвристический provider с выдуманными результатами. Реальный Vercel Gateway подключён к scheduler; отключённый runtime не выдаёт runnable каталог. Пустой каталог больше не включает все кнопки. Показаны полные результаты; убраны девять каталожных ссылок без рабочего публичного контракта.
- Почта: Compose передаёт Resend/SMTP настройки web-контейнеру. Welcome после регистрации выполняется через Next after и направляется на сохранённый адрес; новая регистрация через Yandex тоже получает welcome. Reply-To — support@webdiag.ru. Ошибки SMTP/Resend не считаются доставкой.
- Дополнительные ошибки: native POST не раскрывает пароль в URL; обработаны размеры/таймауты тел запросов и изображений; реальное AVIF кодирование, ориентация и размеры; слой мобильного меню кабинета расположен над header. Цвета, размеры и тарифная страница не переработаны.
- CI: добавлены push-триггеры main и codex/**. В исходном commit main GitHub check-runs отсутствовали; локальный результат не выдаётся за зелёный GitHub CI.

## Локальная проверка

| Проверка | Результат |
| --- | --- |
| Workspace | 80 passed |
| Registry / tool-core | 10 / 20 passed |
| Web Vitest | 693 passed, 151 files |
| API + worker Pytest | 757 passed, 3 skipped (платформа), 1 warning Starlette/httpx |
| TypeScript / Ruff | passed / passed |
| ESLint | 0 errors, 27 warnings; предупреждения не скрыты |
| Public production build | passed; 236 public routes, 234 HTML routes with localized metadata and JSON-LD |
| Browser, headless Brave | 116 passed / 117; один тест контраста Lighthouse не пройден |
| OAuth/account/checkout/tariff browser scenarios | 22 passed |
| Dokploy Compose equivalence / missing-credential rejection / broker overlay credential isolation | 3 passed |
| Effective core Compose preflight, AI disabled/enabled | passed с отдельными тестовыми секретами; контейнеры локально не запускались |
| Optional broker AI Compose preflight | passed, 5 services; core polling отключён, provider key доступен отдельному worker |

Независимая проверка кода ограничивалась OAuth/recovery, оплатой/периодами и доступностью AI. Обнаруженные P1 pre-account hijack и P2 потеря оплаченного периода исправлены и повторно проверены. Это не утверждение независимого аудита всего проекта.

## Подтверждённая production-диагностика до обновления

- Основной commit в Git совпадал с проверенным deployment Dokploy.
- Запущенный web-контейнер не получал Resend API key, EMAIL_FROM, SMTP password и contact recipient, хотя настройки были сохранены в Dokploy.
- Из того же контейнера smtp.nevtan.com:465 отвечал SMTP banner и проходил TLS certificate verification; mail.nevtan.com:465 завершался timeout. Требуется исправить существующий override SMTP host в Dokploy.
- support@webdiag.ru существует и активен в Nevtan. Root MX — smtp.nevtan.com. SPF Nevtan и DKIM присутствуют.
- Resend: webdiag.ru Verified, sending включён, receiving выключен. DKIM и CNAME rsend/send совпадают с DNS. Ключ WebDiag имеет Sending access только для webdiag.ru и не имел использования на момент проверки.
- Фактическая DMARC policy в DNS — p=none; надпись quarantine в Nevtan не является фактической опубликованной policy.

## Оставшиеся границы

Контраст Lighthouse требует изменения цветов; тест не отключён, оформление сохранено согласно ограничению пользователя. Полный browser/CI gate поэтому не зелёный.

Descriptions существующих тарифов сохранены. Платёж и срок действия реализованы, но тарифные quotas, seats, white-label и priority queues не полностью связаны с plan state; обещанные 10 AI-сценариев и crawler limits 500/10000 не подтверждены текущим runtime (6 сценариев, core budget 100). Эти возможности нельзя считать реализованными только по успешной оплате.

Новые изменения не опубликованы и не развёрнуты. Для production приёмки нужны: корректные текущие секреты в private окружении; совпадающие account/AI internal tokens; включение runtime; Lava offer с Price on request via API и webhook X-Api-Key; реальные OAuth/mail/AI/payment receipts и readback. Оплата и отправка тестовых писем в ходе локальных проверок не выполнялись.
