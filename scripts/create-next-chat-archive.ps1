#Requires -Version 5.1
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$ProjectRoot = "C:\Work\webdiag",

    [Parameter(Mandatory = $false)]
    [string]$OutputDirectory = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RelativeArchivePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$BasePath,

        [Parameter(Mandatory = $true)]
        [string]$TargetPath
    )

    $baseFull = [System.IO.Path]::GetFullPath($BasePath).TrimEnd("\") + "\"
    $targetFull = [System.IO.Path]::GetFullPath($TargetPath)
    $baseUri = [System.Uri]::new($baseFull)
    $targetUri = [System.Uri]::new($targetFull)
    $relativeUri = $baseUri.MakeRelativeUri($targetUri)

    return [System.Uri]::UnescapeDataString($relativeUri.ToString()).Replace("\", "/")
}

function Invoke-GitText {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepositoryPath,

        [Parameter(Mandatory = $true)]
        [string[]]$GitArguments
    )

    try {
        $output = & git -C $RepositoryPath @GitArguments 2>$null
        if ($LASTEXITCODE -ne 0) {
            return ""
        }

        return (($output | Out-String).TrimEnd())
    }
    catch {
        return ""
    }
}

function Test-ExcludedRootFile {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.FileInfo]$File
    )

    $name = $File.Name
    $extension = $File.Extension.ToLowerInvariant()

    if ($name -eq ".env.example") {
        return $false
    }

    if ($name -eq ".env" -or $name -like ".env.*") {
        return $true
    }

    $excludedExtensions = @(
        ".zip", ".7z", ".rar", ".tar", ".gz",
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".ico",
        ".log", ".tmp", ".cache", ".tsbuildinfo",
        ".woff", ".woff2", ".ttf", ".otf",
        ".pem", ".key", ".pfx", ".p12"
    )

    return $excludedExtensions -contains $extension
}

if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) {
    throw "Project folder not found: $ProjectRoot"
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$packagePath = Join-Path $ProjectRoot "package.json"

if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
    throw "package.json not found: $packagePath"
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $projectParent = Split-Path -Path $ProjectRoot -Parent
    $OutputDirectory = Join-Path $projectParent "webdiag-handoff-archives"
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$OutputDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path

$packageJson = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
$version = [string]$packageJson.version
if ([string]::IsNullOrWhiteSpace($version)) {
    $version = "unknown-version"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("webdiag-handoff-" + $timestamp)
$stageName = "webdiag-next-chat-context-" + $version
$stagePath = Join-Path $tempRoot $stageName

$allowedRootDirectories = @(
    "apps",
    "packages",
    "docs",
    "scripts"
)

$excludedDirectoryNames = @(
    ".git",
    ".next",
    ".nuxt",
    ".output",
    ".turbo",
    ".cache",
    ".astro",
    "node_modules",
    ".venv",
    "venv",
    "dist",
    "build",
    "out",
    "coverage",
    "playwright-report",
    "test-results",
    "handoff-archives",
    "webdiag-handoff-archives",
    "_patch_backups",
    "backups",
    "tmp",
    "temp",
    "__pycache__",
    ".pytest_cache",
    ".ruff_cache",
    "__snapshots__",
    "screenshots",
    "artifacts"
)

$excludedFileExtensions = @(
    ".zip", ".7z", ".rar", ".tar", ".gz",
    ".log", ".tmp", ".cache", ".tsbuildinfo",
    ".woff", ".woff2", ".ttf", ".otf",
    ".pem", ".key", ".pfx", ".p12"
)

try {
    $robocopyCommand = Get-Command robocopy -ErrorAction SilentlyContinue
    if ($null -eq $robocopyCommand) {
        throw "robocopy was not found. Run this script on Windows."
    }

    New-Item -ItemType Directory -Force -Path $stagePath | Out-Null

    foreach ($directoryName in $allowedRootDirectories) {
        $sourceDirectory = Join-Path $ProjectRoot $directoryName
        if (-not (Test-Path -LiteralPath $sourceDirectory -PathType Container)) {
            continue
        }

        $destinationDirectory = Join-Path $stagePath $directoryName
        New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null

        $robocopyArguments = @(
            $sourceDirectory,
            $destinationDirectory,
            "/E",
            "/R:1",
            "/W:1",
            "/COPY:DAT",
            "/DCOPY:DAT",
            "/NFL",
            "/NDL",
            "/NJH",
            "/NJS",
            "/NP",
            "/XJ"
        )

        & robocopy @robocopyArguments | Out-Null
        $robocopyExitCode = $LASTEXITCODE
        if ($robocopyExitCode -ge 8) {
            throw "robocopy failed for $directoryName with exit code $robocopyExitCode"
        }
    }

    $rootFiles = Get-ChildItem -LiteralPath $ProjectRoot -File
    foreach ($file in $rootFiles) {
        if (Test-ExcludedRootFile -File $file) {
            continue
        }

        Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $stagePath $file.Name) -Force
    }

    $directoriesToRemove = Get-ChildItem -LiteralPath $stagePath -Recurse -Directory |
        Sort-Object { $_.FullName.Length } -Descending

    foreach ($directory in $directoriesToRemove) {
        $exclude = $excludedDirectoryNames -contains $directory.Name
        if ($directory.Name -like "*-snapshots") {
            $exclude = $true
        }

        if ($exclude -and (Test-Path -LiteralPath $directory.FullName)) {
            Remove-Item -LiteralPath $directory.FullName -Recurse -Force
        }
    }

    $filesToReview = Get-ChildItem -LiteralPath $stagePath -Recurse -File
    foreach ($file in $filesToReview) {
        $extension = $file.Extension.ToLowerInvariant()
        $remove = $excludedFileExtensions -contains $extension

        if ($file.Name -eq ".env" -or ($file.Name -like ".env.*" -and $file.Name -ne ".env.example")) {
            $remove = $true
        }

        if ($remove -and (Test-Path -LiteralPath $file.FullName)) {
            Remove-Item -LiteralPath $file.FullName -Force
        }
    }

    $generatedDirectory = Join-Path $stagePath "HANDOFF_GENERATED"
    New-Item -ItemType Directory -Force -Path $generatedDirectory | Out-Null

    $gitSnapshotPath = Join-Path $generatedDirectory "GIT_SNAPSHOT.md"
    $exclusionNoticePath = Join-Path $generatedDirectory "EXCLUSION_NOTICE.md"
    $manifestPath = Join-Path $generatedDirectory "ARCHIVE_MANIFEST.tsv"
    $checksumsPath = Join-Path $generatedDirectory "SHA256SUMS.txt"
    $sizeReportPath = Join-Path $generatedDirectory "ARCHIVE_SIZE_REPORT.tsv"

    $exclusionNotice = @(
        "# Exclusion notice",
        "",
        "This is a slim source handoff archive.",
        "",
        "Excluded:",
        "- .git and dependency directories",
        "- build outputs and caches",
        "- Playwright reports and test results",
        "- visual regression snapshot directories ending in -snapshots",
        "- screenshots and generated artifacts directories",
        "- previous ZIP archives and backups",
        "- local environment files, secrets, logs and font binaries",
        "",
        "Application source assets inside allowed source directories are preserved unless they are inside an excluded generated directory."
    )
    $exclusionNotice | Set-Content -LiteralPath $exclusionNoticePath -Encoding UTF8

    $gitSnapshot = @(
        "# Git snapshot",
        "",
        "Git metadata was unavailable or .git was absent."
    )

    $gitCommand = Get-Command git -ErrorAction SilentlyContinue
    $gitDirectory = Join-Path $ProjectRoot ".git"

    if ($null -ne $gitCommand -and (Test-Path -LiteralPath $gitDirectory -PathType Container)) {
        $insideWorkTree = Invoke-GitText -RepositoryPath $ProjectRoot -GitArguments @("rev-parse", "--is-inside-work-tree")
        if ($insideWorkTree.Trim() -eq "true") {
            $branch = Invoke-GitText -RepositoryPath $ProjectRoot -GitArguments @("branch", "--show-current")
            $head = Invoke-GitText -RepositoryPath $ProjectRoot -GitArguments @("rev-parse", "HEAD")
            $status = Invoke-GitText -RepositoryPath $ProjectRoot -GitArguments @("status", "--short")
            $remotes = Invoke-GitText -RepositoryPath $ProjectRoot -GitArguments @("remote", "-v")

            if ([string]::IsNullOrWhiteSpace($branch)) { $branch = "detached-or-unavailable" }
            if ([string]::IsNullOrWhiteSpace($head)) { $head = "unavailable" }
            if ([string]::IsNullOrWhiteSpace($status)) { $status = "Working tree clean or status unavailable." }
            if ([string]::IsNullOrWhiteSpace($remotes)) { $remotes = "No remotes configured or unavailable." }

            $gitSnapshot = @(
                "# Git snapshot",
                "",
                ("Branch: " + $branch),
                ("HEAD: " + $head),
                "",
                "Status:",
                $status,
                "",
                "Remotes:",
                $remotes
            )
        }
    }

    $gitSnapshot | Set-Content -LiteralPath $gitSnapshotPath -Encoding UTF8

    $manifestLines = [System.Collections.Generic.List[string]]::new()
    $manifestLines.Add("relative_path`tsize_bytes`tlast_write_utc")

    $manifestFiles = Get-ChildItem -LiteralPath $stagePath -Recurse -File | Sort-Object FullName
    foreach ($file in $manifestFiles) {
        $relativePath = Get-RelativeArchivePath -BasePath $stagePath -TargetPath $file.FullName
        $manifestLines.Add($relativePath + "`t" + $file.Length + "`t" + $file.LastWriteTimeUtc.ToString("o"))
    }
    $manifestLines | Set-Content -LiteralPath $manifestPath -Encoding UTF8

    $sizeReportLines = [System.Collections.Generic.List[string]]::new()
    $sizeReportLines.Add("relative_path`tsize_bytes")
    $largestFiles = Get-ChildItem -LiteralPath $stagePath -Recurse -File |
        Sort-Object Length -Descending |
        Select-Object -First 100

    foreach ($file in $largestFiles) {
        $relativePath = Get-RelativeArchivePath -BasePath $stagePath -TargetPath $file.FullName
        $sizeReportLines.Add($relativePath + "`t" + $file.Length)
    }
    $sizeReportLines | Set-Content -LiteralPath $sizeReportPath -Encoding UTF8

    $checksumLines = [System.Collections.Generic.List[string]]::new()
    $checksumFiles = Get-ChildItem -LiteralPath $stagePath -Recurse -File |
        Where-Object { $_.FullName -ne $checksumsPath } |
        Sort-Object FullName

    foreach ($file in $checksumFiles) {
        $relativePath = Get-RelativeArchivePath -BasePath $stagePath -TargetPath $file.FullName
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $checksumLines.Add($hash + "  " + $relativePath)
    }
    $checksumLines | Set-Content -LiteralPath $checksumsPath -Encoding UTF8

    $archiveName = "webdiag-next-chat-context-" + $version + "-" + $timestamp + ".zip"
    $archivePath = Join-Path $OutputDirectory $archiveName

    Compress-Archive -Path (Join-Path $stagePath "*") -DestinationPath $archivePath -CompressionLevel Optimal -Force

    if (-not (Test-Path -LiteralPath $archivePath -PathType Leaf)) {
        throw "Archive was not created: $archivePath"
    }

    $archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    $archiveSize = (Get-Item -LiteralPath $archivePath).Length
    $stageSize = (Get-ChildItem -LiteralPath $stagePath -Recurse -File | Measure-Object -Property Length -Sum).Sum

    Write-Host ""
    Write-Host "Slim handoff archive created." -ForegroundColor Green
    Write-Host ("Path: " + $archivePath)
    Write-Host ("Uncompressed source size: " + $stageSize + " bytes")
    Write-Host ("ZIP size: " + $archiveSize + " bytes")
    Write-Host ("SHA-256: " + $archiveHash)
    Write-Host ""
    Write-Host "Largest included files:" -ForegroundColor Cyan

    Get-ChildItem -LiteralPath $stagePath -Recurse -File |
        Sort-Object Length -Descending |
        Select-Object -First 15 @{Name="SizeMB";Expression={[Math]::Round($_.Length / 1MB, 2)}}, @{Name="Path";Expression={Get-RelativeArchivePath -BasePath $stagePath -TargetPath $_.FullName}} |
        Format-Table -AutoSize

    [PSCustomObject]@{
        ArchivePath = $archivePath
        SizeBytes = $archiveSize
        SHA256 = $archiveHash
        ProjectVersion = $version
    }
}
finally {
    if (Test-Path -LiteralPath $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
