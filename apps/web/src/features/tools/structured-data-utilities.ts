export interface ValidationIssue {
  readonly path: string;
  readonly keyword: string;
  readonly message: string;
}

export interface JsonSchemaValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationIssue[];
  readonly schemaErrors: readonly ValidationIssue[];
  readonly unsupportedKeywords: readonly string[];
  readonly instanceNodeCount: number;
  readonly schemaNodeCount: number;
  readonly truncated: boolean;
}

export interface ConversionResult {
  readonly output: string;
  readonly nodeCount: number;
  readonly warnings: readonly string[];
}

export interface XmlFormatResult {
  readonly valid: boolean;
  readonly formatted: string;
  readonly errors: readonly ValidationIssue[];
  readonly warnings: readonly string[];
  readonly elementCount: number;
  readonly attributeCount: number;
  readonly maximumDepth: number;
}

const MAX_INPUT_CHARS = 500_000;
const MAX_NODES = 10_000;
const MAX_DEPTH = 64;
const MAX_ERRORS = 100;
const MAX_YAML_NODES = 5_000;
const MAX_YAML_DEPTH = 32;
const MAX_XML_NODES = 10_000;

const KNOWN_UNSUPPORTED_SCHEMA_KEYWORDS = new Set([
  "$anchor",
  "$dynamicAnchor",
  "$dynamicRef",
  "unevaluatedProperties",
  "unevaluatedItems",
  "prefixItems",
  "contains",
  "minContains",
  "maxContains",
  "patternProperties",
  "dependentRequired",
  "dependentSchemas",
  "propertyNames",
  "minContains",
  "maxContains",
  "if",
  "then",
  "else",
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
]);

const SUPPORTED_STRING_FORMATS = new Set(["date", "date-time", "email", "uri", "uuid", "ipv4", "ipv6", "hostname"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function joinPath(base: string, segment: string | number): string {
  const escaped = String(segment).replaceAll("~", "~0").replaceAll("/", "~1");
  return `${base}/${escaped}`;
}

function countNodes(value: unknown, depth = 0): number {
  if (depth > MAX_DEPTH) throw new Error("Maximum nesting depth exceeded.");
  if (Array.isArray(value)) return 1 + value.reduce((sum, item) => sum + countNodes(item, depth + 1), 0);
  if (isObject(value)) return 1 + Object.values(value).reduce<number>((sum, item) => sum + countNodes(item, depth + 1), 0);
  return 1;
}

export function parseBoundedJson(text: string): unknown {
  if (!text.trim()) throw new Error("JSON input is empty.");
  if (text.length > MAX_INPUT_CHARS) throw new Error("JSON input exceeds 500,000 characters.");
  const value: unknown = JSON.parse(text);
  if (countNodes(value) > MAX_NODES) throw new Error("JSON input exceeds 10,000 nodes.");
  return value;
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]));
  }
  if (isObject(left) && isObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    return leftKeys.length === rightKeys.length
      && leftKeys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
  }
  return false;
}

function schemaTypeMatches(value: unknown, type: string): boolean {
  switch (type) {
    case "null": return value === null;
    case "boolean": return typeof value === "boolean";
    case "object": return isObject(value);
    case "array": return Array.isArray(value);
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "integer": return typeof value === "number" && Number.isInteger(value);
    case "string": return typeof value === "string";
    default: return false;
  }
}

function validIpv4(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 4
    && parts.every((part) => /^\d{1,3}$/u.test(part) && Number(part) <= 255 && String(Number(part)) === part);
}

function validIpv6(value: string): boolean {
  if (!value.includes(":")) return false;
  if ((value.match(/::/gu) ?? []).length > 1) return false;
  const halves = value.split("::");
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length > 1 && halves[1] ? halves[1].split(":") : [];
  const groups = [...left, ...right];
  let count = 0;
  for (const [index, group] of groups.entries()) {
    if (group.includes(".")) {
      if (index !== groups.length - 1 || !validIpv4(group)) return false;
      count += 2;
    } else {
      if (!/^[0-9a-f]{1,4}$/iu.test(group)) return false;
      count += 1;
    }
  }
  return halves.length === 2 ? count < 8 : count === 8;
}

function validFormat(value: string, format: string): boolean | null {
  switch (format) {
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);
    case "uri": {
      try {
        const parsed = new URL(value);
        return Boolean(parsed.protocol);
      } catch {
        return false;
      }
    }
    case "uuid": return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);
    case "date": {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
      if (!match) return false;
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(Date.UTC(year, month - 1, day));
      return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    }
    case "date-time": return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
      && !Number.isNaN(Date.parse(value));
    case "ipv4": return validIpv4(value);
    case "ipv6": return validIpv6(value);
    case "hostname": return value.length <= 253
      && value.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/iu.test(label));
    default: return null;
  }
}

function resolveLocalReference(root: unknown, reference: string): unknown {
  if (reference === "#") return root;
  if (!reference.startsWith("#/")) throw new Error("Only local JSON Pointer $ref values are supported.");
  let current = root;
  for (const raw of reference.slice(2).split("/")) {
    const segment = raw.replaceAll("~1", "/").replaceAll("~0", "~");
    if (Array.isArray(current)) {
      if (!/^\d+$/u.test(segment)) throw new Error(`Unresolved local $ref: ${reference}`);
      current = current[Number(segment)];
    } else if (isObject(current) && Object.hasOwn(current, segment)) {
      current = current[segment];
    } else {
      throw new Error(`Unresolved local $ref: ${reference}`);
    }
  }
  return current;
}

function collectSchemaMetadata(
  schema: unknown,
  path: string,
  schemaErrors: ValidationIssue[],
  unsupported: Set<string>,
  depth = 0,
): void {
  if (depth > MAX_DEPTH) {
    schemaErrors.push({ path, keyword: "depth", message: "Schema nesting exceeds the supported depth." });
    return;
  }
  if (typeof schema === "boolean") return;
  if (!isObject(schema)) {
    schemaErrors.push({ path, keyword: "schema", message: "A schema must be an object or boolean." });
    return;
  }
  for (const [key, value] of Object.entries(schema)) {
    if (KNOWN_UNSUPPORTED_SCHEMA_KEYWORDS.has(key)) unsupported.add(key);
    if (key === "format" && typeof value === "string" && !SUPPORTED_STRING_FORMATS.has(value)) unsupported.add(`format:${value}`);
    if (key === "type") {
      const types = Array.isArray(value) ? value : [value];
      const allowed = new Set(["null", "boolean", "object", "array", "number", "integer", "string"]);
      if (!types.length || types.some((item) => typeof item !== "string" || !allowed.has(item))) {
        schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "type must be a supported string or a non-empty array of supported strings." });
      }
    } else if (key === "required" && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "required must be an array of strings." });
    } else if ((key === "properties" || key === "$defs" || key === "definitions") && !isObject(value)) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: `${key} must be an object.` });
    } else if (["minItems", "maxItems", "minProperties", "maxProperties", "minLength", "maxLength"].includes(key)
      && (!Number.isInteger(value) || (value as number) < 0)) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: `${key} must be a non-negative integer.` });
    } else if (["minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf"].includes(key)
      && (typeof value !== "number" || !Number.isFinite(value))) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: `${key} must be a finite number.` });
    } else if (key === "multipleOf" && typeof value === "number" && value <= 0) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "multipleOf must be greater than zero." });
    } else if (key === "enum" && (!Array.isArray(value) || value.length === 0)) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "enum must be a non-empty array." });
    } else if (key === "uniqueItems" && typeof value !== "boolean") {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "uniqueItems must be a boolean." });
    } else if ((key === "items" || key === "additionalProperties" || key === "not")
      && typeof value !== "boolean" && !isObject(value)) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: `${key} must be a schema object or boolean.` });
    } else if (key === "format" && typeof value !== "string") {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "format must be a string." });
    } else if (key === "pattern") {
      if (typeof value !== "string") {
        schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "pattern must be a string." });
      } else {
        try { new RegExp(value, "u"); } catch { schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "pattern is not a valid JavaScript regular expression." }); }
      }
    } else if (key === "$ref" && typeof value !== "string") {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: "$ref must be a string." });
    } else if (["allOf", "anyOf", "oneOf"].includes(key) && !Array.isArray(value)) {
      schemaErrors.push({ path: joinPath(path, key), keyword: key, message: `${key} must be an array of schemas.` });
    }

    if (key === "properties" || key === "$defs" || key === "definitions") {
      if (isObject(value)) {
        for (const [childKey, child] of Object.entries(value)) collectSchemaMetadata(child, joinPath(joinPath(path, key), childKey), schemaErrors, unsupported, depth + 1);
      }
    } else if (["items", "additionalProperties", "not"].includes(key) && (isObject(value) || typeof value === "boolean")) {
      collectSchemaMetadata(value, joinPath(path, key), schemaErrors, unsupported, depth + 1);
    } else if (["allOf", "anyOf", "oneOf"].includes(key) && Array.isArray(value)) {
      value.forEach((child, index) => collectSchemaMetadata(child, joinPath(joinPath(path, key), index), schemaErrors, unsupported, depth + 1));
    }
  }
}

interface ValidationContext {
  readonly rootSchema: unknown;
  readonly errors: ValidationIssue[];
  readonly activeReferences: Set<string>;
  truncated: boolean;
}

function addValidationError(context: ValidationContext, issue: ValidationIssue): void {
  if (context.errors.length >= MAX_ERRORS) {
    context.truncated = true;
    return;
  }
  context.errors.push(issue);
}

function validateAgainstSchema(
  value: unknown,
  schema: unknown,
  instancePath: string,
  schemaPath: string,
  context: ValidationContext,
  depth = 0,
): boolean {
  if (depth > MAX_DEPTH) {
    addValidationError(context, { path: instancePath, keyword: "depth", message: "Validation depth exceeds the supported limit." });
    return false;
  }
  if (schema === true) return true;
  if (schema === false) {
    addValidationError(context, { path: instancePath, keyword: "falseSchema", message: "The false schema rejects this value." });
    return false;
  }
  if (!isObject(schema)) return false;
  const startCount = context.errors.length;

  if (typeof schema.$ref === "string") {
    const referenceKey = `${schema.$ref}|${instancePath}`;
    if (context.activeReferences.has(referenceKey)) {
      addValidationError(context, { path: instancePath, keyword: "$ref", message: "Recursive local $ref evaluation was stopped." });
      return false;
    }
    try {
      const resolved = resolveLocalReference(context.rootSchema, schema.$ref);
      context.activeReferences.add(referenceKey);
      validateAgainstSchema(value, resolved, instancePath, `${schemaPath}/$ref(${schema.$ref})`, context, depth + 1);
      context.activeReferences.delete(referenceKey);
    } catch (error) {
      addValidationError(context, { path: instancePath, keyword: "$ref", message: error instanceof Error ? error.message : "Unable to resolve $ref." });
    }
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeof type === "string" && schemaTypeMatches(value, type))) {
      addValidationError(context, { path: instancePath, keyword: "type", message: `Expected type ${types.join(" or ")}.` });
      return false;
    }
  }

  if (Array.isArray(schema.enum) && !schema.enum.some((candidate) => deepEqual(candidate, value))) {
    addValidationError(context, { path: instancePath, keyword: "enum", message: "Value is not one of the allowed enum values." });
  }
  if (Object.hasOwn(schema, "const") && !deepEqual(schema.const, value)) {
    addValidationError(context, { path: instancePath, keyword: "const", message: "Value does not match const." });
  }

  for (const keyword of ["allOf", "anyOf", "oneOf"] as const) {
    const subschemas = schema[keyword];
    if (!Array.isArray(subschemas)) continue;
    let matches = 0;
    for (let index = 0; index < subschemas.length; index += 1) {
      const branchContext: ValidationContext = { rootSchema: context.rootSchema, errors: [], activeReferences: new Set(context.activeReferences), truncated: false };
      validateAgainstSchema(value, subschemas[index], instancePath, joinPath(joinPath(schemaPath, keyword), index), branchContext, depth + 1);
      if (!branchContext.errors.length) matches += 1;
    }
    const valid = keyword === "allOf" ? matches === subschemas.length : keyword === "anyOf" ? matches >= 1 : matches === 1;
    if (!valid) addValidationError(context, { path: instancePath, keyword, message: `${keyword} matched ${matches} of ${subschemas.length} branches.` });
  }

  if (schema.not !== undefined) {
    const branchContext: ValidationContext = { rootSchema: context.rootSchema, errors: [], activeReferences: new Set(context.activeReferences), truncated: false };
    validateAgainstSchema(value, schema.not, instancePath, joinPath(schemaPath, "not"), branchContext, depth + 1);
    if (!branchContext.errors.length) addValidationError(context, { path: instancePath, keyword: "not", message: "Value matches a schema declared under not." });
  }

  if (isObject(value)) {
    const keys = Object.keys(value);
    if (typeof schema.minProperties === "number" && keys.length < schema.minProperties) addValidationError(context, { path: instancePath, keyword: "minProperties", message: `Expected at least ${schema.minProperties} properties.` });
    if (typeof schema.maxProperties === "number" && keys.length > schema.maxProperties) addValidationError(context, { path: instancePath, keyword: "maxProperties", message: `Expected at most ${schema.maxProperties} properties.` });
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (typeof key === "string" && !Object.hasOwn(value, key)) addValidationError(context, { path: instancePath, keyword: "required", message: `Missing required property: ${key}.` });
      }
    }
    const properties = isObject(schema.properties) ? schema.properties : {};
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) {
        validateAgainstSchema(child, properties[key], joinPath(instancePath, key), joinPath(joinPath(schemaPath, "properties"), key), context, depth + 1);
      } else if (schema.additionalProperties === false) {
        addValidationError(context, { path: joinPath(instancePath, key), keyword: "additionalProperties", message: `Additional property is not allowed: ${key}.` });
      } else if (isObject(schema.additionalProperties) || typeof schema.additionalProperties === "boolean") {
        validateAgainstSchema(child, schema.additionalProperties, joinPath(instancePath, key), joinPath(schemaPath, "additionalProperties"), context, depth + 1);
      }
    }
  }

  if (Array.isArray(value)) {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) addValidationError(context, { path: instancePath, keyword: "minItems", message: `Expected at least ${schema.minItems} items.` });
    if (typeof schema.maxItems === "number" && value.length > schema.maxItems) addValidationError(context, { path: instancePath, keyword: "maxItems", message: `Expected at most ${schema.maxItems} items.` });
    if (schema.uniqueItems === true) {
      for (let left = 0; left < value.length; left += 1) {
        for (let right = left + 1; right < value.length; right += 1) {
          if (deepEqual(value[left], value[right])) {
            addValidationError(context, { path: instancePath, keyword: "uniqueItems", message: `Items ${left} and ${right} are equal.` });
            left = value.length;
            break;
          }
        }
      }
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) => validateAgainstSchema(item, schema.items, joinPath(instancePath, index), joinPath(schemaPath, "items"), context, depth + 1));
    }
  }

  if (typeof value === "string") {
    const length = [...value].length;
    if (typeof schema.minLength === "number" && length < schema.minLength) addValidationError(context, { path: instancePath, keyword: "minLength", message: `String length must be at least ${schema.minLength}.` });
    if (typeof schema.maxLength === "number" && length > schema.maxLength) addValidationError(context, { path: instancePath, keyword: "maxLength", message: `String length must be at most ${schema.maxLength}.` });
    if (typeof schema.pattern === "string") {
      try {
        if (!new RegExp(schema.pattern, "u").test(value)) addValidationError(context, { path: instancePath, keyword: "pattern", message: "String does not match pattern." });
      } catch {
        // Reported as a schema error before validation.
      }
    }
    if (typeof schema.format === "string") {
      const result = validFormat(value, schema.format);
      if (result === false) addValidationError(context, { path: instancePath, keyword: "format", message: `String does not match format ${schema.format}.` });
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (typeof schema.minimum === "number" && value < schema.minimum) addValidationError(context, { path: instancePath, keyword: "minimum", message: `Number must be at least ${schema.minimum}.` });
    if (typeof schema.maximum === "number" && value > schema.maximum) addValidationError(context, { path: instancePath, keyword: "maximum", message: `Number must be at most ${schema.maximum}.` });
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) addValidationError(context, { path: instancePath, keyword: "exclusiveMinimum", message: `Number must be greater than ${schema.exclusiveMinimum}.` });
    if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) addValidationError(context, { path: instancePath, keyword: "exclusiveMaximum", message: `Number must be less than ${schema.exclusiveMaximum}.` });
    if (typeof schema.multipleOf === "number" && schema.multipleOf > 0) {
      const quotient = value / schema.multipleOf;
      if (Math.abs(quotient - Math.round(quotient)) > 1e-10) addValidationError(context, { path: instancePath, keyword: "multipleOf", message: `Number must be a multiple of ${schema.multipleOf}.` });
    }
  }

  return context.errors.length === startCount;
}

export function validateJsonSchema(instanceText: string, schemaText: string): JsonSchemaValidationResult {
  const instance = parseBoundedJson(instanceText);
  const schema = parseBoundedJson(schemaText);
  const instanceNodeCount = countNodes(instance);
  const schemaNodeCount = countNodes(schema);
  const schemaErrors: ValidationIssue[] = [];
  const unsupported = new Set<string>();
  collectSchemaMetadata(schema, "#", schemaErrors, unsupported);
  if (schemaErrors.length) {
    return { valid: false, errors: [], schemaErrors, unsupportedKeywords: [...unsupported].sort(), instanceNodeCount, schemaNodeCount, truncated: false };
  }
  const context: ValidationContext = { rootSchema: schema, errors: [], activeReferences: new Set(), truncated: false };
  validateAgainstSchema(instance, schema, "", "#", context);
  return {
    valid: context.errors.length === 0,
    errors: context.errors,
    schemaErrors,
    unsupportedKeywords: [...unsupported].sort(),
    instanceNodeCount,
    schemaNodeCount,
    truncated: context.truncated,
  };
}

interface YamlLine {
  readonly indent: number;
  readonly content: string;
  readonly line: number;
}

interface YamlState {
  readonly lines: readonly YamlLine[];
  index: number;
  nodeCount: number;
}

function stripYamlComment(value: string): string {
  let quote: "'" | '"' | null = null;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote === '"' && char === "\\") { index += 1; continue; }
    if (quote && char === quote) { quote = null; continue; }
    if (!quote && (char === "'" || char === '"')) { quote = char; continue; }
    if (!quote && (char === "[" || char === "{")) depth += 1;
    if (!quote && (char === "]" || char === "}")) depth -= 1;
    if (!quote && depth === 0 && char === "#" && (index === 0 || /\s/u.test(value[index - 1] ?? ""))) return value.slice(0, index).trimEnd();
  }
  return value.trimEnd();
}

function findYamlColon(value: string): number {
  let quote: "'" | '"' | null = null;
  let depth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (quote === '"' && char === "\\") { index += 1; continue; }
    if (quote && char === quote) { quote = null; continue; }
    if (!quote && (char === "'" || char === '"')) { quote = char; continue; }
    if (!quote && (char === "[" || char === "{")) depth += 1;
    if (!quote && (char === "]" || char === "}")) depth -= 1;
    if (!quote && depth === 0 && char === ":" && (index === value.length - 1 || /\s/u.test(value[index + 1] ?? ""))) return index;
  }
  return -1;
}

function rejectUnsafeYaml(value: string, line: number): void {
  if (/(^|\s)[&*!][^\s]+/u.test(value) || /(^|\s)<<\s*:/u.test(value)) throw new Error(`Line ${line}: YAML anchors, aliases, tags, and merge keys are not supported.`);
  if (/^[|>][+-]?\d*$/u.test(value.trim())) throw new Error(`Line ${line}: block scalar syntax is not supported.`);
}

function parseYamlKey(raw: string, line: number): string {
  const value = raw.trim();
  if (!value) throw new Error(`Line ${line}: mapping key is empty.`);
  rejectUnsafeYaml(value, line);
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed !== "string") throw new Error();
      return parsed;
    } catch {
      throw new Error(`Line ${line}: invalid quoted mapping key.`);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new Error(`Line ${line}: invalid single-quoted mapping key.`);
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if (value === "<<") throw new Error(`Line ${line}: YAML merge keys are not supported.`);
  if (/[[\]{},#]/u.test(value)) throw new Error(`Line ${line}: complex mapping keys are not supported.`);
  return value;
}

function parseYamlScalar(raw: string, line: number): unknown {
  const value = stripYamlComment(raw).trim();
  rejectUnsafeYaml(value, line);
  if (!value) return "";
  if (value.startsWith('"')) {
    try { return JSON.parse(value); } catch { throw new Error(`Line ${line}: invalid double-quoted scalar.`); }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new Error(`Line ${line}: invalid single-quoted scalar.`);
    return value.slice(1, -1).replaceAll("''", "'");
  }
  if ((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) {
    try { return JSON.parse(value); } catch { throw new Error(`Line ${line}: inline collections must use JSON syntax.`); }
  }
  if (/^(?:null|~)$/iu.test(value)) return null;
  if (/^true$/iu.test(value)) return true;
  if (/^false$/iu.test(value)) return false;
  if (/^-?(?:0|[1-9]\d*)$/u.test(value)) {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : value;
  }
  if (/^-?(?:0|[1-9]\d*)\.\d+(?:e[+-]?\d+)?$/iu.test(value) || /^-?(?:0|[1-9]\d*)e[+-]?\d+$/iu.test(value)) {
    const number = Number(value);
    return Number.isFinite(number) ? number : value;
  }
  return value;
}

function incrementYamlNodes(state: YamlState): void {
  state.nodeCount += 1;
  if (state.nodeCount > MAX_YAML_NODES) throw new Error("YAML input exceeds 5,000 nodes.");
}

function parseYamlBlock(state: YamlState, indent: number, depth: number): unknown {
  if (depth > MAX_YAML_DEPTH) throw new Error("YAML nesting exceeds 32 levels.");
  const first = state.lines[state.index];
  if (!first || first.indent !== indent) throw new Error(`Line ${first?.line ?? 1}: invalid indentation.`);
  const sequence = first.content === "-" || first.content.startsWith("- ");
  if (sequence) {
    const result: unknown[] = [];
    incrementYamlNodes(state);
    while (state.index < state.lines.length) {
      const current = state.lines[state.index];
      if (!current || current.indent < indent) break;
      if (current.indent > indent) throw new Error(`Line ${current.line}: unexpected indentation.`);
      if (!(current.content === "-" || current.content.startsWith("- "))) throw new Error(`Line ${current.line}: cannot mix a sequence and mapping at the same indentation.`);
      const remainder = current.content.slice(1).trimStart();
      state.index += 1;
      if (!remainder) {
        const next = state.lines[state.index];
        if (!next || next.indent <= indent) { result.push(null); incrementYamlNodes(state); }
        else result.push(parseYamlBlock(state, next.indent, depth + 1));
        continue;
      }
      const colon = findYamlColon(remainder);
      if (colon >= 0) {
        const object: Record<string, unknown> = {};
        incrementYamlNodes(state);
        const key = parseYamlKey(remainder.slice(0, colon), current.line);
        const rawValue = remainder.slice(colon + 1).trimStart();
        if (rawValue) { object[key] = parseYamlScalar(rawValue, current.line); incrementYamlNodes(state); }
        else {
          const next = state.lines[state.index];
          object[key] = next && next.indent > indent ? parseYamlBlock(state, next.indent, depth + 1) : null;
          if (!next || next.indent <= indent) incrementYamlNodes(state);
        }
        while (state.index < state.lines.length) {
          const continuation = state.lines[state.index];
          if (!continuation || continuation.indent <= indent) break;
          const continuationIndent = continuation.indent;
          const parsed = parseYamlBlock(state, continuationIndent, depth + 1);
          if (!isObject(parsed)) throw new Error(`Line ${continuation.line}: sequence mapping continuation must be an object.`);
          for (const [childKey, childValue] of Object.entries(parsed)) {
            if (Object.hasOwn(object, childKey)) throw new Error(`Line ${continuation.line}: duplicate mapping key ${childKey}.`);
            object[childKey] = childValue;
          }
        }
        result.push(object);
      } else {
        result.push(parseYamlScalar(remainder, current.line));
        incrementYamlNodes(state);
      }
    }
    return result;
  }

  const result: Record<string, unknown> = {};
  incrementYamlNodes(state);
  while (state.index < state.lines.length) {
    const current = state.lines[state.index];
    if (!current || current.indent < indent) break;
    if (current.indent > indent) throw new Error(`Line ${current.line}: unexpected indentation.`);
    if (current.content === "-" || current.content.startsWith("- ")) throw new Error(`Line ${current.line}: cannot mix a mapping and sequence at the same indentation.`);
    const colon = findYamlColon(current.content);
    if (colon < 0) throw new Error(`Line ${current.line}: expected a mapping entry with a colon.`);
    const key = parseYamlKey(current.content.slice(0, colon), current.line);
    if (Object.hasOwn(result, key)) throw new Error(`Line ${current.line}: duplicate mapping key ${key}.`);
    const rawValue = current.content.slice(colon + 1).trimStart();
    state.index += 1;
    if (rawValue) {
      result[key] = parseYamlScalar(rawValue, current.line);
      incrementYamlNodes(state);
    } else {
      const next = state.lines[state.index];
      if (next && next.indent > indent) result[key] = parseYamlBlock(state, next.indent, depth + 1);
      else { result[key] = null; incrementYamlNodes(state); }
    }
  }
  return result;
}

export function yamlToJson(yaml: string): ConversionResult {
  if (!yaml.trim()) throw new Error("YAML input is empty.");
  if (yaml.length > MAX_INPUT_CHARS) throw new Error("YAML input exceeds 500,000 characters.");
  const lines: YamlLine[] = [];
  let documentMarkerSeen = false;
  let documentEnded = false;
  for (const [zeroIndex, raw] of yaml.replace(/^\uFEFF/u, "").split(/\r?\n/u).entries()) {
    const line = zeroIndex + 1;
    if (raw.includes("\t")) throw new Error(`Line ${line}: tabs are not allowed for indentation.`);
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed === "---") {
      if (documentMarkerSeen || lines.length || documentEnded) throw new Error(`Line ${line}: multiple YAML documents are not supported.`);
      documentMarkerSeen = true;
      continue;
    }
    if (trimmed === "...") {
      if (documentEnded) throw new Error(`Line ${line}: duplicate YAML document end marker.`);
      documentEnded = true;
      continue;
    }
    if (documentEnded) throw new Error(`Line ${line}: content after the YAML document end marker is not supported.`);
    const indent = raw.length - raw.trimStart().length;
    if (indent % 2 !== 0) throw new Error(`Line ${line}: indentation must use multiples of two spaces.`);
    lines.push({ indent, content: stripYamlComment(raw.slice(indent)), line });
  }
  if (!lines.length) throw new Error("YAML input contains no data document.");
  if (lines[0]?.indent !== 0) throw new Error(`Line ${lines[0]?.line ?? 1}: root content must start at indentation zero.`);
  const state: YamlState = { lines, index: 0, nodeCount: 0 };
  const value = parseYamlBlock(state, 0, 0);
  if (state.index !== lines.length) throw new Error(`Line ${lines[state.index]?.line ?? 1}: unable to parse remaining content.`);
  return { output: JSON.stringify(value, null, 2), nodeCount: state.nodeCount, warnings: ["safe-yaml-subset"] };
}

function yamlString(value: string): string {
  if (!value) return '""';
  if (/^(?:null|~|true|false)$/iu.test(value)
    || /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/iu.test(value)
    || /^[-?:,\[\]{}#&*!|>'"%@`]/u.test(value)
    || /[:#]\s|\s#|[\r\n\t]/u.test(value)
    || value.trim() !== value) return JSON.stringify(value);
  return value;
}

function emitYaml(value: unknown, indent: number, depth: number, counter: { nodes: number }): string[] {
  if (depth > MAX_YAML_DEPTH) throw new Error("JSON nesting exceeds 32 levels.");
  counter.nodes += 1;
  if (counter.nodes > MAX_YAML_NODES) throw new Error("JSON input exceeds 5,000 nodes for YAML conversion.");
  const padding = " ".repeat(indent);
  if (Array.isArray(value)) {
    if (!value.length) return [`${padding}[]`];
    const lines: string[] = [];
    for (const item of value) {
      if (isObject(item) || Array.isArray(item)) {
        lines.push(`${padding}-`);
        lines.push(...emitYaml(item, indent + 2, depth + 1, counter));
      } else {
        lines.push(`${padding}- ${yamlScalarOutput(item)}`);
        counter.nodes += 1;
        if (counter.nodes > MAX_YAML_NODES) throw new Error("JSON input exceeds 5,000 nodes for YAML conversion.");
      }
    }
    return lines;
  }
  if (isObject(value)) {
    const entries = Object.entries(value);
    if (!entries.length) return [`${padding}{}`];
    const lines: string[] = [];
    for (const [key, child] of entries) {
      const outputKey = yamlString(key);
      if (isObject(child) || Array.isArray(child)) {
        lines.push(`${padding}${outputKey}:`);
        lines.push(...emitYaml(child, indent + 2, depth + 1, counter));
      } else {
        lines.push(`${padding}${outputKey}: ${yamlScalarOutput(child)}`);
        counter.nodes += 1;
        if (counter.nodes > MAX_YAML_NODES) throw new Error("JSON input exceeds 5,000 nodes for YAML conversion.");
      }
    }
    return lines;
  }
  return [`${padding}${yamlScalarOutput(value)}`];
}

function yamlScalarOutput(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return yamlString(value);
  throw new Error("Only JSON-compatible values can be converted to YAML.");
}

export function jsonToYaml(json: string): ConversionResult {
  const value = parseBoundedJson(json);
  const counter = { nodes: 0 };
  return { output: emitYaml(value, 0, 0, counter).join("\n"), nodeCount: counter.nodes, warnings: ["yaml-1.2-safe-output"] };
}

type XmlNode = XmlElement | XmlText | XmlComment | XmlCdata | XmlProcessingInstruction;
interface XmlElement {
  readonly kind: "element";
  readonly name: string;
  readonly attributes: readonly { readonly name: string; readonly value: string }[];
  readonly children: XmlNode[];
  readonly selfClosing: boolean;
}
interface XmlText { readonly kind: "text"; readonly value: string; }
interface XmlComment { readonly kind: "comment"; readonly value: string; }
interface XmlCdata { readonly kind: "cdata"; readonly value: string; }
interface XmlProcessingInstruction { readonly kind: "pi"; readonly value: string; }

const XML_NAME = /^[A-Za-z_][A-Za-z0-9_.:-]*$/u;
const XML_ENTITY = /&(?:amp|lt|gt|apos|quot|#\d+|#x[0-9a-fA-F]+);/gu;

function validXmlCodePoint(codePoint: number): boolean {
  return codePoint === 0x9 || codePoint === 0xA || codePoint === 0xD
    || (codePoint >= 0x20 && codePoint <= 0xD7FF)
    || (codePoint >= 0xE000 && codePoint <= 0xFFFD)
    || (codePoint >= 0x10000 && codePoint <= 0x10FFFF);
}

function validateXmlEntities(value: string, path: string, errors: ValidationIssue[]): void {
  for (const match of value.matchAll(XML_ENTITY)) {
    const entity = match[0];
    if (entity.startsWith("&#")) {
      const hexadecimal = entity.startsWith("&#x");
      const digits = entity.slice(hexadecimal ? 3 : 2, -1);
      const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);
      if (!Number.isFinite(codePoint) || !validXmlCodePoint(codePoint)) {
        errors.push({ path, keyword: "entity", message: `Numeric entity ${entity} is not a legal XML character.` });
      }
    }
  }
  const stripped = value.replace(XML_ENTITY, "");
  if (stripped.includes("&")) errors.push({ path, keyword: "entity", message: "Unknown or unterminated XML entity reference." });
}

function findTagEnd(xml: string, start: number): number {
  let quote: "'" | '"' | null = null;
  for (let index = start; index < xml.length; index += 1) {
    const char = xml[index];
    if (quote && char === quote) quote = null;
    else if (!quote && (char === "'" || char === '"')) quote = char;
    else if (!quote && char === ">") return index;
  }
  return -1;
}

function parseStartTag(raw: string, path: string, errors: ValidationIssue[]): { name: string; attributes: { name: string; value: string }[]; selfClosing: boolean } | null {
  let content = raw.trim();
  const selfClosing = content.endsWith("/");
  if (selfClosing) content = content.slice(0, -1).trimEnd();
  const nameMatch = /^([^\s/>]+)/u.exec(content);
  const name = nameMatch?.[1] ?? "";
  if (!XML_NAME.test(name)) {
    errors.push({ path, keyword: "name", message: `Invalid XML element name: ${name || "(empty)"}.` });
    return null;
  }
  let cursor = name.length;
  const attributes: { name: string; value: string }[] = [];
  const seen = new Set<string>();
  while (cursor < content.length) {
    while (/\s/u.test(content[cursor] ?? "")) cursor += 1;
    if (cursor >= content.length) break;
    const attributeMatch = /^([^\s=/>]+)/u.exec(content.slice(cursor));
    const attributeName = attributeMatch?.[1] ?? "";
    if (!XML_NAME.test(attributeName)) {
      errors.push({ path, keyword: "attribute", message: `Invalid XML attribute near ${content.slice(cursor, cursor + 30)}.` });
      return null;
    }
    cursor += attributeName.length;
    while (/\s/u.test(content[cursor] ?? "")) cursor += 1;
    if (content[cursor] !== "=") {
      errors.push({ path, keyword: "attribute", message: `Attribute ${attributeName} must have a quoted value.` });
      return null;
    }
    cursor += 1;
    while (/\s/u.test(content[cursor] ?? "")) cursor += 1;
    const quote = content[cursor];
    if (quote !== '"' && quote !== "'") {
      errors.push({ path, keyword: "attribute", message: `Attribute ${attributeName} must use quotes.` });
      return null;
    }
    cursor += 1;
    const end = content.indexOf(quote, cursor);
    if (end < 0) {
      errors.push({ path, keyword: "attribute", message: `Attribute ${attributeName} has an unterminated value.` });
      return null;
    }
    const value = content.slice(cursor, end);
    if (value.includes("<")) errors.push({ path, keyword: "attribute", message: `Attribute ${attributeName} cannot contain <.` });
    validateXmlEntities(value, `${path}/@${attributeName}`, errors);
    if (seen.has(attributeName)) errors.push({ path, keyword: "attribute", message: `Duplicate attribute: ${attributeName}.` });
    seen.add(attributeName);
    attributes.push({ name: attributeName, value });
    cursor = end + 1;
  }
  return { name, attributes, selfClosing };
}

function compactXml(node: XmlNode): string {
  switch (node.kind) {
    case "text": return node.value;
    case "comment": return `<!--${node.value}-->`;
    case "cdata": return `<![CDATA[${node.value}]]>`;
    case "pi": return `<?${node.value}?>`;
    case "element": {
      const attributes = node.attributes.map((attribute) => ` ${attribute.name}="${attribute.value.replaceAll('"', "&quot;")}"`).join("");
      if (node.selfClosing && !node.children.length) return `<${node.name}${attributes}/>`;
      return `<${node.name}${attributes}>${node.children.map(compactXml).join("")}</${node.name}>`;
    }
  }
}

function formatXmlNode(node: XmlNode, indent: number, step: number, warnings: Set<string>): string[] {
  const padding = " ".repeat(indent);
  if (node.kind === "comment") return [`${padding}<!--${node.value}-->`];
  if (node.kind === "cdata") return [`${padding}<![CDATA[${node.value}]]>`];
  if (node.kind === "pi") return [`${padding}<?${node.value}?>`];
  if (node.kind === "text") return node.value.trim() ? [`${padding}${node.value}`] : [];
  const attributes = node.attributes.map((attribute) => ` ${attribute.name}="${attribute.value.replaceAll('"', "&quot;")}"`).join("");
  if (node.selfClosing && !node.children.length) return [`${padding}<${node.name}${attributes}/>`];
  if (!node.children.length) return [`${padding}<${node.name}${attributes}></${node.name}>`];
  const hasElementLike = node.children.some((child) => child.kind !== "text");
  const hasNonWhitespaceText = node.children.some((child) => child.kind === "text" && child.value.trim());
  if (hasElementLike && hasNonWhitespaceText) {
    warnings.add("mixed-content-preserved-compactly");
    return [`${padding}${compactXml(node)}`];
  }
  if (!hasElementLike) return [`${padding}<${node.name}${attributes}>${node.children.map(compactXml).join("")}</${node.name}>`];
  const lines = [`${padding}<${node.name}${attributes}>`];
  for (const child of node.children) lines.push(...formatXmlNode(child, indent + step, step, warnings));
  lines.push(`${padding}</${node.name}>`);
  return lines;
}

function validXmlDeclaration(value: string): boolean {
  return /^xml\s+version\s*=\s*(["'])1\.[01]\1(?:\s+encoding\s*=\s*(["'])[A-Za-z][A-Za-z0-9._-]*\2)?(?:\s+standalone\s*=\s*(["'])(?:yes|no)\3)?\s*$/iu.test(value);
}

export function validateAndFormatXml(xml: string, indentation = 2): XmlFormatResult {
  const errors: ValidationIssue[] = [];
  const warnings = new Set<string>();
  if (!xml.trim()) return { valid: false, formatted: "", errors: [{ path: "", keyword: "document", message: "XML input is empty." }], warnings: [], elementCount: 0, attributeCount: 0, maximumDepth: 0 };
  if (xml.length > MAX_INPUT_CHARS) return { valid: false, formatted: "", errors: [{ path: "", keyword: "document", message: "XML input exceeds 500,000 characters." }], warnings: [], elementCount: 0, attributeCount: 0, maximumDepth: 0 };
  xml = xml.replace(/^\uFEFF/u, "");
  if (![2, 4].includes(indentation)) return { valid: false, formatted: "", errors: [{ path: "", keyword: "indentation", message: "Indentation must be 2 or 4 spaces." }], warnings: [], elementCount: 0, attributeCount: 0, maximumDepth: 0 };
  if (/<!DOCTYPE\b/iu.test(xml) || /<!ENTITY\b/iu.test(xml)) return { valid: false, formatted: "", errors: [{ path: "", keyword: "doctype", message: "DOCTYPE and ENTITY declarations are disabled." }], warnings: [], elementCount: 0, attributeCount: 0, maximumDepth: 0 };

  const roots: XmlNode[] = [];
  const stack: XmlElement[] = [];
  let index = 0;
  let elementCount = 0;
  let attributeCount = 0;
  let maximumDepth = 0;
  let nodeCount = 0;
  let rootElements = 0;
  let xmlDeclarationSeen = false;
  let significantTokenSeen = false;

  const append = (node: XmlNode): void => {
    nodeCount += 1;
    if (nodeCount > MAX_XML_NODES) {
      errors.push({ path: "", keyword: "nodes", message: "XML input exceeds 10,000 parsed nodes." });
      return;
    }
    const parent = stack.at(-1);
    if (parent) parent.children.push(node);
    else roots.push(node);
  };

  while (index < xml.length && errors.length < MAX_ERRORS) {
    if (xml.startsWith("<!--", index)) {
      const end = xml.indexOf("-->", index + 4);
      if (end < 0) { errors.push({ path: "", keyword: "comment", message: "Unterminated XML comment." }); break; }
      const value = xml.slice(index + 4, end);
      if (value.includes("--")) errors.push({ path: "", keyword: "comment", message: "XML comments cannot contain --." });
      append({ kind: "comment", value });
      significantTokenSeen = true;
      index = end + 3;
      continue;
    }
    if (xml.startsWith("<![CDATA[", index)) {
      const end = xml.indexOf("]]>", index + 9);
      if (end < 0) { errors.push({ path: "", keyword: "cdata", message: "Unterminated CDATA section." }); break; }
      if (!stack.length) errors.push({ path: "", keyword: "cdata", message: "CDATA is not allowed outside the root element." });
      append({ kind: "cdata", value: xml.slice(index + 9, end) });
      significantTokenSeen = true;
      index = end + 3;
      continue;
    }
    if (xml.startsWith("<?", index)) {
      const end = xml.indexOf("?>", index + 2);
      if (end < 0) { errors.push({ path: "", keyword: "processingInstruction", message: "Unterminated processing instruction." }); break; }
      const value = xml.slice(index + 2, end).trim();
      if (!value) errors.push({ path: "", keyword: "processingInstruction", message: "Processing instruction target is empty." });
      const target = value.split(/\s/u, 1)[0] ?? "";
      if (!XML_NAME.test(target)) errors.push({ path: "", keyword: "processingInstruction", message: "Processing instruction target is invalid." });
      if (target.toLowerCase() === "xml") {
        if (xmlDeclarationSeen || significantTokenSeen || stack.length || index !== 0) errors.push({ path: "", keyword: "declaration", message: "XML declaration must appear once at the beginning of the document." });
        if (!validXmlDeclaration(value)) errors.push({ path: "", keyword: "declaration", message: "XML declaration syntax is invalid." });
        xmlDeclarationSeen = true;
      } else {
        significantTokenSeen = true;
      }
      append({ kind: "pi", value });
      index = end + 2;
      continue;
    }
    if (xml[index] === "<") {
      const end = findTagEnd(xml, index + 1);
      if (end < 0) { errors.push({ path: "", keyword: "tag", message: "Unterminated XML tag." }); break; }
      const raw = xml.slice(index + 1, end);
      if (raw.startsWith("/")) {
        const name = raw.slice(1).trim();
        if (!XML_NAME.test(name)) errors.push({ path: "", keyword: "name", message: `Invalid closing tag: ${name}.` });
        const open = stack.pop();
        if (!open) errors.push({ path: "", keyword: "tag", message: `Closing tag ${name} has no matching start tag.` });
        else if (open.name !== name) errors.push({ path: "", keyword: "tag", message: `Expected closing tag </${open.name}> but found </${name}>.` });
      } else if (raw.startsWith("!")) {
        errors.push({ path: "", keyword: "declaration", message: "Unsupported XML declaration." });
      } else {
        const parsed = parseStartTag(raw, `/${elementCount + 1}`, errors);
        if (parsed) {
          significantTokenSeen = true;
          const element: XmlElement = { kind: "element", name: parsed.name, attributes: parsed.attributes, children: [], selfClosing: parsed.selfClosing };
          append(element);
          elementCount += 1;
          attributeCount += parsed.attributes.length;
          if (!stack.length) rootElements += 1;
          if (!parsed.selfClosing) {
            stack.push(element);
            maximumDepth = Math.max(maximumDepth, stack.length);
            if (stack.length > MAX_DEPTH) errors.push({ path: "", keyword: "depth", message: "XML nesting exceeds 64 levels." });
          }
        }
      }
      index = end + 1;
      continue;
    }
    const next = xml.indexOf("<", index);
    const end = next < 0 ? xml.length : next;
    const value = xml.slice(index, end);
    validateXmlEntities(value, "", errors);
    if (value.includes("]]>")) errors.push({ path: "", keyword: "text", message: "]]> is not allowed in character data." });
    if (value.length) significantTokenSeen = true;
    if (!stack.length && value.trim()) errors.push({ path: "", keyword: "document", message: "Non-whitespace text is not allowed outside the root element." });
    if (value) append({ kind: "text", value });
    index = end;
  }

  if (stack.length) errors.push({ path: "", keyword: "tag", message: `Unclosed element: ${stack.at(-1)?.name ?? "unknown"}.` });
  if (rootElements !== 1) errors.push({ path: "", keyword: "document", message: `XML document must contain exactly one root element; found ${rootElements}.` });
  if (errors.length) return { valid: false, formatted: "", errors: errors.slice(0, MAX_ERRORS), warnings: [...warnings], elementCount, attributeCount, maximumDepth };

  const formatted = roots.flatMap((node) => {
    if (node.kind === "text" && !node.value.trim()) return [];
    return formatXmlNode(node, 0, indentation, warnings);
  }).join("\n");
  return { valid: true, formatted, errors: [], warnings: [...warnings], elementCount, attributeCount, maximumDepth };
}
