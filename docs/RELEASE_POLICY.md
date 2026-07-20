# Release policy

`PUBLIC_RELEASE=false` is the default. In this mode robots disallow indexing and sitemap output is empty.

Setting `PUBLIC_RELEASE=true` invokes `scripts/verify-release.mjs`. The build fails unless:

- the registry contains exactly 110 unique tools;
- all 110 entries have state `ready`;
- all required application tests and checks are run by the release pipeline.

The current package is an internal development scaffold, not a public release.
