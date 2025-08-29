# Minimal Transcriber (Whisper large-v3)

A tiny, no-frills desktop app: drag an audio file into the window, it transcribes locally using Whisper large-v3, and writes a Markdown file next to the audio.

Note: You wrote "Wispr 3 Large" — this uses OpenAI Whisper large-v3 (or large-v3-turbo). If you meant a different model, tell me and I’ll swap it in.

## Features
- Drag-and-drop or click-to-pick a file
- Local inference with faster-whisper
- Outputs `<audio_basename>.md` with the transcript
- Model downloads automatically on first run

## Requirements
- Windows 10/11, Python 3.9–3.12
- ffmpeg available in PATH (needed for audio decoding)
  - Install via winget: `winget install Gyan.FFmpeg` (then restart terminal), or
  - Download from https://www.gyan.dev/ffmpeg/builds/ and add `bin` to PATH
- Optional: CUDA acceleration if you install the matching CTranslate2 wheels

## Quick start (PowerShell)
```powershell
# From repo root
cd transcriber

# One-time setup: create venv and install deps
./run.ps1 -Setup

# Start the app (later runs can omit -Setup)
./run.ps1
```

If PowerShell script execution is restricted, you can run the steps manually:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

### Make a single-file .exe
```powershell
# From transcriber/
./fetch-ffmpeg.ps1   # downloads a static ffmpeg.exe into transcriber/ffmpeg
./build.ps1 -Setup
./build.ps1 -Clean
./build.ps1

# Output: dist/MinimalTranscriber.exe
```

Distribute just `MinimalTranscriber.exe`. First run will download the Whisper model to the user's cache. FFmpeg is bundled inside the exe.

## Usage
- Drag an audio file (mp3, m4a, wav, flac, etc.) into the window, or click the button to choose.
- The model will download on first use. Subsequent runs reuse the cache.
- A Markdown file will be saved alongside the audio: `yourfile.md`.

## Configuration
Set environment variables before launch to tweak behavior:
- TRANSCRIBER_MODEL: whisper model (default: `large-v3`, options include `large-v3-turbo`, `medium`)
- TRANSCRIBER_DEVICE: `cuda` or `cpu` (default: auto-try `cuda`, else `cpu`)
- TRANSCRIBER_COMPUTE_TYPE: CT2 compute type (`float16`, `int8_float16`, `int8`, `float32`). Default is chosen based on device.

## Notes
- First run downloads ~1–3 GB for large models. You can switch to `large-v3-turbo` for speed.
- If you prefer timestamps in the Markdown, we can turn that on.
- This is a simple Tk app built with `tkinterdnd2` for drag-and-drop.
 - Ensure FFmpeg is on PATH for decoding (see Requirements). If missing, the app will prompt you.
