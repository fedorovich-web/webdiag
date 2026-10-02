const PACKAGE_NAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
const VERSION_PATTERN = /^(?:[0-9]+!)?[0-9]+(?:\.[0-9]+)*(?:(?:a|b|rc)[0-9]+)?(?:\.post[0-9]+)?(?:\.dev[0-9]+)?(?:\+[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)?$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ALLOWED_MARKERS = new Set([
  'sys_platform == "win32"',
  'sys_platform != "win32"',
]);

function contractError(sourceName, lineNumber, message) {
  const location = lineNumber === null ? sourceName : `${sourceName}:${lineNumber}`;
  return new Error(`${location}: ${message}`);
}

export function normalizePythonPackageName(value) {
  return value.trim().toLowerCase().replace(/[-_.]+/g, "-");
}

function parseRequirementLine(line, { sourceName, lineNumber }) {
  const markerSeparator = line.indexOf("; ");
  const pin = markerSeparator === -1 ? line : line.slice(0, markerSeparator);
  const marker = markerSeparator === -1 ? null : line.slice(markerSeparator + 2);
  const pinMatch = /^([^=]+)==(.+)$/.exec(pin);

  if (
    !pinMatch ||
    !PACKAGE_NAME_PATTERN.test(pinMatch[1]) ||
    !VERSION_PATTERN.test(pinMatch[2]) ||
    (marker !== null && !ALLOWED_MARKERS.has(marker))
  ) {
    throw contractError(sourceName, lineNumber, "expected an exact package==version pin");
  }

  const name = pinMatch[1];
  const version = pinMatch[2];
  const normalizedName = normalizePythonPackageName(name);
  return {
    name,
    normalizedName,
    version,
    marker,
    requirement: `${name}==${version}${marker === null ? "" : `; ${marker}`}`,
  };
}

function rejectDuplicate(entries, entry, { sourceName, lineNumber }) {
  if (entries.some((candidate) => candidate.normalizedName === entry.normalizedName)) {
    throw contractError(
      sourceName,
      lineNumber,
      `duplicate normalized package ${entry.normalizedName}`,
    );
  }
}

export function parsePinSource(rawText, { sourceName = "requirements" } = {}) {
  const entries = [];

  for (const [index, rawLine] of rawText.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const entry = parseRequirementLine(line, { sourceName, lineNumber: index + 1 });
    rejectDuplicate(entries, entry, { sourceName, lineNumber: index + 1 });
    entries.push(entry);
  }

  return entries;
}

function validateHashes(hashes, { sourceName, lineNumber }) {
  if (hashes.length === 0) {
    throw contractError(sourceName, lineNumber, "requirement has no SHA-256 wheel hash");
  }
  if (hashes.some((hash) => !SHA256_PATTERN.test(hash))) {
    throw contractError(sourceName, lineNumber, "requirement has an invalid SHA-256 hash");
  }
  const sorted = [...hashes].sort();
  if (new Set(hashes).size !== hashes.length) {
    throw contractError(sourceName, lineNumber, "requirement has duplicate SHA-256 hashes");
  }
  if (hashes.some((hash, index) => hash !== sorted[index])) {
    throw contractError(sourceName, lineNumber, "requirement SHA-256 hashes are not sorted");
  }
}

export function parseHashedLock(rawText, { sourceName = "requirements.lock.txt" } = {}) {
  const entries = [];
  let pending = null;

  for (const [index, rawLine] of rawText.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      if (pending) {
        throw contractError(sourceName, lineNumber, "unterminated hashed requirement");
      }
      continue;
    }

    if (!pending) {
      if (!rawLine.endsWith(" \\")) {
        throw contractError(sourceName, lineNumber, "requirement must continue to SHA-256 hashes");
      }
      const requirement = rawLine.slice(0, -2).trim();
      const entry = parseRequirementLine(requirement, { sourceName, lineNumber });
      rejectDuplicate(entries, entry, { sourceName, lineNumber });
      pending = { ...entry, hashes: [], lineNumber };
      continue;
    }

    const hashMatch = /^ {4}--hash=sha256:([0-9a-f]{64})( \\)?$/.exec(rawLine);
    if (!hashMatch) {
      throw contractError(sourceName, lineNumber, "expected a SHA-256 hash continuation");
    }
    pending.hashes.push(hashMatch[1]);
    if (!hashMatch[2]) {
      validateHashes(pending.hashes, {
        sourceName,
        lineNumber: pending.lineNumber,
      });
      const { lineNumber: _lineNumber, ...entry } = pending;
      entries.push(entry);
      pending = null;
    }
  }

  if (pending) {
    throw contractError(sourceName, pending.lineNumber, "unterminated hashed requirement");
  }
  return entries;
}

export function wheelHashesFromPyPIMetadata(
  metadata,
  { packageName, version },
) {
  const release = `${packageName}==${version}`;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error(`${release}: PyPI metadata must be an object`);
  }
  if (
    !metadata.info ||
    typeof metadata.info !== "object" ||
    normalizePythonPackageName(String(metadata.info.name ?? "")) !==
      normalizePythonPackageName(packageName) ||
    metadata.info.version !== version
  ) {
    throw new Error(`${release}: PyPI metadata identity mismatch`);
  }
  if (!Array.isArray(metadata.urls)) {
    throw new Error(`${release}: PyPI metadata urls must be an array`);
  }

  const hashes = new Set();
  for (const file of metadata.urls) {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      throw new Error(`${release}: PyPI release file metadata is invalid`);
    }
    if (typeof file.packagetype !== "string" || typeof file.yanked !== "boolean") {
      throw new Error(`${release}: PyPI release file fields are invalid`);
    }
    if (file.packagetype !== "bdist_wheel" || file.yanked) continue;
    const digest = file.digests?.sha256;
    if (typeof digest !== "string" || !SHA256_PATTERN.test(digest)) {
      throw new Error(`${release}: non-yanked wheel has an invalid SHA-256 digest`);
    }
    hashes.add(digest);
  }

  if (hashes.size === 0) {
    throw new Error(`${release}: release has no non-yanked wheels`);
  }
  return [...hashes].sort();
}

export function renderHashedLock(entries, { sourceName }) {
  const sortedEntries = [...entries].sort((left, right) =>
    left.normalizedName.localeCompare(right.normalizedName, "en"),
  );
  const seen = new Set();
  const lines = [
    "# Generated by npm run python:lock:refresh.",
    `# Source: ${sourceName}`,
    "# Do not edit this file directly.",
    "",
  ];

  for (const entry of sortedEntries) {
    const normalizedName = normalizePythonPackageName(entry.name);
    if (normalizedName !== entry.normalizedName || seen.has(normalizedName)) {
      throw new Error(`${sourceName}: duplicate or invalid normalized package ${normalizedName}`);
    }
    seen.add(normalizedName);
    if (!VERSION_PATTERN.test(entry.version) || !PACKAGE_NAME_PATTERN.test(entry.name)) {
      throw new Error(`${sourceName}: invalid exact pin for ${normalizedName}`);
    }
    if (entry.marker !== null && !ALLOWED_MARKERS.has(entry.marker)) {
      throw new Error(`${sourceName}: invalid marker for ${normalizedName}`);
    }
    const hashes = [...entry.hashes].sort();
    validateHashes(hashes, { sourceName, lineNumber: null });
    const requirement = `${entry.name}==${entry.version}${
      entry.marker === null ? "" : `; ${entry.marker}`
    }`;
    lines.push(`${requirement} \\`);
    for (const [index, hash] of hashes.entries()) {
      const continuation = index === hashes.length - 1 ? "" : " \\";
      lines.push(`    --hash=sha256:${hash}${continuation}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
