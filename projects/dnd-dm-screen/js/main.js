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
            this.showInitStatus('Initializing D&D DM Screen...', 'loading');

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

            // Show success with data counts
            const data = dataLoader.getAllData();
            this.showInitStatus(
                `DM Screen Ready! ${data.monsters.length} monsters, ${data.spells.length} spells loaded`,
                'success'
            );

            // Make available for debugging
            window.dmScreen = this;
            window.dataLoader = dataLoader;
            window.initiativeTracker = initiativeTracker;
            window.diceRoller = diceRoller;
            window.sessionMaker = sessionMaker;

        } catch (error) {
            console.error('Failed to initialize DM Screen:', error);

            // Show detailed error message
            let errorMessage = 'Failed to load DM Screen. ';

            if (error.message.includes('file://')) {
                errorMessage += 'The page must be served from a web server, not opened directly as a file. Use a local server like Live Server in VS Code or python -m http.server.';
            } else if (error.message.includes('404') || error.message.includes('Failed to load')) {
                errorMessage += 'Could not find data files. Ensure all JSON files are in the data/ folder.';
            } else {
                errorMessage += error.message;
            }

            this.showInitStatus(errorMessage, 'error');

            // Disable search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.placeholder = 'Search disabled - data failed to load';
            }
        }
    }

    /**
     * Show initialization status message
     */
    showInitStatus(message, type = 'info') {
        // Create or find status container
        let statusContainer = document.getElementById('init-status-container');
        if (!statusContainer) {
            // Create container at top of page
            statusContainer = document.createElement('div');
            statusContainer.id = 'init-status-container';
            statusContainer.style.cssText = `
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                max-width: 80%;
                text-align: center;
            `;
            document.body.appendChild(statusContainer);
        }

        // Set content and style based on type
        statusContainer.textContent = message;
        statusContainer.style.display = 'block';

        switch(type) {
            case 'loading':
                statusContainer.style.backgroundColor = '#3a3a4a';
                statusContainer.style.color = '#ffffff';
                break;
            case 'success':
                statusContainer.style.backgroundColor = '#4a5f4e';
                statusContainer.style.color = '#90EE90';
                // Auto-hide success messages
                setTimeout(() => {
                    statusContainer.style.display = 'none';
                }, 4000);
                break;
            case 'error':
                statusContainer.style.backgroundColor = '#5f4a4a';
                statusContainer.style.color = '#ff9090';
                break;
            default:
                statusContainer.style.backgroundColor = '#3a3a4a';
                statusContainer.style.color = '#ffffff';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new DMScreen();
    await app.init();
});
