"use client";

import { useState } from "react";
import type { Locale } from "@webdiag/tool-registry";

interface HomeMonitoringChartProps {
  readonly locale: Locale;
}

interface ChartPoint {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly title: string;
  readonly text: string;
}

const viewBox = { width: 560, height: 128, floor: 106 } as const;

const points: Record<Locale, readonly ChartPoint[]> = {
  ru: [
    { x: 52, y: 84, label: "Янв", title: "Стартовая проверка", text: "SEO-здоровье проекта: 31" },
    { x: 144, y: 86, label: "Фев", title: "Повторная проверка", text: "состояние проекта стабильно" },
    { x: 236, y: 72, label: "Мар", title: "После исправлений", text: "исправлены ошибки мета-тегов" },
    { x: 328, y: 55, label: "Апр", title: "Рост качества", text: "устранены технические проблемы" },
    { x: 420, y: 43, label: "Май", title: "Стабильный результат", text: "основные проверки проходят успешно" },
    { x: 510, y: 42, label: "Июн", title: "Текущее состояние", text: "SEO-здоровье проекта: 78" },
  ],
  en: [
    { x: 52, y: 84, label: "Jan", title: "Initial check", text: "project SEO health: 31" },
    { x: 144, y: 86, label: "Feb", title: "Repeat check", text: "project health is stable" },
    { x: 236, y: 72, label: "Mar", title: "After fixes", text: "metadata issues resolved" },
    { x: 328, y: 55, label: "Apr", title: "Quality improved", text: "technical issues resolved" },
    { x: 420, y: 43, label: "May", title: "Stable result", text: "core checks pass successfully" },
    { x: 510, y: 42, label: "Jun", title: "Current state", text: "project SEO health: 78" },
  ],
};

const linePath =
  "M0 91 C24 89 38 86 52 84 C88 80 112 87 144 86 C178 85 204 77 236 72 C268 67 298 60 328 55 C360 49 388 44 420 43 C453 42 482 44 510 42 C530 40 546 35 560 31";
const areaPath =
  "M0 106 L0 91 C24 89 38 86 52 84 C88 80 112 87 144 86 C178 85 204 77 236 72 C268 67 298 60 328 55 C360 49 388 44 420 43 C453 42 482 44 510 42 C530 40 546 35 560 31 L560 106 Z";

export function HomeMonitoringChart({ locale }: HomeMonitoringChartProps) {
  const chartPoints = points[locale];
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : chartPoints[activeIndex] ?? null;

  return (
    <div className="wd-monitoring-chart-visual" onMouseLeave={() => setActiveIndex(null)}>
      <svg viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="wdMonitoringArea" x1="0" x2="0" y1="0" y2="1">
            <stop className="wd-chart-area-stop-strong" offset="0%" />
            <stop className="wd-chart-area-stop-soft" offset="100%" />
          </linearGradient>
        </defs>
        <path className="wd-chart-grid-line" d="M0 34 H560" />
        <path className="wd-chart-grid-line" d="M0 62 H560" />
        <path className="wd-chart-grid-line" d="M0 90 H560" />
        <path className="wd-chart-grid-floor" d={`M0 ${viewBox.floor} H560`} />
        <path className="area" d={areaPath} />
        <path className="wd-chart-line-shadow-path" d={linePath} />
        <path className="line" d={linePath} />
      </svg>
      {chartPoints.map((point, index) => (
        <button
          aria-label={`${point.label}: ${point.title}. ${point.text}`}
          className={index === activeIndex ? "wd-chart-hotspot is-active" : "wd-chart-hotspot"}
          key={point.label}
          onBlur={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(index)}
          onMouseEnter={() => setActiveIndex(index)}
          style={{ left: `${(point.x / viewBox.width) * 100}%`, top: `${(point.y / viewBox.height) * 100}%` }}
          type="button"
        >
          <span aria-hidden="true" className="wd-chart-dot-marker" />
          <span aria-hidden="true" className="wd-chart-point-label">{point.label}</span>
        </button>
      ))}
      {active && (
        <div className="wd-chart-tooltip" style={{ left: `${(active.x / viewBox.width) * 100}%`, top: `${(active.y / viewBox.height) * 100}%` }}>
          <span>{active.label}</span>
          <strong>{active.title}</strong>
          <small>{active.text}</small>
        </div>
      )}
    </div>
  );
}
