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
| Complete API + worker tests | 827 passed, 3 skipped; one Starlette deprecation warning |
| Workspace checks | 80 passed |
| Optional production AI Compose preflight | Passed with fixture credentials; no containers started |
| Complete web unit tests | 736 passed |
| TypeScript | Passed |
| Python Ruff | Passed |
| Web ESLint | No errors; existing image-element warnings remain |
| Public web build | Passed; 236 public routes, 234 localized HTML routes; no internal definitions leaked |
| Compose regression tests | 5 passed |
| Checkout browser tests | 6 passed, including annual selection and session-bound return |
| AI browser tests | 3 passed, covering all fifteen RU/EN deep links, Schema submission/result retention and private image editing flow |

The full web test initially retained a six-card expectation; updating it to fifteen preserved the assertion that an empty backend catalog disables every paid tool. The first new browser run rejected an incomplete mocked history response; adding its required `next_cursor` field fixed the fixture without weakening runtime validation.

The first PR CI run also found legacy checks forbidding artifact storage and expecting retries after ambiguous provider timeouts. Updated checks verify private volume placement and exactly one paid attempt. The operator evaluation summary preserves unknown provider cost instead of reporting zero. The account catalog displays its actual tool count rather than a fixed marketing number.

Read-only reviews of provider transport, storage architecture, result rendering, upload deadlines and checkout selector found no outstanding concrete P1/P2 after fixes. These are source reviews, not live provider evidence.

## Production acceptance boundary

PR [48](https://github.com/fedorovich-web/webdiag/pull/48) merged as `980f0d28c3a146b9d340f7aff8a46910b4a614fb`. Dokploy reported that exact commit deployed; API health was OK and web/scheduler started. The signed-in production account displayed all fifteen tools.

The owner authorized at most USD 2 for synthetic provider acceptance. Fourteen isolated worker-side cases plus one FAQ account/UI run were submitted. Every case was rejected; no validated live output was produced. Two additional synthetic diagnostic requests established the provider restrictions. The Gateway dashboard recorded 17 requests, zero tokens and USD 0 spend; its balance remained USD 5 in free credits. Private smoke receipts use an exclusive run marker and atomic updates to prevent accidental duplicate submissions.

- Authenticated `GET /v1/credits` returned HTTP 200: the deployed Gateway key is valid.
- The text request returned HTTP 403 `permission_denied`: the obligatory Zero Data Retention restriction requires Pro or Enterprise; the production team is Hobby. This shared policy blocks the text/vision path. It was not silently disabled.
- The image request returned HTTP 403 `no_providers_available`: GPT Image 2 is unavailable to the team's free-credit tier; purchased Gateway credits are required. No alternate model was substituted.
- The production FAQ run reached the real scheduler and finished `failed` with `ai_provider_failed`. A read-only account database check proved one `reserve` (-1 available, +1 reserved) and one `release` (+1 available, -1 reserved), leaving 310 available and zero reserved credits. Failure settlement works; successful output settlement remains unverified live.

The suite is implemented and deployed, but provider success is blocked by the owner's Vercel plan/credit configuration. Purchasing credits, upgrading the plan, or changing the retention policy requires the owner to choose the applicable next step. No Lava payment was made by the agent; an unpaid checkout does not certify paid settlement.

## GitHub CI readback

Main run [37928824717](https://github.com/fedorovich-web/webdiag/actions/runs/37928824717) passed Python locks/tests, production Compose policy, image builds/smokes and homepage visual QA. Full verification passed workspace/web tests, lint, types and build, then ended with 119 passed and three failed browser tests:

1. An older empty-catalog browser assertion still expected six tools. It now requires `0/15` and fifteen unavailable buttons; the disabled-catalog assertion is preserved.
2. The RU 404 visual capture timed out waiting for the browser load event. Its saved trace shows the expected HTTP 404 and a local JavaScript chunk taking 31.26 seconds; no application fix or increased timeout was introduced from this single incident. A focused rerun of the unchanged capture passed.
3. The PageSpeed result retains its existing insufficient-color-contrast failure. Existing colors and the accessibility gate are preserved under the owner's design constraint.

The focused empty-catalog and RU 404 browser checks passed together (2 tests). CI is not reported as green. New functional regressions must be addressed separately from the retained contrast issue.

Back up both account data and the artifact volume. A named volume survives container replacement but does not protect against server or disk loss. No independent off-server backup or restore exercise is claimed here.

## Operator-approved retention change

After the first live refusal, the operator explicitly authorized the Hobby configuration without mandatory ZDR. `WEBDIAG_AI_REQUIRE_ZDR=false` is a deliberate deployment setting; omitted settings retain ZDR and malformed settings fail initialization. No automatic downgrade or model fallback occurs after a provider rejection. Both localized privacy policies disclose transmitted job content and possible provider retention. Image access still requires purchased Gateway credits. Follow-up live outcomes will be recorded after deployment.
