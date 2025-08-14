// Batch simulation of FORWARD SIM rules (effectless build) for tuning.
// Usage:
//   node scripts/batchSim.js [runs] [--json]
//   runs   = number of simulations (default 1000)
//   --json = output JSON only (no human-readable summary)
// Produces a readable textual analytics report by default plus JSON (tagged) for copy/paste.

const fs = require('fs');
const argRuns = process.argv.find(a=>/^\d+$/.test(a));
const runs = parseInt(argRuns||'1000',10);
const JSON_ONLY = process.argv.includes('--json');

// ---------------- RNG ----------------
const RNG = { seed: 1, applySeed(v){ let s=v%2147483647; if(s<=0) s+=2147483646; this.seed=s; }, next(){ return this.seed=this.seed*16807%2147483647; }, rand(){ return (this.next()-1)/2147483646; }, pick(a){ return a[Math.floor(this.rand()*a.length)]; }, shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(this.rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; } };

// ---------------- Locations (mirrors sim.js) ----------------
const LOCATIONS_BASE=[
 { key:'termina', name:'Home Village Termina', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:1,y:1},{id:5,x:0,y:2},{id:6,x:1,y:2},{id:7,x:2,y:2},{id:8,x:1,y:3},{id:9,x:1,y:4}] },
 { key:'worship', name:'Shrine of Worship', layout:[{id:1,x:1,y:0},{id:2,x:0,y:1},{id:3,x:1,y:1},{id:4,x:2,y:1},{id:5,x:1,y:2},{id:6,x:0,y:3},{id:7,x:1,y:3},{id:8,x:2,y:3},{id:9,x:1,y:4}] },
 { key:'valthria', name:'Bannered City Valthria', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:3,y:0},{id:5,x:2,y:1},{id:6,x:0,y:2},{id:7,x:1,y:2},{id:8,x:2,y:2},{id:9,x:3,y:2}] },
 { key:'spiremaze', name:'Caelith Spiremaze', layout:[{id:1,x:0,y:0},{id:2,x:2,y:0},{id:3,x:0,y:1},{id:4,x:2,y:1},{id:5,x:0,y:2},{id:6,x:2,y:2},{id:7,x:0,y:3},{id:8,x:2,y:3},{id:9,x:0,y:4}] },
 { key:'brume', name:'Darkwood Brume', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:0,y:1},{id:4,x:2,y:1},{id:5,x:1,y:2},{id:6,x:0,y:3},{id:7,x:2,y:3},{id:8,x:1,y:4},{id:9,x:2,y:4}] },
 { key:'wastes', name:'Sicorro Wastes', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:2,y:0},{id:4,x:0,y:1},{id:5,x:1,y:1},{id:6,x:2,y:1},{id:7,x:0,y:2},{id:8,x:1,y:2},{id:9,x:2,y:2}] },
 { key:'rotglade', name:'Amara Rot Glade', layout:[{id:1,x:1,y:0},{id:2,x:0,y:1},{id:3,x:2,y:1},{id:4,x:1,y:2},{id:5,x:2,y:2},{id:6,x:0,y:3},{id:7,x:2,y:3},{id:8,x:1,y:4},{id:9,x:1,y:5}] },
 { key:'frozengaol', name:'Frozen Gaol', layout:[{id:1,x:0,y:0},{id:2,x:1,y:0},{id:3,x:0,y:1},{id:4,x:1,y:1},{id:5,x:2,y:1},{id:6,x:1,y:2},{id:7,x:2,y:2},{id:8,x:2,y:3},{id:9,x:3,y:3}] },
 { key:'nightsea', name:'Nightsea Expanse', layout:[{id:1,x:0,y:0},{id:2,x:2,y:0},{id:3,x:1,y:1},{id:4,x:0,y:2},{id:5,x:1,y:2},{id:6,x:2,y:2},{id:7,x:1,y:3},{id:8,x:0,y:4},{id:9,x:2,y:4}] }
];

// ---------------- CSV + card logic ----------------
const LOCATION_ALIASES={ 'sicorro wastes':'sirroco wastes','sirroco wastes':'sirroco wastes' };
function simplifyLocation(n){ let k=(n||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); if(k.startsWith('the ')) k=k.slice(4); if(LOCATION_ALIASES[k]) k=LOCATION_ALIASES[k]; return k; }

function parseCSV(csv){ function splitLine(line){ const res=[]; let cur=''; let q=false; for(let i=0;i<line.length;i++){ const ch=line[i]; if(ch==='"'){ if(q && line[i+1]=='"'){ cur+='"'; i++; } else q=!q; } else if(ch===','&&!q){ res.push(cur); cur=''; } else cur+=ch; } res.push(cur); return res; } const lines=csv.split(/\r?\n/); const out=[]; const head=lines.findIndex(l=>/^card no/i.test(l)); if(head===-1) return out; for(let i=head+1;i<lines.length;i++){ const row=lines[i]; if(!row.trim()) continue; const parts=splitLine(row); const assoc=(parts[1]||'').trim(); const typeRaw=(parts[2]||'').trim(); const name=(parts[3]||'').trim(); const raw=row; let type=typeRaw; const o={name,type,location:assoc,raw}; if(/(\d+)hp/i.test(raw)&&/fight/i.test(raw)) o.hp=parseInt(/(\d+)hp/i.exec(raw)[1]); if(/equip:.*1 ?atk/i.test(raw)) o.atk=(o.atk||0)+1; if(/equip:.*1 ?def/i.test(raw)) o.def=(o.def||0)+1; if(/heal (\d+)/i.test(raw)) o.heal=parseInt(/heal (\d+)/i.exec(raw)[1]); if(/full heal/i.test(raw)) o.fullHeal=true; if(/miss first 2/i.test(raw)) o.snareMissFirst=2; else if(/miss first attack/i.test(raw)) o.snareMissFirst=1; if(/first attack against deals double damage/i.test(raw)) o.snareDoubleFirstIncoming=true; if(/cleanse snare/i.test(raw)) o.cleansesSnare=true; if(/normal hit on 1/i.test(raw)) o.normalHitOn1=true; if(/block on 1-2/i.test(raw)) o.blockOn12=true; if(/when player reaches 0hp, heal 10/i.test(raw)) o.phoenixTear=true; if(/choose: -?(\d+)hp or bury/i.test(raw)) o.terrorHpLoss=parseInt(/choose: -?(\d+)hp/i.exec(raw)[1]); if(/save on (\d)/i.test(raw)&&/pit/i.test(raw)) o.pitTN=parseInt(/save on (\d)/i.exec(raw)[1]); if(['hollow','beast','scene','pit','snare','terror','blessing','item','equipment','location'].indexOf(type)===-1){ if(/equip:/i.test(raw)) type='equipment'; else if(/use:/i.test(raw)||/heal/i.test(raw)) type='item'; else if(/fight:/i.test(raw)) type='hollow'; else type='scene'; } o.type=type; out.push(o);} return out; }

let CARD_DB=[]; const LOCATION_CARDS={};
function indexLocationCards(){ const locs=CARD_DB.filter(c=>c.type==='location'); locs.forEach(l=>{ const key=simplifyLocation(l.name||l.location); LOCATION_CARDS[key]=CARD_DB.filter(c=>c.location===l.name && c.type!=='location'); }); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }
function cardsForLocation(key){ const desired=['scene','equipment','item','snare','hollow','pit','beast','terror','blessing']; const pool=LOCATION_CARDS[key]; if(!pool||pool.length<5){ const rand=CARD_DB.filter(c=>desired.includes(c.type)); return RNG.shuffle(rand.slice()).slice(0,9).map(clone);} const picked=[]; desired.forEach(t=>{ const f=pool.find(c=>c.type===t&&!picked.includes(c)); if(f) picked.push(f); }); while(picked.length<9) picked.push(RNG.pick(pool)); return picked.slice(0,9).map(clone); }

// ---------------- Simulation of one run ----------------
function runGame(seed){ RNG.applySeed(seed); const S={ hp:20,maxHp:20,xp:0,atk:1,def:0,equipment:[],items:[],buried:0, snareMisses:0,snareDouble:false,normalHitOn1:false,blockOn12:false, combats:0, combatRounds:0, dragon:false, win:false, locationsCleared:0,
  deathCause:null, deathTileType:null, lastHPBeforeDeath:null, lastCardRaw:null,
  locSeq:[], entryHp:[], exitHp:[], exitMaxHp:[], exitXp:[], deathLocationIndex:null,
  // per-location accumulators
  locCombatStarts:[], locCombatRounds:[], locCombatDamageTaken:[], locPitAttempts:[], locPitDeaths:[], locTerrorHPChoices:[], locTerrorBuries:[], locTerrorDeaths:[], locSnareTiles:[], locSnareApplied:[],
  // quest state
  quest:{ haveSword:false, princessDelivered:false, sageDelivered:false, dragonReachedWithPrereqs:false }
};
  const locOrder=RNG.shuffle([...LOCATIONS_BASE]);
  S.locSeq=locOrder.map(l=>l.key);
  for(let li=0; li<locOrder.length; li++){
    const loc=locOrder[li];
    S.entryHp[li]=S.hp; S.currentLocIdx=li;
    // init arrays indices
    ['locCombatStarts','locCombatRounds','locCombatDamageTaken','locPitAttempts','locPitDeaths','locTerrorHPChoices','locTerrorBuries','locTerrorDeaths','locSnareTiles','locSnareApplied'].forEach(k=>{ if(S[k][li]==null) S[k][li]=0; });
    // build board
  const key=simplifyLocation(loc.name); const cards=cardsForLocation(key);
  // Quest NPC injection: princess early (idx<=2), sage mid (2<=idx<=5)
  if(!S.quest.princessDelivered && li<=2){ const princess=CARD_DB.find(c=>/ghostly princess/i.test(c.name||'')); if(princess) cards[cards.length-1]=princess; }
  if(!S.quest.sageDelivered && li>=2 && li<=5){ const sage=CARD_DB.find(c=>/^sage$/i.test(c.name||'')); if(sage) cards[cards.length-2]=sage; }
  const board=loc.layout.map((cell,i)=>({ id:cell.id,x:cell.x,y:cell.y,card:cards[i],state:'faceDown',layer:Infinity,start:false }));
    // pick starting bottom row
    const bottomY=Math.max(...board.map(t=>t.y)); const startCandidates=board.filter(t=>t.y===bottomY);
    const start=RNG.pick(startCandidates); start.state='revealed'; start.start=true; buildLayers(board,start);
    resolveTile(start,board,S);
    if(S.hp<=0){ S.deathLocationIndex=li; return S; }
    while(board.some(t=>t.state==='faceDown') && S.hp>0){
      const minLayer=currentMinLayer(board);
      const options=board.filter(t=> t.state==='faceDown' && t.layer===minLayer && adjacentToRevealed(t,board));
      if(options.length===0){ // no accessible tiles; break
        break;
      }
      const choice=RNG.pick(options); choice.state='revealed'; resolveTile(choice,board,S);
    }
    if(S.hp<=0){ S.deathLocationIndex=li; return S; }
    S.locationsCleared++;
    S.xp++; S.maxHp++; // location clear reward (mirrors code)
  S.exitHp[li]=S.hp; S.exitMaxHp[li]=S.maxHp; S.exitXp[li]=S.xp;
  }
  // Dragon (quest gating)
  S.dragon=true; let dragonHp=40+S.buried; if(S.quest.sageDelivered) dragonHp=Math.ceil(dragonHp/2);
  while(dragonHp>0 && S.hp>0){ S.combats++; S.combatRounds++; const pr=d6(); const dr=d6(); const pRes=duel(pr), dRes=duel(dr); let pD=(pRes==='miss'||pRes==='parry'?0:damageFor(pRes)+S.atk); if(!(S.quest.haveSword && S.quest.princessDelivered)) pD=0; let dD=damageFor(dRes); dD=Math.max(0,dD-S.def); if(pD>0) dragonHp-=pD; if(dD>0){ S.lastHPBeforeDeath=S.hp; damage(S,dD,'dragon'); }
    if(!(S.quest.haveSword && S.quest.princessDelivered) && pD===0 && S.hp>0 && S.hp<5){ S.deathCause='exhaustion'; S.hp=0; }
  }
  S.quest.dragonReachedWithPrereqs = S.dragon && S.quest.haveSword && S.quest.princessDelivered;
  if(dragonHp<=0 && S.hp>0) S.win=true; return S;
}

// ---------------- Board helpers ----------------
function buildLayers(board,start){ board.forEach(t=>t.layer=Infinity); const q=[start]; start.layer=0; for(let i=0;i<q.length;i++){ const t=q[i]; board.filter(n=>n.layer===Infinity && adj(n,t)).forEach(n=>{ n.layer=(t.layer||0)+1; q.push(n); }); } }
function currentMinLayer(board){ const layers=board.filter(t=>t.state==='faceDown').map(t=>t.layer); return layers.length? Math.min(...layers):Infinity; }
function adjacentToRevealed(tile,board){ return board.some(o=>o!==tile && (o.state==='revealed'||o.state==='resolved') && adj(o,tile)); }
function adj(a,b){ const dx=Math.abs(a.x-b.x), dy=Math.abs(a.y-b.y); return dx+dy===1 || (dx===1&&dy===1); }

// ---------------- Resolution logic ----------------
function resolveTile(tile,board,S){ const c=tile.card; if(isSpecial(c)){ handleSpecial(c,S); tile.state='resolved'; awardXP(S,{xp:1}); return; } switch(c.type){ case 'hollow': case 'beast': combat(c,tile,S); break; case 'scene': doScene(c,S); tile.state='resolved'; break; case 'pit': doPit(c,S); tile.state='resolved'; break; case 'terror': doTerror(c,tile,S); break; case 'snare': doSnare(c,S); break; case 'blessing': doBlessing(c,S); tile.state='resolved'; break; case 'item': pickupItem(c,S); tile.state='resolved'; break; case 'equipment': equipItem(c,S); tile.state='resolved'; break; default: S.xp++; S.maxHp++; tile.state='resolved'; }
  if(tile.state!=='resolved') tile.state='resolved'; }
function isSpecial(c){ if(!c||!c.name) return false; return /ghostly princess/i.test(c.name) || /^sage$/i.test(c.name); }
function handleSpecial(c,S){ if(/ghostly princess/i.test(c.name)){ const idx=S.equipment.findIndex(e=>/gilded bangle/i.test(e.name||'')); if(idx!==-1){ S.equipment.splice(idx,1); S.quest.princessDelivered=true; } }
  else if(/^sage$/i.test(c.name)){ const idx=S.equipment.findIndex(e=>/ferryman'?s bell/i.test(e.name||'')); if(idx!==-1){ S.equipment.splice(idx,1); S.quest.sageDelivered=true; } }
}
function awardXP(S,c){ const gain=(c&&c.xp)||1; S.xp+=gain; S.maxHp+=gain; }
function damage(S,n,cause, tileType, raw){ S.hp-=n; if(S.hp<=0 && !S.deathCause){ S.deathCause=cause||'unknown'; S.deathTileType=tileType||null; S.lastCardRaw=raw||null; } if(cause==='combat' && S.currentLocIdx!=null) S.locCombatDamageTaken[S.currentLocIdx]+=n; }
function heal(S,n){ S.hp=Math.min(S.maxHp,S.hp+n); }
function doScene(c,S){ if(c.fullHeal) S.hp=S.maxHp; else if(c.heal) heal(S,c.heal); awardXP(S,c); }
function doPit(c,S){ if(S.currentLocIdx!=null) S.locPitAttempts[S.currentLocIdx]++; const r=d6(); const tn=c.pitTN||4; if(r<tn){ const dmg=c.pitDmg||3; S.lastHPBeforeDeath=S.hp; damage(S,dmg,'pit','pit',c.raw); if(S.hp<=0 && S.currentLocIdx!=null) S.locPitDeaths[S.currentLocIdx]++; } awardXP(S,c); }
function doTerror(c,tile,S){ const loss=c.terrorHpLoss||4; if(S.hp>loss+1){ if(S.currentLocIdx!=null) S.locTerrorHPChoices[S.currentLocIdx]++; S.lastHPBeforeDeath=S.hp; damage(S,loss,'terror','terror',c.raw); awardXP(S,c); if(S.hp<=0 && S.currentLocIdx!=null) S.locTerrorDeaths[S.currentLocIdx]++; } else { // bury
  tile.buried=true; S.buried++; if(S.currentLocIdx!=null) S.locTerrorBuries[S.currentLocIdx]++; awardXP(S,{xp:0}); }
 }
function doSnare(c,S){ if(S.currentLocIdx!=null){ S.locSnareTiles[S.currentLocIdx]++; if(c.snareMissFirst || c.snareDoubleFirstIncoming) S.locSnareApplied[S.currentLocIdx]++; } if(c.snareMissFirst) S.snareMisses=c.snareMissFirst; if(c.snareDoubleFirstIncoming) S.snareDouble=true; }
function doBlessing(c,S){ if(c.cleansesSnare){ S.snareMisses=0; S.snareDouble=false; } if(c.fullHeal) S.hp=S.maxHp; if(c.normalHitOn1) S.normalHitOn1=true; if(c.blockOn12) S.blockOn12=true; awardXP(S,c); }
function pickupItem(c,S){ if(c.heal) heal(S,c.heal); awardXP(S,c); }
function equipItem(c,S){ S.atk+=(c.atk||0); S.def+=(c.def||0); S.equipment.push(c); if(/ancient sword/i.test(c.name||'')) S.quest.haveSword=true; awardXP(S,c); }

// ---------------- Combat ----------------
function combat(enemy,tile,S){ S.combats++; if(S.currentLocIdx!=null) S.locCombatStarts[S.currentLocIdx]++; let eHP=enemy.hp|| (enemy.type==='beast'?5:3); while(eHP>0 && S.hp>0){ S.combatRounds++; if(S.currentLocIdx!=null) S.locCombatRounds[S.currentLocIdx]++; let pr=d6(); let er=d6(); if(S.snareMisses>0){ pr=1; S.snareMisses--; } if(S.normalHitOn1 && pr===1) pr=3; const pRes=duel(pr); const eRes=duel(er); let pD=damageFor(pRes); let eD=damageFor(eRes); if(pD>0) pD+=S.atk; if(S.snareDouble && eD>0){ eD*=2; S.snareDouble=false; } eD=Math.max(0,eD-S.def); if(S.blockOn12 && eD>0){ const br=d6(); if(br<=2) eD=0; }
    if(pD>0) eHP-=pD; if(eD>0){ S.lastHPBeforeDeath=S.hp; damage(S,eD,'combat',enemy.type,enemy.raw); }
  }
  if(eHP<=0) awardXP(S,enemy); }
function duel(r){ return ({1:'miss',2:'parry',3:'hit',4:'hit',5:'crit',6:'counter'})[r]; }
function damageFor(res){ return res==='hit'?1: res==='crit'?2: res==='counter'?1:0; }
function d6(){ return 1+Math.floor(RNG.rand()*6); }

// ---------------- Load CSV ----------------
try {
  const csv=fs.readFileSync('FORWARD SIM/FORWARD CARDS DB - v3 raw restart 8.14.25.csv','utf8');
  CARD_DB=parseCSV(csv); indexLocationCards();
} catch(e){
  // fallback deck if missing
  const dummyTypes=['hollow','scene','item','equipment','pit','snare','terror','blessing','beast'];
  for(let i=0;i<60;i++){ CARD_DB.push({ name:'Card '+i, type:dummyTypes[i%dummyTypes.length], hp:(i%7===0?6:(i%5===0?5:3)), heal:(i%11===0?4:0)}); }
}

// ---------------- Batch ----------------
const stats=[];
for(let i=0;i<runs;i++){
  stats.push(runGame(i+1));
}

function avg(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length || 0; }
const wins=stats.filter(s=>s.win).length;
const dragonReached=stats.filter(s=>s.dragon).length;
const deathsPreDragon=dragonReached - wins;
const noDragon=stats.length - dragonReached;
function median(arr){ if(!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const m=Math.floor(a.length/2); return a.length%2? a[m] : (a[m-1]+a[m])/2; }
function pct(n){ return (n*100).toFixed(1)+'%'; }
function bar(p,len=30){ const filled=Math.round(p*len); return '█'.repeat(filled)+' '.repeat(len-filled); }
function percentile(arr,p){ if(!arr.length) return 0; const a=[...arr].sort((x,y)=>x-y); const idx=(a.length-1)*p; const lo=Math.floor(idx), hi=Math.ceil(idx); if(lo===hi) return a[lo]; return a[lo]+(a[hi]-a[lo])*(idx-lo); }
function pointBiserial(winArr,varArr){ const n=winArr.length; if(!n) return 0; const p=winArr.reduce((a,b)=>a+b,0)/n; const q=1-p; if(p===0||p===1) return 0; const winners=[]; const losers=[]; for(let i=0;i<n;i++){ (winArr[i]?winners:losers).push(varArr[i]); }
  function mean(a){ return a.reduce((x,y)=>x+y,0)/a.length; } const mw=mean(winners), ml=mean(losers); const overallMean=mean(varArr); const sd=Math.sqrt(varArr.reduce((a,v)=>a+Math.pow(v-overallMean,2),0)/(n-1||1)); if(sd===0) return 0; return (mw-ml)/sd*Math.sqrt(p*q); }

const winStats = stats.filter(s=>s.win);
const deathsPre = stats.filter(s=>!s.win && !s.dragon);
const deathsDragon = stats.filter(s=>!s.win && s.dragon);
const deathCauses = new Map();
stats.filter(s=>!s.win).forEach(s=>{ const k=s.deathCause||'unknown'; deathCauses.set(k,(deathCauses.get(k)||0)+1); });
const deathTileTypes = new Map();
stats.filter(s=>!s.win).forEach(s=>{ if(s.deathTileType){ deathTileTypes.set(s.deathTileType,(deathTileTypes.get(s.deathTileType)||0)+1); } });

// Quest metrics
const swordRuns = stats.filter(s=>s.quest && s.quest.haveSword).length;
const princessRuns = stats.filter(s=>s.quest && s.quest.princessDelivered).length;
const sageRuns = stats.filter(s=>s.quest && s.quest.sageDelivered).length;
const dragonWithPrereqs = stats.filter(s=>s.quest && s.quest.dragonReachedWithPrereqs).length;
const dragonWithoutPrereqs = stats.filter(s=>s.dragon && (!s.quest || !(s.quest.haveSword && s.quest.princessDelivered))).length;

// Per-location analytics
const maxLocations = Math.max(...stats.map(s=>s.entryHp.length));
const perLoc=[]; for(let i=0;i<maxLocations;i++){ perLoc[i]={ index:i, entries:0, clears:0, deathsHere:0, sumEntryHp:0, sumExitHp:0, sumExitMaxHp:0, sumExitXp:0 }; }
stats.forEach(s=>{ for(let i=0;i<s.entryHp.length;i++){ const pl=perLoc[i]; pl.entries++; pl.sumEntryHp+=s.entryHp[i]; if(s.exitHp[i]!=null){ pl.clears++; pl.sumExitHp+=s.exitHp[i]; pl.sumExitMaxHp+=s.exitMaxHp[i]; pl.sumExitXp+=s.exitXp[i]; } }
  if(s.deathLocationIndex!=null){ perLoc[s.deathLocationIndex].deathsHere++; }
});
perLoc.forEach(pl=>{ pl.avgEntryHp = pl.entries? pl.sumEntryHp/pl.entries:0; pl.avgExitHp = pl.clears? pl.sumExitHp/pl.clears:0; pl.avgExitMaxHp = pl.clears? pl.sumExitMaxHp/pl.clears:0; pl.avgExitXp = pl.clears? pl.sumExitXp/pl.clears:0; pl.clearRate = pl.entries? pl.clears/pl.entries:0; pl.deathRate = pl.entries? pl.deathsHere/pl.entries:0; delete pl.sumEntryHp; delete pl.sumExitHp; delete pl.sumExitMaxHp; delete pl.sumExitXp; });
// Add per-location cause detail arrays (sparse) averaged
stats.forEach(s=>{ perLoc.forEach((pl,i)=>{ function add(k,field){ if(pl[k]==null) pl[k]=0; const arrName=field; if(s[arrName] && s[arrName][i]!=null) pl[k]+=s[arrName][i]; }
  add('combatStarts','locCombatStarts'); add('combatRounds','locCombatRounds'); add('combatDamageTaken','locCombatDamageTaken'); add('pitAttempts','locPitAttempts'); add('pitDeaths','locPitDeaths'); add('terrorHPChoices','locTerrorHPChoices'); add('terrorBuries','locTerrorBuries'); add('terrorDeaths','locTerrorDeaths'); add('snareTiles','locSnareTiles'); add('snareApplied','locSnareApplied'); }); });
perLoc.forEach(pl=>{ const e=pl.entries||1; pl.avgCombatStarts = pl.combatStarts/e; pl.avgCombatRounds = pl.combatRounds/e; pl.avgCombatDamageTaken = pl.combatDamageTaken/e; pl.pitAttemptRate = pl.pitAttempts/e; pl.pitDeathRate = pl.pitDeaths/(pl.pitAttempts||1); pl.terrorChoiceRate = pl.terrorHPChoices/e; pl.terrorBuryRate = pl.terrorBuries/e; pl.terrorDeathRate = pl.terrorDeaths/(pl.terrorHPChoices||1); pl.snareTileRate = pl.snareTiles/e; pl.snareApplyRate = pl.snareApplied/(pl.snareTiles||1); });

// Distributions
function dist(arr){ const m=new Map(); arr.forEach(v=>m.set(v,(m.get(v)||0)+1)); return [...m.entries()].sort((a,b)=>a[0]-b[0]).map(([value,count])=>({value,count,pct:count/arr.length})); }
const buriedDist = dist(stats.map(s=>s.buried));
const combatsDist = dist(stats.map(s=>s.combats));
const locationsClearedDist = dist(stats.map(s=>s.locationsCleared));

// Percentiles
const finalHpWins = winStats.map(s=>s.hp);
const maxHpAll = stats.map(s=>s.maxHp);
const combatsAll = stats.map(s=>s.combats);
const buriedAll = stats.map(s=>s.buried);

const percentiles={
  finalHpWins:{ p5:percentile(finalHpWins,0.05), p25:percentile(finalHpWins,0.25), p50:percentile(finalHpWins,0.50), p75:percentile(finalHpWins,0.75), p95:percentile(finalHpWins,0.95) },
  maxHpAll:{ p5:percentile(maxHpAll,0.05), p25:percentile(maxHpAll,0.25), p50:percentile(maxHpAll,0.50), p75:percentile(maxHpAll,0.75), p95:percentile(maxHpAll,0.95) },
  combatsAll:{ p5:percentile(combatsAll,0.05), p25:percentile(combatsAll,0.25), p50:percentile(combatsAll,0.50), p75:percentile(combatsAll,0.75), p95:percentile(combatsAll,0.95) },
  buriedAll:{ p5:percentile(buriedAll,0.05), p25:percentile(buriedAll,0.25), p50:percentile(buriedAll,0.50), p75:percentile(buriedAll,0.75), p95:percentile(buriedAll,0.95) }
};

// Correlations (win vs variable)
const winArr = stats.map(s=> s.win?1:0);
const correlations={
  maxHp: pointBiserial(winArr, maxHpAll),
  combats: pointBiserial(winArr, combatsAll),
  buried: pointBiserial(winArr, buriedAll),
  xp: pointBiserial(winArr, stats.map(s=>s.xp))
};

// Distribution: locations cleared at end (wins count as full length)
const locDist = new Map();
stats.forEach(s=>{ const k=s.locationsCleared + (s.win? '+': (s.dragon?'D':'') ); locDist.set(k,(locDist.get(k)||0)+1); });
const distKeys=[...locDist.keys()].sort((a,b)=>{ // sort numerically, '+' after number
  const na=parseInt(a); const nb=parseInt(b); if(na===nb){ if(a===b) return 0; if(a.includes('+')) return 1; if(b.includes('+')) return -1; if(a.includes('D')) return 1; return -1; } return na-nb; });

// Combat rounds distribution (bucketed)
function bucket(v){ if(v<5) return '<5'; if(v<10) return '5-9'; if(v<15) return '10-14'; if(v<20) return '15-19'; if(v<30) return '20-29'; return '30+'; }
const roundBuckets = new Map();
stats.forEach(s=>{ const b=bucket(s.combatRounds); roundBuckets.set(b,(roundBuckets.get(b)||0)+1); });
const bucketOrder=['<5','5-9','10-14','15-19','20-29','30+'];

const report={
  runs,
  wins,
  winRate: wins/runs,
  dragonReached,
  reachDragonRate: dragonReached/runs,
  preDragonDeaths: deathsPre.length,
  preDragonDeathRate: deathsPreDragon/runs,
  dragonDeaths: deathsDragon.length,
  avgFinalHpAll: avg(stats.map(s=>s.hp>0? s.hp:0)),
  avgFinalHpWins: avg(winStats.map(s=>s.hp)),
  medianFinalHpWins: median(winStats.map(s=>s.hp)),
  avgMaxHp: avg(stats.map(s=>s.maxHp)),
  medianMaxHp: median(stats.map(s=>s.maxHp)),
  avgXP: avg(stats.map(s=>s.xp)),
  avgBuried: avg(stats.map(s=>s.buried)),
  avgLocationsCleared: avg(stats.map(s=>s.locationsCleared)),
  medianLocationsCleared: median(stats.map(s=>s.locationsCleared)),
  avgCombats: avg(stats.map(s=>s.combats)),
  medianCombats: median(stats.map(s=>s.combats)),
  avgCombatRoundsPerCombat: (avg(stats.map(s=> s.combatRounds)))/(avg(stats.map(s=>s.combats))||1),
  totalCombatRounds: stats.reduce((a,b)=>a+b.combatRounds,0)
};

report.percentiles=percentiles;
report.perLocation=perLoc;
report.distributions={ buried:buriedDist, combats:combatsDist, locationsCleared:locationsClearedDist };
report.correlations=correlations;
report.deathCauses=[...deathCauses.entries()].map(([cause,count])=>({cause,count,pct:count/runs}));
report.deathTileTypes=[...deathTileTypes.entries()].map(([type,count])=>({type,count,pct:count/runs}));
report.quest={
  haveSwordRuns:swordRuns,
  princessDeliveredRuns:princessRuns,
  sageDeliveredRuns:sageRuns,
  dragonReachedWithPrereqs:dragonWithPrereqs,
  dragonReachedWithoutPrereqs:dragonWithoutPrereqs,
  pctHaveSword:swordRuns/runs,
  pctPrincessDelivered:princessRuns/runs,
  pctSageDelivered:sageRuns/runs,
  pctDragonWithPrereqs:dragonWithPrereqs/runs,
  pctDragonWithoutPrereqs:dragonWithoutPrereqs/runs
};

if(!JSON_ONLY){
  console.log('\n=== FORWARD SIM Batch Report ===');
  console.log(`Runs: ${runs}`);
  console.log(`Wins: ${wins} (${pct(report.winRate)})`);
  console.log(`Reached Dragon: ${dragonReached} (${pct(report.reachDragonRate)})`);
  console.log(`Pre-Dragon Deaths: ${deathsPre.length} (${pct(deathsPre.length/runs)}) | Dragon Deaths: ${deathsDragon.length} (${pct(deathsDragon.length/runs)})`);
  console.log('\n-- Averages / Medians --');
  console.log(`Max HP avg ${report.avgMaxHp.toFixed(2)} | median ${report.medianMaxHp}`);
  console.log(`Final HP (wins) avg ${report.avgFinalHpWins.toFixed(2)} | median ${report.medianFinalHpWins}`);
  console.log(`XP avg ${report.avgXP.toFixed(2)} | Buried avg ${report.avgBuried.toFixed(2)}`);
  console.log(`Locations cleared avg ${report.avgLocationsCleared.toFixed(2)} | median ${report.medianLocationsCleared}`);
  console.log(`Combats per run avg ${report.avgCombats.toFixed(2)} | median ${report.medianCombats}`);
  console.log(`Rounds per combat avg ${report.avgCombatRoundsPerCombat.toFixed(2)}`);
  console.log(`Total combat rounds ${report.totalCombatRounds}`);
  console.log('\n-- Locations Cleared Distribution --');
  distKeys.forEach(k=>{ const c=locDist.get(k); const p=c/runs; console.log(k.padStart(3,' ')+` | ${bar(p)} ${pct(p)} (${c})`); });
  console.log('\n(Note: a trailing + means victory; D indicates death during dragon fight.)');
  console.log('\n-- Total Combat Rounds (All Runs) --');
  bucketOrder.forEach(b=>{ const c=roundBuckets.get(b)||0; const p=c/runs; console.log(b.padStart(6,' ')+` | ${bar(p)} ${pct(p)} (${c})`); });
  console.log('\n-- Balance Flags (Heuristics) --');
  if(report.winRate>0.75) console.log('High win rate (>75%): consider reducing linear HP growth or increasing enemy HP.');
  else if(report.winRate<0.25) console.log('Low win rate (<25%): consider +start HP or gentler scaling.');
  if(report.avgCombatRoundsPerCombat<1.8) console.log('Combats very short (<1.8 rounds): may lack tension; raise enemy HP or lower player ATK progression.');
  if(report.avgBuried>2) console.log('High buried average: terror decisions frequent; ensure intended.');
  console.log('\n-- Percentiles (selected) --');
  console.log('Final HP (wins) p5/p25/p50/p75/p95:', Object.values(percentiles.finalHpWins).map(v=>v.toFixed(1)).join(' / '));
  console.log('Max HP (all)    p5/p25/p50/p75/p95:', Object.values(percentiles.maxHpAll).map(v=>v.toFixed(1)).join(' / '));
  console.log('Combats (all)    p5/p25/p50/p75/p95:', Object.values(percentiles.combatsAll).map(v=>v.toFixed(1)).join(' / '));
  console.log('Buried (all)     p5/p25/p50/p75/p95:', Object.values(percentiles.buriedAll).map(v=>v.toFixed(1)).join(' / '));
  console.log('\n-- Death Causes --');
  [...deathCauses.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> console.log(`${k}: ${v} (${pct(v/runs)})`));
  console.log('\n-- Death Tile Types --');
  [...deathTileTypes.entries()].sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> console.log(`${k}: ${v} (${pct(v/runs)})`));
  console.log('\n-- Quest Metrics --');
  console.log(`Ancient Sword acquired:        ${swordRuns} (${pct(swordRuns/runs)})`);
  console.log(`Princess delivered:            ${princessRuns} (${pct(princessRuns/runs)})`);
  console.log(`Sage delivered:                ${sageRuns} (${pct(sageRuns/runs)})`);
  console.log(`Dragon reached w/ prereqs:     ${dragonWithPrereqs} (${pct(dragonWithPrereqs/runs)})`);
  console.log(`Dragon reached w/o prereqs:    ${dragonWithoutPrereqs} (${pct(dragonWithoutPrereqs/runs)})`);
  console.log('\n-- Per-Location Summary --');
  perLoc.forEach(pl=>{ console.log(`Loc#${pl.index+1} ent:${pl.entries} clr:${pl.clears} clrRt:${pct(pl.clearRate)} deathRt:${pct(pl.deathRate)} eHP:${pl.avgEntryHp.toFixed(1)} xHP:${pl.avgExitHp.toFixed(1)} xMHP:${pl.avgExitMaxHp.toFixed(1)} cmbSt:${pl.avgCombatStarts.toFixed(2)} cmbR:${pl.avgCombatRounds.toFixed(2)} dmg:${pl.avgCombatDamageTaken.toFixed(2)} pitA:${pl.pitAttemptRate.toFixed(2)} pitD:${pl.pitDeathRate.toFixed(2)} terrChoice:${pl.terrorChoiceRate.toFixed(2)} terrBury:${pl.terrorBuryRate.toFixed(2)} terrD:${pl.terrorDeathRate.toFixed(2)} snareTiles:${pl.snareTileRate.toFixed(2)} snareApply:${pl.snareApplyRate.toFixed(2)}`); });
  console.log('\n-- Correlations (win vs variable) --');
  Object.entries(correlations).forEach(([k,v])=> console.log(`${k}: ${v.toFixed(3)}`));
  console.log('\n--- JSON (for tooling) ---');
}
console.log(JSON.stringify(report,null,2));
