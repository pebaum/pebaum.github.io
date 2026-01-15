/**
 * D&D 5e DM Screen
 * Main application controller
 */

import dataLoader from './data-loader.js';
import searchEngine from './search-engine.js';
import initiativeTracker from './initiative-tracker.js';
import diceRoller from './dice-roller.js';
import notepad from './notepad.js';
import referenceViewer from './reference-viewer.js';
import sessionMaker from './session-maker.js';

class DMScreen {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing D&D DM Screen...');

            // Load all data first
            await dataLoader.loadAll();

            // Initialize all modules
            searchEngine.init();
            initiativeTracker.init();
            diceRoller.init();
            notepad.init();
            referenceViewer.init();
            sessionMaker.init();

            // Connect search engine to other modules
            searchEngine.setOnMonsterSelect((monster) => {
                referenceViewer.showMonsterModal(monster);
                // Also offer to add to initiative
                if (confirm(`Add ${monster.name} to initiative tracker?`)) {
                    initiativeTracker.addMonster(monster);
                }
            });

            searchEngine.setOnSpellSelect((spell) => {
                referenceViewer.showSpellModal(spell);
            });

            searchEngine.setOnConditionSelect((condition) => {
                referenceViewer.showConditionModal(condition);
            });

            this.initialized = true;
            console.log('✓ D&D DM Screen ready');

            // Make available for debugging
            window.dmScreen = this;
            window.dataLoader = dataLoader;
            window.initiativeTracker = initiativeTracker;
            window.diceRoller = diceRoller;
            window.sessionMaker = sessionMaker;

        } catch (error) {
            console.error('Failed to initialize DM Screen:', error);
            alert('Failed to load DM Screen. Please refresh the page.');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DMScreen();
    await app.init();
});
