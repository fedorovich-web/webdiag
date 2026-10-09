# AI suite and checkout verification — 2026-10-09

This change restores the fifteen original AI contracts to the account interface and production catalog. The deployment owner chose server storage instead of S3. Existing pricing, annual products and page styling are retained.

## Implemented behavior

- Thirteen text/vision tools use the existing one-credit price. Image generation and editing retain their two-credit price.
- Image uploads and outputs live in a private persistent `ai_artifacts` volume shared by API and worker. Web serves them through authenticated owner routes; web has no artifact volume mount.
- Generation and editing use the Gateway Images API, inline edit inputs, bounded response bytes, image normalization and reserved output keys. No public provider image URL is fetched.
- Ambiguous image and text provider outcomes do not cause another paid request. Text retries are restricted to explicit HTTP 429 responses. Missing image cost is stored as SQL NULL rather than an invented zero.
- New forms submit typed evidence. Results remain visible when credits/history refresh. Freeform result text is preserved, including strings resembling enum values or object prototype properties.
- Return from Lava restores the session/product-bound invoice selector. Provider confirmation remains authoritative for payment and settlement; a return URL or cookie cannot grant credits.

## Local evidence

| Check | Result |
|---|---|
| Complete API tests | 674 passed, 3 skipped; one Starlette deprecation warning |
| Complete worker tests | 150 passed |
| Complete web unit tests | 736 passed |
| TypeScript | Passed |
| Python Ruff | Passed |
| Web ESLint | No errors; existing image-element warnings remain |
| Public web build | Passed; 236 public routes, 234 localized HTML routes; no internal definitions leaked |
| Compose regression tests | 5 passed |
| Checkout browser tests | 6 passed, including annual selection and session-bound return |
| AI browser tests | 3 passed, covering all fifteen RU/EN deep links, Schema submission/result retention and private image editing flow |

The full web test initially retained a six-card expectation; updating it to fifteen preserved the assertion that an empty backend catalog disables every paid tool. The first new browser run rejected an incomplete mocked history response; adding its required `next_cursor` field fixed the fixture without weakening runtime validation.

Read-only reviews of provider transport, storage architecture, result rendering, upload deadlines and checkout selector found no outstanding concrete P1/P2 after fixes. These are source reviews, not live provider evidence.

## Production acceptance boundary

The owner authorized at most USD 2 for one synthetic run per tool. Live outcomes and deployment must be recorded separately after execution. The local test counts above do not establish that the provider produced paid outputs in production. No Lava payment was made by the agent.

Back up both account data and the artifact volume. A named volume survives container replacement but does not protect against server or disk loss. No independent off-server backup or restore exercise is claimed here.
