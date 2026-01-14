# Textscape

**Transform text into multi-culturally aware ambient music**

Textscape is a sophisticated text-to-music generator that analyzes written text across multiple dimensions and creates beautiful, ambient music that reflects the emotional, structural, and semantic qualities of the input.

## Features

### Multi-Layered Text Analysis
- **Phonetic Analysis**: Vowel/consonant ratios, syllable patterns, alliteration, and sonic qualities
- **Lexical Analysis**: Word characteristics, part-of-speech patterns, and complexity
- **Sentiment Analysis**: Multi-cultural emotion detection and mood assessment
- **Structural Analysis**: Sentence structure, punctuation mapping, and narrative arc
- **Complexity Analysis**: Reading level, information density, and abstraction

### Multi-Cultural Music Theory
- **Western Classical**: Major/minor modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian)
- **Indian Raga System**: Bhairav, Yaman, Bilawal, Kafi, Bhairavi with time-of-day and emotional associations
- **Middle Eastern Maqamat**: Rast, Bayati, Hijaz, Saba
- **East Asian Pentatonic**: Major/minor pentatonic, In/Yo scales, Hirajoshi
- **Culture-Specific Concepts**: Saudade, mono no aware, duende, hiraeth, wabi-sabi, and more

### Voice-Based Synthesis
Six distinct voice types create layered ambient textures:
- **Drone**: Sustained fundamental tones for grounding
- **Pad**: Harmonic beds creating atmospheric depth
- **Melody**: Sparse melodic phrases representing key concepts
- **Texture**: Granular atmospheric elements for descriptive words
- **Pulse**: Gentle rhythmic elements representing action
- **Atmosphere**: Environmental wash reflecting overall mood

### Intelligent Parameter Mapping
- **Mood (-1 to 1)**: Dark to bright, affects scale selection
- **Tension (0 to 1)**: Calm to intense, affects dissonance and dynamics
- **Density (0 to 1)**: Sparse to rich, controls voice count and note frequency
- **Tempo**: Adjusted by text arousal and temporal words
- **Effects**: Reverb size, delay, filtering based on spatial and textural words

## How It Works

1. **Text Input**: Enter any text - poetry, prose, thoughts, anything
2. **Analysis**: The system analyzes the text across five dimensions
3. **Parameter Mapping**: Text features are mapped to musical parameters using cultural music theories
4. **Composition**: A generative composition engine creates a musical structure
5. **Playback**: The event scheduler triggers notes at precise times using Web Audio API synthesis

## Architecture

```
Text Input
    ↓
┌─────────────────────────────────────────┐
│  Multi-Layer Text Analysis              │
│  - Phonetic, Lexical, Sentiment         │
│  - Structural, Complexity                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Multi-Cultural Music Mapping           │
│  - Emotion → Scale selection            │
│  - Words → Musical parameters           │
│  - Structure → Phrase boundaries        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Composition Engine                      │
│  - Musical arc (intro/body/outro)       │
│  - Voice timeline generation            │
│  - Note selection with voice leading    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Audio Engine (Web Audio API)           │
│  - Voice pools (Drone, Pad, etc.)       │
│  - Multi-oscillator synthesis           │
│  - Effects chain (Reverb, Delay)        │
└─────────────────────────────────────────┘
    ↓
Beautiful Ambient Music
```

## File Structure

```
textscape/
├── index.html                      # Main UI
├── styles.css                      # Styling
├── README.md                       # This file
│
├── js/
│   ├── main.js                     # Application controller
│   │
│   ├── analysis/                   # Text analysis modules
│   │   ├── phonetic-analyzer.js
│   │   ├── lexical-analyzer.js
│   │   ├── sentiment-analyzer.js
│   │   ├── structural-analyzer.js
│   │   └── complexity-analyzer.js
│   │
│   ├── mapping/                    # Text-to-music mapping
│   │   ├── scale-library.js
│   │   ├── cultural-theories.js
│   │   ├── parameter-mapper.js
│   │   └── composition-rules.js
│   │
│   ├── audio/                      # Audio synthesis
│   │   ├── effects.js
│   │   ├── synth-patches.js
│   │   ├── voice-types.js
│   │   └── audio-engine.js
│   │
│   └── generation/                 # Music generation
│       ├── composition-engine.js
│       └── event-scheduler.js
│
└── data/                           # Data files (future)
    └── sentiment-library.json
```

## Design Principles

### Always Beautiful
- **Scale-locked**: All notes confined to selected scale (no random chromatics)
- **Voice leading**: Smooth transitions between notes
- **Consonance bias**: 80% consonant intervals for ambient coherence
- **Density limits**: Never more than 6-8 simultaneous voices
- **Heavy reverb**: Creates cohesion even with varied elements

### Multi-Culturally Aware
- Not Western-centric - includes Indian, Middle Eastern, East Asian traditions
- Culture-specific emotion concepts (saudade, mono no aware, duende)
- Appropriate scale selection based on cultural context
- Respectful implementation of musical traditions

### Deterministic
- Same text always generates same music (reproducible)
- No random number generators without seeds
- Consistent parameter mapping

### Offline Capable
- Pure Web Audio API (no external dependencies)
- Local analysis libraries
- Works without internet connection

## Future Enhancements

### Sentiment Library (Planned)
A comprehensive emotion database built using free NLP APIs:
- 1000+ emotion words across cultures
- Valence, arousal, dominance mappings
- Culture-specific emotion concepts
- Cached locally for offline use

### Potential Additions
- Export to WAV/MP3
- MIDI export
- Real-time text-synchronized playback
- Custom scale creation
- User-defined voice patches
- Microtonality support for authentic maqam

## Technical Details

- **Audio**: Web Audio API (no dependencies)
- **Synthesis**: Multi-oscillator additive synthesis
- **Effects**: Convolution reverb, tape delay, compression
- **Analysis**: Rule-based + keyword matching
- **Architecture**: Modular, event-driven
- **Browser Support**: Modern browsers with Web Audio API support

## Usage Tips

### For Best Results
- **Poetry**: Creates sparse, contemplative soundscapes
- **Prose**: Generates richer, more complex compositions
- **Emotional text**: Strong mood and tension mapping
- **Nature descriptions**: Activates specific instruments and textures
- **Abstract concepts**: Creates ambient, washy textures

### Cultural Context Selection
- **Multi-cultural blend**: Best for diverse text
- **Western**: Traditional for Western poetry/prose
- **Indian Raga**: Best for meditative, time-based emotions
- **Middle Eastern**: For dramatic, intense text
- **East Asian**: For minimalist, contemplative text

### Slider Controls
- **Density**: Override text-derived density
- **Mood**: Shift brighter or darker
- Use sparingly - the analysis is usually quite accurate!

## Credits

Built from scratch for ambient music generation with multi-cultural awareness.

**Technologies**: Web Audio API, JavaScript ES6+, HTML5 Canvas

## License

This is a personal project. Feel free to explore and learn from the code!

---

*Textscape: Where words become sound*
