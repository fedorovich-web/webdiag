# Release Registry Supersession Design

## Problem

The 125-entry historical registry contains both active tools and legacy definitions whose
scope was deliberately consolidated into stronger aggregate workbenches. The existing
public release gate treats every internal definition as unimplemented. This makes duplicate
microtools indistinguishable from real crawler and Chromium capability gaps.

## Contract

- `ready` means the definition has its own public implementation and route.
- `internal` without `supersededBy` remains a release blocker.
- `internal` with `supersededBy` is a legacy definition whose complete useful scope exists
  in the named aggregate ready tool.
- `supersededBy` must reference another existing `ready` slug. Ready definitions cannot
  declare it, and chains or self-references are invalid.
- Superseded definitions remain absent from the public catalog, routes, metadata, and API
  ready-tool projection.

## Initial Verified Mappings

- `csv-validator` -> `csv-json-converter`
- `cron-parser` -> `cron-expression-workbench`
- `url-parser` -> `url-normalization-analyzer`
- `qr-code-decoder` -> `qr-code-generator`
- `image-metadata-remover` -> `image-metadata-viewer`
- `image-placeholder-generator` -> `image-data-uri-converter`

The nine remaining internal crawler and Chromium definitions continue to block public
release.
