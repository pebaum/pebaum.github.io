/**
 * Dice Roller Module
 * Handles all dice rolling functionality
 */

class DiceRoller {
    constructor() {
        this.history = [];
        this.maxHistory = 10;
        this.diceButtons = null;
        this.customRollInput = null;
        this.rollCustomButton = null;
        this.advantageButton = null;
        this.disadvantageButton = null;
        this.historyContainer = null;
    }

    /**
     * Initialize the dice roller
     */
    init() {
        this.diceButtons = document.querySelectorAll('.die-btn');
        this.customRollInput = document.getElementById('customRoll');
        this.rollCustomButton = document.getElementById('rollCustom');
        this.advantageButton = document.getElementById('rollAdvantage');
        this.disadvantageButton = document.getElementById('rollDisadvantage');
        this.historyContainer = document.getElementById('rollHistory');

        if (!this.historyContainer) {
            console.error('Roll history container not found');
            return;
        }

        // Bind die button clicks
        this.diceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const die = btn.dataset.die;
                this.rollDie(die);
            });
        });

        // Bind custom roll
        this.rollCustomButton.addEventListener('click', () => this.rollCustom());
        this.customRollInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.rollCustom();
            }
        });

        // Bind advantage/disadvantage
        this.advantageButton.addEventListener('click', () => this.rollD20WithAdvantage(true));
        this.disadvantageButton.addEventListener('click', () => this.rollD20WithAdvantage(false));

        // Keyboard shortcut: R for quick d20 roll
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                this.rollDie('d20');
            }
        });

        console.log('✓ Dice roller initialized');
    }

    /**
     * Roll a single die
     */
    rollDie(dieType) {
        const sides = parseInt(dieType.substring(1));
        const result = Math.floor(Math.random() * sides) + 1;

        this.addToHistory({
            type: dieType.toUpperCase(),
            result: result,
            description: `${dieType.toUpperCase()}: ${result}`
        });
    }

    /**
     * Roll custom dice expression (e.g., "2d6+3")
     */
    rollCustom() {
        const expression = this.customRollInput.value.trim();
        if (!expression) return;

        try {
            const result = this.parseAndRoll(expression);
            this.customRollInput.value = '';
        } catch (error) {
            this.addToHistory({
                type: 'ERROR',
                result: 0,
                description: 'INVALID DICE EXPRESSION'
            });
        }
    }

    /**
     * Parse and roll a dice expression
     */
    parseAndRoll(expression) {
        // Remove spaces
        expression = expression.replace(/\s/g, '').toLowerCase();

        // Match pattern: XdY+Z or XdY-Z or XdY
        const match = expression.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
        if (!match) {
            throw new Error('Invalid dice expression');
        }

        const numDice = parseInt(match[1] || '1');
        const sides = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;

        if (numDice > 100 || sides > 1000) {
            throw new Error('Numbers too large');
        }

        // Roll the dice
        let total = 0;
        const rolls = [];
        for (let i = 0; i < numDice; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }

        total += modifier;

        const rollsText = rolls.join(', ');
        const modText = modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : '';
        const description = `${numDice}D${sides}${modText}: [${rollsText}]${modText} = ${total}`;

        this.addToHistory({
            type: `${numDice}D${sides}${modText}`.toUpperCase(),
            result: total,
            description: description
        });

        return total;
    }

    /**
     * Roll d20 with advantage or disadvantage
     */
    rollD20WithAdvantage(isAdvantage) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        const result = isAdvantage ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
        const type = isAdvantage ? 'ADVANTAGE' : 'DISADVANTAGE';

        this.addToHistory({
            type: type,
            result: result,
            description: `${type}: [${roll1}, ${roll2}] = ${result}`
        });
    }

    /**
     * Add roll to history
     */
    addToHistory(roll) {
        this.history.unshift(roll);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        this.renderHistory();
    }

    /**
     * Render roll history
     */
    renderHistory() {
        if (this.history.length === 0) {
            this.historyContainer.innerHTML = '<div class="history-item">ROLL HISTORY APPEARS HERE</div>';
            return;
        }

        let html = '';
        this.history.forEach((roll, index) => {
            const isCritical = roll.result === 20 && roll.type.includes('D20');
            const isFumble = roll.result === 1 && roll.type.includes('D20');

            let extraClass = '';
            if (isCritical) extraClass = ' style="border-color: rgba(100, 255, 100, 0.5);"';
            if (isFumble) extraClass = ' style="border-color: rgba(255, 100, 100, 0.5);"';

            html += `
                <div class="history-item"${extraClass}>
                    <div class="roll-result">${roll.description}</div>
                </div>
            `;
        });

        this.historyContainer.innerHTML = html;
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.renderHistory();
    }
}

// Create singleton instance
const diceRoller = new DiceRoller();

export default diceRoller;
