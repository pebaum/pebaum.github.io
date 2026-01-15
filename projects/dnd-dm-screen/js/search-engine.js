/**
 * Search Engine Module
 * Handles universal search across all D&D data
 */

import dataLoader from './data-loader.js';

class SearchEngine {
    constructor() {
        this.searchInput = null;
        this.searchResults = null;
        this.debounceTimer = null;
        this.onMonsterSelect = null;
        this.onSpellSelect = null;
        this.onConditionSelect = null;
    }

    /**
     * Initialize search functionality
     */
    init() {
        this.searchInput = document.getElementById('globalSearch');
        this.searchResults = document.getElementById('searchResults');

        if (!this.searchInput || !this.searchResults) {
            console.error('Search elements not found');
            return;
        }

        // Bind events
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.searchInput.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Focus search with '/' key
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== this.searchInput) {
                e.preventDefault();
                this.searchInput.focus();
            }
        });

        // Close search results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                this.hideResults();
            }
        });

        console.log('✓ Search engine initialized');
    }

    /**
     * Handle search input with debouncing
     */
    handleSearch(query) {
        clearTimeout(this.debounceTimer);

        if (!query || query.trim() === '') {
            this.hideResults();
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, 200);
    }

    /**
     * Perform the actual search
     */
    performSearch(query) {
        const results = dataLoader.search(query);
        this.displayResults(results, query);
    }

    /**
     * Display search results
     */
    displayResults(results, query) {
        const totalResults = results.monsters.length + results.spells.length + results.conditions.length;

        if (totalResults === 0) {
            this.searchResults.innerHTML = `
                <div class="search-category">
                    <div class="empty-state">NO RESULTS FOUND FOR "${query}"</div>
                </div>
            `;
            this.showResults();
            return;
        }

        let html = '';

        // Monsters
        if (results.monsters.length > 0) {
            html += '<div class="search-category">';
            html += '<div class="category-title">MONSTERS</div>';
            results.monsters.slice(0, 5).forEach(monster => {
                html += this.createMonsterResultItem(monster);
            });
            if (results.monsters.length > 5) {
                html += `<div class="result-meta" style="padding: 10px; text-align: center;">+${results.monsters.length - 5} more...</div>`;
            }
            html += '</div>';
        }

        // Spells
        if (results.spells.length > 0) {
            html += '<div class="search-category">';
            html += '<div class="category-title">SPELLS</div>';
            results.spells.slice(0, 5).forEach(spell => {
                html += this.createSpellResultItem(spell);
            });
            if (results.spells.length > 5) {
                html += `<div class="result-meta" style="padding: 10px; text-align: center;">+${results.spells.length - 5} more...</div>`;
            }
            html += '</div>';
        }

        // Conditions
        if (results.conditions.length > 0) {
            html += '<div class="search-category">';
            html += '<div class="category-title">CONDITIONS</div>';
            results.conditions.slice(0, 5).forEach(condition => {
                html += this.createConditionResultItem(condition);
            });
            if (results.conditions.length > 5) {
                html += `<div class="result-meta" style="padding: 10px; text-align: center;">+${results.conditions.length - 5} more...</div>`;
            }
            html += '</div>';
        }

        this.searchResults.innerHTML = html;
        this.bindResultClicks();
        this.showResults();
    }

    /**
     * Create HTML for monster result item
     */
    createMonsterResultItem(monster) {
        return `
            <div class="result-item" data-type="monster" data-name="${monster.name}">
                <div class="result-name">${monster.name}</div>
                <div class="result-meta">
                    ${monster.size} ${monster.type} | CR ${monster.cr} | AC ${monster.ac} | HP ${monster.hp}
                </div>
            </div>
        `;
    }

    /**
     * Create HTML for spell result item
     */
    createSpellResultItem(spell) {
        const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
        return `
            <div class="result-item" data-type="spell" data-name="${spell.name}">
                <div class="result-name">${spell.name}</div>
                <div class="result-meta">
                    ${levelText} ${spell.school} | ${spell.castingTime} | ${spell.range}
                </div>
            </div>
        `;
    }

    /**
     * Create HTML for condition result item
     */
    createConditionResultItem(condition) {
        const preview = condition.entries[0].substring(0, 80) + '...';
        return `
            <div class="result-item" data-type="condition" data-name="${condition.name}">
                <div class="result-name">${condition.name}</div>
                <div class="result-meta">${preview}</div>
            </div>
        `;
    }

    /**
     * Bind click events to result items
     */
    bindResultClicks() {
        const items = this.searchResults.querySelectorAll('.result-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const name = item.dataset.name;
                this.handleResultClick(type, name);
            });
        });
    }

    /**
     * Handle clicking on a search result
     */
    handleResultClick(type, name) {
        if (type === 'monster' && this.onMonsterSelect) {
            const monster = dataLoader.getMonster(name);
            this.onMonsterSelect(monster);
        } else if (type === 'spell' && this.onSpellSelect) {
            const spell = dataLoader.getSpell(name);
            this.onSpellSelect(spell);
        } else if (type === 'condition' && this.onConditionSelect) {
            const condition = dataLoader.getCondition(name);
            this.onConditionSelect(condition);
        }

        this.hideResults();
        this.searchInput.value = '';
    }

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        if (e.key === 'Escape') {
            this.hideResults();
            this.searchInput.blur();
        }
    }

    /**
     * Show search results
     */
    showResults() {
        this.searchResults.classList.remove('hidden');
    }

    /**
     * Hide search results
     */
    hideResults() {
        this.searchResults.classList.add('hidden');
    }

    /**
     * Set callback for monster selection
     */
    setOnMonsterSelect(callback) {
        this.onMonsterSelect = callback;
    }

    /**
     * Set callback for spell selection
     */
    setOnSpellSelect(callback) {
        this.onSpellSelect = callback;
    }

    /**
     * Set callback for condition selection
     */
    setOnConditionSelect(callback) {
        this.onConditionSelect = callback;
    }
}

// Create singleton instance
const searchEngine = new SearchEngine();

export default searchEngine;
