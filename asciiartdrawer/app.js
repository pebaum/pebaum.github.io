// ASCII Art Drawer

// Allowed symbols (unique) + blank
const SYMBOLS = [
  // Shades
  '░','▒','▓',
  // Box drawing light
  '─','│','┌','┐','└','┘','┬','┴','├','┤','┼',
  // Double
  '═','║','╔','╗','╚','╝','╦','╩','╠','╣','╬',
  // Blank as explicit last entry (represented separately in UI)
];
const BLANK = ' ';

// Default swatch colors
const SWATCHES = [
  '#000000', '#222222', '#666666', '#999999', '#cccccc', '#ffffff',
  '#e11d48', '#ef4444', '#f59e0b', '#fbbf24', '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#a855f7', '#d946ef', '#b45309'
];

// Quick slot digits mapping order 1..9,0
const SLOT_KEYS = ['1','2','3','4','5','6','7','8','9','0'];

// Elements
const gridEl = document.getElementById('grid');
const slotsEl = document.getElementById('slots');
const symbolPaletteEl = document.getElementById('symbolPalette');
const colorSwatchesEl = document.getElementById('colorSwatches');
const colorPickerEl = document.getElementById('colorPicker');
const colorPreviewEl = document.getElementById('currentColorPreview');
const clearBtn = document.getElementById('clearBtn');
const colsInput = document.getElementById('colsInput');
const rowsInput = document.getElementById('rowsInput');
const resizeBtn = document.getElementById('resizeBtn');
const cursorPreview = document.getElementById('cursorPreview');

// State
let cols = parseInt(colsInput.value, 10) || 64;
let rows = parseInt(rowsInput.value, 10) || 24;
let activeColor = colorPickerEl.value;
let activeSymbol = '─';
let isDrawing = false;
let grid = []; // 2D array { ch, color }

// Slots: mapping from index 0..9 to assigned symbol
let slots = [
  '─','│','┌','┐','└','┘','┼','═','║', BLANK
];
let activeSlotIndex = 0;

function setCSSVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function initGridData(c = cols, r = rows) {
  grid = new Array(r).fill(null).map(() => new Array(c).fill(null).map(() => ({ ch: BLANK, color: '#222222' })));
}

function buildGrid(c = cols, r = rows) {
  gridEl.innerHTML = '';
  setCSSVar('--cols', c);
  for (let y = 0; y < r; y++) {
    for (let x = 0; x < c; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.tabIndex = -1;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.textContent = grid[y][x].ch;
      cell.style.color = grid[y][x].color;
      // Events
      cell.addEventListener('mousedown', onCellPointerDown);
      cell.addEventListener('mouseenter', onCellPointerEnter);
      gridEl.appendChild(cell);
    }
  }
}

function setCell(x, y, ch, color) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return;
  grid[y][x].ch = ch;
  grid[y][x].color = color;
  const idx = y * cols + x;
  const el = gridEl.children[idx];
  if (el) {
    el.textContent = ch;
    el.style.color = color;
  }
}

function clearGrid() {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      setCell(x, y, BLANK, '#222222');
    }
  }
}

function onCellPointerDown(e) {
  e.preventDefault();
  const x = parseInt(e.currentTarget.dataset.x, 10);
  const y = parseInt(e.currentTarget.dataset.y, 10);
  isDrawing = true;
  setCell(x, y, activeSymbol, activeColor);
}

function onCellPointerEnter(e) {
  if (!isDrawing) return;
  const x = parseInt(e.currentTarget.dataset.x, 10);
  const y = parseInt(e.currentTarget.dataset.y, 10);
  setCell(x, y, activeSymbol, activeColor);
}

function onGlobalMouseUp() { isDrawing = false; }

function buildSlots() {
  slotsEl.innerHTML = '';
  slots.forEach((sym, i) => {
    const b = document.createElement('button');
    b.className = 'slot' + (i === activeSlotIndex ? ' active' : '');
    b.title = `Slot ${SLOT_KEYS[i]} (${sym === BLANK ? 'Blank' : sym})`;
    b.dataset.index = i;
    b.innerHTML = `<span class="num">${SLOT_KEYS[i]}</span><span class="glyph">${sym === BLANK ? '␠' : sym}</span>`;
    b.addEventListener('click', () => selectSlot(i));
    b.addEventListener('contextmenu', (ev) => { // right-click assigns current symbol
      ev.preventDefault();
      assignSlot(i, activeSymbol);
    });
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
    el.classList.toggle('active', idx === activeSlotIndex);
    const glyph = el.querySelector('.glyph');
    glyph.textContent = slots[idx] === BLANK ? '␠' : slots[idx];
    el.title = `Slot ${SLOT_KEYS[idx]} (${slots[idx] === BLANK ? 'Blank' : slots[idx]})`;
  });
}

function buildSymbolPalette() {
  symbolPaletteEl.innerHTML = '';
  // Blank button
  const blankBtn = document.createElement('button');
  blankBtn.className = 'symbol-btn blank';
  blankBtn.textContent = 'Blank';
  blankBtn.title = 'Blank (eraser)';
  blankBtn.addEventListener('click', () => selectSymbol(BLANK));
  symbolPaletteEl.appendChild(blankBtn);

  [...SYMBOLS].forEach(sym => {
    const b = document.createElement('button');
    b.className = 'symbol-btn';
    b.textContent = sym;
    b.title = `Symbol: ${sym}`;
    b.addEventListener('click', () => selectSymbol(sym));
    symbolPaletteEl.appendChild(b);
  });
  refreshActiveSymbolHighlight();
}

function refreshActiveSymbolHighlight() {
  const btns = symbolPaletteEl.querySelectorAll('.symbol-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  // Match by text
  btns.forEach(btn => {
    const sym = btn.classList.contains('blank') ? BLANK : btn.textContent;
    if (sym === activeSymbol) btn.classList.add('active');
  });
}

function selectSymbol(sym) {
  activeSymbol = sym;
  // Also set the current active slot to this symbol (temporary) without changing mapping
  refreshActiveSymbolHighlight();
  updateCursorPreview();
}

function buildColorPalette() {
  colorSwatchesEl.innerHTML = '';
  SWATCHES.forEach(hex => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = hex;
    sw.title = hex;
    sw.addEventListener('click', () => setActiveColor(hex));
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

function toColorInputHex(hex) {
  // Normalize 3/6 digit to 7 char #RRGGBB
  const h = hex.replace('#','');
  if (h.length === 3) return '#' + h.split('').map(c => c + c).join('');
  return '#' + h.padStart(6, '0').slice(0,6);
}

function handleKeydown(e) {
  const key = e.key;
  // Digit slots select
  const idx = SLOT_KEYS.indexOf(key);
  if (idx !== -1) {
    if (e.altKey) {
      // Alt+digit assigns current symbol to slot
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
  window.addEventListener('mouseup', onGlobalMouseUp);
  window.addEventListener('keydown', handleKeydown);
  gridEl.addEventListener('contextmenu', e => e.preventDefault());

  gridEl.addEventListener('mousemove', (e) => {
    const rect = gridEl.getBoundingClientRect();
    cursorPreview.style.left = `${e.clientX - rect.left}px`;
    cursorPreview.style.top = `${e.clientY - rect.top}px`;
  });
  gridEl.addEventListener('mouseenter', () => { cursorPreview.style.display = 'block'; updateCursorPreview(); });
  gridEl.addEventListener('mouseleave', () => { cursorPreview.style.display = 'none'; });
}

function updateCursorPreview() {
  cursorPreview.textContent = activeSymbol === BLANK ? '␠' : activeSymbol;
  cursorPreview.style.color = activeColor;
}

function resizeGrid(newCols, newRows) {
  // Preserve existing data within new bounds
  const oldGrid = grid;
  const minCols = Math.min(cols, newCols);
  const minRows = Math.min(rows, newRows);
  cols = newCols; rows = newRows;
  initGridData(cols, rows);
  for (let y=0; y<minRows; y++) {
    for (let x=0; x<minCols; x++) {
      grid[y][x] = { ...oldGrid[y][x] };
    }
  }
  buildGrid(cols, rows);
}

// Controls
clearBtn.addEventListener('click', clearGrid);
resizeBtn.addEventListener('click', () => {
  const c = Math.max(4, Math.min(160, parseInt(colsInput.value, 10) || cols));
  const r = Math.max(4, Math.min(100, parseInt(rowsInput.value, 10) || rows));
  resizeGrid(c, r);
});
colorPickerEl.addEventListener('input', (e) => setActiveColor(e.target.value));

// Init
function init() {
  initGridData(cols, rows);
  buildGrid(cols, rows);
  buildSlots();
  buildSymbolPalette();
  buildColorPalette();
  attachGlobalHandlers();
  selectSlot(0);
}

// Populate SYMBOLS that may have been left empty earlier (for clarity)
// Reassign if empty to ensure safety in case of bundling
if (SYMBOLS.length === 0) {
  // Not expected, but fallback set
}

init();

