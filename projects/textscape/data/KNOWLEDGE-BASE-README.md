# Textscape Knowledge Base System

## Overview

The Textscape Knowledge Base is a comprehensive, pre-compiled database that maps **words → emotions → musical parameters**. Instead of analyzing text in real-time, Textscape loads static JSON files containing 60,000+ words with emotion scores, semantic relationships, and direct musical parameter mappings.

## Why Pre-Compile?

1. **Performance**: Instant lookup instead of API calls
2. **Offline**: Works without internet connection
3. **Consistency**: Same text always produces same music
4. **Quality**: Uses gold-standard academic lexicons + state-of-the-art AI models
5. **Cost**: $0 - all built from free resources

---

## Database Structure

The knowledge base consists of 4 main JSON files:

### 1. `word-emotion-database.json` (~15 MB, 60,000+ words)

The core database mapping every word to its emotional properties.

**Structure:**
```json
{
  "joy": {
    "word": "joy",
    "valence": 0.92,
    "arousal": 0.73,
    "dominance": 0.65,
    "emotions": {
      "joy": 1.0,
      "happiness": 0.85,
      "anticipation": 0.45
    },
    "related": ["happiness", "delight", "pleasure"],
    "synonyms": ["happiness", "delight", "bliss"],
    "antonyms": ["sadness", "sorrow", "grief"],
    "sources": ["nrc_vad", "nrc_emolex", "depechmood"]
  }
}
```

**Fields:**
- `valence`: -1 (negative) to 1 (positive) emotional value
- `arousal`: 0 (calm) to 1 (energetic) activation level
- `dominance`: 0 (submissive) to 1 (dominant) control level
- `emotions`: Detected emotions from multiple models with confidence scores
- `related`: Semantically related words (from ConceptNet)
- `synonyms`: Direct synonyms
- `antonyms`: Opposite words
- `sources`: Which lexicons/models contributed data

**How it's built:**
- Merge of 3 free academic lexicons:
  - **NRC VAD Lexicon** (20,007 words with V/A/D scores)
  - **NRC EmoLex** (14,182 words with 10 emotions)
  - **DepecheMood** (37,000+ words with 8 emotions)
- Optional: Enriched with ConceptNet API for semantic relationships

---

### 2. `emotion-music-mapping.json` (~2 MB)

Maps specific emotions to detailed musical parameters.

**Structure:**
```json
{
  "joy": {
    "scales": [
      { "name": "Ionian", "culture": "western", "weight": 0.8 },
      { "name": "Lydian", "culture": "western", "weight": 0.6 }
    ],
    "rootNotes": ["C", "D", "G"],
    "tempo": { "min": 1.1, "max": 1.4, "default": 1.2 },
    "density": { "min": 0.5, "max": 0.8, "default": 0.65 },
    "tension": 0.2,
    "voices": [
      { "type": "melody", "weight": 0.8 },
      { "type": "pad", "weight": 0.6 }
    ],
    "effects": {
      "reverbSize": 0.6,
      "reverbMix": 0.4,
      "lowPass": 0.75
    }
  }
}
```

**Use case:** When text analysis detects "joy", these parameters are used to generate music.

---

### 3. `vad-music-rules.json` (~50 KB)

Interpolation rules for continuous VAD → music mapping.

**Structure:**
```json
{
  "valence_to_scale": {
    "ranges": [
      {
        "min": 0.7,
        "max": 1.0,
        "scales": [
          { "name": "Lydian", "weight": 0.9 },
          { "name": "Ionian", "weight": 0.8 }
        ]
      }
    ]
  },
  "arousal_to_tempo": {
    "formula": "0.5 + (arousal * 0.8)",
    "min": 0.5,
    "max": 1.3
  }
}
```

**Use case:** For words not in emotion mappings, VAD scores are interpolated into musical parameters using these rules.

---

### 4. `word-category-mappings.json` (~1 MB)

Specific mappings for non-emotion words (spatial, temporal, textural, etc.).

**Structure:**
```json
{
  "spatial_words": {
    "vast": {
      "density": 0.2,
      "reverbSize": 0.95,
      "register": "low",
      "spread": 1.0
    }
  },
  "temporal_words": {
    "fleeting": {
      "tempo": 1.1,
      "density": 0.2,
      "duration": 0.5
    }
  }
}
```

**Use case:** Words like "vast" or "fleeting" have direct musical parameter mappings.

---

## Building the Knowledge Base

### Step 1: Download Free Lexicons

Three academic lexicons provide the foundation:

#### NRC VAD Lexicon
- **Download**: https://saifmohammad.com/WebPages/nrc-vad.html
- **What it provides**: 20,007 words with Valence, Arousal, Dominance scores
- **Format**: TSV file (`Word\tValence\tArousal\tDominance`)
- **Why use it**: Gold standard for VAD scores, widely cited in research

#### NRC Emotion Lexicon (EmoLex)
- **Download**: https://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm
- **What it provides**: 14,182 words with 10 emotions (anger, anticipation, disgust, fear, joy, sadness, surprise, trust, positive, negative)
- **Format**: TSV file (`Word\tEmotion\tAssociation`)
- **Why use it**: Comprehensive emotion labels, multi-emotion support

#### DepecheMood
- **Download**: https://github.com/marcoguerini/DepecheMood/releases
- **What it provides**: 37,000+ words with 8 emotions (AFRAID, AMUSED, ANGRY, ANNOYED, DONT_CARE, HAPPY, INSPIRED, SAD)
- **Format**: TSV file (`Word\tEmotion1_score\tEmotion2_score...`)
- **Why use it**: Large vocabulary, continuous emotion scores

### Step 2: Build Using the Tool

1. Open `tools/build-knowledge-base.html` in your browser
2. Upload each lexicon file (TSV format)
3. Click "Merge Lexicons" - processes 60K words in ~2 minutes
4. (Optional) Click "Add Relationships" - queries ConceptNet API (1-2 hours)
5. Download generated files

### Step 3: Install in Textscape

Place downloaded JSON files in `projects/textscape/data/`:

```
projects/textscape/data/
├── word-emotion-database.json        (from builder, ~15 MB)
├── emotion-music-mapping.json        (template or custom, ~2 MB)
├── vad-music-rules.json             (template or custom, ~50 KB)
└── word-category-mappings.json       (template or custom, ~1 MB)
```

Textscape automatically loads these on startup.

---

## How Textscape Uses the Knowledge Base

When you input text like: *"The vast ocean brings peace"*

### 1. Text Tokenization
```javascript
words = ["vast", "ocean", "brings", "peace"]
```

### 2. Word Lookup (word-emotion-database.json)
```javascript
{
  "vast": { valence: 0.1, arousal: 0.3, dominance: 0.7, ... },
  "ocean": { valence: 0.2, arousal: 0.4, dominance: 0.5, ... },
  "peace": { valence: 0.8, arousal: 0.2, dominance: 0.5, ... }
}
```

### 3. Aggregate VAD Scores
```javascript
avgValence = (0.1 + 0.2 + 0.8) / 3 = 0.37
avgArousal = (0.3 + 0.4 + 0.2) / 3 = 0.30
avgDominance = (0.7 + 0.5 + 0.5) / 3 = 0.57
```

### 4. Detect Dominant Emotion
```javascript
detectedEmotions = { peace: 0.8, calm: 0.6, serenity: 0.5 }
dominantEmotion = "peace"
```

### 5. Apply Emotion Mapping (emotion-music-mapping.json)
```javascript
peaceMapping = {
  scales: ["Ionian", "Major Pentatonic"],
  tempo: 0.6,
  voices: ["drone", "pad", "atmosphere"],
  ...
}
```

### 6. Apply Word-Specific Parameters (word-category-mappings.json)
```javascript
vastMapping = {
  density: 0.2,
  reverbSize: 0.95,
  register: "low"
}

oceanMapping = {
  voiceType: "drone",
  movement: "wave",
  continuity: true
}
```

### 7. Interpolate Using VAD Rules (vad-music-rules.json)
```javascript
tempo = 0.5 + (arousal * 0.8) = 0.5 + (0.3 * 0.8) = 0.74
tension = (arousal + abs(valence * 0.5)) / 2 = (0.3 + 0.185) / 2 = 0.24
```

### 8. Generate Music
Final parameters sent to continuous generative engine:
```javascript
{
  scale: "Major Pentatonic",
  rootNote: "C",
  tempo: 0.74,
  density: 0.2,  // from "vast"
  tension: 0.24,
  activeVoices: ["drone", "pad", "atmosphere"],
  reverbSize: 0.95,  // from "vast"
  movement: "wave"  // from "ocean"
}
```

---

## Customization

### Editing Emotion Mappings

Modify `emotion-music-mapping.json` to change how emotions sound:

```json
{
  "anger": {
    "scales": [
      { "name": "Locrian", "weight": 0.9 },  // Change to different scale
      { "name": "Phrygian", "weight": 0.7 }
    ],
    "tempo": { "default": 1.5 },  // Make faster/slower
    "effects": {
      "reverbSize": 0.3  // Less reverb for anger
    }
  }
}
```

### Adding New Emotions

Add custom emotion mappings:

```json
{
  "melancholy": {
    "scales": [{ "name": "Aeolian", "weight": 0.9 }],
    "tempo": { "default": 0.55 },
    "voices": [
      { "type": "drone", "weight": 0.9 },
      { "type": "pad", "weight": 0.7 }
    ]
  }
}
```

### Modifying VAD Rules

Change interpolation formulas in `vad-music-rules.json`:

```json
{
  "arousal_to_tempo": {
    "formula": "0.6 + (arousal * 0.7)",  // Different formula
    "min": 0.6,
    "max": 1.3
  }
}
```

---

## Performance

### Load Time
- **word-emotion-database.json** (15 MB): ~200ms
- **emotion-music-mapping.json** (2 MB): ~50ms
- **vad-music-rules.json** (50 KB): ~10ms
- **word-category-mappings.json** (1 MB): ~30ms
- **Total startup time**: ~300ms

### Lookup Performance
- Word lookup: O(1) - instant hash table lookup
- 1000-word text analysis: ~5-10ms
- No network requests, no API calls

### Memory Usage
- Total database size in memory: ~18 MB
- Negligible compared to audio synthesis (~50 MB)

---

## Extending the Knowledge Base

### Adding More Words

1. **Download additional lexicons**:
   - SenticNet (100,000+ concepts)
   - WordNet emotion subsets
   - Domain-specific lexicons

2. **Use the builder tool** to merge new lexicons

3. **Replace** word-emotion-database.json with expanded version

### Adding Semantic Relationships

Enable ConceptNet enrichment in the builder:
- Queries `http://api.conceptnet.io/` for each word
- Adds `related`, `synonyms`, `antonyms` fields
- Free API, rate limit: 100 req/min
- Processing time: ~1 hour for 60K words

### Building from HuggingFace Models

For maximum quality, use the HuggingFace builder (`tools/build-sentiment-library.html`):
- Analyzes words using 5 transformer models
- Extracts fine-grained emotion scores
- More accurate VAD inference
- Trade-off: Slower build (10-15 min for 800 words)

**Hybrid approach:**
1. Use free lexicons for 60K word coverage
2. Use HuggingFace for 5K most important words
3. Merge both into single database

---

## Technical Details

### Lexicon Merging Strategy

When multiple sources provide data for the same word:

1. **VAD scores**: Average if multiple sources
2. **Emotions**: Union of all detected emotions
3. **Conflicts**: NRC VAD takes priority (gold standard)
4. **Missing VAD**: Infer from emotions using mapping table

**Inference example:**
```javascript
// Word has emotions but no VAD
emotions = { joy: 0.8, happiness: 0.6 }

// Look up emotion VAD mappings
joyVAD = { v: 0.85, a: 0.65, d: 0.60 }
happinessVAD = { v: 0.80, a: 0.60, d: 0.55 }

// Weighted average
inferredValence = (0.85*0.8 + 0.80*0.6) / 1.4 = 0.83
inferredArousal = (0.65*0.8 + 0.60*0.6) / 1.4 = 0.63
inferredDominance = (0.60*0.8 + 0.55*0.6) / 1.4 = 0.58
```

### JSON Format Rationale

**Why JSON over SQL/binary?**
- ✅ Human-readable and editable
- ✅ Native JavaScript support (no parsing library needed)
- ✅ Version control friendly (git diffs work)
- ✅ Easy to customize
- ✅ Fast enough (300ms load for 18 MB)

**Compression options:**
- Gzip compression: ~18 MB → ~3 MB (not implemented, browsers handle automatically)
- minify JSON: Remove whitespace (~10% smaller)
- Not needed unless >100 MB

---

## Future Enhancements

### Planned Features
- Multi-language support (translate lexicons)
- User-contributed emotion mappings
- A/B testing framework for mappings
- Export user preferences as custom mapping files

### Advanced Capabilities
- **Context-aware lookup**: "light" (noun) vs "light" (adjective)
- **Phrase detection**: "falling in love" as single concept
- **Negation handling**: "not happy" inverts valence
- **Intensity modifiers**: "very happy" amplifies scores

---

## Troubleshooting

### Database Not Loading

**Check console for errors:**
```javascript
console.log(knowledgeBase);  // Should show loaded databases
```

**Verify file paths:**
```
data/word-emotion-database.json  ✓ exists
data/emotion-music-mapping.json  ✓ exists
data/vad-music-rules.json        ✓ exists
data/word-category-mappings.json ✓ exists
```

**Check network tab:**
- Files should load with 200 status
- If 404, verify paths are correct

### Music Sounds Wrong

1. **Check emotion mappings**: Are scales/tempo appropriate?
2. **Verify VAD scores**: Are they in expected range?
3. **Review word mappings**: Do category mappings make sense?
4. **Test with simple text**: "happy" should sound bright

### Build Tool Errors

**Lexicon parse errors:**
- Verify TSV format (tab-separated, not spaces)
- Check file encoding (UTF-8)
- Ensure header row exists

**ConceptNet timeout:**
- Reduce batch size
- Increase delay between requests
- Skip relationships if too slow

---

## Credits

**Free Lexicons:**
- NRC VAD Lexicon by Saif Mohammad (National Research Council Canada)
- NRC Emotion Lexicon (EmoLex) by Saif Mohammad
- DepecheMood by Marco Guerini et al.

**APIs:**
- ConceptNet by Luminoso Technologies (MIT License)

**Build Tools:**
- HuggingFace Inference API for transformer models

**Textscape Project:**
- Built from scratch for multi-cultural ambient music generation
- Uses Web Audio API, no external audio libraries

---

## License

The knowledge base database files are derived from academic lexicons with research-use licenses. Check individual lexicon licenses before commercial use.

**Textscape code:** Personal project, free to explore and learn from.

**Lexicon licenses:**
- NRC lexicons: Free for research, cite appropriately
- DepecheMood: Apache 2.0
- ConceptNet: CC BY-SA 4.0

---

*Knowledge Base Version: 1.0*
*Last Updated: 2025-01-14*
