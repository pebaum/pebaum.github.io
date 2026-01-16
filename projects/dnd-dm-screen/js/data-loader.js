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
        this.loadingError = null;
        this.basePath = this.detectBasePath();
    }

    /**
     * Detect the correct base path for loading data files
     */
    detectBasePath() {
        // Get the current URL
        const url = window.location.href;

        // Check if we're on GitHub Pages
        if (url.includes('github.io')) {
            // For user.github.io repositories, the path is directly from root
            // pebaum.github.io is a user pages site, not a project pages site
            if (url.includes('pebaum.github.io')) {
                // Use absolute path from the domain root
                return '/projects/dnd-dm-screen/';
            }
            // Fallback for different GitHub Pages structure
            return '/projects/dnd-dm-screen/';
        }

        // Check if we're on localhost or local file
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
            // Local development server
            if (url.includes('/projects/dnd-dm-screen/')) {
                return '/projects/dnd-dm-screen/';
            }
            return './';
        }

        // Check if we're running from file:// protocol
        if (url.startsWith('file://')) {
            console.warn('Running from file:// protocol. Some features may not work due to browser security restrictions.');
            return './';
        }

        // Default to relative path
        return './';
    }

    /**
     * Build the correct path for a data file
     */
    buildDataPath(filename) {
        // Remove leading slash from basePath if it exists and we're using relative paths
        let base = this.basePath;
        if (base === './' || base === '') {
            return `data/${filename}`;
        }
        // Ensure basePath ends with /
        if (!base.endsWith('/')) {
            base += '/';
        }
        return `${base}data/${filename}`;
    }

    /**
     * Load all data files
     */
    async loadAll() {
        try {
            // Show loading status
            this.showLoadingStatus('Loading D&D data...');

            const [conditions, monsters, spells, dcData] = await Promise.all([
                this.loadJSON('conditions.json'),
                this.loadJSON('monsters.json'),
                this.loadJSON('spells.json'),
                this.loadJSON('dc-table.json')
            ]);

            this.data.conditions = conditions.conditions || [];
            this.data.monsters = monsters.monsters || [];
            this.data.spells = spells.spells || [];
            this.data.dcTable = dcData.dcTable || [];
            this.data.damageByLevel = dcData.damageByLevel || [];
            this.data.coverBonuses = dcData.coverBonuses || [];
            this.data.quickRules = dcData.quickRules || {};

            this.loaded = true;
            this.loadingError = null;

            // Log success with counts
            console.log('✓ All data loaded successfully');
            console.log(`  - ${this.data.monsters.length} monsters loaded`);
            console.log(`  - ${this.data.spells.length} spells loaded`);
            console.log(`  - ${this.data.conditions.length} conditions loaded`);

            // Show success status
            this.showLoadingStatus(`Data loaded: ${this.data.monsters.length} monsters, ${this.data.spells.length} spells`, true);

            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            this.loadingError = error.message;
            this.showErrorMessage(error);
            throw error;
        }
    }

    /**
     * Load a single JSON file with better error handling
     */
    async loadJSON(filename) {
        const path = this.buildDataPath(filename);
        console.log(`Attempting to load: ${path}`);

        try {
            const response = await fetch(path);
            if (!response.ok) {
                // Try alternative paths if the first one fails
                // First try relative path if we were using absolute
                if (path.startsWith('/')) {
                    const relativePath = `data/${filename}`;
                    console.log(`Trying relative path: ${relativePath}`);
                    const relResponse = await fetch(relativePath);
                    if (relResponse.ok) {
                        console.log(`✓ Loaded via relative path: ${relativePath}`);
                        return await relResponse.json();
                    }
                }
                // Try absolute path if we were using relative
                else {
                    const absolutePath = `/projects/dnd-dm-screen/data/${filename}`;
                    console.log(`Trying absolute path: ${absolutePath}`);
                    const absResponse = await fetch(absolutePath);
                    if (absResponse.ok) {
                        console.log(`✓ Loaded via absolute path: ${absolutePath}`);
                        return await absResponse.json();
                    }
                }
                throw new Error(`Failed to load ${filename}: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log(`✓ Successfully loaded ${filename}`);
            return data;
        } catch (error) {
            // If fetch fails completely (CORS, file://, etc), provide helpful error
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(`Cannot load ${filename}. If running locally, use a web server (e.g., 'python -m http.server' or Live Server in VS Code). Direct file:// access is blocked by browser security.`);
            }
            throw error;
        }
    }

    /**
     * Show loading status to user
     */
    showLoadingStatus(message, success = false) {
        // Try to find or create a status element
        let statusEl = document.getElementById('data-loading-status');
        if (!statusEl) {
            // Create status element if it doesn't exist
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                statusEl = document.createElement('div');
                statusEl.id = 'data-loading-status';
                statusEl.style.cssText = `
                    padding: 8px 12px;
                    margin: 10px 0;
                    border-radius: 4px;
                    font-size: 14px;
                    text-align: center;
                `;
                searchContainer.insertBefore(statusEl, searchContainer.firstChild);
            }
        }

        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.backgroundColor = success ? '#4a5f4e' : '#3a3a4a';
            statusEl.style.color = success ? '#90EE90' : '#ffffff';
            statusEl.style.display = 'block';

            // Auto-hide success messages after 3 seconds
            if (success) {
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 3000);
            }
        }
    }

    /**
     * Show error message to user
     */
    showErrorMessage(error) {
        let message = 'Failed to load data. ';

        if (error.message.includes('file://')) {
            message += 'Please run this from a web server, not directly from the file system.';
        } else if (error.message.includes('404')) {
            message += 'Data files not found. Check that all JSON files are in the data/ folder.';
        } else {
            message += error.message;
        }

        this.showLoadingStatus(message, false);

        // Also update search input placeholder
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = 'Search unavailable - data failed to load';
            searchInput.disabled = true;
        }
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
