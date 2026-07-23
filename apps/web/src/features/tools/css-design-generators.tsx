"use client";

import { useMemo, useState, type CSSProperties } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { dictionary } from "../../lib/i18n";

const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const cssNumber = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, useGrouping: false });

interface ResultState {
  readonly value: string;
  readonly error: string;
}

interface GradientOptions {
  readonly mode: "linear" | "radial";
  readonly angle: number;
  readonly startColor: string;
  readonly endColor: string;
  readonly startStop: number;
  readonly endStop: number;
}

interface BoxShadowOptions {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
  readonly color: string;
  readonly opacity: number;
}

interface BorderRadiusOptions {
  readonly topLeft: number;
  readonly topRight: number;
  readonly bottomRight: number;
  readonly bottomLeft: number;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { value: string; locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function fieldLabel(locale: Locale, ru: string, en: string): string {
  return locale === "ru" ? ru : en;
}

function numberInput(value: string, setter: (value: string) => void, label: string, min: number, max: number) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(event) => setter(event.target.value)} inputMode="decimal" /><small>{min}–{max}</small></label>;
}

export function isHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

function parseBoundedNumber(value: string | number, label: string, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a finite number.`);
  if (parsed < min || parsed > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return parsed;
}

function normalizeHex(value: string): string {
  const color = value.trim();
  if (!isHexColor(color)) throw new Error("Color must be a 3- or 6-digit HEX value.");
  return color.startsWith("#") ? color : `#${color}`;
}

function hexToRgb(value: string): readonly [number, number, number] {
  const normalized = normalizeHex(value).slice(1);
  const hex = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number];
}

function formatPx(value: number): string {
  return `${cssNumber.format(value)}px`;
}

export function buildGradientCss(options: GradientOptions): string {
  const startColor = normalizeHex(options.startColor);
  const endColor = normalizeHex(options.endColor);
  const startStop = parseBoundedNumber(options.startStop, "start stop", 0, 100);
  const endStop = parseBoundedNumber(options.endStop, "end stop", 0, 100);
  if (startStop > endStop) throw new Error("Start stop must not be greater than end stop.");
  if (options.mode === "linear") {
    const angle = parseBoundedNumber(options.angle, "angle", 0, 360);
    return `linear-gradient(${cssNumber.format(angle)}deg, ${startColor} ${cssNumber.format(startStop)}%, ${endColor} ${cssNumber.format(endStop)}%)`;
  }
  return `radial-gradient(circle at center, ${startColor} ${cssNumber.format(startStop)}%, ${endColor} ${cssNumber.format(endStop)}%)`;
}

export function buildBoxShadowCss(options: BoxShadowOptions): string {
  const offsetX = parseBoundedNumber(options.offsetX, "offset X", -200, 200);
  const offsetY = parseBoundedNumber(options.offsetY, "offset Y", -200, 200);
  const blur = parseBoundedNumber(options.blur, "blur", 0, 400);
  const spread = parseBoundedNumber(options.spread, "spread", -200, 200);
  const opacity = parseBoundedNumber(options.opacity, "opacity", 0, 1);
  const [red, green, blue] = hexToRgb(options.color);
  return `${formatPx(offsetX)} ${formatPx(offsetY)} ${formatPx(blur)} ${formatPx(spread)} rgba(${red}, ${green}, ${blue}, ${cssNumber.format(opacity)})`;
}

export function buildBorderRadiusCss(options: BorderRadiusOptions): string {
  const values = [
    parseBoundedNumber(options.topLeft, "top-left", 0, 240),
    parseBoundedNumber(options.topRight, "top-right", 0, 240),
    parseBoundedNumber(options.bottomRight, "bottom-right", 0, 240),
    parseBoundedNumber(options.bottomLeft, "bottom-left", 0, 240),
  ];
  const [topLeft, topRight, bottomRight, bottomLeft] = values.map(formatPx);
  return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}

function toResult(run: () => string): ResultState {
  try { return { value: run(), error: "" }; }
  catch (error) { return { value: "", error: error instanceof Error ? error.message : "Invalid CSS input." }; }
}

export function GradientGeneratorTool({ locale }: { locale: Locale }) {
  const [mode, setMode] = useState<"linear" | "radial">("linear");
  const [angle, setAngle] = useState("135");
  const [startColor, setStartColor] = useState("#0f766e");
  const [endColor, setEndColor] = useState("#14b8a6");
  const [startStop, setStartStop] = useState("0");
  const [endStop, setEndStop] = useState("100");
  const result = useMemo(() => toResult(() => buildGradientCss({ mode, angle: Number(angle), startColor, endColor, startStop: Number(startStop), endStop: Number(endStop) })), [mode, angle, startColor, endColor, startStop, endStop]);
  const css = result.value ? `.gradient-surface {\n  background: ${result.value};\n}` : "";
  const previewStyle: CSSProperties = result.value ? { background: result.value, minHeight: "144px", borderRadius: "20px" } : { minHeight: "144px" };

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{fieldLabel(locale, "Тип", "Type")}</span><select value={mode} onChange={(event) => setMode(event.target.value as "linear" | "radial")}><option value="linear">linear</option><option value="radial">radial</option></select></label>
      {numberInput(angle, setAngle, fieldLabel(locale, "Угол, deg", "Angle, deg"), 0, 360)}
      <div className="field-row"><label className="field"><span>{fieldLabel(locale, "Первый цвет", "Start color")}</span><input value={startColor} onChange={(event) => setStartColor(event.target.value)} /></label><label className="field"><span>{fieldLabel(locale, "Второй цвет", "End color")}</span><input value={endColor} onChange={(event) => setEndColor(event.target.value)} /></label></div>
      <div className="field-row">{numberInput(startStop, setStartStop, fieldLabel(locale, "Старт, %", "Start, %"), 0, 100)}{numberInput(endStop, setEndStop, fieldLabel(locale, "Финиш, %", "End, %"), 0, 100)}</div>
      <ErrorMessage value={result.error} />
    </Panel>
    <Panel title={dictionary[locale].result}><div className="contrast-preview" style={previewStyle} aria-label={fieldLabel(locale, "Предпросмотр градиента", "Gradient preview")} /><Output value={css} locale={locale} /></Panel>
  </div>;
}

export function BoxShadowGeneratorTool({ locale }: { locale: Locale }) {
  const [offsetX, setOffsetX] = useState("0");
  const [offsetY, setOffsetY] = useState("18");
  const [blur, setBlur] = useState("48");
  const [spread, setSpread] = useState("0");
  const [color, setColor] = useState("#0f172a");
  const [opacity, setOpacity] = useState("0.18");
  const result = useMemo(() => toResult(() => buildBoxShadowCss({ offsetX: Number(offsetX), offsetY: Number(offsetY), blur: Number(blur), spread: Number(spread), color, opacity: Number(opacity) })), [offsetX, offsetY, blur, spread, color, opacity]);
  const css = result.value ? `.shadow-card {\n  box-shadow: ${result.value};\n}` : "";
  const previewStyle: CSSProperties = result.value ? { boxShadow: result.value, minHeight: "144px", borderRadius: "20px", background: "#ffffff" } : { minHeight: "144px" };

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <div className="field-row">{numberInput(offsetX, setOffsetX, "X", -200, 200)}{numberInput(offsetY, setOffsetY, "Y", -200, 200)}</div>
      <div className="field-row">{numberInput(blur, setBlur, fieldLabel(locale, "Blur", "Blur"), 0, 400)}{numberInput(spread, setSpread, fieldLabel(locale, "Spread", "Spread"), -200, 200)}</div>
      <div className="field-row"><label className="field"><span>{fieldLabel(locale, "Цвет", "Color")}</span><input value={color} onChange={(event) => setColor(event.target.value)} /></label>{numberInput(opacity, setOpacity, fieldLabel(locale, "Непрозрачность", "Opacity"), 0, 1)}</div>
      <ErrorMessage value={result.error} />
    </Panel>
    <Panel title={dictionary[locale].result}><div className="contrast-preview" style={previewStyle} aria-label={fieldLabel(locale, "Предпросмотр тени", "Shadow preview")} /><Output value={css} locale={locale} /></Panel>
  </div>;
}

export function BorderRadiusGeneratorTool({ locale }: { locale: Locale }) {
  const [topLeft, setTopLeft] = useState("24");
  const [topRight, setTopRight] = useState("24");
  const [bottomRight, setBottomRight] = useState("24");
  const [bottomLeft, setBottomLeft] = useState("24");
  const result = useMemo(() => toResult(() => buildBorderRadiusCss({ topLeft: Number(topLeft), topRight: Number(topRight), bottomRight: Number(bottomRight), bottomLeft: Number(bottomLeft) })), [topLeft, topRight, bottomRight, bottomLeft]);
  const css = result.value ? `.rounded-panel {\n  border-radius: ${result.value};\n}` : "";
  const previewStyle: CSSProperties = result.value ? { borderRadius: result.value, minHeight: "144px", background: "linear-gradient(135deg, #0f766e, #14b8a6)" } : { minHeight: "144px" };

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <div className="field-row">{numberInput(topLeft, setTopLeft, fieldLabel(locale, "Верхний левый", "Top left"), 0, 240)}{numberInput(topRight, setTopRight, fieldLabel(locale, "Верхний правый", "Top right"), 0, 240)}</div>
      <div className="field-row">{numberInput(bottomRight, setBottomRight, fieldLabel(locale, "Нижний правый", "Bottom right"), 0, 240)}{numberInput(bottomLeft, setBottomLeft, fieldLabel(locale, "Нижний левый", "Bottom left"), 0, 240)}</div>
      <ErrorMessage value={result.error} />
    </Panel>
    <Panel title={dictionary[locale].result}><div className="contrast-preview" style={previewStyle} aria-label={fieldLabel(locale, "Предпросмотр border-radius", "Border-radius preview")} /><Output value={css} locale={locale} /></Panel>
  </div>;
}