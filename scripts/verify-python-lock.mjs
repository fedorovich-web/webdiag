import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizePythonPackageName,
  parseHashedLock,
  parsePinSource,
} from "./python-locks.mjs";
import { requireVenvPython } from "./python-runtime.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GROUP_NAMES = ["build", "api", "worker", "dev"];

function entriesByName(entries) {
  return new Map(entries.map((entry) => [entry.normalizedName, entry]));
}

export function parseFrozenRequirements(rawText, { sourceName = "pip freeze" } = {}) {
  const installed = new Map();
  for (const [index, rawLine] of rawText.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    let entries;
    try {
      entries = parsePinSource(line, { sourceName: `${sourceName}:${index + 1}` });
    } catch {
      throw new Error(`${sourceName}:${index + 1}: expected an exact installed package pin`);
    }
    if (entries.length !== 1 || entries[0].marker !== null) {
      throw new Error(`${sourceName}:${index + 1}: expected an exact installed package pin`);
    }
    const entry = entries[0];
    if (installed.has(entry.normalizedName)) {
      throw new Error(`duplicate installed package ${entry.normalizedName}`);
    }
    installed.set(entry.normalizedName, entry);
  }
  return installed;
}

export function selectRequirementsForPlatform(entries, platform = process.platform) {
  const selected = new Map();
  for (const entry of entries) {
    const include =
      entry.marker === null ||
      (entry.marker === 'sys_platform == "win32"' && platform === "win32") ||
      (entry.marker === 'sys_platform != "win32"' && platform !== "win32");
    if (include) selected.set(entry.normalizedName, entry);
  }
  return selected;
}

export function compareInstalledRequirements({
  devEntries,
  installedText,
  platform = process.platform,
}) {
  const expected = selectRequirementsForPlatform(devEntries, platform);
  const installed = parseFrozenRequirements(installedText);
  const errors = [];

  for (const [name, expectedEntry] of expected.entries()) {
    const actual = installed.get(name);
    if (!actual) {
      errors.push(`missing installed package: ${expectedEntry.name}==${expectedEntry.version}`);
    } else if (actual.version !== expectedEntry.version) {
      errors.push(
        `version drift: ${expectedEntry.name} expected ${expectedEntry.version}, installed ${actual.version}`,
      );
    }
  }
  for (const [name, actual] of installed.entries()) {
    if (!expected.has(name)) {
      errors.push(`unlocked installed package: ${actual.name}==${actual.version}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    expectedCount: expected.size,
    installedCount: installed.size,
  };
}

function sectionBody(rawText, sectionName, sourceName) {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionMatch = new RegExp(`^\\[${escaped}\\]\\s*$`, "m").exec(rawText);
  if (!sectionMatch) throw new Error(`${sourceName}: missing [${sectionName}] section`);
  const remainder = rawText.slice(sectionMatch.index + sectionMatch[0].length);
  const nextSection = /^\[/m.exec(remainder);
  return nextSection ? remainder.slice(0, nextSection.index) : remainder;
}

function stringArrayFromSection(rawText, sectionName, key, sourceName) {
  const section = sectionBody(rawText, sectionName, sourceName);
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const arrayStart = new RegExp(`^${escapedKey}\\s*=\\s*\\[`, "m").exec(section);
  if (!arrayStart) {
    throw new Error(`${sourceName}: missing ${sectionName}.${key} string array`);
  }
  const contentStart = arrayStart.index + arrayStart[0].length;
  let contentEnd = -1;
  let depth = 1;
  let inString = false;
  let escaped = false;
  for (let index = contentStart; index < section.length; index += 1) {
    const character = section[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        contentEnd = index;
        break;
      }
    }
  }
  if (contentEnd === -1 || inString) {
    throw new Error(`${sourceName}: unterminated ${sectionName}.${key} string array`);
  }
  const arrayContents = section.slice(contentStart, contentEnd);
  const values = [...arrayContents.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map(
    (match) => match[1],
  );
  const remainder = arrayContents.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, "");
  if (values.length === 0 || !/^[\s,]*$/.test(remainder)) {
    throw new Error(`${sourceName}: invalid ${sectionName}.${key} string array`);
  }
  return values;
}

function parseProjectRequirement(rawRequirement, sourceName) {
  const match = /^([A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?)(?:\[[A-Za-z0-9_,.-]+\])?==(.+)$/.exec(
    rawRequirement,
  );
  if (!match) throw new Error(`${sourceName}: non-exact project requirement ${rawRequirement}`);
  return {
    name: match[1],
    normalizedName: normalizePythonPackageName(match[1]),
    version: match[2],
    requirement: rawRequirement,
  };
}

function validateProjectRequirements({
  rawText,
  sourceName,
  baseGroup,
  parsedGroups,
  optionalGroups,
  errors,
}) {
  const checks = [
    {
      requirements: stringArrayFromSection(rawText, "build-system", "requires", sourceName),
      groups: ["build", "dev"],
    },
    {
      requirements: stringArrayFromSection(rawText, "project", "dependencies", sourceName),
      groups: [baseGroup, "dev"],
    },
  ];
  for (const [extra, targetGroups] of Object.entries(optionalGroups)) {
    checks.push({
      requirements: stringArrayFromSection(
        rawText,
        "project.optional-dependencies",
        extra,
        sourceName,
      ),
      groups: targetGroups,
    });
  }

  for (const check of checks) {
    for (const rawRequirement of check.requirements) {
      const requirement = parseProjectRequirement(rawRequirement, sourceName);
      for (const groupName of check.groups) {
        const sourceEntry = entriesByName(parsedGroups[groupName].sourceEntries).get(
          requirement.normalizedName,
        );
        if (!sourceEntry || sourceEntry.version !== requirement.version) {
          errors.push(
            `${sourceName}: ${rawRequirement} missing at the exact version from python-${groupName}.in`,
          );
        }
      }
    }
  }
}

function compareSourceAndLock(group, errors) {
  const sourceByName = entriesByName(group.sourceEntries);
  const lockByName = entriesByName(group.lockEntries);
  for (const [name, sourceEntry] of sourceByName.entries()) {
    const lockEntry = lockByName.get(name);
    if (!lockEntry) {
      errors.push(`${group.lockName}: ${name} missing from generated lock`);
    } else if (lockEntry.version !== sourceEntry.version) {
      errors.push(`${group.lockName}: ${name} source/lock version mismatch`);
    } else if (lockEntry.marker !== sourceEntry.marker) {
      errors.push(`${group.lockName}: ${name} source/lock marker mismatch`);
    }
  }
  for (const name of lockByName.keys()) {
    if (!sourceByName.has(name)) errors.push(`${group.lockName}: unlocked source package ${name}`);
  }
}

function compareSubgroupWithDev(groupName, parsedGroups, errors) {
  const subgroup = parsedGroups[groupName];
  const dev = parsedGroups.dev;
  const devSourceByName = entriesByName(dev.sourceEntries);
  const devLockByName = entriesByName(dev.lockEntries);
  for (const sourceEntry of subgroup.sourceEntries) {
    const devEntry = devSourceByName.get(sourceEntry.normalizedName);
    if (
      !devEntry ||
      devEntry.version !== sourceEntry.version ||
      devEntry.marker !== sourceEntry.marker
    ) {
      errors.push(
        `${subgroup.sourceName}: ${sourceEntry.normalizedName} is not an exact subset of python-dev.in`,
      );
      continue;
    }
    const lockEntry = entriesByName(subgroup.lockEntries).get(sourceEntry.normalizedName);
    const devLockEntry = devLockByName.get(sourceEntry.normalizedName);
    if (
      lockEntry &&
      devLockEntry &&
      JSON.stringify(lockEntry.hashes) !== JSON.stringify(devLockEntry.hashes)
    ) {
      errors.push(
        `${subgroup.lockName}: ${sourceEntry.normalizedName} wheel hashes differ from python-dev.lock.txt`,
      );
    }
  }
}

export function validatePythonLockSet({ groups, apiProjectText, workerProjectText }) {
  const errors = [];
  const parsedGroups = {};
  for (const groupName of GROUP_NAMES) {
    const group = groups[groupName];
    if (!group) {
      errors.push(`requirements/python-${groupName}.in: lock group is missing`);
      continue;
    }
    try {
      parsedGroups[groupName] = {
        ...group,
        sourceEntries: parsePinSource(group.sourceText, { sourceName: group.sourceName }),
        lockEntries: parseHashedLock(group.lockText, { sourceName: group.lockName }),
      };
      compareSourceAndLock(parsedGroups[groupName], errors);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (GROUP_NAMES.every((groupName) => parsedGroups[groupName])) {
    for (const groupName of ["build", "api", "worker"]) {
      compareSubgroupWithDev(groupName, parsedGroups, errors);
    }
    try {
      validateProjectRequirements({
        rawText: apiProjectText,
        sourceName: "apps/api/pyproject.toml",
        baseGroup: "api",
        parsedGroups,
        optionalGroups: { dev: ["dev"] },
        errors,
      });
      validateProjectRequirements({
        rawText: workerProjectText,
        sourceName: "apps/worker/pyproject.toml",
        baseGroup: "worker",
        parsedGroups,
        optionalGroups: { dev: ["dev"], rabbitmq: ["worker", "dev"] },
        errors,
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    groupCounts: Object.fromEntries(
      GROUP_NAMES.map((groupName) => [
        groupName,
        parsedGroups[groupName]?.sourceEntries.length ?? 0,
      ]),
    ),
    parsedGroups,
  };
}

async function readRequiredFile(relativePath) {
  try {
    return await readFile(path.join(rootDir, relativePath), "utf8");
  } catch {
    throw new Error(`${relativePath.replaceAll("\\", "/")}: unable to read required file`);
  }
}

async function readRepositoryLockSet() {
  const groups = {};
  for (const groupName of GROUP_NAMES) {
    const sourceName = `requirements/python-${groupName}.in`;
    const lockName = `requirements/python-${groupName}.lock.txt`;
    groups[groupName] = {
      sourceName,
      sourceText: await readRequiredFile(sourceName),
      lockName,
      lockText: await readRequiredFile(lockName),
    };
  }
  return {
    groups,
    apiProjectText: await readRequiredFile("apps/api/pyproject.toml"),
    workerProjectText: await readRequiredFile("apps/worker/pyproject.toml"),
  };
}

async function run() {
  const lockValidation = validatePythonLockSet(await readRepositoryLockSet());
  if (!lockValidation.ok) {
    console.error("Python lock verification failed:");
    for (const error of lockValidation.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  const pythonPath = requireVenvPython(rootDir);
  const freeze = spawnSync(pythonPath, ["-m", "pip", "freeze", "--exclude-editable"], {
    cwd: rootDir,
    env: process.env,
    encoding: "utf8",
    shell: false,
  });
  if (freeze.error) throw new Error("Failed to start pip freeze");
  if ((freeze.status ?? 1) !== 0) process.exit(freeze.status ?? 1);

  const environmentValidation = compareInstalledRequirements({
    devEntries: lockValidation.parsedGroups.dev.sourceEntries,
    installedText: freeze.stdout,
  });
  if (!environmentValidation.ok) {
    console.error("Python environment verification failed:");
    for (const error of environmentValidation.errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(
    `Python lock verification passed: ${environmentValidation.expectedCount} selected packages match the installed ${process.platform} environment.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
