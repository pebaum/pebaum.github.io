/**
 * Session Maker Module
 * Generates abstract session structures based on party levels
 * Uses NODES concept and 5-room dungeon structure
 */

class SessionMaker {
    constructor() {
        this.partyLevelsInput = null;
        this.generateBtn = null;
        this.sessionOutput = null;
    }

    /**
     * Initialize the session maker
     */
    init() {
        this.partyLevelsInput = document.getElementById('partyLevels');
        this.generateBtn = document.getElementById('generateSession');
        this.sessionOutput = document.getElementById('sessionOutput');

        if (!this.partyLevelsInput || !this.generateBtn || !this.sessionOutput) {
            console.error('Session maker elements not found');
            return;
        }

        // Bind events
        this.generateBtn.addEventListener('click', () => this.generateSession());
        this.partyLevelsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateSession();
            }
        });

        console.log('✓ Session maker initialized');
    }

    /**
     * Parse party levels from input
     */
    parsePartyLevels(input) {
        const levels = input.split(',')
            .map(l => parseInt(l.trim()))
            .filter(l => !isNaN(l) && l >= 1 && l <= 20);
        return levels;
    }

    /**
     * Calculate average party level
     */
    getAverageLevel(levels) {
        return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
    }

    /**
     * Get appropriate DCs for party level
     */
    getDCs(avgLevel) {
        const baseDC = 10 + Math.floor(avgLevel / 2);
        return {
            easy: baseDC - 2,
            medium: baseDC,
            hard: baseDC + 3,
            deadly: baseDC + 5
        };
    }

    /**
     * Get appropriate damage values for party level
     */
    getDamage(avgLevel) {
        const baseDamage = Math.floor(avgLevel * 1.5) + 2;
        return {
            minor: `${Math.floor(baseDamage * 0.5)}d6`,
            moderate: `${baseDamage}d6`,
            major: `${Math.floor(baseDamage * 1.5)}d8`,
            severe: `${baseDamage * 2}d10`
        };
    }

    /**
     * Get stat block guidelines for enemy types
     */
    getEnemyStats(avgLevel) {
        const baseAC = 10 + avgLevel;
        const baseHP = avgLevel * 8;
        const baseAttack = Math.floor(avgLevel / 2) + 2;

        return {
            minion: {
                ac: baseAC - 3,
                hp: Math.floor(baseHP * 0.3),
                attack: `+${baseAttack - 2}`,
                damage: `1d6+${Math.floor(avgLevel / 2)}`
            },
            standard: {
                ac: baseAC,
                hp: baseHP,
                attack: `+${baseAttack}`,
                damage: `1d8+${Math.floor(avgLevel / 2) + 1}`
            },
            elite: {
                ac: baseAC + 2,
                hp: Math.floor(baseHP * 1.5),
                attack: `+${baseAttack + 2}`,
                damage: `2d8+${Math.floor(avgLevel / 2) + 2}`
            },
            boss: {
                ac: baseAC + 4,
                hp: baseHP * 3,
                attack: `+${baseAttack + 4}`,
                damage: `3d10+${avgLevel}`
            }
        };
    }

    /**
     * Generate 5-room dungeon structure with NODES
     */
    generateFiveRoomDungeon(avgLevel, partySize) {
        const dcs = this.getDCs(avgLevel);
        const damage = this.getDamage(avgLevel);
        const enemyStats = this.getEnemyStats(avgLevel);

        // 5 Room Dungeon: Entrance/Guardian, Puzzle/Roleplay, Trick/Setback, Climax/Boss, Reward/Twist
        return [
            {
                name: 'ENTRANCE & GUARDIAN',
                type: 'Combat Node',
                description: 'Initial encounter that sets tone and warns of dangers ahead',
                enemies: `${partySize} Standard enemies OR ${partySize * 2} Minions`,
                stats: enemyStats.standard,
                mechanics: [
                    `Perception DC ${dcs.medium} to notice environmental hazards`,
                    `Investigation DC ${dcs.easy} to find alternate route`,
                    `Environmental damage: ${damage.minor} on failed DEX save DC ${dcs.medium}`
                ]
            },
            {
                name: 'PUZZLE OR ROLEPLAY',
                type: 'Non-Combat Node',
                description: 'Challenge requiring problem-solving or social interaction',
                challenge: 'Choose one: Complex Puzzle, NPC Negotiation, or Trap Sequence',
                mechanics: [
                    `Primary skill check DC ${dcs.medium} (varies by approach)`,
                    `Failed check: ${damage.minor} damage OR setback/complication`,
                    `Success: Advantage on next encounter OR valuable information`,
                    `Alternative solutions: Allow creative use of spells/abilities`
                ]
            },
            {
                name: 'TRICK OR SETBACK',
                type: 'Mixed Node',
                description: 'Unexpected complication or false victory',
                options: [
                    `Trap: DEX save DC ${dcs.hard} or take ${damage.moderate} damage`,
                    `Ambush: ${Math.floor(partySize * 1.5)} Minions attack with surprise`,
                    `Environmental hazard requiring multiple saves`,
                    `Resource drain (spell slots, HP, time pressure)`
                ],
                stats: enemyStats.minion
            },
            {
                name: 'CLIMAX & BOSS FIGHT',
                type: 'Major Combat Node',
                description: 'Primary encounter with significant threat',
                enemies: '1 Boss + ' + Math.floor(partySize / 2) + ' Standard enemies OR 1 Elite Boss',
                bossStats: enemyStats.boss,
                minionStats: enemyStats.standard,
                mechanics: [
                    `Boss has legendary actions: ${Math.floor(avgLevel / 4) + 2} per round`,
                    `Lair action on initiative 20: ${damage.moderate} area effect`,
                    `Phase change at 50% HP: New ability or reinforcements`,
                    `Environmental features: CON save DC ${dcs.hard} or ${damage.major} damage`
                ]
            },
            {
                name: 'REWARD & TWIST',
                type: 'Resolution Node',
                description: 'Conclusion with reward and hook for future sessions',
                rewards: [
                    `Treasure appropriate for APL ${avgLevel}`,
                    `1-2 consumable magic items (potions, scrolls)`,
                    `Information or map to next location`,
                    `NPC ally or faction reputation`
                ],
                twist: [
                    'Hidden passage to deeper level',
                    'Moral choice affecting future events',
                    'Enemy escapes to return later',
                    'Unexpected consequence of party actions'
                ]
            }
        ];
    }

    /**
     * Generate and display session
     */
    generateSession() {
        const input = this.partyLevelsInput.value.trim();

        if (!input) {
            this.sessionOutput.innerHTML = '<div class="empty-state">ENTER PARTY LEVELS FIRST</div>';
            return;
        }

        const levels = this.parsePartyLevels(input);

        if (levels.length === 0) {
            this.sessionOutput.innerHTML = '<div class="empty-state">INVALID INPUT - USE FORMAT: 3,4,3,5</div>';
            return;
        }

        const avgLevel = this.getAverageLevel(levels);
        const partySize = levels.length;
        const dcs = this.getDCs(avgLevel);
        const damage = this.getDamage(avgLevel);

        const nodes = this.generateFiveRoomDungeon(avgLevel, partySize);

        let html = `
            <div class="party-info">
                <strong>PARTY:</strong> ${partySize} members |
                <strong>AVG LEVEL:</strong> ${avgLevel} |
                <strong>DCs:</strong> Easy ${dcs.easy}, Med ${dcs.medium}, Hard ${dcs.hard}, Deadly ${dcs.deadly}
            </div>
        `;

        nodes.forEach((node, index) => {
            html += this.renderNode(node, index + 1);
        });

        this.sessionOutput.innerHTML = html;
    }

    /**
     * Render a single node
     */
    renderNode(node, number) {
        let html = `
            <div class="session-node">
                <div class="node-header">
                    <div class="node-title">NODE ${number}: ${node.name}</div>
                    <div class="node-type">${node.type}</div>
                </div>
                <div class="node-content">
        `;

        if (node.description) {
            html += `<div style="margin-bottom: 12px; opacity: 0.8;">${node.description}</div>`;
        }

        if (node.enemies) {
            html += `
                <div class="node-stat">
                    <div class="stat-label-sm">ENEMIES:</div>
                    <div class="stat-value-sm">${node.enemies}</div>
                </div>
            `;
        }

        if (node.stats) {
            html += `
                <div class="node-stat">
                    <div class="stat-label-sm">STAT BLOCK:</div>
                    <div class="stat-value-sm">AC ${node.stats.ac} | HP ${node.stats.hp} | ATK ${node.stats.attack} (${node.stats.damage})</div>
                </div>
            `;
        }

        if (node.bossStats) {
            html += `
                <div class="node-stat">
                    <div class="stat-label-sm">BOSS STATS:</div>
                    <div class="stat-value-sm">AC ${node.bossStats.ac} | HP ${node.bossStats.hp} | ATK ${node.bossStats.attack} (${node.bossStats.damage})</div>
                </div>
            `;
        }

        if (node.minionStats && node.bossStats) {
            html += `
                <div class="node-stat">
                    <div class="stat-label-sm">MINION STATS:</div>
                    <div class="stat-value-sm">AC ${node.minionStats.ac} | HP ${node.minionStats.hp} | ATK ${node.minionStats.attack} (${node.minionStats.damage})</div>
                </div>
            `;
        }

        if (node.challenge) {
            html += `
                <div class="node-stat">
                    <div class="stat-label-sm">CHALLENGE:</div>
                    <div class="stat-value-sm">${node.challenge}</div>
                </div>
            `;
        }

        if (node.mechanics && node.mechanics.length > 0) {
            html += `<div class="node-stat" style="grid-template-columns: 1fr; padding-top: 10px;">
                <div class="stat-label-sm">MECHANICS:</div>
            </div>`;
            node.mechanics.forEach(mech => {
                html += `<div style="padding: 4px 0; font-size: 10px; opacity: 0.7;">• ${mech}</div>`;
            });
        }

        if (node.options && node.options.length > 0) {
            html += `<div class="node-stat" style="grid-template-columns: 1fr; padding-top: 10px;">
                <div class="stat-label-sm">OPTIONS:</div>
            </div>`;
            node.options.forEach(opt => {
                html += `<div style="padding: 4px 0; font-size: 10px; opacity: 0.7;">• ${opt}</div>`;
            });
        }

        if (node.rewards && node.rewards.length > 0) {
            html += `<div class="node-stat" style="grid-template-columns: 1fr; padding-top: 10px;">
                <div class="stat-label-sm">REWARDS:</div>
            </div>`;
            node.rewards.forEach(reward => {
                html += `<div style="padding: 4px 0; font-size: 10px; opacity: 0.7;">• ${reward}</div>`;
            });
        }

        if (node.twist && node.twist.length > 0) {
            html += `<div class="node-stat" style="grid-template-columns: 1fr; padding-top: 10px;">
                <div class="stat-label-sm">TWIST OPTIONS:</div>
            </div>`;
            node.twist.forEach(tw => {
                html += `<div style="padding: 4px 0; font-size: 10px; opacity: 0.7;">• ${tw}</div>`;
            });
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }
}

// Create singleton instance
const sessionMaker = new SessionMaker();

export default sessionMaker;
