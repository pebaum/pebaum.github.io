# 5eTools Data Setup Instructions

This guide will help you download and convert the full 5etools database to populate your DM Screen with all D&D 5e content.

## Quick Start

### 1. Download 5etools Data Package

1. Go to **https://get.5e.tools** in your web browser
2. Download the full data package (this will be a large ZIP file, ~500MB-1GB)
3. Extract the ZIP file to a location on your computer
   - Example: `C:\5etools-img\`
   - The extracted folder should contain a `data` directory

### 2. Verify the Data Directory Structure

After extraction, you should see a structure like this:
```
C:\5etools-img\
├── data\
│   ├── bestiary\
│   │   ├── bestiary-mm.json
│   │   ├── bestiary-vgm.json
│   │   └── ... (many more files)
│   ├── spells\
│   │   ├── spells-phb.json
│   │   ├── spells-xge.json
│   │   └── ... (many more files)
│   └── ... (other folders)
```

### 3. Run the Converter Script

Open a terminal/command prompt in the `dnd-dm-screen/scripts/` directory and run:

```bash
# If you extracted to C:\5etools-img\
node convert-5etools-data.js "C:\5etools-img\data"

# Or if you extracted to a different location:
node convert-5etools-data.js "path\to\your\5etools-img\data"
```

### 4. Wait for Conversion

The script will:
- Process all monster files from various sourcebooks (MM, VGM, MTF, etc.)
- Process all spell files (PHB, XGE, TCE, etc.)
- Convert 5etools complex format to our simplified format
- Save everything to `dnd-dm-screen/data/monsters.json` and `data/spells.json`

Expected output:
```
Starting 5etools data conversion...
Reading from: C:\5etools-img\data

Processing monsters...
  Loading bestiary-mm.json...
    Found 342 monsters
  Loading bestiary-vgm.json...
    Found 134 monsters
  ...

Total monsters: 2,500+

✓ Saved monsters.json

Processing spells...
  Loading spells-phb.json...
    Found 319 spells
  ...

Total spells: 2,000+

✓ Saved spells.json

Conversion complete!
  Monsters: 2,500+
  Spells: 2,000+
```

### 5. Launch Your DM Screen

After conversion completes:

1. Make sure the local web server is still running:
   ```bash
   python -m http.server 8000
   ```

2. Open your browser to: **http://localhost:8000/projects/dnd-dm-screen/**

3. Your DM Screen now has the **FULL 5etools database**! Try searching for:
   - Monsters: "Tarrasque", "Adult Red Dragon", "Beholder"
   - Spells: "Fireball", "Wish", "Counterspell"

## What Gets Converted

### Monsters (2,500+)
From sourcebooks including:
- Monster Manual (MM)
- Volo's Guide to Monsters (VGM)
- Mordenkainen's Tome of Foes (MTF)
- Mordenkainen Presents: Monsters of the Multiverse (MPMM)
- Curse of Strahd (CoS)
- Tomb of Annihilation (ToA)
- And many more adventure modules

### Spells (2,000+)
From sourcebooks including:
- Player's Handbook (PHB)
- Xanathar's Guide to Everything (XGE)
- Tasha's Cauldron of Everything (TCE)
- Acquisitions Incorporated (AI)
- And more

## Troubleshooting

### "Directory not found" error
Make sure you're pointing to the `data` subdirectory:
- ✅ Correct: `"C:\5etools-img\data"`
- ❌ Wrong: `"C:\5etools-img"`

### "File not found" warnings
Some files may not exist in your download - this is normal. The script will skip missing files and process what's available.

### Large file sizes
The final `monsters.json` and `spells.json` files will be large (10-50MB). This is expected for the full database.

### Browser loading slow
With 2,500+ monsters, initial page load may take 2-3 seconds. This is normal - the search is still instant once loaded.

## Legal Note

The 5etools data is compiled from the D&D 5e System Reference Document (SRD) and other sources under the Open Gaming License (OGL). By using this data, you agree to comply with the OGL terms. See the OGL-LICENSE file in this directory.

## Data Sources

The converter processes these file categories:

**Monsters (18 files):**
- bestiary-mm.json, bestiary-vgm.json, bestiary-mtf.json, bestiary-mpmm.json
- bestiary-cos.json, bestiary-toa.json, bestiary-skt.json, bestiary-tftyp.json
- bestiary-wdh.json, bestiary-wdmm.json, bestiary-gos.json, bestiary-ai.json
- bestiary-erlw.json, bestiary-rime.json, bestiary-tcsr.json, bestiary-bgdia.json
- bestiary-vrgr.json, bestiary-ftd.json

**Spells (8 files):**
- spells-phb.json, spells-xge.json, spells-tce.json, spells-ai.json
- spells-ggr.json, spells-ftd.json, spells-scc.json, spells-idrotf.json

## Next Steps

Once you have the full database:
1. Test searching for various monsters and spells
2. Try adding monsters to the initiative tracker from search results
3. Generate sessions with the Session Maker
4. Explore the comprehensive spell and monster databases

Enjoy your fully-loaded D&D DM Screen!
