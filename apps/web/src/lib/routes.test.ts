import { describe, expect, it } from "vitest";
import { localizedHref, localizedPath } from "./routes";

describe("localizedPath", () => {
  it("preserves the current Russian route when switching to English", () => {
    expect(localizedPath("/tools/image-resizer", "en")).toBe("/en/tools/image-resizer");
    expect(localizedPath("/tools", "en")).toBe("/en/tools");
    expect(localizedPath("/", "en")).toBe("/en");
  });

  it("preserves the current English route when switching to Russian", () => {
    expect(localizedPath("/en/tools/image-resizer", "ru")).toBe("/tools/image-resizer");
    expect(localizedPath("/en/tools", "ru")).toBe("/tools");
    expect(localizedPath("/en", "ru")).toBe("/");
  });

  it("does not duplicate the English prefix", () => {
    expect(localizedPath("/en/tools", "en")).toBe("/en/tools");
  });
});

describe("localizedHref", () => {
  it("preserves query parameters and the hash in both directions", () => {
    expect(localizedHref("/tools/image-resizer", "en", "?source=audit", "#privacy"))
      .toBe("/en/tools/image-resizer?source=audit#privacy");
    expect(localizedHref("/en/tools/image-resizer", "ru", "source=audit", "privacy"))
      .toBe("/tools/image-resizer?source=audit#privacy");
  });

  it("handles empty and encoded URL suffixes without layout-specific logic", () => {
    expect(localizedHref("/", "en")).toBe("/en");
    expect(localizedHref("/en", "ru", "q=RU%20EN&mode=1", "result"))
      .toBe("/?q=RU%20EN&mode=1#result");
  });
});
