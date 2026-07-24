export const MAX_TEXT_LENGTH = 200_000;
export const MAX_DIFF_LINES = 5_000;
export const MAX_DIFF_CELLS = 2_000_000;
export const MAX_DIFF_OUTPUT_LENGTH = 350_000;

const MAX_ENTITY_BODY_LENGTH = 32;

const namedEntities = new Map<string, string>([
  ["amp", "&"],
  ["lt", "<"],
  ["gt", ">"],
  ["quot", '"'],
  ["apos", "'"],
  ["nbsp", "\u00A0"],
  ["copy", "\u00A9"],
  ["reg", "\u00AE"],
  ["trade", "\u2122"],
  ["hellip", "\u2026"],
  ["ndash", "\u2013"],
  ["mdash", "\u2014"],
]);

export type EntityNumericFormat = "decimal" | "hexadecimal";

export interface HtmlEntityEncodeOptions {
  readonly encodeQuotes: boolean;
  readonly encodeNonAscii: boolean;
  readonly numericFormat: EntityNumericFormat;
}

export type DiffLineKind = "unchanged" | "addition" | "deletion";

export interface DiffLine {
  readonly kind: DiffLineKind;
  readonly value: string;
}

export interface DiffSummary {
  readonly additions: number;
  readonly deletions: number;
  readonly unchanged: number;
  readonly replacementGroups: number;
}

export interface DiffResult {
  readonly lines: readonly DiffLine[];
  readonly summary: DiffSummary;
  readonly unifiedDiff: string;
  readonly originalLineCount: number;
  readonly changedLineCount: number;
}

export interface DiffOptions {
  readonly ignoreTrailingWhitespace: boolean;
}

function assertTextLength(value: string, label: string): void {
  if (value.length > MAX_TEXT_LENGTH) {
    throw new Error(`${label} exceeds the ${MAX_TEXT_LENGTH.toLocaleString("en-US")} character limit.`);
  }
}

function assertUnicodeScalarText(value: string, label: string): void {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
      throw new Error(`${label} contains an isolated UTF-16 surrogate.`);
    }
    if (codePoint === 0) {
      throw new Error(`${label} contains U+0000, which is not supported.`);
    }
  }
}

function numericEntity(codePoint: number, format: EntityNumericFormat): string {
  return format === "hexadecimal"
    ? `&#x${codePoint.toString(16).toUpperCase()};`
    : `&#${codePoint};`;
}

export function encodeHtmlEntities(
  input: string,
  options: HtmlEntityEncodeOptions,
): string {
  assertTextLength(input, "Input");
  assertUnicodeScalarText(input, "Input");

  let output = "";
  for (const character of input) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) throw new Error("Input contains an invalid character.");

    if (character === "&") output += "&amp;";
    else if (character === "<") output += "&lt;";
    else if (character === ">") output += "&gt;";
    else if (options.encodeQuotes && character === '"') output += "&quot;";
    else if (options.encodeQuotes && character === "'") output += "&#39;";
    else if (options.encodeNonAscii && codePoint > 0x7F) {
      output += numericEntity(codePoint, options.numericFormat);
    } else output += character;
  }

  return output;
}

function assertEntityBodyLength(input: string): void {
  let offset = 0;
  while (offset < input.length) {
    const ampersand = input.indexOf("&", offset);
    if (ampersand === -1) return;
    const semicolon = input.indexOf(";", ampersand + 1);
    if (semicolon === -1) return;

    const body = input.slice(ampersand + 1, semicolon);
    if (/^#[xX]?[0-9A-Za-z]+$/u.test(body) || /^[A-Za-z][0-9A-Za-z]*$/u.test(body)) {
      if (body.length > MAX_ENTITY_BODY_LENGTH) {
        throw new Error(`Entity references are limited to ${MAX_ENTITY_BODY_LENGTH} characters.`);
      }
    }
    offset = semicolon + 1;
  }
}

function decodeNumericEntity(body: string): string {
  const hexadecimal = body[1] === "x" || body[1] === "X";
  const digits = body.slice(hexadecimal ? 2 : 1);
  const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);

  if (!Number.isSafeInteger(codePoint)) {
    throw new Error("Numeric entity is outside the supported Unicode range.");
  }
  if (codePoint === 0) {
    throw new Error("Numeric entity U+0000 is not supported.");
  }
  if (codePoint > 0x10FFFF || (codePoint >= 0xD800 && codePoint <= 0xDFFF)) {
    throw new Error("Numeric entity is not a valid Unicode scalar value.");
  }

  return String.fromCodePoint(codePoint);
}

export function decodeHtmlEntities(input: string): string {
  assertTextLength(input, "Input");
  assertUnicodeScalarText(input, "Input");
  assertEntityBodyLength(input);

  return input.replace(
    /&(#(?:[xX][0-9A-Fa-f]+|[0-9]+)|[A-Za-z][0-9A-Za-z]{0,31});/gu,
    (entity, body: string) => {
      if (body.startsWith("#")) return decodeNumericEntity(body);
      return namedEntities.get(body) ?? entity;
    },
  );
}

function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/gu, "\n");
}

function splitLines(value: string): string[] {
  return value === "" ? [] : value.split("\n");
}

function comparisonLine(value: string, ignoreTrailingWhitespace: boolean): string {
  return ignoreTrailingWhitespace ? value.replace(/[\t ]+$/gu, "") : value;
}

function summarizeDiff(lines: readonly DiffLine[]): DiffSummary {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;
  let replacementGroups = 0;
  let groupHasAddition = false;
  let groupHasDeletion = false;

  function finishGroup(): void {
    if (groupHasAddition && groupHasDeletion) replacementGroups += 1;
    groupHasAddition = false;
    groupHasDeletion = false;
  }

  for (const line of lines) {
    if (line.kind === "addition") {
      additions += 1;
      groupHasAddition = true;
    } else if (line.kind === "deletion") {
      deletions += 1;
      groupHasDeletion = true;
    } else {
      unchanged += 1;
      finishGroup();
    }
  }
  finishGroup();

  return { additions, deletions, unchanged, replacementGroups };
}

function formatRangeStart(lineCount: number): number {
  return lineCount === 0 ? 0 : 1;
}

function buildUnifiedDiff(
  lines: readonly DiffLine[],
  originalLineCount: number,
  changedLineCount: number,
): string {
  const body = lines.map((line) => {
    const prefix = line.kind === "addition" ? "+" : line.kind === "deletion" ? "-" : " ";
    return `${prefix}${line.value}`;
  });
  const output = [
    "--- original",
    "+++ changed",
    `@@ -${formatRangeStart(originalLineCount)},${originalLineCount} +${formatRangeStart(changedLineCount)},${changedLineCount} @@`,
    ...body,
  ].join("\n");

  if (output.length > MAX_DIFF_OUTPUT_LENGTH) {
    throw new Error(`Diff output exceeds the ${MAX_DIFF_OUTPUT_LENGTH.toLocaleString("en-US")} character limit.`);
  }
  return output;
}

export function compareTextLines(
  originalInput: string,
  changedInput: string,
  options: DiffOptions,
): DiffResult {
  assertTextLength(originalInput, "Original input");
  assertTextLength(changedInput, "Changed input");

  const originalLines = splitLines(normalizeLineEndings(originalInput));
  const changedLines = splitLines(normalizeLineEndings(changedInput));
  if (originalLines.length > MAX_DIFF_LINES || changedLines.length > MAX_DIFF_LINES) {
    throw new Error(`Each side is limited to ${MAX_DIFF_LINES.toLocaleString("en-US")} lines.`);
  }

  const cellCount = originalLines.length * changedLines.length;
  if (cellCount > MAX_DIFF_CELLS) {
    throw new Error(`Comparison exceeds the ${MAX_DIFF_CELLS.toLocaleString("en-US")} operation budget.`);
  }

  const originalKeys = originalLines.map((line) => comparisonLine(line, options.ignoreTrailingWhitespace));
  const changedKeys = changedLines.map((line) => comparisonLine(line, options.ignoreTrailingWhitespace));
  const changedCount = changedLines.length;
  const directions = new Uint8Array(cellCount);
  let previous = new Uint32Array(changedCount + 1);

  for (let originalIndex = 1; originalIndex <= originalLines.length; originalIndex += 1) {
    const current = new Uint32Array(changedCount + 1);
    for (let changedIndex = 1; changedIndex <= changedCount; changedIndex += 1) {
      const directionIndex = (originalIndex - 1) * changedCount + (changedIndex - 1);
      if (originalKeys[originalIndex - 1] === changedKeys[changedIndex - 1]) {
        current[changedIndex] = (previous[changedIndex - 1] ?? 0) + 1;
        directions[directionIndex] = 0;
      } else if ((previous[changedIndex] ?? 0) > (current[changedIndex - 1] ?? 0)) {
        current[changedIndex] = previous[changedIndex] ?? 0;
        directions[directionIndex] = 1;
      } else {
        current[changedIndex] = current[changedIndex - 1] ?? 0;
        directions[directionIndex] = 2;
      }
    }
    previous = current;
  }

  const reversed: DiffLine[] = [];
  let originalIndex = originalLines.length;
  let changedIndex = changedLines.length;
  while (originalIndex > 0 || changedIndex > 0) {
    if (
      originalIndex > 0
      && changedIndex > 0
      && originalKeys[originalIndex - 1] === changedKeys[changedIndex - 1]
    ) {
      reversed.push({ kind: "unchanged", value: originalLines[originalIndex - 1] ?? "" });
      originalIndex -= 1;
      changedIndex -= 1;
      continue;
    }

    const direction = originalIndex > 0 && changedIndex > 0
      ? directions[(originalIndex - 1) * changedCount + (changedIndex - 1)]
      : undefined;
    if (originalIndex > 0 && (changedIndex === 0 || direction === 1)) {
      reversed.push({ kind: "deletion", value: originalLines[originalIndex - 1] ?? "" });
      originalIndex -= 1;
    } else if (changedIndex > 0) {
      reversed.push({ kind: "addition", value: changedLines[changedIndex - 1] ?? "" });
      changedIndex -= 1;
    }
  }

  const lines = reversed.reverse();
  const originalLineCount = originalLines.length;
  const changedLineCount = changedLines.length;
  return {
    lines,
    summary: summarizeDiff(lines),
    unifiedDiff: buildUnifiedDiff(lines, originalLineCount, changedLineCount),
    originalLineCount,
    changedLineCount,
  };
}
