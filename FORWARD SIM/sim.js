/* FORWARD Simple Simulator (Alpha)
 * Enhanced: Seed input, CSV card DB parsing, inventory panel, partial real effects.
 * TODO: Implement remaining location effects, companions, Dragon, precise XP timing.
 */

// Utility RNG (allow easy seeding later)
let RNG = {
  seed: Date.now() % 2147483647,
  next() { return this.seed = this.seed * 16807 % 2147483647; },
  rand() { return (this.next() - 1) / 2147483646; },
  pick(arr) { return arr[Math.floor(this.rand() * arr.length)]; },
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
};

// Layout coordinates (arbitrary grid space used for adjacency & farthest row rule approximation)
// Each entry is an array of 9 objects {id:1..9, x, y}
const LOCATIONS = [
  { key: 'termina', name: 'Home Village Termina', effect: 'None', layout: [
      {id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},
      {id:4,x:1,y:1},
      {id:5,x:0,y:2},{id:6,x:1,y:2},{id:7,x:2,y:2},
      {id:8,x:1,y:3},
      {id:9,x:1,y:4},
    ] },
  { key: 'worship', name: 'Shrine of Worship', effect: 'Must clear all 9', layout: [
      {id:1,x:1,y:0},
      {id:2,x:0,y:1},{id:3,x:1,y:1},{id:4,x:2,y:1},
      {id:5,x:1,y:2},
      {id:6,x:0,y:3},{id:7,x:1,y:3},{id:8,x:2,y:3},
      {id:9,x:1,y:4},
    ]},
  { key: 'valthria', name: 'Bannered City Valthria', effect: 'Item theft (not yet)', layout: [
      {id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:3,y:0},
      {id:5,x:2,y:1},
      {id:6,x:0,y:2},{id:7,x:1,y:2},{id:8,x:2,y:2},{id:9,x:3,y:2},
    ]},
  { key: 'spiremaze', name: 'Caelith Spiremaze', effect: 'Extra dmg on 1 (not yet)', layout: [
      {id:1,x:0,y:0},{id:2,x:2,y:0},
      {id:3,x:0,y:1},{id:4,x:2,y:1},
      {id:5,x:0,y:2},{id:6,x:2,y:2},
      {id:7,x:0,y:3},{id:8,x:2,y:3},
      {id:9,x:0,y:4},
    ]},
  { key: 'brume', name: 'Darkwood Brume', effect: 'Random flips (not yet)', layout: [
      {id:1,x:0,y:0},{id:2,x:1,y:0},
      {id:3,x:0,y:1},{id:4,x:2,y:1},
      {id:5,x:1,y:2},
      {id:6,x:0,y:3},{id:7,x:2,y:3},
      {id:8,x:1,y:4},{id:9,x:2,y:4},
    ]},
  { key: 'wastes', name: 'Sicorro Wastes', effect: 'Lose 1 HP each turn (TODO)', layout: [
      {id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},
      {id:4,x:0,y:1},{id:5,x:1,y:1},{id:6,x:2,y:1},
      {id:7,x:0,y:2},{id:8,x:1,y:2},{id:9,x:2,y:2},
    ]},
  { key: 'rotglade', name: 'Amara Rot Glade', effect: 'Rot after monsters (TODO)', layout: [
      {id:1,x:1,y:0},
      {id:2,x:0,y:1},{id:3,x:2,y:1},
      {id:4,x:1,y:2},{id:5,x:2,y:2},
      {id:6,x:0,y:3},{id:7,x:2,y:3},
      {id:8,x:1,y:4},
      {id:9,x:1,y:5},
    ]},
  { key: 'frozengaol', name: 'Frozen Gaol', effect: 'First roll -1 (TODO)', layout: [
      {id:1,x:0,y:0},{id:2,x:1,y:0},
      {id:3,x:0,y:1},{id:4,x:1,y:1},{id:5,x:2,y:1},
      {id:6,x:1,y:2},{id:7,x:2,y:2},
      {id:8,x:2,y:3},{id:9,x:3,y:3},
    ]},
  { key: 'nightsea', name: 'Nightsea Expanse', effect: 'Bury extra (TODO)', layout: [
      {id:1,x:0,y:0},{id:2,x:2,y:0},
      {id:3,x:1,y:1},
      {id:4,x:0,y:2},{id:5,x:1,y:2},{id:6,x:2,y:2},
      {id:7,x:1,y:3},
      {id:8,x:0,y:4},{id:9,x:2,y:4},
    ]},
];

// Card database parsing
let CARD_DB = []; // parsed raw
const LOCATION_CARDS = {}; // key -> cards (excluding the location card itself)

function parseCSVCardDB(csvText){
  const lines = csvText.split(/\r?\n/);
  const out=[]; let headerIndex = lines.findIndex(l=>/^card no/i.test(l.trim()));
  if (headerIndex===-1) return out;
  for (let i=headerIndex+1;i<lines.length;i++){
    const line=lines[i]; if(!line.trim()) continue; const parts=line.split(',');
    const no=parseInt(parts[0]); if(isNaN(no)) continue;
    const assoc=parts[1]; const type=(parts[2]||'').trim(); const name=(parts[3]||'').trim(); const effectCol=(parts[5]||'').trim();
    const obj={no,location:assoc,type,name,effect:effectCol,raw:line};
    // heuristics
    const fight=/fight:\s*(\d+)hp/i.exec(line); if(fight) obj.hp=parseInt(fight[1]);
    if(/equip:\s*.*1 ?atk/i.test(line)) obj.atk=(obj.atk||0)+1;
    if(/equip:\s*.*1 ?def/i.test(line)) obj.def=(obj.def||0)+1;
    const heal=/heal (\d+)/i.exec(line); if(heal) obj.heal=parseInt(heal[1]);
    if(/full heal/i.test(line)) obj.fullHeal=true;
    if(/instant death to humanoid/i.test(line)) obj.instantDeathHumanoid=true;
    if(/miss first 2/i.test(line)) obj.snareMissFirst=2; else if(/miss first attack/i.test(line)) obj.snareMissFirst=1;
    if(/first attack against deals double damage/i.test(line)) obj.snareDoubleFirstIncoming=true;
    if(/cleanse snare/i.test(line)) obj.cleansesSnare=true;
    if(/normal hit on 1/i.test(line)) obj.normalHitOn1=true;
    if(/block on 1-2/i.test(line)) obj.blockOn12=true;
    if(/use: deal 2 damage/i.test(line)) obj.itemDeal2=true;
    if(/when player reaches 0hp, heal 10/i.test(line)) obj.phoenixTear=true;
    if(/choose: -?(\d+)hp or bury/i.test(line)) obj.terrorHpLoss=parseInt(/choose: -?(\d+)hp/i.exec(line)[1]);
    if(/roll 1d6 save on (\d)\+, -?(\d+)hp/i.test(line)){ const m=/roll 1d6 save on (\d)\+, -?(\d+)hp/i.exec(line); obj.pitTN=parseInt(m[1]); obj.pitDmg=parseInt(m[2]); }
    if(/ -4hp & \+1dmg this combat/i.test(line)){ obj.moonleafBrandy=true; obj.hpSelfCost=4; obj.plusDamageThisCombat=1; }
    if(/use: 8 hp/i.test(line)) obj.heal=Math.max(obj.heal||0,8);
    out.push(obj);
  }
  return out;
}

function buildLocationIndex(){
  const locs = CARD_DB.filter(c=>c.type==='location');
  locs.forEach(l=>{
    const key=simplifyLocation(l.name||l.location);
    const assoc = CARD_DB.filter(c=>c.location===l.name && c.type!=='location');
    LOCATION_CARDS[key]=assoc;
  });
}
function simplifyLocation(name){return (name||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function cloneCard(c){return JSON.parse(JSON.stringify(c));}
function getNineCardsForLocation(key){
  const arr=LOCATION_CARDS[key];
  const desired=['scene','equipment','item','snare','hollow','pit','beast','terror','blessing'];
  if(!arr||arr.length<5){ // fallback random
    const pool = CARD_DB.filter(c=>desired.includes(c.type));
    return RNG.shuffle([...pool]).slice(0,9).map(cloneCard);
  }
  const picked=[];
  desired.forEach(t=>{ const f=arr.find(c=>c.type===t && !picked.includes(c)); if(f) picked.push(f); });
  while(picked.length<9) picked.push(RNG.pick(arr));
  return picked.slice(0,9).map(cloneCard);
}

// Game State
const G = {
  hp:20, maxHp:20, xp:0,
  atk:1, def:0,
  equipment:[], items:[],
  locationIndex:-1,
  board:[], // tiles: {id,x,y, card, state:'faceDown'|'revealed'|'resolved', start?:true}
  buried:0,
  startTile:null,
  farthestRowY:null,
  fights:0,
  // New systems
  xpPile:[],
  deck:[],
  princess:false, princessActivated:false,
  sage:false, sageActivated:false,
  mirrorKnightInserted:false,
  locationXPGranted:false,
};

// DOM
const el = id => document.getElementById(id);
const hud = { hp:el('hp'), maxHp:el('maxHp'), xp:el('xp'), buried:el('buried'), loc:el('locationName'), log:el('log') };
const buttons = { start:el('btnStart'), nextLoc:el('btnNextLocation'), dragon:el('btnDragon'), reset:el('btnReset') };
const boardEl = el('board');
const seedInput = el('seedInput');
const equipmentList = el('equipmentList');
const itemList = el('itemList');
const combatItemButtons = el('combatItemButtons');
const inCombatActions = el('inCombatActions');
const companionStatus = el('companionStatus');
const runSummaryEl = el('runSummary');
const summaryPanel = el('summaryPanel');
const copySummaryBtn = el('copySummary');

// Replace log implementation
function log(msg) { const line=document.createElement('div'); line.textContent=msg; hud.log.appendChild(line); hud.log.scrollTop=hud.log.scrollHeight; }

function updateHUD() {
  hud.hp.textContent = G.hp; hud.maxHp.textContent = G.maxHp; hud.xp.textContent = G.xp; hud.buried.textContent = G.buried; hud.loc.textContent = G.locationIndex >=0 ? LOCATIONS[G.locationIndex].name : '-';
}

function applySeed(v){ if(!v) return; let s=0; for(let i=0;i<v.length;i++) s=(s*31+v.charCodeAt(i))%2147483647; if(s<=0) s=Date.now()%2147483647; RNG.seed=s; }
function startGame() {
  applySeed(seedInput.value.trim());
  Object.assign(G,{
    hp:20,maxHp:20,xp:0,atk:1,def:0,
    equipment:[],items:[],locationIndex:-1,board:[],buried:0,startTile:null,farthestRowY:null,fights:0,
    xpPile:[],deck:[],princess:false,princessActivated:false,sage:false,sageActivated:false,mirrorKnightInserted:false,locationXPGranted:false
  });
  hud.log.textContent=''; summaryPanel.style.display='none';
  log('Game started. Seed='+RNG.seed);
  buildFullDeck();
  RNG.shuffle(LOCATIONS); // randomize location order
  buttons.start.disabled = true; buttons.reset.disabled = false; buttons.nextLoc.disabled = false; buttons.dragon.disabled = true;
  updateCompanions();
  nextLocation();
}

function nextLocation() {
  G.locationIndex++;
  if (G.locationIndex >= LOCATIONS.length) { log('All 9 locations cleared. Enable Dragon fight.'); buttons.nextLoc.disabled = true; buttons.dragon.disabled = false; return; }
  const loc = LOCATIONS[G.locationIndex];
  log(`Entering Location: ${loc.name} — Effect: ${loc.effect}`);
  // Build board
  const key = simplifyLocation(loc.name);
  const cards = getNineCardsForLocation(key);
  G.board = loc.layout.map((cell,i) => ({ id:cell.id, x:cell.x, y:cell.y, card:cards[i], state:'faceDown' }));
  G.locationXPGranted=false;
  G.startTile = null; G.farthestRowY = null;
  renderBoard(); updateHUD();
  log('Choose any starting adjacent (any face-down tile) — first flip sets your start.');
}

function renderBoard() {
  const loc = LOCATIONS[G.locationIndex];
  if (!loc) return;
  // Compute grid size
  const maxX = Math.max(...loc.layout.map(c=>c.x));
  const maxY = Math.max(...loc.layout.map(c=>c.y));
  boardEl.style.gridTemplateColumns = `repeat(${maxX+1}, 72px)`;
  boardEl.innerHTML='';
  G.board.forEach(tile => {
    const d = document.createElement('div');
    d.className = 'tile ' + tile.state + (tile.start?' start':'');
    d.dataset.id = tile.id;
    d.style.gridColumnStart = tile.x+1;
    d.style.gridRowStart = tile.y+1;
    if (tile.state === 'faceDown') {
      d.textContent = '?';
      if (canFlip(tile)) d.classList.add('adjacent');
    } else {
      d.innerHTML = `<div>${tile.card.name}</div><div class="tag ${cssTag(tile.card.type)}">${tile.card.type}</div>`;
    }
    d.addEventListener('click', () => tryFlip(tile.id));
    boardEl.appendChild(d);
  });
}

function cssTag(type) {
  switch(type){
    case 'monster': return 'monster';
    case 'item': return 'item';
    case 'equipment': return 'equipment';
    case 'scene': return 'scene';
    case 'pit': return 'pit';
    case 'snare': return 'snare';
    case 'terror': return 'terror';
    case 'blessing': return 'blessing';
    default: return 'special';
  }
}

function canFlip(tile) {
  if (tile.state !== 'faceDown') return false;
  if (!G.startTile) {
    const faces=G.board.filter(t=>t.state==='faceDown');
    if(!faces.length) return false;
    const xs=G.board.map(t=>t.x), ys=G.board.map(t=>t.y);
    const cx=(Math.max(...xs)+Math.min(...xs))/2, cy=(Math.max(...ys)+Math.min(...ys))/2;
    const dist=t=>Math.hypot(t.x-cx,t.y-cy); const min=Math.min(...faces.map(dist));
    return Math.abs(dist(tile)-min) < 1e-6;
  }
  return G.board.some(rt => (rt.state==='revealed'||rt.state==='resolved') && isAdjacent(rt,tile));
}
function isAdjacent(a,b){ const dx=Math.abs(a.x-b.x), dy=Math.abs(a.y-b.y); return dx+dy===1 || (dx===1 && dy===1); }

function neighbors(tile, mode='all') {
  return G.board.filter(t => {
    const dx = Math.abs(t.x - tile.x); const dy = Math.abs(t.y - tile.y);
    if (mode==='orth') return (dx+dy)===1;
    if (mode==='diag') return dx===1 && dy===1;
    return (dx+dy)===1 || (dx===1&&dy===1);
  });
}

function tryFlip(id) {
  const tile = G.board.find(t=>t.id===id);
  if (!tile || !canFlip(tile)) return;
  flip(tile);
}

function flip(tile) {
  tile.state='revealed';
  if (!G.startTile) { G.startTile = tile; tile.start = true; G.currentPos = tile; computeFarthestRow(); }
  log(`Revealed tile ${tile.id}: ${tile.card.name} [${tile.card.type}]`);
  resolve(tile);
  renderBoard();
  checkLocationEnd();
  updateHUD();
}

function computeFarthestRow() {
  // crude: farthest row y = max y among layout relative to start's y axis direction downward
  const startY = G.startTile.y;
  G.farthestRowY = Math.max(...G.board.map(t=>t.y));
}

function resolve(tile){
  const c=tile.card;
  // Special companions & mirror knight by name, not relying on type
  if(c && /ghostly princess/i.test(c.name)) { revealCompanion(c,tile); return; }
  if(c && /^sage$/i.test(c.name)) { revealCompanion(c,tile); return; }
  if(c && /mirror knight/i.test(c.name)) { tile.state='revealed'; revealMirrorKnight(tile); return; }
  switch(c.type){
    case 'hollow':
    case 'beast': combat(c,tile); break;
    case 'scene': handleScene(c,tile); break;
    case 'pit': handlePit(c,tile); break;
    case 'terror': handleTerror(c,tile); break;
    case 'snare': handleSnare(c,tile); break;
    case 'blessing': handleBlessing(c,tile); break;
    case 'item': pickupItem(c,tile); break;
    case 'equipment': equipItem(c,tile); break;
    default: tile.state='resolved'; addToXPPile(c); break;
  }
  G.currentPos=tile;
  refreshInventoryPanel();
  // Location XP if all 9 cleared
  if(!G.locationXPGranted && G.board.every(t=>t.state==='resolved')){ G.locationXPGranted=true; addToXPPile({name:LOCATIONS[G.locationIndex].name,type:'location',xp:1}); log('Location cleared: XP +1.'); }
}

function handleScene(c,tile){ if(c.fullHeal){ const b=G.hp; G.hp=G.maxHp; log(`Scene full heal (${b}→${G.hp}).`);} else if(c.heal){ const b=G.hp; G.hp=Math.min(G.maxHp,G.hp+c.heal); log(`Scene heal +${c.heal} (${b}→${G.hp}).`);} addToXPPile(c); tile.state='resolved'; }
function handlePit(c,tile){ const tn=c.pitTN||4; const dmg=c.pitDmg||3; const r=d6(); const pass=r>=tn; log(`Pit roll ${r} vs TN${tn} ${pass?'success':'FAIL'}`); if(!pass) takeDamage(dmg,'Pit'); addToXPPile(c); tile.state='resolved'; }
function handleTerror(c,tile){ const loss=c.terrorHpLoss||4; if(G.hp>loss+1){ takeDamage(loss,'Terror'); addToXPPile(c); tile.state='resolved'; } else { log('Bury Terror (low HP).'); buryCard(tile);} }
function handleSnare(c,tile){ log(`Snare: ${c.name}`); if(c.snareMissFirst) G.snareMissesRemaining=c.snareMissFirst; if(/-1atk/i.test(c.raw)) {G.atk-=1; c.modAtk=-1;} if(/-1def/i.test(c.raw)) {G.def-=1; c.modDef=-1;} if(c.snareDoubleFirstIncoming) G.snareDoubleFirstIncoming=true; tile.state='revealed'; (G.activeSnare||(G.activeSnare=[])).push(c); }
function handleBlessing(c,tile){ log(`Blessing: ${c.name}`); if(c.cleansesSnare) cleanseAllSnares(); if(c.fullHeal){ const b=G.hp; G.hp=G.maxHp; log(`Full heal (${b}→${G.hp})`);} if(c.normalHitOn1) G.normalHitOn1=true; if(c.blockOn12) G.blockOn12=true; addToXPPile(c); tile.state='resolved'; }
function cleanseAllSnares(){ if(!G.activeSnare) return; G.activeSnare.forEach(s=>{ if(s.modAtk) G.atk-=s.modAtk; if(s.modDef) G.def-=s.modDef; addToXPPile(s); }); log('Cleansed snares.'); G.activeSnare=[]; G.snareMissesRemaining=0; G.snareDoubleFirstIncoming=false; }

function gainXP(card) { G.xp += card.xp||1; G.maxHp += card.xp||1; }
function addToXPPile(card){ if(!card) return; G.xpPile.push({name:card.name,type:card.type}); gainXP(card); }
function gainXPOnClearLater(card, tile) { /* placeholder: clearing snare not yet implemented */ }

function takeDamage(amount, reason='Damage') { const before=G.hp; G.hp -= amount; log(`${reason}: -${amount} HP (${before}→${G.hp})`); if (G.hp<=0){ log('You died. Game over.'); disableAll(); } }

function pickupItem(item,tile){ if(G.items.length>=2){ log('Item limit reached; auto-use/discard.'); autoUseOrDiscard(item); tile.state='resolved'; return;} G.items.push(item); log(`Picked up item: ${item.name}`); tile.state='resolved'; updateCompanions(); }

function equipItem(eq,tile){ if(G.equipment.length>=2){ const removed=G.equipment.shift(); log(`Unequipped ${removed.name} -> XP.`); addToXPPile(removed);} G.equipment.push(eq); G.atk+=(eq.atk||0); G.def+=(eq.def||0); if(/gilded bangle/i.test(eq.name) && G.princess){ G.princessActivated=true; log('Ghostly Princess activated.'); } if(/ferryman's bell/i.test(eq.name) && G.sage){ G.sageActivated=true; log('Sage activated.'); }
  log(`Equipped ${eq.name} (+${eq.atk||0} ATK +${eq.def||0} DEF)`); tile.state='resolved'; updateHUD(); updateCompanions(); }

function autoUseOrDiscard(item){ if(item.heal){ const b=G.hp; G.hp=Math.min(G.maxHp,G.hp+item.heal); log(`Auto-used ${item.name} +${item.heal}HP (${b}→${G.hp})`); addToXPPile(item);} else { log(`Discarded ${item.name} -> XP.`); addToXPPile(item);} }
function useItem(i){ const item=G.items[i]; if(!item) return; if(item.moonleafBrandy){ takeDamage(item.hpSelfCost,'Moonleaf Brandy'); G.plusDamageThisCombat=(G.plusDamageThisCombat||0)+(item.plusDamageThisCombat||1);} if(item.itemDeal2){ G.pendingTrueDamage=(G.pendingTrueDamage||0)+2; }
  if(item.heal){ const b=G.hp; G.hp=Math.min(G.maxHp,G.hp+item.heal); log(`Used ${item.name} +${item.heal}HP (${b}→${G.hp})`);} if(item.phoenixTear){ G.phoenixTear=true; log('Phoenix Tear primed.'); }
  if(item.instantDeathHumanoid){ G.instantKillHumanoid=true; log('Blacksap Thorn primed for next humanoid (hollow) combat.'); }
  G.items.splice(i,1); addToXPPile(item); refreshInventoryPanel(); updateHUD(); updateCompanions(); }

function buryCard(tile) { tile.state='resolved'; tile.buried=true; G.buried++; }

function currentLocationKey(){ return LOCATIONS[G.locationIndex]?.key; }
function hasEquipment(name){ return G.equipment.some(e=> e.name && e.name.toLowerCase().includes(name.toLowerCase())); }

function combat(enemy,tile){ if(!enemy.hp) enemy.hp= enemy.type==='beast'?5:3; const locKey=currentLocationKey(); log(`Combat vs ${enemy.name} (HP ${enemy.hp})`); G.fights++; inCombatActions.style.display='block'; refreshInventoryPanel(); let eHP=enemy.hp; let round=1; let doublePending=G.snareDoubleFirstIncoming; let moonBonus=G.plusDamageThisCombat||0; let firstRollPenaltyApplied=false; if(G.instantKillHumanoid && enemy.type==='hollow'){ log('Blacksap Thorn slays the humanoid instantly.'); eHP=0; G.instantKillHumanoid=false; }
  while(G.hp>0 && eHP>0){ let pr=d6(); let er=d6(); let originalPr=pr; // Frozen Gaol first roll -1
    if(!firstRollPenaltyApplied && locKey==='frozengaol'){ pr=Math.max(1,pr-1); firstRollPenaltyApplied=true; }
    // forced miss snares
    if(G.snareMissesRemaining>0){ originalPr=pr; pr=1; G.snareMissesRemaining--; log('[Snare] Forced miss.'); }
    if(G.normalHitOn1 && pr===1) pr=3; // treat as hit after modifications
    const pRes=rollToOutcome(pr); const eRes=rollToOutcome(er); let pDmg=baseDamage(pRes); let eDmg=baseDamage(eRes); if(pDmg>0) pDmg += G.atk + moonBonus; if(G.pendingTrueDamage){ eHP-=G.pendingTrueDamage; log(`True damage ${G.pendingTrueDamage}`); G.pendingTrueDamage=0; }
    if(pRes==='counter' && eRes==='counter'){ pDmg=0; eDmg=0; }
    eDmg=Math.max(0,eDmg-G.def); if(doublePending && eDmg>0){ eDmg*=2; doublePending=false; }
    if(G.blockOn12 && eDmg>0){ const br=d6(); if(br<=2){ log('Mirrored Shield block'); eDmg=0; } }
    // Spiremaze perilous climb: whenever YOU roll a 1 (after modifiers? rule implies raw roll). Use originalPr value before transforms.
    if(locKey==='spiremaze' && originalPr===1){ const extra=Math.max(0,1-G.def); if(extra>0){ G.hp-=extra; log(`Perilous Climb extra dmg +${extra}`); } }
    if(pDmg>0) eHP-=pDmg; if(eDmg>0){ G.hp-=eDmg; if(G.hp<=0 && G.phoenixTear){ G.phoenixTear=false; const before=G.hp; G.hp=Math.min(G.maxHp,G.hp+10); log(`Phoenix Tear triggers (${before}→${G.hp})`);} }
    log(`R${round}: You ${pRes}->${pDmg} vs ${eRes}->${eDmg} | Enemy ${Math.max(0,eHP)} You ${Math.max(0,G.hp)}`); if(G.hp<=0){ log('You fell.'); disableAll(); inCombatActions.style.display='none'; return; } round++; if(G.instantKillHumanoid && enemy.type==='hollow'){ eHP=0; G.instantKillHumanoid=false; log('Blacksap Thorn triggers mid-fight.'); }
  }
  if(eHP<=0){ log(`Defeated ${enemy.name}`); // Rot Glade rot effect
    if(locKey==='rotglade'){ const rr=d6(); if(rr<=3){ takeDamage(1,'Creeping Rot'); } }
    addToXPPile(enemy); tile.state='resolved'; }
  inCombatActions.style.display='none'; refreshInventoryPanel(); }

function rollToOutcome(r) {
  switch(r){
    case 1: return 'miss';
    case 2: return 'parry';
    case 3: case 4: return 'hit';
    case 5: return 'crit';
    case 6: return 'counter';
  }
}
function baseDamage(res) { switch(res){ case 'hit': return 1; case 'crit': return 2; case 'counter': return 1; default: return 0; } }
function d6() { return 1 + Math.floor(RNG.rand()*6); }

function checkLocationEnd() {
  if (!G.startTile) return; // not started
  // rule approximation: if last flipped row y equals farthestRowY you may leave
  if (G.currentPos.y === G.farthestRowY) {
    const loc = LOCATIONS[G.locationIndex];
    if (loc.key==='worship') { // must clear all 9
  if (G.board.every(t=>t.state==='resolved')) { log('Shrine cleared (all 9). Location card to XP.'); if(!G.locationXPGranted){ G.locationXPGranted=true; addToXPPile({name:loc.name,type:'location',xp:1}); } buttons.nextLoc.disabled=false; }
      else { log('You have reached farthest row but must clear all due to Shrine effect.'); }
    } else {
      log('Reached farthest row — you may proceed to next location. Unrevealed cards will be buried.');
      // auto-bury remaining for now
      const unrevealed = G.board.filter(t=>t.state==='faceDown');
      unrevealed.forEach(t=> { buryCard(t); });
      if (unrevealed.length) log(`Buried ${unrevealed.length} unrevealed cards.`);
      buttons.nextLoc.disabled=false;
    }
  } else {
    // disable next loc until farthest row reached or all resolved in clearing-mandatory cases
    buttons.nextLoc.disabled=true;
  }
}

// Map turn pre-effects wrappers
const originalFlip = flip;
flip = function(tile){ // override to inject location start-of-turn effects & Nightsea bury flag
  const locKey=currentLocationKey();
  // Start of map turn effects BEFORE flipping per rules
  if(tile && G.startTile){
    if(locKey==='wastes'){ takeDamage(1,'Scorching Sun'); if(G.hp<=0) return; }
    if(locKey==='brume'){ const r=d6(); if(r<=2){ // force random eligible adjacent flip instead
        const candidates=G.board.filter(t=> t.state==='faceDown' && canFlip(t));
        if(candidates.length){ const forced=RNG.pick(candidates); log('Mists force a random flip.'); tile=forced; }
      }
    }
  }
  // Nightsea chained bury effect: if a previous bury flagged next flip bury
  if(locKey==='nightsea' && G.nightseaBuryNext){ tile.state='revealed'; log('Nightsea pull buries this card immediately: '+tile.card.name); buryCard(tile); G.nightseaBuryNext=false; renderBoard(); checkLocationEnd(); updateHUD(); return; }
  originalFlip(tile);
};

// Override buryCard to add Nightsea chained bury flag
const _bury = buryCard; buryCard = function(tile){ const locKey=currentLocationKey(); _bury(tile); if(locKey==='nightsea' && !G.nightseaBuryNext){ G.nightseaBuryNext=true; log('Nightsea pull primed: next flipped card will also be buried.'); } };

// Valthria item theft flag
let valthriaItemCheckDone=false;
const originalPickup = pickupItem; pickupItem = function(item,tile){ const locKey=currentLocationKey(); if(locKey==='valthria' && !valthriaItemCheckDone){ valthriaItemCheckDone=true; const r=d6(); if(r<=3){ log(`Thieves steal ${item.name}. (Buried)`); buryCard(tile); return; } else { log('Item avoided theft.'); } } originalPickup(item,tile); };

// Dragon fight implementation (simplified)
buttons.dragon.onclick = () => { startDragonFight(); };
function startDragonFight(){ if(G.dragonDefeated){ log('Dragon already defeated.'); return;} const dragonHPBase=40 + G.buried; G.dragonShield = !G.princessActivated; G.dragonHP = dragonHPBase; if(G.sageActivated){ G.dragonHP = Math.ceil(G.dragonHP/2); log('Sage halves Dragon HP.'); G.sageActivated=false; } log(`Dragon of Chaos appears (HP ${G.dragonHP}) ${G.dragonShield?'[Shielded]':''}`); dragonCombat(); }
function dragonCombat(){ if(G.dragonHP<=0) return; if(G.hp<=0) return; let round=1; while(G.dragonHP>0 && G.hp>0){ let pr=d6(); let er=d6(); // Dragon uses same duel table w/out DEF
    if(G.normalHitOn1 && pr===1) pr=3; const pRes=rollToOutcome(pr); const dRes=rollToOutcome(er); let pDmg=baseDamage(pRes); let dDmg=baseDamage(dRes); if(pDmg>0) pDmg += G.atk + (G.plusDamageThisCombat||0); dDmg = Math.max(0, dDmg - G.def); if(pRes==='counter' && dRes==='counter'){ pDmg=0; dDmg=0; }
    // Shield & Ancient Sword gate
    if(G.dragonShield){ pDmg=0; } else if(!hasEquipment('ancient sword')) { pDmg=0; }
    if(pDmg>0) G.dragonHP -= pDmg; if(dDmg>0){ G.hp -= dDmg; if(G.hp<=0 && G.phoenixTear){ G.phoenixTear=false; const before=G.hp; G.hp=Math.min(G.maxHp,G.hp+10); log(`Phoenix Tear triggers (${before}→${G.hp})`);} }
    log(`Dragon R${round}: You ${pRes}->${pDmg} | Dragon ${dRes}->${dDmg} | DragonHP ${Math.max(0,G.dragonHP)} YouHP ${Math.max(0,G.hp)}`);
    // Princess shield removal check (simulate arrival consumption if not already removed)
    if(G.dragonShield && G.princessActivated){ G.dragonShield=false; G.princessActivated=false; log('Ghostly Princess sacrifices: Shield removed.'); }
    if(G.hp<=0){ log('You are slain by the Dragon.'); disableAll(); return; }
  if(G.dragonHP<=0){ log('Dragon of Chaos defeated! Victory!'); G.dragonDefeated=true; disableAll(); showRunSummary(); return; }
    round++;
  }
}


function disableAll() { Object.values(buttons).forEach(b=>b.disabled=true); buttons.reset.disabled=false; }

buttons.start.addEventListener('click', startGame);
buttons.reset.addEventListener('click', () => { buttons.start.disabled=false; buttons.reset.disabled=true; buttons.nextLoc.disabled=true; buttons.dragon.disabled=true; hud.log.textContent=''; boardEl.innerHTML=''; Object.assign(G,{}); updateHUD(); });
buttons.nextLoc.addEventListener('click', () => { buttons.nextLoc.disabled=true; nextLocation(); });
buttons.dragon.addEventListener('click', () => { log('Dragon fight not yet implemented. Need real mechanics & Ancient Sword handling.'); });

updateHUD();
log('Press Start Game to begin.');
// Load CSV (relative path) if accessible
fetch('FORWARD%20CARDS%20DB%20-%20v3%20raw%20restart%208.14.25.csv').then(r=>r.text()).then(txt=>{ CARD_DB=parseCSVCardDB(txt); buildLocationIndex(); buildFullDeck(); log(`Loaded card DB: ${CARD_DB.length} cards.`); }).catch(()=> log('Card DB load failed; using placeholder generator.'));

function refreshInventoryPanel(){ if(!equipmentList) return; equipmentList.innerHTML='<em>Equipment:</em> ' + (G.equipment.map(e=>e.name).join(', ')||'—'); itemList.innerHTML='<em>Items:</em> ' + (G.items.map((it,i)=>`<button style="background:#243040;border:1px solid #38495c;padding:2px 4px;border-radius:3px;" onclick="useItem(${i})">${it.name}</button>`).join(' ')||'—'); }
window.useItem=useItem;
copySummaryBtn?.addEventListener('click',()=>{ const txt=runSummaryEl.textContent; navigator.clipboard.writeText(txt).then(()=>log('Run summary copied.')); });

function updateCompanions(){ if(!companionStatus) return; const parts=[]; parts.push(`Princess: ${G.princess? (G.princessActivated?'Activated':'Present'): '—'}`); parts.push(`Sage: ${G.sage? (G.sageActivated?'Activated':'Present'): '—'}`); companionStatus.textContent=parts.join(' | '); }

// Deck / companions / mirror knight
function buildFullDeck(){
  if(!CARD_DB.length) return;
  const specials = CARD_DB.filter(c=>['Ghostly Princess','Sage','Mirror Knight'].includes(c.name));
  const others = CARD_DB.filter(c=> !['location','special'].includes(c.type) && !['The Dragon of Chaos','Ghostly Princess','Sage','Mirror Knight'].includes(c.name));
  let deck = [...others];
  const princess = specials.find(s=>/ghostly princess/i.test(s.name)); if(princess) deck.push(princess);
  const sage = specials.find(s=>/^Sage$/i.test(s.name)); if(sage) deck.push(sage);
  RNG.shuffle(deck);
  G.deck = deck.map(cloneCard);
  if(!G.mirrorKnightInserted){ insertMirrorKnight(); }
}
function insertMirrorKnight(){ const mk = CARD_DB.find(c=>/mirror knight/i.test(c.name)); if(!mk) return; const mid = Math.floor(G.deck.length/2); G.deck.splice(mid,0,cloneCard(mk)); G.mirrorKnightInserted=true; }
function drawCard(){ return G.deck.shift(); }

function revealCompanion(card,tile){ if(/ghostly princess/i.test(card.name)){ G.princess=true; log('Ghostly Princess appears. Equip Gilded Bangle to activate.'); } else if(/^sage$/i.test(card.name)){ G.sage=true; log('Sage appears. Equip Ferryman\'s Bell to activate.'); }
  const replacement = drawCard(); if(replacement){ tile.card=replacement; tile.state='faceDown'; log('Replacement card placed face-down.'); } updateCompanions(); renderBoard(); }

function revealMirrorKnight(tile){ const mkHP = G.hp; const copy = { name:'Mirror Knight', type:'mirror', hp:mkHP, atk:G.atk, def:G.def }; log('Mirror Knight manifests.'); mirrorDuel(copy,tile); }
function mirrorDuel(enemy,tile){ let eHP=enemy.hp; let round=1; while(G.hp>0 && eHP>0){ let pr=d6(); let er=d6(); const pRes=rollToOutcome(pr); const eRes=rollToOutcome(er); let pDmg=baseDamage(pRes)+(pRes!=='miss'&&pRes!=='parry'?G.atk:0); let eDmg=baseDamage(eRes)+(eRes!=='miss'&&eRes!=='parry'?enemy.atk:0); if(pRes==='counter' && eRes==='counter'){ pDmg=0; eDmg=0; } eDmg=Math.max(0,eDmg - G.def); pDmg=Math.max(0,pDmg - enemy.def); if(pDmg>0) eHP-=pDmg; if(eDmg>0) G.hp-=eDmg; log(`Mirror R${round}: You ${pRes}->${pDmg} vs MK ${eRes}->${eDmg} | MK ${Math.max(0,eHP)} You ${Math.max(0,G.hp)}`); if(G.hp<=0) { log('Mirror Knight defeats you.'); disableAll(); return; } round++; }
  if(eHP<=0){ log('Mirror Knight defeated.'); const replacement = drawCard(); if(replacement){ tile.card=replacement; tile.state='faceDown'; log('Space refilled face-down.'); renderBoard(); } }
}

function showRunSummary(){ if(!runSummaryEl) return; const summary={ seed:RNG.seed, hp:G.hp, maxHp:G.maxHp, xp:G.xp, buried:G.buried, princess:G.princessActivated, sage:G.sageActivated, equipment:G.equipment.map(e=>e.name), items:G.items.map(i=>i.name), xpPile:G.xpPile }; runSummaryEl.textContent=JSON.stringify(summary,null,2); summaryPanel.style.display='block'; }
