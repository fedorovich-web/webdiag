# WebDiag Cross-Platform Python Hash Locks Design

## Decision

Replace the current version-only Python constraint with four wheel-only,
SHA-256-pinned dependency sets covering local development, CI, API production,
worker production, and local project builds. Third-party packages install in
pip hash-checking mode from the fixed public PyPI index. WebDiag packages are
built from the checked-out source with preinstalled hashed build dependencies
and with dependency resolution disabled.

This is dependency-integrity hardening, not a dependency upgrade. Existing
application dependency versions remain unchanged unless a clean installation
proves that the current pin set is internally inconsistent. Any required pin
correction must be isolated, explained, audited, and tested rather than folded
silently into hash generation.

## Scope

The implementation creates these source pin sets and generated locks:

- `requirements/python-build.in` and `requirements/python-build.lock.txt` for
  Hatchling and its build-time closure;
- `requirements/python-api.in` and `requirements/python-api.lock.txt` for the
  API runtime closure;
- `requirements/python-worker.in` and
  `requirements/python-worker.lock.txt` for the worker runtime closure,
  including the existing `rabbitmq` extra and `pika==1.4.1`;
- `requirements/python-dev.in` and `requirements/python-dev.lock.txt` for the
  union required by API/worker tests, Ruff, editable builds, and both supported
  Python versions.

The version-only root `requirements-dev.lock.txt` is removed after every
consumer uses the new locks. Python 3.13 and 3.14 remain supported. Windows and
Linux remain required. Platform markers are explicit; packages unavailable on
a platform are not hidden through verifier exceptions.

## Threat Model and Trust Boundary

Hash-checking prevents pip from accepting bytes that differ from a committed
wheel hash. It does not prove publisher identity, package safety, or absence of
malicious code in an approved wheel. Package selection, vulnerability review,
and code provenance remain separate gates.

Installation must not inherit ambient pip indexes, extra indexes, trusted
hosts, constraints, requirement files, or find-links settings. Commands use
pip isolated mode and an explicit `https://pypi.org/simple` index. All
third-party requirements use exact `==` pins and at least one lowercase
SHA-256. VCS, URL, editable, local-path, unhashed, yanked, and source archive
requirements are rejected. Only non-yanked wheel hashes are committed.

The hash refresher talks only to fixed HTTPS PyPI JSON endpoints derived from a
validated normalized package name and exact version. Responses are bounded and
strictly validated. It never reads credentials, project environment values, or
alternate registry configuration. Hash refresh is an explicit maintainer
operation and never runs automatically in CI.

## Lock Source and Generation Contract

Each `.in` file contains a sorted exact package set using only this grammar:

```text
package-name==1.2.3
package-name==1.2.3; python_version >= "3.13" and sys_platform != "win32"
```

Comments and blank lines are allowed. Extras, URLs, local paths, arbitrary pip
options, duplicate normalized names, unconstrained versions, and unknown marker
forms fail closed.

`scripts/refresh-python-lock-hashes.mjs` parses all four source files, requests
the exact PyPI release metadata, selects non-yanked `bdist_wheel` files only,
requires a valid SHA-256 for every selected file, sorts hashes, and atomically
rewrites sibling `.lock.txt` files. Generated locks begin with explanatory
comments and repeat every source requirement with one or more
`--hash=sha256:<digest>` continuations. A release with no wheel is an error; the
script never falls back to an sdist.

`scripts/verify-python-lock.mjs` remains an offline release gate. It validates
the input grammar, generated lock grammar, exact input/lock package parity,
markers, sorted unique hashes, supported group relationships, installed package
versions, and absence of unexpected installed packages. It also checks that
the exact direct dependencies declared by both `pyproject.toml` files occur in
the appropriate source sets. It does not claim that committed hashes still
match mutable remote metadata; pip verifies selected bytes during installation.

## Installation Flows

### Local development and Windows CI

`npm run python:install` performs two explicit steps:

1. install `requirements/python-dev.lock.txt` with pip isolated mode,
   `--require-hashes`, `--only-binary=:all:`, and the fixed PyPI index;
2. install `./apps/api[dev]` and `./apps/worker[dev,rabbitmq]` editable with
   `--no-deps --no-build-isolation`.

The dev lock includes the exact Hatchling closure, so the second step performs
no hidden build-environment download. The CI workflow removes the unpinned
`pip install --upgrade pip` network step and uses the pip bundled with the
selected Python runtime.

### Production images

Both Python Dockerfiles become multi-stage builds.

The builder stage installs only the hashed build lock, copies one local Python
package, and creates its wheel using `pip wheel --no-deps
--no-build-isolation`. The final stage installs the matching hashed runtime lock
in isolated, require-hashes, wheel-only mode and then installs the locally built
WebDiag wheel with `--no-deps`. No source tree, compiler cache, build backend,
pytest, or Ruff remains in the final image.

The API image uses the API runtime lock. The worker image uses the worker
runtime lock and therefore retains the existing RabbitMQ capability. Docker
base-image digest pinning is a separate container-provenance gate and is not
claimed by this change.

## CI and Verification

The existing Windows `Full verification` job proves a clean dev-lock install
before the full repository gate. A separate Ubuntu Python lock job uses the
same immutable checkout/setup actions to:

1. create a Python 3.14 virtual environment;
2. execute the hashed dev installation;
3. run offline lock verification, Python tests, and Ruff;
4. build both production Docker images;
5. run bounded import/entrypoint smoke checks without starting services or
   contacting RabbitMQ, S3, OpenRouter, or public URLs.

Local targeted tests cover parsers, markers, duplicate pins, missing hashes,
sdist/URL rejection, package-group mismatches, bounded PyPI metadata parsing,
deterministic rendering, and atomic output publication. Network behavior in
unit tests uses fixtures; only the explicit refresh command accesses PyPI.

Before push, one clean temporary-environment install must prove Windows lock
compatibility, followed by the affected Node tests, Python tests, Ruff,
`pip check`, offline lock verification, and `git diff --check`. GitHub must pass
both the existing full job and the new Linux lock/Docker job on the pushed SHA.

## Error Handling and Operational Rules

Generator and verifier errors name only the lock file, package name, version,
and violated contract. They never include environment values, credentials,
index tokens, or response bodies. No lock changes until metadata for every
package and every group has passed validation. Each generated lock is written
to a private temporary sibling and published by one atomic file replacement.
An operating-system failure between replacements can leave a mixed lock set;
the offline parity verifier must reject that state before installation or
commit.

Dependency refreshes remain intentional review events. A changed version,
package set, marker, or hash produces an ordinary Git diff and requires the
existing npm/Python vulnerability audits before commit. CI never refreshes
hashes, repairs locks, accepts sdists, or updates a visual baseline.

## Non-Goals

- no Python application API, database schema, product capability, AI state,
  credit price, or UI change;
- no dependency version upgrade solely because a newer release exists;
- no private package index, vendored wheelhouse, package signing claim, SBOM,
  Docker base-image digest pin, release, deployment, or production probe;
- no claim that hash-checking replaces vulnerability review or provider/runtime
  certification.
