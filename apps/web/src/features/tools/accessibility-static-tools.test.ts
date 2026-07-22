import { describe, expect, it } from "vitest";
import {
  formAccessibilityResultText,
  interactiveAccessibleNameResultText,
  landmarkStructureResultText,
} from "./accessibility-static-tools";
import type {
  FormAccessibilityResponse,
  InteractiveAccessibleNameResponse,
  LandmarkStructureResponse,
} from "./accessibility-static-tool-contract";

const base = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  scan_mode: "static_html_bounded" as const,
  finding_count: 0,
  findings: [],
  redirect_count: 0,
  truncated: false,
  status: "warning" as const,
  recommendation: "Review it.",
};

describe("accessibility static report text", () => {
  it("includes landmark counters", () => {
    const result = {
      ...base,
      contract_version: "webdiag.tool.landmark_structure_analyzer.v1",
      landmark_count: 6,
      named_landmark_count: 3,
      main_count: 1,
      navigation_count: 2,
      banner_count: 1,
      contentinfo_count: 1,
      complementary_count: 1,
      search_count: 0,
      form_landmark_count: 0,
      region_count: 0,
      duplicate_role_name_count: 1,
      landmarks: [],
    } satisfies LandmarkStructureResponse;
    expect(landmarkStructureResultText(result)).toContain("Landmarks: 6");
    expect(landmarkStructureResultText(result)).toContain("Duplicate role/name pairs: 1");
  });

  it("includes form labeling and grouping counters", () => {
    const result = {
      ...base,
      contract_version: "webdiag.tool.form_accessibility_analyzer.v1",
      form_count: 2,
      control_count: 8,
      labeled_control_count: 6,
      unlabeled_control_count: 2,
      placeholder_only_count: 1,
      button_control_count: 2,
      fieldset_count: 1,
      fieldset_without_legend_count: 1,
      broken_label_reference_count: 1,
      broken_description_reference_count: 0,
      ungrouped_choice_set_count: 1,
      forms: [],
      controls: [],
    } satisfies FormAccessibilityResponse;
    expect(formAccessibilityResultText(result)).toContain("Unlabeled controls: 2");
    expect(formAccessibilityResultText(result)).toContain("Ungrouped choice sets: 1");
  });

  it("includes interactive accessible-name counters", () => {
    const result = {
      ...base,
      contract_version: "webdiag.tool.interactive_accessible_name_analyzer.v1",
      interactive_count: 10,
      link_count: 6,
      button_count: 2,
      role_link_count: 1,
      role_button_count: 1,
      named_count: 8,
      unnamed_count: 2,
      generic_name_count: 1,
      nested_interactive_count: 1,
      role_without_keyboard_signal_count: 1,
      items: [],
    } satisfies InteractiveAccessibleNameResponse;
    expect(interactiveAccessibleNameResultText(result)).toContain("Unnamed: 2");
    expect(interactiveAccessibleNameResultText(result)).toContain("Custom roles without tabindex=0: 1");
  });
});
