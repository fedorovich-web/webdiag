[CmdletBinding()]
param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")),
  [string]$OutputDirectory = (Join-Path $ProjectRoot "handoff-archives"),
  [string]$PromptPath = (Join-Path $ProjectRoot "docs\WEBDIAG_SENIOR_MASTER_PROMPT_NEXT_CHAT_V10.md")
)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path $ProjectRoot).Path
if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
  throw "package.json not found in project root: $ProjectRoot"
}

$package = Get-Content -Raw -LiteralPath (Join-Path $ProjectRoot "package.json") | ConvertFrom-Json
$version = [string]$package.version
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "webdiag-handoff-$stamp"
$stage = Join-Path $tempRoot "webdiag-next-chat-context-$version"
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$excludeDirectories = @(
  ".git", ".next", "node_modules", ".venv", "venv", "dist", "build", "coverage",
  "playwright-report", "test-results", "handoff-archives", "__pycache__", ".pytest_cache", ".ruff_cache"
)
$excludeFiles = @(
  "*.log", "*.tmp", "*.cache", "*.tsbuildinfo", ".DS_Store", "Thumbs.db",
  "*.woff", "*.woff2", "*.ttf", "*.otf"
)

$robocopyArgs = @($ProjectRoot, $stage, "/E", "/R:1", "/W:1", "/NFL", "/NDL", "/NJH", "/NJS", "/NP")
foreach ($dir in $excludeDirectories) { $robocopyArgs += @("/XD", (Join-Path $ProjectRoot $dir)) }
foreach ($file in $excludeFiles) { $robocopyArgs += @("/XF", $file) }
& robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }

$generated = Join-Path $stage "HANDOFF_GENERATED"
New-Item -ItemType Directory -Force -Path $generated | Out-Null

$manifestPath = Join-Path $generated "ARCHIVE_MANIFEST.tsv"
$shaPath = Join-Path $generated "SHA256SUMS.txt"
$gitPath = Join-Path $generated "GIT_SNAPSHOT.md"
$exclusionPath = Join-Path $generated "EXCLUSION_NOTICE.md"

$files = Get-ChildItem -LiteralPath $stage -Recurse -File | Sort-Object FullName
"relative_path`tsize_bytes`tlast_write_utc" | Set-Content -Encoding UTF8 -LiteralPath $manifestPath
foreach ($file in $files) {
  $relative = [System.IO.Path]::GetRelativePath($stage, $file.FullName).Replace("\", "/")
  "$relative`t$($file.Length)`t$($file.LastWriteTimeUtc.ToString('o'))" | Add-Content -Encoding UTF8 -LiteralPath $manifestPath
}

Get-ChildItem -LiteralPath $stage -Recurse -File |
  Where-Object { $_.FullName -notin @($manifestPath, $shaPath) } |
  Sort-Object FullName |
  ForEach-Object {
    $relative = [System.IO.Path]::GetRelativePath($stage, $_.FullName).Replace("\", "/")
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
    "$hash  $relative"
  } | Set-Content -Encoding UTF8 -LiteralPath $shaPath

if (Test-Path (Join-Path $ProjectRoot ".git")) {
  @(
    "# Git snapshot",
    "",
    "- Branch: $(git -C $ProjectRoot branch --show-current)",
    "- HEAD: $(git -C $ProjectRoot rev-parse HEAD)",
    "",
    "## Status",
    "```text",
    (git -C $ProjectRoot status --short),
    "```",
    "",
    "## Remotes",
    "```text",
    (git -C $ProjectRoot remote -v),
    "```"
  ) | Set-Content -Encoding UTF8 -LiteralPath $gitPath
} else {
  "# Git snapshot`n`n.git was not present in the archived project root. Branch, HEAD, remotes and status were not available." |
    Set-Content -Encoding UTF8 -LiteralPath $gitPath
}

@"
# Exclusion notice

The archive intentionally excludes generated, local, heavy or sensitive directories and files:

- .git, node_modules, .next, dist, build and coverage;
- Python virtual environments and caches;
- Playwright reports and test results;
- font binaries; keep the existing local Manrope WOFF2 file in the working project;
- temporary files and local logs.

The archive is source/context-only and is intended to be attached together with the Senior master prompt.
"@ | Set-Content -Encoding UTF8 -LiteralPath $exclusionPath

$zipName = "webdiag-next-chat-context-$version-$stamp.zip"
$zipPath = Join-Path $OutputDirectory $zipName
Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zipPath -CompressionLevel Optimal
$zipHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $zipPath).Hash.ToLowerInvariant()

Write-Host "Archive: $zipPath"
Write-Host "SHA-256: $zipHash"
if (Test-Path $PromptPath) { Write-Host "Prompt: $PromptPath" }

Remove-Item -LiteralPath $tempRoot -Recurse -Force
