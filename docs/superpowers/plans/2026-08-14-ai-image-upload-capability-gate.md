# AI image upload capability gate implementation plan

1. Add failing API coverage for the internal-only catalog, a ready generation-
   only tool, and missing storage after a valid capability.
2. Add an explicit allowlist for image-input tools and enforce it in the service.
3. Gate artifact-storage resolution behind authenticated capability validation.
4. Run the affected AI/upload/injection tests, then one full Python and Ruff
   verification for the changed backend package.
