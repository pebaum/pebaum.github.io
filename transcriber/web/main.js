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
  pct: document.getElementById('pct'),
  output: document.getElementById('output'),
  download: document.getElementById('download'),
  saveLink: document.getElementById('saveLink'),
};

let worker = null;
let busy = false;
let lastObjectURL = null;

function setStatus(txt){ els.status.textContent = txt; }
function setBusy(v){ busy = v; els.stop.disabled = !v; }
function setProgress(pct){
  const v = Math.max(0, Math.min(100, pct));
  els.bar.style.width = `${v}%`;
  if (els.pct) els.pct.textContent = `${v|0}%`;
}
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

async function decodeToMono(file){
  const arrbuf = await file.arrayBuffer();
  const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await tmpCtx.decodeAudioData(arrbuf.slice(0));
  tmpCtx.close();
  // Downmix to mono (native sample rate)
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
  return { samples: mono, sampleRate: decoded.sampleRate, duration: decoded.duration };
}

function startTranscribe(file){
  ensureWorker();
  resetOutput();
  setProgress(0);
  setBusy(true);
  const model = pickModelName();
  setStatus(`Loading model '${model}'…`);
  setProgress(5);
  worker.postMessage({ type: 'init', model });
  (async () => {
    try {
      setStatus('Decoding audio…');
  setProgress(20);
      const { samples, sampleRate: sr, duration: durSec } = await decodeToMono(file);
  setProgress(30);
      // For long files, stream in chunks to keep memory bounded
      const chunkSec = 20;        // chunk length in seconds
      const strideSec = 5;        // overlap for context
      if (durSec <= chunkSec * 1.2) {
        setStatus('Transcribing…');
  setProgress(40);
        worker.postMessage({ type: 'transcribe', audio: { samples, sample_rate: sr } }, [samples.buffer]);
      } else {
        setStatus('Transcribing (chunked)…');
        const chunk = Math.floor(chunkSec * sr);
        const stride = Math.floor(strideSec * sr);
        const step = Math.max(1, chunk - stride);
        const total = Math.max(1, Math.ceil(Math.max(0, samples.length - stride) / step));
        let index = 0;
        for (let start = 0; start < samples.length; start += step) {
          if (!busy) break; // allow Stop
          if (start >= samples.length) break;
          const end = Math.min(samples.length, start + chunk);
          const slice = samples.subarray(start, end);
          worker.postMessage({ type: 'chunk', i: index, n: total, audio: { samples: slice, sample_rate: sr } }, [slice.buffer]);
          index++;
          // small yield to keep UI responsive
          await new Promise(r => setTimeout(r, 0));
          // Update front-end progress roughly alongside worker
          const pct = Math.max(5, Math.min(90, Math.round(5 + (index / total) * 80)));
          setProgress(pct);
        }
        if (busy) worker.postMessage({ type: 'finish' });
      }
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
