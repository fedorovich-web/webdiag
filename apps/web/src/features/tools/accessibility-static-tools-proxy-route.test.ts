import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as landmarkPost } from "../../../app/api/tools/landmark-structure/route";
import { POST as formPost } from "../../../app/api/tools/form-accessibility/route";
import { POST as interactivePost } from "../../../app/api/tools/interactive-accessible-names/route";

function request(path: string, body: unknown): NextRequest {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

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
  recommendation: "OK",
};

const landmarkPayload = {
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
  landmarks: [],
};

const formPayload = {
  ...base,
  contract_version: "webdiag.tool.form_accessibility_analyzer.v1",
  form_count: 0,
  control_count: 0,
  labeled_control_count: 0,
  unlabeled_control_count: 0,
  placeholder_only_count: 0,
  button_control_count: 0,
  fieldset_count: 0,
  fieldset_without_legend_count: 0,
  broken_label_reference_count: 0,
  broken_description_reference_count: 0,
  ungrouped_choice_set_count: 0,
  forms: [],
  controls: [],
};

const interactivePayload = {
  ...base,
  contract_version: "webdiag.tool.interactive_accessible_name_analyzer.v1",
  interactive_count: 0,
  link_count: 0,
  button_count: 0,
  role_link_count: 0,
  role_button_count: 0,
  named_count: 0,
  unnamed_count: 0,
  generic_name_count: 0,
  nested_interactive_count: 0,
  role_without_keyboard_signal_count: 0,
  items: [],
};

describe("accessibility static proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("forwards only a normalized URL to each endpoint", async () => {
    const cases = [
      {
        post: landmarkPost,
        path: "/api/tools/landmark-structure",
        payload: landmarkPayload,
      },
      {
        post: formPost,
        path: "/api/tools/form-accessibility",
        payload: formPayload,
      },
      {
        post: interactivePost,
        path: "/api/tools/interactive-accessible-names",
        payload: interactivePayload,
      },
    ] as const;
    for (const testCase of cases) {
      const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(JSON.parse(String(init?.body))).toEqual({ url: "https://example.com/" });
        return new Response(JSON.stringify(testCase.payload), { status: 200 });
      });
      vi.stubGlobal("fetch", fetchMock);
      const response = await testCase.post(request(testCase.path, {
        url: " https://example.com ",
        headers: { host: "127.0.0.1" },
      }));
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      vi.unstubAllGlobals();
    }
  });

  it("rejects invalid and non-string URLs before backend calls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await landmarkPost(request("/api/tools/landmark-structure", { url: 12 }))).status).toBe(400);
    expect((await formPost(request("/api/tools/form-accessibility", { url: "file:///tmp/a" }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid successful contracts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ contract_version: "wrong" }), { status: 200 })));
    const response = await interactivePost(request("/api/tools/interactive-accessible-names", { url: "https://example.com/" }));
    expect(response.status).toBe(502);
    expect((await response.json()).detail.code).toBe("tool_api_invalid_response");
  });

  it("preserves structured backend errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      detail: { code: "tool_url_rejected", message: "Rejected." },
    }), { status: 400 })));
    const response = await landmarkPost(request("/api/tools/landmark-structure", { url: "https://example.com/" }));
    expect(response.status).toBe(400);
    expect((await response.json()).detail.code).toBe("tool_url_rejected");
  });
});
