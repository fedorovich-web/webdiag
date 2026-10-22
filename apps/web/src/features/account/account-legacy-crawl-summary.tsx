import type { Locale } from "@webdiag/tool-registry";
import type { AccountCrawlDetail } from "./account-workspace-contract";
import styles from "./account-crawl-summary.module.css";

export function AccountLegacyCrawlSummary({ locale, detail, historyCount }: {
  readonly locale: Locale;
  readonly detail: AccountCrawlDetail;
  readonly historyCount: number;
}) {
  const ru = locale === "ru";
  const result = detail.result;
  if (!result) return <p>{ru ? "Исторический результат недоступен." : "The historical result is unavailable."}</p>;
  const duplicatePages = new Set([...result.duplicate_titles, ...result.duplicate_descriptions]
    .flatMap((group) => group.urls)).size;
  const failures = ru ? {
    fetch_failed: "Не удалось загрузить", not_html: "Ответ не является HTML", robots_disallowed: "Закрыто в robots.txt",
  } : { fetch_failed: "Fetch failed", not_html: "Non-HTML response", robots_disallowed: "Excluded by robots.txt" };
  return <div className={`wd-crawl-result ${styles.result}`}>
    <div className="wd-crawl-result-meta">
      <strong>{ru ? "Историческая проверка страниц" : "Historical page check"}</strong>
      <span>{ru ? `История: ${historyCount}` : `History: ${historyCount}`}</span>
      <time dateTime={result.completed_at}>{new Intl.DateTimeFormat(ru ? "ru-RU" : "en-US", {
        dateStyle: "medium", timeStyle: "short",
      }).format(new Date(result.completed_at))}</time>
    </div>
    <p>{ru
      ? "Это сохранённый результат прежнего обхода. Оценки и замечания полного аудита в нём не сохранены."
      : "This is a saved result from the previous crawl. Full audit scores and findings were not stored."}</p>
    <p>{ru ? "Запустите новую проверку страниц, чтобы получить текущий отчёт аудита."
      : "Run a new page check to get a current audit report."}</p>
    <dl>
      <div><dt>{ru ? "Проверено страниц" : "Pages checked"}</dt><dd>{result.pages.length}</dd></div>
      <div><dt>{ru ? "Страниц с дублями" : "Pages with duplicates"}</dt><dd>{duplicatePages}</dd></div>
      <div><dt>{ru ? "Кандидаты без внутренних ссылок" : "Unlinked candidates"}</dt><dd>{result.orphan_urls.length}</dd></div>
      <div><dt>{ru ? "Не проверено" : "Not checked"}</dt><dd>{result.page_failures.length}</dd></div>
    </dl>
    {result.page_budget_exhausted && <p className="wd-crawl-limit-note">{ru
      ? `Обход был ограничен; лимит страниц: ${result.page_limit}. Результат не описывает весь сайт.`
      : `The crawl was limited; page limit: ${result.page_limit}. The result does not describe the whole site.`}</p>}
    <p>{ru ? "Показаны сохранённые данные обнаруженных страниц; охват всего сайта не гарантируется."
      : "Showing stored data for discovered pages; whole-site coverage is not guaranteed."}</p>
    <div className="wd-crawl-findings">
      {[{ title: ru ? "Повторяющиеся title" : "Duplicate titles", groups: result.duplicate_titles },
        { title: ru ? "Повторяющиеся метаописания" : "Duplicate descriptions", groups: result.duplicate_descriptions }]
        .filter(({ groups }) => groups.length > 0).map(({ title, groups }) => <details key={title}>
          <summary>{title}: {groups.length}</summary>
          {groups.map((group) => <div key={group.value}><p>{group.value}</p>
            <ul>{group.urls.map((url) => <li key={url}>{url}</li>)}</ul></div>)}
        </details>)}
      {result.orphan_urls.length > 0 && <details>
        <summary>{ru ? "Кандидаты без внутренних ссылок" : "Unlinked candidates"}</summary>
        <ul>{result.orphan_urls.map((url) => <li key={url}>{url}</li>)}</ul>
      </details>}
      {result.page_failures.length > 0 && <details>
        <summary>{ru ? "Ошибки и исключённые страницы" : "Failures and excluded pages"}</summary>
        <ul>{result.page_failures.map((failure) => <li key={failure.url}>{failure.url} — {failures[failure.code]}</li>)}</ul>
      </details>}
      <details>
        <summary>{ru ? "Проверенные страницы" : "Checked pages"}</summary>
        <ul>{result.pages.map((page) => <li key={page.url}>{page.url} — HTTP {page.status_code}</li>)}</ul>
      </details>
    </div>
  </div>;
}
