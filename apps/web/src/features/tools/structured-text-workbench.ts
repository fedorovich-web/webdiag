export interface WorkbenchIssue {
  readonly path: string;
  readonly code: string;
  readonly message: string;
}

export interface JsonPathMatch {
  readonly path: string;
  readonly value: unknown;
}

export interface JsonPathQueryResult {
  readonly matches: readonly JsonPathMatch[];
  readonly matchCount: number;
  readonly visitedNodeCount: number;
  readonly truncated: boolean;
  readonly supportedSyntax: readonly string[];
}

export interface TextConversionResult {
  readonly output: string;
  readonly nodeCount: number;
  readonly warnings: readonly string[];
}

export type CsvDelimiter = "," | ";" | "\t" | "|";
export type CsvDelimiterOption = CsvDelimiter | "auto";

export interface CsvAnalysisResult {
  readonly valid: boolean;
  readonly delimiter: CsvDelimiter;
  readonly rows: readonly (readonly string[])[];
  readonly rowCount: number;
  readonly columnCount: number;
  readonly issueCount: number;
  readonly issues: readonly WorkbenchIssue[];
  readonly warnings: readonly string[];
  readonly formulaRiskCount: number;
  readonly emptyHeaderCount: number;
  readonly duplicateHeaderCount: number;
  readonly truncated: boolean;
}

export interface CsvToJsonResult extends CsvAnalysisResult {
  readonly output: string;
}

export interface JsonToCsvResult {
  readonly output: string;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly formulaRiskCount: number;
  readonly escapedFormulaCount: number;
  readonly warnings: readonly string[];
}

const MAX_INPUT_CHARS = 500_000;
const MAX_JSON_NODES = 10_000;
const MAX_JSON_DEPTH = 64;
const MAX_JSONPATH_MATCHES = 500;
const MAX_TOML_NODES = 5_000;
const MAX_TOML_DEPTH = 32;
const MAX_CSV_ROWS = 10_000;
const MAX_CSV_COLUMNS = 200;
const MAX_CSV_CELLS = 500_000;
const MAX_ISSUES = 100;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countNodes(value: unknown, maximum: number, maximumDepth: number): number {
  let count = 0;
  const visit = (current: unknown, depth: number): void => {
    if (depth > maximumDepth) throw new Error(`Maximum nesting depth of ${maximumDepth} exceeded.`);
    count += 1;
    if (count > maximum) throw new Error(`Input exceeds ${maximum.toLocaleString("en-US")} nodes.`);
    if (Array.isArray(current)) {
      for (const item of current) visit(item, depth + 1);
    } else if (isObject(current)) {
      for (const item of Object.values(current)) visit(item, depth + 1);
    }
  };
  visit(value, 0);
  return count;
}

function parseBoundedJson(text: string): unknown {
  if (!text.trim()) throw new Error("JSON input is empty.");
  if (text.length > MAX_INPUT_CHARS) throw new Error("JSON input exceeds 500,000 characters.");
  const value: unknown = JSON.parse(text);
  countNodes(value, MAX_JSON_NODES, MAX_JSON_DEPTH);
  return value;
}

function pointerPath(segments: readonly (string | number)[]): string {
  if (!segments.length) return "";
  return segments.map((segment) => `/${String(segment).replaceAll("~", "~0").replaceAll("/", "~1")}`).join("");
}

interface JsonPathNode {
  readonly value: unknown;
  readonly path: readonly (string | number)[];
}

type JsonPathSelector =
  | { readonly kind: "property"; readonly name: string }
  | { readonly kind: "index"; readonly index: number }
  | { readonly kind: "wildcard" }
  | { readonly kind: "recursive-property"; readonly name: string }
  | { readonly kind: "recursive-wildcard" }
  | { readonly kind: "union"; readonly items: readonly ({ readonly kind: "property"; readonly name: string } | { readonly kind: "index"; readonly index: number })[] }
  | { readonly kind: "slice"; readonly start: number | null; readonly end: number | null; readonly step: number }
  | { readonly kind: "filter"; readonly filter: JsonPathFilter };

interface JsonPathFilter {
  readonly path: readonly (string | number)[];
  readonly operator: "exists" | "==" | "!=" | "<" | "<=" | ">" | ">=";
  readonly expected?: string | number | boolean | null;
}

function parseQuotedJsonPathProperty(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed !== "string") throw new Error("JSONPath bracket property must be a string.");
    return parsed;
  }
  if (!trimmed.startsWith("'") || !trimmed.endsWith("'")) {
    throw new Error("JSONPath bracket properties must use matching quotes.");
  }
  let result = "";
  for (let index = 1; index < trimmed.length - 1; index += 1) {
    const character = trimmed[index];
    if (character !== "\\") {
      result += character;
      continue;
    }
    index += 1;
    const escaped = trimmed[index];
    if (escaped === undefined) throw new Error("Invalid JSONPath string escape.");
    if (escaped === "'" || escaped === "\\" || escaped === "/") result += escaped;
    else if (escaped === "n") result += "\n";
    else if (escaped === "r") result += "\r";
    else if (escaped === "t") result += "\t";
    else throw new Error(`Unsupported JSONPath string escape: \\${escaped}`);
  }
  return result;
}

function splitTopLevel(value: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\" && quote === '"') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "(" || character === "[" || character === "{") depth += 1;
    else if (character === ")" || character === "]" || character === "}") depth -= 1;
    else if (character === separator && depth === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts;
}

function parseFilterLiteral(value: string): string | number | boolean | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed !== "string") throw new Error("JSONPath filter string literal is invalid.");
    return parsed;
  }
  if (trimmed.startsWith("'")) return parseQuotedJsonPathProperty(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) throw new Error("JSONPath filter number must be finite.");
    return numeric;
  }
  throw new Error("JSONPath filters support only string, finite number, boolean, or null literals.");
}

function parseFilterPath(value: string): readonly (string | number)[] {
  if (!value.startsWith("@")) throw new Error("JSONPath filter operands must start with @.");
  const segments: (string | number)[] = [];
  let index = 1;
  while (index < value.length) {
    if (value[index] === ".") {
      index += 1;
      const match = /^[A-Za-z_$][A-Za-z0-9_$-]*/u.exec(value.slice(index));
      if (!match) throw new Error("Invalid JSONPath filter property.");
      segments.push(match[0]);
      index += match[0].length;
      continue;
    }
    if (value[index] === "[") {
      const end = value.indexOf("]", index + 1);
      if (end < 0) throw new Error("Unclosed JSONPath filter bracket.");
      const content = value.slice(index + 1, end).trim();
      if (/^-?\d+$/u.test(content)) segments.push(Number(content));
      else segments.push(parseQuotedJsonPathProperty(content));
      index = end + 1;
      continue;
    }
    throw new Error("Unsupported JSONPath filter path syntax.");
  }
  return segments;
}

function parseJsonPathFilter(content: string): JsonPathFilter {
  const trimmed = content.trim();
  const operatorMatch = /^(.*?)(===|!==|==|!=|<=|>=|<|>)(.*)$/u.exec(trimmed);
  if (!operatorMatch) return { path: parseFilterPath(trimmed), operator: "exists" };
  const operator = operatorMatch[2];
  if (operator === "===" || operator === "!==") {
    throw new Error("JSONPath filters support == and !=, not JavaScript identity operators.");
  }
  return {
    path: parseFilterPath(operatorMatch[1]?.trim() ?? ""),
    operator: operator as JsonPathFilter["operator"],
    expected: parseFilterLiteral(operatorMatch[3]?.trim() ?? ""),
  };
}

function findClosingBracket(path: string, start: number): number {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let parenthesisDepth = 0;
  for (let index = start + 1; index < path.length; index += 1) {
    const character = path[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "(") parenthesisDepth += 1;
    else if (character === ")") parenthesisDepth -= 1;
    else if (character === "]" && parenthesisDepth === 0) return index;
  }
  return -1;
}

function parseJsonPath(path: string): readonly JsonPathSelector[] {
  const input = path.trim();
  if (!input.startsWith("$")) throw new Error("JSONPath must start with $.");
  if (input.length > 2_000) throw new Error("JSONPath exceeds 2,000 characters.");
  const selectors: JsonPathSelector[] = [];
  let index = 1;
  while (index < input.length) {
    if (input[index] === ".") {
      const recursive = input[index + 1] === ".";
      index += recursive ? 2 : 1;
      if (input[index] === "*") {
        selectors.push({ kind: recursive ? "recursive-wildcard" : "wildcard" });
        index += 1;
        continue;
      }
      const match = /^[A-Za-z_$][A-Za-z0-9_$-]*/u.exec(input.slice(index));
      if (!match) throw new Error("Invalid JSONPath dot-property syntax.");
      selectors.push({ kind: recursive ? "recursive-property" : "property", name: match[0] });
      index += match[0].length;
      continue;
    }
    if (input[index] !== "[") throw new Error(`Unexpected JSONPath token at position ${index}.`);
    const end = findClosingBracket(input, index);
    if (end < 0) throw new Error("Unclosed JSONPath bracket selector.");
    const content = input.slice(index + 1, end).trim();
    if (content === "*") selectors.push({ kind: "wildcard" });
    else if (content.startsWith("?(") && content.endsWith(")")) {
      selectors.push({ kind: "filter", filter: parseJsonPathFilter(content.slice(2, -1)) });
    } else if (content.includes(":")) {
      const parts = content.split(":");
      if (parts.length < 2 || parts.length > 3) throw new Error("JSONPath slices use [start:end:step].");
      const parsePart = (part: string | undefined): number | null => {
        if (part === undefined || part.trim() === "") return null;
        if (!/^-?\d+$/u.test(part.trim())) throw new Error("JSONPath slice values must be integers.");
        return Number(part.trim());
      };
      const step = parsePart(parts[2]) ?? 1;
      if (step === 0) throw new Error("JSONPath slice step cannot be zero.");
      selectors.push({ kind: "slice", start: parsePart(parts[0]), end: parsePart(parts[1]), step });
    } else {
      const items = splitTopLevel(content, ",");
      if (items.some((item) => !item)) throw new Error("JSONPath union contains an empty selector.");
      const parsedItems = items.map((item) => {
        if (/^-?\d+$/u.test(item)) return { kind: "index" as const, index: Number(item) };
        return { kind: "property" as const, name: parseQuotedJsonPathProperty(item) };
      });
      const only = parsedItems[0];
      if (!only) throw new Error("JSONPath bracket selector is empty.");
      selectors.push(parsedItems.length === 1 ? only : { kind: "union", items: parsedItems });
    }
    index = end + 1;
  }
  return selectors;
}

function childNodes(node: JsonPathNode): JsonPathNode[] {
  if (Array.isArray(node.value)) {
    return node.value.map((value, index) => ({ value, path: [...node.path, index] }));
  }
  if (isObject(node.value)) {
    return Object.entries(node.value).map(([key, value]) => ({ value, path: [...node.path, key] }));
  }
  return [];
}

function resolveFilterValue(value: unknown, segments: readonly (string | number)[]): { readonly found: boolean; readonly value: unknown } {
  let current = value;
  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) return { found: false, value: undefined };
      const index = segment < 0 ? current.length + segment : segment;
      if (index < 0 || index >= current.length) return { found: false, value: undefined };
      current = current[index];
    } else {
      if (!isObject(current) || !Object.hasOwn(current, segment)) return { found: false, value: undefined };
      current = current[segment];
    }
  }
  return { found: true, value: current };
}

function filterMatches(value: unknown, filter: JsonPathFilter): boolean {
  const resolved = resolveFilterValue(value, filter.path);
  if (filter.operator === "exists") return resolved.found;
  if (!resolved.found) return false;
  const expected = filter.expected;
  if (filter.operator === "==") return Object.is(resolved.value, expected);
  if (filter.operator === "!=") return !Object.is(resolved.value, expected);
  if (typeof resolved.value === "number" && typeof expected === "number") {
    if (filter.operator === "<") return resolved.value < expected;
    if (filter.operator === "<=") return resolved.value <= expected;
    if (filter.operator === ">") return resolved.value > expected;
    return resolved.value >= expected;
  }
  if (typeof resolved.value === "string" && typeof expected === "string") {
    if (filter.operator === "<") return resolved.value < expected;
    if (filter.operator === "<=") return resolved.value <= expected;
    if (filter.operator === ">") return resolved.value > expected;
    return resolved.value >= expected;
  }
  return false;
}

function normalizedIndex(index: number, length: number): number {
  return index < 0 ? length + index : index;
}

function applyJsonPathSelector(
  nodes: readonly JsonPathNode[],
  selector: JsonPathSelector,
  visitCounter: { value: number },
): JsonPathNode[] {
  const output: JsonPathNode[] = [];
  const push = (node: JsonPathNode): void => {
    visitCounter.value += 1;
    if (visitCounter.value > MAX_JSON_NODES) throw new Error("JSONPath traversal exceeds 10,000 visited nodes.");
    output.push(node);
  };
  for (const node of nodes) {
    if (selector.kind === "property") {
      if (isObject(node.value) && Object.hasOwn(node.value, selector.name)) {
        push({ value: node.value[selector.name], path: [...node.path, selector.name] });
      }
    } else if (selector.kind === "index") {
      if (Array.isArray(node.value)) {
        const index = normalizedIndex(selector.index, node.value.length);
        if (index >= 0 && index < node.value.length) push({ value: node.value[index], path: [...node.path, index] });
      }
    } else if (selector.kind === "wildcard") {
      for (const child of childNodes(node)) push(child);
    } else if (selector.kind === "recursive-property" || selector.kind === "recursive-wildcard") {
      const stack = [...childNodes(node)].reverse();
      while (stack.length) {
        const current = stack.pop();
        if (!current) break;
        visitCounter.value += 1;
        if (visitCounter.value > MAX_JSON_NODES) throw new Error("JSONPath traversal exceeds 10,000 visited nodes.");
        const last = current.path.at(-1);
        if (selector.kind === "recursive-wildcard" || last === selector.name) output.push(current);
        const descendants = childNodes(current);
        for (let index = descendants.length - 1; index >= 0; index -= 1) {
          const descendant = descendants[index];
          if (descendant) stack.push(descendant);
        }
      }
    } else if (selector.kind === "union") {
      for (const item of selector.items) {
        const selected = applyJsonPathSelector([node], item, visitCounter);
        output.push(...selected);
      }
    } else if (selector.kind === "slice") {
      if (!Array.isArray(node.value)) continue;
      const length = node.value.length;
      const step = selector.step;
      const defaultStart = step > 0 ? 0 : length - 1;
      const defaultEnd = step > 0 ? length : -1;
      let start = selector.start === null ? defaultStart : normalizedIndex(selector.start, length);
      let end = selector.end === null ? defaultEnd : normalizedIndex(selector.end, length);
      if (step > 0) {
        start = Math.min(Math.max(start, 0), length);
        end = Math.min(Math.max(end, 0), length);
        for (let itemIndex = start; itemIndex < end; itemIndex += step) {
          push({ value: node.value[itemIndex], path: [...node.path, itemIndex] });
        }
      } else {
        start = Math.min(Math.max(start, -1), length - 1);
        end = Math.min(Math.max(end, -1), length - 1);
        for (let itemIndex = start; itemIndex > end; itemIndex += step) {
          push({ value: node.value[itemIndex], path: [...node.path, itemIndex] });
        }
      }
    } else if (selector.kind === "filter") {
      for (const child of childNodes(node)) {
        visitCounter.value += 1;
        if (visitCounter.value > MAX_JSON_NODES) throw new Error("JSONPath traversal exceeds 10,000 visited nodes.");
        if (filterMatches(child.value, selector.filter)) output.push(child);
      }
    }
  }
  return output;
}

export function queryJsonPath(jsonText: string, pathText: string): JsonPathQueryResult {
  const root = parseBoundedJson(jsonText);
  const selectors = parseJsonPath(pathText);
  let nodes: JsonPathNode[] = [{ value: root, path: [] }];
  const visitCounter = { value: 1 };
  for (const selector of selectors) nodes = applyJsonPathSelector(nodes, selector, visitCounter);
  const deduplicated = new Map<string, JsonPathNode>();
  for (const node of nodes) deduplicated.set(pointerPath(node.path), node);
  const allMatches = [...deduplicated.values()];
  const truncated = allMatches.length > MAX_JSONPATH_MATCHES;
  const matches = allMatches.slice(0, MAX_JSONPATH_MATCHES).map((node) => ({
    path: pointerPath(node.path),
    value: node.value,
  }));
  return {
    matches,
    matchCount: allMatches.length,
    visitedNodeCount: visitCounter.value,
    truncated,
    supportedSyntax: [
      "root",
      "dot-and-bracket-properties",
      "array-indices-and-negative-indices",
      "wildcards",
      "recursive-descent",
      "unions",
      "array-slices",
      "bounded-comparison-filters",
    ],
  };
}

function stripTomlComment(line: string): string {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\" && quote === '"') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "#") return line.slice(0, index);
  }
  return line;
}

function balancedTomlValue(value: string): boolean {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let square = 0;
  let curly = 0;
  for (const character of value) {
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\" && quote === '"') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "[") square += 1;
    else if (character === "]") square -= 1;
    else if (character === "{") curly += 1;
    else if (character === "}") curly -= 1;
    if (square < 0 || curly < 0) return false;
  }
  return quote === null && square === 0 && curly === 0;
}

function splitTomlKeyPath(value: string): string[] {
  const parts = splitTopLevel(value, ".");
  if (!parts.length || parts.some((part) => !part)) throw new Error("TOML key path contains an empty segment.");
  return parts.map((part) => {
    if (/^[A-Za-z0-9_-]+$/u.test(part)) return part;
    if (part.startsWith('"')) {
      const parsed: unknown = JSON.parse(part);
      if (typeof parsed !== "string" || !parsed) throw new Error("TOML quoted key must be a non-empty string.");
      return parsed;
    }
    if (part.startsWith("'") && part.endsWith("'")) return part.slice(1, -1);
    throw new Error(`Unsupported TOML key syntax: ${part}`);
  });
}

function findTopLevelEquals(value: string): number {
  let quote: "'" | '"' | null = null;
  let escaped = false;
  let square = 0;
  let curly = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\" && quote === '"') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"') quote = character;
    else if (character === "[") square += 1;
    else if (character === "]") square -= 1;
    else if (character === "{") curly += 1;
    else if (character === "}") curly -= 1;
    else if (character === "=" && square === 0 && curly === 0) return index;
  }
  return -1;
}

function decodeTomlBasicString(value: string): string {
  if (value.includes('"""')) throw new Error("TOML multiline strings are not supported.");
  let result = "";
  for (let index = 1; index < value.length - 1; index += 1) {
    const character = value[index];
    if (character !== "\\") {
      result += character;
      continue;
    }
    index += 1;
    const escaped = value[index];
    if (escaped === undefined) throw new Error("Incomplete TOML string escape.");
    const simple: Record<string, string> = {
      b: "\b",
      t: "\t",
      n: "\n",
      f: "\f",
      r: "\r",
      '"': '"',
      "\\": "\\",
    };
    if (Object.hasOwn(simple, escaped)) {
      result += simple[escaped];
      continue;
    }
    if (escaped === "u" || escaped === "U") {
      const length = escaped === "u" ? 4 : 8;
      const hexadecimal = value.slice(index + 1, index + 1 + length);
      if (!new RegExp(`^[0-9a-fA-F]{${length}}$`, "u").test(hexadecimal)) {
        throw new Error("Invalid TOML Unicode escape.");
      }
      const codePoint = Number.parseInt(hexadecimal, 16);
      if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
        throw new Error("Invalid TOML Unicode code point.");
      }
      result += String.fromCodePoint(codePoint);
      index += length;
      continue;
    }
    throw new Error(`Unsupported TOML string escape: \\${escaped}`);
  }
  return result;
}

function classifyTomlValue(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (isObject(value)) return "object";
  return value === null ? "null" : typeof value;
}

function parseTomlValue(value: string, warnings: Set<string>, depth = 0): unknown {
  if (depth > MAX_TOML_DEPTH) throw new Error("TOML nesting exceeds 32 levels.");
  const trimmed = value.trim();
  if (!trimmed) throw new Error("TOML value is empty.");
  if (trimmed.startsWith('"')) {
    if (!trimmed.endsWith('"') || trimmed.length < 2) throw new Error("Unclosed TOML basic string.");
    return decodeTomlBasicString(trimmed);
  }
  if (trimmed.startsWith("'")) {
    if (!trimmed.endsWith("'") || trimmed.length < 2 || trimmed.includes("'''")) {
      throw new Error("Unclosed or multiline TOML literal string.");
    }
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[")) {
    if (!trimmed.endsWith("]")) throw new Error("Unclosed TOML array.");
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    const items = splitTopLevel(inner, ",");
    if (items.at(-1) === "") items.pop();
    if (items.some((item) => item === "")) throw new Error("TOML array contains an empty element.");
    const parsed = items.map((item) => parseTomlValue(item, warnings, depth + 1));
    const types = new Set(parsed.map(classifyTomlValue));
    if (types.size > 1) warnings.add("heterogeneous-array-preserved");
    return parsed;
  }
  if (trimmed.startsWith("{")) {
    if (!trimmed.endsWith("}")) throw new Error("Unclosed TOML inline table.");
    const result: Record<string, unknown> = {};
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return result;
    for (const entry of splitTopLevel(inner, ",")) {
      const equals = findTopLevelEquals(entry);
      if (equals < 0) throw new Error("TOML inline table entries require key = value.");
      const path = splitTomlKeyPath(entry.slice(0, equals).trim());
      if (path.length !== 1) throw new Error("Dotted keys inside inline tables are not supported.");
      const key = path[0];
      if (key === undefined) throw new Error("TOML inline table key is empty.");
      if (Object.hasOwn(result, key)) throw new Error(`Duplicate TOML key: ${key}`);
      result[key] = parseTomlValue(entry.slice(equals + 1), warnings, depth + 1);
    }
    return result;
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^[+-]?(?:inf|nan)$/iu.test(trimmed)) {
    throw new Error("TOML inf and nan cannot be represented in JSON.");
  }
  const normalized = trimmed.replaceAll("_", "");
  if (/^[+-]?0x[0-9a-f]+$/iu.test(normalized)) return Number.parseInt(normalized.replace(/^[+]/u, ""), 16);
  if (/^[+-]?0o[0-7]+$/iu.test(normalized)) {
    const sign = normalized.startsWith("-") ? -1 : 1;
    return sign * Number.parseInt(normalized.replace(/^[+-]?0o/iu, ""), 8);
  }
  if (/^[+-]?0b[01]+$/iu.test(normalized)) {
    const sign = normalized.startsWith("-") ? -1 : 1;
    return sign * Number.parseInt(normalized.replace(/^[+-]?0b/iu, ""), 2);
  }
  if (/^[+-]?(?:0|[1-9]\d*)$/u.test(normalized)) {
    const numeric = Number(normalized);
    if (!Number.isSafeInteger(numeric)) throw new Error("TOML integer exceeds the JSON safe-integer range.");
    return numeric;
  }
  if (/^[+-]?(?:(?:0|[1-9]\d*)\.\d+|(?:0|[1-9]\d*)(?:[eE][+-]?\d+)|(?:0|[1-9]\d*)\.\d+(?:[eE][+-]?\d+))$/u.test(normalized)) {
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric)) throw new Error("TOML number must be finite.");
    return numeric;
  }
  if (/^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})?)?$/u.test(trimmed)
    || /^\d{2}:\d{2}:\d{2}(?:\.\d+)?$/u.test(trimmed)) {
    warnings.add("toml-date-time-preserved-as-string");
    return trimmed;
  }
  throw new Error(`Unsupported or invalid TOML value: ${trimmed.slice(0, 80)}`);
}

function ensureTomlObjectPath(root: Record<string, unknown>, path: readonly string[]): Record<string, unknown> {
  let current = root;
  for (const segment of path) {
    if (!Object.hasOwn(current, segment)) current[segment] = {};
    const next = current[segment];
    if (!isObject(next)) throw new Error(`TOML path conflicts with an existing value: ${path.join(".")}`);
    current = next;
  }
  return current;
}

function assignTomlValue(target: Record<string, unknown>, path: readonly string[], value: unknown): void {
  if (!path.length) throw new Error("TOML key path is empty.");
  const parent = ensureTomlObjectPath(target, path.slice(0, -1));
  const key = path.at(-1);
  if (key === undefined) throw new Error("TOML key path is empty.");
  if (Object.hasOwn(parent, key)) throw new Error(`Duplicate TOML key: ${path.join(".")}`);
  parent[key] = value;
}

export function tomlToJson(text: string): TextConversionResult {
  if (!text.trim()) throw new Error("TOML input is empty.");
  if (text.length > MAX_INPUT_CHARS) throw new Error("TOML input exceeds 500,000 characters.");
  if (text.includes("\0")) throw new Error("TOML input contains a NUL character.");
  if (text.includes("\t")) throw new Error("Tabs are not supported in TOML indentation or spacing.");
  if (text.includes('"""') || text.includes("'''")) throw new Error("TOML multiline strings are not supported.");
  const root: Record<string, unknown> = {};
  let current = root;
  const declaredTables = new Set<string>();
  const arrayTablePaths = new Set<string>();
  const warnings = new Set<string>(["toml-1.0-bounded-subset"]);
  const lines = text.replace(/^\uFEFF/u, "").replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    let line = stripTomlComment(lines[lineIndex] ?? "").trim();
    if (!line) continue;
    if (line.startsWith("[[")) {
      if (!line.endsWith("]]")) throw new Error(`Invalid TOML array table at line ${lineIndex + 1}.`);
      const path = splitTomlKeyPath(line.slice(2, -2).trim());
      const pathKey = path.join(".");
      if (declaredTables.has(pathKey)) {
        throw new Error(`TOML array table conflicts with a declared table: ${pathKey}`);
      }
      arrayTablePaths.add(pathKey);
      const parent = ensureTomlObjectPath(root, path.slice(0, -1));
      const key = path.at(-1);
      if (key === undefined) throw new Error("TOML array table path is empty.");
      if (!Object.hasOwn(parent, key)) parent[key] = [];
      const collection = parent[key];
      if (!Array.isArray(collection)) throw new Error(`TOML array table conflicts with an existing value: ${path.join(".")}`);
      const item: Record<string, unknown> = {};
      collection.push(item);
      current = item;
      continue;
    }
    if (line.startsWith("[")) {
      if (!line.endsWith("]")) throw new Error(`Invalid TOML table at line ${lineIndex + 1}.`);
      const path = splitTomlKeyPath(line.slice(1, -1).trim());
      const pathKey = path.join(".");
      if (declaredTables.has(pathKey)) throw new Error(`Duplicate TOML table: ${pathKey}`);
      if (arrayTablePaths.has(pathKey)) {
        throw new Error(`TOML table conflicts with an array table: ${pathKey}`);
      }
      declaredTables.add(pathKey);
      current = ensureTomlObjectPath(root, path);
      continue;
    }
    while (!balancedTomlValue(line)) {
      lineIndex += 1;
      if (lineIndex >= lines.length) throw new Error("Unclosed TOML array or inline table.");
      line += `\n${stripTomlComment(lines[lineIndex] ?? "").trim()}`;
    }
    const equals = findTopLevelEquals(line);
    if (equals < 0) throw new Error(`TOML key/value pair is missing = at line ${lineIndex + 1}.`);
    const path = splitTomlKeyPath(line.slice(0, equals).trim());
    assignTomlValue(current, path, parseTomlValue(line.slice(equals + 1), warnings));
  }
  const nodeCount = countNodes(root, MAX_TOML_NODES, MAX_TOML_DEPTH);
  return { output: JSON.stringify(root, null, 2), nodeCount, warnings: [...warnings] };
}

function tomlKey(value: string): string {
  return /^[A-Za-z0-9_-]+$/u.test(value) ? value : JSON.stringify(value);
}

function tomlScalar(value: unknown, escapeFormulae = false): string {
  if (typeof value === "string") return JSON.stringify(escapeFormulae ? value.replace(/^([=+\-@])/u, "'$1") : value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("JSON non-finite numbers cannot be represented in TOML.");
    return String(value);
  }
  if (typeof value === "boolean") return String(value);
  if (value === null) throw new Error("JSON null has no TOML 1.0 representation.");
  throw new Error("Nested objects cannot be emitted as TOML scalar values.");
}

function isScalarArray(value: readonly unknown[]): boolean {
  return value.every((item) => !Array.isArray(item) && !isObject(item));
}

function formatTomlPath(path: readonly string[]): string {
  return path.map(tomlKey).join(".");
}

function emitTomlTable(
  object: Record<string, unknown>,
  path: readonly string[],
  lines: string[],
  isRoot: boolean,
): void {
  const scalars: [string, unknown][] = [];
  const tables: [string, Record<string, unknown>][] = [];
  const arrayTables: [string, readonly Record<string, unknown>[]][] = [];
  for (const [key, value] of Object.entries(object)) {
    if (isObject(value)) tables.push([key, value]);
    else if (Array.isArray(value) && value.every(isObject)) arrayTables.push([key, value]);
    else scalars.push([key, value]);
  }
  if (!isRoot) {
    if (lines.length && lines.at(-1) !== "") lines.push("");
    lines.push(`[${formatTomlPath(path)}]`);
  }
  for (const [key, value] of scalars) {
    if (Array.isArray(value)) {
      if (!isScalarArray(value)) throw new Error(`TOML array ${[...path, key].join(".")} contains unsupported nested values.`);
      lines.push(`${tomlKey(key)} = [${value.map((item) => tomlScalar(item)).join(", ")}]`);
    } else lines.push(`${tomlKey(key)} = ${tomlScalar(value)}`);
  }
  for (const [key, value] of tables) emitTomlTable(value, [...path, key], lines, false);
  for (const [key, values] of arrayTables) {
    for (const value of values) {
      if (lines.length && lines.at(-1) !== "") lines.push("");
      lines.push(`[[${formatTomlPath([...path, key])}]]`);
      const nestedTables: [string, Record<string, unknown>][] = [];
      for (const [itemKey, itemValue] of Object.entries(value)) {
        if (isObject(itemValue)) nestedTables.push([itemKey, itemValue]);
        else if (Array.isArray(itemValue)) {
          if (!isScalarArray(itemValue)) throw new Error("Nested arrays of objects inside TOML array tables are not supported.");
          lines.push(`${tomlKey(itemKey)} = [${itemValue.map((item) => tomlScalar(item)).join(", ")}]`);
        } else lines.push(`${tomlKey(itemKey)} = ${tomlScalar(itemValue)}`);
      }
      for (const [itemKey, itemValue] of nestedTables) emitTomlTable(itemValue, [...path, key, itemKey], lines, false);
    }
  }
}

export function jsonToToml(text: string): TextConversionResult {
  const value = parseBoundedJson(text);
  if (!isObject(value)) throw new Error("JSON → TOML requires a root object.");
  const nodeCount = countNodes(value, MAX_TOML_NODES, MAX_TOML_DEPTH);
  const lines: string[] = [];
  emitTomlTable(value, [], lines, true);
  return {
    output: `${lines.join("\n").replace(/\n{3,}/gu, "\n\n").trim()}\n`,
    nodeCount,
    warnings: ["toml-1.0-bounded-subset", "json-null-rejected"],
  };
}

interface CsvParseState {
  readonly rows: string[][];
  readonly issues: WorkbenchIssue[];
  readonly warnings: Set<string>;
  truncated: boolean;
}

function addIssue(state: CsvParseState, issue: WorkbenchIssue): void {
  if (state.issues.length < MAX_ISSUES) state.issues.push(issue);
  else state.truncated = true;
}

function parseCsvWithDelimiter(text: string, delimiter: CsvDelimiter): CsvParseState {
  const state: CsvParseState = { rows: [], issues: [], warnings: new Set<string>(), truncated: false };
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let quotedField = false;
  let afterClosingQuote = false;
  let cellCount = 0;
  const pushField = (): void => {
    row.push(field);
    cellCount += 1;
    field = "";
    quotedField = false;
    afterClosingQuote = false;
    if (row.length > MAX_CSV_COLUMNS) throw new Error("CSV exceeds 200 columns.");
  };
  const pushRow = (): void => {
    pushField();
    state.rows.push(row);
    row = [];
    if (state.rows.length > MAX_CSV_ROWS) throw new Error("CSV exceeds 10,000 rows.");
    if (cellCount > MAX_CSV_CELLS) throw new Error("CSV exceeds 500,000 cells.");
  };
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterClosingQuote = true;
        }
      } else field += character;
      continue;
    }
    if (afterClosingQuote) {
      if (character === delimiter) pushField();
      else if (character === "\n" || character === "\r") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        pushRow();
      } else if (character === " " || character === "\t") {
        state.warnings.add("whitespace-after-closing-quote");
      } else {
        addIssue(state, {
          path: `/row/${state.rows.length + 1}/column/${row.length + 1}`,
          code: "characters-after-closing-quote",
          message: "Unexpected characters follow a closing quote.",
        });
        field += character;
        afterClosingQuote = false;
      }
      continue;
    }
    if (character === delimiter) pushField();
    else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      pushRow();
    } else if (character === '"') {
      if (field.length === 0) {
        inQuotes = true;
        quotedField = true;
      } else {
        addIssue(state, {
          path: `/row/${state.rows.length + 1}/column/${row.length + 1}`,
          code: "quote-in-unquoted-field",
          message: "A quote appears inside an unquoted field.",
        });
        field += character;
      }
    } else field += character;
  }
  if (inQuotes) {
    addIssue(state, {
      path: `/row/${state.rows.length + 1}/column/${row.length + 1}`,
      code: "unclosed-quoted-field",
      message: "Quoted field is not closed.",
    });
  }
  if (field !== "" || row.length > 0 || quotedField || afterClosingQuote) pushRow();
  if (state.rows.length > 1 && state.rows.at(-1)?.every((value) => value === "")) state.rows.pop();
  return state;
}

function delimiterScore(text: string, delimiter: CsvDelimiter): number {
  try {
    const state = parseCsvWithDelimiter(text.slice(0, 100_000), delimiter);
    const sample = state.rows.slice(0, 25);
    if (!sample.length) return -10_000;
    const counts = sample.map((row) => row.length);
    const frequency = new Map<number, number>();
    for (const count of counts) frequency.set(count, (frequency.get(count) ?? 0) + 1);
    const [modeColumns = 1, modeCount = 0] = [...frequency.entries()].sort((left, right) => right[1] - left[1])[0] ?? [];
    return modeColumns * 100 + modeCount * 10 - state.issues.length * 50 - counts.filter((count) => count !== modeColumns).length * 20;
  } catch {
    return -10_000;
  }
}

function detectDelimiter(text: string): CsvDelimiter {
  const candidates: readonly CsvDelimiter[] = [",", ";", "\t", "|"];
  return [...candidates].sort((left, right) => delimiterScore(text, right) - delimiterScore(text, left))[0] ?? ",";
}

function spreadsheetFormulaRisk(value: string): boolean {
  return /^[\u0009\u000d\u0020]*[=+\-@]/u.test(value);
}

function analyzeCsvRows(
  text: string,
  delimiterOption: CsvDelimiterOption,
  header: boolean,
): CsvAnalysisResult {
  if (!text.trim()) throw new Error("CSV input is empty.");
  if (text.length > MAX_INPUT_CHARS) throw new Error("CSV input exceeds 500,000 characters.");
  const normalized = text.replace(/^\uFEFF/u, "");
  const delimiter = delimiterOption === "auto" ? detectDelimiter(normalized) : delimiterOption;
  const state = parseCsvWithDelimiter(normalized, delimiter);
  const expectedColumns = state.rows[0]?.length ?? 0;
  for (let index = 0; index < state.rows.length; index += 1) {
    const current = state.rows[index];
    if (current && current.length !== expectedColumns) {
      addIssue(state, {
        path: `/row/${index + 1}`,
        code: "inconsistent-column-count",
        message: `Expected ${expectedColumns} columns but found ${current.length}.`,
      });
    }
  }
  let emptyHeaderCount = 0;
  let duplicateHeaderCount = 0;
  if (header && state.rows.length) {
    const seen = new Set<string>();
    for (const [index, name] of (state.rows[0] ?? []).entries()) {
      if (!name.trim()) {
        emptyHeaderCount += 1;
        addIssue(state, {
          path: `/row/1/column/${index + 1}`,
          code: "empty-header",
          message: "Header name is empty.",
        });
      } else if (seen.has(name)) {
        duplicateHeaderCount += 1;
        addIssue(state, {
          path: `/row/1/column/${index + 1}`,
          code: "duplicate-header",
          message: `Duplicate header name: ${name}`,
        });
      }
      seen.add(name);
    }
  }
  let formulaRiskCount = 0;
  for (const row of state.rows) {
    for (const value of row) if (spreadsheetFormulaRisk(value)) formulaRiskCount += 1;
  }
  if (formulaRiskCount) state.warnings.add("spreadsheet-formula-like-fields-present");
  if (delimiterOption === "auto") state.warnings.add("delimiter-auto-detected");
  return {
    valid: state.issues.length === 0,
    delimiter,
    rows: state.rows,
    rowCount: state.rows.length,
    columnCount: expectedColumns,
    issueCount: state.issues.length,
    issues: state.issues,
    warnings: [...state.warnings],
    formulaRiskCount,
    emptyHeaderCount,
    duplicateHeaderCount,
    truncated: state.truncated,
  };
}

export function csvToJson(
  text: string,
  options: { readonly delimiter?: CsvDelimiterOption; readonly header?: boolean } = {},
): CsvToJsonResult {
  const header = options.header ?? true;
  const result = analyzeCsvRows(text, options.delimiter ?? "auto", header);
  let output = "";
  if (result.valid) {
    if (header) {
      const headers = result.rows[0] ?? [];
      const records = result.rows.slice(1).map((row) => Object.fromEntries(headers.map((name, index) => [name, row[index] ?? ""])));
      output = JSON.stringify(records, null, 2);
    } else output = JSON.stringify(result.rows, null, 2);
  }
  return { ...result, output };
}

function csvCell(value: unknown): string {
  if (value === null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  throw new Error("JSON → CSV supports only scalar values and null.");
}

function escapeCsvField(value: string, delimiter: CsvDelimiter): string {
  return value.includes(delimiter) || /["\r\n]/u.test(value)
    ? `"${value.replaceAll('"', '""')}"`
    : value;
}

export function jsonToCsv(
  text: string,
  options: { readonly delimiter?: CsvDelimiter; readonly escapeFormulae?: boolean } = {},
): JsonToCsvResult {
  const value = parseBoundedJson(text);
  if (!Array.isArray(value)) throw new Error("JSON → CSV requires a root array.");
  if (value.length > MAX_CSV_ROWS) throw new Error("JSON array exceeds 10,000 rows.");
  const delimiter = options.delimiter ?? ",";
  const escapeFormulae = options.escapeFormulae ?? false;
  if (value.length === 0) {
    return {
      output: "",
      rowCount: 0,
      columnCount: 0,
      formulaRiskCount: 0,
      escapedFormulaCount: 0,
      warnings: ["empty-json-array"],
    };
  }
  let rows: string[][];
  if (value.every(isObject)) {
    const headers: string[] = [];
    const seen = new Set<string>();
    for (const object of value) {
      for (const key of Object.keys(object)) {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      }
    }
    if (headers.length > MAX_CSV_COLUMNS) throw new Error("JSON objects produce more than 200 CSV columns.");
    rows = [headers, ...value.map((object) => headers.map((key) => csvCell(object[key] ?? null)))];
  } else if (value.every(Array.isArray)) {
    rows = value.map((row) => row.map(csvCell));
    const maximumColumns = Math.max(0, ...rows.map((row) => row.length));
    if (maximumColumns > MAX_CSV_COLUMNS) throw new Error("JSON arrays produce more than 200 CSV columns.");
    if (rows.some((row) => row.length !== maximumColumns)) throw new Error("JSON row arrays must have a consistent length.");
  } else {
    throw new Error("JSON → CSV requires an array of objects or an array of arrays.");
  }
  let formulaRiskCount = 0;
  let escapedFormulaCount = 0;
  const outputRows = rows.map((row) => row.map((field) => {
    if (!spreadsheetFormulaRisk(field)) return escapeCsvField(field, delimiter);
    formulaRiskCount += 1;
    if (!escapeFormulae) return escapeCsvField(field, delimiter);
    escapedFormulaCount += 1;
    return escapeCsvField(`'${field}`, delimiter);
  }).join(delimiter));
  const warnings: string[] = [];
  if (formulaRiskCount) warnings.push("spreadsheet-formula-like-fields-present");
  if (escapedFormulaCount) warnings.push("formula-like-fields-prefixed-with-apostrophe");
  return {
    output: `${outputRows.join("\r\n")}\r\n`,
    rowCount: rows.length,
    columnCount: rows[0]?.length ?? 0,
    formulaRiskCount,
    escapedFormulaCount,
    warnings,
  };
}

export function analyzeCsv(
  text: string,
  options: { readonly delimiter?: CsvDelimiterOption; readonly header?: boolean } = {},
): CsvAnalysisResult {
  return analyzeCsvRows(text, options.delimiter ?? "auto", options.header ?? true);
}
