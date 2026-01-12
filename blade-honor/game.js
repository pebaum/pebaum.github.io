// Blade & Honor - Game Logic
// Brutalist Edition

const CARDS = {
    attack: [
        { name: 'JAB', power: 1, icon: '⚔', type: 'attack' },
        { name: 'SLASH', power: 2, icon: '⚔', type: 'attack' },
        { name: 'THRUST', power: 3, icon: '⚔', type: 'attack' },
        { name: 'HEAVY', power: 4, icon: '⚔', type: 'attack' },
        { name: 'LUNGE', power: 5, icon: '⚔', type: 'attack' }
    ],
    defense: [
        { name: 'STEP', power: 1, icon: '⛊', type: 'defense' },
        { name: 'BLOCK', power: 2, icon: '⛊', type: 'defense' },
        { name: 'PARRY', power: 3, icon: '⛊', type: 'defense' },
        { name: 'DODGE', power: 4, icon: '⛊', type: 'defense' },
        { name: 'RIPOSTE', power: 5, icon: '⛊', type: 'defense' }
    ],
    maneuver: [
        { name: 'READ', power: 1, icon: '◈', type: 'maneuver' },
        { name: 'FEINT', power: 2, icon: '◈', type: 'maneuver' },
        { name: 'PRESS', power: 3, icon: '◈', type: 'maneuver' },
        { name: 'BIND', power: 4, icon: '◈', type: 'maneuver' },
        { name: 'DISARM', power: 5, icon: '◈', type: 'maneuver' }
    ]
};

const TYPE_ICONS = { attack: '⚔', defense: '⛊', maneuver: '◈' };

function createDeckTemplate() {
    return [
        { back: 'attack', trueType: 'attack', power: 1, isTrick: false },
        { back: 'attack', trueType: 'attack', power: 2, isTrick: false },
        { back: 'attack', trueType: 'attack', power: 3, isTrick: false },
        { back: 'attack', trueType: 'defense', power: 5, isTrick: true },
        { back: 'attack', trueType: 'maneuver', power: 4, isTrick: true },
        { back: 'defense', trueType: 'defense', power: 1, isTrick: false },
        { back: 'defense', trueType: 'defense', power: 2, isTrick: false },
        { back: 'defense', trueType: 'defense', power: 3, isTrick: false },
        { back: 'defense', trueType: 'attack', power: 4, isTrick: true },
        { back: 'defense', trueType: 'maneuver', power: 5, isTrick: true },
        { back: 'maneuver', trueType: 'maneuver', power: 1, isTrick: false },
        { back: 'maneuver', trueType: 'maneuver', power: 2, isTrick: false },
        { back: 'maneuver', trueType: 'maneuver', power: 3, isTrick: false },
        { back: 'maneuver', trueType: 'attack', power: 5, isTrick: true },
        { back: 'maneuver', trueType: 'defense', power: 4, isTrick: true }
    ];
}

function getCardDetails(trueType, power) {
    return CARDS[trueType].find(c => c.power === power) || { name: '???', icon: '?' };
}

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

let gameState = {
    playerHP: 10,
    cpuHP: 10,
    playerDeck: [],
    cpuDeck: [],
    playerHand: [],
    cpuHand: [],
    playerDiscard: [],
    cpuDiscard: [],
    round: 1,
    clash: 1,
    clashes: [null, null, null],
    selectedCard: null,
    phase: 'select',
    lastLoser: null,
    resolving: false
};

function startGame() {
    document.getElementById('modal').classList.remove('active');
    document.getElementById('combat-log').innerHTML = '';
    
    gameState = {
        playerHP: 10,
        cpuHP: 10,
        playerDeck: shuffle(createDeckTemplate()),
        cpuDeck: shuffle(createDeckTemplate()),
        playerHand: [],
        cpuHand: [],
        playerDiscard: [],
        cpuDiscard: [],
        round: 1,
        clash: 1,
        clashes: [null, null, null],
        selectedCard: null,
        phase: 'select',
        lastLoser: null,
        resolving: false
    };

    drawCards('player', 3);
    drawCards('cpu', 3);
    
    log('system', 'DUEL INITIATED — ROUND 1');
    updateUI();
}

function drawCards(who, count) {
    const deck = who === 'player' ? gameState.playerDeck : gameState.cpuDeck;
    const hand = who === 'player' ? gameState.playerHand : gameState.cpuHand;
    for (let i = 0; i < count && deck.length > 0; i++) {
        hand.push(deck.pop());
    }
}

function selectCard(card) {
    if (gameState.phase !== 'select') return;
    gameState.selectedCard = gameState.selectedCard === card ? null : card;
    updateUI();
}

function commitCard() {
    if (!gameState.selectedCard || gameState.phase !== 'select') return;

    const idx = gameState.clash - 1;
    const playerCard = gameState.selectedCard;

    gameState.playerHand.splice(gameState.playerHand.indexOf(playerCard), 1);
    
    if (!gameState.clashes[idx]) gameState.clashes[idx] = { player: null, cpu: null };
    gameState.clashes[idx].player = playerCard;

    // CPU plays
    const cpuCard = cpuSelect();
    gameState.cpuHand.splice(gameState.cpuHand.indexOf(cpuCard), 1);
    gameState.clashes[idx].cpu = cpuCard;

    gameState.selectedCard = null;

    if (gameState.clash < 3) {
        gameState.clash++;
        log('system', `CLASH ${gameState.clash - 1} SET — SELECT FOR CLASH ${gameState.clash}`);
    } else {
        gameState.phase = 'resolve';
        log('system', 'ALL CARDS COMMITTED — READY TO RESOLVE');
    }

    updateUI();
}

function cpuSelect() {
    const hand = gameState.cpuHand;
    if (!hand.length) return null;

    const sorted = [...hand].sort((a, b) => a.power - b.power);
    
    // Smarter AI: vary strategy
    if (gameState.clash === 3) {
        return sorted[sorted.length - 1]; // Best card last
    } else if (gameState.clash === 2) {
        return sorted[Math.floor(sorted.length / 2)];
    } else {
        // First clash: usually low, sometimes high to bluff
        return Math.random() < 0.25 ? sorted[sorted.length - 1] : sorted[0];
    }
}

async function resolveClashes() {
    if (gameState.phase !== 'resolve' || gameState.resolving) return;
    gameState.resolving = true;

    for (let i = 0; i < 3; i++) {
        const clash = gameState.clashes[i];
        if (!clash) continue;

        // Reveal with delay for game feel
        await delay(400);
        
        const result = resolveOne(clash.player, clash.cpu, i + 1);
        
        if (result.playerDmg > 0) {
            gameState.playerHP = Math.max(0, gameState.playerHP - result.playerDmg);
            gameState.lastLoser = 'player';
            shakeElement('player-hp');
        }
        if (result.cpuDmg > 0) {
            gameState.cpuHP = Math.max(0, gameState.cpuHP - result.cpuDmg);
            gameState.lastLoser = 'cpu';
            shakeElement('cpu-hp');
        }

        gameState.playerDiscard.push(clash.player);
        gameState.cpuDiscard.push(clash.cpu);

        updateUI();
        updateClashResult(i, result);
        
        await delay(600);
    }

    gameState.phase = 'round-end';
    gameState.resolving = false;
    updateUI();

    if (gameState.playerHP <= 0 || gameState.cpuHP <= 0) {
        await delay(800);
        showGameOver();
    }
}

function resolveOne(pCard, cCard, num) {
    const pType = pCard.trueType, cType = cCard.trueType;
    const pPow = pCard.power, cPow = cCard.power;
    const pDetails = getCardDetails(pType, pPow);
    const cDetails = getCardDetails(cType, cPow);

    let playerDmg = 0, cpuDmg = 0, winner = 'tie';

    const beats = { attack: 'maneuver', defense: 'attack', maneuver: 'defense' };

    if (pType === cType) {
        if (pPow > cPow) {
            cpuDmg = pPow - cPow;
            winner = 'player';
            log('win', `C${num}: ${pDetails.name} ${pPow} vs ${cDetails.name} ${cPow} — YOU DEAL ${cpuDmg}`);
        } else if (cPow > pPow) {
            playerDmg = cPow - pPow;
            winner = 'cpu';
            log('damage', `C${num}: ${pDetails.name} ${pPow} vs ${cDetails.name} ${cPow} — YOU TAKE ${playerDmg}`);
        } else {
            log('system', `C${num}: ${pDetails.name} vs ${cDetails.name} — TIE`);
        }
    } else if (beats[pType] === cType) {
        cpuDmg = pPow;
        winner = 'player';
        log('win', `C${num}: ${TYPE_ICONS[pType]} ${pDetails.name} BEATS ${TYPE_ICONS[cType]} ${cDetails.name} — DEAL ${cpuDmg}`);
    } else {
        playerDmg = cPow;
        winner = 'cpu';
        log('damage', `C${num}: ${TYPE_ICONS[cType]} ${cDetails.name} BEATS ${TYPE_ICONS[pType]} ${pDetails.name} — TAKE ${playerDmg}`);
    }

    if (pCard.isTrick) log('system', `  TRICK: ${pCard.back.toUpperCase()} BACK WAS ${pType.toUpperCase()}`);
    if (cCard.isTrick) log('system', `  ENEMY TRICK: ${cCard.back.toUpperCase()} BACK WAS ${cType.toUpperCase()}`);

    return { playerDmg, cpuDmg, winner };
}

function nextRound() {
    if (gameState.phase !== 'round-end') return;

    gameState.round++;
    gameState.clash = 1;
    gameState.clashes = [null, null, null];
    gameState.phase = 'select';

    // Reset clash results
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`c${i}-result`).textContent = '';
    }

    drawCards('player', 3);
    drawCards('cpu', 3);

    if (gameState.playerHand.length === 0) {
        gameState.playerDeck = shuffle([...gameState.playerDiscard]);
        gameState.cpuDeck = shuffle([...gameState.cpuDiscard]);
        gameState.playerDiscard = [];
        gameState.cpuDiscard = [];
        drawCards('player', 3);
        drawCards('cpu', 3);
        log('system', 'DECKS RESHUFFLED');
    }

    log('system', `ROUND ${gameState.round} — SELECT CARD FOR CLASH 1`);
    updateUI();
}

function showGameOver() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');

    if (gameState.playerHP <= 0 && gameState.cpuHP <= 0) {
        title.textContent = 'DRAW';
        text.textContent = 'MUTUAL DESTRUCTION';
    } else if (gameState.playerHP <= 0) {
        title.textContent = 'DEFEAT';
        text.textContent = 'YOU HAVE FALLEN';
    } else {
        title.textContent = 'VICTORY';
        text.textContent = 'ENEMY DEFEATED';
    }

    modal.classList.add('active');
}

function log(type, text) {
    const logEl = document.getElementById('combat-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = text;
    logEl.insertBefore(entry, logEl.firstChild);
}

function toggleHelp() {
    document.getElementById('help-panel').classList.toggle('open');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function shakeElement(id) {
    const el = document.getElementById(id);
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 400);
}

function updateClashResult(idx, result) {
    const resultEl = document.getElementById(`c${idx + 1}-result`);
    if (result.winner === 'player') {
        resultEl.textContent = `−${result.cpuDmg} ENEMY`;
    } else if (result.winner === 'cpu') {
        resultEl.textContent = `−${result.playerDmg} YOU`;
    } else {
        resultEl.textContent = 'TIE';
    }
}

function updateUI() {
    // HP
    document.getElementById('player-hp').textContent = gameState.playerHP;
    document.getElementById('cpu-hp').textContent = gameState.cpuHP;
    document.getElementById('player-hp-bar').style.width = `${gameState.playerHP * 10}%`;
    document.getElementById('cpu-hp-bar').style.width = `${gameState.cpuHP * 10}%`;

    // Status
    document.getElementById('round-num').textContent = `ROUND ${gameState.round}`;
    
    let statusText = '';
    if (gameState.phase === 'select') {
        statusText = `SELECT CARD FOR CLASH ${gameState.clash}`;
    } else if (gameState.phase === 'resolve') {
        statusText = 'RESOLVE CLASHES';
    } else {
        statusText = 'ROUND COMPLETE';
    }
    document.getElementById('status-text').textContent = statusText;

    // Hands
    renderPlayerHand();
    renderCPUHand();
    updateClashTracker();

    // Buttons
    const playBtn = document.getElementById('play-btn');
    const resolveBtn = document.getElementById('resolve-btn');
    const nextBtn = document.getElementById('next-btn');

    playBtn.style.display = gameState.phase === 'select' ? 'inline-block' : 'none';
    playBtn.disabled = !gameState.selectedCard;
    
    resolveBtn.style.display = gameState.phase === 'resolve' ? 'inline-block' : 'none';
    nextBtn.style.display = gameState.phase === 'round-end' ? 'inline-block' : 'none';
}

function renderPlayerHand() {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';

    gameState.playerHand.forEach(card => {
        const details = getCardDetails(card.trueType, card.power);
        const el = document.createElement('div');
        el.className = `card ${gameState.selectedCard === card ? 'selected' : ''}`;
        el.innerHTML = `
            ${card.isTrick ? '<span class="trick-indicator">TRICK</span>' : ''}
            <div class="card-icon">${details.icon}</div>
            <div class="card-name">${details.name}</div>
            <div class="card-type">${card.trueType}</div>
            <div class="card-power">${card.power}</div>
            <div class="card-back-info">BACK: ${card.back.toUpperCase()}</div>
        `;
        el.onclick = () => selectCard(card);
        container.appendChild(el);
    });
}

function renderCPUHand() {
    const container = document.getElementById('cpu-hand');
    container.innerHTML = '';

    gameState.cpuHand.forEach(card => {
        const el = document.createElement('div');
        el.className = 'card-back';
        el.innerHTML = `
            <div class="back-icon">${TYPE_ICONS[card.back]}</div>
            <div class="back-type">${card.back}</div>
        `;
        container.appendChild(el);
    });
}

function updateClashTracker() {
    for (let i = 0; i < 3; i++) {
        const box = document.getElementById(`clash-box-${i + 1}`);
        const pSlot = document.getElementById(`c${i + 1}-player`);
        const cSlot = document.getElementById(`c${i + 1}-cpu`);

        box.classList.toggle('active', gameState.clash === i + 1 && gameState.phase === 'select');

        const clash = gameState.clashes[i];
        const showTrue = gameState.phase === 'resolve' || gameState.phase === 'round-end';

        if (clash?.player) {
            const pd = getCardDetails(clash.player.trueType, clash.player.power);
            pSlot.className = 'clash-card set' + (showTrue ? ' revealed' : '');
            pSlot.innerHTML = `<span class="icon">${pd.icon}</span><span class="power">${clash.player.power}</span>`;
        } else {
            pSlot.className = 'clash-card';
            pSlot.innerHTML = '<span class="icon">?</span>';
        }

        if (clash?.cpu) {
            if (showTrue) {
                const cd = getCardDetails(clash.cpu.trueType, clash.cpu.power);
                cSlot.className = 'clash-card set revealed';
                cSlot.innerHTML = `<span class="icon">${cd.icon}</span><span class="power">${clash.cpu.power}</span>`;
            } else {
                cSlot.className = 'clash-card set';
                cSlot.innerHTML = `<span class="icon">${TYPE_ICONS[clash.cpu.back]}</span>`;
            }
        } else {
            cSlot.className = 'clash-card';
            cSlot.innerHTML = '<span class="icon">?</span>';
        }
    }
}

// Event listeners
document.getElementById('play-btn').addEventListener('click', commitCard);
document.getElementById('resolve-btn').addEventListener('click', resolveClashes);
document.getElementById('next-btn').addEventListener('click', nextRound);

// Start
startGame();
