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

            // Display key and mode in status
            const keyInfo = this.currentParams.tonalCenter ?
                `${this.currentParams.tonalCenter.globalKeyName} ${this.currentParams.tonalCenter.globalModeName}` :
                `${this.midiToNoteName(this.currentParams.rootNote)} ${this.currentParams.scaleName}`;

            this.statusText.textContent = `Playing in ${keyInfo}`;

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
     * Display hierarchical decision tree - shows how all music was determined
     */
    displayAssociations(params, text) {
        const {mood, tension, density, tempo, scale, scaleName, voiceWeights, activeVoices, effects, analyses, tonalCenter} = params;

        let html = '';

        // Title
        html += '<div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">';
        html += '<div style="font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; opacity: 0.5; margin-bottom: 10px;">Decision tree showing how text → music</div>';
        html += '</div>';

        // ROOT: Tonal Center (Most Important - Always Expanded)
        if (tonalCenter) {
            html += this.createTreeNode({
                id: 'tonal-center',
                label: '🎵 Global Tonal Center',
                value: `${tonalCenter.globalKeyName} ${tonalCenter.globalModeName}`,
                expanded: true,
                highlight: true,
                children: [
                    {
                        label: 'Root Note',
                        value: tonalCenter.globalKeyName,
                        detail: `MIDI ${tonalCenter.globalKey} - locked for entire piece`
                    },
                    {
                        label: 'Mode/Scale',
                        value: tonalCenter.globalModeName,
                        detail: scale.description || ''
                    },
                    {
                        label: 'Cultural Origin',
                        value: scale.culture || 'multicultural',
                        detail: ''
                    },
                    {
                        id: 'compound-metrics',
                        label: 'Compound Metrics',
                        expanded: true,
                        children: [
                            {
                                label: 'Valence (mood)',
                                value: tonalCenter.compoundMetrics.valence.toFixed(3),
                                detail: `${tonalCenter.compoundMetrics.valence > 0.5 ? 'Positive' : tonalCenter.compoundMetrics.valence < 0.5 ? 'Negative' : 'Neutral'} - weighted avg of all words`
                            },
                            {
                                label: 'Arousal (energy)',
                                value: tonalCenter.compoundMetrics.arousal.toFixed(3),
                                detail: `${tonalCenter.compoundMetrics.arousal > 0.6 ? 'High energy' : tonalCenter.compoundMetrics.arousal < 0.4 ? 'Low energy' : 'Moderate'}`
                            },
                            {
                                label: 'Dominance (presence)',
                                value: tonalCenter.compoundMetrics.dominance.toFixed(3),
                                detail: `${tonalCenter.compoundMetrics.dominance > 0.6 ? 'Strong presence' : tonalCenter.compoundMetrics.dominance < 0.4 ? 'Subtle' : 'Balanced'}`
                            },
                            {
                                label: 'Tension (calculated)',
                                value: tonalCenter.compoundMetrics.tension.toFixed(3),
                                detail: 'From arousal + |valence|'
                            }
                        ]
                    },
                    {
                        id: 'word-analysis',
                        label: 'Word Analysis Profile',
                        expanded: false,
                        children: [
                            {
                                label: 'Total words analyzed',
                                value: tonalCenter.tonalProfile.totalWords
                            },
                            {
                                label: 'Words with VAD data',
                                value: tonalCenter.tonalProfile.wordsWithVAD
                            },
                            {
                                label: 'Content words',
                                value: tonalCenter.tonalProfile.contentWords,
                                detail: 'Nouns, verbs, adjectives (weight 1.0)'
                            },
                            {
                                label: 'Function words',
                                value: tonalCenter.tonalProfile.functionWords,
                                detail: 'The, and, of, etc. (weight 0.1)'
                            }
                        ]
                    }
                ]
            });
        }

        // Global Musical Parameters
        html += this.createTreeNode({
            id: 'global-params',
            label: 'Global Musical Parameters',
            expanded: true,
            children: [
                {
                    label: 'Mood',
                    value: mood.toFixed(3),
                    detail: `${mood > 0 ? 'Bright/Positive' : 'Dark/Negative'} (${mood > 0 ? '+' : ''}${mood.toFixed(2)})`
                },
                {
                    label: 'Tension',
                    value: tension.toFixed(3),
                    detail: tension > 0.6 ? 'High intensity' : tension < 0.3 ? 'Very calm' : 'Moderate'
                },
                {
                    label: 'Density',
                    value: density.toFixed(3),
                    detail: `${(density * 100).toFixed(0)}% note probability - ${density > 0.6 ? 'dense' : density < 0.3 ? 'sparse' : 'moderate'}`
                },
                {
                    label: 'Tempo',
                    value: `${tempo.toFixed(2)}x`,
                    detail: tempo > 1.2 ? 'Very fast' : tempo > 1 ? 'Faster than base' : tempo < 0.6 ? 'Very slow' : 'Slower than base'
                }
            ]
        });

        // Active Voices (what's playing)
        html += this.createTreeNode({
            id: 'active-voices',
            label: 'Active Voice Types',
            value: `${activeVoices.length} voices`,
            expanded: false,
            children: activeVoices.map(v => ({
                label: v,
                value: `weight ${voiceWeights[`${v}Weight`]?.toFixed(2) || '0.00'}`,
                detail: this.getVoiceDescription(v)
            }))
        });

        // Text Analysis Sources
        if (analyses) {
            // Detected Emotions
            const detectedEmotions = analyses.sentiment?.detectedEmotions || [];
            if (detectedEmotions.length > 0) {
                html += this.createTreeNode({
                    id: 'detected-emotions',
                    label: 'Detected Emotions',
                    value: `${detectedEmotions.length} emotions`,
                    expanded: false,
                    children: detectedEmotions.slice(0, 8).map(em => ({
                        label: em.emotion,
                        value: '',
                        detail: em.description || ''
                    }))
                });
            }

            // Word Categories with Musical Effects
            const categories = analyses.wordCategories;
            if (categories) {
                const catNames = ['temporal', 'spatial', 'textural', 'colors', 'nature', 'abstract'];
                const categoriesWithWords = catNames.filter(cat => categories[cat] && categories[cat].length > 0);

                if (categoriesWithWords.length > 0) {
                    html += this.createTreeNode({
                        id: 'word-categories',
                        label: 'Special Word Categories',
                        value: `${categoriesWithWords.length} categories`,
                        expanded: false,
                        children: categoriesWithWords.map(catName => {
                            const words = categories[catName];
                            return {
                                id: `cat-${catName}`,
                                label: catName.charAt(0).toUpperCase() + catName.slice(1),
                                value: `${words.length} words`,
                                expanded: false,
                                children: words.slice(0, 5).map(wordData => {
                                    const wordParams = wordData.params;
                                    const paramsList = Object.keys(wordParams).slice(0, 3).map(key => {
                                        return {
                                            label: key,
                                            value: this.formatParamValue(wordParams[key])
                                        };
                                    });
                                    return {
                                        id: `word-${wordData.word}`,
                                        label: `"${wordData.word}"`,
                                        value: '',
                                        expanded: false,
                                        children: paramsList
                                    };
                                })
                            };
                        })
                    });
                }
            }
        }

        // Audio Effects
        html += this.createTreeNode({
            id: 'effects',
            label: 'Audio Effects',
            expanded: false,
            children: [
                {
                    id: 'reverb',
                    label: 'Reverb',
                    expanded: false,
                    children: [
                        { label: 'Size', value: effects.reverbSize, detail: 'Spatial depth' },
                        { label: 'Mix', value: `${(effects.reverbMix * 100).toFixed(0)}%`, detail: 'Wet/dry balance' }
                    ]
                },
                {
                    id: 'delay',
                    label: 'Delay',
                    expanded: false,
                    children: [
                        { label: 'Time', value: `${(effects.delayTime * 1000).toFixed(0)}ms`, detail: 'Echo timing' }
                    ]
                },
                {
                    id: 'filters',
                    label: 'Filters',
                    expanded: false,
                    children: [
                        { label: 'Low-Pass', value: `${(effects.lowPass * 100).toFixed(0)}%`, detail: 'Brightness control' },
                        { label: 'High-Pass', value: `${(effects.highPass * 100).toFixed(0)}%`, detail: 'Warmth control' }
                    ]
                }
            ]
        });

        // Structural Analysis
        if (analyses.structural) {
            const struct = analyses.structural;
            html += this.createTreeNode({
                id: 'structure',
                label: 'Text Structure',
                expanded: false,
                children: [
                    { label: 'Sentences', value: struct.sentenceCount },
                    { label: 'Paragraphs', value: struct.paragraphCount },
                    { label: 'Avg Sentence Length', value: `${struct.averageSentenceLength.toFixed(1)} words` },
                    { label: 'Narrative Arc', value: struct.structure.arc, detail: struct.structure.type },
                    {
                        id: 'punctuation',
                        label: 'Punctuation Effects',
                        expanded: false,
                        children: [
                            { label: 'Periods (.)' , value: struct.punctuationProfile.counts.period, detail: 'Resolution points' },
                            { label: 'Exclamations (!)', value: struct.punctuationProfile.counts.exclamation, detail: 'Dynamic accents' },
                            { label: 'Questions (?)', value: struct.punctuationProfile.counts.question, detail: 'Rising contours' },
                            { label: 'Ellipses (...)', value: struct.punctuationProfile.counts.ellipsis, detail: 'Suspensions' }
                        ]
                    }
                ]
            });
        }

        this.associationsTree.innerHTML = html;

        // Add click handlers for expandable nodes
        this.addTreeExpandHandlers();
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
     * Create a hierarchical tree node (expandable/collapsible)
     */
    createTreeNode(node) {
        const id = node.id || `node-${Math.random().toString(36).substr(2, 9)}`;
        const expanded = node.expanded !== undefined ? node.expanded : false;
        const hasChildren = node.children && node.children.length > 0;
        const highlight = node.highlight || false;

        let html = '<div class="tree-node' + (expanded ? ' expanded' : '') + (highlight ? ' tonal-center-highlight' : '') + `" data-node-id="${id}">`;

        // Header (clickable if has children)
        html += '<div class="tree-node-header" ' + (hasChildren ? 'onclick="window.textscapeApp.toggleTreeNode(\'' + id + '\')"' : '') + '>';
        if (hasChildren) {
            html += '<span class="tree-expand">▸</span>';
        } else {
            html += '<span class="tree-expand" style="opacity: 0">▸</span>';
        }
        html += `<span class="tree-node-label">${node.label}</span>`;
        if (node.value) {
            html += `<span class="tree-node-value">${node.value}</span>`;
        }
        html += '</div>';

        // Children
        if (hasChildren) {
            html += '<div class="tree-children">';
            for (const child of node.children) {
                if (child.children) {
                    // Nested node
                    html += this.createTreeNode(child);
                } else {
                    // Leaf node
                    html += '<div class="tree-leaf">';
                    html += `<span class="tree-leaf-label">${child.label}</span>`;
                    html += `<span class="tree-leaf-value">${child.value !== undefined ? child.value : ''}</span>`;
                    html += '</div>';
                    if (child.detail) {
                        html += `<div class="tree-leaf-detail">${child.detail}</div>`;
                    }
                }
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    /**
     * Toggle a tree node's expanded state
     */
    toggleTreeNode(nodeId) {
        const node = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (node) {
            node.classList.toggle('expanded');
        }
    }

    /**
     * Add click handlers to all tree nodes
     */
    addTreeExpandHandlers() {
        // Handlers are inline in createTreeNode, so nothing needed here
        // But we could add keyboard navigation here in the future
    }

    /**
     * Get description for a voice type
     */
    getVoiceDescription(voiceType) {
        const descriptions = {
            drone: 'Sustained low notes, grounding',
            pad: 'Harmonic foundation, chords',
            melody: 'Lead melodic lines',
            texture: 'Complex layered sounds',
            pulse: 'Rhythmic elements',
            atmosphere: 'Ambient wash, spatial'
        };
        return descriptions[voiceType] || '';
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
     * Update visualizer - multi-layered waveform visualization
     */
    updateVisualizer(elapsed) {
        const ctx = this.vizCtx;
        const width = this.visualizer.width;
        const height = this.visualizer.height;

        // Clear canvas (full black, no fade for cleaner look)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (!this.currentParams) return;

        const { mood, tension, density, tempo } = this.currentParams;
        const tonalCenter = this.currentParams.tonalCenter;
        const t = (elapsed / 8000) * tempo; // Time varies with tempo

        // Base grid (subtle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let y = 0; y < height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Layer 1: Drone (slowest, continuous)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + density * 0.15})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
            const normalX = x / width;
            const y = height / 2 +
                Math.sin((normalX * 2 + t * 0.3) * Math.PI) * (30 + Math.abs(mood) * 20);

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Layer 2: Pad (medium frequency)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + density * 0.1})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let x = 0; x < width; x += 2) {
            const normalX = x / width;
            const y = height / 2 +
                Math.sin((normalX * 4 + t * 0.5) * Math.PI * 2) * (15 + tension * 25) +
                Math.cos((normalX * 3 - t * 0.4) * Math.PI) * 10;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Layer 3: Melody/Texture (faster, more complex)
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + tension * 0.3})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let x = 0; x < width; x += 1) {
            const normalX = x / width;
            const y = height / 2 +
                Math.sin((normalX * 8 + t) * Math.PI * 2) * (10 + tension * 30) * Math.sin(t * Math.PI) +
                Math.sin((normalX * 12 + t * 1.5) * Math.PI * 3) * (5 + density * 15);

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Layer 4: Pulse (rhythmic if high arousal)
        if (tension > 0.5) {
            const pulseOpacity = Math.sin(t * Math.PI * 4) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulseOpacity * 0.2})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let x = 0; x < width; x += 3) {
                const normalX = x / width;
                const y = height / 2 +
                    Math.sin((normalX * 6 + t * 2) * Math.PI * 2) * (20 + tension * 20);

                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Centerline (reference)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Display current key/mode at bottom right
        if (tonalCenter) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '9px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillText(
                `${tonalCenter.globalKeyName} ${tonalCenter.globalModeName}`.toUpperCase(),
                width - 10,
                height - 10
            );
        }
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
    console.log('Loading Textscape...');

    // Load the main word-emotion database for tonal center calculation
    try {
        console.log('Loading word-emotion database...');
        const response = await fetch('data/word-emotion-database.json');
        if (response.ok) {
            window.wordEmotionDatabase = await response.json();
            console.log(`✓ Loaded word-emotion database with ${Object.keys(window.wordEmotionDatabase).length} words`);
        } else {
            console.warn('Could not load word-emotion-database.json');
        }
    } catch (error) {
        console.warn('Error loading word-emotion database:', error);
    }

    // Try to load cached sentiment library for enhanced analysis
    await SentimentAnalyzer.loadCachedLibrary();

    window.textscapeApp = new TextscapeApp();
    console.log('Textscape (Continuous) initialized!');
});
