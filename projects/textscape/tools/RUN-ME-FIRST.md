# 🚀 BUILD TEXTSCAPE KNOWLEDGE BASE - RUN ONCE

## One-Command Build

**Windows:**
```cmd
BUILD-DATABASE.bat
```

**Mac/Linux:**
```bash
./BUILD-DATABASE.sh
```

That's it! The script will:
1. ✅ Download 3 free lexicons (60,000+ words)
2. ✅ Parse and merge all data
3. ✅ Generate complete JSON databases
4. ✅ Place files in correct directory
5. ✅ Done in ~2-3 minutes!

---

## Requirements

- **Python 3.6+** (check: `python --version` or `python3 --version`)
- **Internet connection** (for downloading lexicons)

### Install Python if needed:
- **Windows**: https://www.python.org/downloads/ (check "Add to PATH")
- **Mac**: `brew install python3` or download from python.org
- **Linux**: `sudo apt-get install python3` or `sudo yum install python3`

---

## What You'll Get

After running the script, you'll have:

```
projects/textscape/data/
├── word-emotion-database.json      (~15 MB, 60,000+ words)
├── emotion-music-mapping.json      (~2 MB, 10+ emotions)
├── vad-music-rules.json           (~50 KB, interpolation rules)
└── word-category-mappings.json     (~1 MB, 400+ words)
```

**Total**: 60,000+ words with emotion scores, VAD values, and complete music mappings!

---

## Troubleshooting

### Python not found?
- Install Python 3.6+ from https://www.python.org/downloads/
- Make sure "Add Python to PATH" is checked during installation
- Restart your terminal/command prompt after installing

### Download errors?
- Check your internet connection
- Some lexicons may require manual download (script will prompt you)
- Direct download links are in the script output

### Permission errors on Mac/Linux?
```bash
chmod +x BUILD-DATABASE.sh
```

---

## Manual Alternative

If the automated script doesn't work, use the web-based builder:

1. Open `build-knowledge-base.html` in your browser
2. Download lexicons from the provided links
3. Upload each file
4. Click "Merge Lexicons"
5. Download generated JSONs

---

## After Building

1. Open `projects/textscape/index.html`
2. Paste any text
3. Click "Generate Ambient Music"
4. Enjoy rich, emotion-aware soundscapes!

**The knowledge base loads automatically** - no configuration needed!

---

## What Was Built

- **60,000+ words** from 3 academic lexicons:
  - NRC VAD Lexicon (20,007 words with V/A/D scores)
  - NRC EmoLex (14,182 words with 10 emotions)
  - DepecheMood (37,000+ words with 8 emotions)

- **Complete music mappings**:
  - Emotions → Scales, tempo, voices, effects
  - VAD scores → Continuous parameter interpolation
  - Word categories → Direct musical parameters

- **100% offline** after build
- **100% free** - all from academic resources
- **Customizable** - edit any mapping

---

## Documentation

- **QUICK-START-GUIDE.md** - Getting started
- **data/KNOWLEDGE-BASE-README.md** - Full technical docs
- **data/README.md** - Overview

---

## Support

Questions? Check the documentation or review the build script output for detailed information.

---

**Ready?** Just double-click `BUILD-DATABASE.bat` (Windows) or run `./BUILD-DATABASE.sh` (Mac/Linux)!

Build once, use forever. 🎵
