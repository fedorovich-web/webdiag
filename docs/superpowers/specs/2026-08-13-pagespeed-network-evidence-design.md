# PageSpeed network evidence design

## Outcome

Publish the unique parts of `resource-waterfall-analyzer` and `render-blocking-resources-checker` without adding a privileged Chromium process to the WebDiag network. Both pages use one bounded Google PageSpeed/Lighthouse provider contract. `mobile-viewport-checker` remains internal and is superseded by the existing `html-validator`, which already checks the viewport meta signal.

## Security boundary

- WebDiag validates the requested public HTTP(S) URL before calling the provider.
- Chromium does not run inside API, worker, or web containers. This avoids introducing a browser egress path that can reach cloud metadata or private addresses after DNS rebinding.
- The Google API key remains server-side.
- Provider payloads are untrusted and parsed into strict bounded response models.
- Resource URLs are stripped of userinfo, query, and fragment before returning them to the browser.
- No response bodies, request headers, cookies, screenshots, traces, or raw Lighthouse JSON are returned.

## Contract

`POST /v1/tools/lighthouse-network` accepts one URL and one `mobile` or `desktop` strategy.

The v1 response includes:

- provider availability and stable fetch error;
- Lighthouse version and fetch time;
- an explicit `resources_available` flag, aggregate counts/bytes, and at most 40 normalized network records;
- an explicit `render_blocking_available` flag, provider score/display value/savings, and at most 20 normalized findings;
- a recommendation that distinguishes unavailable evidence from an empty result.

Parsing considers only the documented Lighthouse result envelope and the exact `network-requests` and `render-blocking-resources` audit IDs. Missing or changed audit details become unavailable. WebDiag does not infer a waterfall from static HTML and does not classify stylesheets or scripts as render-blocking by markup heuristics.

## Product wording

The resource page is a bounded Lighthouse request timeline, not a DevTools trace. The render-blocking page reports Lighthouse evidence, not a universal browser truth. Results vary by strategy, provider version, throttling, region, and run time.

## Verification

- Python unit/API tests cover bounds, redaction, malformed provider fields, missing key, and rejected private targets.
- Web contract/proxy/component tests reject oversized or unknown payloads.
- Browser tests cover RU/EN, unavailable states, inert URL text, mobile overflow, and no raw secret query values.
- Registry, web unit suite, lint, typecheck, production build, browser suite, Python suite, Ruff, and diff check run before completion.
