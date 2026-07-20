# WebDiag design foundation

## Direction

The public interface follows **Technical Clarity / Product Evidence**: the working operation is the visual proof, while explanatory and marketing content supports it without hiding the interface.

Primary principles:

- concrete user tasks before abstract product categories;
- real input, settings, and result surfaces instead of invented dashboards;
- a neutral light canvas and complete dark alternative;
- indigo for brand actions; green, amber, and red remain semantic;
- distinct section compositions instead of repeating the same card grid;
- compact tool directories and full-width workspaces;
- no public links to unimplemented product areas;
- no invented customers, usage statistics, reviews, monitoring claims, or unsupported capabilities.

Better Stack and Resend are reference points for product clarity and restraint. WebDiag does not copy their assets, layouts, code, content, or branding.

## Page hierarchy

The home page uses:

1. outcome-led hero with a real JSON product preview;
2. six explicit task shortcuts;
3. text/data and image workflow proof;
4. three product category bands;
5. a short operation flow;
6. verifiable local-processing information;
7. audience use cases;
8. the complete 14-tool directory;
9. visible FAQ;
10. final catalogue CTA.

Tool pages place the working interface before editorial sections. Supported behavior, limitations, use cases, technical details, FAQ, and related tools are specific to the implementation rather than generated from a generic template.

## Theme model

Supported preferences:

- `light`;
- `dark`.

The first visit always renders light. Dark mode is enabled only by an explicit action and stored under `webdiag-theme`. The bootstrap never reads operating-system or browser color preferences. Hydration suppression is scoped to the `<body>` attribute that may be changed before React hydrates.

## Typography

The interface self-hosts a RU+EN subset of Manrope Variable. The source axis is restricted to weights 400–700 and delivered as one optimized WOFF2 file, with no external font request. Typography roles are centralized as `--font-display`, `--font-body`, `--font-ui`, `--font-sans`, and `--font-mono`; code and machine-readable values keep a dedicated system monospace stack. Supported interface weights are limited to 400, 500, 600, and 700.

## Components

- buttons, fields, status surfaces, task links, tool cards, and related links share one radius and focus logic;
- language navigation is a two-link segmented control, not a preference switch;
- on mobile the top bar keeps only brand, theme, and menu controls; locale navigation appears inside the menu;
- cards are used for discrete tools and results, not for every paragraph;
- motion is limited to state feedback and respects `prefers-reduced-motion`.

## Accessibility foundation

- keyboard skip link;
- visible `:focus-visible` ring;
- semantic landmarks, lists, breadcrumbs, and FAQ disclosure controls;
- keyboard-operable theme and locale controls;
- `aria-live` result feedback where appropriate;
- status meaning is not represented by color alone;
- responsive reflow is checked at 1024, 768, 640, 390, and 320 CSS pixels;
- axe WCAG 2.2 AA smoke complements, but does not replace, keyboard and visual review.

## Public information boundary

Client catalogue assets receive only the public projection needed for search and filtering. Internal fields such as risk tier, implementation wave, access class, and unpublished definitions are blocked by source contracts and the post-build client-bundle verifier.
