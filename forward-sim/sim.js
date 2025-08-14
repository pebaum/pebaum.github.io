/* FORWARD Simulator (Effectless Build) v2025-08-14-a */
/* Changelog: location effects removed, clean path deployment, version tag + cache bust. */

// ---------------- RNG ----------------
const RNG = { seed: Date.now()%2147483647, applySeed(v){ let s=0; if(!v){ s=Date.now()%2147483647; } else if(/^-?\d+$/.test(v)) s=parseInt(v,10)%2147483647; else { for(let i=0;i<v.length;i++) s=(s*131+v.charCodeAt(i))%2147483647; } if(s<=0) s+=2147483646; this.seed=s; }, next(){ return this.seed=this.seed*16807%2147483647; }, rand(){ return (this.next()-1)/2147483646; }, pick(a){ return a[Math.floor(this.rand()*a.length)]; }, shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(this.rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; } };

// ---------------- Locations ----------------
const LOCATIONS_BASE=[
 { key:'termina', name:'Home Village Termina', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:1,y:1},{id:5,x:0,y:2},{id:6,x:1,y:2},{id:7,x:2,y:2},{id:8,x:1,y:3},{id:9,x:1,y:4}] },
 { key:'worship', name:'Shrine of Worship', effect:'', layout:[{id:1,x:1,y:0},{id:2,x:0,y:1},{id:3,x:1,y:1},{id:4,x:2,y:1},{id:5,x:1,y:2},{id:6,x:0,y:3},{id:7,x:1,y:3},{id:8,x:2,y:3},{id:9,x:1,y:4}] },
 { key:'valthria', name:'Bannered City Valthria', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:3,y:0},{id:5,x:2,y:1},{id:6,x:0,y:2},{id:7,x:1,y:2},{id:8,x:2,y:2},{id:9,x:3,y:2}] },
 { key:'spiremaze', name:'Caelith Spiremaze', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:2,y:0},{id:3,x:0,y:1},{id:4,x:2,y:1},{id:5,x:0,y:2},{id:6,x:2,y:2},{id:7,x:0,y:3},{id:8,x:2,y:3},{id:9,x:0,y:4}] },
 { key:'brume', name:'Darkwood Brume', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:0,y:1},{id:4,x:2,y:1},{id:5,x:1,y:2},{id:6,x:0,y:3},{id:7,x:2,y:3},{id:8,x:1,y:4},{id:9,x:2,y:4}] },
 { key:'wastes', name:'Sicorro Wastes', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:0,y:1},{id:5,x:1,y:1},{id:6,x:2,y:1},{id:7,x:0,y:2},{id:8,x:1,y:2},{id:9,x:2,y:2}] },
 { key:'rotglade', name:'Amara Rot Glade', effect:'', layout:[{id:1,x:1,y:0},{id:2,x:0,y:1},{id:3,x:2,y:1},{id:4,x:1,y:2},{id:5,x:2,y:2},{id:6,x:0,y:3},{id:7,x:2,y:3},{id:8,x:1,y:4},{id:9,x:1,y:5}] },
 { key:'frozengaol', name:'Frozen Gaol', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:0,y:1},{id:4,x:1,y:1},{id:5,x:2,y:1},{id:6,x:1,y:2},{id:7,x:2,y:2},{id:8,x:2,y:3},{id:9,x:3,y:3}] },
 { key:'nightsea', name:'Nightsea Expanse', effect:'', layout:[{id:1,x:0,y:0},{id:2,x:2,y:0},{id:3,x:1,y:1},{id:4,x:0,y:2},{id:5,x:1,y:2},{id:6,x:2,y:2},{id:7,x:1,y:3},{id:8,x:0,y:4},{id:9,x:2,y:4}] },
];

// ---------------- Card DB Parsing ----------------
let CARD_DB=[]; const LOCATION_CARDS={};
// Location key normalization (strip punctuation, leading 'the', and map spelling variants)
const LOCATION_ALIASES={
  'sicorro wastes':'sirroco wastes', // unify spelling
  'sirroco wastes':'sirroco wastes'
};
function simplifyLocation(n){
  let k=(n||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  if(k.startsWith('the ')) k=k.slice(4); // drop leading 'the'
  if(LOCATION_ALIASES[k]) k=LOCATION_ALIASES[k];
  return k;
}
function clone(o){return JSON.parse(JSON.stringify(o));}
function parseCSV(csv){
  function splitLine(line){
    const res=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"') { // toggle quote unless escaped
        if(q && line[i+1]==='"') { cur+='"'; i++; }
        else q=!q;
      } else if(ch===',' && !q){ res.push(cur); cur=''; }
      else cur+=ch;
    }
    res.push(cur); return res;
  }
  const lines=csv.split(/\r?\n/); const out=[]; const headIndex=lines.findIndex(l=>/^card no/i.test(l)); if(headIndex===-1) return out;
  for(let i=headIndex+1;i<lines.length;i++){
    const row=lines[i]; if(!row.trim()) continue;
    const parts=splitLine(row);
    const assoc=(parts[1]||'').trim();
    const typeRaw=(parts[2]||'').trim();
    const name=(parts[3]||'').trim();
    const raw=row; let type=typeRaw;
    const o={name,type,location:assoc,raw};
    if(/(\d+)hp/i.test(raw)&&/fight/i.test(raw)) o.hp=parseInt(/(\d+)hp/i.exec(raw)[1]);
    if(/equip:.*1 ?atk/i.test(raw)) o.atk=(o.atk||0)+1;
    if(/equip:.*1 ?def/i.test(raw)) o.def=(o.def||0)+1;
    if(/heal (\d+)/i.test(raw)) o.heal=parseInt(/heal (\d+)/i.exec(raw)[1]);
    if(/full heal/i.test(raw)) o.fullHeal=true;
    if(/miss first 2/i.test(raw)) o.snareMissFirst=2; else if(/miss first attack/i.test(raw)) o.snareMissFirst=1;
    if(/first attack against deals double damage/i.test(raw)) o.snareDoubleFirstIncoming=true;
    if(/cleanse snare/i.test(raw)) o.cleansesSnare=true;
    if(/normal hit on 1/i.test(raw)) o.normalHitOn1=true;
    if(/block on 1-2/i.test(raw)) o.blockOn12=true;
    if(/when player reaches 0hp, heal 10/i.test(raw)) o.phoenixTear=true;
    if(/choose: -?(\d+)hp or bury/i.test(raw)) o.terrorHpLoss=parseInt(/choose: -?(\d+)hp/i.exec(raw)[1]);
    if(/save on (\d)/i.test(raw)&&/pit/i.test(raw)) o.pitTN=parseInt(/save on (\d)/i.exec(raw)[1]);
    if(['hollow','beast','scene','pit','snare','terror','blessing','item','equipment','location'].indexOf(type)===-1){
      if(/equip:/i.test(raw)) type='equipment';
      else if(/use:/i.test(raw)||/heal/i.test(raw)) type='item';
      else if(/fight:/i.test(raw)) type='hollow';
      else type='scene';
    }
    o.type=type;
    out.push(o);
  }
  return out;
}
function indexLocationCards(){ const locs=CARD_DB.filter(c=>c.type==='location'); locs.forEach(l=>{ const key=simplifyLocation(l.name||l.location); LOCATION_CARDS[key]=CARD_DB.filter(c=>c.location===l.name && c.type!=='location'); }); }
function cardsForLocation(key){ const desired=['scene','equipment','item','snare','hollow','pit','beast','terror','blessing']; const pool=LOCATION_CARDS[key]; if(!pool||pool.length<5){ const rand=CARD_DB.filter(c=>desired.includes(c.type)); return RNG.shuffle(rand.slice()).slice(0,9).map(clone);} const picked=[]; desired.forEach(t=>{ const f=pool.find(c=>c.type===t&&!picked.includes(c)); if(f) picked.push(f); }); while(picked.length<9) picked.push(RNG.pick(pool)); return picked.slice(0,9).map(clone); }

// ---------------- State ----------------
const G={ hp:20,maxHp:20,xp:0,atk:1,def:0,equipment:[],items:[],board:[],locationOrder:[],locIndex:-1,startTile:null,snareMisses:0,snareDouble:false,normalHitOn1:false,blockOn12:false,buried:0,xpPile:[],plusDmgTemp:0,pendingTrue:0,
  quest:{ haveSword:false, princessDelivered:false, sageDelivered:false, pendingPrincessCard:false, pendingSageCard:false }
};
function resetState(){ Object.assign(G,{ hp:20,maxHp:20,xp:0,atk:1,def:0,equipment:[],items:[],board:[],locationOrder:[],locIndex:-1,startTile:null,snareMisses:0,snareDouble:false,normalHitOn1:false,blockOn12:false,buried:0,xpPile:[],plusDmgTemp:0,pendingTrue:0,
  quest:{ haveSword:false, princessDelivered:false, sageDelivered:false, pendingPrincessCard:false, pendingSageCard:false }
}); }

// ---------------- DOM ----------------
const el=id=>document.getElementById(id);
const hud={hp:el('hp'),maxHp:el('maxHp'),xp:el('xp'),buried:el('buried'),loc:el('locationName'),log:el('log')};
const buttons={start:el('btnStart'),next:el('btnNextLocation'),dragon:el('btnDragon'),reset:el('btnReset')};
const boardEl=el('board'); const seedInput=el('seedInput');
const equipmentList=el('equipmentList'); const itemList=el('itemList');
const runSummaryEl=el('runSummary'); const summaryPanel=el('summaryPanel'); const copySummaryBtn=el('copySummary');

function log(msg){ const line=document.createElement('div'); line.textContent=msg; hud.log.appendChild(line); hud.log.scrollTop=hud.log.scrollHeight; }
function updateHUD(){ hud.hp.textContent=G.hp; hud.maxHp.textContent=G.maxHp; hud.xp.textContent=G.xp; hud.buried.textContent=G.buried; hud.loc.textContent= G.locIndex>=0? G.locationOrder[G.locIndex].name : '-'; }

// ---------------- Game Flow ----------------
function startGame(){ RNG.applySeed(seedInput.value.trim()); resetState(); hud.log.textContent=''; summaryPanel.style.display='none'; log('Seed '+RNG.seed+' v2025-08-14-a'); buildDeck(); G.locationOrder=RNG.shuffle([...LOCATIONS_BASE]); buttons.start.disabled=true; buttons.reset.disabled=false; buttons.next.disabled=false; buttons.dragon.disabled=true; nextLocation(); }
function nextLocation(){ G.locIndex++; if(G.locIndex>=G.locationOrder.length){ log('All locations cleared. Dragon available.'); buttons.next.disabled=true; buttons.dragon.disabled=false; return; } const loc=G.locationOrder[G.locIndex]; log('Enter: '+loc.name); const key=simplifyLocation(loc.name); let cards=cardsForLocation(key);
  // Inject quest NPC special cards if not yet delivered (princess appears early, sage mid-late)
  if(!G.quest.princessDelivered && !G.quest.pendingPrincessCard && G.locIndex<=2){ const princess=CARD_DB.find(c=>c.type==='special' && /ghostly princess/i.test(c.name)); if(princess){ cards = [...cards]; cards[cards.length-1]=princess; G.quest.pendingPrincessCard=true; }}
  if(!G.quest.sageDelivered && !G.quest.pendingSageCard && G.locIndex>=2 && G.locIndex<=5){ const sage=CARD_DB.find(c=>c.type==='special' && /^sage$/i.test(c.name)); if(sage){ cards = [...cards]; cards[cards.length-2]=sage; G.quest.pendingSageCard=true; }}
  G.board=loc.layout.map((cell,i)=>({ id:cell.id,x:cell.x,y:cell.y,card:cards[i],state:'faceDown',layer:Infinity })); G.startTile=null; renderBoard(); log('Pick a starting tile (bottom row).'); updateHUD(); }
function renderBoard(){ const loc=G.locationOrder[G.locIndex]; if(!loc) return; boardEl.style.gridTemplateColumns=`repeat(${Math.max(...loc.layout.map(c=>c.x))+1},72px)`; boardEl.innerHTML=''; const minLayer=currentMinUnflippedLayer(); G.board.forEach(t=>{ const d=document.createElement('div'); d.className='tile '+t.state+(t.start?' start':''); d.style.gridColumnStart=t.x+1; d.style.gridRowStart=t.y+1; d.dataset.id=t.id; if(t.state==='faceDown'){ d.textContent='?'; if(canFlip(t,minLayer)) d.classList.add('adjacent'); } else { d.innerHTML=`<div>${t.card.name}</div><div class="tag ${cssTag(t.card.type)}">${t.card.type}</div>`; } d.addEventListener('click',()=> attemptFlip(t.id)); boardEl.appendChild(d); }); }
function cssTag(t){ return ['monster','item','equipment','scene','pit','snare','terror','blessing'].includes(t)?t:'special'; }
function attemptFlip(id){ const tile=G.board.find(t=>t.id==id); if(!tile) return; const minLayer=currentMinUnflippedLayer(); if(!canFlip(tile,minLayer)) return; flip(tile); }
function canFlip(tile,minLayer){ if(tile.state!=='faceDown') return false; if(!G.startTile){ const bottomY=Math.max(...G.board.map(t=>t.y)); return tile.y===bottomY; } return tile.layer!==Infinity && tile.layer===minLayer && isAdjacentToRevealed(tile); }
function isAdjacentToRevealed(tile){ return G.board.some(o=> o!==tile && (o.state==='revealed'||o.state==='resolved') && adj(o,tile)); }
function adj(a,b){ const dx=Math.abs(a.x-b.x), dy=Math.abs(a.y-b.y); return dx+dy===1 || (dx===1&&dy===1); }
function flip(tile){ tile.state='revealed'; if(!G.startTile){ G.startTile=tile; tile.start=true; buildLayers(); } log('Reveal '+tile.card.name+' ['+tile.card.type+']'); resolve(tile); updateHUD(); renderBoard(); }
function buildLayers(){ G.board.forEach(t=>t.layer=Infinity); const q=[G.startTile]; G.startTile.layer=0; for(let qi=0; qi<q.length; qi++){ const t=q[qi]; G.board.filter(n=>n.layer===Infinity && adj(n,t)).forEach(n=>{ n.layer=(t.layer||0)+1; q.push(n); }); } }
function currentMinUnflippedLayer(){ const layers=G.board.filter(t=>t.state==='faceDown').map(t=>t.layer); return layers.length? Math.min(...layers): Infinity; }

// ---------------- Resolution ----------------
function resolve(tile){ const c=tile.card; if(c.type==='special'){ handleSpecial(c,tile); return; } switch(c.type){ case 'hollow': case 'beast': combat(c,tile); break; case 'scene': doScene(c,tile); break; case 'pit': doPit(c,tile); break; case 'terror': doTerror(c,tile); break; case 'snare': doSnare(c,tile); break; case 'blessing': doBlessing(c,tile); break; case 'item': pickupItem(c,tile); break; case 'equipment': equipItem(c,tile); break; default: awardXP(c); tile.state='resolved'; } if(G.board.every(t=>t.state==='resolved')) { awardXP({xp:1,name:'Location Clear'}); log('Location Cleared (+1 XP)'); buttons.next.disabled=false; } }
function handleSpecial(c,t){ if(/ghostly princess/i.test(c.name)){ log('Ghostly Princess encountered. Requires gilded bangle to break shield.'); if(G.equipment.find(e=>/gilded bangle/i.test(e.name))){ // deliver
    const idx=G.equipment.findIndex(e=>/gilded bangle/i.test(e.name)); const b=G.equipment.splice(idx,1)[0]; log('Offer '+b.name+' -> Princess accepts. Shield broken.'); G.quest.princessDelivered=true; G.quest.pendingPrincessCard=false; G.quest.princessLogTurn=G.xp; G.atk+=(b.atk||0); // already applied before; we keep stats (no change) just narrative
  } else { log('Need Gilded Bangle first. Card remains resolved.'); }
  awardXP({xp:1,name:'Princess'}); t.state='resolved'; refreshInventory(); updateHUD();
} else if(/^sage$/i.test(c.name)){ log('Sage encountered. Requires ferryman\'s bell to halve dragon HP.'); if(G.equipment.find(e=>/ferryman'?s bell/i.test(e.name))){ const idx=G.equipment.findIndex(e=>/ferryman'?s bell/i.test(e.name)); const bell=G.equipment.splice(idx,1)[0]; log('Give '+bell.name+' -> Sage accepts. Dragon vitality ritual cast (half HP).'); G.quest.sageDelivered=true; G.quest.pendingSageCard=false; }
  awardXP({xp:1,name:'Sage'}); t.state='resolved'; refreshInventory(); updateHUD();
} else { log('Mysterious figure (unused special).'); awardXP({xp:1,name:c.name}); t.state='resolved'; }
}
function awardXP(card){ const gain=card.xp||1; G.xp+=gain; G.maxHp+=gain; G.xpPile.push(card.name||card.type||'Card'); }
function damage(n,why='Dmg'){ const before=G.hp; G.hp-=n; log(`${why} -${n} (${before}->${G.hp})`); if(G.hp<=0){ log('You fall.'); disableAll(); } }
function heal(n){ const b=G.hp; G.hp=Math.min(G.maxHp,G.hp+n); log(`Heal +${n} (${b}->${G.hp})`); }
function doScene(c,t){ if(c.fullHeal) { const b=G.hp; G.hp=G.maxHp; log(`Full Heal (${b}->${G.hp})`);} else if(c.heal) heal(c.heal); awardXP(c); t.state='resolved'; }
function doPit(c,t){ const r=d6(); const tn=c.pitTN||4; log(`Pit roll ${r} vs ${tn}`); if(r<tn) damage(c.pitDmg||3,'Pit'); awardXP(c); t.state='resolved'; }
function doTerror(c,t){ const loss=c.terrorHpLoss||4; if(G.hp>loss+1){ damage(loss,'Terror'); awardXP(c); t.state='resolved'; } else { log('Too risky -> bury'); bury(t);} }
function doSnare(c,t){ log('Snare '+c.name); if(c.snareMissFirst) G.snareMisses=c.snareMissFirst; if(c.snareDoubleFirstIncoming) G.snareDouble=true; t.state='revealed'; }
function doBlessing(c,t){ log('Blessing '+c.name); if(c.cleansesSnare){ G.snareMisses=0; G.snareDouble=false; log('Snares cleansed'); } if(c.fullHeal) { const b=G.hp; G.hp=G.maxHp; log(`Full Heal (${b}->${G.hp})`);} if(c.normalHitOn1) G.normalHitOn1=true; if(c.blockOn12) G.blockOn12=true; awardXP(c); t.state='resolved'; }
function pickupItem(c,t){ if(G.items.length>=2){ autoUseOrDiscard(c); } else { G.items.push(c); log('Item '+c.name); } t.state='resolved'; refreshInventory(); }
function equipItem(c,t){ if(G.equipment.length>=2){ const old=G.equipment.shift(); log('Unequip '+old.name+' -> XP'); awardXP(old);} G.equipment.push(c); G.atk+=(c.atk||0); G.def+=(c.def||0); if(/ancient sword/i.test(c.name)) G.quest.haveSword=true; log(`Equip ${c.name} (+${c.atk||0}A +${c.def||0}D)`); t.state='resolved'; refreshInventory(); }
function autoUseOrDiscard(c){ if(c.heal){ heal(c.heal); awardXP(c);} else { log('Discard '+c.name); awardXP(c);} }

// ---------------- Combat ----------------
function combat(enemy,tile){ let eHP=enemy.hp|| (enemy.type==='beast'?5:3); log(`Combat ${enemy.name} (${eHP} HP)`); while(eHP>0 && G.hp>0){ let pr=d6(); let er=d6(); if(G.snareMisses>0){ pr=1; G.snareMisses--; log('Snare miss'); } if(G.normalHitOn1 && pr===1) pr=3; const pRes=duel(pr); const eRes=duel(er); let pDmg=damageFor(pRes); let eDmg=damageFor(eRes); if(pDmg>0) pDmg+=G.atk + (G.plusDmgTemp||0); if(G.pendingTrue){ eHP-=G.pendingTrue; log('TrueDmg '+G.pendingTrue); G.pendingTrue=0; } if(pRes==='counter' && eRes==='counter'){ pDmg=0; eDmg=0; } eDmg=Math.max(0,eDmg-G.def); if(G.snareDouble && eDmg>0){ eDmg*=2; G.snareDouble=false; } if(G.blockOn12 && eDmg>0){ const br=d6(); if(br<=2){ log('Block'); eDmg=0; } } if(pDmg>0) eHP-=pDmg; if(eDmg>0){ G.hp-=eDmg; } log(`R: You ${pRes}${pDmg?"+"+pDmg:''} / Foe ${eRes}${eDmg?"+"+eDmg:''} | Foe ${Math.max(0,eHP)} HP ${Math.max(0,G.hp)}`); } if(eHP<=0){ log('Defeat '+enemy.name); awardXP(enemy); tile.state='resolved'; } refreshInventory(); updateHUD(); }
function duel(r){ return ({1:'miss',2:'parry',3:'hit',4:'hit',5:'crit',6:'counter'})[r]; }
function damageFor(res){ return res==='hit'?1: res==='crit'?2: res==='counter'?1:0; }
function d6(){ return 1+Math.floor(RNG.rand()*6); }
function bury(tile){ tile.state='resolved'; tile.buried=true; G.buried++; }

// ---------------- Inventory UI ----------------
function refreshInventory(){ equipmentList.textContent= G.equipment.map(e=>e.name).join(', ')||'—'; itemList.innerHTML= G.items.map((it,i)=>`<button onclick="useItem(${i})">${it.name}</button>`).join(' ')||'—'; }
function useItem(i){ const it=G.items[i]; if(!it) return; if(it.moonleafBrandy){ damage(it.hpSelfCost,'Brandy'); G.plusDmgTemp=(G.plusDmgTemp||0)+(it.plusDamageThisCombat||1);} if(it.itemDeal2){ G.pendingTrue=(G.pendingTrue||0)+2; } if(it.heal) heal(it.heal); if(it.phoenixTear){ G.phoenixTear=true; log('Phoenix Tear primed'); } G.items.splice(i,1); awardXP(it); refreshInventory(); updateHUD(); }
window.useItem=useItem;

// ---------------- Deck Build Fallback ----------------
function buildDeck(){ if(!CARD_DB.length){ const dummyTypes=['hollow','scene','item','equipment','pit','snare','terror','blessing','beast']; for(let i=0;i<60;i++){ CARD_DB.push({ name:'Card '+i, type:RNG.pick(dummyTypes), hp: (i%7===0?6:(i%5===0?5:3)), heal: (i%11===0?4:0) }); } } }

// ---------------- Summary / Dragon ----------------
function showSummary(){ const data={seed:RNG.seed,hp:G.hp,maxHp:G.maxHp,xp:G.xp,buried:G.buried,equipment:G.equipment.map(e=>e.name),items:G.items.map(i=>i.name),xpPile:G.xpPile}; runSummaryEl.textContent=JSON.stringify(data,null,2); summaryPanel.style.display='block'; }
function disableAll(){ Object.values(buttons).forEach(b=>b.disabled=true); buttons.reset.disabled=false; }
function startDragon(){ if(!G.quest.haveSword){ log('You face the Dragon without the Ancient Sword: you cannot harm it.'); }
  if(!G.quest.princessDelivered){ log('Dragon shield intact (Princess not aided): your damage is negated.'); }
  const base=40+G.buried; let hp=base; if(G.quest.sageDelivered){ hp=Math.ceil(hp/2); log('Sage ritual halves dragon HP -> '+hp); }
  log('Dragon '+hp+' HP'); while(hp>0 && G.hp>0){ const pr=d6(), dr=d6(); const pR=duel(pr), dR=duel(dr); let pD=(pR==='miss'||pR==='parry'?0:damageFor(pR)+G.atk); if(!G.quest.haveSword || !G.quest.princessDelivered) pD=0; let dD=damageFor(dR); dD=Math.max(0,dD-G.def); if(pD>0) hp-=pD; if(dD>0) G.hp-=dD; log(`D: You ${pR}${pD?"+"+pD:''} / D ${dR}${dD?"+"+dD:''} | DHP ${Math.max(0,hp)} HP ${Math.max(0,G.hp)}`); if(G.hp<=0){ log('Dragon slays you'); disableAll(); return;} if(!G.quest.haveSword && pD===0 && G.hp>0){ // stalemate guard
      if(G.hp<5){ log('Exhaustion overtakes you.'); G.hp=0; disableAll(); return;} }
  }
  if(hp<=0){ log('Dragon defeated!'); showSummary(); disableAll(); }
}

// ---------------- Events ----------------
buttons.start.addEventListener('click',startGame);
buttons.reset.addEventListener('click',()=>location.reload());
buttons.next.addEventListener('click',()=>{ buttons.next.disabled=true; nextLocation(); });
buttons.dragon.addEventListener('click',()=>{ if(G.locIndex < G.locationOrder.length){ log('Finish locations first'); return;} startDragon(); });
copySummaryBtn.addEventListener('click',()=>{ navigator.clipboard.writeText(runSummaryEl.textContent).then(()=>log('Copied summary')); });

// ---------------- Initial Load ----------------
resetState(); updateHUD(); log('Enter seed (optional) & Start Game. v2025-08-14-a');
// Adjusted path to reference original CSV in legacy folder (space encoded)
fetch('../FORWARD%20SIM/FORWARD%20CARDS%20DB%20-%20v3%20raw%20restart%208.14.25.csv')
  .then(r=>r.text())
  .then(txt=>{ CARD_DB=parseCSV(txt); indexLocationCards(); const locSet=new Set(CARD_DB.filter(c=>c.type==='location').map(c=>simplifyLocation(c.name))); log('Loaded card DB '+CARD_DB.length+' cards; locations indexed: '+[...locSet].join(', ')); })
  .catch(()=>{ log('Card DB not found (using fallback deck).'); buildDeck(); });
log('Note: Location effects removed in this build.');
