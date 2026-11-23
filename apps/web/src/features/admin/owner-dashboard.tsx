
"use client";

import { ArrowUpRight, BarChart3, CreditCard, LayoutDashboard, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Client, ClientFilters, Currency, Days, ListPage, Overview, Payment, PaymentFilters, Usage } from "./admin-contract";
import { adminLoginPath } from "./admin-routing";

const PERIODS = ["7", "30", "90"] as const;
const SECTIONS = [
  ["overview", "Обзор", "Overview", LayoutDashboard],
  ["clients", "Клиенты", "Clients", Users],
  ["payments", "Платежи", "Payments", CreditCard],
  ["usage", "Использование", "Usage", BarChart3],
] as const;
type Section = (typeof SECTIONS)[number][0];
type Translate = (ru: string, en: string) => string;
type Payload =
  | { section: "overview"; data: Overview }
  | { section: "clients"; data: ListPage<Client> }
  | { section: "payments"; data: ListPage<Payment> }
  | { section: "usage"; data: Usage };
type LoadResult = { key: string } & ({ payload: Payload } | { status: number });

const DEFAULT_CLIENTS: ClientFilters = { days: "", segment: "", email: "" };
const DEFAULT_PAYMENTS: PaymentFilters = { days: "", date_basis: "created", state: "", currency: "", kind: "" };
const PLANS = { pro: "Pro", team: "Team", starter: "Starter" };

function Select<Value extends string>({ label, value, options, onChange }: {
  label: string;
  value: Value;
  options: ReadonlyArray<readonly [Value, string]>;
  onChange: (value: Value) => void;
}) {
  return <label className="wd-owner-field">
    <span>{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value as Value)}>
      {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
    </select>
  </label>;
}

function Period({ value, all, onChange, t, label }: {
  value: Days | ""; all?: boolean; onChange: (value: Days | "") => void; t: Translate; label?: string;
}) {
  const options: Array<[Days | "", string]> = PERIODS.map((day) => [day, t(day + " дней", day + " days")]);
  if (all) options.unshift(["", t("За всё время", "All time")]);
  return <Select label={label ?? t("Период", "Period")} value={value} options={options} onChange={onChange} />;
}

function Metric({ label, value, onClick }: { label: string; value: ReactNode; onClick?: () => void }) {
  const body = <>
    <span className="wd-owner-metric-label">{label}</span>
    <strong>{value}</strong>
    {onClick && <ArrowUpRight aria-hidden="true" size={17} />}
  </>;
  return onClick
    ? <button className="wd-owner-metric" type="button" onClick={onClick}>{body}</button>
    : <div className="wd-owner-metric">{body}</div>;
}

function Breakdown({ rows, t, number }: {
  rows: Array<[string, number]>; t: Translate; number: Intl.NumberFormat;
}) {
  return <dl className="wd-owner-breakdown" aria-label={t("Количество по состояниям", "Counts by status")}>
    {rows.map(([name, count]) => <div key={name}><dt>{name}</dt><dd>{number.format(count)}</dd></div>)}
  </dl>;
}

function UsageDetails({ data, t, number }: { data: Usage; t: Translate; number: Intl.NumberFormat }) {
  return <div className="wd-owner-usage-grid">
    <section className="wd-owner-panel">
      <h2>{t("Запуски ИИ", "AI runs")}</h2>
      <p>{t("Текущее состояние запусков, созданных за период.", "Current status of runs created during the period.")}</p>
      <Breakdown t={t} number={number} rows={[
        [t("Успешно", "Succeeded"), data.ai.succeeded],
        [t("Ошибка", "Failed"), data.ai.failed],
        [t("Неизвестный результат провайдера", "Unknown provider outcome"), data.ai.provider_unknown],
        [t("Ожидают", "Pending"), data.ai.pending],
        [t("Выполняются", "Running"), data.ai.running],
        [t("Удалены", "Deleted"), data.ai.deleted],
      ]} />
    </section>
    <section className="wd-owner-panel">
      <h2>{t("Аудиты и мониторинг", "Audits and monitoring")}</h2>
      <Breakdown t={t} number={number} rows={[
        [t("Аудиты, сохранённые в проекты", "Audits saved to projects"), data.saved_audits],
        [t("Мониторинг без изменений", "Monitoring without changes"), data.monitoring.passed],
        [t("Мониторинг с изменениями", "Monitoring with changes"), data.monitoring.changed],
        [t("Ошибки мониторинга", "Monitoring failures"), data.monitoring.failed],
      ]} />
      <p>{t("Общее число клиентских аудитов недоступно. Публичные проверки могут запускаться анонимно.", "Total customer audits are unavailable. Public audits can run anonymously.")}</p>
      <p>{t("Мониторинг учитывает до 100 последних проверок каждого монитора из сохранённой истории.", "Monitoring uses the last 100 checks per monitor still in retained history.")}</p>
    </section>
  </div>;
}

function DataTable({ title, columns, rows, t }: {
  title: string; columns: string[]; rows: Array<{ id: string; cells: ReactNode[] }>; t: Translate;
}) {
  if (!rows.length) return <p className="wd-owner-panel wd-owner-notice" role="status">
    {t("По выбранным фильтрам ничего не найдено.", "No results match the selected filters.")}
  </p>;
  return <div className="wd-owner-panel wd-owner-table" tabIndex={0} role="region" aria-label={title}>
    <table aria-label={title}>
      <thead><tr>{columns.map((name) => <th scope="col" key={name}>{name}</th>)}</tr></thead>
      <tbody>{rows.map(({ id, cells }) => <tr key={id}>
        {cells.map((cell, index) => index === 0
          ? <th scope="row" key={columns[index]}>{cell}</th>
          : <td key={columns[index]}>{cell}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

export function OwnerDashboard({ locale }: { locale: "ru" | "en" }) {
  const [section, setSection] = useState<Section>("overview");
  const [days, setDays] = useState<Days>("30");
  const [page, setPage] = useState(1);
  const [clients, setClients] = useState(DEFAULT_CLIENTS);
  const [payment, setPayment] = useState(DEFAULT_PAYMENTS);
  const [emailDraft, setEmailDraft] = useState("");
  const [result, setResult] = useState<LoadResult>();
  const [requestVersion, setRequestVersion] = useState(0);
  const dataRef = useRef<HTMLDivElement>(null);
  const t: Translate = (ru, en) => locale === "ru" ? ru : en;
  const number = new Intl.NumberFormat(locale);
  const time = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const date = (unix: number | null) => unix === null ? "—" : time.format(unix * 1_000);
  const money = (minor: number, currency: Currency) => new Intl.NumberFormat(locale, {
    style: "currency", currency, currencyDisplay: "code",
  }).format(minor / 100);

  const params = new URLSearchParams();
  if (section === "clients") {
    params.set("page", String(page));
    if (clients.days) params.set("days", clients.days);
    if (clients.segment) params.set("segment", clients.segment);
  } else if (section === "payments") {
    params.set("page", String(page));
    for (const [field, value] of Object.entries(payment)) if (value) params.set(field, value);
  } else {
    params.set("days", days);
  }
  const url = "/api/admin/" + section + "?" + params.toString();
  const email = section === "clients" ? clients.email : "";
  const key = JSON.stringify([url, email, requestVersion]);
  const current = result?.key === key ? result : undefined;
  const payload = current && "payload" in current ? current.payload : undefined;
  const status = current && "status" in current ? current.status : undefined;

  useEffect(() => {
    const target = dataRef.current;
    const hide = () => { if (target) target.hidden = true; };
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: email ? { "x-admin-email-query": encodeURIComponent(email) } : {},
    }).then(async (response) => {
      const next: LoadResult = response.ok
        ? { key, payload: { section, data: await response.json() } as Payload }
        : { key, status: response.status };
      if (!controller.signal.aborted) setResult(next);
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ key, status: 503 });
    });
    return () => controller.abort();
  }, [url, key, section, email]);

  function requestFreshData() {
    setRequestVersion((value) => value + 1);
  }

  function goToPage(next: number) {
    setPage(next);
    requestFreshData();
  }

  function open(next: Section) {
    goToPage(1);
    setSection(next);
  }

  function openClients(filters: Partial<ClientFilters> = {}) {
    setClients({ ...DEFAULT_CLIENTS, ...filters });
    setEmailDraft("");
    open("clients");
  }

  function setClientFilters(filters: Partial<ClientFilters>) {
    setClients((current) => ({ ...current, ...filters }));
    goToPage(1);
  }

  function openPayments(filters: Partial<PaymentFilters>) {
    setPayment({ ...DEFAULT_PAYMENTS, ...filters });
    open("payments");
  }

  function setPaymentFilters(filters: Partial<PaymentFilters>) {
    setPayment((current) => ({ ...current, ...filters }));
    goToPage(1);
  }

  return <div className="wd-owner-data" ref={dataRef}>
    <nav className="wd-owner-nav" aria-label={t("Разделы кабинета владельца", "Owner dashboard sections")}>
      {SECTIONS.map(([id, ru, en, Icon]) => <button key={id} type="button"
        aria-current={section === id ? "page" : undefined} onClick={() => open(id)}>
        <Icon size={17} aria-hidden="true" />{t(ru, en)}
      </button>)}
    </nav>

    {status !== 401 && status !== 403 && <div className="wd-owner-filters">
      {(section === "overview" || section === "usage") && <Period t={t} value={days} onChange={(value) => { if (value) { setDays(value); requestFreshData(); } }} />}
      {section === "clients" && <>
        <form className="wd-owner-search" onSubmit={(event) => {
          event.preventDefault();
          setClientFilters({ email: emailDraft.trim() });
        }}>
          <label className="wd-owner-field">
            <span>{t("Поиск по email", "Search by email")}</span>
            <input type="search" name="email" autoComplete="off" maxLength={254} value={emailDraft}
              onChange={(event) => {
                setEmailDraft(event.target.value);
                if (!event.target.value) setClientFilters({ email: "" });
              }} />
          </label>
          <button type="submit" className="wd-button wd-button-secondary">{t("Найти", "Search")}</button>
        </form>
        <Period label={t("Регистрация", "Registration")} t={t} value={clients.days} all onChange={(value) => setClientFilters({ days: value })} />
        <Select label={t("Доступ", "Access")} value={clients.segment} onChange={(value) => setClientFilters({ segment: value })}
          options={[["", t("Все клиенты", "All clients")], ["pro", "Pro"], ["team", "Team"], ["expiring", t("Окончание до 7 дней", "Ends within 7 days")]]} />
      </>}
      {section === "payments" && <>
        <Select label={t("Дата для фильтра", "Date basis")} value={payment.date_basis}
          onChange={(value) => setPaymentFilters({ date_basis: value, state: value === "created" ? "" : "paid", ...(value === "unknown" ? { days: "" } : {}) })}
          options={[["created", t("Создание счёта", "Invoice created")], ["paid", t("Подтверждение оплаты", "Payment confirmed")], ["unknown", t("Дата оплаты неизвестна", "Confirmation date unknown")]]} />
        {payment.date_basis !== "unknown" && <Period t={t} value={payment.days} all onChange={(value) => setPaymentFilters({ days: value })} />}
        {payment.date_basis === "created" && <Select label={t("Статус", "Status")} value={payment.state}
          onChange={(value) => setPaymentFilters({ state: value })} options={[["", t("Все", "All")], ["paid", t("Оплачен", "Paid")], ["pending", t("Ожидает оплаты", "Pending")]]} />}
        <Select label={t("Валюта", "Currency")} value={payment.currency} onChange={(value) => setPaymentFilters({ currency: value })}
          options={[["", t("Все", "All")], ["RUB", "RUB"], ["USD", "USD"]]} />
        <Select label={t("Тип покупки", "Purchase type")} value={payment.kind} onChange={(value) => setPaymentFilters({ kind: value })}
          options={[["", t("Все", "All")], ["pro", "Pro"], ["team", "Team"], ["credits", t("Пакет кредитов", "Credit pack")]]} />
      </>}
    </div>}

    {!current && <p className="wd-owner-panel wd-owner-notice" role="status">{t("Загружаем данные…", "Loading dashboard data…")}</p>}
    {status && <div className="wd-owner-panel wd-owner-notice">
      <p role="alert">{status === 401 ? t("Сессия завершилась. Войдите заново.", "Your session ended. Sign in again.")
        : status === 403 ? t("Кабинет доступен владельцу WebDiag.", "This dashboard is available to the WebDiag owner.")
          : status === 422 ? t("Проверьте поисковый запрос и фильтры.", "Check the search term and filters.")
            : t("Данные кабинета временно недоступны.", "Dashboard data is temporarily unavailable.")}</p>
      {status === 401 && <a className="wd-button wd-button-primary" href={adminLoginPath(locale)}>{t("Войти", "Sign in")}</a>}
      {status >= 500 && <button type="button" className="wd-button wd-button-secondary" onClick={requestFreshData}>{t("Повторить", "Retry")}</button>}
    </div>}

    {payload?.section === "overview" && <>
      <div className="wd-owner-summary">
        <section className="wd-owner-panel">
          <h2>{t("Регистрации", "Registrations")}</h2>
          <div className="wd-owner-metrics">
            <Metric label={t("Всего клиентов", "Total clients")} value={number.format(payload.data.users_total)} onClick={() => openClients()} />
            {PERIODS.map((range) => <Metric key={range} label={t("За " + range + " дней", "Last " + range + " days")}
              value={number.format(payload.data.registrations[range])} onClick={() => openClients({ days: range })} />)}
          </div>
        </section>
        <section className="wd-owner-panel">
          <h2>{t("Оплаченный доступ", "Paid access")}</h2>
          <div className="wd-owner-metrics">
            <Metric label="Pro" value={number.format(payload.data.paid_access.pro)} onClick={() => openClients({ segment: "pro" })} />
            <Metric label="Team" value={number.format(payload.data.paid_access.team)} onClick={() => openClients({ segment: "team" })} />
            <Metric label={t("Окончание до 7 дней", "Ends within 7 days")} value={number.format(payload.data.expiring_soon)} onClick={() => openClients({ segment: "expiring" })} />
          </div>
        </section>
        <section className="wd-owner-panel">
          <h2>{t("Подтверждённые оплаты", "Confirmed payments")}</h2>
          {payload.data.payments.length === 0 && <p>{t("За выбранный период подтверждённых оплат с известной датой нет.", "No confirmed payments with a known date in this period.")}</p>}
          <div className="wd-owner-metrics">
            {payload.data.payments.map((item) => <Metric key={item.currency}
              label={t("Оплачено счетов (" + item.currency + ")", "Paid invoices (" + item.currency + ")") + " · " + number.format(item.count)}
              value={money(item.amount_minor, item.currency)}
              onClick={() => openPayments({ days, date_basis: "paid", currency: item.currency })} />)}
            <Metric label={t("Оплачено без даты (за всё время)", "Paid without a date (all time)")}
              value={number.format(payload.data.payments_without_date)}
              onClick={() => openPayments({ date_basis: "unknown" })} />
          </div>
        </section>
        <section className="wd-owner-panel">
          <h2>{t("Использование", "Usage")}</h2>
          <div className="wd-owner-metrics">
            <Metric label={t("ИИ успешно", "AI succeeded")} value={number.format(payload.data.usage.ai.succeeded)} onClick={() => open("usage")} />
            <Metric label={t("ИИ с ошибкой", "AI failed")} value={number.format(payload.data.usage.ai.failed)} onClick={() => open("usage")} />
            <Metric label={t("Результат ИИ неизвестен", "AI outcome unknown")} value={number.format(payload.data.usage.ai.provider_unknown)} onClick={() => open("usage")} />
            <Metric label={t("Доступные кредиты на балансах", "Available credits across accounts")} value={number.format(payload.data.available_credits)} onClick={() => openClients()} />
            <Metric label={t("Сохранённые аудиты", "Saved audits")} value={number.format(payload.data.usage.saved_audits)} onClick={() => open("usage")} />
            <Metric label={t("Проверки в истории мониторинга", "Retained monitoring checks")}
              value={number.format(Object.values(payload.data.usage.monitoring).reduce((sum, value) => sum + value, 0))} onClick={() => open("usage")} />
          </div>
        </section>
      </div>
      <p className="wd-owner-note">{t("Данные на", "As of")} {date(payload.data.as_of)} UTC</p>
    </>}

    {payload?.section === "clients" && <>
      <DataTable t={t} title={t("Клиенты", "Clients")}
        columns={["Email", t("Регистрация", "Registered"), t("Статус", "Status"), t("План", "Plan"), t("Окончание доступа", "Access ends"), t("Доступные кредиты", "Available credits")]}
        rows={payload.data.items.map((row) => ({ id: row.id, cells: [
          row.email, date(row.created_at), t("Зарегистрирован", "Registered"),
          PLANS[row.plan], date(row.expires_at), number.format(row.available_credits),
        ] }))} />
      <p className="wd-owner-note">{t("Даты в UTC. В WebDiag нет единого статуса подтверждения email.", "Dates in UTC. WebDiag has no account-wide email verification status.")}</p>
    </>}

    {payload?.section === "payments" && <>
      <DataTable t={t} title={t("Платежи", "Payments")}
        columns={[t("Продукт", "Product"), t("Создан", "Created"), t("Оплата подтверждена", "Confirmed"), t("Сумма", "Amount"), t("Статус", "Status")]}
        rows={payload.data.items.map((row) => ({ id: row.id, cells: [
          row.plan_id ? PLANS[row.plan_id] + " · " + t(row.duration_days + " дней", row.duration_days + " days")
            : t("Пакет · " + row.credits + " кредитов", "Pack · " + row.credits + " credits"),
          date(row.created_at), row.state === "paid" && row.paid_at === null ? t("Неизвестно", "Unknown") : date(row.paid_at),
          money(row.amount_minor, row.currency), row.state === "paid" ? t("Оплачен", "Paid") : t("Ожидает оплаты", "Pending"),
        ] }))} />
      <p className="wd-owner-note">{t("Даты в UTC. Для возвратов и споров в WebDiag нет сохранённых статусов.", "Dates in UTC. WebDiag has no stored refund or dispute statuses.")}</p>
    </>}

    {payload?.section === "usage" && <UsageDetails data={payload.data} t={t} number={number} />}

    {(payload?.section === "clients" || payload?.section === "payments") && (page > 1 || payload.data.has_next) &&
      <div className="wd-owner-pagination" aria-label={t("Страницы результатов", "Result pages")}>
        <button className="wd-button wd-button-secondary" type="button" disabled={page === 1} onClick={() => goToPage(page - 1)}>{t("Назад", "Previous")}</button>
        <span>{t("Страница", "Page")} {number.format(page)}</span>
        <button className="wd-button wd-button-secondary" type="button" disabled={!payload.data.has_next || page === 10_000} onClick={() => goToPage(page + 1)}>{t("Далее", "Next")}</button>
      </div>}
  </div>;
}
