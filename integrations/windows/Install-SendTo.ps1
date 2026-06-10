<#
.SYNOPSIS
    Add (or remove) a "Markdown Reticulator" entry in the Windows Send To menu.

.DESCRIPTION
    Creates a shortcut in your Send To folder that runs Open-Markdown.ps1.
    Afterwards: right-click any .md file -> Send To -> Markdown Reticulator to
    open it rendered. Select several files first to open them as a set.

    No registry edits, no admin rights. Reversible: run with -Uninstall, or just
    delete the shortcut from shell:sendto.

.PARAMETER Uninstall
    Remove the Send To shortcut instead of creating it.
#>
[CmdletBinding()]
param([switch] $Uninstall)

$ErrorActionPreference = 'Stop'

$sendToDir = [Environment]::GetFolderPath('SendTo')
$linkPath  = Join-Path $sendToDir 'Markdown Reticulator.lnk'

if ($Uninstall) {
    if (Test-Path $linkPath) {
        Remove-Item $linkPath -Force
        Write-Host "Removed Send To entry: $linkPath"
    } else {
        Write-Host "No Send To entry found at: $linkPath"
    }
    return
}

$launcher = Join-Path $PSScriptRoot 'Open-Markdown.ps1'
if (-not (Test-Path $launcher -PathType Leaf)) {
    throw "Launcher not found next to this script: $launcher"
}

$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'

$shell    = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($linkPath)
$shortcut.TargetPath       = $powershell
$shortcut.Arguments        = '-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $launcher + '"'
$shortcut.WorkingDirectory = $PSScriptRoot
$shortcut.WindowStyle      = 7  # minimized -- keeps the console flash to a minimum
$shortcut.Description       = 'Open Markdown file(s) in Markdown Reticulator'
$shortcut.Save()

Write-Host "Installed Send To entry: $linkPath"
Write-Host "Use it: right-click a .md file -> Send To -> Markdown Reticulator."
Write-Host "Remove it later: .\Install-SendTo.ps1 -Uninstall"
