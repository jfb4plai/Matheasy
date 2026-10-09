# Fabrique dist\matheasy.plugin (archive ZIP avec config.json à la racine).
# Usage (PowerShell, depuis n'importe où) :  .\tools\build-plugin.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root 'dist'
$out  = Join-Path $dist 'matheasy.plugin'
$items = @('config.json', 'index.html', 'LICENSE', 'LICENSE-CONTENT.md', 'scripts', 'styles', 'corpus', 'resources', 'vendor')

# Tests avant fabrication : bloquants si Node.js est installé, sautés sinon (un collègue qui installe n'a pas besoin de Node.js)
if (Get-Command node -ErrorAction SilentlyContinue) {
    & node (Join-Path $root 'tests\run-all.js')
    if ($LASTEXITCODE -ne 0) { throw "Tests en échec : le fichier .plugin n'a pas été fabriqué." }
} else {
    Write-Warning "Node.js absent : tests non lancés, fabrication quand même."
}

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
