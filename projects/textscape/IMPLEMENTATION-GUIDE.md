# Implementation Guide: Tonal Center System

## Overview

This guide shows how to integrate the new **Tonal Center Calculator** into your existing Textscape codebase to ensure musically coherent, listenable output.

---

## Files Created

### ✅ New Files

1. **`js/mapping/tonal-center-calculator.js`** - Complete implementation
   - Calculates compound metrics from all words
   - Determines ONE global key and mode
   - Provides modulation rules

2. **`MUSICAL-EFFECT-ANALYSIS.md`** - Complete analysis
   - Documents current coverage
   - Identifies gaps
   - Prioritizes fixes

3. **`IMPLEMENTATION-GUIDE.md`** - This file
   - Step-by-step integration instructions

---

## Integration Steps

### Step 1: Add Script Tag to `index.html`

**File**: `projects/textscape/index.html`

Find the script loading section and add:

```html
<!-- Existing scripts -->
<script src="js/mapping/scale-library.js"></script>
<script src="js/mapping/composition-rules.js">

<!-- ADD THIS LINE -->
<script src="js/mapping/tonal-center-calculator.js"></script>

<script src="js/mapping/parameter-mapper.js"></script>
```

**Location**: After `composition-rules.js`, before `parameter-mapper.js`

---

### Step 2: Modify `parameter-mapper.js`

**File**: `js/mapping/parameter-mapper.js`

#### Change 1: Calculate tonal center at the start

**Find** (line ~16):
```javascript
mapTextToMusic(text, culturalContext = 'multicultural', userBias = {}) {
    // Run all analyzers
    const phonetic = PhoneticAnalyzer.analyze(text);
```

**Replace with**:
```javascript
mapTextToMusic(text, culturalContext = 'multicultural', userBias = {}) {
    // STEP 0: Calculate global tonal center FIRST
    const tonalCenter = TonalCenterCalculator.calculateTonalCenter(text, culturalContext);

    // Run all analyzers
    const phonetic = PhoneticAnalyzer.analyze(text);
```

#### Change 2: Use global key/mode instead of per-word selection

**Find** (line ~40):
```javascript
// Select scale and mode
const scaleSelection = this.selectScale(culturalParams, culturalContext);
```

**Replace with**:
```javascript
// Use GLOBAL scale and mode (already calculated)
const scaleSelection = {
    scale: tonalCenter.globalMode,
    rootNote: tonalCenter.globalKey
};
```

#### Change 3: Pass tonal center to return object

**Find** (line ~64):
```javascript
return {
    // Global parameters
    mood: constrainedParams.mood,
```

**Add** `tonalCenter` to the return:
```javascript
return {
    // Global tonal center (LOCKED for entire piece)
    tonalCenter: tonalCenter,

    // Global parameters
    mood: constrainedParams.mood,
```

#### Change 4: Modify selectScale to be optional/deprecated

**Find** (line ~171):
```javascript
selectScale(params, culturalContext) {
    const scale = ScaleLibrary.selectScale(params.mood, params.tension, culturalContext);

    const rootNotes = [36, 38, 40, 41, 43, 45];
    const index = Math.floor(CompositionRules.mapRange(params.mood, -1, 1, 0, rootNotes.length - 1));
    const rootNote = rootNotes[Math.max(0, Math.min(index, rootNotes.length - 1))];

    return {
        scale: scale,
        rootNote: rootNote
    };
}
```

**Add comment** (or remove function entirely):
```javascript
/**
 * DEPRECATED: Use TonalCenterCalculator.calculateTonalCenter() instead
 * This function is kept for backward compatibility but should not be used
 * for new code as it can cause key-jumping issues.
 */
selectScale(params, culturalContext) {
    console.warn('selectScale() is deprecated. Use TonalCenterCalculator instead.');
    // ... existing code ...
}
```

---

### Step 3: Modify Composition Engine to Enforce Key Lock

**File**: `js/generation/composition-engine.js`

Find where notes are generated and add key enforcement:

**Example**:
```javascript
// OLD: Notes can be anything
const note = ScaleLibrary.getRandomNote(scaleNotes, previousNote);

// NEW: Enforce key lock
const note = TonalCenterCalculator.enforceKeyLock(
    ScaleLibrary.getRandomNote(scaleNotes, previousNote),
    globalScale
);
```

**OR** simply ensure you're always using `tonalCenter.globalScale` instead of recalculating scales per word.

---

### Step 4: Handle Punctuation Modulations

**File**: `js/generation/composition-engine.js` or relevant generation file

When encountering punctuation with special musical actions:

```javascript
// Detect punctuation type from structural analysis
const punctuationType = musicalPhrase.punctuation; // 'exclamation', 'question', etc.

// Get modulation rule
const modulationRule = tonalCenter.allowedModulations[punctuationType];

if (modulationRule && modulationRule.rootNote) {
    // Temporarily modulate
    const tempScale = ScaleLibrary.getScaleNotes(
        modulationRule.scale,
        modulationRule.rootNote
    );

    // Generate notes in temporary key
    // ... generate for modulationRule.duration ms ...

    // Then resolve back to modulationRule.resolveTo
    const resolveNote = modulationRule.resolveTo;
    // ... resolve ...
} else {
    // Use global key as normal
    const note = ScaleLibrary.getRandomNote(tonalCenter.globalScale);
}
```

---

### Step 5: Update Main Entry Point

**File**: `js/main.js` (or wherever text processing starts)

Ensure the tonal center is calculated early and passed through:

```javascript
// Parse text input
const text = document.getElementById('textInput').value;

// Map text to music (this now calculates tonal center internally)
const musicParams = ParameterMapper.mapTextToMusic(text, culturalContext);

// Access tonal center
console.log(`Playing in: ${musicParams.tonalCenter.globalKeyName} ${musicParams.tonalCenter.globalModeName}`);

// Display to user (optional)
document.getElementById('keyDisplay').textContent =
    `Key: ${musicParams.tonalCenter.globalKeyName} ${musicParams.tonalCenter.globalModeName}`;

// Pass to composition engine
CompositionEngine.generate(musicParams);
```

---

## Testing

### Test 1: Key Stability

**Input**: "The quick brown fox jumps over the lazy dog"

**Expected**:
- Console shows: `🎵 Calculating global tonal center...`
- Console shows: `✓ Tonal Center: [Some Key] [Some Mode]`
- Music stays in ONE key throughout

**How to verify**:
1. Open browser console
2. Generate music
3. Check console output
4. Listen - should sound coherent, not jumping keys

### Test 2: Emotional Coherence

**Test A - All Happy**:
```
Input: "joy wonderful amazing love beautiful happy delightful fantastic"
Expected: Bright major key (Lydian or Ionian), stays locked
```

**Test B - All Sad**:
```
Input: "sadness grief despair sorrow pain mourning loss empty"
Expected: Dark minor key (Aeolian or Phrygian), stays locked
```

**Test C - Mixed**:
```
Input: "I was sad, but now I'm happy!"
Expected: Slightly positive key (Dorian or Mixolydian), stays locked
```

### Test 3: Punctuation Modulations

**Input**: "What? No! Really... okay."

**Expected**:
- "What?" → temporary modulation to subdominant, unresolved
- "No!" → accent + tension spike, quick return to tonic
- "Really..." → fade/suspend in tonic
- "okay." → resolve to tonic

All within the SAME global key!

---

## Debugging

### Issue: "TonalCenterCalculator is not defined"

**Solution**: Check that `tonal-center-calculator.js` is loaded in `index.html` before `parameter-mapper.js`

### Issue: "wordEmotionDatabase is not defined"

**Solution**: Ensure `data/word-emotion-database.json` is loaded. The calculator will fall back to neutral values if database is missing, but results will be less accurate.

To load database:
```javascript
// In main.js or initialization
async function loadDatabase() {
    const response = await fetch('data/word-emotion-database.json');
    window.wordEmotionDatabase = await response.json();
    console.log(`✓ Loaded ${Object.keys(window.wordEmotionDatabase).length} words`);
}

loadDatabase().then(() => {
    console.log('Database ready');
});
```

### Issue: Music still sounds random/key-jumping

**Check**:
1. Is `tonalCenter.globalScale` being used consistently?
2. Are you generating new scales per word? (Don't!)
3. Is `enforceKeyLock()` being called on generated notes?

**Debug output**:
```javascript
// Add this to composition engine
console.log('Global Key:', musicParams.tonalCenter.globalKeyName);
console.log('Global Mode:', musicParams.tonalCenter.globalModeName);
console.log('Global Scale Notes:', musicParams.tonalCenter.globalScale);

// When generating each note:
console.log('Generated note:', note, 'In scale?', musicParams.tonalCenter.globalScale.includes(note));
```

---

## Performance Considerations

### Database Size

The `word-emotion-database.json` is **85 MB** (177K words).

**Options**:
1. **Full Database**: Best accuracy, but slower initial load
2. **Minified Database**: Remove formatting, reduce size ~20%
3. **Lazy Loading**: Load only needed words on demand
4. **IndexedDB**: Cache database in browser storage

**Current Implementation**: Full database loads at app start. Tonal center calculation takes ~50-200ms for typical texts.

### Optimization Tips

```javascript
// Cache tonal center for same text
const tonalCenterCache = new Map();

function getCachedTonalCenter(text, culturalContext) {
    const key = `${text}|${culturalContext}`;

    if (!tonalCenterCache.has(key)) {
        tonalCenterCache.set(
            key,
            TonalCenterCalculator.calculateTonalCenter(text, culturalContext)
        );
    }

    return tonalCenterCache.get(key);
}
```

---

## Backward Compatibility

If you want to support both old and new behavior:

```javascript
// Add a toggle in UI
const useTonalCenter = document.getElementById('useTonalCenter').checked;

if (useTonalCenter) {
    // New behavior: global key
    const tonalCenter = TonalCenterCalculator.calculateTonalCenter(text);
    scaleSelection = {
        scale: tonalCenter.globalMode,
        rootNote: tonalCenter.globalKey
    };
} else {
    // Old behavior: per-word key (may sound random)
    scaleSelection = this.selectScale(culturalParams, culturalContext);
}
```

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `index.html` | Add | Load `tonal-center-calculator.js` |
| `parameter-mapper.js` | Modify | Use global key instead of per-word |
| `composition-engine.js` | Modify | Enforce key lock on generated notes |
| `main.js` | Modify | Display global key to user |

**Estimated Time**: 30-60 minutes for integration + testing

---

## Next Steps

After implementing tonal center:

1. **Test thoroughly** with various texts
2. **Consider adding**:
   - Harmonic progression (chord changes)
   - Better phrase-level semantic analysis
   - Idiom detection
3. **Optimize** database loading if needed
4. **Add UI** to show current key/mode to user

---

## Questions?

See `MUSICAL-EFFECT-ANALYSIS.md` for detailed analysis of what's covered and what's missing.

The tonal center calculator is **Priority 1 CRITICAL** - implement this first before other enhancements!

---

*Implementation Guide - 2025-01-14*
