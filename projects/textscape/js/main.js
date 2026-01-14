/**
 * Main Application - Textscape (Continuous Generation)
 *
 * Coordinates all modules for continuous ambient music generation
 */

class TextscapeApp {
    constructor() {
        this.continuousEngine = new ContinuousEngine(audioEngine);
        this.currentParams = null;
        this.currentText = '';
        this.updateInterval = null;

        this.initializeUI();
        this.setupEventListeners();
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // Status elements
        this.playbackSection = document.getElementById('playbackSection');
        this.statusText = document.getElementById('statusText');
        this.timeDisplay = document.getElementById('timeDisplay');

        // Visualization elements
        this.visualizer = document.getElementById('visualizer');

        // Associations and analysis
        this.associationsSection = document.getElementById('associationsSection');
        this.associationsTree = document.getElementById('associationsTree');
        this.analysisSection = document.getElementById('analysisSection');
        this.paramGrid = document.getElementById('paramGrid');

        // Initialize visualizer canvas
        this.setupVisualizer();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Generate button - starts continuous generation
        this.generateBtn.addEventListener('click', () => this.generateMusic());

        // Stop button
        this.stopBtn.addEventListener('click', () => this.stop());
    }

    /**
     * Generate continuous music from text
     */
    async generateMusic() {
        const text = this.textInput.value.trim();

        if (!text) {
            alert('Please enter some text first!');
            return;
        }

        this.currentText = text;

        this.generateBtn.disabled = true;
        this.generateBtn.textContent = 'Analyzing text...';

        try {
            // Map text to musical parameters (always multi-cultural, no user bias)
            this.currentParams = ParameterMapper.mapTextToMusic(text, 'multicultural', {});

            console.log('Musical parameters:', this.currentParams);

            // Show UI
            this.playbackSection.style.display = 'block';
            this.associationsSection.style.display = 'block';
            this.analysisSection.style.display = 'block';

            // Display associations
            this.displayAssociations(this.currentParams, text);

            // Display parameters
            this.displayParameters(this.currentParams);

            // Start continuous generation
            this.generateBtn.style.display = 'none';
            this.stopBtn.style.display = 'block';

            await this.continuousEngine.start(this.currentParams);

            this.statusText.textContent = 'Generating ambient music...';

            // Start updating time display
            this.startTimeUpdates();

        } catch (error) {
            console.error('Error generating music:', error);
            alert('Error generating music. Please try again.');
            this.generateBtn.textContent = 'Generate Ambient Music';
            this.generateBtn.disabled = false;
        }
    }

    /**
     * Stop continuous generation
     */
    stop() {
        this.continuousEngine.stop();

        this.stopTimeUpdates();

        this.generateBtn.style.display = 'block';
        this.stopBtn.style.display = 'none';
        this.generateBtn.disabled = false;

        this.statusText.textContent = 'Stopped';
    }

    /**
     * Start time display updates
     */
    startTimeUpdates() {
        this.updateInterval = setInterval(() => {
            const elapsed = this.continuousEngine.getElapsedTime();
            this.timeDisplay.textContent = this.formatTime(elapsed);
            this.updateVisualizer(elapsed);
        }, 100);
    }

    /**
     * Stop time updates
     */
    stopTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Display hierarchical associations
     */
    displayAssociations(params, text) {
        const {mood, tension, density, tempo, scale, scaleName, voiceWeights, activeVoices, effects, analyses} = params;

        let html = '';

        // Global Musical Parameters
        html += this.createCategory('Global Musical Parameters', [
            { label: 'Mood', value: this.formatValue(mood), detail: `${mood > 0 ? 'Bright' : 'Dark'} (${mood > 0 ? '+' : ''}${mood.toFixed(2)})` },
            { label: 'Tension', value: this.formatValue(tension), detail: tension > 0.6 ? 'High intensity' : 'Calm atmosphere' },
            { label: 'Density', value: this.formatValue(density), detail: `${(density * 100).toFixed(0)}% note probability` },
            { label: 'Tempo', value: `${tempo.toFixed(2)}x`, detail: tempo > 1 ? 'Faster than base' : 'Slower than base' }
        ]);

        // Scale Selection
        html += this.createCategory('Scale & Harmony', [
            { label: 'Scale', value: scaleName, detail: scale.description || '' },
            { label: 'Cultural Origin', value: scale.culture || 'Multicultural' },
            { label: 'Root Note', value: this.midiToNoteName(params.rootNote) }
        ]);

        // Active Voices
        const voiceList = activeVoices.map(v => {
            const weight = voiceWeights[`${v}Weight`];
            return { voice: v, weight: weight ? weight.toFixed(2) : '0.00' };
        });

        html += '<div class="assoc-category">';
        html += '<div class="assoc-header">▸ Active Voices</div>';
        for (const { voice, weight } of voiceList) {
            html += `<div class="assoc-item">`;
            html += `<span class="assoc-label">${voice}:</span> `;
            html += `<span class="assoc-value">weight ${weight}</span>`;
            html += `</div>`;
        }
        html += '</div>';

        // Word Associations
        const wordCats = analyses.sentiment.detectedEmotions;
        if (wordCats && wordCats.length > 0) {
            html += '<div class="assoc-category">';
            html += '<div class="assoc-header">▸ Detected Emotions</div>';
            for (const emotion of wordCats.slice(0, 5)) {
                html += `<div class="assoc-item">`;
                html += `<span class="assoc-value">${emotion.emotion}</span>`;
                if (emotion.description) {
                    html += `<div class="assoc-detail">${emotion.description}</div>`;
                }
                html += `</div>`;
            }
            html += '</div>';
        }

        // Detected Word Categories
        const categories = params.analyses.wordCategories;
        if (categories) {
            const catNames = ['temporal', 'spatial', 'textural', 'colors', 'nature', 'abstract'];

            for (const catName of catNames) {
                const words = categories[catName];
                if (words && words.length > 0) {
                    html += '<div class="assoc-category">';
                    html += `<div class="assoc-header">▸ ${catName.charAt(0).toUpperCase() + catName.slice(1)} Words</div>`;

                    for (const wordData of words.slice(0, 5)) {
                        html += `<div class="assoc-item">`;
                        html += `<span class="assoc-value">"${wordData.word}"</span>`;

                        // Show mapped parameters
                        const params = wordData.params;
                        const paramKeys = Object.keys(params).slice(0, 3);
                        for (const key of paramKeys) {
                            html += `<div class="assoc-subitem">${key}: ${this.formatParamValue(params[key])}</div>`;
                        }

                        html += `</div>`;
                    }

                    html += '</div>';
                }
            }
        }

        // Effects Settings
        html += this.createCategory('Effects & Timbre', [
            { label: 'Reverb Size', value: effects.reverbSize, detail: 'Spatial depth' },
            { label: 'Reverb Mix', value: `${(effects.reverbMix * 100).toFixed(0)}%` },
            { label: 'Delay Time', value: `${(effects.delayTime * 1000).toFixed(0)}ms` },
            { label: 'Low-Pass Filter', value: `${(effects.lowPass * 100).toFixed(0)}%`, detail: 'Brightness' }
        ]);

        // Structural Analysis
        if (analyses.structural) {
            const struct = analyses.structural;
            html += this.createCategory('Text Structure', [
                { label: 'Sentences', value: struct.sentenceCount },
                { label: 'Paragraphs', value: struct.paragraphCount },
                { label: 'Avg Sentence Length', value: `${struct.averageSentenceLength.toFixed(1)} words` },
                { label: 'Narrative Arc', value: struct.structure.arc, detail: struct.structure.type }
            ]);
        }

        this.associationsTree.innerHTML = html;
    }

    /**
     * Create a category section
     */
    createCategory(title, items) {
        let html = '<div class="assoc-category">';
        html += `<div class="assoc-header">▸ ${title}</div>`;

        for (const item of items) {
            html += '<div class="assoc-item">';
            html += `<span class="assoc-label">${item.label}:</span> `;
            html += `<span class="assoc-value">${item.value}</span>`;

            if (item.detail) {
                html += `<div class="assoc-detail">${item.detail}</div>`;
            }

            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Format a numeric value
     */
    formatValue(val) {
        if (typeof val === 'number') {
            return val.toFixed(2);
        }
        return val;
    }

    /**
     * Format parameter value for display
     */
    formatParamValue(val) {
        if (typeof val === 'number') {
            return val.toFixed(2);
        }
        if (typeof val === 'boolean') {
            return val ? 'yes' : 'no';
        }
        return String(val);
    }

    /**
     * Display musical parameters
     */
    displayParameters(params) {
        const parameters = [
            { label: 'Mood', value: params.mood.toFixed(2), description: params.mood > 0 ? 'Bright' : 'Dark' },
            { label: 'Tension', value: params.tension.toFixed(2), description: params.tension > 0.6 ? 'High' : 'Low' },
            { label: 'Density', value: params.density.toFixed(2), description: params.density > 0.6 ? 'Dense' : 'Sparse' },
            { label: 'Tempo', value: params.tempo.toFixed(2), description: params.tempo > 1 ? 'Fast' : 'Slow' },
            { label: 'Scale', value: params.scaleName, description: params.scale.culture },
            { label: 'Root Note', value: this.midiToNoteName(params.rootNote), description: '' },
            { label: 'Active Voices', value: params.activeVoices.length, description: params.activeVoices.join(', ') }
        ];

        this.paramGrid.innerHTML = parameters.map(p => `
            <div class="param-item">
                <div class="param-label">${p.label}</div>
                <div class="param-value">${p.value}</div>
                ${p.description ? `<div style="font-size: 0.8em; color: #888; margin-top: 4px;">${p.description}</div>` : ''}
            </div>
        `).join('');
    }

    /**
     * Setup visualizer canvas
     */
    setupVisualizer() {
        this.vizCtx = this.visualizer.getContext('2d');
        this.resizeVisualizer();

        window.addEventListener('resize', () => this.resizeVisualizer());
    }

    /**
     * Resize visualizer canvas
     */
    resizeVisualizer() {
        const rect = this.visualizer.getBoundingClientRect();
        this.visualizer.width = rect.width;
        this.visualizer.height = rect.height;
    }

    /**
     * Update visualizer
     */
    updateVisualizer(elapsed) {
        const ctx = this.vizCtx;
        const width = this.visualizer.width;
        const height = this.visualizer.height;

        // Clear canvas with fade
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        if (!this.currentParams) return;

        const { mood, tension, density } = this.currentParams;
        const t = (elapsed / 10000) % 1; // Normalized time

        // Draw flowing waveforms
        ctx.strokeStyle = `rgba(102, 126, 234, ${0.3 + density * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
            const normalX = x / width;
            const y = height / 2 +
                Math.sin((normalX + t) * Math.PI * 4) * (20 + tension * 40) * Math.sin(t * Math.PI * 2) +
                Math.sin((normalX * 2 + t * 2) * Math.PI * 3) * (10 + density * 20);

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Additional layer for mood
        ctx.strokeStyle = `rgba(118, 75, 162, ${0.2 + Math.abs(mood) * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let x = 0; x < width; x++) {
            const normalX = x / width;
            const y = height / 2 +
                Math.sin((normalX * 3 - t) * Math.PI * 2) * (15 + Math.abs(mood) * 30);

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    /**
     * Format time for display (mm:ss)
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Convert MIDI note to note name
     */
    midiToNoteName(midi) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octave = Math.floor(midi / 12) - 1;
        const note = notes[midi % 12];
        return `${note}${octave}`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Try to load cached sentiment library for enhanced analysis
    await SentimentAnalyzer.loadCachedLibrary();

    window.textscapeApp = new TextscapeApp();
    console.log('Textscape (Continuous) initialized!');
});
