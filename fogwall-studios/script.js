/* Fogwall Studios Text Adventure */
(function(){
  const logEl = document.getElementById('log');
  const input = document.getElementById('cmd');
  const year = document.getElementById('year');
  if(year) year.textContent = new Date().getFullYear();

  const state = {
    enteredFog:false,
    location:'outside',
    history:[],
  };

  const scrollLog = () => {
    requestAnimationFrame(()=>{ logEl.scrollTop = logEl.scrollHeight; });
  };

  function line(txt='', cls=''){
    const div = document.createElement('div');
    div.className = 'line'+(cls?(' '+cls):'');
    div.textContent = txt;
    logEl.appendChild(div);
    scrollLog();
  }

  function multiline(txt, cls=''){
    txt.split(/\r?\n/).forEach(t=> line(t, cls));
  }

  function intro(){
/* Opening text */
multiline(
`Fogwall Studios Interactive Fiction
-----------------------------------
A chill, minimal terminal in a dim chamber.
A wavering fog wall hums to the NORTH.

Type HELP for commands.`, 'line--sys');
  }

  const helpText =
`Commands:
  LOOK / L ........ describe surroundings
  ENTER ........... step into the fog wall
  ABOUT ........... studio description
  PROJECTS ......... list current projects
  CONTACT .......... contact links
  CLEAR ............ clear the screen
  QUIT ............. restart session
  HELP ............. this help`;

  function describe(){
    if(!state.enteredFog){
      multiline(`You stand before a pale fog wall. Cold air seeps through cracks.
An arch of unseen stone frames the wavering mass.
Paths: NORTH (fog wall).`);
    } else {
      multiline(`You are inside the fog. Shapes like ideas drift by.
A quiet terminal floats here, awaiting direction.
Exits: SOUTH (out).`);
    }
  }

  function about(){
    multiline(`Fogwall Studios crafts moody, minimal experiences with a gothic dungeon vibe.
Independent. Experimental. A little haunted.`);
  }

  function projects(){
    multiline(`Projects:
  FORWARD ........ Deck-building roguelite about momentum & consequence.
  BUG HUNTER ..... Terminal tactics in a derelict facility.
(More prototypes lurk in the mist.)`);
  }

  function contact(){
    // Provide clickable links
    const div = document.createElement('div');
    div.className='line';
    div.innerHTML =
`Contact:
  Email: <a class="inline-link" href="mailto:contact@fogwall.studio">contact@fogwall.studio</a>
  GitHub: <a class="inline-link" href="https://github.com/" target="_blank" rel="noopener">github.com</a>
  Mastodon: <a class="inline-link" href="https://mastodon.social/" target="_blank" rel="noopener me">mastodon.social</a>`;
    logEl.appendChild(div);
    scrollLog();
  }

  function clearScreen(){
    logEl.innerHTML='';
  }

  function restart(){
    state.enteredFog=false;
    state.location='outside';
    clearScreen();
    intro();
    describe();
  }

  function enterFog(){
    if(state.enteredFog){
      line('You are already within the fog.', 'line--dim');
      return;
    }
    state.enteredFog=true;
    state.location='inside';
    multiline(`You step forward.
The fog folds around you like static.
Silence deepens.`, 'line--ok');
    describe();
  }

  function leaveFog(){
    if(!state.enteredFog){
      line('You are already outside the fog.', 'line--dim');
      return;
    }
    state.enteredFog=false;
    state.location='outside';
    multiline(`You retreat and drip out of the fog wall.`, 'line--ok');
    describe();
  }

  const commands = {
    HELP: ()=> multiline(helpText, 'line--sys'),
    '?': ()=> multiline(helpText, 'line--sys'),
    LOOK: describe,
    L: describe,
    ABOUT: about,
    PROJECTS: projects,
    CONTACT: contact,
    CLEAR: clearScreen,
    ENTER: enterFog,
    NORTH: enterFog,
    SOUTH: leaveFog,
    OUT: leaveFog,
    QUIT: restart,
    RESTART: restart
  };

  function parse(raw){
    const cmd = raw.trim();
    if(!cmd){
      line('');
      return;
    }
    line('> '+cmd, 'line--dim');
    const upper = cmd.toUpperCase();

    // Support verbs with objects later
    if(commands[upper]){
      commands[upper]();
    } else {
      line("I don't understand that.", 'line--err');
    }
  }

  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault();
      const val = input.value;
      state.history.push(val);
      parse(val);
      input.value='';
      histIndex = state.history.length;
    } else if(e.key === 'ArrowUp'){
      if(histIndex > 0){
        histIndex--;
        input.value = state.history[histIndex] || '';
        requestAnimationFrame(()=> input.setSelectionRange(input.value.length, input.value.length));
      }
      e.preventDefault();
    } else if(e.key === 'ArrowDown'){
      if(histIndex < state.history.length){
        histIndex++;
        input.value = state.history[histIndex] || '';
        requestAnimationFrame(()=> input.setSelectionRange(input.value.length, input.value.length));
      }
      e.preventDefault();
    }
  });

  let histIndex = 0;

  // Keep focus
  function keepFocus(){
    if(document.activeElement !== input){
      input.focus();
    }
  }
  document.addEventListener('click', keepFocus);
  window.addEventListener('blur', ()=> setTimeout(keepFocus, 10));
  window.addEventListener('focus', keepFocus);

  // Initial render
  intro();
  describe();
  input.focus();
})();
