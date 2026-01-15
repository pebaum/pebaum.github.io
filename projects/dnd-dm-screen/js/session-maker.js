/**
 * Session Maker Module
 * Generates intelligent session structures based on party levels
 * Pulls from the full 5etools database for real monster suggestions
 * Uses NODES concept and 5-room dungeon structure
 */

import dataLoader from './data-loader.js';

class SessionMaker {
    constructor() {
        this.partyLevelsInput = null;
        this.generateBtn = null;
        this.sessionOutput = null;
        this.monstersData = [];
        this.spellsData = [];
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

        // Load monster and spell data
        const allData = dataLoader.getAllData();
        this.monstersData = allData.monsters || [];
        this.spellsData = allData.spells || [];

        // Bind events
        this.generateBtn.addEventListener('click', () => this.generateSession());
        this.partyLevelsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateSession();
            }
        });

        console.log(`✓ Session maker initialized with ${this.monstersData.length} monsters`);
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
     * Convert CR string to number for comparison
     */
    crToNumber(cr) {
        if (typeof cr === 'number') return cr;
        if (!cr) return 0;

        // Handle fractions like "1/2", "1/4", "1/8"
        if (cr.includes('/')) {
            const parts = cr.split('/');
            return parseInt(parts[0]) / parseInt(parts[1]);
        }
        return parseFloat(cr) || 0;
    }

    /**
     * Find monsters within a CR range
     */
    findMonstersByCR(minCR, maxCR, count = 5) {
        const filtered = this.monstersData.filter(m => {
            const cr = this.crToNumber(m.cr);
            return cr >= minCR && cr <= maxCR;
        });

        // Shuffle and take random selection
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Get monster suggestions for an encounter
     */
    getMonsterSuggestions(avgLevel, difficulty = 'medium', count = 3) {
        let targetCR;

        switch(difficulty) {
            case 'easy':
                targetCR = Math.max(0, avgLevel - 3);
                break;
            case 'medium':
                targetCR = avgLevel;
                break;
            case 'hard':
                targetCR = avgLevel + 2;
                break;
            case 'deadly':
                targetCR = avgLevel + 4;
                break;
            default:
                targetCR = avgLevel;
        }

        // Find monsters within +/- 2 CR of target
        const minCR = Math.max(0, targetCR - 2);
        const maxCR = targetCR + 2;

        return this.findMonstersByCR(minCR, maxCR, count);
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

        // Get real monster suggestions for each encounter
        const easyMonsters = this.getMonsterSuggestions(avgLevel, 'easy', 3);
        const mediumMonsters = this.getMonsterSuggestions(avgLevel, 'medium', 3);
        const hardMonsters = this.getMonsterSuggestions(avgLevel, 'hard', 3);
        const bossMonsters = this.getMonsterSuggestions(avgLevel, 'deadly', 2);

        // 5 Room Dungeon: Entrance/Guardian, Puzzle/Roleplay, Trick/Setback, Climax/Boss, Reward/Twist
        return [
            {
                name: 'ENTRANCE & GUARDIAN',
                type: 'Combat Node',
                description: 'Initial encounter that sets tone and warns of dangers ahead',
                enemies: `${partySize} Standard enemies OR ${partySize * 2} Minions`,
                stats: enemyStats.standard,
                monsterSuggestions: mediumMonsters,
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
                stats: enemyStats.minion,
                monsterSuggestions: easyMonsters
            },
            {
                name: 'CLIMAX & BOSS FIGHT',
                type: 'Major Combat Node',
                description: 'Primary encounter with significant threat',
                enemies: '1 Boss + ' + Math.floor(partySize / 2) + ' Standard enemies OR 1 Elite Boss',
                bossStats: enemyStats.boss,
                minionStats: enemyStats.standard,
                monsterSuggestions: bossMonsters,
                minionSuggestions: mediumMonsters.slice(0, 2),
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

        // Render monster suggestions with hoverable tooltips
        if (node.monsterSuggestions && node.monsterSuggestions.length > 0) {
            html += `
                <div class="node-stat" style="grid-template-columns: 1fr; padding-top: 10px;">
                    <div class="stat-label-sm">SUGGESTED MONSTERS:</div>
                </div>
            `;
            node.monsterSuggestions.forEach(monster => {
                html += `
                    <div style="padding: 4px 0; font-size: 10px;">
                        • <span class="monster-link" data-monster='${JSON.stringify(monster).replace(/'/g, '&#39;')}'>
                            ${monster.name}
                            <span class="source-badge">[${monster.source || 'MM'}]</span>
                            <div class="tooltip">
                                <div class="tooltip-header">${monster.name}</div>
                                <div class="tooltip-stats">
                                    ${monster.size || 'Medium'} ${monster.type || 'creature'}<br>
                                    <strong>AC:</strong> ${monster.ac} | <strong>HP:</strong> ${monster.hp}<br>
                                    <strong>Speed:</strong> ${monster.speed || '30 ft.'}<br>
                                    <strong>CR:</strong> ${monster.cr}
                                </div>
                                ${monster.traits && monster.traits.length > 0 ?
                                    `<div class="tooltip-abilities">
                                        ${monster.traits[0].name}: ${monster.traits[0].entries[0] ? monster.traits[0].entries[0].substring(0, 100) + '...' : ''}
                                    </div>` : ''}
                            </div>
                        </span>
                    </div>
                `;
            });
        }

        // Render boss suggestions
        if (node.minionSuggestions && node.minionSuggestions.length > 0) {
            html += `
                <div class="node-stat" style="grid-template-columns: 1fr; padding-top: 10px;">
                    <div class="stat-label-sm">MINION OPTIONS:</div>
                </div>
            `;
            node.minionSuggestions.forEach(monster => {
                html += `
                    <div style="padding: 4px 0; font-size: 10px;">
                        • <span class="monster-link" data-monster='${JSON.stringify(monster).replace(/'/g, '&#39;')}'>
                            ${monster.name}
                            <span class="source-badge">[${monster.source || 'MM'}]</span>
                            <div class="tooltip">
                                <div class="tooltip-header">${monster.name}</div>
                                <div class="tooltip-stats">
                                    ${monster.size || 'Medium'} ${monster.type || 'creature'}<br>
                                    <strong>AC:</strong> ${monster.ac} | <strong>HP:</strong> ${monster.hp}<br>
                                    <strong>Speed:</strong> ${monster.speed || '30 ft.'}<br>
                                    <strong>CR:</strong> ${monster.cr}
                                </div>
                            </div>
                        </span>
                    </div>
                `;
            });
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
