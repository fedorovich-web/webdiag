"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { dictionary } from "../../lib/i18n";

const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export interface ColorConversionResult {
  readonly hex: string;
  readonly rgb: readonly [number, number, number];
  readonly rgbCss: string;
  readonly hsl: readonly [number, number, number];
  readonly hslCss: string;
}

export interface SpecificityResult {
  readonly selector: string;
  readonly ids: number;
  readonly classes: number;
  readonly types: number;
  readonly score: string;
}

export interface TypographyScaleStep {
  readonly step: number;
  readonly px: number;
  readonly rem: number;
  readonly cssVar: string;
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

function formatNumber(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

export function normalizeHexColor(input: string): string {
  const value = input.trim();
  if (!HEX_RE.test(value)) throw new Error("Expected a 3- or 6-digit HEX color.");
  const raw = value.startsWith("#") ? value.slice(1) : value;
  const expanded = raw.length === 3
    ? raw.split("").map((character) => character + character).join("")
    : raw;
  return `#${expanded.toUpperCase()}`;
}

export function convertHexColor(input: string): ColorConversionResult {
  const hex = normalizeHexColor(input);
  const red = Number.parseInt(hex.slice(1, 3), 16);
  const green = Number.parseInt(hex.slice(3, 5), 16);
  const blue = Number.parseInt(hex.slice(5, 7), 16);
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }

  if (hue < 0) hue += 360;
  const hsl: readonly [number, number, number] = [
    Math.round(hue),
    Math.round(saturation * 100),
    Math.round(lightness * 100),
  ];

  return {
    hex,
    rgb: [red, green, blue],
    rgbCss: `rgb(${red} ${green} ${blue})`,
    hsl,
    hslCss: `hsl(${hsl[0]} ${hsl[1]}% ${hsl[2]}%)`,
  };
}

function splitSelectorList(value: string): string[] {
  const selectors: string[] = [];
  let current = "";
  let depth = 0;
  let inAttribute = false;
  for (const character of value) {
    if (character === "[" && depth === 0) inAttribute = true;
    if (character === "]" && depth === 0) inAttribute = false;
    if (character === "(" && !inAttribute) depth += 1;
    if (character === ")" && !inAttribute && depth > 0) depth -= 1;
    if (character === "," && depth === 0 && !inAttribute) {
      selectors.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) selectors.push(current.trim());
  return selectors;
}

function addSpecificity(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
): readonly [number, number, number] {
  return [left[0] + right[0], left[1] + right[1], left[2] + right[2]];
}

function maxSpecificity(values: readonly (readonly [number, number, number])[]): readonly [number, number, number] {
  return values.reduce<readonly [number, number, number]>((best, value) => {
    if (value[0] !== best[0]) return value[0] > best[0] ? value : best;
    if (value[1] !== best[1]) return value[1] > best[1] ? value : best;
    return value[2] > best[2] ? value : best;
  }, [0, 0, 0]);
}

function computeSpecificityTuple(selector: string): readonly [number, number, number] {
  if (selector.length > 500) throw new Error("Selector is too long for the bounded calculator.");
  let source = selector.replace(/\/\*[\s\S]*?\*\//g, " ");
  let extra: readonly [number, number, number] = [0, 0, 0];

  source = source.replace(/:where\(([^()]*)\)/g, " ");
  source = source.replace(/:(is|not|has)\(([^()]*)\)/g, (_match, _name, inner: string) => {
    const choices = splitSelectorList(inner).map(computeSpecificityTuple);
    extra = addSpecificity(extra, maxSpecificity(choices));
    return " ";
  });

  const ids = (source.match(/#[A-Za-z0-9_-]+/g) ?? []).length;
  const attributes = (source.match(/\[[^\]]+\]/g) ?? []).length;
  const classes = (source.match(/\.[A-Za-z0-9_-]+/g) ?? []).length;
  const pseudoElements = (source.match(/::[A-Za-z0-9_-]+/g) ?? []).length;
  const pseudoClasses = (source.replace(/::[A-Za-z0-9_-]+/g, " ").match(/:[A-Za-z0-9_-]+(?:\([^)]*\))?/g) ?? []).length;

  const withoutNonTypes = source
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/#[A-Za-z0-9_-]+/g, " ")
    .replace(/\.[A-Za-z0-9_-]+/g, " ")
    .replace(/::?[A-Za-z0-9_-]+(?:\([^)]*\))?/g, " ")
    .replace(/[>+~*]/g, " ");

  const typeMatches = withoutNonTypes.match(/(?:^|\s)([A-Za-z][A-Za-z0-9_-]*)/g) ?? [];
  const types = typeMatches.map((match) => match.trim()).filter(Boolean).length + pseudoElements;

  return addSpecificity(extra, [ids, attributes + classes + pseudoClasses, types]);
}

export function calculateSelectorSpecificity(input: string): readonly SpecificityResult[] {
  const selectors = splitSelectorList(input.trim());
  if (selectors.length === 0) throw new Error("Enter at least one selector.");
  if (selectors.length > 12) throw new Error("Selector list is too large.");
  return selectors.map((selector) => {
    const [ids, classes, types] = computeSpecificityTuple(selector);
    return { selector, ids, classes, types, score: `${ids}-${classes}-${types}` };
  });
}

export function generateTypographyScale(
  basePx: number,
  ratio: number,
  minStep: number,
  maxStep: number,
): readonly TypographyScaleStep[] {
  if (!Number.isFinite(basePx) || basePx < 8 || basePx > 48) throw new Error("Base size must be 8–48 px.");
  if (!Number.isFinite(ratio) || ratio < 1.05 || ratio > 2) throw new Error("Ratio must be between 1.05 and 2.");
  if (!Number.isInteger(minStep) || !Number.isInteger(maxStep) || minStep < -8 || maxStep > 12 || minStep > maxStep) {
    throw new Error("Steps must be integers from -8 to 12.");
  }
  if (maxStep - minStep > 16) throw new Error("Scale range is too large.");

  const steps: TypographyScaleStep[] = [];
  for (let step = minStep; step <= maxStep; step += 1) {
    const px = formatNumber(basePx * Math.pow(ratio, step), 3);
    steps.push({
      step,
      px,
      rem: formatNumber(px / basePx, 4),
      cssVar: `--font-size-${step < 0 ? "minus-" + Math.abs(step) : step}: ${px}px;`,
    });
  }
  return steps;
}

function ColorConverterResult({ result, locale }: { result: ColorConversionResult | null; locale: Locale }) {
  if (!result) return <Output value="" locale={locale} />;
  const text = [
    `HEX: ${result.hex}`,
    `RGB: ${result.rgbCss}`,
    `HSL: ${result.hslCss}`,
    `Channels: R ${result.rgb[0]}, G ${result.rgb[1]}, B ${result.rgb[2]}`,
  ].join("\n");
  return <>
    <div className="contrast-preview" style={{ backgroundColor: result.hex, color: result.hsl[2] > 55 ? "#111827" : "#ffffff" }}>{result.hex}</div>
    <Output value={text} locale={locale} />
  </>;
}

export function ColorConverterTool({ locale }: { locale: Locale }) {
  const [input, setInput] = useState("#336699");
  const state = useMemo(() => {
    try {
      return { result: convertHexColor(input), error: "" };
    } catch (caught) {
      return { result: null, error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [input, locale]);

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{locale === "ru" ? "HEX-цвет" : "HEX color"}</span><input value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} /></label>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}><ColorConverterResult result={state.result} locale={locale} /></Panel>
  </div>;
}

export function CssSpecificityCalculatorTool({ locale }: { locale: Locale }) {
  const [selector, setSelector] = useState("#app .card:hover > h2::before");
  const state = useMemo(() => {
    try {
      return { results: calculateSelectorSpecificity(selector), error: "" };
    } catch (caught) {
      return { results: [] as readonly SpecificityResult[], error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [selector, locale]);
  const output = state.results.map((result) => `${result.score}  ${result.selector}`).join("\n");

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <label className="field"><span>{locale === "ru" ? "CSS selector list" : "CSS selector list"}</span><textarea className="code-input" value={selector} onChange={(event) => setSelector(event.target.value)} rows={7} spellCheck={false} /></label>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <Output value={output} locale={locale} />
      {state.results.length > 0 && <ul className="result-list">{state.results.map((result) => <li key={result.selector}><strong>{result.score}</strong> — ID {result.ids}, class/attribute/pseudo-class {result.classes}, type/pseudo-element {result.types}</li>)}</ul>}
    </Panel>
  </div>;
}

export function TypographyScaleGeneratorTool({ locale }: { locale: Locale }) {
  const [base, setBase] = useState("16");
  const [ratio, setRatio] = useState("1.25");
  const [minStep, setMinStep] = useState("-2");
  const [maxStep, setMaxStep] = useState("5");
  const state = useMemo(() => {
    try {
      return { rows: generateTypographyScale(Number(base), Number(ratio), Number(minStep), Number(maxStep)), error: "" };
    } catch (caught) {
      return { rows: [] as readonly TypographyScaleStep[], error: caught instanceof Error ? caught.message : dictionary[locale].error };
    }
  }, [base, ratio, minStep, maxStep, locale]);
  const css = state.rows.map((row) => row.cssVar).join("\n");

  return <div className="tool-grid">
    <Panel title={dictionary[locale].input}>
      <div className="field-row">
        <label className="field"><span>{locale === "ru" ? "База, px" : "Base, px"}</span><input value={base} onChange={(event) => setBase(event.target.value)} inputMode="decimal" /></label>
        <label className="field"><span>{locale === "ru" ? "Ratio" : "Ratio"}</span><input value={ratio} onChange={(event) => setRatio(event.target.value)} inputMode="decimal" /></label>
      </div>
      <div className="field-row">
        <label className="field"><span>{locale === "ru" ? "Минимальный шаг" : "Minimum step"}</span><input value={minStep} onChange={(event) => setMinStep(event.target.value)} inputMode="numeric" /></label>
        <label className="field"><span>{locale === "ru" ? "Максимальный шаг" : "Maximum step"}</span><input value={maxStep} onChange={(event) => setMaxStep(event.target.value)} inputMode="numeric" /></label>
      </div>
      <ErrorMessage value={state.error} />
    </Panel>
    <Panel title={dictionary[locale].result}>
      <Output value={css} locale={locale} />
      {state.rows.length > 0 && <ul className="result-list">{state.rows.map((row) => <li key={row.step}><strong>{row.step}</strong>: {row.px}px / {row.rem}rem</li>)}</ul>}
    </Panel>
  </div>;
}
