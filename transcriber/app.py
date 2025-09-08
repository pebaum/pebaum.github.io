import os
import sys
import threading
from pathlib import Path
from dataclasses import dataclass
import shutil
import traceback
from datetime import datetime
import json

import tkinter as tk
from tkinter import filedialog, messagebox, ttk

# Optional runtime accelerator detection libs
try:
    import ctranslate2 as ct2  # type: ignore
except Exception:
    ct2 = None  # type: ignore

try:
    # pip install tkinterdnd2 (module name is lowercase)
    from tkinterdnd2 import DND_FILES, TkinterDnD
    DND_AVAILABLE = True
except Exception:
    DND_AVAILABLE = False

# Defer heavy import until we start transcribing to keep UI snappy
# Default to a public, available model; can override via TRANSCRIBER_MODEL
# Output format: txt, md, srt, vtt, tsv, json
OUTPUT_FORMAT = (os.environ.get("TRANSCRIBER_OUTPUT_FORMAT", "md") or "md").strip().lower()
WHISPER_MODEL = os.environ.get("TRANSCRIBER_MODEL", "large-v3")  # UI picks this by default; user can change
# Optional fixed language (e.g., "en") to skip autodetect and speed up a bit
FIXED_LANGUAGE = os.environ.get("TRANSCRIBER_LANG")
# Speed up model downloads when available (requires 'hf_transfer' package)
os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "1")
# Disable HF progress bars to avoid tqdm writing to a missing stderr in --noconsole builds
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")
os.environ.setdefault("TQDM_DISABLE", "1")
os.environ.setdefault("DISABLE_TQDM", "1")


# Simple file logger to help diagnose issues on end-user machines
def _log_dir() -> Path:
    try:
        # Prefer per-user local app data on Windows
        if os.name == "nt" and os.environ.get("LOCALAPPDATA"):
            base = Path(os.environ["LOCALAPPDATA"]) / "MinimalTranscriber"
            base.mkdir(parents=True, exist_ok=True)
            return base
        # Next, try Documents/MinimalTranscriber
        docs = Path.home() / "Documents" / "MinimalTranscriber"
        docs.mkdir(parents=True, exist_ok=True)
        return docs
    except Exception:
        # Fallback to current working directory
        return Path.cwd()


def log(msg: str):
    try:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{ts}] {msg}\n"
        ( _log_dir() / "transcriber.log" ).open("a", encoding="utf-8").write(line)
    except Exception:
        pass


def choose_device() -> tuple[str, str]:
    # Determine device and compute type for faster-whisper (ctranslate2)
    device_env = os.environ.get("TRANSCRIBER_DEVICE")
    compute_env = os.environ.get("TRANSCRIBER_COMPUTE_TYPE")

    # Simple auto-detect cascade: CUDA -> CPU
    device = device_env
    compute_type = compute_env

    if device is None:
        # Try CUDA lazily to avoid hard dependency when packaging
        try:
            torch = __import__("torch")  # type: ignore
            if getattr(torch, "cuda", None) and torch.cuda.is_available():
                device = "cuda"
        except Exception:
            pass
    if device is None:
        device = "cpu"

    if compute_type is None:
        if device == "cuda":
            compute_type = "float16"
        else:
            compute_type = "int8"

    return device, compute_type


def _supported_compute_type_for(device: str) -> str:
    """Query ctranslate2 for supported compute types and pick a fast, safe default."""
    try:
        if ct2 and hasattr(ct2, "get_supported_compute_types"):
            supported = ct2.get_supported_compute_types(device)
            if device == "cuda":
                for ct in ("float16", "int8_float16", "int8", "float32"):
                    if ct in supported:
                        return ct
            # CPU
            if "int8" in supported:
                return "int8"
            if supported:
                return supported[0]
    except Exception:
        pass
    # Fallbacks
    return "int8" if device == "cpu" else "int8"


def detect_accelerator(preferred: str | None = None) -> tuple[str, str, str, int | None]:
    """Return (device, compute_type, note, cpu_threads).
    Honors TRANSCRIBER_DEVICE / TRANSCRIBER_COMPUTE_TYPE if set.
    Picks CUDA automatically when available; otherwise CPU with tuned threads.
    """
    env_dev = os.environ.get("TRANSCRIBER_DEVICE")
    env_ct = os.environ.get("TRANSCRIBER_COMPUTE_TYPE")

    def cpu_threads_default() -> int:
        return max(1, (os.cpu_count() or 2) - 1)

    # Environment override
    if env_dev in ("cuda", "cpu"):
        device = env_dev
        compute_type = env_ct or _supported_compute_type_for(device)
        note = f"Using device from env: {device} ({compute_type})"
        return device, compute_type, note, (None if device == "cuda" else cpu_threads_default())

    # Preferred override (future UI)
    if preferred in ("cuda", "cpu"):
        device = preferred  # type: ignore[assignment]
        compute_type = env_ct or _supported_compute_type_for(device)
        note = f"Using preferred device: {device} ({compute_type})"
        return device, compute_type, note, (None if device == "cuda" else cpu_threads_default())

    # Auto-detect CUDA via ctranslate2
    try:
        if ct2 and hasattr(ct2, "get_cuda_device_count") and ct2.get_cuda_device_count() > 0:
            device = "cuda"
            compute_type = env_ct or _supported_compute_type_for("cuda")
            note = f"CUDA GPU detected; using {compute_type}"
            return device, compute_type, note, None
    except Exception:
        pass

    # CPU fallback
    device = "cpu"
    compute_type = env_ct or _supported_compute_type_for("cpu")
    threads = cpu_threads_default()
    note = f"No CUDA GPU detected; using CPU ({compute_type}) with {threads} threads."
    # Informational: detect presence of alternative providers (not used by CT2)
    try:
        import onnxruntime as ort  # type: ignore
        provs = set(ort.get_available_providers() or [])
        if "QNNExecutionProvider" in provs:
            note += " QNN (Qualcomm NPU) detected (informational)."
        if "DmlExecutionProvider" in provs:
            note += " DirectML provider detected (informational)."
    except Exception:
        pass
    return device, compute_type, note, threads


def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def prefer_bundled_ffmpeg():
    """If packaged, add bundled ffmpeg folder to PATH so decoding works without system install."""
    try:
        base_paths = []
        # When running from PyInstaller onefile, data extracts to _MEIPASS
        _MEIPASS = getattr(sys, "_MEIPASS", None)
        if _MEIPASS:
            base_paths.append(Path(_MEIPASS) / "ffmpeg")
        # When running from source or one-folder dist, look relative to script dir
        base_paths.append(Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent)) / "ffmpeg")
        base_paths.append(Path(__file__).resolve().parent / "ffmpeg")

        for p in base_paths:
            bin_ffmpeg = p / "ffmpeg.exe"
            if bin_ffmpeg.exists():
                os.environ["PATH"] = str(p) + os.pathsep + os.environ.get("PATH", "")
                break
    except Exception:
        pass


def _fallback_model_name(name: str) -> str:
    """Return a safe fallback alias when a requested name isn't publicly available."""
    n = (name or "").strip().lower()
    if n in {"large-v3-turbo", "whisper-large-v3-turbo", "faster-whisper-large-v3-turbo"}:
        return "large-v3"
    return name


def resolve_model_repo(name: str) -> str | Path:
    # If it's a local path, use it directly
    safe_name = _fallback_model_name(name)
    p = Path(safe_name)
    if p.exists():
        return p
    # If it looks like a HF repo id, pass through
    if "/" in safe_name:
        return safe_name
    # Map common aliases to SYSTRAN faster-whisper repos
    aliases = {
        "large-v3": "Systran/faster-whisper-large-v3",
        # No public CT2 repo for -turbo; fallback to large-v3 transparently
        "large-v3-turbo": "Systran/faster-whisper-large-v3",
        "medium": "Systran/faster-whisper-medium",
        "small": "Systran/faster-whisper-small",
    "small.en": "Systran/faster-whisper-small.en",
        "base": "Systran/faster-whisper-base",
    "base.en": "Systran/faster-whisper-base.en",
        "tiny": "Systran/faster-whisper-tiny",
    "tiny.en": "Systran/faster-whisper-tiny.en",
    }
    return aliases.get(safe_name, f"Systran/faster-whisper-{safe_name}")


def _is_valid_ct2_model_dir(path: Path) -> bool:
    """Basic sanity check for a CTranslate2 Whisper model directory."""
    try:
        model_bin = path / "model.bin"
        tokenizer = (path / "tokenizer.json")
        config = (path / "config.json")
        if not (model_bin.exists() and tokenizer.exists() and config.exists()):
            return False
        # Guard against Git-LFS pointer or truncated file
        size_mb = model_bin.stat().st_size / (1024 * 1024)
        if size_mb < 10:  # model.bin should be hundreds of MBs
            # Additionally check if file starts with LFS pointer header
            with model_bin.open("rb") as f:
                head = f.read(64)
            if b"version https://git-lfs.github.com/spec" in head:
                return False
            return False
        return True
    except Exception:
        return False


def _pick_best_model_dir(base: Path, compute_type: str) -> Path | None:
    """Given a snapshot base folder, find a subfolder that contains a CT2 model.
    Preference:
      - if compute_type contains 'int8' -> prefer paths with 'int8'
      - if compute_type contains 'float16' -> prefer paths with 'float16' (or generic 'ct2')
    """
    if _is_valid_ct2_model_dir(base):
        return base

    candidates: list[Path] = []
    try:
        for model_bin in base.rglob("model.bin"):
            d = model_bin.parent
            if _is_valid_ct2_model_dir(d):
                candidates.append(d)
    except Exception:
        pass
    if not candidates:
        return None

    def score(p: Path) -> int:
        s = 0
        name = str(p).lower()
        if "int8" in compute_type.lower():
            if "int8" in name:
                s += 3
        if "float16" in compute_type.lower():
            if "float16" in name:
                s += 3
        if "ct2" in name:
            s += 1
        # Slightly prefer shallower dirs
        s -= len(p.parts)
        return s

    candidates.sort(key=score, reverse=True)
    return candidates[0]


def try_get_cached_model_dir(model_name: str) -> Path | None:
    """Return a valid local model dir if already cached; else None."""
    target = resolve_model_repo(model_name)
    if isinstance(target, Path):
        return target if _is_valid_ct2_model_dir(target) else None
    try:
        from huggingface_hub import snapshot_download
        cached = Path(snapshot_download(repo_id=target, local_files_only=True))
        return cached if _is_valid_ct2_model_dir(cached) else None
    except Exception:
        return None

def ensure_model_available(model_name: str) -> Path:
    """Ensure the faster-whisper model exists locally and return its local path.
    Supports local folder paths, HF repo IDs, or shorthand names (e.g., 'large-v3').
    Performs integrity checks and retries download if the cache is incomplete.
    """
    target = resolve_model_repo(model_name)
    # If it's already a local path
    if isinstance(target, Path):
        return target

    # Try to use huggingface_hub to snapshot the model locally
    from huggingface_hub import snapshot_download

    # 1) Try local cache only
    try:
        local_dir = Path(snapshot_download(repo_id=target, local_files_only=True))
        if _is_valid_ct2_model_dir(local_dir):
            return local_dir
    except Exception:
        pass

    # 2) Download/update with resume; then re-validate
    local_dir = Path(
        snapshot_download(
            repo_id=target,
            local_files_only=False,
            resume_download=True,
            force_download=False,
            # Only fetch what we need
            allow_patterns=["*.bin", "*.json", "*.txt"],
            max_workers=int(os.environ.get("HF_HUB_MAX_WORKERS", "8")),
        )
    )
    if _is_valid_ct2_model_dir(local_dir):
        return local_dir

    # 3) Force re-download as a last resort
    local_dir = Path(
        snapshot_download(
            repo_id=target,
            local_files_only=False,
            resume_download=True,
            force_download=True,
            allow_patterns=["*.bin", "*.json", "*.txt"],
            max_workers=int(os.environ.get("HF_HUB_MAX_WORKERS", "8")),
        )
    )
    return local_dir


@dataclass
class AppState:
    busy: bool = False
    status: str = "Drop an audio file or click Select Audio"


class TranscriberApp:
    def __init__(self, root: tk.Tk):
        # State & variables
        self.root = root
        self.state = AppState()
        self._last_output_path = None  # type: ignore[assignment]
        self._model_cache = {}

        # User-configurable
        self.speed_var = tk.BooleanVar(value=bool(int(os.environ.get("TRANSCRIBER_SPEED_MODE", "0") or "0")))
        self.model_var = tk.StringVar(value=WHISPER_MODEL)
        self.format_var = tk.StringVar(value=OUTPUT_FORMAT)
        self.lang_var = tk.StringVar(value=(FIXED_LANGUAGE or ""))
        default_mode = "Speed" if self.speed_var.get() else "Balanced"
        self.mode_var = tk.StringVar(value=default_mode)
        # Advanced toggles
        self.word_ts_var = tk.BooleanVar(value=False)
        self.vad_var = tk.BooleanVar(value=True)
        self.diarize_var = tk.BooleanVar(value=False)
        self.stream_var = tk.BooleanVar(value=True)

        try:
            log("App starting…")
            log(f"Python: {sys.version}")
            log(f"Platform: {sys.platform}")
            log(f"HF_HUB_ENABLE_HF_TRANSFER={os.environ.get('HF_HUB_ENABLE_HF_TRANSFER')}")
        except Exception:
            pass

        # Window
        self.root.title("Minimal Transcriber")
        self.root.geometry("700x560")
        self.root.minsize(660, 460)

        # Layout
        self.frame = tk.Frame(self.root, padx=16, pady=16)
        self.frame.pack(fill=tk.BOTH, expand=True)

        controls = tk.Frame(self.frame)
        controls.pack(fill=tk.X, pady=(0, 8))
        tk.Label(controls, text="Model:").pack(side=tk.LEFT)
        self.model_combo = ttk.Combobox(controls, textvariable=self.model_var, width=16, state="normal")
        self.model_combo['values'] = ('tiny', 'tiny.en', 'base', 'base.en', 'small', 'small.en', 'medium', 'large-v3')
        self.model_combo.pack(side=tk.LEFT, padx=(4, 12))
        tk.Label(controls, text="Mode:").pack(side=tk.LEFT)
        self.mode_combo = ttk.Combobox(controls, textvariable=self.mode_var, width=10, state="readonly")
        self.mode_combo['values'] = ('Speed', 'Balanced', 'Accuracy')
        self.mode_combo.pack(side=tk.LEFT, padx=(4, 12))
        tk.Label(controls, text="Format:").pack(side=tk.LEFT)
        self.format_combo = ttk.Combobox(controls, textvariable=self.format_var, width=8, state="readonly")
        self.format_combo['values'] = ('txt', 'md', 'srt', 'vtt', 'tsv', 'json')
        self.format_combo.pack(side=tk.LEFT, padx=(4, 12))
        tk.Label(controls, text="Lang:").pack(side=tk.LEFT)
        self.lang_entry = ttk.Entry(controls, textvariable=self.lang_var, width=6)
        self.lang_entry.pack(side=tk.LEFT, padx=(4, 0))

        adv = tk.Frame(self.frame)
        adv.pack(fill=tk.X, pady=(0, 6))
        ttk.Checkbutton(adv, text="Word TS", variable=self.word_ts_var).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Checkbutton(adv, text="VAD", variable=self.vad_var).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Checkbutton(adv, text="Diarize", variable=self.diarize_var).pack(side=tk.LEFT, padx=(0, 8))
        ttk.Checkbutton(adv, text="Stream", variable=self.stream_var).pack(side=tk.LEFT, padx=(0, 8))
        tk.Button(adv, text="Batch Folder…", command=self.pick_folder_batch).pack(side=tk.RIGHT)

        self.label = tk.Label(
            self.frame,
            text=self.state.status,
            anchor="center",
            justify="center",
            wraplength=640,
            fg="#e0e0e0",
            bg="#222222",
            relief=tk.RIDGE,
            padx=16,
            pady=20,
            font=("Segoe UI", 11),
        )
        self.label.pack(fill=tk.X, pady=(0, 10))

        self.button = tk.Button(self.frame, text="Select Audio", command=self.pick_file, width=16)
        self.button.pack(pady=(0, 10))

        preview_frame = tk.Frame(self.frame)
        preview_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 8))
        tk.Label(preview_frame, text="Live Preview:").pack(anchor="w")
        self.preview = tk.Text(preview_frame, height=10, wrap="word", font=("Segoe UI", 10))
        self.preview.configure(state=tk.DISABLED)
        self.preview.pack(fill=tk.BOTH, expand=True)

        self.progress = ttk.Progressbar(self.frame, orient=tk.HORIZONTAL, length=560, mode='determinate')
        self.progress.pack(pady=(4, 8))
        self.progress['value'] = 0

        btns = tk.Frame(self.frame)
        btns.pack(pady=(0, 4))
        self.open_btn = tk.Button(btns, text="Open Output Folder", command=self.open_output_folder, state=tk.DISABLED)
        self.open_btn.pack(side=tk.LEFT, padx=(0, 8))
        self.copy_btn = tk.Button(btns, text="Copy Preview", command=self.copy_preview, state=tk.NORMAL)
        self.copy_btn.pack(side=tk.LEFT)

        self.logs_btn = tk.Button(self.frame, text="Open Logs", command=self.open_logs)
        self.logs_btn.pack(pady=(4, 0))

        if DND_AVAILABLE and isinstance(self.root, TkinterDnD.Tk):
            self.label.drop_target_register(DND_FILES)
            self.label.dnd_bind('<<Drop>>', self.on_drop)

    def set_status(self, text: str):
        # Thread-safe status update using the Tk event loop
        def apply():
            self.state.status = text
            self.label.config(text=text)
        try:
            log(f"STATUS: {text}")
            self.root.after(0, apply)
        except Exception:
            # In some shutdown races, just ignore
            pass

    def clear_preview(self):
        try:
            def apply():
                self.preview.configure(state=tk.NORMAL)
                self.preview.delete("1.0", tk.END)
                self.preview.configure(state=tk.DISABLED)
            self.root.after(0, apply)
        except Exception:
            pass

    def append_preview(self, text: str):
        if not text:
            return
        try:
            def apply():
                self.preview.configure(state=tk.NORMAL)
                self.preview.insert(tk.END, text + "\n")
                self.preview.see(tk.END)
                self.preview.configure(state=tk.DISABLED)
            self.root.after(0, apply)
        except Exception:
            pass

    def copy_preview(self):
        try:
            text = self.preview.get("1.0", tk.END).strip()
            self.root.clipboard_clear()
            if text:
                self.root.clipboard_append(text)
        except Exception:
            pass

    def set_progress(self, value: float | None = None, indeterminate: bool = False):
        def apply():
            try:
                if indeterminate:
                    self.progress.config(mode='indeterminate')
                    self.progress.start(20)
                else:
                    if self.progress['mode'] != 'determinate':
                        self.progress.stop()
                        self.progress.config(mode='determinate')
                    if value is not None:
                        self.progress['value'] = max(0, min(100, value))
            except Exception:
                pass
        try:
            self.root.after(0, apply)
        except Exception:
            pass

    def pick_file(self):
        if self.state.busy:
            return
        if not ffmpeg_available():
            messagebox.showwarning(
                "FFmpeg not found",
                "FFmpeg is required for audio decoding. Please install FFmpeg and ensure it is in your PATH.",
            )
        filetypes = [
            ("Audio", ".mp3 .m4a .wav .flac .ogg .aac .wma .mp4 .mkv"),
            ("All files", "*.*"),
        ]
        path = filedialog.askopenfilename(title="Select audio file", filetypes=filetypes)
        if path:
            self.start_transcription(Path(path))

    def on_drop(self, event):
        if self.state.busy:
            return
        # event.data can be a list-like string with braces, handle simply
        paths = self.root.splitlist(event.data)
        if not paths:
            return
        p = Path(paths[0])
        if p.exists():
            self.start_transcription(p)

    def start_transcription(self, audio_path: Path):
        if self.state.busy:
            return
        if not ffmpeg_available():
            self.set_status("FFmpeg not found. Please install FFmpeg and add it to PATH.")
            def show_warn():
                messagebox.showwarning(
                    "FFmpeg not found",
                    "FFmpeg is required for audio decoding. Please install FFmpeg and ensure it is in your PATH.",
                )
            try:
                self.root.after(0, show_warn)
            except Exception:
                pass
            self.state.busy = False
            return
        self.state.busy = True
        # Reset UI state
        # Reset live preview
        self.clear_preview()
        # Resolve settings from UI (fall back to env defaults)
        def _ext_for(fmt: str) -> str:
            f = (fmt or "md").strip().lower()
            return f if f in {"txt","md","srt","vtt","tsv","json"} else "md"
        chosen_format = _ext_for(self.format_var.get() if hasattr(self, 'format_var') else OUTPUT_FORMAT)
        self._last_output_path = audio_path.with_suffix(f".{chosen_format}")
        self.open_btn.config(state=tk.DISABLED)
        self.set_progress(0)
        self.set_status(
            f"Loading model '{self.model_var.get()}' and preparing…\n"
            f"Audio: {audio_path}\n"
            f"Output will be saved to: {self._last_output_path}"
        )
        self.set_progress(indeterminate=True)
        try:
            log(f"Starting transcription: {audio_path}")
            log(f"Output planned: {self._last_output_path}")
        except Exception:
            pass

        thread = threading.Thread(target=self._transcribe_worker, args=(audio_path, chosen_format), daemon=True)
        thread.start()

    # ---------------- Batch Processing -----------------
    def pick_folder_batch(self):
        if self.state.busy:
            return
        folder = filedialog.askdirectory(title="Select folder containing audio files")
        if not folder:
            return
        exts = {'.mp3','.wav','.m4a','.flac','.ogg','.aac','.wma','.mp4','.mkv'}
        files = [p for p in Path(folder).iterdir() if p.is_file() and p.suffix.lower() in exts]
        if not files:
            messagebox.showinfo("Batch", "No supported audio files found in selected folder.")
            return
        self.state.busy = True
        self.clear_preview()
        self.set_status(f"Batch starting: {len(files)} files…")
        threading.Thread(target=self._batch_worker, args=(files,), daemon=True).start()

    def _batch_worker(self, files: list[Path]):
        completed = 0
        total = len(files)
        for f in files:
            self.set_status(f"Batch {completed+1}/{total}: {f.name}")
            try:
                # Reuse internal worker logic (non-batch path) by calling _transcribe_worker directly
                # Provide currently selected format
                fmt = (self.format_var.get() or OUTPUT_FORMAT).strip().lower()
                self._transcribe_worker(f, fmt, batch_mode=True)
            except Exception as e:
                log(f"Batch file error {f}: {e}")
            completed += 1
        self.set_status(f"Batch complete: {completed}/{total} files processed.")
        self.state.busy = False

    # ---------------- Formatting Helpers -----------------
    @staticmethod
    def _format_timestamp(seconds: float, *, for_vtt: bool = False) -> str:
        ms = int(round(seconds * 1000))
        hrs, rem = divmod(ms, 3600_000)
        mins, rem = divmod(rem, 60_000)
        secs, ms = divmod(rem, 1000)
        sep = '.' if for_vtt else ','
        if hrs > 0:
            return f"{hrs:02d}:{mins:02d}:{secs:02d}{sep}{ms:03d}"
        return f"00:{mins:02d}:{secs:02d}{sep}{ms:03d}"

    @classmethod
    def _render_output(cls, out_format: str, seg_items: list[tuple[float,float,str]], meta: dict) -> str:
        out_format = out_format.lower()
        if out_format in {"txt", "md"}:
            # md identical to txt for now; could add headings.
            return "\n".join(t for _,_,t in seg_items)
        if out_format == "srt":
            lines = []
            for i, (st, en, txt) in enumerate(seg_items, start=1):
                lines.append(str(i))
                lines.append(f"{cls._format_timestamp(st)} --> {cls._format_timestamp(en)}")
                lines.append(txt.strip())
                lines.append("")
            return "\n".join(lines).strip() + "\n"
        if out_format == "vtt":
            lines = ["WEBVTT", ""]
            for (st, en, txt) in seg_items:
                lines.append(f"{cls._format_timestamp(st, for_vtt=True)} --> {cls._format_timestamp(en, for_vtt=True)}")
                lines.append(txt.strip())
                lines.append("")
            return "\n".join(lines).strip() + "\n"
        if out_format == "tsv":
            lines = ["start\tend\ttext"]
            for (st, en, txt) in seg_items:
                safe = txt.replace('\t',' ').replace('\n',' ').strip()
                lines.append(f"{st:.3f}\t{en:.3f}\t{safe}")
            return "\n".join(lines) + "\n"
        if out_format == "json":
            try:
                return json.dumps({
                    "metadata": meta,
                    "segments": [
                        {"start": round(st,3), "end": round(en,3), "text": txt.strip()} for (st,en,txt) in seg_items
                    ]
                }, ensure_ascii=False, indent=2) + "\n"
            except Exception:
                # Fallback: minimal JSON lines
                return "\n".join(json.dumps({"start":st, "end":en, "text":txt}, ensure_ascii=False) for (st,en,txt) in seg_items)
        # default plain text
        return "\n".join(t for _,_,t in seg_items)

    def _transcribe_worker(self, audio_path: Path, out_format: str, batch_mode: bool = False):
        try:
            # Decide accelerator first (affects which subdir we pick)
            device, compute_type, accel_note, cpu_threads = detect_accelerator()
            log(f"Accelerator: {accel_note}")
            # Ensure model present (show spinner while downloading)
            # Choose model dynamically when Speed mode is enabled
            ui_model = self.model_var.get().strip() or WHISPER_MODEL
            chosen_model = ui_model
            # Mode-based automatic downsizing for speed if user picked a large model but wants Speed on CPU
            if self.mode_var.get() == "Speed" and device == "cpu":
                lang_ui = (self.lang_var.get() or FIXED_LANGUAGE or "").strip().lower()
                if ui_model in {"large-v3", "medium"}:  # downscale automatically
                    chosen_model = "small.en" if lang_ui in {"en", "english"} else "small"
            self.set_status(f"Checking model '{chosen_model}'…")
            self.set_progress(indeterminate=True)
            local_model_dir = None
            # Show a clear message if this is a first-time download
            if try_get_cached_model_dir(chosen_model) is None:
                self.set_status(
                    f"Downloading model '{chosen_model}' (first run)…\n"
                    f"This can take several minutes. We'll start automatically when ready."
                )
            snapshot_root = ensure_model_available(chosen_model)
            log(f"Model snapshot_root: {snapshot_root}")
            picked = _pick_best_model_dir(snapshot_root, compute_type)
            local_model_dir = picked or snapshot_root
            log(f"Picked model dir: {local_model_dir}")
            # -------- Model load with caching ---------
            def _load_model() -> object:
                from faster_whisper import WhisperModel  # type: ignore
                ct_key = (chosen_model, device, compute_type)
                if ct_key in self._model_cache:
                    return self._model_cache[ct_key]
                base_cpu_threads = cpu_threads if (device == "cuda") else max(1, int(cpu_threads or (os.cpu_count() or 4)))
                num_workers = 2 if device == "cpu" else 1
                try:
                    if local_model_dir and _is_valid_ct2_model_dir(local_model_dir):
                        mdl = WhisperModel(
                            str(local_model_dir), device=device, compute_type=compute_type,
                            cpu_threads=base_cpu_threads, num_workers=num_workers
                        )
                        self._model_cache[ct_key] = mdl
                        return mdl
                except Exception:
                    log("Primary load failed; attempting repair path…")
                # Attempt repair if local path failed
                if local_model_dir and _is_valid_ct2_model_dir(local_model_dir):
                    try:
                        from huggingface_hub import snapshot_download
                        self.set_status("Repairing model cache…")
                        repaired_root = Path(
                            snapshot_download(
                                repo_id=resolve_model_repo(chosen_model),
                                local_files_only=False,
                                resume_download=True,
                                force_download=True,
                                allow_patterns=["*.bin", "*.json", "*.txt"],
                            )
                        )
                        repaired_dir = _pick_best_model_dir(repaired_root, compute_type) or repaired_root
                        mdl = WhisperModel(
                            str(repaired_dir), device=device, compute_type=compute_type,
                            cpu_threads=base_cpu_threads, num_workers=num_workers
                        )
                        self._model_cache[ct_key] = mdl
                        return mdl
                    except Exception:
                        log("Repair attempt failed; falling back to alias load…")
                # Fallback alias load
                self.set_status("Falling back to direct model download…")
                mdl = WhisperModel(
                    _fallback_model_name(chosen_model), device=device, compute_type=compute_type,
                    cpu_threads=base_cpu_threads, num_workers=num_workers
                )
                self._model_cache[ct_key] = mdl
                return mdl

            model = _load_model()

            # Transcription parameter presets by mode
            mode = self.mode_var.get()
            preset = {
                "Speed": dict(beam_size=1, temperature=0.0, condition_on_previous_text=False, vad=False),
                "Balanced": dict(beam_size=1, temperature=0.0, condition_on_previous_text=True, vad=True),
                "Accuracy": dict(beam_size=5, temperature=[0.0,0.2,0.4], condition_on_previous_text=True, vad=True),
            }.get(mode, {"beam_size":1, "temperature":0.0, "condition_on_previous_text":False, "vad":True})
            # Environment can force VAD
            env_vad = os.environ.get("TRANSCRIBER_VAD")
            if env_vad is not None:
                try:
                    preset["vad"] = bool(int(env_vad))
                except Exception:
                    pass
            user_lang = (self.lang_var.get() or "").strip() or (FIXED_LANGUAGE or "").strip() or None
            self.set_status(f"Transcribing ({mode}) on {device} ({compute_type})…\n{audio_path.name}")
            # Switch to determinate once we start getting duration info
            self.set_progress(0, indeterminate=False)

            log("Starting model.transcribe()…")
            try:
                env_workers = os.environ.get("TRANSCRIBER_NUM_WORKERS")
                if env_workers is not None:
                    num_workers = max(1, int(env_workers))
            except Exception:
                pass
            # Word timestamps only when JSON and not Speed (accuracy cost otherwise)
            # Word timestamps user toggle overrides default (JSON enables by default if toggle off)
            want_word_ts = bool(self.word_ts_var.get()) or ((out_format.lower() == 'json') and (mode != 'Speed') and not self.word_ts_var.get())
            segments, info = model.transcribe(  # type: ignore[attr-defined]
                str(audio_path),
                vad_filter=bool(self.vad_var.get()) if self.vad_var is not None else bool(preset.get("vad", True)),
                beam_size=preset.get("beam_size", 1),
                temperature=preset.get("temperature", 0.0),
                condition_on_previous_text=bool(preset.get("condition_on_previous_text", False)),
                language=user_lang,
                word_timestamps=want_word_ts,
                patience=1.0 if preset.get("beam_size",1) > 1 else None,
            )
            try:
                log(f"Transcribe info: duration={getattr(info, 'duration', None)} language={getattr(info, 'language', None)}")
            except Exception:
                pass

            # Progress tracking based on segment end time
            collected: list[str] = []  # only for JSON or post-processing
            seg_items: list[tuple[float, float, str]] = []  # for JSON
            # Prepare streaming writer if enabled and not JSON
            streaming = bool(self.stream_var.get()) and out_format.lower() != 'json'
            out_path_stream = self._last_output_path if not batch_mode else audio_path.with_suffix(f".{out_format}")
            srt_index = 1
            if streaming:
                try:
                    with out_path_stream.open('w', encoding='utf-8', newline='\n') as sf:
                        if out_format == 'vtt':
                            sf.write('WEBVTT\n\n')
                        if out_format == 'tsv':
                            sf.write('start\tend\ttext\n')
                except Exception as e:
                    log(f"Failed to init streaming file: {e}")
            last_pct = 0.0
            total = max(1.0, float(getattr(info, 'duration', 0.0) or 0.0))
            for seg in segments:
                text = (seg.text or '').strip()
                if text:
                    collected.append(text)
                    try:
                        st = float(getattr(seg, 'start', 0.0) or 0.0)
                        en = float(getattr(seg, 'end', 0.0) or 0.0)
                    except Exception:
                        st = 0.0; en = 0.0
                    # Optional diarization speaker assignment will happen later; placeholder
                    seg_text_for_write = text
                    seg_items.append((st, en, seg_text_for_write))
                    self.append_preview(seg_text_for_write)
                    # Stream write
                    if streaming:
                        try:
                            with out_path_stream.open('a', encoding='utf-8', newline='\n') as sf:
                                if out_format in {'txt','md'}:
                                    sf.write(seg_text_for_write + '\n')
                                elif out_format == 'srt':
                                    from_ts = self._format_timestamp(st)
                                    to_ts = self._format_timestamp(en)
                                    sf.write(f"{srt_index}\n{from_ts} --> {to_ts}\n{seg_text_for_write}\n\n")
                                    srt_index += 1
                                elif out_format == 'vtt':
                                    from_ts = self._format_timestamp(st, for_vtt=True)
                                    to_ts = self._format_timestamp(en, for_vtt=True)
                                    sf.write(f"{from_ts} --> {to_ts}\n{seg_text_for_write}\n\n")
                                elif out_format == 'tsv':
                                    safe = seg_text_for_write.replace('\t',' ').replace('\n',' ').strip()
                                    sf.write(f"{st:.3f}\t{en:.3f}\t{safe}\n")
                        except Exception as e:
                            log(f"Stream write error: {e}")
                # Update progress
                try:
                    end = float(getattr(seg, 'end', 0.0) or 0.0)
                    pct = min(99.0, (end / total) * 100.0)
                    if pct - last_pct >= 0.5:
                        last_pct = pct
                        self.set_progress(pct)
                        self.set_status(
                            f"Transcribing ({mode}) on {device} ({compute_type})… {pct:0.1f}%\n{audio_path.name}\n"
                            f"Output: {self._last_output_path}"
                        )
                except Exception:
                    pass

            # Assemble output in requested format
            meta = {
                "audio": audio_path.name,
                "model": chosen_model,
                "device": device,
                "compute_type": compute_type,
                "mode": mode,
                "language": getattr(info, 'language', user_lang),
                "duration": getattr(info, 'duration', None),
                "generated_at": datetime.utcnow().isoformat() + 'Z',
                "word_timestamps": want_word_ts,
            }
            # Optional diarization pass (only if user requested and library available)
            if self.diarize_var.get():
                try:
                    token = os.environ.get('PYANNOTE_TOKEN')
                    from pyannote.audio import Pipeline  # type: ignore
                    if token:
                        diar_pipe = Pipeline.from_pretrained("pyannote/speaker-diarization", use_auth_token=token)
                    else:
                        diar_pipe = Pipeline.from_pretrained("pyannote/speaker-diarization")
                    diar = diar_pipe(str(audio_path))
                    # Build speaker timeline list for fast lookup
                    speaker_segments = []
                    for turn, _, speaker in diar.itertracks(yield_label=True):
                        speaker_segments.append((turn.start, turn.end, speaker))
                    # Assign speaker by maximal overlap
                    def assign_speaker(st: float, en: float) -> str:
                        best = None
                        best_ov = 0.0
                        for ds, de, sp in speaker_segments:
                            ov = max(0.0, min(en, de) - max(st, ds))
                            if ov > best_ov:
                                best_ov = ov; best = sp
                        return best or "Speaker?"
                    new_seg_items = []
                    for (st,en,txt) in seg_items:
                        spk = assign_speaker(st,en)
                        new_seg_items.append((st,en,f"{spk}: {txt}"))
                    seg_items = new_seg_items
                    # If streaming already wrote plain lines without speaker, we won't rewrite; future improvement could patch file.
                except Exception as e:
                    log(f"Diarization failed: {e}")
            if not streaming or out_format.lower() == 'json':
                rendered = self._render_output(out_format, seg_items, meta)
                out_path = self._last_output_path if not batch_mode else audio_path.with_suffix(f".{out_format}")
                self.set_status(f"Saving transcript…\n{out_path}")
                try:
                    with out_path.open("w", encoding="utf-8", newline="\n") as f:
                        f.write(rendered)
                except Exception as e:
                    log(f"Failed writing output: {e}")
                    try:
                        alt = out_path.with_suffix('.txt')
                        with alt.open('w', encoding='utf-8', newline='\n') as f:
                            f.write("\n".join(t for _,_,t in seg_items))
                        self._last_output_path = alt
                    except Exception:
                        pass
                else:
                    self._last_output_path = out_path
            else:
                # streaming already wrote file; set final path (batch aware)
                if batch_mode:
                    self._last_output_path = audio_path.with_suffix(f".{out_format}")

            # Finish
            self.set_progress(100)
            if batch_mode:
                self.set_status(f"Done (batch item). Saved: {self._last_output_path}")
            else:
                self.set_status(f"Done. Saved: {self._last_output_path}")
            def enable_open():
                try:
                    self.open_btn.config(state=tk.NORMAL)
                except Exception:
                    pass
            self.root.after(0, enable_open)
        except Exception as e:
            self.set_status("Error during transcription.")
            try:
                tb = traceback.format_exc()
                log(f"ERROR: {e}\n{tb}")
            except Exception:
                pass
            # Show the messagebox on the UI thread
            def show_err():
                messagebox.showerror("Transcription Error", f"{e}\n\nA detailed log was saved to: {_log_dir() / 'transcriber.log'}")
            try:
                self.root.after(0, show_err)
            except Exception:
                pass
        finally:
            self.state.busy = False

    def open_output_folder(self):
        p = self._last_output_path
        if p and p.exists():
            try:
                # On Windows, os.startfile opens Explorer
                os.startfile(str(p.parent))  # type: ignore[attr-defined]
            except Exception:
                try:
                    import subprocess
                    subprocess.Popen(["explorer", str(p.parent)])
                except Exception:
                    pass

    def open_logs(self):
        try:
            folder = _log_dir()
            if os.name == "nt":
                os.startfile(str(folder))  # type: ignore[attr-defined]
            else:
                import subprocess
                subprocess.Popen(["xdg-open", str(folder)])
        except Exception:
            pass


def main():
    prefer_bundled_ffmpeg()
    try:
        log(f"ffmpeg on PATH: {shutil.which('ffmpeg')}")
    except Exception:
        pass
    # Prefer DnD root if available
    if DND_AVAILABLE:
        root = TkinterDnD.Tk()
    else:
        root = tk.Tk()
    app = TranscriberApp(root)
    root.configure(bg="#1e1e1e")
    root.mainloop()


if __name__ == "__main__":
    main()
