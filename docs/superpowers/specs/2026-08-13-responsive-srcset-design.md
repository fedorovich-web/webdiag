# Responsive srcset generator design

## Goal

Promote `WD-105 responsive-image-srcset-generator` as a browser-only text
workbench for assets that already exist. It must not imply that WebDiag creates,
uploads, probes, or validates image files.

## Contract

The input accepts 1–20 lines in exact `URL | width` form. URLs must be HTTPS or
root-relative paths without credentials, fragments, control characters, or
backslashes. Width descriptors are unique integers from 1 through 8192. Output
is sorted by width and contains:

- a plain `srcset` value;
- an escaped `<img>` fragment using an explicit fallback `src`, `sizes`, and alt;
- deterministic warnings when alt is empty or `sizes` is empty.

The parser caps the candidate input, fallback URL, `sizes`, and alt lengths. It
HTML-escapes every attribute and renders output as text. It performs no network
request, browser storage, HTML execution, image processing, or dependency call.

## Honest boundaries

- Candidate files must already exist at the entered URLs.
- Width descriptors describe intrinsic resource widths supplied by the user;
  WebDiag does not inspect or verify them.
- `sizes` is emitted as entered after bounds/control-character validation; the
  current tool does not implement the full media-condition grammar.
- Art direction, `<picture>`, MIME negotiation, DPR descriptors, CDN URL
  generation, and file transformation are outside this version.

## Verification

Use TDD for parsing, sorting, duplicates, URL policy, bounds, and attribute
escaping. Add renderer/editorial/registry parity checks and a real RU/EN browser
flow including malicious attribute text and mobile overflow.
