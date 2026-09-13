# Public OpenAPI boundary implementation plan

1. Add a failing real-app OpenAPI test that confirms public account paths remain
   present while `/v1/internal/` paths are absent.
2. Exclude dedicated internal routers and the mixed-router monitoring operation
   from schema generation without changing runtime routing.
3. Run affected API/auth tests, Ruff, then the full Python package gate.
