# ASSUMPTIONS.md

| ID | Предположение | Риск если неверно | Проверка | Статус |
|---|---|---|---|---|
| A-001 | `webdiag.ru` будет зарегистрирован пользователем | Потеря бренда/переименование | Подтверждение регистрации | Open |
| A-002 | Основные пользователи — SEO и web professionals | Неверный UX/позиционирование | Interviews, beta analytics | Open |
| A-003 | 110 инструментов дадут органический acquisition | Расход разработки без трафика | Keyword/SERP research + analytics | Open |
| A-004 | 46 browser-only tools можно выпустить быстро и безопасно | Срыв W1 | Technical spike по ключевым libraries | Open |
| A-005 | Python 3.14 совместим с обязательным dependency set | Перенос baseline | CI compatibility matrix | Open |
| A-006 | RabbitMQ оправдан для beta | Излишняя ops-сложность | Load/failure review | Open |
| A-007 | Billing не нужен для закрытой beta | Нет механизма монетизации | Beta plan and invite policy | Accepted for 30-day beta |
| A-008 | 110 инструментов должны выйти одновременно | Release risk | Product decision already made; reassess only on P0 failure | Accepted |

| A-009 | Английская версия нужна с первого релиза | Увеличение объёма контента и QA | Product decision accepted | Accepted |
| A-010 | Блог станет значимым SEO acquisition layer | Расход редакционных ресурсов | SERP research and analytics | Open |
