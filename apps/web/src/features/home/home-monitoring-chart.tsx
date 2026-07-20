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
    { x: 82, y: 82, label: "Пн", title: "Стартовая проверка", text: "128 страниц, 7 критичных проблем" },
    { x: 214, y: 58, label: "Вт", title: "Первые исправления", text: "исправлено 8 alt-ошибок" },
    { x: 342, y: 73, label: "Чт", title: "Найдена регрессия", text: "цепочка редиректов на посадочной" },
    { x: 496, y: 50, label: "Сегодня", title: "Состояние стабильнее", text: "SSL, sitemap и canonical без ошибок" },
  ],
  en: [
    { x: 82, y: 82, label: "Mon", title: "Initial check", text: "128 pages, 7 critical issues" },
    { x: 214, y: 58, label: "Tue", title: "First fixes", text: "8 alt issues resolved" },
    { x: 342, y: 73, label: "Thu", title: "Regression detected", text: "redirect chain on a landing page" },
    { x: 496, y: 50, label: "Today", title: "Health is steadier", text: "SSL, sitemap, and canonical pass" },
  ],
};

const linePath =
  "M0 90 C40 88 54 84 82 82 C128 78 166 62 214 58 C260 55 298 74 342 73 C398 72 438 51 496 50 C522 50 542 51 560 53";
const areaPath =
  "M0 106 L0 90 C40 88 54 84 82 82 C128 78 166 62 214 58 C260 55 298 74 342 73 C398 72 438 51 496 50 C522 50 542 51 560 53 L560 106 Z";

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
