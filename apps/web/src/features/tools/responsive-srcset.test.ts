import { describe, expect, it } from "vitest";
import { buildResponsiveSrcset } from "./responsive-srcset";

describe("responsive srcset generator", () => {
  it("sorts candidates and escapes every HTML attribute", () => {
    const result = buildResponsiveSrcset({
      candidates: "/hero-1280.webp?x=1&y=2 | 1280\nhttps://cdn.example.com/hero-640.webp | 640",
      fallbackSrc: "/hero-640.webp?x=1&y=2",
      sizes: "(max-width: 720px) 100vw, 720px",
      alt: 'Product <front> & "detail"',
    });
    expect(result.srcset).toBe("https://cdn.example.com/hero-640.webp 640w, /hero-1280.webp?x=1&y=2 1280w");
    expect(result.html).toContain('src="/hero-640.webp?x=1&amp;y=2"');
    expect(result.html).toContain('alt="Product &lt;front&gt; &amp; &quot;detail&quot;"');
    expect(result.html).toContain('srcset="https://cdn.example.com/hero-640.webp 640w, /hero-1280.webp?x=1&amp;y=2 1280w"');
    expect(result.warnings).toEqual([]);
  });

  it("reports explicit empty alt and sizes warnings", () => {
    const result = buildResponsiveSrcset({ candidates: "/image.png | 800", fallbackSrc: "/image.png", sizes: "", alt: "" });
    expect(result.warnings).toEqual(["empty_alt", "empty_sizes"]);
    expect(result.html).toContain('alt=""');
    expect(result.html).not.toContain(" sizes=");
  });

  it.each([
    ["duplicate width", "/a.png | 640\n/b.png | 640"],
    ["credentialed URL", "https://user:pass@example.com/a.png | 640"],
    ["fragment URL", "/a.png#private | 640"],
    ["raw comma", "/a,b.png | 640"],
    ["raw space", "/a b.png | 640"],
    ["protocol-relative URL", "//example.com/a.png | 640"],
    ["invalid width", "/a.png | 0"],
    ["extra separator", "/a.png | 640 | extra"],
  ])("rejects %s", (_label, candidates) => {
    expect(() => buildResponsiveSrcset({ candidates, fallbackSrc: "/fallback.png", sizes: "100vw", alt: "Image" })).toThrow();
  });

  it("caps candidate count and text fields", () => {
    const candidates = Array.from({ length: 21 }, (_, index) => `/a-${index}.png | ${index + 1}`).join("\n");
    expect(() => buildResponsiveSrcset({ candidates, fallbackSrc: "/a.png", sizes: "100vw", alt: "Image" })).toThrow();
    expect(() => buildResponsiveSrcset({ candidates: "/a.png | 1", fallbackSrc: "/a.png", sizes: "x".repeat(501), alt: "Image" })).toThrow();
  });
});
