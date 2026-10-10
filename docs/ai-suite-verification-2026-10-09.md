# AI suite and checkout verification — 2026-10-09

This change restores the fifteen original AI contracts to the account interface and production catalog. The deployment owner chose server storage instead of S3. Existing pricing, annual products and page styling are retained.

## Implemented behavior

- Thirteen text/vision tools use the existing one-credit price. Image generation and editing retain their two-credit price.
- Image uploads and outputs live in a private persistent `ai_artifacts` volume shared by API and worker. Web serves them through authenticated owner routes; web has no artifact volume mount.
- Generation and editing use the explicitly selected Cloudflare Workers AI or Vercel Images API, inline edit inputs, bounded response bytes, image normalization and reserved output keys. No public provider image URL is fetched.
- Ambiguous image and text provider outcomes do not cause another paid request. Vercel text retries are restricted to explicit HTTP 429 responses; Cloudflare does not automatically retry any request. Missing monetary cost is stored as SQL NULL rather than an invented zero.
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


## Explicit Cloudflare image integration

The operator selected Cloudflare Workers AI and supplied credentials directly in Dokploy. Image generation and editing now support an explicit `WEBDIAG_AI_IMAGE_PROVIDER=cloudflare` policy with FLUX.2 klein 4B, while all thirteen text/vision contracts retain Vercel and their model. Reference images are resized to fit 511×511 as required by the provider; output resolution follows the existing quality and aspect-ratio selection. Image request failures never trigger an automatic retry or provider fallback. API catalog run policy and executor routing must be deployed together. Local acceptance includes multipart generation/editing, private normalized artifacts, model and credential rejection, ambiguous-outcome handling and executor-only credential placement. Live Cloudflare results will be added only after deployment and actual requests.

A pre-merge independent review found that JPEG/WebP worker output would fail the API's byte-identical normalization check after lossy recompression. Cloudflare output is now canonical PNG. Three nonuniform JPEG/WebP/PNG regressions exercise provider response, reserved storage, actual API completion and owned artifact readback; all pass. The changed normalizer and image/queue/artifact checks passed together (110 tests).

## Live Cloudflare results and text policy follow-up

PR #51 was merged as `f161b85435ff1f2f2aec94503116122c7a1b504c` and Dokploy deployed that exact commit. The actual executor selected Cloudflare images, private local artifacts and Vercel text without ZDR.

Two synthetic jobs were submitted through the signed-in production account:

| Tool | Run | Observed result |
|---|---|---|
| Image generation | `869c2edf-d332-4bc6-8d36-2d0033ea6abe` | Succeeded; authenticated preview loaded PNG 512×512, 85 KiB; available credits 310 → 308 |
| Image editing | `c104646c-6f90-42c4-86b9-63c2a89bb5be` | Succeeded; authenticated preview loaded PNG 512×512, 91 KiB; available credits 308 → 306 |

Read-only production SQLite and file readback confirmed one attempt per job, a two-credit reserve followed by capture, available balance 306 and reserved balance 0. Both artifact hashes and byte sizes match the database (86,620 and 92,240 bytes), files have mode 0600 and are available in the private volume. Provider monetary cost is SQL NULL for both jobs. Yandex client ID/secret and the AI safety identifier secret remain present in the API; no values were printed.

The text follow-up still failed. A single guarded synthetic diagnostic confirmed HTTP 403 from Vercel: the selected GPT-6 Luna model is unavailable to the free-credit tier. Its request included a safety identifier and omitted ZDR, so this is a separate model-access restriction. It was not automatically retried.

The operator then explicitly selected Cloudflare for all thirteen text/vision tools. `WEBDIAG_AI_TEXT_PROVIDER=cloudflare` records `@cf/qwen/qwen3.8-27b` on new runs and routes the executor accordingly. Existing jobs retain their original model and are not silently migrated. The independent image policy and all fifteen credit prices remain unchanged. Both policies select Cloudflare without requiring a Vercel credential; any policy that still selects Vercel must retain its credential.

One real synthetic Qwen FAQ probe returned HTTP 200, the exact expected model, a locally valid strict JSON-Schema result and a normal stop: 160 prompt tokens, 482 completion tokens and approximately 146.76 neurons. Cloudflare did not report a dollar charge. This probe does not certify the other twelve contracts or deployed vision handling.

The text adapter shares the original instructions, output schemas, token budgets, message construction and Schema.org conversion with Vercel. It bounds responses, uses `store=false`, verifies the actual model and never redirects, retries or falls back. Local checks passed: complete API/worker suite 886 passed, 3 skipped; 22 Compose/workspace checks, including actual parser preflights for all three layouts with Cloudflare credentials and no Vercel key. TypeScript and the public build passed. Review found and corrected an outdated GPT-6 Luna sentence in the catalog without changing layout.

Main CI run `37967800457` on `f161b854…` passed Python locks and homepage visual QA, with 121 browser tests passing and the existing PageSpeed color-contrast failure remaining. CI is not green. Deployment and full text/vision acceptance for the new policy remain pending until the new commit is deployed and actual requests are completed.

## CI repairs — 2026-10-10

PR [52](https://github.com/fedorovich-web/webdiag/pull/52) initially failed web lint on an unescaped apostrophe in the English privacy page. Escaping it preserves the rendered text. Targeted ESLint now reports no errors and one existing image-element warning.

Main run [37967800457](https://github.com/fedorovich-web/webdiag/actions/runs/37967800457) also exposed real insufficient text contrast in the PageSpeed result. Its failure artifact identified muted text, category scores, metric values and the savings label. The owner approved text-color-only changes. Those elements now use the existing semantic text tokens; the tinted savings label blends its warning token with 10% of the text token to meet the threshold. Dimensions, backgrounds and colored borders remain unchanged. Axe and test assertions remain enabled.

The production build passed. The two existing PageSpeed browser tests passed using the installed Brave executable, including the English axe check and the mobile RU layout check. The component unit tests passed (3/3), and its ESLint check passed. These local fixture results do not establish GitHub CI success or deployed Cloudflare text/vision acceptance.
