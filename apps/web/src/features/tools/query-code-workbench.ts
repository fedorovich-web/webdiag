export type KeywordCase = "upper" | "lower" | "preserve";
export type SqlDialect = "standard" | "mysql";

export interface FormatOptions {
  readonly indentSize?: 2 | 4;
  readonly keywordCase?: KeywordCase;
  readonly sqlDialect?: SqlDialect;
}

export interface FormatResult {
  readonly output: string;
  readonly tokenCount: number;
  readonly maximumDepth: number;
  readonly warnings: readonly string[];
}

export type RegexRiskLevel = "low" | "review" | "high";

export interface RegexRiskFinding {
  readonly code: string;
  readonly message: string;
  readonly level: Exclude<RegexRiskLevel, "low">;
}

export interface RegexRiskReport {
  readonly level: RegexRiskLevel;
  readonly findings: readonly RegexRiskFinding[];
}

export interface RegexWorkerRequest {
  readonly pattern: string;
  readonly flags: string;
  readonly text: string;
  readonly maximumMatches: number;
  readonly maximumPreviewCharacters: number;
}

export interface RegexWorkerMatch {
  readonly index: number;
  readonly endIndex: number;
  readonly value: string;
  readonly captures: readonly (string | null)[];
  readonly namedCaptures: Readonly<Record<string, string | null>>;
  readonly indices: readonly (readonly [number, number] | null)[] | null;
}

export interface RegexWorkerSuccess {
  readonly kind: "result";
  readonly ok: true;
  readonly matchCount: number;
  readonly truncated: boolean;
  readonly elapsedMilliseconds: number;
  readonly matches: readonly RegexWorkerMatch[];
}

export interface RegexWorkerFailure {
  readonly kind: "result";
  readonly ok: false;
  readonly error: string;
}

export type RegexWorkerResponse = RegexWorkerSuccess | RegexWorkerFailure;

export interface RegexWorkerReady {
  readonly kind: "ready";
}

export type RegexWorkerMessage = RegexWorkerReady | RegexWorkerResponse;

interface Token {
  readonly kind: "word" | "number" | "string" | "identifier" | "comment" | "operator" | "punctuation" | "placeholder";
  readonly value: string;
  readonly upper: string;
}

const MAXIMUM_INPUT_CHARACTERS = 500_000;
const MAXIMUM_TOKENS = 20_000;
const MAXIMUM_NESTING_DEPTH = 64;
const MAXIMUM_REGEX_PATTERN_CHARACTERS = 2_000;
const MAXIMUM_REGEX_TEXT_CHARACTERS = 100_000;
const MAXIMUM_REGEX_FLAGS = 8;

export const REGEX_WORKER_PATH = "/workers/regex-lab-worker.js";

const SQL_KEYWORDS = new Set([
  "ADD", "ALL", "ALTER", "AND", "AS", "ASC", "BEGIN", "BETWEEN", "BY", "CASE", "CHECK", "COLUMN", "COMMIT",
  "CONFLICT", "CONSTRAINT", "CREATE", "CROSS", "CURRENT", "DATABASE", "DEFAULT", "DELETE", "DESC", "DISTINCT",
  "DO", "DROP", "ELSE", "END", "EXCEPT", "EXISTS", "FETCH", "FILTER", "FIRST", "FOR", "FOREIGN", "FROM",
  "FULL", "GROUP", "HAVING", "ILIKE", "IN", "INDEX", "INNER", "INSERT", "INTERSECT", "INTO", "IS", "JOIN",
  "KEY", "LAST", "LATERAL", "LEFT", "LIKE", "LIMIT", "LOCK", "MERGE", "NATURAL", "NOT", "NULL", "NULLS",
  "OFFSET", "ON", "ONLY", "OR", "ORDER", "OUTER", "OVER", "PARTITION", "PRIMARY", "REFERENCES", "RETURNING",
  "RIGHT", "ROLLBACK", "ROW", "ROWS", "SELECT", "SET", "TABLE", "THEN", "TO", "TRUNCATE", "UNION", "UNIQUE",
  "UPDATE", "USING", "VALUES", "VIEW", "WHEN", "WHERE", "WINDOW", "WITH",
]);

const SQL_CLAUSE_STARTERS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "FETCH", "RETURNING", "VALUES",
  "SET", "INSERT INTO", "UPDATE", "DELETE FROM", "UNION", "UNION ALL", "INTERSECT", "EXCEPT", "WITH", "JOIN",
  "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN", "CROSS JOIN", "ON", "WHEN", "ELSE",
]);

const SQL_LIST_CLAUSES = new Set(["SELECT", "GROUP BY", "ORDER BY", "SET", "RETURNING", "VALUES", "WITH"]);

function assertInput(value: string, label: string): void {
  if (value.length > MAXIMUM_INPUT_CHARACTERS) {
    throw new Error(`${label} exceeds the ${MAXIMUM_INPUT_CHARACTERS.toLocaleString("en-US")}-character limit.`);
  }
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function createToken(kind: Token["kind"], value: string): Token {
  return { kind, value, upper: value.toUpperCase() };
}

function isGraphqlUnicodeScalar(value: number): boolean {
  return value <= 0x10FFFF && !(value >= 0xD800 && value <= 0xDFFF);
}

function assertGraphqlSourceCharacters(input: string): void {
  for (let index = 0; index < input.length; index += 1) {
    const codeUnit = input.charCodeAt(index);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDBFF) {
      const trailing = input.charCodeAt(index + 1);
      if (trailing >= 0xDC00 && trailing <= 0xDFFF) {
        index += 1;
        continue;
      }
      throw new Error(`Invalid GraphQL source character at character ${index + 1}: expected a Unicode scalar value.`);
    }
    if (codeUnit >= 0xDC00 && codeUnit <= 0xDFFF) {
      throw new Error(`Invalid GraphQL source character at character ${index + 1}: expected a Unicode scalar value.`);
    }
  }
}

function readGraphqlStringEscape(input: string, index: number): number {
  const escaped = input[index + 1] ?? "";
  if ('"\\/bfnrt'.includes(escaped)) return index + 2;
  if (escaped !== "u") throw new Error(`Invalid GraphQL string escape at character ${index + 1}.`);

  if (input[index + 2] === "{") {
    const end = input.indexOf("}", index + 3);
    const digits = end === -1 ? "" : input.slice(index + 3, end);
    if (end === -1 || !/^[0-9A-Fa-f]+$/u.test(digits)) {
      throw new Error(`Invalid GraphQL string escape at character ${index + 1}.`);
    }
    const value = Number.parseInt(digits, 16);
    if (!isGraphqlUnicodeScalar(value)) {
      throw new Error(`Invalid GraphQL string escape at character ${index + 1}: Unicode escape must encode a scalar value.`);
    }
    return end + 1;
  }

  const digits = input.slice(index + 2, index + 6);
  if (!/^[0-9A-Fa-f]{4}$/u.test(digits)) {
    throw new Error(`Invalid GraphQL string escape at character ${index + 1}.`);
  }
  const value = Number.parseInt(digits, 16);
  if (value >= 0xD800 && value <= 0xDBFF) {
    const trailingStart = index + 6;
    const trailingDigits = input.startsWith("\\u", trailingStart)
      ? input.slice(trailingStart + 2, trailingStart + 6)
      : "";
    if (!/^[0-9A-Fa-f]{4}$/u.test(trailingDigits)) {
      throw new Error(`Invalid GraphQL string escape at character ${index + 1}: leading surrogate must be followed by a trailing surrogate escape.`);
    }
    const trailingValue = Number.parseInt(trailingDigits, 16);
    if (trailingValue < 0xDC00 || trailingValue > 0xDFFF) {
      throw new Error(`Invalid GraphQL string escape at character ${index + 1}: leading surrogate must be followed by a trailing surrogate escape.`);
    }
    return trailingStart + 6;
  }
  if (!isGraphqlUnicodeScalar(value)) {
    throw new Error(`Invalid GraphQL string escape at character ${index + 1}: Unicode escape must encode a scalar value.`);
  }
  return index + 6;
}

function readQuoted(
  input: string,
  start: number,
  quote: string,
  doubledEscape: string | null,
  allowLineBreaks = true,
  backslashEscapes = false,
): [string, number] {
  let index = start + quote.length;
  while (index < input.length) {
    if (doubledEscape && input.startsWith(doubledEscape, index)) {
      index += doubledEscape.length;
      continue;
    }
    if (input.startsWith(quote, index)) return [input.slice(start, index + quote.length), index + quote.length];
    if (!allowLineBreaks && (input[index] === "\n" || input[index] === "\r")) {
      throw new Error(`GraphQL strings cannot contain an unescaped line break at character ${index + 1}.`);
    }
    if (!allowLineBreaks && quote === '"' && input[index] === "\\") {
      index = readGraphqlStringEscape(input, index);
      continue;
    }
    if (backslashEscapes && input[index] === "\\") {
      index += 2;
      continue;
    }
    index += 1;
  }
  throw new Error(`Unterminated quoted value starting at character ${start + 1}.`);
}

function readSqlBlockComment(input: string, start: number, nested: boolean): [string, number] {
  let index = start + 2;
  let depth = 1;
  while (index < input.length) {
    if (nested && input.startsWith("/*", index)) {
      depth += 1;
      index += 2;
      continue;
    }
    if (input.startsWith("*/", index)) {
      depth -= 1;
      index += 2;
      if (depth === 0) return [input.slice(start, index), index];
      continue;
    }
    index += 1;
  }
  throw new Error(`Unterminated SQL block comment starting at character ${start + 1}.`);
}

function readSqlLineComment(input: string, start: number, markerLength: number): [string, number] {
  const end = input.slice(start + markerLength).search(/[\r\n]/u);
  const next = end === -1 ? input.length : start + markerLength + end;
  return [input.slice(start, next).trimEnd(), next];
}

function isMysqlDashCommentStart(input: string, index: number): boolean {
  if (!input.startsWith("--", index)) return false;
  const following = input[index + 2] ?? "";
  if (!following) return false;
  const code = following.charCodeAt(0);
  return /\s/u.test(following) || code <= 0x1F || (code >= 0x7F && code <= 0x9F);
}

function readCodePoint(input: string, index: number): { readonly value: string; readonly next: number } {
  const codePoint = input.codePointAt(index);
  if (codePoint === undefined) return { value: "", next: index };
  const value = String.fromCodePoint(codePoint);
  return { value, next: index + value.length };
}

function isPostgresqlIdentifierStart(value: string): boolean {
  return value === "_" || /^\p{L}$/u.test(value);
}

function isPostgresqlIdentifierContinuation(value: string, allowDollar: boolean): boolean {
  return isPostgresqlIdentifierStart(value) || /^[0-9]$/u.test(value) || (allowDollar && value === "$");
}

function readPostgresqlIdentifier(input: string, start: number, allowDollar = true): [string, number] {
  const first = readCodePoint(input, start);
  if (!isPostgresqlIdentifierStart(first.value)) return ["", start];
  let index = first.next;
  while (index < input.length) {
    const current = readCodePoint(input, index);
    if (!isPostgresqlIdentifierContinuation(current.value, allowDollar)) break;
    index = current.next;
  }
  return [input.slice(start, index), index];
}

function tokenizeSql(
  input: string,
  sqlDialect: SqlDialect = "standard",
): { readonly tokens: Token[]; readonly warnings: string[] } {
  assertInput(input, "SQL input");
  const tokens: Token[] = [];
  const warnings: string[] = [];
  const mysql = sqlDialect === "mysql";
  let index = 0;

  const push = (token: Token): void => {
    tokens.push(token);
    if (tokens.length > MAXIMUM_TOKENS) throw new Error(`SQL input exceeds the ${MAXIMUM_TOKENS.toLocaleString("en-US")}-token limit.`);
  };

  while (index < input.length) {
    const character = input[index] ?? "";
    if (/\s/u.test(character)) {
      index += 1;
      continue;
    }

    if (mysql && character === "#") {
      const [value, next] = readSqlLineComment(input, index, 1);
      push(createToken("comment", value));
      index = next;
      continue;
    }

    if (input.startsWith("--", index) && (!mysql || isMysqlDashCommentStart(input, index))) {
      const [value, next] = readSqlLineComment(input, index, 2);
      push(createToken("comment", value));
      index = next;
      continue;
    }

    if (input.startsWith("/*", index)) {
      const [value, next] = readSqlBlockComment(input, index, !mysql);
      push(createToken("comment", value));
      index = next;
      continue;
    }

    if ((character === "E" || character === "e") && input[index + 1] === "'") {
      const [, next] = readQuoted(input, index + 1, "'", "''", true, true);
      push(createToken("string", input.slice(index, next)));
      index = next;
      continue;
    }

    if ("BbXxNn".includes(character) && input[index + 1] === "'") {
      const mysqlNationalString = character === "N" || character === "n";
      const [, next] = readQuoted(input, index + 1, "'", "''", true, mysqlNationalString && mysql);
      push(createToken("string", input.slice(index, next)));
      index = next;
      continue;
    }

    if ((character === "U" || character === "u") && input[index + 1] === "&") {
      const quote = input[index + 2] ?? "";
      if (quote === "'" || quote === '"') {
        const [, next] = readQuoted(input, index + 2, quote, quote + quote);
        push(createToken(quote === "'" ? "string" : "identifier", input.slice(index, next)));
        index = next;
        continue;
      }
    }

    if (character === "'") {
      const [value, next] = readQuoted(input, index, "'", "''", true, mysql);
      push(createToken("string", value));
      index = next;
      continue;
    }

    if (character === '"' || character === "`") {
      const mysqlDoubleQuotedString = mysql && character === '"';
      const [value, next] = readQuoted(input, index, character, character + character, true, mysqlDoubleQuotedString);
      if (character === "`") warnings.push("mysql-backtick-identifier");
      push(createToken(mysqlDoubleQuotedString ? "string" : "identifier", value));
      index = next;
      continue;
    }

    if (character === "[") {
      let end = index + 1;
      while (end < input.length) {
        if (input.startsWith("]]", end)) {
          end += 2;
          continue;
        }
        if (input[end] === "]") break;
        end += 1;
      }
      if (end >= input.length) throw new Error(`Unterminated bracketed SQL identifier starting at character ${index + 1}.`);
      warnings.push("sql-server-bracket-identifier");
      push(createToken("identifier", input.slice(index, end + 1)));
      index = end + 1;
      continue;
    }

    if (!mysql && character === "$") {
      const tagStart = readCodePoint(input, index + 1);
      if (isPostgresqlIdentifierStart(tagStart.value)) {
        const [tag, tagEnd] = readPostgresqlIdentifier(input, index + 1, false);
        if (tag && input[tagEnd] === "$") {
          const marker = `$${tag}$`;
          const end = input.indexOf(marker, tagEnd + 1);
          if (end === -1) throw new Error(`Unterminated PostgreSQL dollar-quoted string starting at character ${index + 1}.`);
          warnings.push("postgres-dollar-quoted-string");
          push(createToken("string", input.slice(index, end + marker.length)));
          index = end + marker.length;
          continue;
        }
      }
    }

    if (mysql && character === "$" && /[A-Za-z_]/u.test(input[index + 1] ?? "")) {
      const markerMatch = input.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/u);
      if (markerMatch) {
        const marker = markerMatch[0];
        const end = input.indexOf(marker, index + marker.length);
        if (end === -1) throw new Error(`Unterminated PostgreSQL dollar-quoted string starting at character ${index + 1}.`);
        warnings.push("postgres-dollar-quoted-string");
        push(createToken("string", input.slice(index, end + marker.length)));
        index = end + marker.length;
        continue;
      }
    }

    if (character === "$" && input[index + 1] === "$") {
      const end = input.indexOf("$$", index + 2);
      if (end === -1) throw new Error(`Unterminated PostgreSQL dollar-quoted string starting at character ${index + 1}.`);
      warnings.push("postgres-dollar-quoted-string");
      push(createToken("string", input.slice(index, end + 2)));
      index = end + 2;
      continue;
    }

    if (!mysql) {
      const current = readCodePoint(input, index);
      if (isPostgresqlIdentifierStart(current.value)) {
        const [value, next] = readPostgresqlIdentifier(input, index);
        push(createToken("word", value));
        index = next;
        continue;
      }
    }

    if (mysql && /[A-Za-z_]/u.test(character)) {
      const match = input.slice(index).match(/^[A-Za-z_][A-Za-z0-9_$]*/u);
      if (!match) throw new Error(`Unable to tokenize SQL at character ${index + 1}.`);
      push(createToken("word", match[0]));
      index += match[0].length;
      continue;
    }

    if (/\d/u.test(character) || (character === "." && /\d/u.test(input[index + 1] ?? ""))) {
      const match = input.slice(index).match(/^(?:0[xX]_?[0-9A-Fa-f](?:_?[0-9A-Fa-f])*|0[oO]_?[0-7](?:_?[0-7])*|0[bB]_?[01](?:_?[01])*|(?:\d(?:_?\d)*(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?)/u);
      if (!match) throw new Error(`Unable to tokenize SQL number at character ${index + 1}.`);
      push(createToken("number", match[0]));
      index += match[0].length;
      continue;
    }

    const operator = [
      "#>>", "->>", "!~*", "<=>",
      "::", "<=", ">=", "<>", "!=", "||", "&&", "->", "#>", "#-", ":=", "=>", "!~", "~*",
      "<<", ">>", "!<", "!>", "@>", "<@", "?|", "?&", "@?", "@@",
      "+=", "-=", "*=", "/=", "%=", "&=", "^=", "|=",
    ].find((value) => input.startsWith(value, index));
    if (operator) {
      if ([
        "::", "->", "->>", "#>", "#>>", "~*", "!~", "!~*", "<=>", "<<", ">>", "!<", "!>",
        "@>", "<@", "?|", "?&", "#-", "@?", "@@", "+=", "-=", "*=", "/=", "%=", "&=", "^=", "|=",
      ].includes(operator)) warnings.push("dialect-specific-operator");
      push(createToken("operator", operator));
      index += operator.length;
      continue;
    }

    const placeholderMatch = input.slice(index).match(/^(?:\?|:[A-Za-z_][A-Za-z0-9_]*|@[A-Za-z_][A-Za-z0-9_]*|\$\d+)/u);
    if (placeholderMatch) {
      push(createToken("placeholder", placeholderMatch[0]));
      index += placeholderMatch[0].length;
      continue;
    }

    if ("(),;.".includes(character)) {
      push(createToken("punctuation", character));
      index += 1;
      continue;
    }

    if ("+-*/%=<>~!|&^".includes(character)) {
      push(createToken("operator", character));
      index += 1;
      continue;
    }

    throw new Error(`Unsupported SQL character ${JSON.stringify(character)} at position ${index + 1}.`);
  }

  return { tokens, warnings: unique(warnings) };
}

function applyKeywordCase(value: string, keywordCase: KeywordCase): string {
  if (keywordCase === "upper") return value.toUpperCase();
  if (keywordCase === "lower") return value.toLowerCase();
  return value;
}

function sqlPhraseAt(tokens: readonly Token[], index: number): { readonly phrase: string; readonly length: number } | null {
  const one = tokens[index]?.upper ?? "";
  const two = `${one} ${tokens[index + 1]?.upper ?? ""}`.trim();
  if (["GROUP BY", "ORDER BY", "INSERT INTO", "DELETE FROM", "UNION ALL", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "INNER JOIN", "CROSS JOIN"].includes(two)) {
    return { phrase: two, length: 2 };
  }
  if (SQL_CLAUSE_STARTERS.has(one)) return { phrase: one, length: 1 };
  return null;
}

class LineWriter {
  readonly lines: string[] = [];
  current = "";
  lineIndent = 0;
  constructor(readonly indentUnit: string) {}

  write(value: string, spaceBefore = true): void {
    if (!value) return;
    if (!this.current) {
      this.current = value;
      return;
    }
    if (spaceBefore && !this.current.endsWith(" ")) this.current += " ";
    this.current += value;
  }

  trimEnd(): void {
    this.current = this.current.trimEnd();
  }

  newline(nextIndent: number): void {
    const trimmed = this.current.trimEnd();
    if (trimmed) this.lines.push(`${this.indentUnit.repeat(Math.max(0, this.lineIndent))}${trimmed}`);
    this.current = "";
    this.lineIndent = Math.max(0, nextIndent);
  }

  finish(): string {
    this.newline(this.lineIndent);
    return this.lines.join("\n").trim();
  }
}

export function formatSql(input: string, options: FormatOptions = {}): FormatResult {
  const indentSize = options.indentSize ?? 2;
  const keywordCase = options.keywordCase ?? "upper";
  const sqlDialect = options.sqlDialect ?? "standard";
  const { tokens, warnings } = tokenizeSql(input, sqlDialect);
  const writer = new LineWriter(" ".repeat(indentSize));
  let indent = 0;
  let maximumDepth = 0;
  let parenthesisDepth = 0;
  let currentClause = "";
  let clauseDepth = 0;
  let previous: Token | null = null;
  const parenthesisContexts: Array<{
    readonly subquery: boolean;
    readonly outerClause: string;
    readonly outerClauseDepth: number;
  }> = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    const next = tokens[index + 1] ?? null;
    const phrase = token.kind === "word" ? sqlPhraseAt(tokens, index) : null;

    if (token.kind === "comment") {
      writer.newline(indent);
      writer.write(token.value, false);
      writer.newline(indent);
      previous = token;
      continue;
    }

    if (phrase && parenthesisDepth === clauseDepth && SQL_CLAUSE_STARTERS.has(phrase.phrase)) {
      if (writer.current) writer.newline(["ON", "WHEN", "ELSE"].includes(phrase.phrase) ? indent + 1 : indent);
      const phraseTokens = tokens.slice(index, index + phrase.length);
      writer.write(phraseTokens.map((item) => applyKeywordCase(item.value, keywordCase)).join(" "), false);
      currentClause = phrase.phrase;
      clauseDepth = parenthesisDepth;
      index += phrase.length - 1;
      previous = phraseTokens.at(-1) ?? token;
      continue;
    }

    if (token.value === "(") {
      const functionCall = previous && ["word", "identifier"].includes(previous.kind) && !SQL_KEYWORDS.has(previous.upper);
      const subquery = next?.upper === "SELECT" || next?.upper === "WITH";
      writer.write("(", !functionCall && previous?.value !== ".");
      parenthesisDepth += 1;
      parenthesisContexts.push({ subquery, outerClause: currentClause, outerClauseDepth: clauseDepth });
      maximumDepth = Math.max(maximumDepth, parenthesisDepth);
      if (parenthesisDepth > MAXIMUM_NESTING_DEPTH) throw new Error(`SQL nesting exceeds ${MAXIMUM_NESTING_DEPTH} levels.`);
      if (subquery) {
        indent += 1;
        writer.newline(indent);
        currentClause = "";
        clauseDepth = parenthesisDepth;
      }
      previous = token;
      continue;
    }

    if (token.value === ")") {
      if (parenthesisDepth === 0) throw new Error("SQL contains a closing parenthesis without a matching opening parenthesis.");
      const context = parenthesisContexts.pop();
      const subquery = context?.subquery ?? false;
      if (subquery) {
        indent = Math.max(0, indent - 1);
        writer.newline(indent);
      }
      writer.trimEnd();
      writer.write(")", false);
      parenthesisDepth -= 1;
      if (subquery && context) {
        currentClause = context.outerClause;
        clauseDepth = context.outerClauseDepth;
      } else if (clauseDepth > parenthesisDepth) {
        clauseDepth = parenthesisDepth;
      }
      previous = token;
      continue;
    }

    if (token.value === ",") {
      writer.trimEnd();
      writer.write(",", false);
      if (SQL_LIST_CLAUSES.has(currentClause) && parenthesisDepth === clauseDepth) {
        writer.newline(currentClause === "WITH" ? indent : indent + 1);
      }
      else writer.write("", false);
      previous = token;
      continue;
    }

    if (token.value === ";") {
      writer.trimEnd();
      writer.write(";", false);
      writer.newline(0);
      currentClause = "";
      clauseDepth = 0;
      indent = 0;
      previous = token;
      continue;
    }

    if (token.value === ".") {
      writer.trimEnd();
      writer.write(".", false);
      previous = token;
      continue;
    }

    if (token.kind === "operator") {
      writer.write(token.value, true);
      previous = token;
      continue;
    }

    const isKeyword = token.kind === "word" && SQL_KEYWORDS.has(token.upper);
    const value = isKeyword ? applyKeywordCase(token.value, keywordCase) : token.value;
    const noSpace = previous?.value === "(" || previous?.value === "." || previous?.value === ":";
    writer.write(value, !noSpace);
    previous = token;
  }

  if (parenthesisDepth !== 0) throw new Error("SQL contains an opening parenthesis without a matching closing parenthesis.");
  return {
    output: writer.finish(),
    tokenCount: tokens.length,
    maximumDepth,
    warnings,
  };
}

function tokenizeGraphql(input: string): Token[] {
  assertInput(input, "GraphQL input");
  assertGraphqlSourceCharacters(input);
  const tokens: Token[] = [];
  let index = 0;
  const push = (token: Token): void => {
    tokens.push(token);
    if (tokens.length > MAXIMUM_TOKENS) throw new Error(`GraphQL input exceeds the ${MAXIMUM_TOKENS.toLocaleString("en-US")}-token limit.`);
  };

  while (index < input.length) {
    const character = input[index] ?? "";
    if (
      character === "\uFEFF"
      || character === "\t"
      || character === " "
      || character === "\n"
      || character === "\r"
      || character === ","
    ) {
      index += 1;
      continue;
    }
    if (character === "#") {
      let next = index + 1;
      while (next < input.length && input[next] !== "\n" && input[next] !== "\r") next += 1;
      push(createToken("comment", input.slice(index, next).trimEnd()));
      index = next;
      continue;
    }
    if (input.startsWith('"""', index)) {
      let end = index + 3;
      while (end < input.length) {
        if (input.startsWith('\\"""', end)) {
          end += 4;
          continue;
        }
        if (input.startsWith('"""', end)) break;
        end += 1;
      }
      if (end >= input.length) throw new Error(`Unterminated GraphQL block string starting at character ${index + 1}.`);
      push(createToken("string", input.slice(index, end + 3)));
      index = end + 3;
      continue;
    }
    if (character === '"') {
      const [value, next] = readQuoted(input, index, '"', null, false);
      push(createToken("string", value));
      index = next;
      continue;
    }
    if (input.startsWith("...", index)) {
      push(createToken("operator", "..."));
      index += 3;
      continue;
    }
    if (/[A-Za-z_]/u.test(character)) {
      const match = input.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/u);
      if (!match) throw new Error(`Unable to tokenize GraphQL at character ${index + 1}.`);
      push(createToken("word", match[0]));
      index += match[0].length;
      continue;
    }
    if (character === "-" || /\d/u.test(character)) {
      const match = input.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/u);
      if (!match) throw new Error(`Invalid GraphQL number at character ${index + 1}.`);
      const nextCharacter = input[index + match[0].length] ?? "";
      if (nextCharacter === "." || /[A-Za-z0-9_]/u.test(nextCharacter)) {
        throw new Error(`Invalid GraphQL number at character ${index + 1}.`);
      }
      push(createToken("number", match[0]));
      index += match[0].length;
      continue;
    }
    if ("!$():=@[]{|}&".includes(character)) {
      push(createToken("punctuation", character));
      index += 1;
      continue;
    }
    throw new Error(`Unsupported GraphQL character ${JSON.stringify(character)} at position ${index + 1}.`);
  }
  return tokens;
}

interface GraphqlContext {
  readonly type: "selection" | "object" | "arguments" | "list";
}

function graphqlBraceType(previous: Token | null): GraphqlContext["type"] {
  if (!previous) return "selection";
  if ([":", "=", "(", "["].includes(previous.value)) return "object";
  return "selection";
}

function isGraphqlValueToken(token: Token | null): boolean {
  return Boolean(token && (["word", "number", "string"].includes(token.kind) || [")", "]", "}"].includes(token.value)));
}

export function formatGraphql(input: string, options: Pick<FormatOptions, "indentSize"> = {}): FormatResult {
  const indentSize = options.indentSize ?? 2;
  const tokens = tokenizeGraphql(input);
  const writer = new LineWriter(" ".repeat(indentSize));
  const stack: GraphqlContext[] = [];
  let indent = 0;
  let maximumDepth = 0;
  let previous: Token | null = null;

  const currentSelection = (): boolean => stack.at(-1)?.type === "selection";

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) continue;
    const next = tokens[index + 1] ?? null;

    if (token.kind === "comment") {
      writer.newline(indent);
      writer.write(token.value, false);
      writer.newline(indent);
      previous = token;
      continue;
    }

    if (token.value === "{") {
      const type = graphqlBraceType(previous);
      writer.write("{", previous !== null && previous.value !== "(" && previous.value !== "[" && previous.value !== ":" && previous.value !== "=");
      stack.push({ type });
      indent += 1;
      maximumDepth = Math.max(maximumDepth, stack.length);
      if (stack.length > MAXIMUM_NESTING_DEPTH) throw new Error(`GraphQL nesting exceeds ${MAXIMUM_NESTING_DEPTH} levels.`);
      writer.newline(indent);
      previous = token;
      continue;
    }

    if (token.value === "}") {
      const context = stack.pop();
      if (!context || (context.type !== "selection" && context.type !== "object")) {
        throw new Error("GraphQL contains a closing brace without a matching opening brace.");
      }
      indent -= 1;
      writer.newline(indent);
      writer.write("}", false);
      if (next && next.value !== ")" && next.value !== "]" && next.value !== "}" && next.value !== "@") writer.newline(indent);
      previous = token;
      continue;
    }

    if (token.value === "(") {
      writer.write("(", false);
      stack.push({ type: "arguments" });
      maximumDepth = Math.max(maximumDepth, stack.length);
      if (stack.length > MAXIMUM_NESTING_DEPTH) throw new Error(`GraphQL nesting exceeds ${MAXIMUM_NESTING_DEPTH} levels.`);
      previous = token;
      continue;
    }

    if (token.value === ")") {
      const context = stack.pop();
      if (context?.type !== "arguments") throw new Error("GraphQL contains a closing parenthesis without a matching opening parenthesis.");
      writer.trimEnd();
      writer.write(")", false);
      previous = token;
      continue;
    }

    if (token.value === "[") {
      writer.write("[", false);
      stack.push({ type: "list" });
      maximumDepth = Math.max(maximumDepth, stack.length);
      if (stack.length > MAXIMUM_NESTING_DEPTH) throw new Error(`GraphQL nesting exceeds ${MAXIMUM_NESTING_DEPTH} levels.`);
      previous = token;
      continue;
    }

    if (token.value === "]") {
      const context = stack.pop();
      if (context?.type !== "list") throw new Error("GraphQL contains a closing bracket without a matching opening bracket.");
      writer.trimEnd();
      writer.write("]", false);
      previous = token;
      continue;
    }

    if (token.value === ":") {
      writer.trimEnd();
      writer.write(":", false);
      previous = token;
      continue;
    }

    if (token.value === "!") {
      writer.trimEnd();
      writer.write("!", false);
      previous = token;
      continue;
    }

    if (token.value === "$" || token.value === "@" || token.value === "...") {
      const spaceBefore = token.value === "$"
        ? previous?.value === ":"
        : token.value === "@" && previous !== null && !["(", "[", "{"].includes(previous.value);
      writer.write(token.value, spaceBefore);
      previous = token;
      continue;
    }

    if (["=", "|", "&"].includes(token.value)) {
      writer.write(token.value, true);
      previous = token;
      continue;
    }

    const shouldStartSelectionLine = currentSelection()
      && writer.current.length > 0
      && token.kind === "word"
      && isGraphqlValueToken(previous)
      && ![":", "$", "@", "...", "(", "["].includes(previous?.value ?? "")
      && previous?.value !== "query"
      && previous?.value !== "mutation"
      && previous?.value !== "subscription"
      && previous?.value !== "fragment"
      && next?.value !== ":";
    if (shouldStartSelectionLine) writer.newline(indent);

    const noSpace = previous === null || ["(", "[", "{", "$", "@", "..."].includes(previous.value);
    writer.write(token.value, !noSpace);
    previous = token;
  }

  if (stack.length) {
    const context = stack.at(-1)?.type ?? "structure";
    throw new Error(`GraphQL contains an unclosed ${context} delimiter.`);
  }

  return {
    output: writer.finish(),
    tokenCount: tokens.length,
    maximumDepth,
    warnings: ["syntax-only-no-schema-validation"],
  };
}

export function validateRegexFlags(flags: string): string {
  if (flags.length > MAXIMUM_REGEX_FLAGS) throw new Error(`Regex flags exceed the ${MAXIMUM_REGEX_FLAGS}-character limit.`);
  const supported = new Set("dgimsuvy".split(""));
  const seen = new Set<string>();
  for (const flag of flags) {
    if (!supported.has(flag)) throw new Error(`Unsupported regular-expression flag: ${flag}.`);
    if (seen.has(flag)) throw new Error(`Duplicate regular-expression flag: ${flag}.`);
    seen.add(flag);
  }
  if (seen.has("u") && seen.has("v")) throw new Error("Regular-expression flags u and v cannot be used together.");
  return flags;
}

export function analyzeRegexRisk(pattern: string, flags = ""): RegexRiskReport {
  if (pattern.length > MAXIMUM_REGEX_PATTERN_CHARACTERS) {
    throw new Error(`Regex pattern exceeds the ${MAXIMUM_REGEX_PATTERN_CHARACTERS.toLocaleString("en-US")}-character limit.`);
  }
  validateRegexFlags(flags);
  const findings: RegexRiskFinding[] = [];
  const add = (code: string, message: string, level: RegexRiskFinding["level"]): void => {
    findings.push({ code, message, level });
  };

  if (!pattern) add("empty-pattern", "An empty pattern matches every position and may produce many zero-length matches.", "review");
  if (/\((?:[^()\\]|\\.)*[+*](?:[^()\\]|\\.)*\)[+*{]/u.test(pattern)) {
    add("nested-quantifier", "A quantified group contains another open-ended quantifier; review for catastrophic backtracking.", "high");
  }
  if (/\((?:[^()\\]|\\.)*\|(?:[^()\\]|\\.)*\)[+*{]/u.test(pattern)) {
    add("quantified-alternation", "A quantified alternation may contain overlapping branches and should be benchmarked with adversarial input.", "review");
  }
  if (/(?:\.\*|\.\+)(?:[^\n]{0,24})(?:\.\*|\.\+)/u.test(pattern)) {
    add("multiple-wildcards", "Multiple broad wildcards can create excessive backtracking on long input.", "high");
  }
  if (/\\[1-9][0-9]*/u.test(pattern) || /\\k<[^>]+>/u.test(pattern)) {
    add("backreference", "Backreferences can make matching cost difficult to predict.", "review");
  }
  if (/\(\?<=[^)]|\(\?<![^)]/u.test(pattern)) {
    add("lookbehind", "Lookbehind support and performance vary across runtimes; verify the target browser set.", "review");
  }
  for (const match of pattern.matchAll(/\{(\d+)(?:,(\d*)?)?\}/gu)) {
    const minimum = Number(match[1]);
    const maximum = match[2] === undefined || match[2] === "" ? minimum : Number(match[2]);
    if (minimum > 10_000 || maximum > 10_000) {
      add("large-quantifier", "A bounded quantifier exceeds 10,000 repetitions and may be expensive on large input.", "review");
      break;
    }
  }
  if (pattern.length > 1_000) add("long-pattern", "The pattern is longer than 1,000 characters and is harder to review safely.", "review");

  const level: RegexRiskLevel = findings.some((finding) => finding.level === "high")
    ? "high"
    : findings.length
      ? "review"
      : "low";
  return { level, findings };
}

export function validateRegexWorkerRequest(request: RegexWorkerRequest): RegexWorkerRequest {
  if (request.pattern.length > MAXIMUM_REGEX_PATTERN_CHARACTERS) {
    throw new Error(`Regex pattern exceeds the ${MAXIMUM_REGEX_PATTERN_CHARACTERS.toLocaleString("en-US")}-character limit.`);
  }
  if (request.text.length > MAXIMUM_REGEX_TEXT_CHARACTERS) {
    throw new Error(`Regex test text exceeds the ${MAXIMUM_REGEX_TEXT_CHARACTERS.toLocaleString("en-US")}-character limit.`);
  }
  validateRegexFlags(request.flags);
  if (!Number.isInteger(request.maximumMatches) || request.maximumMatches < 1 || request.maximumMatches > 500) {
    throw new Error("Regex maximumMatches must be an integer from 1 to 500.");
  }
  if (!Number.isInteger(request.maximumPreviewCharacters) || request.maximumPreviewCharacters < 16 || request.maximumPreviewCharacters > 4_000) {
    throw new Error("Regex maximumPreviewCharacters must be an integer from 16 to 4,000.");
  }
  return request;
}