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

const viewBox = { width: 560, height: 128 } as const;

const points: Record<Locale, readonly ChartPoint[]> = {
  ru: [
    { x: 40, y: 88, label: "Янв", title: "Стартовая проверка", text: "SEO-здоровье проекта: 31" },
    { x: 136, y: 82, label: "Фев", title: "Первые исправления", text: "исправлены критичные ошибки" },
    { x: 232, y: 72, label: "Мар", title: "Стабильный рост", text: "улучшены мета-теги и структура" },
    { x: 328, y: 58, label: "Апр", title: "Рост качества", text: "устранены технические проблемы" },
    { x: 424, y: 48, label: "Май", title: "Стабильный результат", text: "основные проверки проходят успешно" },
    { x: 520, y: 34, label: "Июн", title: "Текущее состояние", text: "SEO-здоровье проекта: 78" },
  ],
  en: [
    { x: 40, y: 88, label: "Jan", title: "Initial check", text: "project SEO health: 31" },
    { x: 136, y: 82, label: "Feb", title: "First fixes", text: "critical issues resolved" },
    { x: 232, y: 72, label: "Mar", title: "Steady growth", text: "metadata and structure improved" },
    { x: 328, y: 58, label: "Apr", title: "Quality improved", text: "technical issues resolved" },
    { x: 424, y: 48, label: "May", title: "Stable result", text: "core checks pass successfully" },
    { x: 520, y: 34, label: "Jun", title: "Current state", text: "project SEO health: 78" },
  ],
};

const linePath =
  "M0 94 C18 93 28 90 40 88 C72 84 104 83 136 82 C168 81 200 76 232 72 C264 68 296 62 328 58 C360 54 392 50 424 48 C456 46 488 41 520 34 C536 31 548 28 560 25";
const areaPath =
  "M0 108 L0 94 C18 93 28 90 40 88 C72 84 104 83 136 82 C168 81 200 76 232 72 C264 68 296 62 328 58 C360 54 392 50 424 48 C456 46 488 41 520 34 C536 31 548 28 560 25 L560 108 Z";

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
      <div className="wd-chart-axis-labels" aria-hidden="true">
        {chartPoints.map((point) => (
          <span key={point.label} style={{ left: `${(point.x / viewBox.width) * 100}%` }}>{point.label}</span>
        ))}
      </div>
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
