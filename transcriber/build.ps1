param(
    [switch]$Setup,
    [switch]$Clean
)

$ErrorActionPreference = 'Stop'

$venv = Join-Path $PSScriptRoot '.venv'
if ($Setup -or -not (Test-Path $venv)) {
    Write-Host 'Setting up virtual environment for build...'
    python -m venv $venv
    & "$venv\Scripts\Activate.ps1"
    python -m pip install --upgrade pip
    pip install -r "$PSScriptRoot\requirements.txt"
    pip install pyinstaller
}
else {
    & "$venv\Scripts\Activate.ps1"
}

if ($Clean) {
    if (Test-Path (Join-Path $PSScriptRoot 'build')) { Remove-Item -Recurse -Force (Join-Path $PSScriptRoot 'build') }
    if (Test-Path (Join-Path $PSScriptRoot 'dist')) { Remove-Item -Recurse -Force (Join-Path $PSScriptRoot 'dist') }
    if (Test-Path (Join-Path $PSScriptRoot 'MinimalTranscriber.spec')) { Remove-Item -Force (Join-Path $PSScriptRoot 'MinimalTranscriber.spec') }
}

# Build standalone exe
$Name = 'MinimalTranscriber'
$App = Join-Path $PSScriptRoot 'app.py'

pyinstaller --onefile --noconsole --name $Name `
    --collect-all tkinterdnd2 `
    --collect-all faster_whisper `
    --collect-all ctranslate2 `
    --collect-submodules huggingface_hub `
    --add-binary "$(Join-Path $PSScriptRoot 'ffmpeg/ffmpeg.exe');ffmpeg" `
    $App

Write-Host "Built dist/$Name.exe"
