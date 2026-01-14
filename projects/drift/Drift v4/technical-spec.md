# Drift v4 - Emergent Ambient Soundscape Generator
## Technical Specification

---

## 1. Overview

**Drift** is a web-based generative ambient music installation that creates unique, evolving soundscapes each time it's initiated. Inspired by works from ICO, Eno, Disasterpeace, Popol Vuh, and others, the system employs autonomous "agents" (instruments) coordinated by a central conductor to produce contemplative, ever-changing ambient music.

### Core Philosophy
- **Emergent**: Music arises from simple rules creating complex behavior
- **Unique**: Every session produces a one-of-a-kind piece
- **Self-Listening**: Instruments react to the overall mix
- **Slow Evolution**: Changes happen gradually, almost imperceptibly
- **Ambient**: Equally ignorable and interesting (Eno's definition)

---

## 2. Architecture

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        CONDUCTOR                             │
│  (Global state, tempo, mood, density, harmonic center)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      GLOBAL LISTENER                         │
│  (Analyzes overall mix: RMS, spectral centroid, density)    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  AGENT   │        │  AGENT   │        │  AGENT   │
    │  (Drone) │        │ (Melody) │        │ (Texture)│
    └──────────┘        └──────────┘        └──────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      EFFECTS BUS                             │
│  (Global reverb, delay, compression, spatial processing)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                        [Audio Output]
```

### 2.2 Technology Stack

- **Audio Engine**: Web Audio API + Tone.js
- **UI Framework**: Vanilla JS with CSS animations
- **Visualization**: Canvas 2D (minimal, ambient visuals)
- **State Management**: Custom reactive system

---

## 3. The Conductor

The Conductor is the central intelligence that guides the overall piece without dictating specific notes.

### 3.1 Global Parameters

| Parameter | Range | Description |
|-----------|-------|-------------|
| `mood` | 0.0 - 1.0 | Dark/ominous (0) → Light/hopeful (1) |
| `density` | 0.0 - 1.0 | Sparse (0) → Rich layering (1) |
| `tension` | 0.0 - 1.0 | Calm (0) → Building intensity (1) |
| `tempo` | 0.1 - 0.5 | Events per second (very slow) |
| `harmonicCenter` | Note | Current tonal center (e.g., E2) |
| `mode` | Scale | Current scale (Dorian, Aeolian, etc.) |

### 3.2 Conductor Behaviors

```javascript
// Pseudo-code for conductor evolution
class Conductor {
  // Drift parameters slowly over time
  evolve(deltaTime) {
    // Random walk with momentum
    this.mood += (noise() - 0.5) * 0.001 * deltaTime;
    this.density += (noise() - 0.5) * 0.0005 * deltaTime;
    
    // Occasional key changes (very rare)
    if (random() < 0.0001) {
      this.changeHarmonicCenter();
    }
    
    // Respond to global listener feedback
    if (this.globalListener.rms > 0.7) {
      this.density -= 0.01; // Pull back if too loud
    }
  }
  
  // Signal agents about upcoming changes
  broadcast(event) {
    this.agents.forEach(a => a.receive(event));
  }
}
```

### 3.3 Arc Structure

The Conductor follows a loose arc over ~30-60 minutes:

1. **Genesis** (0-5 min): Single drone emerges from silence
2. **Awakening** (5-15 min): Gradual layering, textures join
3. **Flowering** (15-35 min): Full palette, melodic hints appear
4. **Contemplation** (35-50 min): Shifts, variations, exploration
5. **Climax** (occasional): Rare orchestral swells *(Fripp, MiA, Hamel)*
6. **Dissolution** (50-60 min): Gradual thinning, return to simplicity

*Note: These are tendencies, not strict timings. The climax phase is optional and rare.*

### 3.4 Dynamic Range System *(Fripp Soundscapes)*

Support for extreme dynamics (ppp to fff):

```javascript
const dynamicRange = {
  floor: -40,        // dB - whisper quiet
  ceiling: 0,        // dB - full power (rare)
  currentTarget: -20, // dB - normal operating level
  
  // Rare climax moments can push to ceiling
  // Most of the time stays in -30 to -15 range
};
```

### 3.5 Intensity Arc *(Hamel Organum)*

Gradual buildup to rare thunderous moments:

```javascript
class IntensityManager {
  // Track how long since last climax
  // Slowly build tension over 20-40 minutes
  // Occasional release into full orchestral swell
  // Then return to calm
  
  shouldClimaxSoon() {
    return this.timeSinceLastClimax > 30 * 60 * 1000 // 30 min
      && this.tension > 0.8
      && random() < 0.1;
  }
}
```

### 3.6 Silence Awareness *(Eno, Sakamoto)*

Deliberate use of negative space:

```javascript
const silenceSettings = {
  minSilenceDuration: 2000,   // ms - always allow this much silence
  maxSilenceDuration: 30000,  // ms - before gentle fill
  
  // Silence is not empty - reverb tails continue
  // "Lots of silence between notes" (Eno Lux)
};
```

---

## 4. Agents (Instruments)

Each agent is an autonomous entity that:
- Has its own voice/timbre
- Listens to the conductor for guidance
- Listens to the global mix to avoid clashing
- Makes independent decisions about when/what to play

### 4.1 Agent Types

#### 4.1.1 Drone Agents
**Inspired by**: Deep Listening, Popol Vuh, Lorn

| Property | Value |
|----------|-------|
| Frequency | Very low (1 event per 30-120 sec) |
| Duration | Very long (10-60 sec sustain) |
| Voices | 1-3 simultaneous |
| Register | Low (C1-C3) |

**Timbres**:
- Warm analog pad (Moog-style)
- Organ drone (pipe organ sustain)
- Tanpura-like string drone
- Sub-bass pulse

**Behavior**:
```javascript
class DroneAgent {
  shouldPlay() {
    // Only play if density allows and no other drone active
    return conductor.density > 0.2 
      && !this.isPlaying 
      && globalListener.lowFreqEnergy < 0.5;
  }
  
  selectNote() {
    // Root, fifth, or octave of current harmonic center
    const intervals = [0, 7, 12, -12];
    return conductor.harmonicCenter + randomChoice(intervals);
  }
}
```

#### 4.1.2 Pad Agents
**Inspired by**: Hyper Light Drifter, Ashen, ICO

| Property | Value |
|----------|-------|
| Frequency | Low-medium (1 event per 15-60 sec) |
| Duration | Long (8-30 sec) |
| Voices | 2-4 chord tones |
| Register | Mid (C3-C5) |

**Timbres**:
- Warm synth pad (Juno-style)
- String ensemble (sampled or synthesized)
- Choir "ahh" pad
- Glass-like shimmer pad

**Behavior**:
- Play chord tones from current mode
- Swell in and out (envelope shaping)
- React to tension parameter for chord voicing

#### 4.1.3 Melody Agents
**Inspired by**: ICO "Heal", Tunic, Made in Abyss, Skyrim

| Property | Value |
|----------|-------|
| Frequency | Rare (1 phrase per 1-5 min) |
| Duration | Short phrases (3-15 sec) |
| Voices | Monophonic |
| Register | Mid-high (C4-C6) |

**Timbres**:
- Soft piano (with reverb tail)
- Flute/recorder synth
- Music box / celesta
- Solo cello (sampled)
- Oboe-like reed

**Behavior**:
```javascript
class MelodyAgent {
  generatePhrase() {
    // Inspired by Soule's "falling feather" contours
    const contours = ['rise-fall', 'fall', 'arch', 'wave'];
    const contour = weightedChoice(contours);
    const length = randomInt(3, 8); // notes
    
    return this.buildMelody(contour, length);
  }
  
  shouldPlay() {
    // Only play during "flowering" phases
    // And only if texture is sparse enough
    return conductor.density > 0.4 
      && conductor.density < 0.8
      && globalListener.midFreqActivity < 0.3
      && timeSinceLastMelody > 60000; // 1 min minimum
  }
}
```

#### 4.1.4 Texture Agents
**Inspired by**: Tunic (field recordings), async, Gorogoa

| Property | Value |
|----------|-------|
| Frequency | Variable |
| Duration | Variable (2-30 sec) |
| Voices | N/A (noise/texture) |
| Register | Full spectrum |

**Timbres**:
- Wind/breath noise
- Rain/water sounds
- Bell/chime resonance
- Metallic shimmer
- Granular clouds
- Distant thunder rumble
- Bird-like chirps (pitched)

**Behavior**:
- Fills spectral gaps
- Adds organic movement
- Reacts to silence (fills but doesn't overwhelm)

#### 4.1.5 Pulse Agents
**Inspired by**: ICO (handpan), Hosono, Eno, Skyrim

| Property | Value |
|----------|-------|
| Frequency | When active: slow repetition |
| Duration | Patterns last 30-180 sec |
| Pattern | Simple ostinato (3-8 notes) |
| Register | Mid (C3-C5) |

**Timbres**:
- Handpan/hang drum
- Marimba (soft mallets)
- Harp arpeggios
- Piano ostinato (à la Skyrim)

**Behavior**:
```javascript
class PulseAgent {
  generatePattern() {
    // Create looping pattern of different length than others
    // (Eno's technique: loops of prime-number lengths)
    const lengths = [7, 11, 13, 17, 19]; // beats
    const patternLength = randomChoice(lengths);
    
    return this.buildOstinato(patternLength);
  }
}
```

#### 4.1.6 Vocal Agent *(NEW - Ashen, MiA, Popol Vuh, Fripp)*
**Inspired by**: Wordless female vocalise, church choir, monastic chant

| Property | Value |
|----------|-------|
| Frequency | Rare (1 event per 2-5 min) |
| Duration | Long (10-60 sec) |
| Voices | 1 solo or 4-8 choir |
| Register | Variable (bass chant to soprano vocalise) |

**Timbres**:
- Solo female vocalise (fictional language feel)
- Church choir "ahh" / "ooh"
- Monastic Latin chant (low, slow)
- Throat singing drone (Deep Listening)

**Behavior**:
```javascript
class VocalAgent {
  shouldPlay() {
    // Only during flowering or climax phases
    return conductor.density > 0.5
      && conductor.mood > 0.3  // Not too dark
      && timeSinceLastVocal > 120000; // 2 min minimum
  }
  
  selectMode() {
    // Solo vocalise for intimate moments
    // Choir for grandeur
    // Chant for sacred/ritual feeling
  }
}
```

#### 4.1.7 Field Recording Agent *(NEW - Tunic, Sakamoto, Lorn)*
**Inspired by**: Pitched bird calls, rain, insects, city sounds

| Property | Value |
|----------|-------|
| Frequency | Variable (ambient bed or punctuation) |
| Duration | Variable (2 sec chirp to 60 sec rain) |
| Processing | Pitched to key, reverbed, panned |
| Register | Full spectrum |

**Timbres**:
- Bird calls (pitched to scale)
- Rain/water (continuous texture)
- Night insects/crickets
- Wind/breath
- Distant city (very rare, Sakamoto)

**Behavior**:
```javascript
class FieldRecordingAgent {
  // Can run as continuous bed (rain, insects)
  // Or as punctuation (bird chirp panned across stereo)
  
  processSample(sample) {
    // Pitch-shift to fit current key
    // Apply reverb to blend
    // Random stereo position (Tunic-style flitting)
  }
}
```

#### 4.1.8 Ritual Agent *(NEW - Hamel, Deep Listening, Popol Vuh)*
**Inspired by**: Tibetan bowls, conch shells, struck metal, taiko

| Property | Value |
|----------|-------|
| Frequency | Very rare (1 event per 5-15 min) |
| Duration | Single strikes with long decay |
| Purpose | Mark transitions, add sacred feeling |
| Register | Variable |

**Timbres**:
- Tibetan singing bowl (struck or rubbed)
- Tibetan cymbal (sharp ping)
- Conch shell drone
- Struck metal pipes
- Taiko drum (for climax)
- Rubbing/bowed glass (Gorogoa)

**Behavior**:
```javascript
class RitualAgent {
  shouldPlay() {
    // Mark key changes
    // Mark phase transitions
    // Or random rare punctuation
    return conductor.isTransitioning
      || (random() < 0.0005 && this.canInterrupt());
  }
}
```

#### 4.1.9 Granular Agent *(NEW - Sakamoto async)*
**Inspired by**: Time-stretched sounds, granular clouds, shimmer

| Property | Value |
|----------|-------|
| Frequency | Medium (continuous or periodic) |
| Duration | 10-60 sec clouds |
| Source | Stretched acoustic samples or synth |
| Register | Usually mid-high |

**Behavior**:
```javascript
class GranularAgent {
  // Take short samples (piano note, voice, bell)
  // Stretch to 10-60x original length
  // Create shimmering, uncertain clouds
  // Good for transitions and fills
}
```

### 4.2 Melody Generation Rules

#### 4.2.1 Melodic Contours *(Skyrim, FFXIII)*

```javascript
const melodicContours = {
  'rise-fall': [2, 2, 1, -1, -2, -1],     // Up then down ("falling feather")
  'fall': [-1, -2, -1, -2],               // Descending (melancholic)
  'arch': [2, 3, 2, -2, -3, -2],          // Big arch
  'wave': [2, -1, 2, -1, 2, -2],          // Undulating
  'leap-fall': [5, -1, -1, -1, -1],       // FFXIII style: leap then step down
};
```

#### 4.2.2 Melody Doubling *(Skyrim)*

```javascript
// When melody plays, optionally double with another voice
const doublingRules = {
  probability: 0.3,
  doublers: {
    'piano': ['strings', 'choir'],
    'flute': ['strings', 'oboe'],
    'cello': ['violin', 'horn'],
  }
};
```

### 4.3 Agent Communication

Agents can listen to each other:

```javascript
class BaseAgent {
  onOtherAgentEvent(event) {
    if (event.type === 'MELODY_START') {
      // Pads might swell in support
      // Other melodies wait
    }
    if (event.type === 'CLIMAX_BUILDING') {
      // All agents prepare to contribute
    }
    if (event.type === 'DISSOLVING') {
      // Agents begin to drop out
    }
  }
}
```

---

## 5. Harmonic System

### 5.1 Scale/Mode Pool

Chosen for their ambient, contemplative qualities:

| Mode | Character | Use Case |
|------|-----------|----------|
| Dorian | Warm, hopeful | mood > 0.5 |
| Aeolian | Melancholic | mood 0.3-0.6 |
| Phrygian | Dark, mysterious | mood < 0.3 |
| Mixolydian | Bright, floating | mood > 0.7 |
| Lydian | Ethereal, dreamy | mood > 0.6 |
| Pentatonic Minor | Safe, folk-like | Any mood (fallback) |

### 5.2 Chord Voicings

Prefer open voicings with perfect intervals:
- Open fifths (power chords)
- Add9 chords (no 3rd for ambiguity)
- Quartal voicings (stacked 4ths)
- Clusters (for tension moments)
- **Impressionist voicings** *(FFXIII)*: Rich extended chords (maj7, min9, add11)

### 5.3 Microtonal System *(Gorogoa)*

Optional mode for otherworldly sound:

```javascript
const microtonalSettings = {
  enabled: false,
  baseFreq: 424,        // A4 = 424Hz instead of 440Hz (slightly flat)
  // Additional pitch offsets in cents for non-12-tone intervals
  detuneMap: {
    // Certain scale degrees slightly sharp or flat
    2: +15,   // 2nd degree 15 cents sharp
    6: -20,   // 6th degree 20 cents flat
    7: +10,   // 7th degree 10 cents sharp
  }
};
```

### 5.4 Key Changes

```javascript
// Smooth transitions via pivot notes
changeHarmonicCenter() {
  const currentRoot = this.harmonicCenter;
  // Move by fourth, fifth, or step
  const intervals = [-7, -5, -2, 2, 5, 7];
  const newRoot = currentRoot + weightedChoice(intervals);
  
  // Announce to agents 30 sec before change
  this.broadcast({ 
    type: 'KEY_CHANGE_PENDING', 
    newRoot, 
    inSeconds: 30 
  });
}
```

### 5.5 Modal Pivots *(Skyrim)*

Smooth modulation between relative major/minor:

```javascript
// Example: E major ↔ C# minor pivot
modalPivot() {
  // Maintain common tones in ostinato
  // Shift other voices to new mode
  // Creates "slight shift to introspective mood"
}
```

### 5.6 Three-Chord Constraint Mode *(ICO)*

For maximum simplicity and calm:

```javascript
const threeChordMode = {
  enabled: false,
  chords: ['I', 'IV', 'V'],  // or ['i', 'iv', 'VII']
  // All agents constrained to these harmonies
};
```

### 5.7 Rich Chord Progression Mode *(FFXIII)*

For emotional, impressionist moments:

```javascript
const richProgressionMode = {
  enabled: false,
  progression: ['Imaj7', 'vi9', 'IVadd9', 'V7sus4'],
  // More complex harmonic movement
  // Used during "flowering" phase
};
```
```

---

## 6. The Global Listener

Analyzes the mix in real-time to enable self-aware behavior.

### 6.1 Metrics Tracked

```javascript
class GlobalListener {
  analyze() {
    return {
      rms: this.getRMS(),              // Overall loudness
      spectralCentroid: this.getCentroid(), // Brightness
      lowFreqEnergy: this.getBandEnergy(20, 200),
      midFreqEnergy: this.getBandEnergy(200, 2000),
      highFreqEnergy: this.getBandEnergy(2000, 20000),
      density: this.getPolyphony(),     // Active voices
      silence: this.getSilenceDuration() // Time since last event
    };
  }
}
```

### 6.2 Feedback Loops

| Condition | Response |
|-----------|----------|
| RMS too high | Agents reduce activity |
| Low freq muddy | Drone agents wait |
| Long silence | Texture agent fills gently |
| Spectral gap | Appropriate agent fills register |
| Too busy | All agents increase wait times |

---

## 7. Effects Processing

### 7.1 Global Effects Chain

```
[Dry Mix] → [Sidechain Comp] → [EQ] → [Bit Crusher] → [Reverb] → [Delay] → [Limiter] → [Output]
                                              ↓
                                    (optional, for dark mood)
```

### 7.2 Reverb System (Critical)

**Inspired by**: Deep Listening cistern, cathedral organs, Hyper Light Drifter

Multiple reverb modes for variety *(Sakamoto async)*:

```javascript
const reverbModes = {
  hall: {
    decay: 8.0,        // Standard long tail (8-15 seconds)
    preDelay: 0.04,    // 40ms pre-delay
    wet: 0.5,
    dampening: 3000,
  },
  cathedral: {
    decay: 15.0,       // Very long (Fripp, Hamel)
    preDelay: 0.08,
    wet: 0.6,
    dampening: 2000,
  },
  cistern: {           // Deep Listening mode
    decay: 45.0,       // EXTREME 45-second decay!
    preDelay: 0.1,
    wet: 0.7,
    dampening: 1500,   // Darker
  },
  intimate: {          // Sakamoto dry moments
    decay: 1.5,
    preDelay: 0.01,
    wet: 0.2,
    dampening: 5000,
  },
  floating: {          // Hosono - minimal, light
    decay: 3.0,
    preDelay: 0.02,
    wet: 0.3,
    dampening: 6000,   // Brighter
  }
};
```

### 7.3 Per-Voice Reverb *(Sakamoto async)*

Different elements can have different reverb amounts:
- Drones: High wet (0.5-0.7)
- Melodies: Medium wet (0.3-0.5)  
- Textures: Variable (0.2-0.6)
- Percussion: Low wet (0.1-0.3) or high for distant effect

### 7.4 Delay

```javascript
const delaySettings = {
  time: '8n',        // Tempo-synced (slow)
  feedback: 0.3,     // Moderate feedback
  wet: 0.2,          // Subtle
};
```

### 7.5 Sidechain Compression *(HLD)*

"Breathing" effect - pads duck when melodic elements play:

```javascript
const sidechainSettings = {
  enabled: true,
  threshold: -20,    // dB
  ratio: 4,
  attack: 0.01,      // Fast
  release: 0.3,      // Slow release for "pump"
  // Triggered by: MelodyAgent, PulseAgent
  // Applied to: DroneAgent, PadAgent
};
```

### 7.6 Bit Crusher / Distortion *(Lorn)*

For dark mood moments:

```javascript
const bitCrusherSettings = {
  enabled: false,     // Activated when mood < 0.2
  bits: 12,           // Subtle degradation (not 8-bit harsh)
  sampleRate: 22050,  // Half rate for lo-fi
};

const distortionSettings = {
  enabled: false,
  amount: 0.3,        // Subtle warmth to heavy grit
  // Used on: Sub-bass drone for "kaiju growl"
};
```

### 7.7 Spatial Processing

#### Auto-Panning *(ICO "swings around speakers")*
```javascript
const autoPanSettings = {
  enabled: true,
  rate: 0.05,         // Very slow (20-second cycle)
  depth: 0.4,         // Subtle movement
  // Applied to: MelodyAgent, some TextureAgent events
};
```

#### Random Panning *(Tunic, Sakamoto)*
```javascript
// Texture events (bird chirps, etc.) get random pan positions
// and may move across stereo field
```

#### Stereo Width
- Wide on pads and reverb tails
- Narrower on bass elements (mono below 100Hz)

### 7.8 Lo-Fi Processing *(Tunic, Hosono)*

Optional vintage character:

```javascript
const loFiSettings = {
  enabled: false,
  tapeWow: 0.002,     // Subtle pitch wobble
  tapeFlutter: 0.01,
  hissLevel: -40,     // dB, very quiet
  highCut: 12000,     // Roll off harsh highs
};
```

### 7.9 Glitch/Stutter *(Sakamoto async)*

Rare, deliberate imperfection:

```javascript
const glitchSettings = {
  probability: 0.001, // Very rare
  types: ['stutter', 'reverse', 'freeze', 'dropout'],
  duration: '16n',    // Short
  // Creates sense of impermanence, machine failing
};
```

### 7.10 Time-Stretching *(Sakamoto)*

For texture creation:
- Stretch acoustic samples to drone length
- Granular mode for shimmer/smear

---

## 8. Sound Design

### 8.1 Synthesis Techniques

| Technique | Use | Inspiration |
|-----------|-----|-------------|
| Subtractive | Warm pads, drones | Lorn, HLD |
| FM | Bell tones, metallic textures, chiptune leads | Hosono, ICO |
| Granular | Ambient textures, stretched sounds, time-stretch | Sakamoto async |
| Wavetable | Evolving pads | Eno |
| Sampler | Piano, strings, field recordings | Tunic, MiA |
| Additive | Organ tones, overtone-rich drones | Hamel, Deep Listening |
| Physical Modeling | Plucked strings, bowed textures | Popol Vuh |

### 8.2 Core Patches - DRONES (8 patches)

1. **Warm Analog Pad** *(Lorn, HLD)*
   - 2 detuned saws + sub oscillator
   - Low-pass filter with slow LFO (0.05-0.2 Hz)
   - Long attack (2-5s) / release (8-15s) envelope
   - Optional: Wavering pitch LFO ("Carpenter-esque")

2. **Organ Drone** *(Hamel Organum, Popol Vuh)*
   - Additive synthesis: fundamental + 2nd, 3rd, 4th, 8th partials
   - Multiple "stops" that can be added/removed
   - Slow swell envelope
   - Rich in harmonic beating / difference tones

3. **Tanpura/Sitar Drone** *(Popol Vuh Nosferatu)*
   - Plucked string model with sympathetic resonance
   - Continuous drone with subtle rhythm
   - Rich overtones, slight detuning for shimmer

4. **Harmonium/Accordion Pad** *(Deep Listening, Popol Vuh)*
   - Breathy, reed-like tone
   - Slight pitch instability (human breath simulation)
   - Warm mid-range focus

5. **Electrical Hum Drone** *(Tunic)*
   - 60Hz fundamental + harmonics
   - Pitched to musical notes
   - Subtle amplitude modulation

6. **Sub-Bass Rumble** *(Lorn, MiA)*
   - Very low (20-60Hz) sine/triangle
   - Slow amplitude envelope
   - Optional: Distortion for "kaiju growl"

7. **Didgeridoo/Brass Drone** *(Deep Listening)*
   - Low brass-like timbre
   - Circular breathing simulation (continuous)
   - Rich in low overtones

8. **Choir Drone** *(Fripp, Popol Vuh)*
   - Formant-filtered saw waves
   - "Ahh" and "Ooh" vowel shapes (morphing)
   - Latin chant mode: slow syllabic movement
   - Can be monastic (low) or ethereal (high)

### 8.3 Core Patches - BELLS & CHIMES (5 patches)

9. **FM Glass Bell** *(Hosono, ICO)*
   - FM synthesis (carrier:modulator ratio 1:3.5)
   - Bright, glassy attack
   - Long decay (5-15s)
   - Chiptune-pure variant available

10. **Tibetan Singing Bowl** *(Hamel, Sakamoto)*
    - Struck metal simulation
    - Multiple partials with slow beating
    - Very long sustain
    - Can be looped for drone

11. **Tibetan Cymbal** *(Hamel Organum)*
    - High, sharp ping
    - Quick attack, medium decay
    - Used as ritual punctuation

12. **Music Box / Celesta** *(ICO, Lorn)*
    - Delicate, high-register
    - Short attack, medium decay
    - Slight detuning for vintage feel

13. **Harp Glissando** *(Skyrim, FFXIII)*
    - Sampled or synthesized harp
    - Glissando gesture (ascending/descending)
    - Used to mark transitions

### 8.4 Core Patches - MELODIC (8 patches)

14. **Soft Piano** *(Skyrim, FFXIII, Eno)*
    - Sampled or FM piano
    - Velocity-sensitive brightness
    - Variants: Normal, Prepared (percussive), Reversed

15. **Flute/Recorder Synth** *(ICO)*
    - Breathy, airy tone
    - Slight vibrato on sustained notes
    - Angelic quality

16. **Oboe/Reed Lead** *(Popol Vuh, Skyrim)*
    - Plaintive, reedy timbre
    - Expressive vibrato
    - Modal, folk-like phrasing

17. **Solo Cello** *(Ashen, FFXIII)*
    - Sampled or physical model
    - Long bow strokes
    - Can play melody or sustained harmony

18. **Solo Violin/Fiddle** *(Ashen, MiA - erhu-like)*
    - Higher register than cello
    - Slight portamento available
    - Erhu variant: more nasal, Eastern

19. **French Horn** *(Skyrim, FFXIII)*
    - Warm, round brass tone
    - Used for harmonic reinforcement
    - Subtle fanfare gestures (Fripp)

20. **Chiptune Lead** *(HLD, Hosono)*
    - Pure square/triangle wave
    - 8-bit aesthetic
    - Heavy reverb to soften edges

21. **Acoustic Guitar** *(HLD, Popol Vuh)*
    - Fingerpicked, gentle
    - Folk/pastoral feel
    - Arpeggiated chords or simple melody

### 8.5 Core Patches - PADS (5 patches)

22. **String Ensemble** *(all orchestral inspirations)*
    - Slow attack (200ms+)
    - Subtle vibrato LFO
    - Rich, warm mid-range

23. **Wordless Female Vocalise** *(Ashen, MiA)*
    - Sampled or formant-synthesized
    - "Ahh" / "Ooh" vowels
    - Ethereal, distant quality
    - Can carry melody fragments

24. **Pastel Synth Pad** *(Eno Lux)*
    - Soft, high-register
    - Very gentle attack
    - "Pastel" quality: filtered highs, pure

25. **Brass Section Swell** *(Fripp, MiA)*
    - Orchestral brass
    - Used for climactic moments
    - Slow crescendo/decrescendo

26. **Mandolin/Plucked Strings** *(MiA)*
    - Tremolo plucking
    - Bright, adventurous feel
    - Harp-like variant

### 8.6 Core Patches - TEXTURE/NOISE (10 patches)

27. **Breath Texture** *(various)*
    - Filtered white/pink noise
    - Band-pass with wandering center
    - Wind-like quality

28. **Crackling Static** *(Lorn, HLD)*
    - Lo-fi noise
    - Intermittent crackle pattern
    - Vinyl/tape degradation feel

29. **Industrial Clank** *(HLD)*
    - Metallic, distant
    - Random triggering
    - Heavy reverb

30. **Struck Metal Pipes** *(Deep Listening)*
    - Resonant metallic ping
    - Various pitches
    - Long reverb tail

31. **Rubbing Glass** *(Gorogoa)*
    - Wine glass rim simulation
    - Pure, ethereal tone
    - Slight pitch instability

32. **Bowed Metal** *(Gorogoa)*
    - Eerie, sustained metallic tone
    - Slow attack
    - Unpredictable harmonics

33. **Conch Shell** *(Deep Listening, Hamel)*
    - Breathy horn-like drone
    - Human breath quality
    - Ritual feeling

34. **Night Insects/Crickets** *(Lorn, Sakamoto)*
    - Field recording texture
    - Rhythmic chirping
    - Grounding, organic

35. **Bird Calls (Pitched)** *(Tunic, Eno)*
    - Field recording, processed
    - Pitched to scale
    - Stereo panning movement

36. **Rain/Water** *(Sakamoto)*
    - Constant gentle texture
    - Various intensities
    - Can be rhythmic or wash

### 8.7 Core Patches - PERCUSSION (6 patches)

37. **Handpan/Hang Drum** *(ICO)*
    - Pitched, resonant
    - Soft mallet attack
    - Ostinato patterns

38. **Taiko Drum** *(MiA)*
    - Deep, powerful boom
    - Used sparingly for climax
    - Long decay

39. **Tribal Drum** *(Ashen)*
    - Earthy, primal
    - Slow, heartbeat-like rhythm
    - Distant placement

40. **Heartbeat Pulse** *(MiA, Sakamoto)*
    - Sub-bass thump
    - 60-80 BPM
    - Biological, intimate

41. **Marimba (Soft Mallets)** *(ambient general)*
    - Warm, wooden tone
    - Ostinato patterns
    - Medium decay

42. **Cymbal Swells** *(orchestral)*
    - Soft roll crescendo
    - Used for transitions
    - Very long reverb

---

## 9. Implementation Plan

### Phase 1: Audio Foundation
- [ ] Set up Tone.js context
- [ ] Implement basic synth patches (3-4 core sounds)
- [ ] Create effects chain (reverb, delay, compressor)
- [ ] Test audio output

### Phase 2: Agent System
- [ ] Implement base Agent class
- [ ] Create DroneAgent with basic behavior
- [ ] Create PadAgent
- [ ] Create TextureAgent
- [ ] Add MelodyAgent
- [ ] Add PulseAgent

### Phase 3: Conductor
- [ ] Implement parameter evolution
- [ ] Add harmonic system (scales, key changes)
- [ ] Create broadcast system for agent communication
- [ ] Implement arc structure (genesis → dissolution)

### Phase 4: Global Listener
- [ ] Implement audio analysis (RMS, spectral)
- [ ] Create feedback system
- [ ] Connect to agent decision-making

### Phase 5: Polish
- [ ] Fine-tune agent behaviors
- [ ] Balance mix levels
- [ ] Add UI (minimal: initialize button, time display)
- [ ] Add subtle visualizer
- [ ] Performance optimization

### Phase 6: Extended Features
- [ ] More instrument patches
- [ ] Microtuning options (Gorogoa-style)
- [ ] Field recording integration
- [ ] Session recording/export

---

## 10. UI/UX Design

### 10.1 Minimal Interface

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│            [DRIFT]                      │
│                                         │
│         ◯ Initialize                    │
│                                         │
│                                         │
│     ░░░░░░░░░░░░░░░░░░░░░░░            │
│     (subtle visualization)              │
│                                         │
│                 12:34                    │
│              elapsed time               │
│                                         │
└─────────────────────────────────────────┘
```

### 10.2 Visualization Ideas

- Slowly morphing gradient background
- Particle system responding to audio
- Waveform-like organic shapes
- Minimal: just color shifts based on mood

### 10.3 Interaction

- Single click to initialize
- Spacebar to pause/resume
- Optional: volume slider
- No other controls (the art is in the autonomy)

---

## 11. Technical Constraints

### 11.1 Browser Compatibility
- Modern browsers with Web Audio API
- Chrome, Firefox, Safari, Edge

### 11.2 Performance Targets
- < 30% CPU usage
- Stable 60fps for visuals
- No audio glitches

### 11.3 Memory Management
- Release unused audio buffers
- Limit concurrent voices (max ~20)
- Garbage collection friendly patterns

---

## 12. Inspiration Alignment Checklist

### ICO "Heal" (2001)
- [x] Handpan/hang drum timbre (Patch #37)
- [x] Twinkling chimes (Patches #9-12)
- [x] Auto-panning LFO ("swings around speakers")
- [x] Three-chord simplicity mode
- [x] Flute-like synth lead (Patch #15)
- [x] Angelic, soothing mood

### Hosono "Talking" (1985)
- [x] FM synthesis tones (Patch #9, #20)
- [x] Chiptune-influenced timbre
- [x] Minimal/floating reverb mode
- [x] Prime-number loop lengths (Eno technique)
- [x] "Nothing too thematic" - melody restraint
- [x] Lo-fi processing option

### Ashen OST (2018)
- [x] Wordless female vocals (Patch #23)
- [x] Cello/violin sustains (Patches #17-18)
- [x] Tribal drum booms (Patch #39)
- [x] Texture over melody priority
- [x] Dynamic stem crossfade system
- [x] Melancholic yet hopeful mood range

### Tunic OST (2022)
- [x] Field recordings pitched musically (Agent 4.1.7)
- [x] Bird calls with stereo panning (Patch #35)
- [x] Electrical hum as drone (Patch #5)
- [x] Piano-driven melodies (Patch #14)
- [x] Lo-fi + hi-fi balance
- [x] Nostalgic synth tones

### Hyper Light Drifter OST (2016)
- [x] Sidechain compression breathing
- [x] Chiptune-pure lead tones (Patch #20)
- [x] Acoustic guitar timbre (Patch #21)
- [x] Industrial clanks/static (Patches #28-29)
- [x] Vast reverb + delay
- [x] Piano "swallowed by synths" technique
- [x] Beauty and tragedy balance (mood system)

### Gorogoa OST (2017)
- [x] Microtonal tuning system (A=424Hz)
- [x] Non-12-tone intervals
- [x] Rubbing glass texture (Patch #31)
- [x] Bowed metal (Patch #32)
- [x] Church choir (Patch #8)
- [x] Puzzle-piece crossfading
- [x] "Human and handmade" sound sources

### Fripp Soundscapes / Wine of Silence (2012)
- [x] Górecki-like string harmonies
- [x] Monastic Latin chanting (Vocal Agent)
- [x] Brass fanfares (Patch #25)
- [x] Extreme dynamic range (ppp to fff)
- [x] Long orchestral loops
- [x] Cathedral-like reverb
- [x] High dynamic range system

### Eno LUX (2012)
- [x] Generative loops of different lengths
- [x] Reversed/stretched piano (Patch #14 variants)
- [x] Lots of silence between notes
- [x] "Pastel" synth quality (Patch #24)
- [x] Bird-like twitters (Patch #35)
- [x] Extremely slow development
- [x] "Enhancing atmosphere rather than emotion"

### Deep Listening (1989)
- [x] 45-second reverb mode (!!)
- [x] Didgeridoo drone (Patch #7)
- [x] Trombone/accordion timbres (Patches #7, #4)
- [x] Conch shell (Patch #33)
- [x] Struck metal pipes (Patch #30)
- [x] Tuvan throat singing quality (Vocal Agent)
- [x] Overtone-rich tuning
- [x] Space as fourth instrument

### Lorn REMNANT (2018)
- [x] Carpenter-esque wavering synths (Patch #1 LFO)
- [x] Sub-bass rumble (Patch #6)
- [x] Bit-crushing/distortion effects
- [x] "Kaiju growl" distorted bass
- [x] Crackling static (Patch #28)
- [x] Night insects field recording (Patch #34)
- [x] Sudden drops to silence
- [x] Dark, industrial mood option

### Popol Vuh Nosferatu (1978)
- [x] Sitar/tanpura drones (Patch #3)
- [x] Oboe melody (Patch #16)
- [x] Moog harmonium-like pads (Patch #4)
- [x] Church choir - Munich style (Patch #8)
- [x] Acoustic guitar folk moments (Patch #21)
- [x] East-meets-West fusion
- [x] Sacred, spiritual mood

### Made in Abyss OST (2017)
- [x] Solo female vocalise (Patch #23, Vocal Agent)
- [x] Taiko drums (Patch #38)
- [x] Mandolin/harp plucked strings (Patch #26)
- [x] Heartbeat pulses (Patch #40)
- [x] Orchestral climaxes (Intensity Manager)
- [x] Erhu-like fiddle (Patch #18)
- [x] Synth + orchestra blend
- [x] Grand emotional arcs

### Hamel Organum (1986)
- [x] Pipe organ with register control (Patch #2)
- [x] Vedic conch shell (Patch #33)
- [x] Tibetan cymbals (Patch #11)
- [x] Tibetan singing bowl (Patch #10)
- [x] Harmonic beating/difference tones
- [x] Gradual intensity buildup to climax
- [x] Modal repetition

### Sakamoto async (2017)
- [x] Prepared piano sounds (Patch #14 variant)
- [x] City/museum field recordings (Field Agent)
- [x] Granular synthesis (Granular Agent)
- [x] Time-stretching
- [x] Deliberate glitch/stutter effects
- [x] Dry vs wet contrast (per-voice reverb)
- [x] Spoken word option (future)
- [x] Noise vs music blur
- [x] Creative stereo placement

### Skyrim "Streets of Whiterun" (2011)
- [x] Piano ostinato (Pulse Agent)
- [x] Modal pivot (E maj ↔ C# min)
- [x] Harp glissandi (Patch #13)
- [x] French horn warmth (Patch #19)
- [x] Choir "ahh" doubling melody
- [x] String bed under ostinato
- [x] Seamless loop structure
- [x] "Ever changing yet ever the same"

### FFXIII "The Promise" (2009)
- [x] Impressionist harmony (rich chord mode)
- [x] Solo cello taking melody (Patch #17)
- [x] Leap-then-fall melodic contour
- [x] Piano → strings bloom
- [x] Synth pad under orchestra
- [x] Emotional crescendo/decrescendo
- [x] Melody doubling system

---

## 13. File Structure

```
drift-v4/
├── index.html
├── styles.css
├── js/
│   ├── main.js              # Entry point
│   ├── conductor.js         # Central orchestrator
│   ├── global-listener.js   # Audio analysis
│   ├── agents/
│   │   ├── base-agent.js
│   │   ├── drone-agent.js
│   │   ├── pad-agent.js
│   │   ├── melody-agent.js
│   │   ├── texture-agent.js
│   │   ├── pulse-agent.js
│   │   ├── vocal-agent.js    # NEW
│   │   ├── field-agent.js    # NEW
│   │   ├── ritual-agent.js   # NEW
│   │   └── granular-agent.js # NEW
│   ├── audio/
│   │   ├── synths.js        # Instrument definitions (42 patches)
│   │   ├── effects.js       # Effects chain
│   │   ├── scales.js        # Musical data, microtonal
│   │   └── reverbs.js       # Multiple reverb modes
│   └── utils/
│       ├── random.js        # Noise, weighted random
│       └── music.js         # Note/frequency helpers
└── samples/                 # Optional audio samples
    ├── piano/
    ├── vocals/
    ├── field-recordings/
    │   ├── birds/
    │   ├── insects/
    │   ├── rain/
    │   └── metal/
    ├── textures/
    └── impulses/            # Reverb IRs (hall, cathedral, cistern)
```

---

## 14. Implementation Priority

Given the complexity, implement in this order:

### Phase 1: Core Audio (Days 1-2)
1. Tone.js setup + effects chain
2. Basic reverb (hall mode)
3. 3-4 core synth patches (drone pad, bell, piano, strings)
4. Test audio output

### Phase 2: Conductor + Drone (Days 3-4)  
5. Conductor with mood/density/tension
6. DroneAgent with 2-3 patches
7. Basic arc structure (genesis only)
8. Global listener (RMS only)

### Phase 3: Texture + Pulse (Days 5-6)
9. TextureAgent (breath, noise)
10. PulseAgent (handpan ostinato)
11. Auto-panning
12. Prime-number loop lengths

### Phase 4: Melody + Pads (Days 7-8)
13. PadAgent (strings, choir)
14. MelodyAgent with contour rules
15. Sidechain compression
16. Melody doubling

### Phase 5: Special Agents (Days 9-10)
17. VocalAgent (vocalise, choir)
18. RitualAgent (bowls, bells)
19. FieldRecordingAgent
20. Multiple reverb modes

### Phase 6: Polish (Days 11-14)
21. Full arc structure
22. Microtonal option
23. Intensity/climax manager
24. Glitch effects
25. All 42 patches
26. UI + visualization
27. Testing + tuning

---

## 15. Success Criteria

A successful implementation will:

1. **Sound beautiful** from the first drone
2. **Never repeat** exactly the same sequence
3. **Evolve slowly** - changes almost imperceptible
4. **Self-balance** - never too loud, muddy, or sparse
5. **Run indefinitely** without crashing or degrading
6. **Evoke the inspirations** - listeners familiar with the references should feel the connection
7. **Be ambient** - equally pleasant as background or focused listening

---

*This specification serves as the blueprint. Implementation will proceed phase by phase, with listening tests at each stage to ensure the music meets the aesthetic goals.*
