import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { HomePage } from "./home-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

it.each([
  ["ru", "/home/hero-dashboard.webp"],
  ["en", "/design/icons/seo-audit.webp"],
] as const)("preserves the approved %s hero asset and eager delivery in the initial document", (locale, source) => {
  const markup = renderToStaticMarkup(<HomePage locale={locale} />);
  const preloads = [...markup.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => tag.includes('rel="preload"') && tag.includes(`href="${source}"`));

  expect(preloads).toHaveLength(1);
  const image = markup.match(/<img\b[^>]*class="wd-hero-dashboard"[^>]*>/)?.[0];
  expect(image).toContain(`src="${source}"`);
  expect(image).toContain('width="900"');
  expect(image).toContain('height="900"');
  expect(image).toContain('loading="eager"');
  expect(image).toContain('decoding="async"');
  expect(image).not.toContain("srcSet=");
});
