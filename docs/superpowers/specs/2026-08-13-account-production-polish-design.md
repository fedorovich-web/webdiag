# WebDiag Account Production Polish Design

## Status

This design refines the approved account Operations Workspace. It does not change account contracts, add product capabilities, or replace the WebDiag visual identity. The implementation source, versioned API contracts, current browser fixtures, and the existing account design specification remain authoritative.

## Verified baseline

- The working branch is `feature/backend-production-readiness` at `6d768805a98ae55331149f55d282793d33a918ec` with a clean worktree at the start of this patch.
- The account browser suite passes 13 of 13 tests against the current build.
- The mobile drawer already has modal semantics, focus containment, Escape dismissal, focus restoration, backdrop dismissal, and body scroll locking.
- The account uses existing global semantic tokens for light and dark themes. Account-local aliases in `account.css` map to those tokens.
- The account report reads only an immutable stored snapshot. Export, print, and public sharing use the same snapshot data and existing security boundaries.

## Design direction

The account remains an operations-first workspace. The Vella reference is used only as a quality benchmark for compact navigation, controlled contrast, disciplined density, and clear hierarchy. WebDiag does not copy Vella assets, finance-specific layouts, claims, or product behaviors.

Three shell approaches were considered:

1. Mount a compact account navigation trigger into a dedicated slot in the shared site header and keep the current accessible drawer.
2. Keep a separate sticky account toolbar below the site header.
3. Introduce a separate authenticated route layout and duplicate the header structure.

Approach 1 is selected. It fixes placement without duplicating global controls or creating a second header architecture. The full wordmark may collapse to the existing WebDiag mark on narrow account routes so the account trigger, language control, and theme control retain 44-pixel targets without overflow.

## Shell and navigation

- `SiteHeader` owns an inert account-action slot inside its existing actions group.
- `AccountWorkspaceShell` mounts one compact icon button into that slot after the client has resolved it.
- The button has a localized accessible name, `aria-expanded`, and `aria-controls`; the icon is decorative.
- The existing drawer remains a modal navigation surface with the current focus, Escape, backdrop, and scroll-lock behavior.
- Desktop retains the left navigation rail. The account trigger is visible only below the existing 900-pixel rail breakpoint.
- Loading and unavailable account states do not expose stale authenticated navigation.

## Overview and project hierarchy

- Reduce repeated elevation: the account canvas establishes the shell, while related content groups use borders, dividers, and muted fills before additional shadows.
- Compress the overview header, metric row, next-action block, project list, create disclosure, and archive section without removing labels or persisted facts.
- Metrics remain four persisted counts. No trend, percentage, chart, health state, or derived history is added.
- Next actions use the full available mobile width and distinguish the first deterministic action through hierarchy, not invented urgency.
- Primary actions retain the brand fill. Secondary, lifecycle, and disclosure actions remain neutral or semantic.
- Project, report, monitoring, and settings pages share the same compact section rhythm and mobile action rules.

## Report document

- The immutable report becomes one coherent document surface instead of a vertical stack of visually identical cards.
- The cover combines title, project, origin, score, audit date, generation date, and check count in a compact reading block.
- Executive summary, priority distribution, and the first stored recommendations form a compact summary band.
- Issues remain ordered by the existing priority selector. Each issue shows its stored priority and stored severity as separate labelled signals.
- Check results and methodology use section dividers and progressive disclosure. Stored diagnostic prose remains unchanged.
- Export and sharing stay in a separate delivery surface because they mutate or transfer access rather than describe audit content.
- Public, HTML, print, and PDF representations keep the same semantic order, no-store/noindex boundaries, safe escaping, and readable print behavior.

## Responsive and accessibility requirements

- Supported audit viewports are 1440 by 900, 1024 by 768, 768 by 1024, and 390 by 844 CSS pixels.
- No account route may create horizontal document overflow.
- Controls on touch layouts remain at least 44 by 44 CSS pixels.
- Long project names, origins, report titles, issue text, and share links wrap or truncate only where the complete value remains available in context.
- RU and EN retain equivalent information architecture.
- Light and dark themes use only existing semantic tokens and account aliases declared before use.
- Keyboard order, visible focus, reduced motion, heading hierarchy, landmarks, live feedback, loading, empty, error, archived, and disabled states remain functional.

## Security and data boundaries

- This patch does not change backend authorization, ownership, session, SSRF, injection, report token, or API validation behavior.
- React renders all stored text as text. No raw HTML path is added.
- The report displays only snapshot fields accepted by the current strict contract.
- Unknown stored severity values fall back to the stored value rather than being reclassified.
- Fixture values used by browser tests remain test data and are not presented as product claims.

## Acceptance criteria

- On mobile account routes, the navigation trigger sits in the shared header action group and the old standalone “Меню кабинета” bar is absent.
- Opening and closing the drawer preserves all current accessibility behavior and body scroll is restored exactly.
- The mobile next-action area uses the available content width and all inspected account routes avoid horizontal overflow.
- The overview and report are materially shorter at the same fixture content while retaining every persisted fact and action.
- The report presents priority and severity separately, keeps the stored fix order, and leaves export/share security behavior unchanged.
- Desktop rail geometry, project-aware navigation, RU/EN, dark theme, loading/error/empty/archived states, print output, and keyboard navigation pass browser verification.
- Targeted tests, the affected web package gate, real browser screenshots, the Impeccable detector, and `git diff --check` pass before completion.

