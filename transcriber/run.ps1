param(
    [switch]$Setup
)

$ErrorActionPreference = 'Stop'

$venv = Join-Path $PSScriptRoot '.venv'
if ($Setup -or -not (Test-Path $venv)) {
    Write-Host 'Setting up virtual environment...'
    python -m venv $venv
    & "$venv\Scripts\Activate.ps1"
    python -m pip install --upgrade pip
    pip install -r "$PSScriptRoot\requirements.txt"
}
else {
    & "$venv\Scripts\Activate.ps1"
}

# Print device info hint
Write-Host 'If you have a GPU, consider installing the appropriate ctranslate2 wheels for CUDA/DML.'

# Run Python for dev or the built EXE if present
$exe = Join-Path $PSScriptRoot 'dist/MinimalTranscriber.exe'
if (Test-Path $exe) {
    & $exe
} else {
    python "$PSScriptRoot\app.py"
}
