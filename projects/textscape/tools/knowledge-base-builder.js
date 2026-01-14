/**
 * Textscape Knowledge Base Builder
 *
 * Processes free academic lexicons into unified emotion-music database
 */

// Data storage
let lexicons = {
    nrcVAD: null,      // { word: { valence, arousal, dominance } }
    nrcEmo: null,      // { word: { anger, joy, ... } }
    depecheMood: null  // { word: { AFRAID, HAPPY, ... } }
};

let unifiedDatabase = {}; // Final merged database
let buildComplete = false;

// UI Elements
const fileInputs = {
    nrcVAD: document.getElementById('nrc-vad-file'),
    nrcEmo: document.getElementById('nrc-emo-file'),
    depecheMood: document.getElementById('depechmood-file')
};

const statusElements = {
    nrcVAD: document.getElementById('nrc-vad-status'),
    nrcEmo: document.getElementById('nrc-emo-status'),
    depecheMood: document.getElementById('depechmood-status')
};

const mergeBtn = document.getElementById('merge-btn');
const clearBtn = document.getElementById('clear-btn');
const relationshipsBtn = document.getElementById('relationships-btn');
const skipRelationshipsBtn = document.getElementById('skip-relationships-btn');
const downloadWordDbBtn = document.getElementById('download-word-db-btn');
const downloadMusicMappingBtn = document.getElementById('download-music-mapping-btn');
const downloadVadRulesBtn = document.getElementById('download-vad-rules-btn');
const downloadAllBtn = document.getElementById('download-all-btn');

/**
 * File Upload Handlers
 */
fileInputs.nrcVAD.addEventListener('change', (e) => handleFileUpload(e, 'nrcVAD', parseNRCVAD));
fileInputs.nrcEmo.addEventListener('change', (e) => handleFileUpload(e, 'nrcEmo', parseNRCEmo));
fileInputs.depecheMood.addEventListener('change', (e) => handleFileUpload(e, 'depecheMood', parseDepecheMood));

async function handleFileUpload(event, lexiconName, parserFunction) {
    const file = event.target.files[0];
    if (!file) return;

    updateStatus(lexiconName, 'loading', '⏳ Parsing...');

    try {
        const text = await file.text();
        const data = parserFunction(text);
        lexicons[lexiconName] = data;

        const wordCount = Object.keys(data).length;
        updateStatus(lexiconName, 'loaded', `✅ Loaded ${wordCount.toLocaleString()} words`);

        log(`${lexiconName}: Loaded ${wordCount} words`, 'success');
        checkMergeReady();
    } catch (error) {
        updateStatus(lexiconName, 'error', `❌ Error: ${error.message}`);
        log(`${lexiconName}: Parse error - ${error.message}`, 'error');
    }
}

function updateStatus(lexicon, state, text) {
    const element = statusElements[lexicon];
    element.className = `status ${state}`;
    element.textContent = text;
}

function checkMergeReady() {
    // At least one lexicon must be loaded
    const hasData = Object.values(lexicons).some(lex => lex !== null);
    mergeBtn.disabled = !hasData;
}

/**
 * Parse NRC VAD Lexicon
 * Format: Word\tValence\tArousal\tDominance
 */
function parseNRCVAD(text) {
    const lines = text.split('\n');
    const data = {};

    for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('\t');
        if (parts.length < 4) continue;

        const word = parts[0].toLowerCase().trim();
        const valence = parseFloat(parts[1]);
        const arousal = parseFloat(parts[2]);
        const dominance = parseFloat(parts[3]);

        if (word && !isNaN(valence) && !isNaN(arousal) && !isNaN(dominance)) {
            data[word] = {
                valence: valence,
                arousal: arousal,
                dominance: dominance
            };
        }
    }

    return data;
}

/**
 * Parse NRC Emotion Lexicon
 * Format: Word\tEmotion\tAssociation
 */
function parseNRCEmo(text) {
    const lines = text.split('\n');
    const data = {};

    for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('\t');
        if (parts.length < 3) continue;

        const word = parts[0].toLowerCase().trim();
        const emotion = parts[1].toLowerCase().trim();
        const association = parseInt(parts[2]);

        if (word && emotion && association === 1) {
            if (!data[word]) {
                data[word] = {};
            }
            data[word][emotion] = 1.0;
        }
    }

    return data;
}

/**
 * Parse DepecheMood
 * Format: Word\tAFRAID\tAMUSED\tANGRY\tANNOYED\tDONT_CARE\tHAPPY\tINSPIRED\tSAD
 */
function parseDepecheMood(text) {
    const lines = text.split('\n');
    const data = {};

    // First line is header
    const header = lines[0].split('\t');
    const emotions = header.slice(1).map(e => e.toLowerCase().trim());

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split('\t');
        if (parts.length < emotions.length + 1) continue;

        const word = parts[0].toLowerCase().trim();
        if (!word) continue;

        data[word] = {};
        for (let j = 0; j < emotions.length; j++) {
            const score = parseFloat(parts[j + 1]);
            if (!isNaN(score)) {
                data[word][emotions[j]] = score;
            }
        }
    }

    return data;
}

/**
 * Merge Lexicons into Unified Database
 */
mergeBtn.addEventListener('click', mergeLexicons);

async function mergeLexicons() {
    mergeBtn.disabled = true;
    document.getElementById('merge-progress').style.display = 'block';
    document.getElementById('merge-stats').style.display = 'none';

    const log = document.getElementById('merge-log');
    log.innerHTML = '';

    logMerge('🔄 Starting merge process...', 'info');

    // Collect all unique words
    const allWords = new Set();
    Object.values(lexicons).forEach(lexicon => {
        if (lexicon) {
            Object.keys(lexicon).forEach(word => allWords.add(word));
        }
    });

    const totalWords = allWords.size;
    logMerge(`📊 Found ${totalWords.toLocaleString()} unique words across all lexicons`, 'success');

    // Merge data for each word
    let processed = 0;
    unifiedDatabase = {};

    for (const word of allWords) {
        unifiedDatabase[word] = mergeWordData(word);
        processed++;

        if (processed % 1000 === 0) {
            updateMergeProgress(processed, totalWords);
            logMerge(`Processed ${processed.toLocaleString()} / ${totalWords.toLocaleString()} words`, 'info');
            await sleep(1); // Allow UI to update
        }
    }

    updateMergeProgress(totalWords, totalWords);
    logMerge('✅ Merge complete!', 'success');

    buildComplete = true;
    showMergeStats();
    relationshipsBtn.disabled = false;
    downloadWordDbBtn.disabled = false;
    downloadAllBtn.disabled = false;
}

function mergeWordData(word) {
    const merged = {
        word: word,
        valence: null,
        arousal: null,
        dominance: null,
        emotions: {},
        sources: []
    };

    // Add VAD scores from NRC VAD
    if (lexicons.nrcVAD && lexicons.nrcVAD[word]) {
        merged.valence = lexicons.nrcVAD[word].valence;
        merged.arousal = lexicons.nrcVAD[word].arousal;
        merged.dominance = lexicons.nrcVAD[word].dominance;
        merged.sources.push('nrc_vad');
    }

    // Add emotions from NRC EmoLex
    if (lexicons.nrcEmo && lexicons.nrcEmo[word]) {
        Object.assign(merged.emotions, lexicons.nrcEmo[word]);
        merged.sources.push('nrc_emolex');
    }

    // Add emotions from DepecheMood
    if (lexicons.depecheMood && lexicons.depecheMood[word]) {
        Object.assign(merged.emotions, lexicons.depecheMood[word]);
        merged.sources.push('depechmood');
    }

    // If no VAD scores, try to infer from emotions
    if (merged.valence === null && Object.keys(merged.emotions).length > 0) {
        const inferred = inferVADFromEmotions(merged.emotions);
        merged.valence = inferred.valence;
        merged.arousal = inferred.arousal;
        merged.dominance = inferred.dominance;
        merged.vad_inferred = true;
    }

    return merged;
}

/**
 * Infer VAD scores from emotion labels
 */
function inferVADFromEmotions(emotions) {
    // Emotion-to-VAD mapping (approximate)
    const emotionVAD = {
        // NRC emotions
        joy: { v: 0.85, a: 0.65, d: 0.60 },
        trust: { v: 0.70, a: 0.45, d: 0.55 },
        anticipation: { v: 0.60, a: 0.70, d: 0.50 },
        surprise: { v: 0.50, a: 0.80, d: 0.45 },
        fear: { v: -0.60, a: 0.75, d: 0.30 },
        sadness: { v: -0.70, a: 0.30, d: 0.35 },
        disgust: { v: -0.65, a: 0.50, d: 0.55 },
        anger: { v: -0.50, a: 0.80, d: 0.70 },
        positive: { v: 0.75, a: 0.55, d: 0.55 },
        negative: { v: -0.65, a: 0.50, d: 0.40 },

        // DepecheMood emotions
        happy: { v: 0.85, a: 0.65, d: 0.60 },
        amused: { v: 0.75, a: 0.60, d: 0.55 },
        inspired: { v: 0.80, a: 0.70, d: 0.65 },
        afraid: { v: -0.60, a: 0.75, d: 0.30 },
        angry: { v: -0.50, a: 0.80, d: 0.70 },
        sad: { v: -0.70, a: 0.30, d: 0.35 },
        annoyed: { v: -0.40, a: 0.60, d: 0.50 },
        dont_care: { v: 0.00, a: 0.20, d: 0.50 }
    };

    let vSum = 0, aSum = 0, dSum = 0, count = 0;

    for (const [emotion, score] of Object.entries(emotions)) {
        const emotionKey = emotion.toLowerCase().replace('_', '');
        const vad = emotionVAD[emotionKey];

        if (vad) {
            const weight = typeof score === 'number' ? score : 1.0;
            vSum += vad.v * weight;
            aSum += vad.a * weight;
            dSum += vad.d * weight;
            count += weight;
        }
    }

    if (count > 0) {
        return {
            valence: vSum / count,
            arousal: aSum / count,
            dominance: dSum / count
        };
    }

    return { valence: 0, arousal: 0.5, dominance: 0.5 };
}

function updateMergeProgress(current, total) {
    const percent = (current / total * 100).toFixed(1);
    const fill = document.getElementById('merge-progress-fill');
    fill.style.width = percent + '%';
    fill.textContent = percent + '%';
}

function logMerge(message, type = 'info') {
    const logDiv = document.getElementById('merge-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
}

function showMergeStats() {
    const stats = calculateStats();

    document.getElementById('total-words').textContent = stats.totalWords.toLocaleString();
    document.getElementById('vad-coverage').textContent = stats.vadCoverage + '%';
    document.getElementById('emotion-coverage').textContent = stats.emotionCoverage + '%';
    document.getElementById('avg-emotions').textContent = stats.avgEmotions;

    document.getElementById('merge-stats').style.display = 'grid';
}

function calculateStats() {
    const total = Object.keys(unifiedDatabase).length;
    let vadCount = 0;
    let emotionCount = 0;
    let totalEmotions = 0;

    for (const word in unifiedDatabase) {
        const data = unifiedDatabase[word];
        if (data.valence !== null) vadCount++;
        if (Object.keys(data.emotions).length > 0) {
            emotionCount++;
            totalEmotions += Object.keys(data.emotions).length;
        }
    }

    return {
        totalWords: total,
        vadCoverage: ((vadCount / total) * 100).toFixed(1),
        emotionCoverage: ((emotionCount / total) * 100).toFixed(1),
        avgEmotions: (totalEmotions / emotionCount).toFixed(1)
    };
}

/**
 * Add Relationships via ConceptNet
 */
relationshipsBtn.addEventListener('click', addRelationships);
skipRelationshipsBtn.addEventListener('click', () => {
    logMerge('⏭️ Skipped relationship enrichment', 'info');
});

async function addRelationships() {
    relationshipsBtn.disabled = true;
    document.getElementById('relationships-progress').style.display = 'block';

    const words = Object.keys(unifiedDatabase);
    const total = words.length;
    let processed = 0;

    logRelationships(`🔗 Querying ConceptNet for ${total.toLocaleString()} words...`, 'info');
    logRelationships(`⏱️ Estimated time: ${Math.ceil(total / 100)} minutes (rate limit: 100 req/min)`, 'warning');

    for (const word of words) {
        try {
            const relationships = await queryConceptNet(word);
            unifiedDatabase[word].related = relationships.related;
            unifiedDatabase[word].synonyms = relationships.synonyms;
            unifiedDatabase[word].antonyms = relationships.antonyms;

            processed++;

            if (processed % 100 === 0) {
                updateRelationshipsProgress(processed, total);
                logRelationships(`Processed ${processed.toLocaleString()} / ${total.toLocaleString()} words`, 'info');
                await sleep(600); // Rate limit: 100 req/min = 600ms between requests
            }
        } catch (error) {
            // Continue on error
        }
    }

    updateRelationshipsProgress(total, total);
    logRelationships('✅ Relationship enrichment complete!', 'success');
}

async function queryConceptNet(word) {
    const baseURL = 'http://api.conceptnet.io/c/en/';
    const relationships = { related: [], synonyms: [], antonyms: [] };

    try {
        // Query for related terms
        const relatedResp = await fetch(`${baseURL}${word}?rel=/r/RelatedTo&limit=10`);
        const relatedData = await relatedResp.json();

        if (relatedData.edges) {
            relationships.related = relatedData.edges
                .map(edge => extractConceptWord(edge.end))
                .filter(w => w !== word)
                .slice(0, 10);
        }

        // Query for synonyms
        const synResp = await fetch(`${baseURL}${word}?rel=/r/Synonym&limit=10`);
        const synData = await synResp.json();

        if (synData.edges) {
            relationships.synonyms = synData.edges
                .map(edge => extractConceptWord(edge.end))
                .filter(w => w !== word);
        }

        // Query for antonyms
        const antResp = await fetch(`${baseURL}${word}?rel=/r/Antonym&limit=10`);
        const antData = await antResp.json();

        if (antData.edges) {
            relationships.antonyms = antData.edges
                .map(edge => extractConceptWord(edge.end))
                .filter(w => w !== word);
        }
    } catch (error) {
        // Return empty relationships on error
    }

    return relationships;
}

function extractConceptWord(uri) {
    if (!uri) return null;
    const match = uri.match(/\/c\/en\/([^\/]+)/);
    return match ? match[1].replace(/_/g, ' ') : null;
}

function updateRelationshipsProgress(current, total) {
    const percent = (current / total * 100).toFixed(1);
    const fill = document.getElementById('relationships-progress-fill');
    fill.style.width = percent + '%';
    fill.textContent = percent + '%';
}

function logRelationships(message, type = 'info') {
    const logDiv = document.getElementById('relationships-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
}

/**
 * Download Functions
 */
downloadWordDbBtn.addEventListener('click', () => {
    downloadJSON(unifiedDatabase, 'word-emotion-database.json');
});

downloadMusicMappingBtn.addEventListener('click', () => {
    const template = generateEmotionMusicTemplate();
    downloadJSON(template, 'emotion-music-mapping.json');
});

downloadVadRulesBtn.addEventListener('click', () => {
    const template = generateVADRulesTemplate();
    downloadJSON(template, 'vad-music-rules.json');
});

downloadAllBtn.addEventListener('click', async () => {
    // For now, download individually (ZIP requires JSZip library)
    downloadJSON(unifiedDatabase, 'word-emotion-database.json');
    await sleep(100);
    downloadJSON(generateEmotionMusicTemplate(), 'emotion-music-mapping.json');
    await sleep(100);
    downloadJSON(generateVADRulesTemplate(), 'vad-music-rules.json');

    alert('✅ All files downloaded! Place them in projects/textscape/data/');
});

function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Generate emotion-music-mapping.json template
 */
function generateEmotionMusicTemplate() {
    return {
        "_readme": "Emotion to musical parameter mappings",
        "joy": {
            "scales": [
                { "name": "Ionian", "weight": 0.8 },
                { "name": "Lydian", "weight": 0.6 },
                { "name": "Mixolydian", "weight": 0.4 }
            ],
            "tempo": 1.2,
            "density": 0.65,
            "voices": ["melody", "pad", "texture"],
            "effects": {
                "reverbSize": 0.6,
                "reverbMix": 0.4,
                "lowPass": 0.75
            }
        },
        "sadness": {
            "scales": [
                { "name": "Aeolian", "weight": 0.8 },
                { "name": "Phrygian", "weight": 0.5 }
            ],
            "tempo": 0.6,
            "density": 0.3,
            "voices": ["drone", "pad", "atmosphere"],
            "effects": {
                "reverbSize": 0.9,
                "reverbMix": 0.7,
                "lowPass": 0.4
            }
        }
        // TODO: Add mappings for all emotions
    };
}

/**
 * Generate vad-music-rules.json template
 */
function generateVADRulesTemplate() {
    return {
        "_readme": "VAD score to musical parameter interpolation rules",
        "valence_to_mood": {
            "formula": "valence",
            "description": "Direct mapping: -1 (dark) to 1 (bright)"
        },
        "arousal_to_tempo": {
            "formula": "0.5 + (arousal * 0.8)",
            "min": 0.5,
            "max": 1.3,
            "description": "Low arousal = slow, high arousal = fast"
        },
        "dominance_to_density": {
            "formula": "0.3 + (dominance * 0.5)",
            "min": 0.3,
            "max": 0.8,
            "description": "Low dominance = sparse, high dominance = dense"
        },
        "arousal_tension_combined": {
            "formula": "(arousal + abs(valence * 0.5)) / 2",
            "description": "Tension from both energy and emotional extremity"
        }
    };
}

/**
 * Clear All Data
 */
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all loaded data?')) {
        lexicons = { nrcVAD: null, nrcEmo: null, depecheMood: null };
        unifiedDatabase = {};
        buildComplete = false;

        // Reset UI
        updateStatus('nrcVAD', 'pending', '📥 Not loaded');
        updateStatus('nrcEmo', 'pending', '📥 Not loaded');
        updateStatus('depecheMood', 'pending', '📥 Not loaded');

        document.getElementById('merge-progress').style.display = 'none';
        document.getElementById('merge-stats').style.display = 'none';
        document.getElementById('relationships-progress').style.display = 'none';

        mergeBtn.disabled = true;
        relationshipsBtn.disabled = true;
        downloadWordDbBtn.disabled = true;
        downloadAllBtn.disabled = true;

        fileInputs.nrcVAD.value = '';
        fileInputs.nrcEmo.value = '';
        fileInputs.depecheMood.value = '';

        log('🗑️ All data cleared', 'warning');
    }
});

/**
 * Utility Functions
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
}
