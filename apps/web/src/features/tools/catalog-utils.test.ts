import { describe, expect, it } from "vitest";
import { filterCatalogTools, safeInitialCategory, type CatalogTool } from "./catalog-utils";

const tools: CatalogTool[] = [
  { slug: "json", title: "JSON Formatter", description: "Format JSON data", category: "development", categoryTitle: "Development", local: true },
  { slug: "crop", title: "Image Cropper", description: "Crop an image", category: "media", categoryTitle: "Media", local: true },
];

describe("tool catalog filtering", () => {
  it("matches title, description, and localized category", () => {
    expect(filterCatalogTools(tools, "formatter", "all").map((tool) => tool.slug)).toEqual(["json"]);
    expect(filterCatalogTools(tools, "media", "all").map((tool) => tool.slug)).toEqual(["crop"]);
  });

  it("combines category and text filters", () => {
    expect(filterCatalogTools(tools, "image", "media").map((tool) => tool.slug)).toEqual(["crop"]);
    expect(filterCatalogTools(tools, "json", "media")).toEqual([]);
  });

  it("rejects unknown categories from the URL", () => {
    expect(safeInitialCategory("media", ["development", "media"])).toBe("media");
    expect(safeInitialCategory("internal", ["development", "media"])).toBe("all");
  });
});
