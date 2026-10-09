import { expect, it } from "vitest";
import { isAICatalogResponse, isAIRunDetailResponse } from "./account-ai-contract";

export const restoredOutputs = {
  ai_meta_serp_studio: { variants: Array.from({ length: 3 }, () => ({ title: "Title", description: "Description", rationale: "Reason" })) },
  ai_schema_studio: { json_ld: { "@context": "https://schema.org", "@type": "WebPage", name: "Page" }, property_sources: { "/name": [0] }, warnings: [] },
  ai_faq_studio: { items: Array.from({ length: 3 }, (_, index) => ({ question: `Question ${index}`, answer: "Answer", evidence: "Source" })) },
  ai_alt_text_studio: { alt_text: "A tree", decorative: false, rationale: "Visible tree" },
  ai_redirect_migration_mapper: { summary: "Review mapping", mappings: [{ old_page_index: 0, action: "no_match", target_page_index: null, confidence: "low", old_evidence: "Source", target_evidence: null, rationale: "No match" }], warnings: [] },
  ai_localization_workbench: { localized_content: "A sufficiently long localized text", glossary_usages: [], preserved_constraint_indexes: [], warnings: [] },
  ai_regex_workbench: { dialect: "python", pattern: "^a$", validation_status: "unverified", case_plan: [{ case_index: 0, expected_match: true }], explanation: "Review before use", warnings: [] },
  ai_image_studio: { artifact_id: "22222222-2222-4222-8222-222222222222", media_type: "image/png", byte_size: 100, sha256: "a".repeat(64) },
  ai_image_edit_studio: { artifact_id: "22222222-2222-4222-8222-222222222222", media_type: "image/png", byte_size: 100, sha256: "a".repeat(64) },
};

function detail(tool_id: string, output: unknown) {
  return { contract_version: "webdiag.ai.run.v1", run: { id: "11111111-1111-4111-8111-111111111111", tool_id, contract_version: "v1", credit_price: 5, state: "succeeded", output, error_code: null, created_at: "2026-10-09T12:00:00Z", updated_at: "2026-10-09T12:01:00Z" } };
}

it.each(Object.entries(restoredOutputs))("accepts %s output and rejects extra fields", (id, output) => {
  expect(isAICatalogResponse({ contract_version: "webdiag.ai.catalog.v1", tools: [{ id, contract_version: "v1", credit_price: 5 }] })).toBe(true);
  expect(isAIRunDetailResponse(detail(id, output))).toBe(true);
  expect(isAIRunDetailResponse(detail(id, { ...output, private_url: "https://evil.example" }))).toBe(false);
});

it("rejects public image URLs, verified regex claims and inconsistent decorative alt text", () => {
  expect(isAIRunDetailResponse(detail("ai_image_studio", { ...restoredOutputs.ai_image_studio, artifact_id: "https://evil.example/a.png" }))).toBe(false);
  expect(isAIRunDetailResponse(detail("ai_regex_workbench", { ...restoredOutputs.ai_regex_workbench, validation_status: "verified" }))).toBe(false);
  expect(isAIRunDetailResponse(detail("ai_alt_text_studio", { ...restoredOutputs.ai_alt_text_studio, decorative: true }))).toBe(false);
});
