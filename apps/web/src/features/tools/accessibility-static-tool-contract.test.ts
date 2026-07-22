import { describe, expect, it } from "vitest";
import {
  isFormAccessibilityResponse,
  isInteractiveAccessibleNameResponse,
  isLandmarkStructureResponse,
} from "./accessibility-static-tool-contract";

const base = {
  generated_at: "2026-07-22T00:00:00Z",
  requested_url: "https://example.com/",
  final_url: "https://example.com/",
  status_code: 200,
  content_type: "text/html",
  scan_mode: "static_html_bounded",
  finding_count: 0,
  findings: [],
  redirect_count: 0,
  truncated: false,
  status: "pass",
  recommendation: "Review it.",
};

describe("accessibility static contracts", () => {
  it("validates landmark, form, and interactive contracts", () => {
    expect(isLandmarkStructureResponse({
      ...base,
      contract_version: "webdiag.tool.landmark_structure_analyzer.v1",
      landmark_count: 1,
      named_landmark_count: 0,
      main_count: 1,
      navigation_count: 0,
      banner_count: 0,
      contentinfo_count: 0,
      complementary_count: 0,
      search_count: 0,
      form_landmark_count: 0,
      region_count: 0,
      duplicate_role_name_count: 0,
      landmarks: [{
        position: 1,
        tag: "main",
        role: null,
        landmark_type: "main",
        id_value: null,
        accessible_name: null,
        name_source: "none",
        hidden_signal: false,
        nested_landmark_depth: 0,
        issues: [],
      }],
    })).toBe(true);

    expect(isFormAccessibilityResponse({
      ...base,
      contract_version: "webdiag.tool.form_accessibility_analyzer.v1",
      form_count: 1,
      control_count: 1,
      labeled_control_count: 1,
      unlabeled_control_count: 0,
      placeholder_only_count: 0,
      button_control_count: 0,
      fieldset_count: 0,
      fieldset_without_legend_count: 0,
      broken_label_reference_count: 0,
      broken_description_reference_count: 0,
      ungrouped_choice_set_count: 0,
      forms: [{
        position: 1,
        id_value: null,
        accessible_name: "Search",
        name_source: "aria-label",
        control_count: 1,
        labeled_control_count: 1,
        unlabeled_control_count: 0,
        fieldset_count: 0,
        fieldset_without_legend_count: 0,
        issues: [],
      }],
      controls: [{
        position: 2,
        tag: "input",
        input_type: "search",
        id_value: "query",
        name_attribute: "q",
        form_position: 1,
        accessible_name: "Query",
        name_source: "label",
        required: false,
        disabled: false,
        placeholder_present: false,
        issues: [],
      }],
    })).toBe(true);

    expect(isInteractiveAccessibleNameResponse({
      ...base,
      contract_version: "webdiag.tool.interactive_accessible_name_analyzer.v1",
      interactive_count: 1,
      link_count: 1,
      button_count: 0,
      role_link_count: 0,
      role_button_count: 0,
      named_count: 1,
      unnamed_count: 0,
      generic_name_count: 0,
      nested_interactive_count: 0,
      role_without_keyboard_signal_count: 0,
      items: [{
        position: 1,
        kind: "link",
        tag: "a",
        role: null,
        href: "/docs",
        id_value: null,
        accessible_name: "Documentation",
        name_source: "text",
        native_element: true,
        hidden_signal: false,
        generic_name: false,
        issues: [],
      }],
    })).toBe(true);
  });

  it("rejects negative counters and malformed nested items", () => {
    expect(isLandmarkStructureResponse({
      ...base,
      contract_version: "webdiag.tool.landmark_structure_analyzer.v1",
      landmark_count: -1,
      named_landmark_count: 0,
      main_count: 0,
      navigation_count: 0,
      banner_count: 0,
      contentinfo_count: 0,
      complementary_count: 0,
      search_count: 0,
      form_landmark_count: 0,
      region_count: 0,
      duplicate_role_name_count: 0,
      landmarks: [],
    })).toBe(false);

    expect(isInteractiveAccessibleNameResponse({
      ...base,
      contract_version: "webdiag.tool.interactive_accessible_name_analyzer.v1",
      interactive_count: 1,
      link_count: 1,
      button_count: 0,
      role_link_count: 0,
      role_button_count: 0,
      named_count: 1,
      unnamed_count: 0,
      generic_name_count: 0,
      nested_interactive_count: 0,
      role_without_keyboard_signal_count: 0,
      items: [{ position: 0 }],
    })).toBe(false);
  });
});
