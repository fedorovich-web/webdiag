import type { Locale } from "@webdiag/tool-registry";
import type { AIToolId } from "./account-ai-contract";
import { canonicalAIResourceId } from "./account-ai-restored-contract";

export const STUDIO_TOOL_IDS = [
  "ai_meta_serp_studio", "ai_schema_studio", "ai_faq_studio", "ai_alt_text_studio",
  "ai_redirect_migration_mapper", "ai_localization_workbench", "ai_regex_workbench",
  "ai_image_studio", "ai_image_edit_studio",
] as const;
export type StudioToolId = typeof STUDIO_TOOL_IDS[number];
export function isStudioToolId(id: AIToolId): id is StudioToolId {
  return STUDIO_TOOL_IDS.some((tool) => tool === id);
}
export interface StudioPage {
  readonly page_url: string;
  readonly content: string;
}
function normalizeText(value: string): string {
  return value.replace(/\r\n?/gu, "\n").trim();
}
function normalizedLines(value: string): string[] {
  return value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

export function buildStudioInput(
  locale: Locale,
  id: AIToolId,
  values: Record<string, string>,
  uploadId?: string,
  oldPages: readonly StudioPage[] = [],
  newPages: readonly StudioPage[] = [],
  preparingUpload = false,
): Record<string, unknown> {
  function invalid(): Error {
    return new Error(locale === "ru"
      ? "Проверьте обязательные поля, ограничения длины и исходные данные."
      : "Check required fields, length limits and source evidence.");
  }
  function text(key: string, min: number, max: number): string {
    const value = normalizeText(values[key] ?? "");
    if (value.length < min || value.length > max || value.includes("\0")) {
      throw invalid();
    }
    return value;
  }
  function optionalText(key: string, max: number): string | null {
    if (!normalizeText(values[key] ?? "")) return null;
    return text(key, 1, max);
  }
  function choice(key: string, choices: readonly string[]): string {
    const value = values[key];
    if (typeof value !== "string" || !choices.includes(value)) throw invalid();
    return value;
  }
  function list(key: string, min: number, max: number, maxLineLength: number): string[] {
    const items = normalizedLines(values[key] ?? "");
    if (items.length < min || items.length > max
      || items.some((item) => item.length > maxLineLength)) {
      throw invalid();
    }
    return items;
  }
  function url(value: string): string {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw invalid();
    }
    if (!["https:", "http:"].includes(parsed.protocol)
      || parsed.username || parsed.password || value.length > 2048) {
      throw invalid();
    }
    return value;
  }
  function ownedUploadId(): string | undefined {
    if (preparingUpload && uploadId === undefined) return undefined;
    if (!canonicalAIResourceId(uploadId)) throw invalid();
    return uploadId;
  }
  function migrationPages(items: readonly StudioPage[]): StudioPage[] {
    if (items.length < 1 || items.length > 50) throw invalid();
    return items.map((page) => {
      const content = page.content.trim();
      if (content.length < 20 || page.content.length > 20000) throw invalid();
      return { page_url: url(page.page_url.trim()), content };
    });
  }

  if (id === "ai_meta_serp_studio") {
    return {
      locale,
      page_url: url(text("page_url", 8, 2048)),
      content: text("content", 20, 30000),
      current_title: optionalText("current_title", 300),
      current_description: optionalText("current_description", 1000),
      h1: optionalText("h1", 500),
      primary_query: optionalText("primary_query", 300),
      brand: optionalText("brand", 200),
    };
  }
  if (id === "ai_schema_studio") {
    return {
      locale,
      page_url: url(text("page_url", 8, 2048)),
      schema_type: choice("schema_type", ["WebPage", "Article", "Organization", "LocalBusiness", "Product"]),
      facts: list("facts", 1, 50, 2000),
    };
  }
  if (id === "ai_faq_studio") {
    const questionCount = Number(values.question_count);
    if (!Number.isInteger(questionCount) || questionCount < 3 || questionCount > 10) throw invalid();
    return {
      locale,
      source_content: text("source_content", 20, 40000),
      question_count: questionCount,
      audience: optionalText("audience", 300),
    };
  }
  if (id === "ai_alt_text_studio") {
    return {
      locale,
      upload_id: ownedUploadId(),
      purpose: choice("purpose", ["informative", "decorative", "unknown"]),
      page_context: optionalText("page_context", 2000),
      surrounding_text: optionalText("surrounding_text", 2000),
    };
  }
  if (id === "ai_redirect_migration_mapper") {
    const old_pages = migrationPages(oldPages);
    const new_pages = migrationPages(newPages);
    const urls = [...old_pages, ...new_pages].map((page) => {
      const parsed = new URL(page.page_url);
      parsed.search = "";
      parsed.hash = "";
      return parsed.href;
    });
    if (new Set(urls).size !== urls.length) throw invalid();
    return { locale, old_pages, new_pages };
  }
  if (id === "ai_localization_workbench") {
    const sourceContent = text("source_content", 20, 80000);
    const sourceLocale = choice("source_locale", ["ru", "en"]);
    const targetLocale = choice("target_locale", ["ru", "en"]);
    if (sourceLocale === targetLocale) throw invalid();

    const glossary = list("glossary", 0, 100, 404).map((line) => {
      const parts = line.split("=>").map((part) => part.trim());
      const [sourceTerm, targetTerm] = parts;
      if (parts.length !== 2
        || typeof sourceTerm !== "string" || !sourceTerm || sourceTerm.length > 200
        || typeof targetTerm !== "string" || !targetTerm || targetTerm.length > 200
        || !sourceContent.includes(sourceTerm)) {
        throw invalid();
      }
      return { source_term: sourceTerm, target_term: targetTerm };
    });
    const verbatimConstraints = list("verbatim_constraints", 0, 100, 1000);
    const uniqueTerms = new Set(glossary.map((entry) => entry.source_term.toLowerCase()));
    if (uniqueTerms.size !== glossary.length
      || new Set(verbatimConstraints).size !== verbatimConstraints.length
      || verbatimConstraints.some((excerpt) => !sourceContent.includes(excerpt))) {
      throw invalid();
    }
    return {
      locale,
      source_locale: sourceLocale,
      target_locale: targetLocale,
      source_content: sourceContent,
      glossary,
      verbatim_constraints: verbatimConstraints,
    };
  }
  if (id === "ai_regex_workbench") {
    function caseLines(key: string): string[] {
      const items = (values[key] ?? "").replace(/\r\n?/gu, "\n")
        .split("\n").filter((line) => line.length > 0);
      if (items.some((line) => line.length > 2000)) throw invalid();
      return items;
    }
    const cases = [
      ...caseLines("matches").map((value) => ({ text: value, expected_match: true })),
      ...caseLines("non_matches").map((value) => ({ text: value, expected_match: false })),
    ];
    if (cases.length < 1 || cases.length > 40
      || new Set(cases.map((item) => item.text)).size !== cases.length) {
      throw invalid();
    }
    return {
      locale,
      dialect: choice("dialect", ["python", "javascript", "re2"]),
      task: text("task", 1, 2000),
      cases,
      constraints: list("constraints", 0, 20, 1000),
    };
  }
  if (id === "ai_image_studio" || id === "ai_image_edit_studio") {
    return {
      locale,
      prompt: text("prompt", 10, 4000),
      aspect_ratio: choice("aspect_ratio", ["auto", "1:1", "3:2", "2:3", "4:3", "3:4", "16:9", "9:16", "21:9"]),
      quality: choice("quality", ["auto", "low", "medium", "high"]),
      background: choice("background", ["auto", "opaque"]),
      ...(id === "ai_image_edit_studio" ? { upload_id: ownedUploadId() } : {}),
    };
  }
  throw invalid();
}
