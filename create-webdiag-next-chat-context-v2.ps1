<#
.SYNOPSIS
  Creates a compact WebDiag context archive for the next ChatGPT branch.

.DESCRIPTION
  Run from the WebDiag project root. Compatible with Windows PowerShell 5.1
  and PowerShell 7+. The script collects source files, configs, manifests,
  tests, docs and generated git snapshot into a zip.

  It intentionally excludes:
  - node_modules, .next, dist/build/out, .venv, caches
  - .env and local secrets
  - font binaries: *.woff, *.woff2, *.ttf, *.otf
  - large runtime artifacts and old zip archives

  Reason for font exclusion: do not upload/share font files in ChatGPT.

.PARAMETER ProjectRoot
  Project root. Defaults to current directory.

.PARAMETER OutDir
  Output directory. Defaults to <ProjectRoot>/handoff-out.

.PARAMETER NoGitDiff
  Do not include git diff patch.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\create-webdiag-next-chat-context-v2.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\create-webdiag-next-chat-context-v2.ps1 -ProjectRoot "C:\Work\webdiag"
#>

param(
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$OutDir = "",
  [switch]$NoGitDiff
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) {
  Write-Host "[webdiag-handoff] $Message"
}

function Get-RelativePathCompat([string]$BasePath, [string]$TargetPath) {
  # Compatible replacement for [System.IO.Path]::GetRelativePath(), which is
  # unavailable in Windows PowerShell 5.1 / .NET Framework.
  $baseFull = [System.IO.Path]::GetFullPath($BasePath)
  $targetFull = [System.IO.Path]::GetFullPath($TargetPath)

  if (-not $baseFull.EndsWith([System.IO.Path]::DirectorySeparatorChar) -and
      -not $baseFull.EndsWith([System.IO.Path]::AltDirectorySeparatorChar)) {
    $baseFull = $baseFull + [System.IO.Path]::DirectorySeparatorChar
  }

  $baseUri = New-Object System.Uri($baseFull)
  $targetUri = New-Object System.Uri($targetFull)

  $relativeUri = $baseUri.MakeRelativeUri($targetUri)
  $relativePath = [System.Uri]::UnescapeDataString($relativeUri.ToString())

  return ($relativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
}

function Test-ExcludedPath([string]$RelativePath) {
  $normalized = $RelativePath -replace "\\", "/"

  $excludedDirs = @(
    "node_modules/",
    ".next/",
    "dist/",
    "build/",
    "out/",
    ".venv/",
    "venv/",
    "__pycache__/",
    ".pytest_cache/",
    ".mypy_cache/",
    ".ruff_cache/",
    "coverage/",
    "test-results/",
    "playwright-report/",
    ".git/",
    ".turbo/",
    ".cache/",
    "handoff-out/"
  )

  foreach ($dir in $excludedDirs) {
    if ($normalized.StartsWith($dir) -or $normalized.Contains("/$dir")) {
      return $true
    }
  }

  $fileName = Split-Path $normalized -Leaf
  $excludedNames = @(
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    ".DS_Store",
    "Thumbs.db"
  )

  if ($excludedNames -contains $fileName) {
    return $true
  }

  $excludedExtensions = @(
    ".zip", ".7z", ".rar", ".tar", ".gz",
    ".log", ".tmp",
    ".woff", ".woff2", ".ttf", ".otf"
  )

  foreach ($ext in $excludedExtensions) {
    if ($fileName.ToLowerInvariant().EndsWith($ext)) {
      return $true
    }
  }

  return $false
}

function Copy-RelativeFile([string]$SourceFile, [string]$Root, [string]$DestRoot) {
  $rel = Get-RelativePathCompat -BasePath $Root -TargetPath $SourceFile
  if (Test-ExcludedPath $rel) {
    return
  }

  $target = Join-Path $DestRoot $rel
  $targetDir = Split-Path $target -Parent
  if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $SourceFile -Destination $target -Force
}

$ProjectRoot = (Resolve-Path $ProjectRoot).Path
if ([string]::IsNullOrWhiteSpace($OutDir)) {
  $OutDir = Join-Path $ProjectRoot "handoff-out"
}
if (!(Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$packageJsonPath = Join-Path $ProjectRoot "package.json"
$version = "unknown"
$name = "webdiag"
if (Test-Path $packageJsonPath) {
  try {
    $pkg = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
    if ($pkg.version) { $version = [string]$pkg.version }
    if ($pkg.name) { $name = ([string]$pkg.name) -replace "[^a-zA-Z0-9._-]", "-" }
  } catch {
    Write-Info "Could not parse package.json version/name: $($_.Exception.Message)"
  }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stageRoot = Join-Path $OutDir "webdiag-next-chat-context-$version-$timestamp"
$archivePath = Join-Path $OutDir "webdiag-next-chat-context-$version-$timestamp.zip"

if (Test-Path $stageRoot) {
  Remove-Item -Recurse -Force $stageRoot
}
New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null

$handoffDir = Join-Path $stageRoot "HANDOFF_GENERATED"
New-Item -ItemType Directory -Path $handoffDir -Force | Out-Null

Write-Info "Project root: $ProjectRoot"
Write-Info "Version: $version"
Write-Info "Staging: $stageRoot"

$rootFiles = @(
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "npm-shrinkwrap.json",
  "tsconfig.json",
  "tsconfig.base.json",
  "eslint.config.js",
  "eslint.config.mjs",
  "vitest.config.ts",
  "vitest.config.js",
  "playwright.config.ts",
  "playwright.config.js",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "pyproject.toml",
  "ruff.toml",
  "README.md",
  "CHANGELOG.md",
  ".env.example",
  ".gitignore"
)

foreach ($file in $rootFiles) {
  $path = Join-Path $ProjectRoot $file
  if (Test-Path $path -PathType Leaf) {
    Copy-RelativeFile $path $ProjectRoot $stageRoot
  }
}

$includeDirs = @(
  "HANDOFF",
  "apps",
  "packages",
  "scripts",
  "tests",
  "e2e",
  "docs",
  ".github"
)

foreach ($dir in $includeDirs) {
  $path = Join-Path $ProjectRoot $dir
  if (Test-Path $path -PathType Container) {
    Write-Info "Collecting $dir"
    Get-ChildItem -LiteralPath $path -File -Recurse -Force | ForEach-Object {
      Copy-RelativeFile $_.FullName $ProjectRoot $stageRoot
    }
  }
}

$notice = @"
# Exclusion Notice

This archive intentionally excludes local/runtime/generated files:

- node_modules
- .next / dist / build / out
- .venv / venv
- caches and reports
- .env and local secrets
- old archives
- font binaries: *.woff, *.woff2, *.ttf, *.otf

Font files are excluded intentionally. Do not upload/share font binaries in ChatGPT.
"@
Set-Content -LiteralPath (Join-Path $handoffDir "EXCLUSION_NOTICE.md") -Value $notice -Encoding UTF8

$gitSnapshotPath = Join-Path $handoffDir "GIT_SNAPSHOT.md"
$insideGit = $false
try {
  Push-Location $ProjectRoot
  git rev-parse --is-inside-work-tree *> $null
  if ($LASTEXITCODE -eq 0) { $insideGit = $true }
} catch {
  $insideGit = $false
} finally {
  Pop-Location
}

if ($insideGit) {
  Push-Location $ProjectRoot
  try {
    $git = @()
    $git += "# Git Snapshot"
    $git += ""
    $git += "Generated: $(Get-Date -Format o)"
    $git += ""
    $git += "## Branch"
    $git += '```text'
    $git += (git branch --show-current 2>&1)
    $git += '```'
    $git += ""
    $git += "## HEAD"
    $git += '```text'
    $git += (git rev-parse HEAD 2>&1)
    $git += '```'
    $git += ""
    $git += "## Remotes"
    $git += '```text'
    $git += (git remote -v 2>&1)
    $git += '```'
    $git += ""
    $git += "## Status"
    $git += '```text'
    $git += (git status --short 2>&1)
    $git += '```'
    $git += ""
    $git += "## Last commits"
    $git += '```text'
    $git += (git log --oneline -10 2>&1)
    $git += '```'
    $git += ""
    $git += "## Diff stat"
    $git += '```text'
    $git += (git diff --stat 2>&1)
    $git += '```'
    Set-Content -LiteralPath $gitSnapshotPath -Value ($git -join "`n") -Encoding UTF8

    if (-not $NoGitDiff) {
      git diff -- . ":(exclude).env" ":(exclude).env.local" ":(exclude)*.woff" ":(exclude)*.woff2" ":(exclude)*.ttf" ":(exclude)*.otf" | Set-Content -LiteralPath (Join-Path $handoffDir "GIT_DIFF.patch") -Encoding UTF8
    }
  } finally {
    Pop-Location
  }
} else {
  Set-Content -LiteralPath $gitSnapshotPath -Value "# Git Snapshot`n`nNo .git repository detected in project root. Do not infer branch, HEAD, origin or status." -Encoding UTF8
}

$manifestPath = Join-Path $handoffDir "ARCHIVE_MANIFEST.tsv"
$hashPath = Join-Path $handoffDir "SHA256SUMS.txt"

$files = Get-ChildItem -LiteralPath $stageRoot -File -Recurse | Sort-Object FullName
$manifestLines = @("relative_path`tbytes`tsha256")
$hashLines = @()

foreach ($file in $files) {
  $rel = Get-RelativePathCompat -BasePath $stageRoot -TargetPath $file.FullName
  $rel = $rel -replace "\\", "/"
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant()
  $manifestLines += "$rel`t$($file.Length)`t$hash"
  $hashLines += "$hash  $rel"
}

Set-Content -LiteralPath $manifestPath -Value ($manifestLines -join "`n") -Encoding UTF8
Set-Content -LiteralPath $hashPath -Value ($hashLines -join "`n") -Encoding UTF8

$readme = @"
# WebDiag Next Chat Context

Project: $name
Version from package.json: $version
Generated: $(Get-Date -Format o)

Attach this archive in the next ChatGPT branch together with:
1. WEBDIAG_SENIOR_MASTER_PROMPT_NEXT_CHAT_V9.md
2. screenshots of the current UI if design work is required
3. notes about which patches were actually applied locally

Important:
- This archive excludes font binaries.
- This archive excludes .env and local secrets.
- The next assistant must verify facts from files and must not rely on previous claims.
"@
Set-Content -LiteralPath (Join-Path $stageRoot "README_NEXT_CHAT.md") -Value $readme -Encoding UTF8

if (Test-Path $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Compress-Archive -Path (Join-Path $stageRoot "*") -DestinationPath $archivePath -Force

$archiveHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $archivePath).Hash.ToLowerInvariant()
Write-Info "Archive created: $archivePath"
Write-Info "SHA-256: $archiveHash"
Write-Info "Files included: $($files.Count)"
Write-Info "Attach this zip in the next chat."
