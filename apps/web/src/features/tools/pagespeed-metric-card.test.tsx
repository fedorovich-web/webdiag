import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { PageSpeedMetricCard } from "./pagespeed-metric-card";

it("does not describe a warning measurement as a failing threshold", () => {
  const markup = renderToStaticMarkup(<PageSpeedMetricCard locale="ru" metric={{
    id: "largest-contentful-paint", title: "LCP", value: 3200, unit: "ms",
    display_value: "3.2 s", source: "lab", status: "warning",
  }} />);
  expect(markup).toContain("3.2 s");
  expect(markup).toContain("Требует улучшения");
  expect(markup).not.toContain("&gt; 4 с");
  expect(markup).not.toContain("Плохо");
});

it("keeps an unavailable measurement neutral without inventing remediation", () => {
  const markup = renderToStaticMarkup(<PageSpeedMetricCard locale="ru" metric={{
    id: "largest-contentful-paint", title: "LCP", value: null, unit: "ms",
    display_value: null, source: "lab", status: "unavailable",
  }} />);
  expect(markup).toContain("Нет данных");
  expect(markup).not.toContain("Плохо");
  expect(markup).not.toContain("Что исправить");
});
