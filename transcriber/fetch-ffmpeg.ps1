$ErrorActionPreference = 'Stop'
$ffdir = Join-Path $PSScriptRoot 'ffmpeg'
if (-not (Test-Path $ffdir)) { New-Item -ItemType Directory -Path $ffdir | Out-Null }
$ffexe = Join-Path $ffdir 'ffmpeg.exe'
if (Test-Path $ffexe) { Write-Host "ffmpeg.exe already present at $ffexe"; exit 0 }

# Prefer official community static ZIP (works with Expand-Archive)
$zipUrl = 'https://github.com/BtbN/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip'
$zipPath = Join-Path $env:TEMP 'ffmpeg.zip'

Write-Host "Downloading FFmpeg static build (ZIP)..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

try {
    $tmpDir = Join-Path $env:TEMP "ffmpeg_zip_$(Get-Random)"
    New-Item -ItemType Directory -Path $tmpDir | Out-Null
    Expand-Archive -Path $zipPath -DestinationPath $tmpDir -Force
    $candidate = Get-ChildItem -Recurse -Path (Join-Path $tmpDir '*') -Filter ffmpeg.exe | Select-Object -First 1
    if ($null -eq $candidate) { throw 'ffmpeg.exe not found in ZIP' }
    Copy-Item $candidate.FullName $ffexe -Force
    Remove-Item -Recurse -Force $tmpDir
    Remove-Item -Force $zipPath
    Write-Host "FFmpeg saved to $ffexe"
    exit 0
}
catch {
    Write-Warning "ZIP method failed: $($_.Exception.Message)"
}

# Fallback: Gyan .7z (requires 7-Zip)
$sevenUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-git-full.7z'
$sevenPath = Join-Path $env:TEMP 'ffmpeg.7z'
Write-Host "Downloading FFmpeg static build (.7z fallback)..."
Invoke-WebRequest -Uri $sevenUrl -OutFile $sevenPath

if (Get-Command 7z.exe -ErrorAction SilentlyContinue) {
    & 7z.exe e -y $sevenPath -o$ffdir "**/bin/ffmpeg.exe"
    if (-not (Test-Path $ffexe)) { throw 'Failed to extract ffmpeg.exe via 7z' }
    Remove-Item -Force $sevenPath
    Write-Host "FFmpeg saved to $ffexe"
    exit 0
}
else {
    throw '7z.exe not found and ZIP method failed. Please install 7-Zip or download ffmpeg.exe manually.'
}
