from __future__ import annotations

import hashlib
import html
import re
from datetime import UTC, datetime

from webdiag_api.accounts.report_models import ReportSnapshot
from webdiag_api.accounts.workspace_models import SavedAuditDetailResponse

_FILENAME_RE = re.compile(r"[^a-z0-9-]+")


def normalize_report_title(raw_title: str) -> str:
    value = " ".join(raw_title.split())
    if not 2 <= len(value) <= 120:
        raise ValueError("account_report_title_invalid")
    return value


def build_report_snapshot(
    detail: SavedAuditDetailResponse,
    *,
    title: str,
    locale: str,
    generated_at: datetime | None = None,
) -> ReportSnapshot:
    normalized_title = normalize_report_title(title)
    if locale not in {"ru", "en"}:
        raise ValueError("account_report_locale_invalid")
    return ReportSnapshot(
        title=normalized_title,
        locale=locale,
        project_name=detail.project.name,
        target_origin=detail.payload.target_origin,
        audit_completed_at=detail.payload.completed_at,
        score=detail.payload.score,
        checks=detail.payload.checks,
        issues=detail.payload.issues,
        generated_at=(generated_at or datetime.now(UTC)).astimezone(UTC),
    )


def report_filename(title: str, report_id: str) -> str:
    base = _FILENAME_RE.sub("-", title.lower()).strip("-")[:48] or "webdiag-report"
    return f"{base}-{report_id[:8]}.html"


def _escape(value: object) -> str:
    return html.escape(str(value), quote=True)


def _labels(locale: str) -> dict[str, str]:
    if locale == "ru":
        return {
            "subtitle": "Сохранённый отчёт WebDiag",
            "origin": "Сайт",
            "audit_date": "Дата аудита",
            "generated": "Отчёт создан",
            "score": "Оценка",
            "checks": "Проверки",
            "name": "Проверка",
            "category": "Категория",
            "status": "Статус",
            "issues": "Проблемы и рекомендации",
            "no_issues": "Проблем не найдено.",
            "affected": "Затронутые страницы",
            "steps": "Что сделать",
            "impact": "Ожидаемый эффект",
            "print_note": "Для PDF используйте печать браузера и выберите «Сохранить как PDF».",
        }
    return {
        "subtitle": "Saved WebDiag report",
        "origin": "Website",
        "audit_date": "Audit date",
        "generated": "Report generated",
        "score": "Score",
        "checks": "Checks",
        "name": "Check",
        "category": "Category",
        "status": "Status",
        "issues": "Issues and recommendations",
        "no_issues": "No issues were found.",
        "affected": "Affected pages",
        "steps": "What to do",
        "impact": "Expected impact",
        "print_note": "To create a PDF, use the browser Print command and choose Save as PDF.",
    }


def render_report_html(snapshot: ReportSnapshot) -> bytes:
    labels = _labels(snapshot.locale)
    score = "—" if snapshot.score is None else f"{snapshot.score}/100"
    check_rows = "".join(
        "<tr>"
        f"<td>{_escape(check.name)}</td>"
        f"<td>{_escape(check.category)}</td>"
        f"<td>{_escape(check.status)}</td>"
        "</tr>"
        for check in snapshot.checks
    )
    issue_blocks: list[str] = []
    for issue in snapshot.issues:
        affected = "".join(f"<li>{_escape(url)}</li>" for url in issue.affected_urls)
        steps = "".join(f"<li>{_escape(step)}</li>" for step in issue.recommendation.steps)
        impact = (
            f"<p><strong>{_escape(labels['impact'])}:</strong> "
            f"{_escape(issue.recommendation.expected_impact)}</p>"
            if issue.recommendation.expected_impact
            else ""
        )
        affected_block = (
            f"<h4>{_escape(labels['affected'])}</h4><ul>{affected}</ul>" if affected else ""
        )
        steps_block = f"<h4>{_escape(labels['steps'])}</h4><ol>{steps}</ol>" if steps else ""
        issue_blocks.append(
            "<article class=\"issue\">"
            f"<header><span>{_escape(issue.priority.upper())}</span>"
            f"<h3>{_escape(issue.title)}</h3></header>"
            f"<p>{_escape(issue.description)}</p>"
            f"<p><strong>{_escape(issue.recommendation.summary)}</strong></p>"
            f"{affected_block}{steps_block}{impact}"
            "</article>"
        )
    issues_html = "".join(issue_blocks) or f"<p>{_escape(labels['no_issues'])}</p>"
    document = f"""<!doctype html>
<html lang="{_escape(snapshot.locale)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
<meta name="referrer" content="no-referrer">
<title>{_escape(snapshot.title)}</title>
<style>
:root {{
  font-family: Arial, sans-serif;
  color: #102129;
  background: #f5f8f7;
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; }}
main {{ max-width: 960px; margin: 0 auto; padding: 40px 24px; }}
header.hero {{
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 40px #10212914;
}}
h1, h2, h3, h4 {{ line-height: 1.2; }}
h1 {{ margin: .25rem 0; font-size: 2rem; }}
.eyebrow {{
  font-size: .8rem;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #35675f;
}}
.score {{ font-size: 2rem; font-weight: 800; white-space: nowrap; }}
.meta {{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
}}
.meta div, section {{ background: #fff; border-radius: 16px; padding: 20px; }}
table {{ width: 100%; border-collapse: collapse; }}
th, td {{
  text-align: left;
  border-bottom: 1px solid #dbe5e2;
  padding: 10px 8px;
  vertical-align: top;
}}
.issue {{
  border: 1px solid #dbe5e2;
  border-radius: 14px;
  padding: 18px;
  margin: 14px 0;
  break-inside: avoid;
}}
.issue header {{ display: flex; gap: 12px; align-items: center; }}
.issue header span {{
  font-weight: 800;
  background: #dff3ed;
  border-radius: 999px;
  padding: 4px 9px;
}}
a {{ color: inherit; }}
.print-note {{ margin: 0 0 16px; color: #49645d; }}
ul, ol {{ padding-left: 22px; }}
@media (max-width: 680px) {{
  header.hero {{ display: block; }}
  .score {{ margin-top: 18px; }}
  .meta {{ grid-template-columns: 1fr; }}
  main {{ padding: 20px 12px; }}
}}
@media print {{
  :root {{ background: #fff; }}
  main {{ max-width: none; padding: 0; }}
  .print-note {{ display: none; }}
  header.hero, section, .meta div {{
    box-shadow: none;
    border: 1px solid #ccd7d4;
  }}
  @page {{ size: A4; margin: 14mm; }}
}}
</style>
</head>
<body>
<main>
<p class="print-note">{_escape(labels['print_note'])}</p>
<header class="hero">
  <div>
    <span class="eyebrow">{_escape(labels['subtitle'])}</span>
    <h1>{_escape(snapshot.title)}</h1>
    <p>{_escape(snapshot.project_name)}</p>
  </div>
  <div class="score">{_escape(score)}</div>
</header>
<div class="meta">
  <div>
    <strong>{_escape(labels['origin'])}</strong><br>
    {_escape(snapshot.target_origin)}
  </div>
  <div>
    <strong>{_escape(labels['audit_date'])}</strong><br>
    {_escape(snapshot.audit_completed_at.isoformat())}
  </div>
  <div>
    <strong>{_escape(labels['generated'])}</strong><br>
    {_escape(snapshot.generated_at.isoformat())}
  </div>
</div>
<section>
  <h2>{_escape(labels['checks'])}</h2>
  <table>
    <thead>
      <tr>
        <th>{_escape(labels['name'])}</th>
        <th>{_escape(labels['category'])}</th>
        <th>{_escape(labels['status'])}</th>
      </tr>
    </thead>
    <tbody>{check_rows}</tbody>
  </table>
</section>
<section><h2>{_escape(labels['issues'])}</h2>{issues_html}</section>
</main>
</body>
</html>
"""
    return document.encode("utf-8")


def artifact_sha256(snapshot: ReportSnapshot) -> str:
    return hashlib.sha256(render_report_html(snapshot)).hexdigest()
