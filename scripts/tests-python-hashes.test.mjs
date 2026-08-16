import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePythonPackageName,
  parseHashedLock,
  parsePinSource,
  renderHashedLock,
  wheelHashesFromPyPIMetadata,
} from "./python-locks.mjs";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

function releaseMetadata({ name = "Example_Package", version = "1.2.3", urls } = {}) {
  return {
    info: { name, version },
    urls:
      urls ??
      [
        {
          filename: "example_package-1.2.3-py3-none-any.whl",
          packagetype: "bdist_wheel",
          yanked: false,
          digests: { sha256: HASH_A },
        },
      ],
  };
}

test("normalizes Python distribution names with PEP 503 separators", () => {
  assert.equal(normalizePythonPackageName(" Pydantic_Settings...Extra "), "pydantic-settings-extra");
});

test("parses exact pins and the two repository platform markers", () => {
  const entries = parsePinSource(
    [
      "# reviewed pins",
      "colorama==0.4.6; sys_platform == \"win32\"",
      "uvloop==0.22.1; sys_platform != \"win32\"",
      "websockets==16.1.1",
      "",
    ].join("\n"),
    { sourceName: "requirements/python-dev.in" },
  );

  assert.deepEqual(entries, [
    {
      name: "colorama",
      normalizedName: "colorama",
      version: "0.4.6",
      marker: 'sys_platform == "win32"',
      requirement: 'colorama==0.4.6; sys_platform == "win32"',
    },
    {
      name: "uvloop",
      normalizedName: "uvloop",
      version: "0.22.1",
      marker: 'sys_platform != "win32"',
      requirement: 'uvloop==0.22.1; sys_platform != "win32"',
    },
    {
      name: "websockets",
      normalizedName: "websockets",
      version: "16.1.1",
      marker: null,
      requirement: "websockets==16.1.1",
    },
  ]);
});

test("rejects unsafe or non-exact source requirement forms", () => {
  const invalidRows = [
    "uvicorn[standard]==0.51.0",
    "pkg @ https://example.test/pkg.whl",
    "./local-package",
    "-e ./apps/api",
    "--index-url https://example.test/simple",
    "fastapi>=0.139.1",
    "fastapi==0.139.*",
    "fastapi==0.139.1 --hash=sha256:" + HASH_A,
    'uvloop==0.22.1; python_version >= "3.13"',
    'uvloop==0.22.1; sys_platform != "win32" and python_version >= "3.13"',
  ];

  for (const row of invalidRows) {
    assert.throws(
      () => parsePinSource(`${row}\n`, { sourceName: "requirements/test.in" }),
      /requirements\/test\.in:1/,
      row,
    );
  }
});

test("rejects duplicate normalized source package names", () => {
  assert.throws(
    () =>
      parsePinSource("pydantic_core==2.46.4\nPydantic.Core==2.46.4\n", {
        sourceName: "requirements/test.in",
      }),
    /duplicate normalized package pydantic-core/,
  );
});

test("parses a generated lock with sorted unique SHA-256 hashes", () => {
  const entries = parseHashedLock(
    [
      "# generated",
      "example-package==1.2.3 \\",
      `    --hash=sha256:${HASH_A} \\`,
      `    --hash=sha256:${HASH_B}`,
      "",
    ].join("\n"),
    { sourceName: "requirements/python-dev.lock.txt" },
  );

  assert.deepEqual(entries, [
    {
      name: "example-package",
      normalizedName: "example-package",
      version: "1.2.3",
      marker: null,
      requirement: "example-package==1.2.3",
      hashes: [HASH_A, HASH_B],
    },
  ]);
});

test("rejects missing, duplicate, unsorted, and malformed lock hashes", () => {
  const invalidLocks = [
    "example-package==1.2.3\n",
    `example-package==1.2.3 \\\n    --hash=sha256:${HASH_A} \\\n    --hash=sha256:${HASH_A}\n`,
    `example-package==1.2.3 \\\n    --hash=sha256:${HASH_B} \\\n    --hash=sha256:${HASH_A}\n`,
    "example-package==1.2.3 \\\n    --hash=sha256:not-a-digest\n",
  ];

  for (const source of invalidLocks) {
    assert.throws(
      () => parseHashedLock(source, { sourceName: "requirements/test.lock.txt" }),
      /requirements\/test\.lock\.txt/,
    );
  }
});

test("keeps only sorted non-yanked wheel hashes from matching PyPI metadata", () => {
  const hashes = wheelHashesFromPyPIMetadata(
    releaseMetadata({
      urls: [
        {
          filename: "example_package-1.2.3.tar.gz",
          packagetype: "sdist",
          yanked: false,
          digests: { sha256: "c".repeat(64) },
        },
        {
          filename: "example_package-1.2.3-py3-none-any.whl",
          packagetype: "bdist_wheel",
          yanked: false,
          digests: { sha256: HASH_B },
        },
        {
          filename: "example_package-1.2.3-py2-none-any.whl",
          packagetype: "bdist_wheel",
          yanked: true,
          digests: { sha256: "d".repeat(64) },
        },
        {
          filename: "example_package-1.2.3-py3-none-win.whl",
          packagetype: "bdist_wheel",
          yanked: false,
          digests: { sha256: HASH_A },
        },
      ],
    }),
    { packageName: "example-package", version: "1.2.3" },
  );

  assert.deepEqual(hashes, [HASH_A, HASH_B]);
});

test("rejects mismatched or invalid PyPI release metadata", () => {
  const invalid = [
    releaseMetadata({ name: "other-package" }),
    releaseMetadata({ version: "1.2.4" }),
    releaseMetadata({ urls: [] }),
    releaseMetadata({
      urls: [
        {
          filename: "example.whl",
          packagetype: "bdist_wheel",
          yanked: false,
          digests: { sha256: "INVALID" },
        },
      ],
    }),
  ];

  for (const metadata of invalid) {
    assert.throws(
      () =>
        wheelHashesFromPyPIMetadata(metadata, {
          packageName: "example-package",
          version: "1.2.3",
        }),
      /example-package==1\.2\.3/,
    );
  }
});

test("renders deterministic LF-only locks from shuffled entries and hashes", () => {
  const entries = [
    {
      name: "WebSockets",
      normalizedName: "websockets",
      version: "16.1.1",
      marker: null,
      requirement: "WebSockets==16.1.1",
      hashes: [HASH_B, HASH_A],
    },
    {
      name: "colorama",
      normalizedName: "colorama",
      version: "0.4.6",
      marker: 'sys_platform == "win32"',
      requirement: 'colorama==0.4.6; sys_platform == "win32"',
      hashes: [HASH_A],
    },
  ];

  assert.equal(
    renderHashedLock(entries, { sourceName: "requirements/python-dev.in" }),
    [
      "# Generated by npm run python:lock:refresh.",
      "# Source: requirements/python-dev.in",
      "# Do not edit this file directly.",
      "",
      'colorama==0.4.6; sys_platform == "win32" ' + "\\",
      `    --hash=sha256:${HASH_A}`,
      "WebSockets==16.1.1 " + "\\",
      `    --hash=sha256:${HASH_A} \\`,
      `    --hash=sha256:${HASH_B}`,
      "",
    ].join("\n"),
  );
});
