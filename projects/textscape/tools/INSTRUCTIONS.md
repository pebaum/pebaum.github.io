# BUILD TEXTSCAPE KNOWLEDGE BASE - INSTRUCTIONS

## Simple 2-Step Process

### STEP 1: Download Lexicons (5 minutes, one-time)

Download these 3 free files and save to `tools/lexicon_downloads/`:

1. **NRC VAD Lexicon** (20,007 words)
   - Visit: https://saifmohammad.com/WebPages/nrc-vad.html
   - Click "NRC-VAD-Lexicon.txt" download link
   - Save as: `lexicon_downloads/NRC-VAD-Lexicon.txt`

2. **NRC Emotion Lexicon** (14,182 words)
   - Visit: https://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm
   - Download "NRC-Emotion-Lexicon-Wordlevel-v0.92.txt"
   - Save as: `lexicon_downloads/NRC-Emotion-Lexicon.txt`

3. **DepecheMood** (37,000+ words)
   - Visit: https://github.com/marcoguerini/DepecheMood/releases
   - Download "DepecheMood_english_lemma.txt"
   - Save as: `lexicon_downloads/DepecheMood.txt`

### STEP 2: Run the Builder

**Windows:**
```cmd
BUILD-DATABASE.bat
```

**Mac/Linux:**
```bash
./BUILD-DATABASE.sh
```

Done! The script will:
- Process all 3 lexicons
- Merge 60,000+ words
- Generate complete databases
- Place files in `data/` directory

Total time: ~2-3 minutes

---

## What You'll Get

```
projects/textscape/data/
├── word-emotion-database.json      (60,000+ words with VAD scores)
├── emotion-music-mapping.json      (emotion → music mappings)
├── vad-music-rules.json           (VAD interpolation rules)
└── word-category-mappings.json     (word category mappings)
```

---

## Alternative: Use the Web Builder

If you prefer a visual interface:

1. Open `build-knowledge-base.html` in your browser
2. Upload the 3 downloaded files
3. Click "Merge Lexicons"
4. Download generated JSONs
5. Place in `data/` directory

---

## Why Manual Download?

These academic lexicons have terms of service that require:
- Accepting research use agreements
- Citing the original papers
- Not redistributing the raw data

The manual download ensures you've agreed to these terms.

---

## After Building

1. Open `projects/textscape/index.html`
2. Paste any text
3. Enjoy 60,000-word emotion-aware music!

The knowledge base loads automatically - no configuration needed.

---

## Troubleshooting

**Files not found?**
- Make sure lexicon files are in `tools/lexicon_downloads/`
- Check file names match exactly (case-sensitive)

**Python errors?**
- Install Python 3.6+ from https://www.python.org/downloads/

**Want to skip this?**
- Use the existing templates in `data/` - they work without lexicons
- Build smaller database with HuggingFace tool instead

---

Ready? Download the 3 lexicons and run the builder! 🎵
