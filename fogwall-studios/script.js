/* Fogwall Studios interactions */
(function(){
  const gate = document.getElementById('gate');
  const site = document.getElementById('site');
  const fog = document.getElementById('fog');
  const enterBtn = document.getElementById('enterBtn');
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();

  // Fade in the gate on load
  if(gate){
    requestAnimationFrame(() => {
      gate.classList.add('gate--visible');
    });
  }

  // Build ASCII background matrix for intro
  const asciiBg = document.querySelector('.gate__ascii-bg');
  if(asciiBg){
    const cols = Math.ceil(window.innerWidth / 10);
    const rows = Math.ceil(window.innerHeight / 16);
    const density = [' ', '.', ':', '░', '▒'];
    let out = '';
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        const t = Math.random();
  const idx = t>0.92?4: t>0.84?3: t>0.7?2: t>0.5?1: 0;
        out += density[idx];
      }
      out += '\n';
    }
    asciiBg.style.whiteSpace = 'pre';
    asciiBg.style.fontFamily = 'Spline Sans Mono, ui-monospace, monospace';
    asciiBg.textContent = out;
  }

  // Build fog wall ASCII shimmer
  if(fog){
    const fogCols = 40; const fogRows = 18;
    const chars = [' ', '.', ':', '░'];
    const makeFrame = () => {
      let buf='';
      for(let r=0;r<fogRows;r++){
        for(let c=0;c<fogCols;c++){
          const centerFalloff = Math.hypot(c - fogCols/2, r - fogRows/2) / (Math.max(fogCols,fogRows)/2);
          const n = Math.random()* (1 - centerFalloff*0.8);
          const idx = n>0.76?3: n>0.52?2: n>0.28?1: 0;
          buf += chars[idx];
        }
        buf += '\n';
      }
      return buf;
    };

    const paint = () => { fog.textContent = makeFrame(); };
    paint();
  const fogTimer = setInterval(paint, 260);

    const enter = () => {
      clearInterval(fogTimer);
      gate.classList.add('gate--closing');
      setTimeout(()=>{
        gate.style.display='none';
        site.classList.remove('site--hidden');
      }, 600);
    };

    fog.addEventListener('click', enter);
    enterBtn.addEventListener('click', enter);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ enter(); }});
  }
})();
