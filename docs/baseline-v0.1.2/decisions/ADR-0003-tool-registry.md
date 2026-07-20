# ADR-0003: Registry-driven 100-tool platform

Status: accepted

## Decision

100 tools are 100 versioned `ToolDefinition` entries and 100 public URLs, but only six executor classes.

## Consequences

- shared security;
- shared limits;
- automatic sitemap/catalog/counts;
- lower implementation duplication;
- consistency tests become mandatory.

A tool may have custom UI and result renderer, but cannot bypass execution policy.
