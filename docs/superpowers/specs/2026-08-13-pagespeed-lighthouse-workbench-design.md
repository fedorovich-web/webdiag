# PageSpeed and Lighthouse Workbench Design

## Goal

Expand the existing Core Web Vitals PageSpeed integration into one bounded workbench that
returns all official Lighthouse category scores and the highest-priority audit findings,
while retaining separate lab and CrUX field metrics.

## Provider Contract

The Google PageSpeed Insights v5 API accepts repeated `category` parameters for
`performance`, `accessibility`, `best-practices`, and `seo`. One provider response contains
the category map, audit references, and audit result map. WebDiag requests all four for each
selected mobile/desktop strategy.

## Stable Projection

- Keep the current performance score, lab metrics, field data, and opportunities.
- Add category summaries for the four known category IDs only.
- Add at most 20 weighted failed/partial audits referenced by those categories.
- Return only bounded scalar fields: audit ID, title, category, score, score display mode,
  display value, and weight. Do not return free-form details, screenshots, arbitrary HTML,
  stack traces, or full network request data.
- Treat missing categories or unsupported payloads as explicit unavailable data.

## Product Boundary

The expanded aggregate covers the useful scope of the legacy Lighthouse Audit and Quick
Accessibility Audit definitions. It does not claim a request waterfall, responsive layout
geometry, or dedicated render-blocking trace; those definitions remain blockers.
