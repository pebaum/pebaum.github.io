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
  log: document.getElementById('log'),
  clearLog: document.getElementById('clearLog'),
  format: document.getElementById('format'),
  modelSel: document.getElementById('model'),
  record: document.getElementById('record'),
  recStatus: document.getElementById('recStatus'),
  transcribeRec: document.getElementById('transcribeRec'),
  preview: document.getElementById('preview'),
};

let worker = null;
let busy = false;
let lastObjectURL = null;
let ticker = null;
let awaitingInit = false;
let resolveInit = null;
let mediaRecorder = null;
let recChunks = [];
let recBlob = null;
let recUrl = null;
let recActive = false;

function setStatus(txt){ els.status.textContent = txt; }
function logLine(msg){
  const now = new Date().toLocaleTimeString();
  if (!els.log) return;
  els.log.textContent += `[${now}] ${msg}\n`;
  els.log.scrollTop = els.log.scrollHeight;
}
function setBusy(v){ busy = v; els.stop.disabled = !v; }
function setProgress(pct){
  const v = Math.max(0, Math.min(100, pct));
  els.bar.style.width = `${v}%`;
  if (els.pct) els.pct.textContent = `${v|0}%`;
}
function startTicker(from, to, ms){
  stopTicker();
  let v = from;
  const step = (to - from) / Math.max(1, Math.floor(ms/150));
  ticker = setInterval(() => {
    v = Math.min(to, v + step);
    setProgress(v);
  }, 150);
}
function stopTicker(){ if (ticker){ clearInterval(ticker); ticker = null; } }
function resetOutput(){ els.output.value=''; els.download.disabled = true; if(lastObjectURL){ URL.revokeObjectURL(lastObjectURL); lastObjectURL=null; } }

function resetRecording(){
  recChunks = [];
  recBlob = null;
  if (recUrl) { URL.revokeObjectURL(recUrl); recUrl = null; }
  if (els.preview) { els.preview.src = ''; els.preview.hidden = true; }
  if (els.transcribeRec) els.transcribeRec.disabled = true;
}

function pickModelName(){
  // Honor explicit model selection if provided; otherwise pick based on locale + speed
  const sel = els.modelSel && els.modelSel.value || 'auto';
  if (sel && sel !== 'auto') return sel;
  const langHint = navigator.language || '';
  const english = /^(en\b|en-)/i.test(langHint);
  const speed = els.speed.checked;
  if (speed) return english ? 'tiny.en' : 'tiny';
  return english ? 'base.en' : 'base';
}

function pickFormat(){
  const f = (els.format && els.format.value) || 'txt';
  return (f === 'srt' || f === 'vtt') ? f : 'txt';
}

function setDownloadUIForFormat(fmt){
  const btn = els.download;
  const a = els.saveLink;
  if (!btn || !a) return;
  const ext = fmt === 'srt' ? 'srt' : fmt === 'vtt' ? 'vtt' : 'txt';
  btn.textContent = `Download .${ext}`;
  a.download = `transcript.${ext}`;
}

function tsToString(sec, useComma){
  const s = Math.max(0, Number(sec) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s - Math.floor(s)) * 1000);
  const pad = (n, l=2) => String(n).padStart(l, '0');
  const sepMs = useComma ? ',' : '.';
  return `${pad(h)}:${pad(m)}:${pad(ss)}${sepMs}${pad(ms,3)}`;
}

function chunksToSRT(chunks){
  if (!Array.isArray(chunks)) return '';
  const lines = [];
  let i = 1;
  for (const ch of chunks){
    const ts = ch && ch.timestamp;
    const text = (ch && ch.text || '').trim();
    if (!text) continue;
    const start = Array.isArray(ts) ? ts[0] : 0;
    const end = Array.isArray(ts) ? ts[1] : start;
    lines.push(String(i++));
    lines.push(`${tsToString(start, true)} --> ${tsToString(end, true)}`);
    lines.push(text);
    lines.push('');
  }
  return lines.join('\n');
}

function chunksToVTT(chunks){
  const body = chunksToSRT(chunks).split('\n').map((line) => {
    if (/-->/.test(line)) return line.replace(/,(\d{3})/g, '.$1');
    return line;
  }).join('\n');
  return `WEBVTT\n\n${body}`;
}

// Create worker lazily so we can swap models on toggle if needed
function ensureWorker(){
  if (worker) return;
  worker = new Worker('worker.js', { type: 'module' });
  worker.onmessage = (ev) => {
    const { type, data } = ev.data || {};
    if (type === 'status') { setStatus(data); logLine(String(data)); }
    else if (type === 'progress') { setProgress(data); }
    else if (type === 'ready') {
  // First 'ready' is worker loaded; subsequent 'ready' after init means pipeline ready
  if (awaitingInit && typeof resolveInit === 'function') { resolveInit(); awaitingInit = false; resolveInit = null; }
      setStatus('Ready. Drop an audio file or click Select Audio.');
      logLine('Worker ready.');
    } else if (type === 'result') {
      const fmt = pickFormat();
      let outText = '';
      let blob;
      if (typeof data === 'string') {
        outText = data;
        blob = new Blob([outText], { type: 'text/plain;charset=utf-8' });
      } else {
        const fullText = (data && data.text) || '';
        const chunks = (data && data.chunks) || [];
        if (fmt === 'srt') {
          outText = chunksToSRT(chunks);
          blob = new Blob([outText], { type: 'text/plain;charset=utf-8' });
        } else if (fmt === 'vtt') {
          outText = chunksToVTT(chunks);
          blob = new Blob([outText], { type: 'text/vtt;charset=utf-8' });
        } else {
          outText = fullText;
          blob = new Blob([outText], { type: 'text/plain;charset=utf-8' });
        }
      }
      els.output.value = outText;
      const url = URL.createObjectURL(blob);
      lastObjectURL = url;
      els.saveLink.href = url;
      els.download.disabled = false;
      setBusy(false);
      logLine('Transcription complete.');
  stopTicker();
      setStatus('Done. You can edit or download the transcript.');
      setProgress(100);
    } else if (type === 'error') {
      setBusy(false);
      logLine(`Error: ${data}`);
  stopTicker();
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
  const model = pickModelName(); const fmt = pickFormat(); setDownloadUIForFormat(fmt);
  setStatus(`Loading model '${model}'…`);
  setProgress(5);
  startTicker(5, 18, 4000); // animate while model downloads
  logLine(`Initializing model: ${model}`);
  // Initialize model and await pipeline-ready before sending audio to avoid race
  const modelReady = new Promise((res) => { awaitingInit = true; resolveInit = res; });
  worker.postMessage({ type: 'init', model });
  (async () => {
    try {
  setStatus('Decoding audio…');
  setProgress(20);
  logLine('Decoding file…');
      const { samples, sampleRate: sr, duration: durSec } = await decodeToMono(file);
  setProgress(30);
  logLine(`Decoded mono ${sr} Hz, duration ~${durSec.toFixed(1)}s`);
      // Ensure model is fully initialized before sending audio
      await modelReady;
      const wantTimestamps = (fmt === 'srt' || fmt === 'vtt');
      if (wantTimestamps) {
        setStatus('Transcribing (with timestamps).');
        setProgress(40);
        logLine('Transcribing with timestamps.');
        startTicker(40, 90, Math.max(4000, durSec * 400));
        worker.postMessage({ type: 'transcribe', audio: { samples, sample_rate: sr }, timestamps: true }, [samples.buffer]);
        return;
      }
      // For long files, stream in chunks to keep memory bounded
      const chunkSec = 20;        // chunk length in seconds
      const strideSec = 5;        // overlap for context
      if (durSec <= chunkSec * 1.2) {
        setStatus('Transcribing…');
        setProgress(40);
        logLine('Transcribing (single batch)…');
        startTicker(40, 85, Math.max(4000, durSec * 400)); // animate during single-shot
        worker.postMessage({ type: 'transcribe', audio: { samples, sample_rate: sr } }, [samples.buffer]);
      } else {
        setStatus('Transcribing (chunked)…');
        logLine('Transcribing in chunks…');
        const chunk = Math.floor(chunkSec * sr);
        const stride = Math.floor(strideSec * sr);
        const step = Math.max(1, chunk - stride);
        const total = Math.max(1, Math.ceil(Math.max(0, samples.length - stride) / step));
        let index = 0;
        for (let start = 0; start < samples.length; start += step) {
          if (!busy) break; // allow Stop
          if (start >= samples.length) break;
          const end = Math.min(samples.length, start + chunk);
          // Copy to a fresh buffer per chunk to avoid detaching the source samples buffer
          const sliceView = samples.subarray(start, end);
          const chunkCopy = new Float32Array(sliceView);
          worker.postMessage({ type: 'chunk', i: index, n: total, audio: { samples: chunkCopy, sample_rate: sr } }, [chunkCopy.buffer]);
          logLine(`Sent chunk ${index+1}/${total} (${((end-start)/sr).toFixed(1)}s)`);
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
      logLine(`Decode failed: ${e?.message || e}`);
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
  logLine('Stopped by user.');
});

els.speed.addEventListener('change', () => {
  // If user toggles speed mid-run, we just reset worker so next run uses new model
  if (!busy) terminateWorker();
});

if (els.modelSel) els.modelSel.addEventListener('change', () => {
  const specific = els.modelSel.value && els.modelSel.value !== 'auto';
  if (els.speed) {
    els.speed.disabled = specific;
    if (els.speed.parentElement) els.speed.parentElement.style.opacity = specific ? 0.6 : 1;
  }
  if (!busy) terminateWorker();
});

if (els.format) els.format.addEventListener('change', () => {
  setDownloadUIForFormat(pickFormat());
});

els.download.addEventListener('click', () => {
  if (els.saveLink.href) {
    els.saveLink.click();
  logLine('Downloaded transcript.');
  }
});

if (els.clearLog) els.clearLog.addEventListener('click', () => { if (els.log) els.log.textContent=''; });

setStatus('Ready. Drop an audio file, click Select Audio, or press Record.');
setDownloadUIForFormat(pickFormat());

// Recording controls
function pickRecordingMime(){
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const m of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m;
  }
  return undefined; // let browser pick
}

async function startRecording(){
  try {
    resetRecording();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickRecordingMime();
    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recChunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const outType = mediaRecorder.mimeType || mimeType || 'audio/webm';
      recBlob = new Blob(recChunks, { type: outType });
      recUrl = URL.createObjectURL(recBlob);
      if (els.preview) { els.preview.src = recUrl; els.preview.hidden = false; }
      if (els.transcribeRec) els.transcribeRec.disabled = false;
      if (els.recStatus) els.recStatus.innerHTML = 'Mic off';
      if (els.record) els.record.textContent = 'Record';
      recActive = false;
      logLine(`Recording complete: ${(recBlob.size/1024).toFixed(1)} KB`);
    };
    mediaRecorder.start();
    recActive = true;
    if (els.recStatus) els.recStatus.innerHTML = '<span class="rec-dot"></span>Recording…';
    if (els.record) els.record.textContent = 'Stop';
    logLine('Recording started.');
  } catch (e) {
    logLine(`Mic error: ${e?.message || e}`);
    if (els.recStatus) els.recStatus.textContent = 'Mic error';
  }
}

function stopRecording(){
  try {
    if (mediaRecorder && recActive) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
  } catch (e) {
    logLine(`Stop error: ${e?.message || e}`);
  }
}

if (els.record) els.record.addEventListener('click', () => {
  if (recActive) stopRecording(); else startRecording();
});

if (els.transcribeRec) els.transcribeRec.addEventListener('click', async () => {
  if (!recBlob) { logLine('No recording available.'); return; }
  // Wrap Blob into a File-like to reuse decodeToMono
  const file = new File([recBlob], 'recording.webm', { type: recBlob.type || 'audio/webm' });
  els.transcribeRec.disabled = true;
  startTranscribe(file);
});
