<#
.SYNOPSIS
    Assemble a portable, shareable copy of the "Open .md in Reticulator" Send To
    integration, ready to drop on another Windows machine.

.DESCRIPTION
    Copies the built app + launcher + installer + a short README into a single
    folder (default: dist-package/MarkdownReticulator). With -Zip, also produces
    MarkdownReticulator.zip next to it.

    On the other machine: unzip anywhere, then run
        powershell -ExecutionPolicy Bypass -File Install-SendTo.ps1

.PARAMETER OutDir
    Where to assemble the package (default: <repo>/dist-package).

.PARAMETER Zip
    Also produce a .zip of the package folder.
#>
[CmdletBinding()]
param(
    [string] $OutDir,
    [switch] $Zip
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if (-not $OutDir) { $OutDir = Join-Path $repoRoot 'dist-package' }

$app = Join-Path $repoRoot 'dist\markdown-reticulator.html'
if (-not (Test-Path $app -PathType Leaf)) {
    throw "Built app not found at $app. Run 'python build.py' first."
}

$pkgDir = Join-Path $OutDir 'MarkdownReticulator'
if (Test-Path $pkgDir) { Remove-Item $pkgDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $pkgDir | Out-Null

Copy-Item $app                                       (Join-Path $pkgDir 'markdown-reticulator.html') -Force
Copy-Item (Join-Path $PSScriptRoot 'Open-Markdown.ps1')   $pkgDir -Force
Copy-Item (Join-Path $PSScriptRoot 'Install-SendTo.ps1')  $pkgDir -Force
Copy-Item (Join-Path $PSScriptRoot 'PORTABLE-README.md')  (Join-Path $pkgDir 'README.md') -Force

Write-Host "Package folder: $pkgDir"

if ($Zip) {
    $zipPath = Join-Path $OutDir 'MarkdownReticulator.zip'
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path $pkgDir -DestinationPath $zipPath
    Write-Host "Zip: $zipPath"
}
