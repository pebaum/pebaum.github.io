# Ambient Drift v3: Pianobook Sample Integration Plan

## Overview
Upgrade from synthesized oscillators to high-quality sampled instruments using free Pianobook libraries.

---

## Phase 1: Sample Selection & Download

### Recommended Pianobook Instruments

| Instrument | Pianobook Library | Why |
|------------|-------------------|-----|
| **Cello** | "Soft Cello" or "Intimate Strings" | Warm, close-mic'd, perfect for ambient |
| **Celeste** | "Toy Piano" or "Music Box" | Bell-like, ethereal high-end |
| **Harp** | "Plucked Piano" or "Autoharp" | Gentle plucks, wide range |
| **Rhodes** | "Felt Piano" or "Intimate Piano" | Soft attack, warm sustain |
| **Vibraphone** | "Kalimba" or "Tongue Drum" | Metallic shimmer |

### Download Process
1. Go to [pianobook.co.uk](https://www.pianobook.co.uk/)
2. Create free account
3. Download Decent Sampler format (.dspreset + samples)
4. Extract WAV/MP3 files from the download

---

## Phase 2: Sample Processing

### File Structure
```
/generative synth 1/
  /samples/
    /cello/
      C2.mp3    # Root sample
      E2.mp3    # +4 semitones
      G2.mp3    # +7 semitones
      C3.mp3    # +12 semitones
      ...
    /celeste/
      C5.mp3
      E5.mp3
      ...
    /harp/
    /rhodes/
    /vibes/
```

### Sample Requirements
- **Format:** MP3 (128-192kbps) or WebM/Opus for smaller files
- **Sampling:** Every minor 3rd (4 semitones) - pitch shift fills gaps
- **Length:** 3-5 seconds sustain + natural decay
- **Normalization:** -3dB peak
- **Velocity layers:** Start with 1 (medium), add pp/ff later

### Processing Steps (Audacity/Adobe Audition)
1. Trim silence from start (< 10ms attack)
2. Fade out tail (2-3 seconds)
3. Normalize to -3dB
4. Export as MP3 192kbps or WebM Opus
5. Name: `{note}{octave}.mp3` (e.g., `C3.mp3`, `Fs4.mp3`)

---

## Phase 3: JavaScript Sampler Implementation

### Basic Sampler Class
```javascript
class PianobookSampler {
    constructor(audioCtx, instrumentName, baseUrl) {
        this.audioCtx = audioCtx;
        this.instrumentName = instrumentName;
        this.baseUrl = baseUrl;
        this.buffers = new Map(); // note -> AudioBuffer
        this.loading = new Map(); // note -> Promise
    }
    
    // Sample mapping - which notes have actual samples
    static SAMPLE_NOTES = [
        'C2', 'E2', 'G#2', 'C3', 'E3', 'G#3', 
        'C4', 'E4', 'G#4', 'C5', 'E5', 'G#5', 'C6'
    ];
    
    // Find nearest sampled note
    findNearestSample(midiNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteName = noteNames[midiNote % 12];
        const octave = Math.floor(midiNote / 12) - 1;
        const fullName = `${noteName}${octave}`;
        
        // Find closest sample
        let closest = PianobookSampler.SAMPLE_NOTES[0];
        let closestDist = 999;
        
        for (const sample of PianobookSampler.SAMPLE_NOTES) {
            const sampleMidi = this.noteToMidi(sample);
            const dist = Math.abs(sampleMidi - midiNote);
            if (dist < closestDist) {
                closestDist = dist;
                closest = sample;
            }
        }
        
        return { sample: closest, detune: (midiNote - this.noteToMidi(closest)) * 100 };
    }
    
    noteToMidi(noteName) {
        const match = noteName.match(/([A-G]#?)(\d+)/);
        const noteMap = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 
                         'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
        return noteMap[match[1]] + (parseInt(match[2]) + 1) * 12;
    }
    
    async loadSample(noteName) {
        if (this.buffers.has(noteName)) return this.buffers.get(noteName);
        if (this.loading.has(noteName)) return this.loading.get(noteName);
        
        const url = `${this.baseUrl}/${noteName}.mp3`;
        const promise = fetch(url)
            .then(r => r.arrayBuffer())
            .then(data => this.audioCtx.decodeAudioData(data))
            .then(buffer => {
                this.buffers.set(noteName, buffer);
                return buffer;
            });
        
        this.loading.set(noteName, promise);
        return promise;
    }
    
    async preloadAll() {
        const promises = PianobookSampler.SAMPLE_NOTES.map(n => this.loadSample(n));
        await Promise.all(promises);
        console.log(`${this.instrumentName}: All samples loaded`);
    }
    
    async playNote(midiNote, velocity = 0.7, duration = 2) {
        const { sample, detune } = this.findNearestSample(midiNote);
        const buffer = await this.loadSample(sample);
        
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.detune.value = detune; // Pitch shift to target note
        
        const gainNode = this.audioCtx.createGain();
        gainNode.gain.value = velocity;
        
        // ADSR envelope
        const now = this.audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(velocity, now + 0.05); // Attack
        gainNode.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.3); // Decay
        gainNode.gain.setValueAtTime(velocity * 0.7, now + duration - 0.5); // Sustain
        gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
        
        source.connect(gainNode);
        // Connect to effect chain here
        
        source.start(now);
        source.stop(now + duration);
        
        return source;
    }
}
```

---

## Phase 4: Loading Strategy

### Progressive Loading
```javascript
async function initializeSamplers() {
    // 1. Create samplers
    const samplers = {
        cello: new PianobookSampler(audioCtx, 'cello', '/samples/cello'),
        celeste: new PianobookSampler(audioCtx, 'celeste', '/samples/celeste'),
        harp: new PianobookSampler(audioCtx, 'harp', '/samples/harp'),
        rhodes: new PianobookSampler(audioCtx, 'rhodes', '/samples/rhodes'),
        vibes: new PianobookSampler(audioCtx, 'vibes', '/samples/vibes')
    };
    
    // 2. Load essential samples first (current key)
    const essentialNotes = getNotesInKey(globalRoot, globalScale);
    for (const sampler of Object.values(samplers)) {
        for (const note of essentialNotes) {
            await sampler.loadSample(note);
        }
    }
    
    // 3. Background load everything else
    for (const sampler of Object.values(samplers)) {
        sampler.preloadAll(); // Don't await, runs in background
    }
    
    return samplers;
}
```

### Smart Preloading
```javascript
// When chord changes, preload next likely notes
function onChordChange(newChord) {
    const notesToPreload = getChordNotes(newChord);
    for (const sampler of Object.values(samplers)) {
        for (const note of notesToPreload) {
            sampler.loadSample(midiToNoteName(note)); // Non-blocking
        }
    }
}
```

---

## Phase 5: File Size Optimization

### Size Estimates
| Instrument | Samples | Size (MP3 192k) | Size (Opus 96k) |
|------------|---------|-----------------|-----------------|
| Cello      | 13      | ~1.5 MB         | ~0.7 MB         |
| Celeste    | 10      | ~1.0 MB         | ~0.5 MB         |
| Harp       | 13      | ~1.5 MB         | ~0.7 MB         |
| Rhodes     | 13      | ~1.5 MB         | ~0.7 MB         |
| Vibes      | 10      | ~1.0 MB         | ~0.5 MB         |
| **Total**  | 59      | **~6.5 MB**     | **~3.1 MB**     |

### Format Detection
```javascript
function getBestFormat() {
    const audio = document.createElement('audio');
    if (audio.canPlayType('audio/webm; codecs="opus"')) return 'webm';
    if (audio.canPlayType('audio/ogg; codecs="opus"')) return 'ogg';
    return 'mp3'; // Fallback
}
```

---

## Phase 6: Integration with v2 Weather System

### Connect Sampler to Existing Effects
```javascript
// In PianobookSampler.playNote()
async playNote(midiNote, velocity = 0.7, duration = 2) {
    // ... sample playback code ...
    
    // Get weather adjustments (from v2)
    const wx = getWeatherAdjustments();
    
    // Apply weather to sample
    source.detune.value = detune + (Math.random() - 0.5) * wx.detuneAmount;
    gainNode.gain.value = velocity * wx.volumeMultiplier;
    
    // Connect to existing per-channel effect chain
    source.connect(gainNode);
    gainNode.connect(this.effectChain.eqLow); // Use v2's effect chain
    gainNode.connect(this.effectChain.delaySend);
    gainNode.connect(this.effectChain.reverbSend);
}
```

---

## Checklist

### Week 1: Sample Acquisition
- [ ] Create Pianobook account
- [ ] Download 5 instruments (closest matches)
- [ ] Extract and organize WAV files

### Week 2: Sample Processing
- [ ] Process samples in Audacity (trim, normalize, export)
- [ ] Convert to MP3 and WebM/Opus
- [ ] Organize into folder structure
- [ ] Test file sizes

### Week 3: Sampler Code
- [ ] Create PianobookSampler class
- [ ] Implement pitch shifting
- [ ] Implement preloading
- [ ] Connect to effect chains

### Week 4: Integration
- [ ] Replace oscillator synths with samplers
- [ ] Connect weather system
- [ ] Test all 10 weather parameters
- [ ] Performance optimization

### Week 5: Polish
- [ ] Loading progress UI
- [ ] Fallback to v2 oscillators if samples fail
- [ ] Add velocity layers (optional)
- [ ] Final testing

---

## Alternative: Use Tone.js Sampler

If building from scratch is too complex, Tone.js has a built-in sampler:

```javascript
import { Sampler } from 'tone';

const cello = new Sampler({
    urls: {
        C2: "C2.mp3",
        E2: "E2.mp3",
        "G#2": "Gs2.mp3",
        // ...
    },
    release: 1,
    baseUrl: "/samples/cello/"
}).toDestination();

// Play a note
cello.triggerAttackRelease("C3", "2n");
```

**Pros:** Less code, handles pitch shifting automatically  
**Cons:** Adds ~150KB library, different API than current v2

---

## Notes

- Start with **one instrument** (Rhodes?) as proof of concept
- Keep v2 oscillators as fallback
- Consider hosting samples on CDN if self-hosting is slow
- Pianobook licenses are usually CC-BY or similar - check each instrument
