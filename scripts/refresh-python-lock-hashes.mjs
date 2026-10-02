import { randomUUID } from "node:crypto";
import { open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parsePinSource,
  renderHashedLock,
  wheelHashesFromPyPIMetadata,
} from "./python-locks.mjs";

const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const PYPI_ORIGIN = "https://pypi.org";
const LOCK_GROUPS = [
  ["python-build.in", "python-build.lock.txt"],
  ["python-api.in", "python-api.lock.txt"],
  ["python-worker.in", "python-worker.lock.txt"],
  ["python-dev.in", "python-dev.lock.txt"],
];

function releaseLabel(entry) {
  return `${entry.normalizedName}==${entry.version}`;
}

async function readBoundedJsonResponse(response, entry, maxResponseBytes) {
  const label = releaseLabel(entry);
  if (!response || typeof response !== "object" || response.status !== 200) {
    const status = Number.isInteger(response?.status) ? response.status : "invalid";
    throw new Error(`${label}: PyPI metadata returned HTTP status ${status}`);
  }

  const contentType = response.headers?.get?.("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    throw new Error(`${label}: PyPI metadata response is not JSON`);
  }

  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new Error(`${label}: PyPI metadata has an invalid content length`);
    }
    if (parsedLength > maxResponseBytes) {
      throw new Error(`${label}: PyPI metadata exceeds the response size limit`);
    }
  }

  if (!response.body || typeof response.body.getReader !== "function") {
    throw new Error(`${label}: PyPI metadata response has no readable body`);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!(value instanceof Uint8Array)) {
      await reader.cancel();
      throw new Error(`${label}: PyPI metadata response body is invalid`);
    }
    totalBytes += value.byteLength;
    if (totalBytes > maxResponseBytes) {
      await reader.cancel();
      throw new Error(`${label}: PyPI metadata exceeds the response size limit`);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let rawText;
  try {
    rawText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${label}: PyPI metadata is not valid UTF-8`);
  }
  try {
    return JSON.parse(rawText);
  } catch {
    throw new Error(`${label}: PyPI metadata is not valid JSON`);
  }
}

async function requestReleaseMetadata({ entry, fetchMetadata, maxResponseBytes }) {
  const label = releaseLabel(entry);
  const url = new URL(
    `/pypi/${encodeURIComponent(entry.normalizedName)}/${encodeURIComponent(entry.version)}/json`,
    PYPI_ORIGIN,
  );
  let response;
  try {
    response = await fetchMetadata(url.href, {
      method: "GET",
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error(`${label}: PyPI metadata request failed`);
  }
  return readBoundedJsonResponse(response, entry, maxResponseBytes);
}

async function writeTemporaryLock(targetPath, contents) {
  const temporaryPath = `${targetPath}.tmp-${randomUUID()}`;
  let handle;
  try {
    handle = await open(temporaryPath, "wx", 0o600);
    await handle.writeFile(contents, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    return temporaryPath;
  } catch {
    if (handle) await handle.close().catch(() => {});
    await rm(temporaryPath, { force: true }).catch(() => {});
    throw new Error(`${path.basename(targetPath)}: unable to write generated lock`);
  }
}

export async function refreshPythonLocks({
  rootDir,
  fetchMetadata = fetch,
  maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
}) {
  if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes <= 0) {
    throw new Error("Python lock refresh requires a positive response size limit");
  }

  const requirementsDir = path.join(rootDir, "requirements");
  const groups = [];
  for (const [sourceName, lockName] of LOCK_GROUPS) {
    const sourcePath = path.join(requirementsDir, sourceName);
    const sourceRelative = path.posix.join("requirements", sourceName);
    let sourceText;
    try {
      sourceText = await readFile(sourcePath, "utf8");
    } catch {
      throw new Error(`${sourceRelative}: unable to read pin source`);
    }
    groups.push({
      entries: parsePinSource(sourceText, { sourceName: sourceRelative }),
      lockName,
      sourceRelative,
    });
  }

  const metadataCache = new Map();
  for (const group of groups) {
    for (const entry of group.entries) {
      const key = releaseLabel(entry);
      if (metadataCache.has(key)) continue;
      const metadata = await requestReleaseMetadata({
        entry,
        fetchMetadata,
        maxResponseBytes,
      });
      metadataCache.set(
        key,
        wheelHashesFromPyPIMetadata(metadata, {
          packageName: entry.normalizedName,
          version: entry.version,
        }),
      );
    }
  }

  const outputs = groups.map((group) => ({
    contents: renderHashedLock(
      group.entries.map((entry) => ({
        ...entry,
        hashes: metadataCache.get(releaseLabel(entry)),
      })),
      { sourceName: group.sourceRelative },
    ),
    relativePath: path.posix.join("requirements", group.lockName),
    targetPath: path.join(requirementsDir, group.lockName),
    temporaryPath: null,
  }));

  try {
    for (const output of outputs) {
      output.temporaryPath = await writeTemporaryLock(output.targetPath, output.contents);
    }
    for (const output of outputs) {
      try {
        await rename(output.temporaryPath, output.targetPath);
        output.temporaryPath = null;
      } catch {
        throw new Error(`${output.relativePath}: unable to publish generated lock`);
      }
    }
  } finally {
    await Promise.all(
      outputs
        .filter((output) => output.temporaryPath !== null)
        .map((output) => rm(output.temporaryPath, { force: true }).catch(() => {})),
    );
  }

  return { updatedFiles: outputs.map((output) => output.relativePath) };
}

async function run() {
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await refreshPythonLocks({ rootDir });
  console.log(`Updated ${result.updatedFiles.length} Python hash locks.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
