<#
.SYNOPSIS
    Open one or more Markdown files in Markdown Reticulator.

.DESCRIPTION
    A local HTML page is sandboxed: when Windows opens a file "with" the browser,
    it cannot inject that file's contents into the page. This launcher does the
    file reading the browser won't -- it reads the selected .md file(s), embeds
    them (base64 of a JSON array of {name, md}) into a copy of the bundled app,
    writes a self-contained temp HTML, and opens it in the default browser,
    already rendered.

    Wired up via the Send To shortcut (see Install-SendTo.ps1), but also runnable
    directly:  powershell -File Open-Markdown.ps1 notes.md

.PARAMETER Paths
    One or more markdown file paths (Send To passes the selected files here).

.PARAMETER NoLaunch
    Build the temp HTML but print its path instead of opening a browser (testing).
#>
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $Paths,

    [switch] $NoLaunch
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue

function Fail($message) {
    try {
        [System.Windows.Forms.MessageBox]::Show($message, 'Markdown Reticulator') | Out-Null
    } catch {
        Write-Error $message
    }
    exit 1
}

# Locate the built single-file app. Works in two layouts:
#   1. Portable: markdown-reticulator.html sits next to this script (shared folder).
#   2. In-repo:  integrations/windows -> repo root -> dist/.
$candidates = @(
    (Join-Path $PSScriptRoot 'markdown-reticulator.html'),
    (Join-Path $PSScriptRoot '..\..\dist\markdown-reticulator.html')
)
$appPath = $candidates | Where-Object { Test-Path $_ -PathType Leaf } | Select-Object -First 1
if (-not $appPath) {
    Fail("Markdown Reticulator app not found. Looked for:`n - " + ($candidates -join "`n - ") +
         "`n`nPut markdown-reticulator.html next to this script, or run build.py in the repo.")
}

# Read and validate the selected files.
$validExt = @('.md', '.markdown', '.txt')
$docs = @()
foreach ($p in $Paths) {
    if ([string]::IsNullOrWhiteSpace($p)) { continue }
    if (-not (Test-Path $p -PathType Leaf)) { continue }
    $ext = [System.IO.Path]::GetExtension($p).ToLowerInvariant()
    if ($validExt -notcontains $ext) { continue }
    $text = [System.IO.File]::ReadAllText($p)  # UTF-8 by default, BOM-aware
    $docs += [pscustomobject]@{
        name = [System.IO.Path]::GetFileName($p)
        md   = $text
    }
}

if ($docs.Count -eq 0) {
    Fail("No markdown files to open (expected .md, .markdown, or .txt).")
}

# Build the base64(JSON-array) payload. Force an array even for a single file.
$json = $docs | ConvertTo-Json -Depth 6 -Compress
if ($json[0] -ne '[') { $json = '[' + $json + ']' }
$payloadB64 = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($json))

# Inject into the app's empty payload slot.
$html   = [System.IO.File]::ReadAllText($appPath)
$needle = '<script id="mdPayload" type="text/plain"></script>'
if (-not $html.Contains($needle)) {
    Fail("This app build has no mdPayload slot. Rebuild dist from current source (python build.py).")
}
$html = $html.Replace($needle, '<script id="mdPayload" type="text/plain">' + $payloadB64 + '</script>')

# Write a self-contained temp file and (optionally) open it.
$tempDir = Join-Path $env:TEMP 'markdown-reticulator'
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Best-effort cleanup of temp pages older than a day so they don't pile up.
Get-ChildItem $tempDir -Filter '*.html' -ErrorAction SilentlyContinue |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } |
    Remove-Item -Force -ErrorAction SilentlyContinue

$base    = [System.IO.Path]::GetFileNameWithoutExtension($docs[0].name)
$stamp   = [System.Guid]::NewGuid().ToString('N').Substring(0, 8)
$outFile = Join-Path $tempDir ($base + '-' + $stamp + '.html')
[System.IO.File]::WriteAllText($outFile, $html, (New-Object System.Text.UTF8Encoding($false)))

if ($NoLaunch) {
    Write-Output $outFile
} else {
    Start-Process $outFile  # opens in the default browser (.html handler)
}
