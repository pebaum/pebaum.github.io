/**
 * Initiative Tracker Module
 * Manages combat initiative order and combatant HP
 */

class InitiativeTracker {
    constructor() {
        this.combatants = [];
        this.currentTurn = 0;
        this.nameInput = null;
        this.initInput = null;
        this.hpInput = null;
        this.addButton = null;
        this.clearButton = null;
        this.prevButton = null;
        this.nextButton = null;
        this.listContainer = null;
    }

    /**
     * Initialize the initiative tracker
     */
    init() {
        this.nameInput = document.getElementById('combatantName');
        this.initInput = document.getElementById('combatantInit');
        this.hpInput = document.getElementById('combatantHP');
        this.addButton = document.getElementById('addCombatant');
        this.clearButton = document.getElementById('clearEncounter');
        this.prevButton = document.getElementById('prevTurn');
        this.nextButton = document.getElementById('nextTurn');
        this.listContainer = document.getElementById('initiativeList');

        if (!this.listContainer) {
            console.error('Initiative list container not found');
            return;
        }

        // Bind events
        this.addButton.addEventListener('click', () => this.addCombatant());
        this.clearButton.addEventListener('click', () => this.clearEncounter());
        this.prevButton.addEventListener('click', () => this.previousTurn());
        this.nextButton.addEventListener('click', () => this.nextTurn());

        // Enter key to add combatant
        [this.nameInput, this.initInput, this.hpInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCombatant();
                }
            });
        });

        // Load saved state
        this.loadState();

        console.log('✓ Initiative tracker initialized');
    }

    /**
     * Add a combatant to initiative
     */
    addCombatant(name = null, initiative = null, hp = null) {
        const combatantName = name || this.nameInput.value.trim();
        const combatantInit = initiative !== null ? initiative : parseInt(this.initInput.value);
        const combatantHP = hp !== null ? hp : parseInt(this.hpInput.value) || 10;

        if (!combatantName || isNaN(combatantInit)) {
            return;
        }

        const combatant = {
            id: Date.now() + Math.random(),
            name: combatantName,
            initiative: combatantInit,
            hp: combatantHP,
            maxHP: combatantHP
        };

        this.combatants.push(combatant);
        this.sortCombatants();
        this.render();
        this.saveState();

        // Clear inputs
        if (!name) {
            this.nameInput.value = '';
            this.initInput.value = '';
            this.hpInput.value = '';
            this.nameInput.focus();
        }
    }

    /**
     * Add a monster from search results
     */
    addMonster(monster) {
        // Roll initiative for the monster (d20 + dex modifier)
        const dexMod = Math.floor((monster.dex - 10) / 2);
        const initiative = Math.floor(Math.random() * 20) + 1 + dexMod;

        this.addCombatant(monster.name, initiative, monster.hp);
    }

    /**
     * Remove a combatant
     */
    removeCombatant(id) {
        const index = this.combatants.findIndex(c => c.id === id);
        if (index !== -1) {
            this.combatants.splice(index, 1);
            if (this.currentTurn >= this.combatants.length) {
                this.currentTurn = 0;
            }
            this.render();
            this.saveState();
        }
    }

    /**
     * Adjust combatant HP
     */
    adjustHP(id, amount) {
        const combatant = this.combatants.find(c => c.id === id);
        if (combatant) {
            combatant.hp = Math.max(0, Math.min(combatant.maxHP, combatant.hp + amount));
            this.render();
            this.saveState();
        }
    }

    /**
     * Sort combatants by initiative (descending)
     */
    sortCombatants() {
        this.combatants.sort((a, b) => b.initiative - a.initiative);
    }

    /**
     * Next turn
     */
    nextTurn() {
        if (this.combatants.length === 0) return;
        this.currentTurn = (this.currentTurn + 1) % this.combatants.length;
        this.render();
        this.saveState();
    }

    /**
     * Previous turn
     */
    previousTurn() {
        if (this.combatants.length === 0) return;
        this.currentTurn = (this.currentTurn - 1 + this.combatants.length) % this.combatants.length;
        this.render();
        this.saveState();
    }

    /**
     * Clear all combatants
     */
    clearEncounter() {
        if (this.combatants.length === 0) return;
        if (confirm('Clear all combatants?')) {
            this.combatants = [];
            this.currentTurn = 0;
            this.render();
            this.saveState();
        }
    }

    /**
     * Render the initiative list
     */
    render() {
        if (this.combatants.length === 0) {
            this.listContainer.innerHTML = '<div class="empty-state">NO COMBATANTS YET</div>';
            return;
        }

        let html = '';
        this.combatants.forEach((combatant, index) => {
            const isActive = index === this.currentTurn;
            const activeClass = isActive ? 'active' : '';

            html += `
                <div class="combatant-item ${activeClass}">
                    <div class="combatant-init">${combatant.initiative}</div>
                    <div class="combatant-name">${combatant.name}</div>
                    <div class="combatant-hp">
                        <div class="hp-controls">
                            <button data-id="${combatant.id}" data-adjust="-5">-5</button>
                            <button data-id="${combatant.id}" data-adjust="-1">-1</button>
                            <button data-id="${combatant.id}" data-adjust="1">+1</button>
                            <button data-id="${combatant.id}" data-adjust="5">+5</button>
                        </div>
                        <div class="hp-value">${combatant.hp}/${combatant.maxHP}</div>
                    </div>
                    <button class="combatant-remove" data-id="${combatant.id}">✕</button>
                </div>
            `;
        });

        this.listContainer.innerHTML = html;

        // Bind HP adjustment buttons
        this.listContainer.querySelectorAll('.hp-controls button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseFloat(e.target.dataset.id);
                const adjust = parseInt(e.target.dataset.adjust);
                this.adjustHP(id, adjust);
            });
        });

        // Bind remove buttons
        this.listContainer.querySelectorAll('.combatant-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseFloat(e.target.dataset.id);
                this.removeCombatant(id);
            });
        });
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        const state = {
            combatants: this.combatants,
            currentTurn: this.currentTurn
        };
        localStorage.setItem('dnd-initiative', JSON.stringify(state));
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        const saved = localStorage.getItem('dnd-initiative');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.combatants = state.combatants || [];
                this.currentTurn = state.currentTurn || 0;
                this.render();
            } catch (error) {
                console.error('Error loading initiative state:', error);
            }
        }
    }
}

// Create singleton instance
const initiativeTracker = new InitiativeTracker();

export default initiativeTracker;
