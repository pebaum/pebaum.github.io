// Web Worker (module): in-browser Whisper via Transformers.js (ONNX/WASM backend)
// Loads tiny/base Whisper models and runs fully client-side in a static site.

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers/dist/transformers.min.js';

let asr = null; // pipeline instance
let currentModelId = null;

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

async function ensurePipeline(modelName){
  const modelId = mapModel(modelName);
  if (asr && currentModelId === modelId) return;
  status(`Loading model '${modelId}'…`);
  // Quantized for speed; will fetch model + tokenizer + feature-extractor on first use
  asr = await pipeline('automatic-speech-recognition', modelId, { quantized: true });
  currentModelId = modelId;
}

async function transcribePcmFloat({ samples, sample_rate }){
  if (!asr) throw new Error('Pipeline not initialized');
  status('Transcribing…');
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
  const res = await asr(samples, opts);
  const text = (res && (res.text || res)) || '';
  post('result', text);
}

self.onmessage = async (ev) => {
  const { type, model, audio } = ev.data || {};
  try {
    if (type === 'init') {
      await ensurePipeline(model);
      post('ready');
    } else if (type === 'transcribe') {
      // audio = { samples: Float32Array, sample_rate: number }
      await transcribePcmFloat(audio);
    }
  } catch (e) {
    post('error', String(e?.message || e));
  }
};

post('ready');
