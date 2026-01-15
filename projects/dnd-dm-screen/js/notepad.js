/**
 * Notepad Module
 * Handles note-taking with auto-save to localStorage
 */

class Notepad {
    constructor() {
        this.textarea = null;
        this.clearButton = null;
        this.saveTimeout = null;
    }

    /**
     * Initialize the notepad
     */
    init() {
        this.textarea = document.getElementById('notepad');
        this.clearButton = document.getElementById('clearNotes');

        if (!this.textarea) {
            console.error('Notepad textarea not found');
            return;
        }

        // Load saved notes
        this.loadNotes();

        // Auto-save on input (debounced)
        this.textarea.addEventListener('input', () => this.handleInput());

        // Clear button
        this.clearButton.addEventListener('click', () => this.clearNotes());

        console.log('✓ Notepad initialized');
    }

    /**
     * Handle input with auto-save debouncing
     */
    handleInput() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveNotes();
        }, 500);
    }

    /**
     * Save notes to localStorage
     */
    saveNotes() {
        const content = this.textarea.value;
        localStorage.setItem('dnd-notes', content);
    }

    /**
     * Load notes from localStorage
     */
    loadNotes() {
        const saved = localStorage.getItem('dnd-notes');
        if (saved) {
            this.textarea.value = saved;
        }
    }

    /**
     * Clear all notes
     */
    clearNotes() {
        if (this.textarea.value.trim() === '') return;
        if (confirm('Clear all notes?')) {
            this.textarea.value = '';
            this.saveNotes();
        }
    }
}

// Create singleton instance
const notepad = new Notepad();

export default notepad;
