import { describe, expect, it } from "vitest";
import { publicTools } from "@webdiag/tool-registry";
import { SUPPORTED_TOOL_SLUGS } from "./tool-renderer";

describe("tool renderer registry contract", () => {
  it("has one renderer for every ready tool and no unpublished renderer", () => {
    const ready = publicTools.map((tool) => tool.slug).sort();
    const supported = [...SUPPORTED_TOOL_SLUGS].sort();
    expect(supported).toEqual(ready);
  });

  it("renders the favicon generator", () => {
    expect(SUPPORTED_TOOL_SLUGS).toContain("favicon-generator");
  });

  it("renders the responsive srcset generator", () => {
    expect(SUPPORTED_TOOL_SLUGS).toContain("responsive-image-srcset-generator");
  });
});
