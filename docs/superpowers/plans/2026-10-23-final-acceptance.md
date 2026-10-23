# WebDiag final acceptance

**Goal:** finish the authorized audit, monitoring, tool and code-quality work and verify the delivered commit against the original user requirements.

**Architecture:** preserve the existing Next.js/FastAPI/SQLite applications, deployment and approved visual design. Make focused fixes to reproduced defects and retain dirty historical worktrees as provenance.

**Constraints:** no paid GitHub overage, paid provider requests, payment creation, secret exposure, test exclusions, weakened security checks or speculative feature additions.

- [x] Inspect current Git state, requirements and preserved backend differences.
- [x] Reproduce malformed sitemap and bounded issue-count defects; preserve complete counts with bounded display samples.
- [x] Reproduce invalid generator inputs and copied JSON-LD script escape; correct validation and move examples to placeholders.
- [x] Reproduce corrupt AI output and ambiguous saved-audit JSON; verify digests and reject ambiguous/nonfinite JSON.
- [x] Reproduce malformed internal worker responses and silently clamped timeout configuration; enforce explicit contracts before network requests.
- [x] Check every ordinary public tool page in both languages at mobile width; repair confirmed failures without changing the approved design.
- [x] Run final registry/release, dead-code, JavaScript, Python, lint, type, build and browser gates on the combined tree.
- [ ] Review the combined diff, merge and push; verify the exact deployed commit, health and production user flows.

Final acceptance records must distinguish controlled provider fixtures, actual production checks, GitHub quota restrictions and dependency advisories without an upstream fix.

