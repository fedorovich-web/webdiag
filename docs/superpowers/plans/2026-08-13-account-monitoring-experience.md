# Account Monitoring Experience Plan

**Goal:** Present monitoring as scheduled persisted audit comparison, with clear configuration, current state, bounded history, and technical errors hidden behind expert disclosure.

**Contracts:** Keep the existing API. Harden the web validator to exact keys, non-negative counts, and monitor/run ownership consistency. Do not add uptime, availability, incidents, alerts, or synthetic charts.

## Task 1: Contract and presentation unit tests

- Add strict validator tests for extra fields, negative counts, and mismatched monitor/project IDs.
- Add pure RU/EN labels for cadence, monitor status, change kind, dates, and supplied deltas.
- Render delta fields only when the contract supplies them.

## Task 2: Monitoring page hierarchy

- Hero: enabled/paused and current execution state.
- Real facts: cadence, timezone, last run, next run, consecutive failures when non-zero.
- Configuration: cadence and IANA timezone, with create/save and pause/resume actions.
- Manual run: disabled while a mutation is pending or the persisted state is `running`.
- History: localized outcomes, timestamps, score/issue counts, and only supplied change deltas.
- Failed run error code: native expert disclosure, no stack trace or generated explanation.
- Mutations update the page only from validated API responses; failed mutations preserve the previous persisted state.

## Task 3: Verification

Run the new unit tests red/green, then one affected web test/lint/typecheck/build gate and the monitoring browser scenario. Inspect desktop and mobile rendering and assert no horizontal overflow.
