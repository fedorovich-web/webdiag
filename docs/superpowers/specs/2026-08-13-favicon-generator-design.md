# WebDiag favicon generator design

## Goal

Promote `WD-098 favicon-generator` only after it has a real browser-local
implementation, bilingual product content, renderer coverage, and bounded file
handling. The tool complements the existing favicon checker; it does not claim
to install or validate icons on a website.

## Product contract

The generator accepts one JPEG, PNG, WebP, or AVIF file up to the same 25 MiB
and 40 megapixel limits used by the other raster utilities. It decodes the file
with `createImageBitmap`, applies image orientation, and takes a centered square
crop before rendering these PNG assets:

- `favicon-32x32.png`;
- `favicon-48x48.png`;
- `apple-touch-icon.png` at 180 by 180;
- `web-app-icon-192.png`;
- `web-app-icon-512.png`.

Each asset is downloadable separately. The result also contains copyable HTML
and manifest fragments that refer only to those exact filenames. No archive is
created, no file leaves the browser, and no browser storage is used.

## Honest boundaries

- The tool does not encode `.ico` files.
- SVG input and adaptive or maskable padding are not supported.
- The source is center-cropped; users must prepare non-square composition before
  upload when a different crop is required.
- Generated files are assets, not proof that a deployed site references them.
- Browser decoder and Canvas PNG support determine whether a selected file can
  be processed.

## Safety and resource controls

- Reuse the raster MIME allowlist and size/pixel caps already enforced by image
  utilities.
- Validate every generated dimension against the existing core dimension gate.
- Keep decoded image data and object URLs in component memory only.
- Revoke every generated object URL on replacement and unmount.
- Never inject the generated snippets as HTML; render them as text and copy
  through the existing copy control.

## UX

The input panel explains the centered square crop before processing. The result
panel shows the generated sizes in a compact grid with a preview and download
action per asset, followed by separate HTML and manifest code blocks. Empty and
error states remain explicit in both Russian and English.

## Verification

Add pure RED tests for the crop plan, fixed asset descriptors, snippets, and
registry/renderer/content publication. Then implement the component and run the
affected tool, registry, content, typecheck, build, and browser tests. Visual QA
must cover desktop and narrow mobile using a controlled generated fixture.
