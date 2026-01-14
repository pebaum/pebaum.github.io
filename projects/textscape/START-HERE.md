# 🎵 TEXTSCAPE KNOWLEDGE BASE - START HERE

## Quick Build (One-Time Setup)

### What You Need
- **5 minutes** of your time
- **Internet connection** to download files
- **Python 3** installed (check: `python --version`)

---

## Step 1: Download 3 Files (2 minutes)

Create folder: `projects/textscape/tools/lexicon_downloads/`

Then download these files:

### File 1: NRC VAD Lexicon
- **Link**: https://saifmohammad.com/WebPages/nrc-vad.html
- **Click**: "NRC-VAD-Lexicon.txt" (20,007 words)
- **Save to**: `lexicon_downloads/NRC-VAD-Lexicon.txt`

### File 2: NRC Emotion Lexicon
- **Link**: https://saifmohammad.com/WebPages/NRC-Emotion-Lexicon.htm
- **Download**: "NRC-Emotion-Lexicon-Wordlevel-v0.92.txt"
- **Save to**: `lexicon_downloads/NRC-Emotion-Lexicon.txt`

### File 3: DepecheMood
- **Link**: https://github.com/marcoguerini/DepecheMood/releases
- **Download**: "DepecheMood_english_lemma.txt"
- **Save to**: `lexicon_downloads/DepecheMood.txt`

---

## Step 2: Run the Builder (1 minute)

### Windows:
```cmd
cd tools
BUILD-DATABASE.bat
```

### Mac/Linux:
```bash
cd tools
./BUILD-DATABASE.sh
```

The script will:
1. ✅ Parse 3 lexicons
2. ✅ Merge 60,000+ words
3. ✅ Generate databases
4. ✅ Install in `data/` folder

**That's it!** Done in ~2 minutes total.

---

## What You Get

After running, Textscape will have:

- ✅ **60,000+ words** with emotion scores
- ✅ **Valence-Arousal-Dominance** values
- ✅ **10+ emotions** mapped to music
- ✅ **400+ words** with special mappings
- ✅ **100% offline** capability
- ✅ **Cost: $0**

---

## Then Use It!

1. Open `projects/textscape/index.html`
2. Paste any text
3. Click "Generate Ambient Music"
4. Enjoy rich, emotion-aware soundscapes!

The knowledge base loads automatically.

---

## Don't Want to Download Files?

**Option A**: Use existing templates
- The `data/` folder already has template mappings
- They work without the full database
- Just smaller vocabulary (~400 words vs 60,000)

**Option B**: Use HuggingFace builder
- Open `tools/build-sentiment-library.html`
- Processes ~800 words with AI models
- No manual downloads needed
- Takes 10-15 minutes

**Option C**: Use web builder
- Open `tools/build-knowledge-base.html`
- Upload files manually via browser
- Visual interface, same result

---

## Why Manual Download?

These are academic research lexicons with licenses requiring:
- Accepting terms of use
- Citing original papers
- Not redistributing raw data

Manual download = you've agreed to the terms.

---

## Troubleshooting

**Python not found?**
- Install from: https://www.python.org/downloads/
- Check "Add Python to PATH" during install

**Files not found error?**
- Double-check file names (exact match)
- Ensure files are in `lexicon_downloads/` folder

**Want help?**
- Check `INSTRUCTIONS.md` for details
- Review `KNOWLEDGE-BASE-README.md` for full docs

---

## File Structure After Build

```
projects/textscape/
├── data/
│   ├── word-emotion-database.json      ← 60K words
│   ├── emotion-music-mapping.json      ← Emotion mappings
│   ├── vad-music-rules.json           ← VAD rules
│   └── word-category-mappings.json     ← Category mappings
├── tools/
│   ├── lexicon_downloads/
│   │   ├── NRC-VAD-Lexicon.txt        ← You download
│   │   ├── NRC-Emotion-Lexicon.txt    ← You download
│   │   └── DepecheMood.txt            ← You download
│   ├── BUILD-DATABASE.bat             ← You run (Windows)
│   └── BUILD-DATABASE.sh              ← You run (Mac/Linux)
└── index.html                          ← Then enjoy!
```

---

**Ready?**

1. Download 3 files (2 min)
2. Run BUILD-DATABASE script (1 min)
3. Done! Use Textscape with 60K words

**Build once, use forever.** 🎵
