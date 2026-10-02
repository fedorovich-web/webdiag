# WebDiag QR Code Workbench Design

Date: 2026-08-13
Scope: publish WD-099 as one bounded browser-local QR encode/decode workflow;
keep WD-101 internal because a separate decoder would duplicate the workflow.

## Product boundary

The tool encodes one text value into a downloadable PNG and decodes one local
JPEG, PNG, WebP, or AVIF image. It does not use a camera, upload files, shorten
URLs, validate destination safety, or navigate to decoded content. Decoded text
is untrusted and is rendered only in a read-only text control.

Limits:

- input text: 1–2,000 Unicode characters and at most 2,953 UTF-8 bytes;
- generated PNG: 256, 384, or 512 CSS pixels, four-module quiet zone;
- error correction: low, medium, quartile, or high;
- decode file: one supported raster image up to 5 MiB and 25 million pixels;
- decoded output: one QR symbol from the selected image.

Capacity depends on the encoded data and correction level. The encoder remains
the source of truth and returns a bounded error when content does not fit.

## Dependency and security decision

Use `qr@0.6.0`, a typed ESM package that provides both encoding and decoding
with no transitive runtime dependencies. Registry metadata, published package
contents, integrity, license, Node engine, and README API were inspected before
installation. A production npm audit reported zero known vulnerabilities before
the dependency change; audit is repeated after installation.

The browser owns raster decoding and PNG export. QR data never enters
`innerHTML`, an executable URL, or automatic clipboard/navigation behavior.
Object URLs are revoked, Canvas dimensions are bounded before pixel reads, and
the original file MIME declaration is not trusted without the existing raster
signature validation.

## UX

One two-column workbench separates Generate and Read. The generated result shows
the QR image, selected correction level, size, byte count, download, and copyable
source text. The reader shows image dimensions, decoded text, UTF-8 byte count,
and a neutral warning to inspect content before using it. RU and EN have equal
controls and honest local-processing copy.

Mobile stacks sections, keeps 44-pixel minimum actions, and wraps long decoded
text. Dark mode uses existing project surface, line, code, and status tokens; no
new design token is introduced.

## Verification

TDD covers text/file bounds, UTF-8 byte accounting, dependency round-trip,
registry deduplication, no-upload browser behavior, inert decoded markup,
RU/EN, mobile overflow, and dark surfaces. Real generated/decoded desktop and
mobile screenshots are inspected before catalog baseline changes.
