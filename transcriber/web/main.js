// Minimal in-browser Whisper via WebAssembly using whisper.cpp prebuilt WASM.
// We use a tiny model by default for speed and broad compatibility.
// This runs fully client-side; no server required.

// Implementation notes:
// - Loads whisper.cpp wasm + model (tiny / tiny.en) from a CDN by default.
// - Uses Web Worker to avoid blocking UI; streams progress updates.
// - Falls back to offline if the model fails to download.
// - Keeps UX consistent with the desktop app: status, progress, speed toggle, and .txt download.

const els = {
  drop: document.getElementById('drop'),
  file: document.getElementById('file'),
  browse: document.getElementById('browse'),
  status: document.getElementById('status'),
  speed: document.getElementById('speed'),
  stop: document.getElementById('stop'),
  bar: document.getElementById('bar'),
  output: document.getElementById('output'),
  download: document.getElementById('download'),
  saveLink: document.getElementById('saveLink'),
};

let worker = null;
let busy = false;
let lastObjectURL = null;

function setStatus(txt){ els.status.textContent = txt; }
function setBusy(v){ busy = v; els.stop.disabled = !v; }
function setProgress(pct){ els.bar.style.width = `${Math.max(0, Math.min(100, pct))}%`; }
function resetOutput(){ els.output.value=''; els.download.disabled = true; if(lastObjectURL){ URL.revokeObjectURL(lastObjectURL); lastObjectURL=null; } }

function pickModelName(){
  const langHint = navigator.language || '';
  const english = /^(en\b|en-)/i.test(langHint);
  const speed = els.speed.checked;
  // tiny for speed, base for quality; if English and speed, prefer tiny.en
  if (speed) return english ? 'tiny.en' : 'tiny';
  return english ? 'base.en' : 'base';
}

// Create worker lazily so we can swap models on toggle if needed
function ensureWorker(){
  if (worker) return;
  worker = new Worker('worker.js', { type: 'module' });
  worker.onmessage = (ev) => {
    const { type, data } = ev.data || {};
    if (type === 'status') setStatus(data);
    else if (type === 'progress') setProgress(data);
    else if (type === 'ready') {
      setStatus('Ready. Drop an audio file or click Select Audio.');
    } else if (type === 'result') {
      const text = data || '';
      els.output.value = text;
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      lastObjectURL = url;
      els.saveLink.href = url;
      els.download.disabled = false;
      setBusy(false);
      setStatus('Done. You can edit or download the transcript.');
      setProgress(100);
    } else if (type === 'error') {
      setBusy(false);
      setStatus(`Error: ${data}`);
    }
  };
}

function terminateWorker(){ if(worker){ worker.terminate(); worker=null; } }

async function decodeToMono16k(file){
  const arrbuf = await file.arrayBuffer();
  // Use WebAudio to decode and resample
  const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await tmpCtx.decodeAudioData(arrbuf.slice(0));
  tmpCtx.close();
  // Downmix to mono
  let mono;
  if (decoded.numberOfChannels > 1) {
    const ch0 = decoded.getChannelData(0);
    const ch1 = decoded.getChannelData(1);
    const n = Math.min(ch0.length, ch1.length);
    mono = new Float32Array(n);
    for (let i = 0; i < n; i++) mono[i] = 0.5 * (ch0[i] + ch1[i]);
  } else {
    mono = decoded.getChannelData(0).slice(0);
  }
  // Resample to 16k using OfflineAudioContext
  const duration = decoded.duration;
  const frames = Math.max(1, Math.floor(duration * 16000));
  const resCtx = new OfflineAudioContext(1, frames, 16000);
  const buf = resCtx.createBuffer(1, decoded.length, decoded.sampleRate);
  buf.copyToChannel(mono, 0);
  const src = resCtx.createBufferSource();
  src.buffer = buf; src.connect(resCtx.destination); src.start();
  const resampled = await resCtx.startRendering();
  const out = resampled.getChannelData(0).slice(0);
  return out;
}

function startTranscribe(file){
  ensureWorker();
  resetOutput();
  setProgress(0);
  setBusy(true);
  const model = pickModelName();
  setStatus(`Loading model '${model}'…`);
  worker.postMessage({ type: 'init', model });
  (async () => {
    try {
      setStatus('Decoding audio…');
      const samples = await decodeToMono16k(file);
      setStatus('Transcribing…');
      worker.postMessage({ type: 'transcribe', audio: { samples, sample_rate: 16000 } }, [samples.buffer]);
    } catch (e) {
      setBusy(false);
      setStatus(`Failed to decode: ${e?.message || e}`);
    }
  })();
}

// UI wiring
els.browse.addEventListener('click', () => els.file.click());
els.file.addEventListener('change', (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) startTranscribe(f);
});

['dragenter','dragover'].forEach(ev => els.drop.addEventListener(ev, (e) => {
  e.preventDefault(); e.stopPropagation();
  els.drop.style.borderColor = '#66c2ff';
}));
['dragleave','drop'].forEach(ev => els.drop.addEventListener(ev, (e) => {
  e.preventDefault(); e.stopPropagation();
  els.drop.style.borderColor = '#555';
}));
els.drop.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) startTranscribe(f);
});

els.stop.addEventListener('click', () => {
  setStatus('Stopped.');
  setBusy(false);
  terminateWorker();
  setProgress(0);
});

els.speed.addEventListener('change', () => {
  // If user toggles speed mid-run, we just reset worker so next run uses new model
  if (!busy) terminateWorker();
});

els.download.addEventListener('click', () => {
  if (els.saveLink.href) {
    els.saveLink.click();
  }
});

setStatus('Ready. Drop an audio file or click Select Audio.');
