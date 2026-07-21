import { isRecord, isToolErrorPayload } from "./metadata-tool-contract";

export { isRecord, isToolErrorPayload };

export interface StructuredDataBlockResponse {
  readonly index: number;
  readonly valid: boolean;
  readonly types: readonly string[];
  readonly node_count: number;
  readonly error: string | null;
}

export interface StructuredDataTypeSummaryResponse {
  readonly type: string;
  readonly count: number;
}

export interface StructuredDataValidatorResponse {
  readonly contract_version: "webdiag.tool.structured_data.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly json_ld_count: number;
  readonly valid_json_ld_count: number;
  readonly invalid_json_ld_count: number;
  readonly detected_types: readonly StructuredDataTypeSummaryResponse[];
  readonly blocks: readonly StructuredDataBlockResponse[];
  readonly recommendation: string;
}

export interface HtmlMarkupCheckResponse {
  readonly id: string;
  readonly title: string;
  readonly status: "pass" | "warning" | "fail";
  readonly severity: "info" | "medium" | "high";
  readonly message: string;
  readonly recommendation: string;
}

export interface HtmlMarkupValidatorResponse {
  readonly contract_version: "webdiag.tool.html_markup.v1";
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly doctype_present: boolean;
  readonly html_tag_present: boolean;
  readonly head_tag_present: boolean;
  readonly body_tag_present: boolean;
  readonly html_lang: string | null;
  readonly title: string | null;
  readonly viewport_present: boolean;
  readonly duplicate_id_count: number;
  readonly unexpected_end_tag_count: number;
  readonly unclosed_tag_count: number;
  readonly checks: readonly HtmlMarkupCheckResponse[];
  readonly recommendation: string;
}

export type SchemaTemplateKind = "Organization" | "LocalBusiness" | "FAQPage" | "BreadcrumbList";

export interface SchemaGeneratorInput {
  readonly kind: SchemaTemplateKind;
  readonly name: string;
  readonly url: string;
  readonly description: string;
  readonly telephone: string;
  readonly address: string;
}

function isStructuredDataBlockResponse(payload: unknown): payload is StructuredDataBlockResponse {
  return isRecord(payload) &&
    typeof payload.index === "number" &&
    typeof payload.valid === "boolean" &&
    Array.isArray(payload.types) &&
    payload.types.every((item) => typeof item === "string") &&
    typeof payload.node_count === "number" &&
    (typeof payload.error === "string" || payload.error === null);
}

function isStructuredDataTypeSummaryResponse(payload: unknown): payload is StructuredDataTypeSummaryResponse {
  return isRecord(payload) && typeof payload.type === "string" && typeof payload.count === "number";
}

export function isStructuredDataValidatorResponse(payload: unknown): payload is StructuredDataValidatorResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.structured_data.v1") return false;
  return typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    typeof payload.json_ld_count === "number" &&
    typeof payload.valid_json_ld_count === "number" &&
    typeof payload.invalid_json_ld_count === "number" &&
    Array.isArray(payload.detected_types) &&
    payload.detected_types.every(isStructuredDataTypeSummaryResponse) &&
    Array.isArray(payload.blocks) &&
    payload.blocks.every(isStructuredDataBlockResponse) &&
    typeof payload.recommendation === "string";
}

function isHtmlMarkupCheckResponse(payload: unknown): payload is HtmlMarkupCheckResponse {
  if (!isRecord(payload)) return false;
  return typeof payload.id === "string" &&
    typeof payload.title === "string" &&
    (payload.status === "pass" || payload.status === "warning" || payload.status === "fail") &&
    (payload.severity === "info" || payload.severity === "medium" || payload.severity === "high") &&
    typeof payload.message === "string" &&
    typeof payload.recommendation === "string";
}

export function isHtmlMarkupValidatorResponse(payload: unknown): payload is HtmlMarkupValidatorResponse {
  if (!isRecord(payload) || payload.contract_version !== "webdiag.tool.html_markup.v1") return false;
  return typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    typeof payload.status_code === "number" &&
    (typeof payload.content_type === "string" || payload.content_type === null) &&
    typeof payload.doctype_present === "boolean" &&
    typeof payload.html_tag_present === "boolean" &&
    typeof payload.head_tag_present === "boolean" &&
    typeof payload.body_tag_present === "boolean" &&
    (typeof payload.html_lang === "string" || payload.html_lang === null) &&
    (typeof payload.title === "string" || payload.title === null) &&
    typeof payload.viewport_present === "boolean" &&
    typeof payload.duplicate_id_count === "number" &&
    typeof payload.unexpected_end_tag_count === "number" &&
    typeof payload.unclosed_tag_count === "number" &&
    Array.isArray(payload.checks) &&
    payload.checks.every(isHtmlMarkupCheckResponse) &&
    typeof payload.recommendation === "string";
}

export function createSchemaMarkup(input: SchemaGeneratorInput): string {
  const base = {
    "@context": "https://schema.org",
    "@type": input.kind,
    name: input.name.trim() || "Example name",
    url: input.url.trim() || "https://example.com/",
  } as Record<string, unknown>;

  if (input.description.trim()) base.description = input.description.trim();

  if (input.kind === "LocalBusiness") {
    if (input.telephone.trim()) base.telephone = input.telephone.trim();
    if (input.address.trim()) base.address = { "@type": "PostalAddress", streetAddress: input.address.trim() };
  }

  if (input.kind === "FAQPage") {
    base.mainEntity = [
      {
        "@type": "Question",
        name: input.name.trim() || "Question text",
        acceptedAnswer: {
          "@type": "Answer",
          text: input.description.trim() || "Answer text",
        },
      },
    ];
    delete base.url;
  }

  if (input.kind === "BreadcrumbList") {
    base.itemListElement = [
      { "@type": "ListItem", position: 1, name: "Home", item: input.url.trim() || "https://example.com/" },
      { "@type": "ListItem", position: 2, name: input.name.trim() || "Current page" },
    ];
    delete base.name;
    delete base.description;
    delete base.url;
  }

  return `<script type="application/ld+json">\n${JSON.stringify(base, null, 2)}\n</script>`;
}
