# Fabrique dist\matheasy.plugin (archive ZIP avec config.json à la racine).
# Usage (PowerShell, depuis n'importe où) :  .\tools\build-plugin.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$out  = Join-Path $dist 'matheasy.plugin'
$items = @('config.json', 'index.html', 'LICENSE', 'LICENSE-CONTENT.md', 'scripts', 'styles', 'corpus', 'resources')

New-Item -ItemType Directory -Force -Path $dist | Out-Null
if (Test-Path $out) { Remove-Item $out }

$zip = [System.IO.Compression.ZipFile]::Open($out, 'Create')
try {
    foreach ($item in $items) {
        $path = Join-Path $root $item
        if (-not (Test-Path $path)) { throw "Fichier manquant : $item" }
        $files = if ((Get-Item $path).PSIsContainer) { Get-ChildItem $path -Recurse -File } else { Get-Item $path }
        foreach ($f in $files) {
            # chemins avec "/" (le format ZIP l'exige ; Compress-Archive de PS 5.1 met des "\")
            $rel = $f.FullName.Substring($root.Length + 1).Replace('\', '/')
            [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $rel, 'Optimal')
        }
    }
} finally { $zip.Dispose() }

Write-Host "OK : $out"
