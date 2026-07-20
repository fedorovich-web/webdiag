# RISKS.md

| ID | Риск | Вероятность | Impact | Severity | Control |
|---|---|---:|---:|---:|---|
| R-001 | Scope creep сверх утверждённых 110 инструментов | Высокая | Высокий | Critical | Freeze registry at 110 until beta |
| R-002 | 100 страниц превращаются в thin SEO pages | Средняя | Высокий | High | Unique intent/content/output gate |
| R-003 | SSRF/DNS rebinding | Средняя | Критический | Critical | URL Gateway + egress + negative tests |
| R-004 | Сервис используется для нагрузки на чужие сайты | Средняя | Критический | Critical | Per-host limits, budgets, abuse response |
| R-005 | Слабые/ложные результаты аудита | Средняя | Высокий | High | Versioning, evidence, failed_to_measure |
| R-006 | Chromium workers съедают бюджет | Высокая | Высокий | High | Queue, quotas, isolation, caching |
| R-007 | Месячный срок приводит к заглушкам | Высокая | Высокий | High | DoD: placeholder не считается инструментом |
| R-008 | Число инструментов расходится на страницах | Средняя | Средний | Medium | Registry as source of truth |
| R-009 | Свежие версии зависимостей несовместимы с Python 3.14 | Средняя | Средний | Medium | Compatibility spike + lock + fallback 3.13 |
| R-010 | WebDiag конфликтует с существующим международным названием | Средняя | Средний | Medium | Trademark/legal clearance до широкого продвижения |
| R-011 | Домен webdiag.ru не зарегистрирован фактически | Низкая/неизвестно | Высокий | High | Подтверждение пользователя и registrar evidence |
| R-012 | Бесплатные инструменты затмевают core SaaS | Средняя | Высокий | High | Product navigation and CTA governance |

| R-013 | RU/EN content drift | Средняя | Высокий | High | Translation groups, locale QA, hreflang tests |
| R-014 | Массовый слабый блог ради SEO | Средняя | Высокий | High | Editorial governance and publication gates |
| R-015 | Image processing consumes excessive memory | Средняя | Средний | Medium | Browser-first, dimension/file limits |
