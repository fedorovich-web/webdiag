
"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { dictionary } from "../../lib/i18n";

export type ClipPathShape = "inset" | "circle" | "ellipse" | "polygon";
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";
export type FlexJustify = "flex-start" | "center" | "space-between" | "space-around" | "space-evenly";
export type FlexAlign = "stretch" | "flex-start" | "center" | "flex-end";

export interface CssGridConfig {
  readonly columns: number;
  readonly rows: number;
  readonly gap: number;
  readonly minColumnPx: number;
}

export interface FlexboxConfig {
  readonly direction: FlexDirection;
  readonly justify: FlexJustify;
  readonly align: FlexAlign;
  readonly gap: number;
  readonly wrap: boolean;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function Output({ value, locale }: { value: string; locale: Locale }) {
  return <div className="output-wrap"><pre className="output" aria-live="polite">{value || "—"}</pre><CopyButton value={value} locale={locale} /></div>;
}

function ErrorMessage({ value }: { value: string }) {
  return value ? <p className="form-error" role="alert">{value}</p> : null;
}

function ensureNumber(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return Math.round(value);
}

function percent(value: number, label: string): number {
  return ensureNumber(value, 0, 100, label);
}

export function buildClipPath(shape: ClipPathShape, values: readonly number[]): string {
  if (shape === "inset") {
    if (values.length !== 4) throw new Error("Inset needs four values.");
    const [top, right, bottom, left] = values.map((value, index) => percent(value, `Inset ${index + 1}`));
    return `clip-path: inset(${top}% ${right}% ${bottom}% ${left}%);`;
  }
  if (shape === "circle") {
    if (values.length !== 3) throw new Error("Circle needs radius, x and y.");
    const [radius, x, y] = values.map((value, index) => percent(value, `Circle ${index + 1}`));
    return `clip-path: circle(${radius}% at ${x}% ${y}%);`;
  }
  if (shape === "ellipse") {
    if (values.length !== 4) throw new Error("Ellipse needs radius x, radius y, x and y.");
    const [radiusX, radiusY, x, y] = values.map((value, index) => percent(value, `Ellipse ${index + 1}`));
    return `clip-path: ellipse(${radiusX}% ${radiusY}% at ${x}% ${y}%);`;
  }
  if (values.length !== 8) throw new Error("Polygon needs four points.");
  const points = values.map((value, index) => percent(value, `Point ${index + 1}`));
  return `clip-path: polygon(${points[0]}% ${points[1]}%, ${points[2]}% ${points[3]}%, ${points[4]}% ${points[5]}%, ${points[6]}% ${points[7]}%);`;
}

export function buildCssFilter(
  blur: number,
  brightness: number,
  contrast: number,
  grayscale: number,
  saturate: number,
  hueRotate: number,
): string {
  const safeBlur = ensureNumber(blur, 0, 40, "Blur");
  const safeBrightness = ensureNumber(brightness, 0, 200, "Brightness");
  const safeContrast = ensureNumber(contrast, 0, 200, "Contrast");
  const safeGrayscale = ensureNumber(grayscale, 0, 100, "Grayscale");
  const safeSaturate = ensureNumber(saturate, 0, 300, "Saturate");
  const safeHueRotate = ensureNumber(hueRotate, -180, 180, "Hue rotate");
  return `filter: blur(${safeBlur}px) brightness(${safeBrightness}%) contrast(${safeContrast}%) grayscale(${safeGrayscale}%) saturate(${safeSaturate}%) hue-rotate(${safeHueRotate}deg);`;
}

export function buildCssGrid(config: CssGridConfig): string {
  const columns = ensureNumber(config.columns, 1, 12, "Columns");
  const rows = ensureNumber(config.rows, 1, 8, "Rows");
  const gap = ensureNumber(config.gap, 0, 64, "Gap");
  const minColumnPx = ensureNumber(config.minColumnPx, 80, 480, "Minimum column width");
  return [
    "display: grid;",
    `grid-template-columns: repeat(${columns}, minmax(${minColumnPx}px, 1fr));`,
    `grid-template-rows: repeat(${rows}, auto);`,
    `gap: ${gap}px;`,
  ].join("\n");
}

export function buildFlexbox(config: FlexboxConfig): string {
  const gap = ensureNumber(config.gap, 0, 64, "Gap");
  return [
    "display: flex;",
    `flex-direction: ${config.direction};`,
    `justify-content: ${config.justify};`,
    `align-items: ${config.align};`,
    `gap: ${gap}px;`,
    `flex-wrap: ${config.wrap ? "wrap" : "nowrap"};`,
  ].join("\n");
}

function parseList(value: string): number[] {
  return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean).map(Number);
}

function cssValueOnly(declaration: string): string {
  return declaration.replace(/^[^:]+:\s*/, "").replace(/;$/, "");
}

export function ClipPathGeneratorTool({ locale }: { locale: Locale }) {
  const [shape, setShape] = useState<ClipPathShape>("polygon");
  const [values, setValues] = useState("0 0 100 0 100 100 0 100");
  const state = useMemo(() => {
    try {
      return { css: buildClipPath(shape, parseList(values)), error: "" };
    } catch (caught) {
      return { css: "", error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [shape, values, locale]);
  const previewStyle = state.css ? { clipPath: cssValueOnly(state.css) } : undefined;

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{locale === "ru" ? "Фигура" : "Shape"}</span><select value={shape} onChange={(event) => setShape(event.target.value as ClipPathShape)}><option value="polygon">polygon</option><option value="inset">inset</option><option value="circle">circle</option><option value="ellipse">ellipse</option></select></label>
      <label className="field"><span>{locale === "ru" ? "Числа 0–100" : "Numbers 0–100"}</span><textarea className="code-input" value={values} onChange={(event) => setValues(event.target.value)} rows={5} spellCheck={false} /></label>
      <p className="help-text">{locale === "ru" ? "Polygon: x1 y1 x2 y2 x3 y3 x4 y4. Inset: top right bottom left. Circle: radius x y. Ellipse: rx ry x y." : "Polygon: x1 y1 x2 y2 x3 y3 x4 y4. Inset: top right bottom left. Circle: radius x y. Ellipse: rx ry x y."}</p>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <div className="contrast-preview" style={previewStyle}>{locale === "ru" ? "Preview" : "Preview"}</div>
      <Output value={state.css} locale={locale} />
    </Panel>
  </div>;
}

export function CssFilterPlaygroundTool({ locale }: { locale: Locale }) {
  const [blur, setBlur] = useState("0");
  const [brightness, setBrightness] = useState("100");
  const [contrast, setContrast] = useState("100");
  const [grayscale, setGrayscale] = useState("0");
  const [saturate, setSaturate] = useState("100");
  const [hueRotate, setHueRotate] = useState("0");
  const state = useMemo(() => {
    try {
      return { css: buildCssFilter(Number(blur), Number(brightness), Number(contrast), Number(grayscale), Number(saturate), Number(hueRotate)), error: "" };
    } catch (caught) {
      return { css: "", error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [blur, brightness, contrast, grayscale, saturate, hueRotate, locale]);
  const previewStyle = state.css ? { filter: cssValueOnly(state.css) } : undefined;

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <div className="field-row"><label className="field"><span>blur px</span><input value={blur} onChange={(event) => setBlur(event.target.value)} inputMode="numeric" /></label><label className="field"><span>brightness %</span><input value={brightness} onChange={(event) => setBrightness(event.target.value)} inputMode="numeric" /></label></div>
      <div className="field-row"><label className="field"><span>contrast %</span><input value={contrast} onChange={(event) => setContrast(event.target.value)} inputMode="numeric" /></label><label className="field"><span>grayscale %</span><input value={grayscale} onChange={(event) => setGrayscale(event.target.value)} inputMode="numeric" /></label></div>
      <div className="field-row"><label className="field"><span>saturate %</span><input value={saturate} onChange={(event) => setSaturate(event.target.value)} inputMode="numeric" /></label><label className="field"><span>hue rotate</span><input value={hueRotate} onChange={(event) => setHueRotate(event.target.value)} inputMode="numeric" /></label></div>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <div className="contrast-preview" style={previewStyle}>WebDiag</div>
      <Output value={state.css} locale={locale} />
    </Panel>
  </div>;
}

export function CssGridGeneratorTool({ locale }: { locale: Locale }) {
  const [columns, setColumns] = useState("3");
  const [rows, setRows] = useState("2");
  const [gap, setGap] = useState("16");
  const [minColumnPx, setMinColumnPx] = useState("180");
  const state = useMemo(() => {
    try {
      return { css: buildCssGrid({ columns: Number(columns), rows: Number(rows), gap: Number(gap), minColumnPx: Number(minColumnPx) }), error: "" };
    } catch (caught) {
      return { css: "", error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [columns, rows, gap, minColumnPx, locale]);

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <div className="field-row"><label className="field"><span>{locale === "ru" ? "Колонки" : "Columns"}</span><input value={columns} onChange={(event) => setColumns(event.target.value)} inputMode="numeric" /></label><label className="field"><span>{locale === "ru" ? "Ряды" : "Rows"}</span><input value={rows} onChange={(event) => setRows(event.target.value)} inputMode="numeric" /></label></div>
      <div className="field-row"><label className="field"><span>gap px</span><input value={gap} onChange={(event) => setGap(event.target.value)} inputMode="numeric" /></label><label className="field"><span>{locale === "ru" ? "Мин. колонка" : "Min column"}</span><input value={minColumnPx} onChange={(event) => setMinColumnPx(event.target.value)} inputMode="numeric" /></label></div>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <Output value={state.css} locale={locale} />
      <ul className="result-list"><li>{locale === "ru" ? "Grid остаётся bounded: максимум 12 колонок и 8 рядов." : "The grid stays bounded: up to 12 columns and 8 rows."}</li></ul>
    </Panel>
  </div>;
}

export function FlexboxPlaygroundTool({ locale }: { locale: Locale }) {
  const [direction, setDirection] = useState<FlexDirection>("row");
  const [justify, setJustify] = useState<FlexJustify>("space-between");
  const [align, setAlign] = useState<FlexAlign>("center");
  const [gap, setGap] = useState("16");
  const [wrap, setWrap] = useState(true);
  const state = useMemo(() => {
    try {
      return { css: buildFlexbox({ direction, justify, align, gap: Number(gap), wrap }), error: "" };
    } catch (caught) {
      return { css: "", error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [direction, justify, align, gap, wrap, locale]);

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>flex-direction</span><select value={direction} onChange={(event) => setDirection(event.target.value as FlexDirection)}><option>row</option><option>column</option><option>row-reverse</option><option>column-reverse</option></select></label>
      <label className="field"><span>justify-content</span><select value={justify} onChange={(event) => setJustify(event.target.value as FlexJustify)}><option>flex-start</option><option>center</option><option>space-between</option><option>space-around</option><option>space-evenly</option></select></label>
      <label className="field"><span>align-items</span><select value={align} onChange={(event) => setAlign(event.target.value as FlexAlign)}><option>stretch</option><option>flex-start</option><option>center</option><option>flex-end</option></select></label>
      <label className="field"><span>gap px</span><input value={gap} onChange={(event) => setGap(event.target.value)} inputMode="numeric" /></label>
      <label className="checkbox-row"><input type="checkbox" checked={wrap} onChange={(event) => setWrap(event.target.checked)} /> <span>flex-wrap</span></label>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <Output value={state.css} locale={locale} />
      <ul className="result-list"><li>{locale === "ru" ? "Инструмент выдаёт container declaration, не полноценный layout editor." : "The tool emits a container declaration, not a full layout editor."}</li></ul>
    </Panel>
  </div>;
}
