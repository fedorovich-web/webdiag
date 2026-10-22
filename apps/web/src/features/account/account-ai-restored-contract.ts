export interface MetaOutput {
  readonly variants: readonly {
    readonly title: string;
    readonly description: string;
    readonly rationale: string;
  }[];
}
export interface SchemaOutput {
  readonly json_ld: Record<string, unknown>;
  readonly property_sources: Record<string, readonly number[]>;
  readonly warnings: readonly string[];
}
export interface FAQOutput {
  readonly items: readonly {
    readonly question: string;
    readonly answer: string;
    readonly evidence: string;
  }[];
}
export interface AltOutput {
  readonly alt_text: string;
  readonly decorative: boolean;
  readonly rationale: string;
}
export interface RedirectOutput {
  readonly summary: string;
  readonly mappings: readonly {
    readonly old_page_index: number;
    readonly action: "redirect" | "no_match";
    readonly target_page_index: number | null;
    readonly confidence: "low" | "medium" | "high";
    readonly old_evidence: string;
    readonly target_evidence: string | null;
    readonly rationale: string;
  }[];
  readonly warnings: readonly string[];
}
export interface LocalizationOutput {
  readonly localized_content: string;
  readonly glossary_usages: readonly {
    readonly glossary_index: number;
    readonly source_excerpt: string;
    readonly target_excerpt: string;
  }[];
  readonly preserved_constraint_indexes: readonly number[];
  readonly warnings: readonly string[];
}
export interface RegexOutput {
  readonly dialect: "python" | "javascript" | "re2";
  readonly pattern: string;
  readonly validation_status: "unverified";
  readonly case_plan: readonly {
    readonly case_index: number;
    readonly expected_match: boolean;
  }[];
  readonly explanation: string;
  readonly warnings: readonly string[];
}
export interface ImageOutput {
  readonly artifact_id: string;
  readonly media_type: "image/jpeg" | "image/png" | "image/webp";
  readonly byte_size: number;
  readonly sha256: string;
}
export type RestoredOutput =
  | MetaOutput
  | SchemaOutput
  | FAQOutput
  | AltOutput
  | RedirectOutput
  | LocalizationOutput
  | RegexOutput
  | ImageOutput;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
export function canonicalAIResourceId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
function record(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function exact(v: unknown, keys: string[]): v is Record<string, unknown> {
  return (
    record(v) &&
    Object.keys(v).length === keys.length &&
    keys.every((key) => Object.hasOwn(v, key))
  );
}
function str(v: unknown, max: number, min = 1): v is string {
  return typeof v === "string" && v.length >= min && v.length <= max;
}
function index(v: unknown, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < max;
}
function array(
  v: unknown,
  min: number,
  max: number,
  check: (item: unknown) => boolean,
): v is unknown[] {
  return (
    Array.isArray(v) && v.length >= min && v.length <= max && v.every(check)
  );
}
function warnings(v: unknown) {
  return array(v, 0, 20, (item) => str(item, 1000));
}
function uniqueIndexes(v: unknown, max: number) {
  return (
    array(v, 0, max, (item) => index(item, max)) && new Set(v).size === v.length
  );
}
function schemaPathExists(
  root: Record<string, unknown>,
  path: string,
): boolean {
  if (!path.startsWith("/") || path.length > 2048) return false;
  let current: unknown = root;
  for (const raw of path.slice(1).split("/")) {
    const key = raw.replace(/~1/gu, "/").replace(/~0/gu, "~");
    if (
      (!record(current) && !Array.isArray(current)) ||
      !Object.hasOwn(current, key)
    )
      return false;
    current = (current as Record<string, unknown>)[key];
  }
  return (
    current === null || ["string", "number", "boolean"].includes(typeof current)
  );
}

export function isPrivateImageOutput(v: unknown): v is ImageOutput {
  return (
    exact(v, ["artifact_id", "media_type", "byte_size", "sha256"]) &&
    canonicalAIResourceId(v.artifact_id) &&
    ["image/jpeg", "image/png", "image/webp"].includes(String(v.media_type)) &&
    index(v.byte_size, 4194305) &&
    v.byte_size > 0 &&
    typeof v.sha256 === "string" &&
    /^[0-9a-f]{64}$/u.test(v.sha256)
  );
}

export function isRestoredOutput(id: string, v: unknown): v is RestoredOutput {
  if (id === "ai_meta_serp_studio")
    return (
      exact(v, ["variants"]) &&
      array(
        v.variants,
        3,
        3,
        (item) =>
          exact(item, ["title", "description", "rationale"]) &&
          str(item.title, 100) &&
          str(item.description, 300) &&
          str(item.rationale, 1000),
      )
    );
  if (id === "ai_schema_studio")
    return (
      exact(v, ["json_ld", "property_sources", "warnings"]) &&
      record(v.json_ld) &&
      v.json_ld["@context"] === "https://schema.org" &&
      [
        "WebPage",
        "Article",
        "Organization",
        "LocalBusiness",
        "Product",
      ].includes(String(v.json_ld["@type"])) &&
      record(v.property_sources) &&
      Object.entries(v.property_sources).every(
        ([key, sources]) =>
          schemaPathExists(v.json_ld as Record<string, unknown>, key) &&
          array(sources, 1, 50, (source) => index(source, 50)),
      ) &&
      warnings(v.warnings)
    );
  if (id === "ai_faq_studio")
    return (
      exact(v, ["items"]) &&
      array(
        v.items,
        3,
        10,
        (item) =>
          exact(item, ["question", "answer", "evidence"]) &&
          str(item.question, 500) &&
          str(item.answer, 2000) &&
          str(item.evidence, 1000),
      )
    );
  if (id === "ai_alt_text_studio")
    return (
      exact(v, ["alt_text", "decorative", "rationale"]) &&
      typeof v.decorative === "boolean" &&
      str(v.alt_text, 300, v.decorative ? 0 : 1) &&
      (!v.decorative || v.alt_text === "") &&
      str(v.rationale, 500)
    );
  if (id === "ai_redirect_migration_mapper")
    return (
      exact(v, ["summary", "mappings", "warnings"]) &&
      str(v.summary, 4000) &&
      warnings(v.warnings) &&
      array(
        v.mappings,
        1,
        50,
        (item) =>
          exact(item, [
            "old_page_index",
            "action",
            "target_page_index",
            "confidence",
            "old_evidence",
            "target_evidence",
            "rationale",
          ]) &&
          index(item.old_page_index, 50) &&
          ["low", "medium", "high"].includes(String(item.confidence)) &&
          str(item.old_evidence, 1000) &&
          str(item.rationale, 1000) &&
          (item.action === "no_match"
            ? item.target_page_index === null && item.target_evidence === null
            : item.action === "redirect" &&
              index(item.target_page_index, 50) &&
              str(item.target_evidence, 1000)),
      )
    );
  if (id === "ai_localization_workbench")
    return (
      exact(v, [
        "localized_content",
        "glossary_usages",
        "preserved_constraint_indexes",
        "warnings",
      ]) &&
      str(v.localized_content, 100000, 20) &&
      warnings(v.warnings) &&
      uniqueIndexes(v.preserved_constraint_indexes, 100) &&
      array(
        v.glossary_usages,
        0,
        100,
        (item) =>
          exact(item, ["glossary_index", "source_excerpt", "target_excerpt"]) &&
          index(item.glossary_index, 100) &&
          str(item.source_excerpt, 1000) &&
          str(item.target_excerpt, 1000),
      )
    );
  if (id === "ai_regex_workbench")
    return (
      exact(v, [
        "dialect",
        "pattern",
        "validation_status",
        "case_plan",
        "explanation",
        "warnings",
      ]) &&
      ["python", "javascript", "re2"].includes(String(v.dialect)) &&
      str(v.pattern, 2000) &&
      !v.pattern.includes("\0") &&
      v.validation_status === "unverified" &&
      str(v.explanation, 4000) &&
      warnings(v.warnings) &&
      array(
        v.case_plan,
        1,
        40,
        (item) =>
          exact(item, ["case_index", "expected_match"]) &&
          index(item.case_index, 40) &&
          typeof item.expected_match === "boolean",
      )
    );
  if (id === "ai_image_studio" || id === "ai_image_edit_studio")
    return isPrivateImageOutput(v);
  return false;
}

export interface AIUploadResponse {
  readonly contract_version: "webdiag.ai.upload.v1";
  readonly upload: Omit<ImageOutput, "artifact_id"> & {
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly created_at: string;
    readonly expires_at: string;
  };
}
export function isAIUploadResponse(v: unknown): v is AIUploadResponse {
  if (
    !exact(v, ["contract_version", "upload"]) ||
    v.contract_version !== "webdiag.ai.upload.v1" ||
    !exact(v.upload, [
      "id",
      "media_type",
      "byte_size",
      "width",
      "height",
      "sha256",
      "created_at",
      "expires_at",
    ])
  )
    return false;
  const u = v.upload;
  return (
    isPrivateImageOutput({
      artifact_id: u.id,
      media_type: u.media_type,
      byte_size: u.byte_size,
      sha256: u.sha256,
    }) &&
    index(u.width, 8193) &&
    u.width > 0 &&
    index(u.height, 8193) &&
    u.height > 0 &&
    [u.created_at, u.expires_at].every(
      (date) => typeof date === "string" && Number.isFinite(Date.parse(date)),
    )
  );
}
