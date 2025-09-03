// Boardgame Design Lab core logic
// Units: we map inches to pixels via DPI. Default 70 px per inch (comfortable scale for screens)
const DPI = 70; // px per inch

const el = (sel, root=document) => root.querySelector(sel);
const els = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const workCanvas = el('#workCanvas');
const playArea = el('#playArea');
const scroller = el('#canvasScroller');

// State
const state = {
  orientation: 'portrait',
  cardSize: 'poker',
  csv: { headers: [], rows: [], filtered: [], selectedIdx: new Set() },
  drag: null,
};
let zCounter = 10;
const persistKey = 'bdl-layout-v1';
const grid = { enabled: false, sizeIn: 0.5, snap: false };

// Size mapping for popular card sizes (inches)
const CARD_SIZES = {
  poker: { w: 2.5, h: 3.5 },
  tarot: { w: 2.75, h: 4.75 },
  mini:  { w: 1.625, h: 2.5 },
  square:{ w: 2.5, h: 2.5 },
};

function inchesToPx(inches) { return Math.round(inches * DPI); }
function cardDimsPx(kind, orientation) {
  const base = CARD_SIZES[kind] || CARD_SIZES.poker;
  const w = inchesToPx(base.w);
  const h = inchesToPx(base.h);
  return orientation === 'landscape' ? { w: h, h: w } : { w, h };
}

function centerViewOnPlayArea() {
  const rect = playArea.getBoundingClientRect();
  const scr = scroller.getBoundingClientRect();
  // Scroll so playArea is centered in view
  const targetLeft = playArea.offsetLeft + (playArea.offsetWidth - scr.width) / 2;
  const targetTop  = playArea.offsetTop  + (playArea.offsetHeight - scr.height) / 2;
  scroller.scrollTo({ left: Math.max(targetLeft, 0), top: Math.max(targetTop, 0), behavior: 'smooth' });
}

function setPlayAreaSize(wIn, hIn) {
  const w = inchesToPx(wIn);
  const h = inchesToPx(hIn);
  playArea.style.width = `${w}px`;
  playArea.style.height = `${h}px`;
}

function addBoardBox(wIn, hIn, x=50, y=50) {
  const w = inchesToPx(wIn), h = inchesToPx(hIn);
  const box = document.createElement('div');
  box.className = 'board-box item draggable';
  box.style.width = `${w}px`;
  box.style.height = `${h}px`;
  box.style.left = `${x}px`;
  box.style.top = `${y}px`;
  const label = document.createElement('div');
  label.className = 'board-label';
  label.textContent = 'Board';
  label.contentEditable = 'true';
  box.appendChild(label);
  enableDrag(box);
  makeResizable(box, { minW: inchesToPx(1), minH: inchesToPx(1) });
  playArea.appendChild(box);
  return box;
}

function makeCard(kind, orientation, labelText='Card') {
  const { w, h } = cardDimsPx(kind, orientation);
  const card = document.createElement('div');
  card.className = `card item draggable ${orientation}`;
  card.style.width = `${w}px`;
  card.style.height = `${h}px`;
  card.innerHTML = `<div class=\"card-face\"></div>`;
  const label = documentElement('div', 'card-label');
  label.textContent = labelText;
  label.contentEditable = 'true';
  card.appendChild(label);
  enableDrag(card);
  makeResizable(card, { minW: inchesToPx(1), minH: inchesToPx(1) });
  card.addEventListener('dblclick', () => rotateItem(card));
  return card;
}

function documentElement(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function rotateItem(node) {
  if (node.classList.contains('landscape')) node.classList.remove('landscape');
  else node.classList.add('landscape');
}

function makeStack(count, kind, orientation) {
  const { w, h } = cardDimsPx(kind, orientation);
  const stack = document.createElement('div');
  stack.className = `stack item draggable ${orientation}`;
  stack.style.width = `${w}px`;
  stack.style.height = `${h}px`;
  stack.dataset.kind = kind;
  stack.dataset.orientation = orientation;
  stack.dataset.count = String(count);
  stack.innerHTML = `<div class="stack-face"></div>`;
  const counter = documentElement('div', 'stack-count');
  counter.textContent = String(count);
  stack.appendChild(counter);
  enableDrag(stack);
  makeResizable(stack, { minW: inchesToPx(1), minH: inchesToPx(1) });

  stack.addEventListener('click', (e) => {
    e.stopPropagation();
    openStackMenu(stack, e);
  });

  return stack;
}

function openStackMenu(stack, e) {
  closeStackMenu();
  const tmpl = el('#stackMenuTmpl');
  const menu = tmpl.content.firstElementChild.cloneNode(true);
  menu.style.left = `${stack.offsetLeft + stack.offsetWidth + 8}px`;
  menu.style.top = `${stack.offsetTop}px`;
  playArea.appendChild(menu);
  const cleanup = () => closeStackMenu();
  const onClick = (ev) => {
    const action = ev.target?.dataset?.action;
    if (!action) return;
    ev.stopPropagation();
    handleStackAction(stack, action);
    cleanup();
  };
  menu.addEventListener('click', onClick);
  setTimeout(() => document.addEventListener('click', cleanup, { once: true }), 0);
}

function closeStackMenu() {
  const existing = el('.stack-menu', playArea);
  if (existing) existing.remove();
}

function updateStackCount(stack, newCount) {
  stack.dataset.count = String(newCount);
  const counter = el('.stack-count', stack);
  if (counter) counter.textContent = String(newCount);
}

function handleStackAction(stack, action) {
  let count = parseInt(stack.dataset.count || '0', 10);
  const kind = stack.dataset.kind || 'poker';
  const orientation = stack.dataset.orientation || 'portrait';

  if (action === 'shuffle') {
    // Simple visual nudge
    stack.classList.add('dragging');
    setTimeout(() => stack.classList.remove('dragging'), 250);
    return;
  }
  if (action === 'setCount') {
    const v = prompt('Set stack count to:', String(count));
    if (v != null) {
      const n = Math.max(0, Math.floor(Number(v)));
      updateStackCount(stack, n);
    }
    return;
  }
  if (action === 'delete') {
    stack.remove();
    return;
  }
  if (action === 'drawN') {
    const v = prompt('Draw how many cards?', '1');
    if (v == null) return;
    const n = Math.max(0, Math.floor(Number(v)));
    drawFromStack(stack, n, kind, orientation);
    return;
  }
  if (action === 'draw1' || action === 'draw5') {
    const n = action === 'draw1' ? 1 : 5;
    drawFromStack(stack, n, kind, orientation);
    return;
  }
}

function drawFromStack(stack, n, kind, orientation) {
  let count = parseInt(stack.dataset.count || '0', 10);
  const toDraw = Math.min(n, count);
  if (toDraw <= 0) return;
  count -= toDraw;
  updateStackCount(stack, count);

  // Fan out newly drawn cards to the right
  for (let i=0;i<toDraw;i++) {
    const card = makeCard(kind, orientation, 'Card');
    const x = stack.offsetLeft + stack.offsetWidth + 12 + i * 24;
    const y = stack.offsetTop + i * 12;
    card.style.left = `${x}px`;
    card.style.top = `${y}px`;
    playArea.appendChild(card);
  }
}

function addToken(shape, size, color, label) {
  const token = document.createElement('div');
  token.className = `token item draggable ${shape}`;
  token.style.width = `${size}px`;
  token.style.height = `${size}px`;
  token.style.left = `150px`;
  token.style.top = `150px`;
  token.style.background = color;
  token.style.border = '2px solid #222';
  token.style.boxShadow = 'var(--shadow)';
  const tlabel = documentElement('div', 'token-label');
  tlabel.textContent = label || '';
  tlabel.contentEditable = 'true';
  token.appendChild(tlabel);
  enableDrag(token);
  makeResizable(token, { minW: 24, minH: 24 });
  playArea.appendChild(token);
}

function addDieToBoard() {
  const die = document.createElement('div');
  die.className = 'die item draggable';
  die.style.left = '200px';
  die.style.top = '200px';
  die.textContent = '1';
  die.title = 'Click to roll';
  enableDrag(die);
  die.addEventListener('click', (e) => {
    e.stopPropagation();
    dieRollAnimation(die);
  });
  playArea.appendChild(die);
}

function addDieToBoardWithSides(sides=6) {
  const die = document.createElement('div');
  die.className = 'die item draggable';
  die.dataset.sides = String(sides);
  die.style.left = '200px';
  die.style.top = '200px';
  die.textContent = '1';
  die.title = `Click to roll d${sides}`;
  enableDrag(die);
  die.addEventListener('click', (e) => {
    e.stopPropagation();
    dieRollAnimation(die);
  });
  playArea.appendChild(die);
}

function dieRollAnimation(die) {
  die.classList.add('rolling');
  setTimeout(() => {
    die.classList.remove('rolling');
  const d = Number(die.dataset.sides || 6); // default d6
    const val = Math.floor(Math.random()*d) + 1;
    die.textContent = String(val);
  }, 500);
}

function rollD(d) {
  return Math.floor(Math.random()*d) + 1;
}

// Dragging
function enableDrag(node) {
  node.classList.add('draggable');
  let start = { x:0, y:0, left:0, top:0 };

  const onPointerDown = (e) => {
    if (e.button !== 0) return; // left only
    e.preventDefault();
    node.setPointerCapture(e.pointerId);
    start = { x: e.clientX, y: e.clientY, left: node.offsetLeft, top: node.offsetTop };
    node.classList.add('dragging');
    node.style.zIndex = String(++zCounter);
    state.drag = { node };
  };
  const onPointerMove = (e) => {
    if (!state.drag || state.drag.node !== node) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    let nx = start.left + dx;
    let ny = start.top + dy;
    if (grid.snap) {
      const gs = inchesToPx(grid.sizeIn);
      nx = Math.round(nx/gs)*gs; ny = Math.round(ny/gs)*gs;
      node.classList.add('snapped');
    } else node.classList.remove('snapped');
    node.style.left = `${nx}px`;
    node.style.top  = `${ny}px`;
  };
  const onPointerUp = (e) => {
    if (!state.drag || state.drag.node !== node) return;
    node.releasePointerCapture(e.pointerId);
    node.classList.remove('dragging');
    state.drag = null;
  };

  node.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

// Resizable
function makeResizable(node, opts={}) {
  const handles = ['tl','tr','bl','br'];
  node.classList.add('resizable');
  handles.forEach(pos => {
    const h = document.createElement('div');
    h.className = `resize-handle ${pos}`;
    node.appendChild(h);
    let start;
    const onDown = (e) => {
      e.stopPropagation(); e.preventDefault();
      h.setPointerCapture(e.pointerId);
      start = { x:e.clientX, y:e.clientY, w:node.offsetWidth, h:node.offsetHeight, l:node.offsetLeft, t:node.offsetTop };
      state.drag = { node, resize: { pos } };
    };
    const onMove = (e) => {
      if (!state.drag || state.drag.node !== node || !state.drag.resize) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      let nw = start.w, nh = start.h, nl = start.l, nt = start.t;
      if (pos.includes('r')) nw = Math.max((opts.minW||24), start.w + dx);
      if (pos.includes('b')) nh = Math.max((opts.minH||24), start.h + dy);
      if (pos.includes('l')) { nw = Math.max((opts.minW||24), start.w - dx); nl = start.l + dx; }
      if (pos.includes('t')) { nh = Math.max((opts.minH||24), start.h - dy); nt = start.t + dy; }
      if (grid.snap) {
        const gs = inchesToPx(grid.sizeIn);
        nw = Math.max((opts.minW||24), Math.round(nw/gs)*gs);
        nh = Math.max((opts.minH||24), Math.round(nh/gs)*gs);
        nl = Math.round(nl/gs)*gs; nt = Math.round(nt/gs)*gs;
        node.classList.add('snapped');
      } else node.classList.remove('snapped');
      node.style.width = `${nw}px`; node.style.height = `${nh}px`;
      node.style.left = `${nl}px`; node.style.top = `${nt}px`;
    };
    const onUp = (e) => {
      if (!state.drag) return; state.drag = null; h.releasePointerCapture(e.pointerId); node.classList.remove('snapped');
    };
    h.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

// CSV Support (simple, no external libs)
function parseCSV(text) {
  // RFC4180-ish CSV with quotes and newlines, tolerant to trailing newlines
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i+1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { pushField(); i++; continue; }
    if (ch === '\n') { pushField(); pushRow(); i++; continue; }
    if (ch === '\r') { if (text[i+1] === '\n') { i += 2; } else { i++; } pushField(); pushRow(); continue; }
    field += ch; i++;
  }
  // Final field/row if any
  if (field.length > 0 || row.length) { pushField(); pushRow(); }
  return rows.filter(r => r.length);
}

function loadCSV(text) {
  const rows = parseCSV(text).filter(r => r.length && r.some(c => c!==''));
  if (!rows.length) return;
  const headers = rows.shift().map(h => h.trim());
  const objects = rows.map(r => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? ''])));
  state.csv.headers = headers;
  state.csv.rows = objects;
  state.csv.filtered = objects;
  state.csv.selectedIdx.clear();
  renderCSVTable();
}

function renderCSVTable() {
  const wrap = el('#csvTableWrap');
  const { headers, filtered } = state.csv;
  if (!headers.length) { wrap.innerHTML = ''; el('#csvStatus').textContent = 'No CSV loaded.'; return; }
  el('#csvStatus').textContent = `${filtered.length} rows`;
  const table = document.createElement('table');
  table.className = 'csv-table';
  table.innerHTML = `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>`;
  const tbody = document.createElement('tbody');
  filtered.slice(0, 300).forEach((row, idx) => {
    const tr = document.createElement('tr');
    const isSel = state.csv.selectedIdx.has(idx);
    if (isSel) tr.classList.add('selected');
    tr.addEventListener('click', (ev) => {
      if (ev.shiftKey) {
        // range select: from last selected to idx
        const sorted = Array.from(state.csv.selectedIdx).sort((a,b)=>a-b);
        const last = sorted.length ? sorted[sorted.length-1] : idx;
        const [a,b] = last <= idx ? [last, idx] : [idx, last];
        for (let i=a;i<=b;i++) state.csv.selectedIdx.add(i);
      } else if (ev.ctrlKey || ev.metaKey) {
        if (state.csv.selectedIdx.has(idx)) state.csv.selectedIdx.delete(idx);
        else state.csv.selectedIdx.add(idx);
      } else {
        state.csv.selectedIdx.clear();
        state.csv.selectedIdx.add(idx);
      }
      renderCSVTable();
      updateSpawnButton();
    });
    tr.innerHTML = headers.map(h => `<td>${String(row[h] ?? '')}</td>`).join('');
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.innerHTML = '';
  wrap.appendChild(table);
}

function updateSpawnButton() {
  el('#spawnSelectedBtn').disabled = state.csv.selectedIdx.size === 0;
}

function applySearch(q) {
  q = q.trim().toLowerCase();
  const { rows, headers } = state.csv;
  if (!q) state.csv.filtered = rows;
  else {
    state.csv.filtered = rows.filter(r => headers.some(h => String(r[h]||'').toLowerCase().includes(q)));
  }
  state.csv.selectedIdx.clear();
  renderCSVTable();
  updateSpawnButton();
}

function spawnSelectedFromCSV() {
  const { filtered, selectedIdx } = state.csv;
  const arr = Array.from(selectedIdx).map(i => filtered[i]);
  if (!arr.length) return;
  const kind = state.cardSize;
  const orientation = state.orientation;
  let baseX = playArea.offsetLeft + 40, baseY = playArea.offsetTop + 40;
  arr.forEach((row, i) => {
    const label = row.name || row.title || row.card || `Card ${i+1}`;
    const card = makeCard(kind, orientation, String(label));
    card.style.left = `${baseX + (i%8)*24}px`;
    card.style.top = `${baseY + Math.floor(i/8)*28}px`;
    playArea.appendChild(card);
  });
}

// UI wires
function onReady() {
  // initial play area
  setPlayAreaSize(20, 12);
  centerViewOnPlayArea();

  // grid overlay element
  const gridLayer = document.createElement('div');
  gridLayer.className = 'grid';
  playArea.appendChild(gridLayer);

  function updateGrid() {
    gridLayer.style.display = grid.enabled ? 'block' : 'none';
    const px = inchesToPx(grid.sizeIn);
    gridLayer.style.backgroundSize = `${px}px ${px}px, ${px}px ${px}px`;
  }

  el('#applyPlayArea').addEventListener('click', () => {
    const w = Number(el('#playWidthIn').value || 20);
    const h = Number(el('#playHeightIn').value || 12);
    setPlayAreaSize(w, h);
    centerViewOnPlayArea();
  });
  el('#newPlayAreaBtn').addEventListener('click', () => {
    const curW = Math.round(playArea.offsetWidth / DPI * 100)/100;
    const curH = Math.round(playArea.offsetHeight / DPI * 100)/100;
    const s = prompt('Enter play area size in inches (W x H):', `${curW} x ${curH}`);
    if (!s) return;
    const m = s.match(/\s*([\d.]+)\s*[x×]\s*([\d.]+)\s*/i);
    if (!m) return alert('Format: W x H (inches)');
    setPlayAreaSize(Number(m[1]), Number(m[2]));
    centerViewOnPlayArea();
  });

  el('#addBoardBtn').addEventListener('click', () => {
    const w = Number(el('#boardWidthIn').value || 10);
    const h = Number(el('#boardHeightIn').value || 10);
    addBoardBox(w, h, 80, 80);
  });

  el('#cardSize').addEventListener('change', (e) => { state.cardSize = e.target.value; });
  el('#orientPortrait').addEventListener('click', (e) => { state.orientation='portrait'; e.target.classList.add('active'); el('#orientLandscape').classList.remove('active'); });
  el('#orientLandscape').addEventListener('click', (e) => { state.orientation='landscape'; e.target.classList.add('active'); el('#orientPortrait').classList.remove('active'); });

  el('#addStackBtn').addEventListener('click', () => {
    const count = Math.max(0, Math.floor(Number(el('#stackCount').value || 20)));
    const stack = makeStack(count, state.cardSize, state.orientation);
    stack.style.left = `${playArea.offsetLeft + 60}px`;
    stack.style.top = `${playArea.offsetTop + 60}px`;
    playArea.appendChild(stack);
  });

  el('#csvFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    loadCSV(text);
  });
  el('#csvSearch').addEventListener('input', (e) => applySearch(e.target.value));
  el('#spawnSelectedBtn').addEventListener('click', spawnSelectedFromCSV);

  els('.die-btn').forEach(btn => btn.addEventListener('click', () => {
    const d = Number(btn.dataset.d);
    const v = rollD(d);
    const line = `${btn.textContent}: ${v}`;
    const out = el('#diceResults');
    out.textContent = line + (out.textContent ? ` | ${out.textContent}` : '');
  }));
  el('#addDieToBoard').addEventListener('click', () => {
    const sel = Number(el('#boardDieType').value);
    addDieToBoardWithSides(sel);
  });

  el('#addTokenBtn').addEventListener('click', () => {
    const shape = el('#tokenShape').value;
    const size = Math.max(8, Number(el('#tokenSize').value || 64));
    const color = el('#tokenColor').value;
    const label = el('#tokenLabel').value;
    addToken(shape, size, color, label);
  });

  el('#resetViewBtn').addEventListener('click', centerViewOnPlayArea);

  // Grid controls
  el('#gridToggle').addEventListener('change', (e) => { grid.enabled = e.target.checked; updateGrid(); saveToStorageDebounced(); });
  el('#gridSizeIn').addEventListener('change', (e) => { grid.sizeIn = Math.max(0.25, Number(e.target.value||0.5)); updateGrid(); saveToStorageDebounced(); });
  el('#snapToggle').addEventListener('change', (e) => { grid.snap = e.target.checked; saveToStorageDebounced(); });

  // Save / Load / New
  el('#saveBtn').addEventListener('click', () => downloadJSON(serializeLayout()));
  el('#loadBtn').addEventListener('click', () => el('#loadFile').click());
  el('#loadFile').addEventListener('change', async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    try { const data = JSON.parse(text); loadLayout(data); } catch { alert('Invalid JSON'); }
  });
  el('#newBoardBtn').addEventListener('click', () => { if (confirm('Clear board?')) { clearBoard(); saveToStorageDebounced(); } });

  // Try load from localStorage
  const cached = localStorage.getItem(persistKey);
  if (cached) { try { loadLayout(JSON.parse(cached)); } catch { /* ignore */ } }
  updateGrid();
}

document.addEventListener('DOMContentLoaded', onReady);

// Persistence
function serializeLayout() {
  const items = [];
  els('.item', playArea).forEach(node => {
    const base = { x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight, z: Number(node.style.zIndex||0) };
    if (node.classList.contains('board-box')) items.push({ type:'board', ...base, label: el('.board-label', node)?.textContent||'' });
    else if (node.classList.contains('stack')) items.push({ type:'stack', ...base, kind: node.dataset.kind, orientation: node.dataset.orientation, count: Number(node.dataset.count||0) });
    else if (node.classList.contains('card')) items.push({ type:'card', ...base, orientation: node.classList.contains('landscape')?'landscape':'portrait', kind: state.cardSize, label: el('.card-label', node)?.textContent||'' });
    else if (node.classList.contains('token')) items.push({ type:'token', ...base, shape: node.classList.contains('hex')?'hex':(node.classList.contains('square')?'square':'round'), color: node.style.background, label: el('.token-label', node)?.textContent||'' });
    else if (node.classList.contains('die')) items.push({ type:'die', ...base, sides: Number(node.dataset.sides||6), value: Number(node.textContent||1) });
  });
  return {
    playArea: { w: playArea.offsetWidth, h: playArea.offsetHeight },
    grid,
    items,
    view: { scrollLeft: scroller.scrollLeft, scrollTop: scroller.scrollTop }
  };
}

function clearBoard() {
  els('.item', playArea).forEach(n => n.remove());
}

function loadLayout(data) {
  clearBoard();
  setPlayAreaSize(data.playArea.w / DPI, data.playArea.h / DPI);
  grid.enabled = !!data.grid?.enabled; grid.sizeIn = data.grid?.sizeIn || 0.5; grid.snap = !!data.grid?.snap;
  el('#gridToggle').checked = grid.enabled; el('#gridSizeIn').value = String(grid.sizeIn); el('#snapToggle').checked = grid.snap;
  // Ensure grid element is last-child overlay remains
  const gridLayer = el('.grid', playArea); if (gridLayer) playArea.appendChild(gridLayer);
  (data.items||[]).forEach(it => {
    let node;
    if (it.type === 'board') { node = addBoardBox(it.w/DPI, it.h/DPI, it.x, it.y); el('.board-label', node).textContent = it.label||''; }
    else if (it.type === 'stack') { node = makeStack(it.count||0, it.kind||'poker', it.orientation||'portrait'); }
    else if (it.type === 'card') { node = makeCard(it.kind||'poker', it.orientation||'portrait', it.label||'Card'); }
    else if (it.type === 'token') { addToken(it.shape||'round', Math.max(24, it.w), it.color||'#e0e0e0', it.label||''); node = null; }
    else if (it.type === 'die') { addDieToBoardWithSides(it.sides||6); node = null; }
    if (node) {
      node.style.left = `${it.x}px`; node.style.top = `${it.y}px`;
      node.style.width = `${it.w}px`; node.style.height = `${it.h}px`;
      if (it.z) node.style.zIndex = String(it.z);
    }
  });
  scroller.scrollTo({ left: data.view?.scrollLeft||0, top: data.view?.scrollTop||0 });
  updateGridInstant(); saveToStorageDebounced();
}

function updateGridInstant(){ const px = inchesToPx(grid.sizeIn); const gridLayer = el('.grid', playArea); if (gridLayer){ gridLayer.style.display = grid.enabled?'block':'none'; gridLayer.style.backgroundSize = `${px}px ${px}px, ${px}px ${px}px`; } }

function downloadJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'boardgame-design-lab.json'; a.click();
  URL.revokeObjectURL(url);
}

let saveTimer = null;
function saveToStorageDebounced() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(persistKey, JSON.stringify(serializeLayout())); } catch {}
  }, 300);
}

// Autosave on interactions
const obs = new MutationObserver(() => saveToStorageDebounced());
obs.observe(playArea, { attributes:true, childList:true, subtree:true });
