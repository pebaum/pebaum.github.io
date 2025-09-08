// Porta-4Track (Web) - MVP
// 4 tracks, record from mic, import audio, mix with volume/pan, mute/solo, varispeed transport.
// Notes: Varispeed changes pitch. Changing speed while playing restarts scheduling. Expect some latency with MediaRecorder.

class AudioEngine {
  constructor(){
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Master and tape bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;
    this.tapeMix = this.ctx.createGain(); // sum of per-track tape chains
    this.tapeMix.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    // Metering
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;
    this.masterAnalyser.smoothingTimeConstant = 0.5;
    this.masterGain.connect(this.masterAnalyser);
    // Global hiss (tape noise)
    this.hiss = { source:null, gain:this.ctx.createGain(), bp:this.ctx.createBiquadFilter() };
    this.hiss.gain.gain.value = 0; // off by default
    this.hiss.bp.type='bandpass'; this.hiss.bp.frequency.value=7000; this.hiss.bp.Q.value=1.2;
    this.hiss.bp.connect(this.tapeMix);
    this.hiss.gain.connect(this.hiss.bp);
    this._startHiss();
  }
  decode(arrayBuffer){
    return new Promise((resolve,reject)=>{
      this.ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
    });
  }
  _startHiss(){
    // Build a seamless noise buffer
    const dur=2; const len=dur*this.ctx.sampleRate; const buf=this.ctx.createBuffer(1,len,this.ctx.sampleRate);
    const data=buf.getChannelData(0);
    for(let i=0;i<len;i++){ data[i]=(Math.random()*2-1)*0.4; }
    const src=this.ctx.createBufferSource(); src.buffer=buf; src.loop=true; src.connect(this.hiss.gain); src.start();
    this.hiss.source=src;
  }
}

class Track {
  constructor(engine, id){
    this.engine = engine; this.id = id; this.name = `Track ${id}`;
    this.gainValue = 0.9; this.panValue = 0; this.muted=false; this.solo=false; this.armed=false; this.monitor=true;
    this.clips = []; // { buffer:AudioBuffer, start:number(sec), peaks?:{min:Float32Array,max:Float32Array,sampleStep:number} }
    // Nodes
    this.inputGain = engine.ctx.createGain();
    this.inputGain.gain.value = this.gainValue;
    this.panner = engine.ctx.createStereoPanner();
    this.panner.pan.value = this.panValue;
    // Tape channel chain per track
    this.tape = this._createTapeChannel();
    this.analyser = engine.ctx.createAnalyser();
    this.analyser.fftSize = 1024; this.analyser.smoothingTimeConstant = 0.7;
    // Wire
    this.inputGain.connect(this.panner).connect(this.tape.input);
    this.tape.output.connect(engine.tapeMix);
    this.tape.output.connect(this.analyser);
    // Runtime
    this._scheduled = []; // [{source, when, offset, duration}]
    this._monitorNode = null; // MediaStreamSource for mic monitoring
  }
  setGain(v){ this.gainValue = v; this.inputGain.gain.value = v; }
  setPan(v){ this.panValue = v; this.panner.pan.value = v; }
  addClip(buffer, start){ const clip={buffer, start: Math.max(0, start||0)}; this._ensurePeaks(clip); this.clips.push(clip); this.clips.sort((a,b)=>a.start-b.start); }
  clearClips(){ this.stopAll(); this.clips = []; }
  stopAll(){ this._scheduled.forEach(s=>{ try{s.source.stop();}catch{} }); this._scheduled=[]; }
  _createTapeChannel(){
    const ctx=this.engine.ctx; const input=ctx.createGain();
    // Soft saturation
    const shaper=ctx.createWaveShaper(); shaper.curve = makeSaturationCurve(0.5); shaper.oversample='2x';
    // Head bump (low shelf) and HF loss (low-pass)
    const lowShelf=ctx.createBiquadFilter(); lowShelf.type='lowshelf'; lowShelf.frequency.value=120; lowShelf.gain.value=1.5;
    const lowPass=ctx.createBiquadFilter(); lowPass.type='lowpass'; lowPass.frequency.value=18000; lowPass.Q.value=0.707;
    // Wow & flutter via short delay + LFOs
    const delay=ctx.createDelay(0.05); delay.delayTime.value=0.005; // base 5ms
    const wowOsc=ctx.createOscillator(); wowOsc.frequency.value=0.6; const wowGain=ctx.createGain(); wowGain.gain.value=0.001; // ~1ms
    const flutterOsc=ctx.createOscillator(); flutterOsc.frequency.value=6.5; const flutterGain=ctx.createGain(); flutterGain.gain.value=0.0003; // ~0.3ms
    wowOsc.connect(wowGain).connect(delay.delayTime); flutterOsc.connect(flutterGain).connect(delay.delayTime); wowOsc.start(); flutterOsc.start();
    input.connect(shaper).connect(lowShelf).connect(lowPass).connect(delay);
    const output=ctx.createGain(); delay.connect(output);
    return {input, output, shaper, lowShelf, lowPass, delay, wowGain, flutterGain};
  }
  _ensurePeaks(clip){
    if(clip.peaks) return; const channel=clip.buffer.getChannelData(0); const len=channel.length; const samplesPerPixel = Math.max(100, Math.floor(len / 2000));
    const n = Math.ceil(len / samplesPerPixel); const min=new Float32Array(n); const max=new Float32Array(n);
    for(let i=0;i<n;i++){ let s=i*samplesPerPixel; let e=Math.min(len, s+samplesPerPixel); let lo=1e9, hi=-1e9; for(let j=s;j<e;j++){ const v=channel[j]; if(v<lo) lo=v; if(v>hi) hi=v; } min[i]=lo; max[i]=hi; }
    clip.peaks={min,max,sampleStep:samplesPerPixel};
  }
}

class Transport {
  constructor(engine, tracks){
    this.engine = engine; this.tracks = tracks;
    this.position = 0; // seconds
    this.playing = false;
    this.speed = 1; // varispeed 0.5..2.0
    this.length = 120; // default 2 minutes of tape
    this.lookahead = 0.25; // seconds scheduling horizon (in transport seconds)
    this._timer = null; this._startedAtCtx = 0; this._posAtStart = 0;
    this.recordEnabled = false; // global record enabled
    this._recording = false; this._recStartPos = 0;
    this._micStream = null; this._mediaRecorder = null; this._recChunks=[]; this._armedTrackIndex=-1;
    // Punch
    this.punch = { enabled:false, in:0, out:10, manual:false };
    // Click
    this.click = new ClickTrack(engine);
  }
  setSpeed(v){
    const wasPlaying = this.playing;
    this.speed = Math.max(0.88, Math.min(1.12, v));
    if (wasPlaying) { this.pause(); this.play(); }
  }
  _transportNow(){
    if(!this.playing) return this.position;
    const elapsedCtx = this.engine.ctx.currentTime - this._startedAtCtx; // seconds real time
    return Math.min(this.length, this._posAtStart + elapsedCtx * this.speed);
  }
  _tick(){
    const nowPos = this._transportNow();
    if(nowPos >= this.length){ this.stop(); return; }
    // Auto Punch logic
    if(this.recordEnabled && this.playing && !this._recording && this._armedIndex()>=0){
      if(this.punch.enabled && nowPos>=this.punch.in && nowPos<this.punch.out){ this._startRecording(this._armedIndex()); }
    }
    if(this._recording && this.punch.enabled && nowPos>=this.punch.out){ this._stopRecording(true); }
    // Schedule clips whose start falls into [nowPos, nowPos+lookahead]
    for(const tr of this.tracks){
      if(tr.muted || (this._anySolo() && !tr.solo)) continue;
      for(const c of tr.clips){
        const cStart = c.start; const cDur = c.buffer.duration;
        // If clip overlaps the window (starts inside or already started but not scheduled after seek)
        const windowStart = nowPos, windowEnd = nowPos + this.lookahead;
        const overlapsNow = (cStart <= windowStart && (cStart + cDur) > windowStart);
        const startsSoon = (cStart >= windowStart && cStart < windowEnd);
        if(!(overlapsNow || startsSoon)) continue;
        // Compute when to start in AudioContext time
        const when = this.engine.ctx.currentTime + (Math.max(0, cStart - nowPos) / this.speed);
        const offset = Math.max(0, nowPos - cStart);
        const durLeft = Math.max(0.001, cDur - offset);
        // Avoid duplicate scheduling
        const already = tr._scheduled.some(s=>Math.abs(s.when-when)<0.01 && s.source.buffer===c.buffer);
        if(already) continue;
        const src = this.engine.ctx.createBufferSource();
        src.buffer = c.buffer; src.playbackRate.value = this.speed;
        src.connect(tr.inputGain);
        try{ src.start(when, offset, durLeft); }catch{}
        tr._scheduled.push({source:src, when, offset, duration:durLeft});
        // Cleanup when ended
        src.onended = ()=>{ tr._scheduled = tr._scheduled.filter(s=>s.source!==src); };
      }
    }
  }
  _anySolo(){ return this.tracks.some(t=>t.solo); }
  play(){
    if(this.playing) return;
    if(this.engine.ctx.state==='suspended') this.engine.ctx.resume();
    this.playing = true; this._posAtStart = this.position; this._startedAtCtx = this.engine.ctx.currentTime;
    this._timer = setInterval(()=>this._tick(), 50);
    // If record enabled & a track is armed, start mic recording
    const armedIndex = this._armedIndex();
    if(this.recordEnabled && armedIndex>=0 && (!this.punch.enabled || (this.position>=this.punch.in && this.position<this.punch.out))){
      this._startRecording(armedIndex);
    }
    // Click
    this.click.start();
  }
  pause(){ if(!this.playing) return; this.position = this._transportNow(); this.playing = false; clearInterval(this._timer); this._timer=null; this.tracks.forEach(t=>t.stopAll()); this._stopRecording(false); this.click.stop(); }
  stop(){ this.pause(); this.position = 0; updateTimeLabel(this.position); }
  seek(pos){ this.position = Math.max(0, Math.min(this.length, pos||0)); if(this.playing){ this.pause(); this.play(); } else { updateTimeLabel(this.position); } }
  _armedIndex(){ return this.tracks.findIndex(t=>t.armed); }

  async _ensureMic(){
    if(this._micStream) return this._micStream;
    this._micStream = await navigator.mediaDevices.getUserMedia({audio:true});
    return this._micStream;
  }
  async _startRecording(armedIndex){
    if(this._recording) return;
    const stream = await this._ensureMic();
    this._recChunks = []; this._recStartPos = this._transportNow(); this._armedTrackIndex = armedIndex;
    // Monitor to the armed track if desired
    const tr = this.tracks[armedIndex];
    if(tr.monitor){
      tr._monitorNode?.disconnect();
      tr._monitorNode = this.engine.ctx.createMediaStreamSource(stream);
      tr._monitorNode.connect(tr.inputGain);
    }
    // MediaRecorder for mic capture
    try{
      this._mediaRecorder = new MediaRecorder(stream);
    }catch(err){ console.error('MediaRecorder failed', err); this._mediaRecorder=null; return; }
    this._mediaRecorder.ondataavailable = e=>{ if(e.data.size>0) this._recChunks.push(e.data); };
    this._mediaRecorder.onstop = async ()=>{
      if(!this._recChunks.length) return;
      const blob = new Blob(this._recChunks, {type: this._mediaRecorder.mimeType || 'audio/webm'});
      const arr = await blob.arrayBuffer();
      const buf = await this.engine.decode(arr).catch(err=>{ console.error('decode fail',err); return null; });
      if(!buf) return;
      // Place clip on armed track at rec start pos
      const place = Math.max(0, this._recStartPos);
      this.tracks[this._armedTrackIndex]?.addClip(buf, place);
      renderTracks();
    };
    this._mediaRecorder.start();
    this._recording = true;
  }
  _stopRecording(finalize=true){
    if(!this._recording) return;
    try{ if(this._mediaRecorder && this._mediaRecorder.state!=='inactive'){ this._mediaRecorder.stop(); } }catch{}
    this._recording = false; this._armedTrackIndex=-1;
    // Remove monitor connections
    this.tracks.forEach(t=>{ if(t._monitorNode){ try{t._monitorNode.disconnect();}catch{}; t._monitorNode=null; } });
  }
}

class ClickTrack{
  constructor(engine){ this.engine=engine; this.enabled=false; this.bpm=120; this.sig=[4,4]; this._timer=null; this._nextTime=0; }
  setEnabled(on){ this.enabled=on; if(!on) this.stop(); }
  setBpm(b){ this.bpm=Math.max(20,Math.min(300,b)); }
  setSig(sig){ const [a,b]=sig.split('/').map(x=>+x); if(a&&b) this.sig=[a,b]; }
  _schedule(){ if(!this.enabled) return; const ctx=this.engine.ctx; const beatDur=60/this.bpm; if(this._nextTime===0) this._nextTime=ctx.currentTime+0.05; const look=0.3; while(this._nextTime < ctx.currentTime + look){ const beatIndex = Math.round(((this._nextTime - (this._start||this._nextTime))/beatDur)); const isDown = (beatIndex % this.sig[0])===0; this._ping(this._nextTime, isDown); this._nextTime += beatDur; } }
  _ping(when, down){ const ctx=this.engine.ctx; const osc=ctx.createOscillator(); const g=ctx.createGain(); g.gain.value=0.0001; const freq=down?1200:800; osc.frequency.value=freq; osc.connect(g).connect(this.engine.masterGain); const env=g.gain; const t=when; env.setValueAtTime(0.0001,t); env.linearRampToValueAtTime(0.15,t+0.001); env.exponentialRampToValueAtTime(0.0001, t+0.06); osc.start(t); osc.stop(t+0.08); }
  start(){ if(!this.enabled) return; if(this._timer) return; this._start=this.engine.ctx.currentTime; this._nextTime=0; this._timer=setInterval(()=>this._schedule(),25); }
  stop(){ if(this._timer){ clearInterval(this._timer); this._timer=null; } }
}

// App init
const engine = new AudioEngine();
const tracks = [1,2,3,4].map(i=>new Track(engine,i));
const transport = new Transport(engine, tracks);

// UI references
const el = {
  tracks: document.getElementById('tracks'),
  play: document.getElementById('playBtn'),
  stop: document.getElementById('stopBtn'),
  rew: document.getElementById('rewBtn'),
  rec: document.getElementById('recBtn'),
  speed: document.getElementById('speed'),
  spdVal: document.getElementById('speedVal'),
  spdUp: document.getElementById('spdUp'),
  spdDown: document.getElementById('spdDown'),
  time: document.getElementById('timeLabel'),
  masterGain: document.getElementById('masterGain'),
  masterMeter: document.getElementById('masterMeter'),
  file: document.getElementById('hiddenFile'),
  setIn: document.getElementById('setIn'),
  setOut: document.getElementById('setOut'),
  inTime: document.getElementById('inTime'),
  outTime: document.getElementById('outTime'),
  autoPunch: document.getElementById('autoPunch'),
  punchNow: document.getElementById('punchNow'),
  clickEnable: document.getElementById('clickEnable'),
  bpm: document.getElementById('bpm'),
  timesig: document.getElementById('timesig'),
  tapeAge: document.getElementById('tapeAge'),
  tapeVal: document.getElementById('tapeVal'),
};

function fmtTime(sec){ sec=Math.max(0,sec||0); const m=Math.floor(sec/60); const s=Math.floor(sec%60); const d=Math.floor((sec%1)*10); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${d}`; }
function updateTimeLabel(pos){ el.time.textContent = fmtTime(pos); }

// Render track strips
function renderTracks(){
  const anySolo = tracks.some(t=>t.solo);
  el.tracks.innerHTML = '';
  tracks.forEach((t,idx)=>{
    const wrap = document.createElement('div'); wrap.className='track';
    const left = document.createElement('div'); left.className='left';
    const right = document.createElement('div'); right.className='timeline';
    wrap.appendChild(left); wrap.appendChild(right);

    const name = document.createElement('div'); name.className='name'; name.textContent = t.name; left.appendChild(name);

    const controls = document.createElement('div'); controls.className='controls'; left.appendChild(controls);
    const arm = document.createElement('button'); arm.textContent='ARM'; arm.className=t.armed?'danger':''; arm.setAttribute('aria-pressed', String(t.armed)); arm.title='Arm track for recording';
    arm.onclick=()=>{ t.armed=!t.armed; // allow only one armed at a time (classic)
      if(t.armed){ tracks.forEach((o,i)=>{ if(i!==idx) o.armed=false; }); }
      renderTracks(); };
    const mute = document.createElement('button'); mute.textContent='MUTE'; mute.className='secondary'; mute.setAttribute('aria-pressed', String(t.muted)); mute.onclick=()=>{ t.muted=!t.muted; renderTracks(); };
    const solo = document.createElement('button'); solo.textContent='SOLO'; solo.className='secondary'; solo.setAttribute('aria-pressed', String(t.solo)); solo.onclick=()=>{ t.solo=!t.solo; renderTracks(); };
    controls.appendChild(arm); controls.appendChild(mute); controls.appendChild(solo);

    const vol = document.createElement('div'); vol.className='slider'; left.appendChild(vol);
    const volLabel = document.createElement('label'); volLabel.textContent='Vol'; vol.appendChild(volLabel);
    const volRange = document.createElement('input'); volRange.type='range'; volRange.min='0'; volRange.max='1'; volRange.step='0.01'; volRange.value=String(t.gainValue);
    volRange.oninput=()=>{ t.setGain(+volRange.value); }; vol.appendChild(volRange);

    const pan = document.createElement('div'); pan.className='slider'; left.appendChild(pan);
    const panLabel = document.createElement('label'); panLabel.textContent='Pan'; pan.appendChild(panLabel);
    const panRange = document.createElement('input'); panRange.type='range'; panRange.min='-1'; panRange.max='1'; panRange.step='0.01'; panRange.value=String(t.panValue);
    panRange.oninput=()=>{ t.setPan(+panRange.value); }; pan.appendChild(panRange);

    const monRow = document.createElement('div'); monRow.className='controls'; left.appendChild(monRow);
    const monBtn = document.createElement('button'); monBtn.textContent = t.monitor ? 'MON: ON' : 'MON: OFF'; monBtn.className='secondary'; monBtn.onclick=()=>{ t.monitor=!t.monitor; renderTracks(); };
    monRow.appendChild(monBtn);

    const meter = document.createElement('div'); meter.className='meter'; const fill=document.createElement('div'); fill.className='meter-fill'; fill.style.width='0%'; meter.appendChild(fill); left.appendChild(meter);
    // stash for animation
    t._meterFill = fill;

    // File actions
    const fileRow = document.createElement('div'); fileRow.className='file-actions'; left.appendChild(fileRow);
    const impBtn = document.createElement('button'); impBtn.textContent='Import'; impBtn.className='secondary'; impBtn.onclick=()=>chooseAndLoadFile(idx);
    const clrBtn = document.createElement('button'); clrBtn.textContent='Clear'; clrBtn.className='secondary'; clrBtn.onclick=()=>{ t.clearClips(); renderTracks(); };
    fileRow.appendChild(impBtn); fileRow.appendChild(clrBtn);

    // Timeline canvas with waveforms
    const canvas=document.createElement('canvas'); right.appendChild(canvas);
    const playhead=document.createElement('div'); playhead.className='playhead'; right.appendChild(playhead);
    const resize=()=>{ const rect=right.getBoundingClientRect(); canvas.width=rect.width; canvas.height=rect.height; drawTimeline(t, canvas, playhead); };
    new ResizeObserver(resize).observe(right);
    // initial draw after DOM attach
    setTimeout(resize,0);

    // Dim when muted or not soloed
    if(t.muted || (anySolo && !t.solo)) wrap.style.opacity = '0.6';

    el.tracks.appendChild(wrap);
  });
}

function drawTimeline(track, canvas, playheadEl){
  const ctx=canvas.getContext('2d'); const w=canvas.width, h=canvas.height; ctx.clearRect(0,0,w,h);
  // bg
  ctx.fillStyle='#11161c'; ctx.fillRect(0,0,w,h);
  // grid (seconds)
  ctx.strokeStyle='#22303b'; ctx.lineWidth=1; ctx.beginPath();
  const seconds=transport.length; for(let s=0;s<=seconds;s+=Math.max(1, Math.floor(seconds/12))){ const x=(s/seconds)*w; ctx.moveTo(x,0); ctx.lineTo(x,h); }
  ctx.stroke();
  // draw each clip waveform
  track.clips.forEach(c=>{
    const startX = (c.start/transport.length)*w; const endX = ((c.start + c.buffer.duration)/transport.length)*w; const cw=Math.max(1, endX-startX);
    // outline box
    ctx.fillStyle='#1f3350'; ctx.fillRect(startX,0,cw,h);
    ctx.strokeStyle='#446b9e'; ctx.strokeRect(startX+0.5,0.5,cw-1,h-1);
    // waveform
    const peaks=c.peaks; if(!peaks){ return; }
    const samples=peaks.min.length; // samples per pixel for whole buffer; map clip region
    // draw min/max as bars across width cw
    ctx.strokeStyle='#c9e1ff'; ctx.lineWidth=1; ctx.beginPath();
    for(let x=0;x<cw;x++){
      const frac = x/cw; const idx = Math.min(samples-1, Math.floor(frac*samples));
      const min=peaks.min[idx], max=peaks.max[idx];
      const y1 = (0.5 - max/2)*h; const y2=(0.5 - min/2)*h;
      ctx.moveTo(startX + x + 0.5, y1); ctx.lineTo(startX + x + 0.5, y2);
    }
    ctx.stroke();
  });
  // playhead position
  const posX = (transport._transportNow()/transport.length)*w; playheadEl.style.left = `${posX|0}px`;
}

async function chooseAndLoadFile(trackIndex){
  return new Promise((resolve)=>{
    el.file.onchange = async (e)=>{
      const f = e.target.files && e.target.files[0];
      el.file.value='';
      if(!f) return resolve();
      const arr = await f.arrayBuffer();
      const buf = await engine.decode(arr).catch(err=>{ console.error('decode fail',err); return null; });
      if(buf){ tracks[trackIndex].addClip(buf, transport.position); renderTracks(); }
      resolve();
    };
    el.file.click();
  });
}

// Transport handlers
el.play.onclick = ()=>{ if(transport.playing) { transport.pause(); } else { transport.play(); } updateTimeLabel(transport._transportNow()); };
el.stop.onclick = ()=>{ transport.stop(); };
el.rew.onclick = ()=>{ transport.seek(0); };
el.rec.onclick = ()=>{ transport.recordEnabled = !transport.recordEnabled; el.rec.setAttribute('aria-pressed', String(transport.recordEnabled)); };
el.speed.oninput = ()=>{ transport.setSpeed(+el.speed.value); el.spdVal.textContent = `${(+el.speed.value).toFixed(3)}x`; };
el.spdUp.onclick = ()=>{ const v=Math.min(1.12, +el.speed.value+0.01); el.speed.value=String(v.toFixed(3)); el.speed.dispatchEvent(new Event('input')); };
el.spdDown.onclick = ()=>{ const v=Math.max(0.88, +el.speed.value-0.01); el.speed.value=String(v.toFixed(3)); el.speed.dispatchEvent(new Event('input')); };
el.masterGain.oninput = ()=>{ engine.masterGain.gain.value = +el.masterGain.value; };

// Punch controls
el.setIn.onclick = ()=>{ transport.punch.in = transport._transportNow(); el.inTime.value = fmtTime(transport.punch.in); };
el.setOut.onclick = ()=>{ transport.punch.out = transport._transportNow(); el.outTime.value = fmtTime(transport.punch.out); };
el.inTime.onchange = ()=>{ transport.punch.in = parseTime(el.inTime.value) ?? transport.punch.in; el.inTime.value = fmtTime(transport.punch.in); };
el.outTime.onchange = ()=>{ transport.punch.out = parseTime(el.outTime.value) ?? transport.punch.out; el.outTime.value = fmtTime(transport.punch.out); };
el.autoPunch.onclick = ()=>{ transport.punch.enabled = !transport.punch.enabled; el.autoPunch.setAttribute('aria-pressed', String(transport.punch.enabled)); };
el.punchNow.onclick = ()=>{ if(!transport.playing) return; const idx=transport._armedIndex(); if(idx<0 || !transport.recordEnabled) return; if(!transport._recording) transport._startRecording(idx); else transport._stopRecording(true); };

// Click controls
el.clickEnable.onclick = ()=>{ const on = el.clickEnable.getAttribute('aria-pressed')!=='true'; el.clickEnable.setAttribute('aria-pressed', String(on)); transport.click.setEnabled(on); if(on && transport.playing) transport.click.start(); else transport.click.stop(); };
el.bpm.onchange = ()=>{ const v = +el.bpm.value; transport.click.setBpm(v); };
el.timesig.onchange = ()=>{ transport.click.setSig(el.timesig.value); };

// Tape age
el.tapeAge.oninput = ()=>{ const v=+el.tapeAge.value; el.tapeVal.textContent = `${Math.round(v*100)}%`; applyTapeAge(v); };

// Time + meters animation
function animate(){
  const pos = transport._transportNow(); updateTimeLabel(pos);
  // Master meter
  const buf = new Float32Array(engine.masterAnalyser.fftSize);
  engine.masterAnalyser.getFloatTimeDomainData(buf);
  let sum=0; for(let i=0;i<buf.length;i++){ sum += buf[i]*buf[i]; }
  const rms = Math.sqrt(sum/buf.length); const vu = Math.min(1, rms*3);
  el.masterMeter.style.width = `${(vu*100)|0}%`;
  // Track meters
  tracks.forEach(t=>{
    if(!t._meterFill) return;
    const tb = new Float32Array(t.analyser.fftSize);
    t.analyser.getFloatTimeDomainData(tb);
    let s=0; for(let i=0;i<tb.length;i++){ s+=tb[i]*tb[i]; }
    const trms=Math.sqrt(s/tb.length); const tvu=Math.min(1, trms*3);
    t._meterFill.style.width = `${(tvu*100)|0}%`;
  });
  // Playheads/timelines
  document.querySelectorAll('.timeline').forEach((tl,i)=>{
    const canvas = tl.querySelector('canvas'); const ph = tl.querySelector('.playhead'); const t=tracks[i]; if(canvas && ph && t){ drawTimeline(t, canvas, ph); }
  });
  requestAnimationFrame(animate);
}

// Boot
function boot(){
  renderTracks();
  el.rec.setAttribute('aria-pressed', 'false');
  el.speed.value='1'; el.spdVal.textContent='1.000x';
  el.inTime.value = fmtTime(transport.punch.in); el.outTime.value = fmtTime(transport.punch.out);
  el.tapeAge.value='0.15'; el.tapeVal.textContent='15%'; applyTapeAge(0.15);
  updateTimeLabel(0);
  requestAnimationFrame(animate);
}
boot();

// Resume audio context on first user gesture
window.addEventListener('click', ()=>{ if(engine.ctx.state==='suspended') engine.ctx.resume(); }, {once:true});

console.log('Porta-4Track ready');

// Helpers
function makeSaturationCurve(amount){ // amount 0..1
  const n=1024; const curve=new Float32Array(n); const k=amount*100; const deg=Math.PI/180; for(let i=0;i<n;i++){ const x=i*2/n-1; curve[i]=(1+ k)*x/(1+k*Math.abs(x)); } return curve; }
function parseTime(txt){ const m=/^(\d{1,2}):(\d{2})(?:\.(\d))?$/.exec(txt.trim()); if(!m) return null; const mm=+m[1], ss=+m[2], d=+(m[3]||0); return mm*60+ss+d/10; }
function applyTapeAge(age){ // 0=new, 1=worn
  // Per-track: increase wow/flutter depth, increase saturation a bit, lower LPF cutoff, boost head bump slightly
  tracks.forEach(t=>{
    const a=age;
    const hf = 18000 - a*12000; // 18k -> 6k
    const bump = 1.5 + a*2.0; // +1.5dB -> +3.5dB
    const wow = 0.001 + a*0.002; // 1ms -> 3ms
    const flutter = 0.0003 + a*0.0005; // 0.3ms -> 0.8ms
    const drive = 0.4 + a*0.5;
    t.tape.lowPass.frequency.value = hf;
    t.tape.lowShelf.gain.value = bump;
    t.tape.wowGain.gain.value = wow;
    t.tape.flutterGain.gain.value = flutter;
    t.tape.shaper.curve = makeSaturationCurve(drive);
  });
  // Hiss: raise with age
  engine.hiss.gain.gain.value = age*0.03; // subtle
  engine.hiss.bp.frequency.value = 7000 - age*1500; // shift a bit lower as tape ages
}
