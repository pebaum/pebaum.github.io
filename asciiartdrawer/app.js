// ASCII Art Drawer - Monospace grid with per-cell foreground/background and export
"use strict";

// Allowed symbols (unique) + blank (as eraser)
const SYMBOLS = [
  // Shades
  "\u2591","\u2592","\u2593",
  // Box drawing (light)
  "\u2500","\u2502","\u250C","\u2510","\u2514","\u2518","\u252C","\u2534","\u251C","\u2524","\u253C",
  // Double lines
  "\u2550","\u2551","\u2554","\u2557","\u255A","\u255D","\u2566","\u2569","\u2560","\u2563","\u256C"
];
const BLANK = " ";

// Default swatch colors
const SWATCHES = [
  "#000000", "#222222", "#666666", "#999999", "#cccccc", "#ffffff",
  "#e11d48", "#ef4444", "#f59e0b", "#fbbf24", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#a855f7", "#d946ef", "#b45309"
];

// Quick slot digits mapping order 1..9,0
const SLOT_KEYS = ["1","2","3","4","5","6","7","8","9","0"];

// Elements
const gridEl = document.getElementById("grid");
const slotsEl = document.getElementById("slots");
const symbolPaletteEl = document.getElementById("symbolPalette");
const colorSwatchesEl = document.getElementById("colorSwatches");
const colorPickerEl = document.getElementById("colorPicker");
const colorPreviewEl = document.getElementById("currentColorPreview");
const bgSwatchesEl = document.getElementById("bgSwatches");
const bgColorPickerEl = document.getElementById("bgColorPicker");
const bgColorPreviewEl = document.getElementById("currentBgPreview");
const fillBgBtn = document.getElementById("fillBgBtn");
const brushModesEl = document.getElementById("brushModes");
const clearBtn = document.getElementById("clearBtn");
const exportTxtBtn = document.getElementById("exportTxtBtn");
const exportHtmlBtn = document.getElementById("exportHtmlBtn");
const colsInput = document.getElementById("colsInput");
const rowsInput = document.getElementById("rowsInput");
const resizeBtn = document.getElementById("resizeBtn");
const cursorPreview = document.getElementById("cursorPreview");
const textModeBtn = document.getElementById("textModeBtn");
const themeToggle = document.getElementById("themeToggle");

// State
let cols = parseInt(colsInput.value, 10) || 64;
let rows = parseInt(rowsInput.value, 10) || 64; // 64x64 at 16px => 1024px square
let activeColor = colorPickerEl.value;
let activeBgColor = bgColorPickerEl.value;
let activeSymbol = "\u2500"; // '─'
let isDrawing = false;
let brushMode = "text"; // 'text' | 'bg' | 'both'
let typingMode = false;  // when true, clicking sets caret and typing inserts text
let caretX = 0, caretY = 0;
let grid = []; // 2D array of { ch, color, bg }

// Slots: mapping from index 0..9 to assigned symbol
let slots = [
  "\u2500","\u2502","\u250C","\u2510","\u2514","\u2518","\u253C","\u2550","\u2551", BLANK
];
let activeSlotIndex = 0;

function setCSSVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function initGridData(c = cols, r = rows) {
  grid = new Array(r).fill(null).map(() =>
    new Array(c).fill(null).map(() => ({ ch: BLANK, color: "#222222", bg: "#ffffff" }))
  );
}

function buildGrid(c = cols, r = rows) {
  gridEl.innerHTML = "";
  setCSSVar("--cols", c);
  for (let y = 0; y < r; y++) {
    for (let x = 0; x < c; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.tabIndex = -1;
      cell.dataset.x = x;
      cell.dataset.y = y;
      const d = grid[y][x];
      cell.textContent = d.ch;
      cell.style.color = d.color;
      cell.style.backgroundColor = d.bg;
      // Events
      cell.addEventListener("mousedown", onCellPointerDown);
      cell.addEventListener("mouseenter", onCellPointerEnter);
      gridEl.appendChild(cell);
    }
  }
  // Ensure caret remains visible after rebuild
  updateCaretVisual();
}

function setCell(x, y, ch, color, bg) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return;
  const d = grid[y][x];
  if (ch !== undefined) d.ch = ch;
  if (color !== undefined) d.color = color;
  if (bg !== undefined) d.bg = bg;
  const idx = y * cols + x;
  const el = gridEl.children[idx];
  if (el) {
    if (ch !== undefined) el.textContent = ch;
    if (color !== undefined) el.style.color = color;
    if (bg !== undefined) el.style.backgroundColor = bg;
  }
}

function clearGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      setCell(x, y, BLANK, "#222222", "#ffffff");
    }
  }
}

function applyBrush(x, y) {
  if (brushMode === "text") {
    setCell(x, y, activeSymbol, activeColor, undefined);
  } else if (brushMode === "bg") {
    setCell(x, y, undefined, undefined, activeBgColor);
  } else {
    setCell(x, y, activeSymbol, activeColor, activeBgColor);
  }
}

function exportPlainText() {
  const lines = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x].ch;
      line += ch === BLANK ? " " : ch;
    }
    lines.push(line);
  }
  const txt = lines.join("\n");
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ascii-art-${cols}x${rows}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportHTML() {
  const cellPx = 16; // export at 16px cells
  const widthPx = cols * cellPx;
  const heightPx = rows * cellPx;

  const escapeHTML = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  let bodyContent = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const { ch, color, bg } = grid[y][x];
      const visible = ch === BLANK ? " " : ch;
      bodyContent += `<span style="color:${color};background:${bg}">${escapeHTML(visible)}</span>`;
    }
    if (y < rows - 1) bodyContent += "\n";
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASCII Art Export</title>
  <style>
    :root { --cell: ${cellPx}px; }
    html, body { height: 100%; }
    body { margin: 0; background: #ffffff; }
    pre.art { margin: 0; width: ${widthPx}px; height: ${heightPx}px; overflow: hidden; }
    pre.art { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace; font-size: var(--cell); line-height: var(--cell); letter-spacing: 0; white-space: pre; font-variant-ligatures: none; }
    span { display: inline-block; width: var(--cell); height: var(--cell); text-align: center; vertical-align: top; }
  </style>
  <!-- Optionally include a web font that supports box-drawing: Fira Code -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
  <style> pre.art { font-family: 'Fira Code', Consolas, 'Courier New', monospace; } </style>
  </head>
<body>
  <pre class="art">${bodyContent}</pre>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ascii-art-${cols}x${rows}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function onCellPointerDown(e) {
  e.preventDefault();
  const x = parseInt(e.currentTarget.dataset.x, 10);
  const y = parseInt(e.currentTarget.dataset.y, 10);
  if (typingMode) {
    setCaret(x, y);
    gridEl.focus();
  } else {
    isDrawing = true;
    applyBrush(x, y);
  }
}

function onCellPointerEnter(e) {
  if (!isDrawing || typingMode) return;
  const x = parseInt(e.currentTarget.dataset.x, 10);
  const y = parseInt(e.currentTarget.dataset.y, 10);
  applyBrush(x, y);
}

function onGlobalMouseUp() { isDrawing = false; }

function buildSlots() {
  slotsEl.innerHTML = "";
  slots.forEach((sym, i) => {
    const b = document.createElement("button");
    b.className = "slot" + (i === activeSlotIndex ? " active" : "");
    b.title = `Slot ${SLOT_KEYS[i]} (${sym === BLANK ? 'Blank' : sym})`;
    b.dataset.index = i;
    const spaceGlyph = "\u2420"; // ␠ symbol
    b.innerHTML = `<span class="num">${SLOT_KEYS[i]}</span><span class="glyph">${sym === BLANK ? spaceGlyph : sym}</span>`;
    b.addEventListener("click", () => selectSlot(i));
    b.addEventListener("contextmenu", (ev) => { ev.preventDefault(); assignSlot(i, activeSymbol); });
    slotsEl.appendChild(b);
  });
}

function selectSlot(i) {
  activeSlotIndex = i;
  activeSymbol = slots[i];
  refreshSlotsActive();
  updateCursorPreview();
}

function assignSlot(i, symbol) {
  slots[i] = symbol;
  if (i === activeSlotIndex) activeSymbol = symbol;
  buildSlots();
  updateCursorPreview();
}

function refreshSlotsActive() {
  [...slotsEl.children].forEach((el, idx) => {
    el.classList.toggle("active", idx === activeSlotIndex);
    const glyph = el.querySelector(".glyph");
    glyph.textContent = slots[idx] === BLANK ? "\u2420" : slots[idx];
    el.title = `Slot ${SLOT_KEYS[idx]} (${slots[idx] === BLANK ? 'Blank' : slots[idx]})`;
  });
}

function buildSymbolPalette() {
  symbolPaletteEl.innerHTML = "";
  // Blank button
  const blankBtn = document.createElement("button");
  blankBtn.className = "symbol-btn blank";
  blankBtn.textContent = "Blank";
  blankBtn.title = "Blank (eraser)";
  blankBtn.addEventListener("click", () => selectSymbol(BLANK));
  symbolPaletteEl.appendChild(blankBtn);

  SYMBOLS.forEach(sym => {
    const b = document.createElement("button");
    b.className = "symbol-btn";
    b.textContent = sym;
    b.title = `Symbol: ${sym}`;
    b.addEventListener("click", () => selectSymbol(sym));
    symbolPaletteEl.appendChild(b);
  });
  refreshActiveSymbolHighlight();
}

function refreshActiveSymbolHighlight() {
  const btns = symbolPaletteEl.querySelectorAll(".symbol-btn");
  btns.forEach(btn => btn.classList.remove("active"));
  btns.forEach(btn => {
    const sym = btn.classList.contains("blank") ? BLANK : btn.textContent;
    if (sym === activeSymbol) btn.classList.add("active");
  });
}

function selectSymbol(sym) {
  activeSymbol = sym;
  refreshActiveSymbolHighlight();
  updateCursorPreview();
}

function buildColorPalette() {
  colorSwatchesEl.innerHTML = "";
  SWATCHES.forEach(hex => {
    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener("click", () => setActiveColor(hex));
    colorSwatchesEl.appendChild(sw);
  });
  colorPreviewEl.style.background = activeColor;
}

function setActiveColor(hex) {
  activeColor = hex;
  colorPickerEl.value = toColorInputHex(hex);
  colorPreviewEl.style.background = hex;
  updateCursorPreview();
}

function buildBgPalette() {
  bgSwatchesEl.innerHTML = "";
  SWATCHES.forEach(hex => {
    const sw = document.createElement("div");
    sw.className = "swatch";
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener("click", () => setActiveBgColor(hex));
    bgSwatchesEl.appendChild(sw);
  });
  bgColorPreviewEl.style.background = activeBgColor;
}

function setActiveBgColor(hex) {
  activeBgColor = hex;
  bgColorPickerEl.value = toColorInputHex(hex);
  bgColorPreviewEl.style.background = hex;
}

function fillEntireBackground() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      setCell(x, y, undefined, undefined, activeBgColor);
    }
  }
}

function toColorInputHex(hex) {
  const h = hex.replace('#','');
  if (h.length === 3) return '#' + h.split('').map(c => c + c).join('');
  return '#' + h.padStart(6, '0').slice(0,6);
}

function handleKeydown(e) {
  const key = e.key;
  if (typingMode) {
    handleTypingKey(e);
    return;
  }
  const idx = SLOT_KEYS.indexOf(key);
  if (idx !== -1) {
    if (e.altKey) {
      e.preventDefault();
      assignSlot(idx, activeSymbol);
    } else {
      e.preventDefault();
      selectSlot(idx);
    }
    return;
  }
}

function attachGlobalHandlers() {
  window.addEventListener("mouseup", onGlobalMouseUp);
  window.addEventListener("keydown", handleKeydown);
  gridEl.addEventListener("contextmenu", e => e.preventDefault());

  gridEl.addEventListener("mousemove", (e) => {
    const rect = gridEl.getBoundingClientRect();
    cursorPreview.style.left = `${e.clientX - rect.left}px`;
    cursorPreview.style.top = `${e.clientY - rect.top}px`;
  });
  gridEl.addEventListener("mouseenter", () => { if (!typingMode) { cursorPreview.style.display = "block"; updateCursorPreview(); } });
  gridEl.addEventListener("mouseleave", () => { cursorPreview.style.display = "none"; });

  // Brush mode buttons
  brushModesEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".brush-btn");
    if (!btn) return;
    const mode = btn.dataset.mode;
    if (!mode) return;
    brushMode = mode;
    [...brushModesEl.children].forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });

  // Typing toggle
  if (textModeBtn) {
    textModeBtn.addEventListener("click", () => {
      typingMode = !typingMode;
      textModeBtn.classList.toggle("active", typingMode);
      cursorPreview.style.display = typingMode ? "none" : cursorPreview.style.display;
      if (typingMode) gridEl.focus();
    });
  }

  // Theme toggle
  if (themeToggle) {
    const applyTheme = (t) => document.documentElement.setAttribute("data-theme", t);
    const nextTheme = () => (localStorage.getItem("theme") === "dark" ? "light" : "dark");
    const init = localStorage.getItem("theme");
    if (init) applyTheme(init);
    themeToggle.addEventListener("click", () => {
      const t = nextTheme();
      localStorage.setItem("theme", t);
      applyTheme(t);
    });
  }
}

function updateCursorPreview() {
  const spaceGlyph = "\u2420"; // ␠ symbol for space
  cursorPreview.textContent = activeSymbol === BLANK ? spaceGlyph : activeSymbol;
  cursorPreview.style.color = activeColor;
}

function resizeGrid(newCols, newRows) {
  const old = grid;
  const minCols = Math.min(cols, newCols);
  const minRows = Math.min(rows, newRows);
  cols = newCols; rows = newRows;
  initGridData(cols, rows);
  for (let y = 0; y < minRows; y++) {
    for (let x = 0; x < minCols; x++) {
      grid[y][x] = { ...old[y][x] };
    }
  }
  buildGrid(cols, rows);
  // Keep caret within bounds
  caretX = Math.min(caretX, cols - 1);
  caretY = Math.min(caretY, rows - 1);
  updateCaretVisual();
}

// Controls
clearBtn.addEventListener("click", clearGrid);
resizeBtn.addEventListener("click", () => {
  const c = Math.max(4, Math.min(256, parseInt(colsInput.value, 10) || cols));
  const r = Math.max(4, Math.min(256, parseInt(rowsInput.value, 10) || rows));
  resizeGrid(c, r);
});
colorPickerEl.addEventListener("input", (e) => setActiveColor(e.target.value));
bgColorPickerEl.addEventListener("input", (e) => setActiveBgColor(e.target.value));
exportTxtBtn.addEventListener("click", exportPlainText);
exportHtmlBtn.addEventListener("click", exportHTML);
if (fillBgBtn) fillBgBtn.addEventListener("click", fillEntireBackground);

// Init
function init() {
  initGridData(cols, rows);
  buildGrid(cols, rows);
  buildSlots();
  buildSymbolPalette();
  buildColorPalette();
  buildBgPalette();
  attachGlobalHandlers();
  selectSlot(0);
}

init();

// Typing mode helpers
function handleTypingKey(e) {
  const key = e.key;
  if (key === "ArrowLeft") { e.preventDefault(); moveCaret(-1, 0); return; }
  if (key === "ArrowRight") { e.preventDefault(); moveCaret(1, 0); return; }
  if (key === "ArrowUp") { e.preventDefault(); moveCaret(0, -1); return; }
  if (key === "ArrowDown") { e.preventDefault(); moveCaret(0, 1); return; }
  if (key === "Enter") { e.preventDefault(); setCaret(0, Math.min(rows - 1, caretY + 1)); return; }
  if (key === "Home") { e.preventDefault(); setCaret(0, caretY); return; }
  if (key === "End") { e.preventDefault(); setCaret(cols - 1, caretY); return; }
  if (key === "Backspace") {
    e.preventDefault();
    moveCaret(-1, 0);
    setCell(caretX, caretY, BLANK, undefined, undefined);
    return;
  }
  if (key === "Delete") { e.preventDefault(); setCell(caretX, caretY, BLANK, undefined, undefined); return; }

  if (key.length === 1) {
    e.preventDefault();
    const ch = key;
    setCell(caretX, caretY, ch, activeColor, brushMode === "both" ? activeBgColor : undefined);
    moveCaret(1, 0);
  }
}

function moveCaret(dx, dy) {
  setCaret(
    Math.max(0, Math.min(cols - 1, caretX + dx)),
    Math.max(0, Math.min(rows - 1, caretY + dy))
  );
}

function setCaret(x, y) {
  caretX = x; caretY = y;
  updateCaretVisual();
}

function updateCaretVisual() {
  // Remove existing
  [...gridEl.children].forEach(c => c.classList && c.classList.remove("caret"));
  const idx = caretY * cols + caretX;
  const el = gridEl.children[idx];
  if (el) el.classList.add("caret");
}
