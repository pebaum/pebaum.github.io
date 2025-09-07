// Audio Clip Looper (mic-based) - initial prototype
// Monospaced ASCII multi-track loop engine for recorded clips
// Keys: N=new loop (seconds), R=record clip into selected track, +/- speed, [ ] octave placeholder (future pitch shift), DEL remove track

class AudioEngine {
  constructor(){
    this.ctx = new (window.AudioContext||window.webkitAudioContext)();
    this.master = this.ctx.createGain(); this.master.gain.value=0.9; this.master.connect(this.ctx.destination);
  }
  createBuffer(durationSec){
    return this.ctx.createBuffer(1, Math.max(1,Math.floor(durationSec * this.ctx.sampleRate)), this.ctx.sampleRate);
  }
}

class ClipTrack {
  constructor(id,{lengthSec=8,speed=1,clips=[]}={}){
    this.id=id; this.lengthSec=lengthSec; this.speed=speed; this.clips=clips; // clips: {start,end,gain,buffer}
    this.rotation=0; this.enabled=true;
  }
}

class Scheduler {
  constructor(engine){
    this.engine=engine; this.tracks=[]; this.isRunning=false; this.lookahead=0.1; this.interval=null;
    this.loopStartTime=null; this.lastAnim=0;
  }
  addTrack(t){this.tracks.push(t); return t;}
  removeTrack(id){this.tracks=this.tracks.filter(t=>t.id!==id);}
  start(){ if(this.isRunning) return; if(this.engine.ctx.state==='suspended') this.engine.ctx.resume(); this.isRunning=true; this.loopStartTime=this.engine.ctx.currentTime; this.interval=setInterval(()=>this._tick(),50); requestAnimationFrame(ts=>this._animate(ts)); }
  stop(){ if(!this.isRunning) return; this.isRunning=false; clearInterval(this.interval); }
  _tick(){ if(!this.isRunning) return; const now=this.engine.ctx.currentTime; for(const tr of this.tracks){ if(!tr.enabled) continue; const loopDur = tr.lengthSec / tr.speed; let pos = (now - this.loopStartTime) % loopDur; // seconds into stretched loop
      // schedule clips starting within lookahead
      for(const c of tr.clips){ const clipLen=c.end - c.start; const playStart = c.start / tr.speed; if(playStart>=pos && playStart < pos+this.lookahead){ // schedule
          const offset = this.loopStartTime + playStart - (now); const when = now + Math.max(0, offset);
          const src=this.engine.ctx.createBufferSource(); src.buffer=c.buffer; src.playbackRate.value=tr.speed; const g=this.engine.ctx.createGain(); g.gain.value=c.gain; src.connect(g).connect(this.engine.master); src.start(when, c.start, Math.max(0.001, Math.min(clipLen, c.end-c.start))); }
      }
    } }
  _animate(ts){ if(!this.isRunning) return; const now=this.engine.ctx.currentTime; for(const tr of this.tracks){ const loopDur = tr.lengthSec / tr.speed; const loopPos = (now - this.loopStartTime) % loopDur; tr.rotation = loopPos/loopDur; } renderAscii(); requestAnimationFrame(t=>this._animate(t)); }
}

const engine=new AudioEngine();
const scheduler=new Scheduler(engine);
let trackCounter=0; let focusedTrack=null;
let recording=false; let mediaStream=null; let mediaRec=null; let recordedChunks=[]; let pendingAssign=null;
let asciiScreen=document.getElementById('asciiScreen');
let overlay=document.getElementById('overlay');
let clipForm=document.getElementById('clipForm');
let cancelBtn=document.getElementById('cancelBtn');
const charMetrics={width:8,line:16};

function measure(){ const s=document.createElement('span'); s.textContent='M'; s.style.visibility='hidden'; asciiScreen.appendChild(s); const r=s.getBoundingClientRect(); if(r.width>0) charMetrics.width=r.width; const lh=parseFloat(getComputedStyle(asciiScreen).lineHeight); if(lh) charMetrics.line=lh; s.remove(); }
measure();

function addTrack(preset){ const t=new ClipTrack(++trackCounter,preset||{}); scheduler.addTrack(t); focusedTrack=t.id; return t; }

async function getMic(){ if(mediaStream) return mediaStream; mediaStream = await navigator.mediaDevices.getUserMedia({audio:true}); return mediaStream; }

function startRecording(){ if(recording) return; getMic().then(stream=>{ recordedChunks=[]; mediaRec = new MediaRecorder(stream); mediaRec.ondataavailable=e=>{ if(e.data.size>0) recordedChunks.push(e.data); }; mediaRec.onstop= async ()=>{ const blob=new Blob(recordedChunks,{type:'audio/webm'}); const arr=await blob.arrayBuffer(); const audioBuf=await engine.ctx.decodeAudioData(arr); // assign to track start at current position
      if(pendingAssign){ const tr = scheduler.tracks.find(t=>t.id===pendingAssign.trackId); if(tr){ // full clip add spanning entire buffer
          tr.clips.push({start:0,end:Math.min(audioBuf.duration,tr.lengthSec),gain:1,buffer:audioBuf}); }
      }
      pendingAssign=null; renderAscii(); };
      mediaRec.start(); recording=true; pendingAssign={trackId:focusedTrack}; renderAscii(); }); }
function stopRecording(){ if(!recording) return; mediaRec.stop(); recording=false; }

function secsToCols(track){ return 70; } // fixed width for now

function formatTrackLine(tr){ const sel=(tr.id===focusedTrack)?'*':' '; return `${sel} T${String(tr.id).padStart(2,'0')} | LEN ${tr.lengthSec.toFixed(2)}s | SPEED ${tr.speed.toFixed(2)}x | CLIPS ${tr.clips.length}`; }

let speedSpans=[]; let clipSpans=[]; let currentRenderLine=0;

function buildWave(tr,width){ const chars=new Array(width).fill('-'); tr.clips.forEach((c,i)=>{ const s=Math.round((c.start/tr.lengthSec)*width); const e=Math.max(s+1, Math.round((c.end/tr.lengthSec)*width)); for(let x=s;x<e && x<width;x++){ chars[x]='#'; clipSpans.push({trackId:tr.id,line:currentRenderLine,colStart:s,colEnd:e-1,clipIndex:i}); } }); let head=Math.round(tr.rotation*width)%width; if(head>width-4) head=width-4; chars[head]='['; chars[head+1]='>'; chars[head+2]='>'; chars[head+3]=']'; return chars.join(''); }

function renderAscii(){ speedSpans=[]; clipSpans=[]; const out=[]; const width=90; out.push(`AUDIO LOOPER  TRACKS:${scheduler.tracks.length}  ${recording?'[REC]':'[   ]'}`); out.push('Keys: SPACE run/stop | N new track | R rec toggle | +/- speed | DEL rm | drag/wheel SPEED or #'); out.push('-'.repeat(width)); if(!scheduler.tracks.length) out.push('No tracks. Press N to create by seconds length. Then R to record mic into it.'); scheduler.tracks.forEach(tr=>{ currentRenderLine=out.length; const line=formatTrackLine(tr); const spIdx=line.indexOf('SPEED '); if(spIdx>=0){ const st=spIdx+6; speedSpans.push({trackId:tr.id,line:currentRenderLine,start:st,end:st+tr.speed.toFixed(2).length+1}); } out.push(line); currentRenderLine=out.length; out.push('  '+buildWave(tr,width-2)); out.push(''); }); out.push('-'.repeat(width)); out.push('Click wave = add clip placeholder, context menu = delete nearest clip section.'); asciiScreen.textContent=out.join('\n'); }

renderAscii();

function locateSpan(line,col){ for(const s of speedSpans){ if(s.line===line && col>=s.start && col<=s.end) return {type:'speed',data:s}; } for(const c of clipSpans){ if(c.line===line && col>=c.colStart && col<=c.colEnd) return {type:'clip',data:c}; } return null; }

asciiScreen.addEventListener('mousedown',e=>{ const rect=asciiScreen.getBoundingClientRect(); const y=e.clientY-rect.top; const x=e.clientX-rect.left; const line=Math.floor(y/charMetrics.line); const col=Math.floor(x/charMetrics.width); const span=locateSpan(line,col); if(span){ if(span.type==='speed'){ const tr=scheduler.tracks.find(t=>t.id===span.data.trackId); if(tr){ window._drag={type:'speed',trackId:tr.id,startY:e.clientY,orig:tr.speed}; } } else if(span.type==='clip'){ const tr=scheduler.tracks.find(t=>t.id===span.data.trackId); if(tr){ window._drag={type:'clip',trackId:tr.id,clipIndex:span.data.clipIndex,startY:e.clientY,origStart:tr.clips[span.data.clipIndex].start,origEnd:tr.clips[span.data.clipIndex].end}; } } e.preventDefault(); } });
window.addEventListener('mousemove',e=>{ const d=window._drag; if(!d) return; if(d.type==='speed'){ const tr=scheduler.tracks.find(t=>t.id===d.trackId); if(!tr) return; let val=d.orig + (d.startY - e.clientY)/120; tr.speed=Math.min(4,Math.max(0.25, +val.toFixed(2))); } else if(d.type==='clip'){ const tr=scheduler.tracks.find(t=>t.id===d.trackId); if(!tr) return; const dy=d.startY - e.clientY; const shift = (dy/160)*tr.lengthSec; const clip=tr.clips[d.clipIndex]; clip.start=Math.max(0, Math.min(tr.lengthSec-0.05, d.origStart+shift)); clip.end=Math.max(clip.start+0.05, Math.min(tr.lengthSec, d.origEnd+shift)); } renderAscii(); });
window.addEventListener('mouseup',()=>{ window._drag=null; });

asciiScreen.addEventListener('wheel',e=>{ const rect=asciiScreen.getBoundingClientRect(); const col=Math.floor((e.clientX-rect.left)/charMetrics.width); const line=Math.floor((e.clientY-rect.top)/charMetrics.line); const span=locateSpan(line,col); if(!span) return; e.preventDefault(); const delta=e.deltaY>0?-1:1; if(span.type==='speed'){ const tr=scheduler.tracks.find(t=>t.id===span.data.trackId); if(tr){ tr.speed=Math.min(4,Math.max(0.25, +(tr.speed+0.05*delta).toFixed(2))); } } else if(span.type==='clip'){ const tr=scheduler.tracks.find(t=>t.id===span.data.trackId); if(tr){ const c=tr.clips[span.data.clipIndex]; const mid=(c.start+c.end)/2; let len=(c.end-c.start)*(1+(delta*0.1)); len=Math.min(tr.lengthSec, Math.max(0.05,len)); c.start=Math.max(0, mid-len/2); c.end=Math.min(tr.lengthSec, c.start+len); } } renderAscii(); },{passive:false});

asciiScreen.addEventListener('click',e=>{ const rect=asciiScreen.getBoundingClientRect(); const y=e.clientY-rect.top; const x=e.clientX-rect.left; const line=Math.floor(y/charMetrics.line); const header=3; const block=3; if(line<header) return; const rel=line-header; const trackIdx=Math.floor(rel/block); const within=rel%block; if(within!==1) return; const tr=scheduler.tracks[trackIdx]; if(!tr) return; focusedTrack=tr.id; const col=Math.floor((x/charMetrics.width)-2); const frac=Math.min(1,Math.max(0,col/(90-2))); const time=+(frac*tr.lengthSec).toFixed(2); overlay.style.left=(x+10)+'px'; overlay.style.top=(y+10)+'px'; overlay.style.display='block'; overlay.dataset.trackId=tr.id; overlay.dataset.time=time; clipForm.start.value=time; clipForm.end.value=Math.min(tr.lengthSec, time+1); });

asciiScreen.addEventListener('contextmenu',e=>{ e.preventDefault(); const rect=asciiScreen.getBoundingClientRect(); const y=e.clientY-rect.top; const x=e.clientX-rect.left; const line=Math.floor(y/charMetrics.line); const col=Math.floor(x/charMetrics.width); const span=locateSpan(line,col); if(span && span.type==='clip'){ const tr=scheduler.tracks.find(t=>t.id===span.data.trackId); if(!tr) return; tr.clips.splice(span.data.clipIndex,1); renderAscii(); }
});

clipForm.addEventListener('submit',e=>{ e.preventDefault(); const trackId=+overlay.dataset.trackId; const tr=scheduler.tracks.find(t=>t.id===trackId); if(!tr){ overlay.style.display='none'; return; } const start=parseFloat(clipForm.start.value)||0; let end=parseFloat(clipForm.end.value)|| (start+1); const gain=parseFloat(clipForm.gain.value)||1; end=Math.max(start+0.05, Math.min(tr.lengthSec,end)); if(!tr.tempBuffer){ // create silent placeholder if recording not yet assigned
    const buff=engine.createBuffer(tr.lengthSec); tr.tempBuffer=buff; }
  const segmentBuffer = tr.tempBuffer || tr.clips.find(c=>c.buffer)?.buffer || engine.createBuffer(end-start);
  tr.clips.push({start,end,gain,buffer:segmentBuffer}); overlay.style.display='none'; renderAscii(); });

cancelBtn.addEventListener('click',()=>{ overlay.style.display='none'; });

window.addEventListener('keydown',e=>{ const k=e.key; if(k===' '){ e.preventDefault(); if(scheduler.isRunning) scheduler.stop(); else scheduler.start(); renderAscii(); } else if(k==='n' || k==='N'){ const secs=prompt('Track length seconds','8'); if(!secs) return; const v=parseFloat(secs); if(!isFinite(v)||v<=0) return; addTrack({lengthSec:v,speed:1,clips:[]}); renderAscii(); } else if(k==='r' || k==='R'){ if(!recording) startRecording(); else stopRecording(); renderAscii(); } else if(k==='+' || k==='='){ const tr=scheduler.tracks.find(t=>t.id===focusedTrack); if(tr){ tr.speed=Math.min(4, +(tr.speed+0.05).toFixed(2)); renderAscii(); } } else if(k==='-' || k==='_'){ const tr=scheduler.tracks.find(t=>t.id===focusedTrack); if(tr){ tr.speed=Math.max(0.25, +(tr.speed-0.05).toFixed(2)); renderAscii(); } } else if(k==='Delete' || k==='Backspace'){ const tr=scheduler.tracks.find(t=>t.id===focusedTrack); if(tr){ scheduler.removeTrack(tr.id); focusedTrack=null; renderAscii(); } } else if(k==='Escape'){ overlay.style.display='none'; }});

window.addEventListener('click',()=>{ if(engine.ctx.state==='suspended') engine.ctx.resume(); }, {once:true});

console.log('Audio clip looper ready');
