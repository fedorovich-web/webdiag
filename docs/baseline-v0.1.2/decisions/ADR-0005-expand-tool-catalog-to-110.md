# ADR-0005: Expand initial catalog to 110 tools

Status: accepted

## Context

The v0.1.1 baseline preserved an arbitrary total of 100 tools by removing QR Code Decoder when Image Cropper was added. This contradicted the product decision to keep useful tools and made the count more important than user value.

## Decision

- The initial WebDiag catalog contains 110 separate tools.
- QR Code Decoder is restored.
- Nine additional useful browser-local utilities are added.
- No previously accepted useful tool is removed merely to keep a round number.
- The catalog remains registry-driven and uses shared executor classes.

## Added tools

- QR Code Decoder;
- SVG Optimizer;
- Image Metadata Viewer;
- Image Metadata Remover;
- Responsive Image Srcset Generator;
- Image Aspect Ratio Calculator;
- Image to Data URI Converter;
- Image Placeholder Generator;
- Unix Timestamp Converter;
- ULID Generator.

## Consequences

- W1 browser-local scope grows from 46 to 56 tools.
- Product pages, sitemap, localized metadata and consistency tests must derive the total from the registry.
- Future count changes require product justification, not cosmetic number preservation.
