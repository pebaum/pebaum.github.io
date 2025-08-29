# Minimal Transcriber (Web)

Client-side Whisper transcription you can host on GitHub Pages.

- Tech: Transformers.js (ONNX/WASM) running Whisper tiny/base in the browser
- No server required; audio is processed locally
- Drag-and-drop UI, progress, and downloadable .txt

## Files
- `index.html` — UI
- `styles.css` — basic styling
- `main.js` — UI logic, audio decode/resample (mono 16k)
- `worker.js` — transcription worker using `@xenova/transformers`

## Notes
- First run will download model assets (~75MB for tiny). They are cached by the browser.
- By default models are fetched from public CDNs. You can self-host models later if desired.
- This web build is intentionally simple and separate from the desktop Python app.
