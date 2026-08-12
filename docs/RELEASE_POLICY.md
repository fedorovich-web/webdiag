# Release policy

`PUBLIC_RELEASE=false` is the default. In this mode robots disallow indexing and sitemap output is empty.

Setting `PUBLIC_RELEASE=true` invokes `scripts/verify-release.mjs`. The build fails unless:

- the registry is the source of truth for declared tools;
- every registry entry has a unique `id` and `slug` and state `ready`;
- all required application tests and checks are run by the release pipeline.

The current package is an internal development scaffold, not a public release.
