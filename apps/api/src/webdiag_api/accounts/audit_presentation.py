from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from webdiag_api.accounts.report_models import (
    AccountReportDetailResponse,
    PublicReportResponse,
    ReportSnapshot,
)
from webdiag_api.accounts.workspace_models import (
    SavedAuditCheck,
    SavedAuditDetailResponse,
    SavedAuditIssue,
    SavedAuditPayload,
    SavedAuditRecommendation,
)

PresentationLocale = Literal["ru", "en"]


@dataclass(frozen=True, slots=True)
class _IssuePresentation:
    title: str
    description: str
    recommendation: str
    steps: tuple[str, ...]
    expected_impact: str | None


_CHECK_NAMES_RU: dict[str, str] = {
    "http.status": "HTTP-статус",
    "redirects.chain": "Цепочка перенаправлений",
    "content_type.html": "HTML-тип содержимого",
    "metadata.title": "Тег title",
    "metadata.description": "Метаописание",
    "metadata.h1": "Структура H1",
    "metadata.canonical": "Каноническая ссылка",
    "indexability.robots_meta": "Мета-тег robots",
    "metadata.open_graph": "Метаданные Open Graph",
    "structured_data.json_ld": "Структурированные данные JSON-LD",
    "security.headers": "Заголовки безопасности",
    "crawlability.robots_txt": "Файл robots.txt",
    "crawlability.sitemap_xml": "Обнаружение sitemap.xml",
}

_ISSUES_RU: dict[str, _IssuePresentation] = {
    "http.status.server_error": _IssuePresentation(
        "Ответ с ошибкой сервера",
        "Проверяемый URL вернул HTTP-статус 5xx.",
        "Исправьте ошибку сервера до оптимизации второстепенных SEO-сигналов.",
        (
            "Проверьте журналы приложения для проверяемого URL.",
            "Проверьте состояние upstream-сервисов, прокси и развёртывания.",
        ),
        "Восстанавливает доступ поисковых роботов и пользователей к затронутой странице.",
    ),
    "http.status.client_error": _IssuePresentation(
        "Ответ с клиентской ошибкой",
        "Проверяемый URL вернул HTTP-статус 4xx.",
        "Восстановите рабочую страницу или перенаправьте URL на корректный адрес.",
        (
            "Проверьте, должна ли страница быть доступна для индексации.",
            "Для действующей страницы верните 200, для замены — 301 на канонический адрес.",
        ),
        "Предотвращает расход краулингового ресурса и появление нерабочих посадочных страниц.",
    ),
    "redirects.chain.too_long": _IssuePresentation(
        "Слишком длинная цепочка перенаправлений",
        "До конечного ответа URL проходит более двух перенаправлений.",
        "Замените промежуточные перенаправления одним прямым перенаправлением на канонический URL.",
        ("Настройте правила так, чтобы исходный URL сразу вёл на конечный URL.",),
        "Снижает задержку и сохраняет краулинговый ресурс.",
    ),
    "content_type.html.not_html": _IssuePresentation(
        "Ответ не является HTML",
        "Проверяемый URL не вернул HTML-тип содержимого.",
        "Для страниц, которые должны проверяться как посадочные, возвращайте HTML-документ.",
        ("Проверьте маршрутизацию и заголовки ответа для проверяемого URL.",),
        "Позволяет корректно выполнять проверки метаданных, индексируемости и содержимого.",
    ),
    "metadata.title.missing": _IssuePresentation(
        "Отсутствует тег title",
        "В разделе head страницы отсутствует тег title.",
        "Добавьте уникальный title, который описывает тему страницы.",
        ("Сделайте этот сигнал уникальным для каждого важного URL.",),
        "Улучшает качество поискового сниппета и ясность темы страницы.",
    ),
    "metadata.title.too_short": _IssuePresentation(
        "Тег title слишком короткий",
        "Title присутствует, но слишком короток, чтобы ясно описать страницу.",
        "Перепишите title так, чтобы он передавал тему и назначение страницы.",
        ("Сделайте этот сигнал уникальным для каждого важного URL.",),
        "Улучшает качество поискового сниппета и ясность темы страницы.",
    ),
    "metadata.description.missing": _IssuePresentation(
        "Отсутствует метаописание",
        "В разделе head страницы отсутствует метаописание.",
        "Добавьте краткое описание для сниппета страницы.",
        ("Сделайте этот сигнал уникальным для каждого важного URL.",),
        "Улучшает качество поискового сниппета и ясность темы страницы.",
    ),
    "metadata.h1.missing": _IssuePresentation(
        "Отсутствует H1",
        "На странице нет основного заголовка H1.",
        "Добавьте один ясный H1, соответствующий назначению страницы.",
        ("Используйте видимый заголовок, который описывает основную тему страницы.",),
        "Улучшает структуру содержимого и ясность темы страницы.",
    ),
    "metadata.h1.multiple": _IssuePresentation(
        "Несколько заголовков H1",
        "На странице найдено больше одного заголовка H1.",
        "Оставьте один основной H1, а второстепенные заголовки оформите как H2 или H3.",
        ("Проверьте структуру документа и оставьте один основной заголовок.",),
        "Улучшает семантическую согласованность для пользователей и поисковых роботов.",
    ),
    "metadata.canonical.missing": _IssuePresentation(
        "Отсутствует каноническая ссылка",
        "На странице не указан канонический URL.",
        "Добавьте каноническую ссылку на предпочтительный индексируемый URL.",
        ("Укажите в link rel=canonical стабильный конечный URL этой страницы.",),
        "Снижает неоднозначность между дублирующимися URL.",
    ),
    "metadata.canonical.final_url_mismatch": _IssuePresentation(
        "Канонический URL не совпадает с конечным",
        "Канонический URL страницы отличается от конечного URL после перенаправлений.",
        "Согласуйте canonical с конечным индексируемым URL.",
        (
            "Подтвердите предпочтительный URL этой страницы.",
            "Укажите в canonical тот же стабильный конечный URL, "
            "который получают поисковые роботы.",
        ),
        "Снижает неоднозначность дубликатов и канонизации.",
    ),
    "indexability.robots_meta.noindex": _IssuePresentation(
        "Страница помечена noindex",
        "Директивы robots содержат noindex.",
        "Удалите noindex, если страница должна появляться в результатах поиска.",
        ("Подтвердите нужный режим индексации до изменения директивы.",),
        "Позволяет индексировать страницу, когда остальные условия сканирования соблюдены.",
    ),
    "metadata.open_graph.incomplete": _IssuePresentation(
        "Неполные метаданные Open Graph",
        "На странице есть Open Graph, но отсутствует один или несколько "
        "базовых сигналов для предпросмотра.",
        "Заполните title, description и image для Open Graph.",
        (
            "Укажите в og:title ту же тему страницы, что и в title.",
            "Добавьте в og:description краткое описание страницы.",
            "Укажите в og:image стабильный абсолютный URL изображения для предпросмотра.",
        ),
        "Улучшает предпросмотр ссылок в социальных сетях и мессенджерах.",
    ),
    "structured_data.json_ld.invalid": _IssuePresentation(
        "Некорректные структурированные данные JSON-LD",
        "Один или несколько блоков application/ld+json не удалось разобрать как JSON.",
        "Исправьте JSON-LD до использования сигналов расширенных результатов.",
        (
            "Проверьте каждый блок JSON-LD как строгий JSON.",
            "Согласуйте типы schema с видимым содержимым страницы.",
        ),
        "Не позволяет парсерам структурированных данных отбросить schema-сигналы.",
    ),
    "security.headers.missing": _IssuePresentation(
        "Заголовки безопасности требуют внимания",
        "В ответе отсутствует или ослаблен один или несколько базовых заголовков безопасности.",
        "Добавьте совместимые с сайтом базовые заголовки безопасности ответа.",
        (
            "Добавьте X-Content-Type-Options: nosniff.",
            "Настройте Content-Security-Policy после проверки необходимых скриптов и ресурсов.",
            "Используйте Strict-Transport-Security на production-хостах с HTTPS.",
            "Добавьте Referrer-Policy и Permissions-Policy для более строгих настроек браузера.",
        ),
        "Снижает устранимые риски безопасности в браузере.",
    ),
    "crawlability.robots_txt.disallows_target": _IssuePresentation(
        "Robots.txt блокирует проверяемый URL",
        "В robots.txt найдено правило Disallow, которое соответствует пути проверяемого URL.",
        "Разрешите URL в robots.txt, если он должен сканироваться и индексироваться.",
        (
            "Проверьте совпавшее правило Disallow.",
            "Сузьте или удалите правило для индексируемых посадочных страниц.",
        ),
        "Восстанавливает доступ поисковых роботов, если страница должна обнаруживаться.",
    ),
    "crawlability.sitemap_xml.missing": _IssuePresentation(
        "Sitemap.xml не обнаружен",
        "Стандартный адрес /sitemap.xml недоступен для этого сайта.",
        "Опубликуйте sitemap.xml или укажите расположение карты сайта в robots.txt.",
        (
            "По возможности опубликуйте sitemap.xml в корне сайта.",
            "Или добавьте директивы Sitemap в robots.txt.",
        ),
        "Улучшает обнаружение URL поисковыми роботами.",
    ),
    "crawlability.sitemap_xml.invalid": _IssuePresentation(
        "Некорректный sitemap.xml",
        "Обнаруженный sitemap.xml не удалось разобрать как корректный XML.",
        "Исправьте синтаксис XML и создайте sitemap заново.",
        ("Проверьте sitemap.xml валидатором до публикации.",),
        "Позволяет поисковым роботам надёжно обрабатывать списки URL.",
    ),
    "crawlability.sitemap_xml.empty": _IssuePresentation(
        "Sitemap.xml не содержит URL",
        "В обнаруженном sitemap.xml нет элементов loc.",
        "Добавьте важные канонические URL в карту сайта.",
        ("Создайте sitemap.xml заново по списку production-маршрутов.",),
        "Улучшает обнаружение важных страниц поисковыми роботами.",
    ),
}


def _localize_check(check: SavedAuditCheck, locale: PresentationLocale) -> SavedAuditCheck:
    if locale == "en":
        return check.model_copy(deep=True)
    name = _CHECK_NAMES_RU.get(check.check_id)
    if name is None:
        return check.model_copy(deep=True)
    return check.model_copy(update={"name": name}, deep=True)


def _localize_issue(issue: SavedAuditIssue, locale: PresentationLocale) -> SavedAuditIssue:
    if locale == "en":
        return issue.model_copy(deep=True)
    presentation = _ISSUES_RU.get(issue.issue_id)
    if presentation is None:
        return issue.model_copy(deep=True)
    return issue.model_copy(
        update={
            "title": presentation.title,
            "description": presentation.description,
            "recommendation": SavedAuditRecommendation(
                summary=presentation.recommendation,
                steps=presentation.steps,
                expected_impact=presentation.expected_impact,
            ),
        },
        deep=True,
    )


def localize_saved_audit_payload(
    payload: SavedAuditPayload,
    locale: PresentationLocale,
) -> SavedAuditPayload:
    return payload.model_copy(
        update={
            "checks": tuple(_localize_check(check, locale) for check in payload.checks),
            "issues": tuple(_localize_issue(issue, locale) for issue in payload.issues),
        },
        deep=True,
    )


def localize_report_snapshot(snapshot: ReportSnapshot) -> ReportSnapshot:
    payload = SavedAuditPayload(
        target_origin=snapshot.target_origin,
        status="succeeded",
        score=snapshot.score,
        checks=snapshot.checks,
        issues=snapshot.issues,
        completed_at=snapshot.audit_completed_at,
    )
    localized = localize_saved_audit_payload(payload, snapshot.locale)
    return snapshot.model_copy(
        update={"checks": localized.checks, "issues": localized.issues},
        deep=True,
    )


def localize_saved_audit_detail(
    detail: SavedAuditDetailResponse,
    locale: PresentationLocale,
) -> SavedAuditDetailResponse:
    return detail.model_copy(
        update={"payload": localize_saved_audit_payload(detail.payload, locale)},
        deep=True,
    )


def localize_account_report_detail(
    detail: AccountReportDetailResponse,
) -> AccountReportDetailResponse:
    return detail.model_copy(
        update={"snapshot": localize_report_snapshot(detail.snapshot)},
        deep=True,
    )


def localize_public_report(response: PublicReportResponse) -> PublicReportResponse:
    return response.model_copy(
        update={"snapshot": localize_report_snapshot(response.snapshot)},
        deep=True,
    )
