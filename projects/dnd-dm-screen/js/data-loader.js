/**
 * Data Loader Module
 * Loads and manages all D&D 5e data from JSON files
 */

class DataLoader {
    constructor() {
        this.data = {
            conditions: [],
            monsters: [],
            spells: [],
            dcTable: null,
            quickRules: null
        };
        this.loaded = false;
    }

    /**
     * Load all data files
     */
    async loadAll() {
        try {
            const [conditions, monsters, spells, dcData] = await Promise.all([
                this.loadJSON('data/conditions.json'),
                this.loadJSON('data/monsters.json'),
                this.loadJSON('data/spells.json'),
                this.loadJSON('data/dc-table.json')
            ]);

            this.data.conditions = conditions.conditions || [];
            this.data.monsters = monsters.monsters || [];
            this.data.spells = spells.spells || [];
            this.data.dcTable = dcData.dcTable || [];
            this.data.damageByLevel = dcData.damageByLevel || [];
            this.data.coverBonuses = dcData.coverBonuses || [];
            this.data.quickRules = dcData.quickRules || {};

            this.loaded = true;
            console.log('✓ All data loaded successfully');
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    /**
     * Load a single JSON file
     */
    async loadJSON(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load ${path}: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Get all data
     */
    getAllData() {
        return this.data;
    }

    /**
     * Search across all data types
     */
    search(query) {
        if (!query || query.trim() === '') {
            return { monsters: [], spells: [], conditions: [] };
        }

        const lowerQuery = query.toLowerCase();

        const results = {
            monsters: this.data.monsters.filter(m =>
                m.name.toLowerCase().includes(lowerQuery) ||
                m.type.toLowerCase().includes(lowerQuery) ||
                m.cr.toString().includes(lowerQuery)
            ),
            spells: this.data.spells.filter(s =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.school.toLowerCase().includes(lowerQuery) ||
                (s.classes && s.classes.some(c => c.toLowerCase().includes(lowerQuery)))
            ),
            conditions: this.data.conditions.filter(c =>
                c.name.toLowerCase().includes(lowerQuery) ||
                c.entries.some(e => e.toLowerCase().includes(lowerQuery))
            )
        };

        return results;
    }

    /**
     * Get a specific monster by name
     */
    getMonster(name) {
        return this.data.monsters.find(m => m.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Get a specific spell by name
     */
    getSpell(name) {
        return this.data.spells.find(s => s.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Get a specific condition by name
     */
    getCondition(name) {
        return this.data.conditions.find(c => c.name.toLowerCase() === name.toLowerCase());
    }

    /**
     * Get all conditions
     */
    getConditions() {
        return this.data.conditions;
    }

    /**
     * Get DC table
     */
    getDCTable() {
        return this.data.dcTable;
    }

    /**
     * Get quick rules
     */
    getQuickRules() {
        return this.data.quickRules;
    }

    /**
     * Get damage by level table
     */
    getDamageByLevel() {
        return this.data.damageByLevel;
    }

    /**
     * Get cover bonuses
     */
    getCoverBonuses() {
        return this.data.coverBonuses;
    }
}

// Create singleton instance
const dataLoader = new DataLoader();

export default dataLoader;
