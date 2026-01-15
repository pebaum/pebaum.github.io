/**
 * Reference Viewer Module
 * Displays conditions, DC table, and other reference information
 */

import dataLoader from './data-loader.js';

class ReferenceViewer {
    constructor() {
        this.dcTableContainer = null;
        this.quickRulesContainer = null;
        this.conditionsContainer = null;
        this.modal = null;
        this.modalBody = null;
        this.closeModalButton = null;
    }

    /**
     * Initialize the reference viewer
     */
    init() {
        this.dcTableContainer = document.getElementById('dcTable');
        this.quickRulesContainer = document.getElementById('quickRules');
        this.conditionsContainer = document.getElementById('conditionsList');
        this.modal = document.getElementById('detailModal');
        this.modalBody = document.getElementById('modalBody');
        this.closeModalButton = document.getElementById('closeModal');

        if (!this.dcTableContainer || !this.conditionsContainer) {
            console.error('Reference containers not found');
            return;
        }

        // Render reference data
        this.renderDCTable();
        this.renderQuickRules();
        this.renderConditions();

        // Bind modal close
        this.closeModalButton.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });

        console.log('✓ Reference viewer initialized');
    }

    /**
     * Render DC difficulty table
     */
    renderDCTable() {
        const dcTable = dataLoader.getDCTable();
        if (!dcTable || dcTable.length === 0) return;

        let html = '';
        dcTable.forEach(row => {
            html += `
                <div class="dc-row">
                    <div class="dc-difficulty">${row.difficulty}</div>
                    <div class="dc-value">DC ${row.dc}</div>
                </div>
            `;
        });

        this.dcTableContainer.innerHTML = html;
    }

    /**
     * Render quick rules reference
     */
    renderQuickRules() {
        const quickRules = dataLoader.getQuickRules();
        if (!quickRules || Object.keys(quickRules).length === 0) return;

        let html = '';
        for (const [key, value] of Object.entries(quickRules)) {
            const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
            html += `
                <div class="rule-item">
                    <div class="rule-label">${label}</div>
                    <div class="rule-value">${value}</div>
                </div>
            `;
        }

        this.quickRulesContainer.innerHTML = html;
    }

    /**
     * Render conditions list
     */
    renderConditions() {
        const conditions = dataLoader.getConditions();
        if (!conditions || conditions.length === 0) return;

        let html = '';
        conditions.forEach(condition => {
            const preview = condition.entries[0].substring(0, 60) + '...';
            html += `
                <div class="condition-card" data-name="${condition.name}">
                    <div class="condition-name">${condition.name}</div>
                    <div class="condition-preview">${preview}</div>
                </div>
            `;
        });

        this.conditionsContainer.innerHTML = html;

        // Bind condition card clicks
        this.conditionsContainer.querySelectorAll('.condition-card').forEach(card => {
            card.addEventListener('click', () => {
                const name = card.dataset.name;
                const condition = dataLoader.getCondition(name);
                this.showConditionModal(condition);
            });
        });
    }

    /**
     * Show condition in modal
     */
    showConditionModal(condition) {
        if (!condition) return;

        let html = `
            <div class="modal-title">${condition.name}</div>
        `;

        condition.entries.forEach(entry => {
            html += `<div class="modal-text">${entry}</div>`;
        });

        if (condition.source) {
            html += `<div class="modal-text" style="opacity: 0.3; margin-top: 20px;">Source: ${condition.source}</div>`;
        }

        this.modalBody.innerHTML = html;
        this.showModal();
    }

    /**
     * Show monster in modal
     */
    showMonsterModal(monster) {
        if (!monster) return;

        const strMod = Math.floor((monster.str - 10) / 2);
        const dexMod = Math.floor((monster.dex - 10) / 2);
        const conMod = Math.floor((monster.con - 10) / 2);
        const intMod = Math.floor((monster.int - 10) / 2);
        const wisMod = Math.floor((monster.wis - 10) / 2);
        const chaMod = Math.floor((monster.cha - 10) / 2);

        let html = `
            <div class="modal-title">${monster.name}</div>
            <div class="modal-section">
                <div class="modal-text">
                    ${monster.size} ${monster.type}, ${monster.alignment}<br>
                    <strong>AC:</strong> ${monster.ac} | <strong>HP:</strong> ${monster.hp} (${monster.hd}) | <strong>Speed:</strong> ${monster.speed}
                </div>
            </div>

            <div class="stat-block">
                <div class="stat-item">
                    <div class="stat-label">STR</div>
                    <div class="stat-value">${monster.str} (${strMod >= 0 ? '+' : ''}${strMod})</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">DEX</div>
                    <div class="stat-value">${monster.dex} (${dexMod >= 0 ? '+' : ''}${dexMod})</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">CON</div>
                    <div class="stat-value">${monster.con} (${conMod >= 0 ? '+' : ''}${conMod})</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">INT</div>
                    <div class="stat-value">${monster.int} (${intMod >= 0 ? '+' : ''}${intMod})</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">WIS</div>
                    <div class="stat-value">${monster.wis} (${wisMod >= 0 ? '+' : ''}${wisMod})</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">CHA</div>
                    <div class="stat-value">${monster.cha} (${chaMod >= 0 ? '+' : ''}${chaMod})</div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-text"><strong>CR:</strong> ${monster.cr}</div>
                ${monster.vulnerabilities ? `<div class="modal-text"><strong>Vulnerabilities:</strong> ${monster.vulnerabilities}</div>` : ''}
                ${monster.immunities ? `<div class="modal-text"><strong>Immunities:</strong> ${monster.immunities}</div>` : ''}
            </div>
        `;

        if (monster.traits && monster.traits.length > 0) {
            html += '<div class="modal-section"><div class="modal-section-title">TRAITS</div>';
            monster.traits.forEach(trait => {
                html += `
                    <div class="trait-item">
                        <div class="trait-name">${trait.name}</div>
                        ${trait.entries.map(e => `<div class="trait-text">${e}</div>`).join('')}
                    </div>
                `;
            });
            html += '</div>';
        }

        if (monster.actions && monster.actions.length > 0) {
            html += '<div class="modal-section"><div class="modal-section-title">ACTIONS</div>';
            monster.actions.forEach(action => {
                html += `
                    <div class="trait-item">
                        <div class="trait-name">${action.name}</div>
                        ${action.entries.map(e => `<div class="trait-text">${e}</div>`).join('')}
                    </div>
                `;
            });
            html += '</div>';
        }

        this.modalBody.innerHTML = html;
        this.showModal();
    }

    /**
     * Show spell in modal
     */
    showSpellModal(spell) {
        if (!spell) return;

        const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;

        let html = `
            <div class="modal-title">${spell.name}</div>
            <div class="modal-section">
                <div class="modal-text">
                    <strong>${levelText} ${spell.school}</strong>
                </div>
                <div class="modal-text">
                    <strong>Casting Time:</strong> ${spell.castingTime}<br>
                    <strong>Range:</strong> ${spell.range}<br>
                    <strong>Components:</strong> ${spell.components}<br>
                    <strong>Duration:</strong> ${spell.duration}
                </div>
                ${spell.classes ? `<div class="modal-text"><strong>Classes:</strong> ${spell.classes.join(', ')}</div>` : ''}
            </div>

            <div class="modal-section">
                <div class="modal-section-title">DESCRIPTION</div>
                ${spell.entries.map(e => `<div class="modal-text">${e}</div>`).join('')}
            </div>
        `;

        this.modalBody.innerHTML = html;
        this.showModal();
    }

    /**
     * Show modal
     */
    showModal() {
        this.modal.classList.remove('hidden');
    }

    /**
     * Close modal
     */
    closeModal() {
        this.modal.classList.add('hidden');
    }
}

// Create singleton instance
const referenceViewer = new ReferenceViewer();

export default referenceViewer;
