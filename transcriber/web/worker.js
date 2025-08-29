// Web Worker (module): in-browser Whisper via Transformers.js (ONNX/WASM backend)
// Loads tiny/base Whisper models and runs fully client-side in a static site.

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js';

let asr = null; // pipeline instance
let currentModelId = null;
let dlTotals = new Map(); // file -> total bytes
let dlLoaded = new Map(); // file -> loaded bytes
let chunkBuffer = '';

function post(type, data){ self.postMessage({ type, data }); }
function status(s){ post('status', s); }
function progress(p){ post('progress', p); }

// Configure runtime: cache in-browser, use WASM backend by default
env.allowLocalModels = false;
env.useBrowserCache = true;
// Optional: tune WASM paths (not required; defaults to CDN)
// env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/wasm';

function mapModel(name){
  // Map short names to hosted models
  // tiny -> Xenova/whisper-tiny, tiny.en -> Xenova/whisper-tiny.en, etc.
  const base = 'Xenova/whisper-';
  const key = String(name || 'tiny.en').toLowerCase();
  const valid = ['tiny','tiny.en','base','base.en'];
  const pick = valid.includes(key) ? key : 'tiny.en';
  return base + pick;
}

function fmtMB(bytes){
  if (!bytes || !isFinite(bytes)) return '0 MB';
  return (bytes / (1024*1024)).toFixed(1) + ' MB';
}

function handleDownloadProgress(ev){
  // ev may include { file, loaded, total, progress, status }
  try {
    const file = ev?.file || 'model';
    const loaded = Number(ev?.loaded ?? 0);
    const total = Number(ev?.total ?? 0);
    if (total > 0) dlTotals.set(file, total);
    if (loaded >= 0) dlLoaded.set(file, loaded);
    let sumT = 0, sumL = 0;
    for (const t of dlTotals.values()) sumT += t;
    for (const l of dlLoaded.values()) sumL += l;
    if (sumT > 0) {
      const pct = 5 + Math.max(0, Math.min(1, sumL / sumT)) * 30; // map 5-35%
      progress(Math.round(pct));
      status(`Downloading model… ${fmtMB(sumL)} / ${fmtMB(sumT)} (${Math.round((sumL/sumT)*100)}%)`);
    } else {
      // Unknown total: show activity
      progress(8);
      status('Downloading model…');
    }
  } catch {}
}

async function ensurePipeline(modelName){
  const modelId = mapModel(modelName);
  if (asr && currentModelId === modelId) return;
  status(`Loading model '${modelId}'…`);
  // Reset trackers and nudge bar
  dlTotals = new Map(); dlLoaded = new Map();
  progress(6);
  // Quantized for speed; will fetch model + tokenizer + feature-extractor on first use
  asr = await pipeline('automatic-speech-recognition', modelId, {
    quantized: true,
    progress_callback: handleDownloadProgress,
  });
  // Snap to end of download phase
  progress(35);
  currentModelId = modelId;
}

async function transcribePcmFloat({ samples, sample_rate }){
  if (!asr) throw new Error('Pipeline not initialized');
  status('Preprocessing…');
  progress(40);
  // Basic chunking to reduce memory for long files
  const opts = {
    sampling_rate: sample_rate || 16000,
    // Smaller chunks for web; adjust if needed
    chunk_length_s: 20,
    stride_length_s: 5,
    // Disable timestamps for speed
    return_timestamps: false,
  };
  // Note: Transformers.js accepts Float32Array directly.
  // Inference
  status('Transcribing…');
  progress(55);
  const res = await asr(samples, opts);
  const text = (res && (res.text || res)) || '';
  progress(95);
  post('result', text);
}

self.onmessage = async (ev) => {
  const { type, model, audio, i, n } = ev.data || {};
  try {
    if (type === 'init') {
      await ensurePipeline(model);
      post('ready');
    } else if (type === 'transcribe') {
      // audio = { samples: Float32Array, sample_rate: number }
      await transcribePcmFloat(audio);
    } else if (type === 'chunk') {
      // audio = { samples: Float32Array, sample_rate: number }
      if (!asr) throw new Error('Pipeline not initialized');
      const opts = { sampling_rate: audio.sample_rate || 16000, return_timestamps: false };
      status(`Transcribing chunk ${i+1}/${n}…`);
      const res = await asr(audio.samples, opts);
      const text = (res && (res.text || res)) || '';
      // Simple spacing between chunks
      if (text) {
        if (chunkBuffer && !chunkBuffer.endsWith('\n')) chunkBuffer += ' ';
        chunkBuffer += text.trim();
      }
      // Progress: map chunks to 10%..95%
  const pct = Math.max(10, Math.min(95, Math.round(10 + ((i+1)/n) * 80)));
      progress(pct);
    } else if (type === 'finish') {
      status('Finalizing…');
      progress(100);
      const out = (chunkBuffer || '').trim();
      chunkBuffer = '';
      post('result', out);
    }
  } catch (e) {
    post('error', String(e?.message || e));
  }
};

post('ready');
