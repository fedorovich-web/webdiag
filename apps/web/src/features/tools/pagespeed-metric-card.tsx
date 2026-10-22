import type { Locale } from "@webdiag/tool-registry";
import { statusLabel, type PageSpeedMetricResponse } from "./performance-tool-contract";

const metricTitlesRu: Record<string, string> = {
  "largest-contentful-paint": "LCP — Отрисовка крупнейшего элемента",
  "first-contentful-paint": "FCP — Первая отрисовка контента",
  "total-blocking-time": "TBT — Суммарное время блокировки",
  "cumulative-layout-shift": "CLS — Совокупное смещение элементов",
  "interaction_to_next_paint": "INP — Время до следующей отрисовки",
  "speed-index": "SI — Индекс скорости",
  "time-to-first-byte": "TTFB — Время до первого байта",
};

const metricGuideRu: Record<string, { good: string; bad: string; tip: string }> = {
  "largest-contentful-paint": { good: "≤ 2.5 с — Хорошо", bad: "> 4 с — Плохо", tip: "Оптимизируйте изображения (AVIF/WebP), добавьте <link rel=\"preload\"> для LCP-элемента, улучшите TTFB." },
  "first-contentful-paint": { good: "≤ 1.8 с — Хорошо", bad: "> 3 с — Медленно", tip: "Уберите блокирующие CSS/JS (defer/async), используйте CDN, включите серверное кэширование." },
  "total-blocking-time": { good: "≤ 200 мс — Хорошо", bad: "> 600 мс — Критично", tip: "Разбейте длинные JS-задачи (>50 мс) на чанки, используйте Web Workers, удалите неиспользуемые скрипты." },
  "cumulative-layout-shift": { good: "≤ 0.1 — Хорошо", bad: "> 0.25 — Плохо", tip: "Задайте явные width/height или aspect-ratio для изображений и видео. Не вставляйте динамический контент над уже загруженным." },
  "interaction_to_next_paint": { good: "≤ 200 мс — Хорошо", bad: "> 500 мс — Плохо", tip: "Оптимизируйте обработчики событий, перенесите тяжёлые вычисления в Web Workers, используйте debounce." },
  "speed-index": { good: "≤ 3.4 с — Хорошо", bad: "> 5.8 с — Медленно", tip: "Сократите критический CSS, используйте font-display: swap для шрифтов, оптимизируйте порядок загрузки ресурсов." },
  "time-to-first-byte": { good: "≤ 800 мс — Хорошо", bad: "> 1800 мс — Медленно", tip: "Настройте серверный кэш (Redis/Varnish), используйте CDN, оптимизируйте запросы к базе данных." },
};

export function PageSpeedMetricCard({ locale, metric }: { locale: Locale; metric: PageSpeedMetricResponse }) {
  const ru = locale === "ru";
  const guide = ru ? metricGuideRu[metric.id] : undefined;
  const title = ru ? metricTitlesRu[metric.id] ?? metric.title : metric.title;
  const unavailable = metric.status === "unavailable";
  const warning = metric.status === "warning";
  const failed = metric.status === "fail";
  const color = unavailable ? "var(--muted)" : failed ? "var(--danger)" : warning ? "var(--warning)" : "var(--success)";
  const explanation = unavailable
    ? (ru ? "Нет данных" : "No data")
    : warning ? (ru ? "Требует улучшения" : "Needs improvement")
    : guide ? (failed ? guide.bad : guide.good) : statusLabel(metric.status, locale);

  return <div style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--wd-l, #e2e8f0)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: "13px", display: "block", color: "var(--wd-f, #0f172a)" }}>{title}</strong>
        <small style={{ color, fontSize: "11px" }}>{explanation}</small>
        <small style={{ display: "block", color: "var(--muted)" }}>{metric.source === "field"
          ? (ru ? "Полевые данные" : "Field data") : (ru ? "Лабораторные данные" : "Lab data")}</small>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <strong style={{ fontSize: "15px", color }}>{unavailable ? "—" : metric.display_value ?? metric.value ?? "—"}</strong>
        <span className={`tool-badge${unavailable ? "" : failed ? " tool-badge-danger" : warning ? " tool-badge-warning" : " tool-badge-success"}`} style={{ fontSize: "10px" }}>
          {statusLabel(metric.status, locale)}
        </span>
      </div>
    </div>
    {guide && (failed || warning) && <div style={{ fontSize: "12px", color: "var(--muted)", paddingTop: "8px" }}>
      <strong style={{ display: "block", marginBottom: "2px" }}>{ru ? "Что исправить:" : "How to fix:"}</strong>
      {guide.tip}
    </div>}
  </div>;
}
