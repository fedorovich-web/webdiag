# Responsive srcset generator implementation plan

## Task 1: RED contracts

- Add failing pure tests for exact line grammar, sorted output, duplicate width
  rejection, safe URL forms, limits, warnings, and HTML escaping.
- Add failing renderer, editorial, and registry publication assertions.

## Task 2: Pure engine and UI

- Add a focused browser-only module with no dependency or network surface.
- Render input and result panels with RU/EN labels, stable error state, copyable
  `srcset`, and copyable escaped `<img>` output.
- Reuse existing tool tokens and responsive layout.

## Task 3: Publication and verification

- Update both registry copies atomically and update API count assertions.
- Add complete bilingual editorial content with explicit non-capabilities.
- Run affected unit/API/registry/lint/typecheck gates, one build, and focused
  desktop/mobile Playwright coverage.
- Visually inspect controlled input, remove capture hooks, run diff hygiene,
  commit, and push the existing Draft PR branch.
