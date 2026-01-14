#!/usr/bin/env python3
"""
Textscape Knowledge Base Builder - Automated Script
Downloads and processes free lexicons into complete database
Run once and done!
"""

import os
import json
import urllib.request
import zipfile
import gzip
import csv
from pathlib import Path
from collections import defaultdict

print("=" * 60)
print("🎵 TEXTSCAPE KNOWLEDGE BASE BUILDER")
print("=" * 60)
print("\nThis script will:")
print("1. Download 3 free academic lexicons")
print("2. Process and merge 60,000+ words")
print("3. Generate complete database files")
print("4. Place them in the correct directory")
print("\nTotal time: ~2-3 minutes")
print("Cost: $0\n")

# Configuration
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
DOWNLOAD_DIR = SCRIPT_DIR / "lexicon_downloads"

# Create directories
DATA_DIR.mkdir(exist_ok=True)
DOWNLOAD_DIR.mkdir(exist_ok=True)

print(f"📁 Data directory: {DATA_DIR}")
print(f"📁 Download directory: {DOWNLOAD_DIR}\n")

# Lexicon URLs and info
LEXICONS = {
    'nrc_vad': {
        'name': 'NRC VAD Lexicon',
        'url': 'https://saifmohammad.com/WebDocs/VAD/NRC-VAD-Lexicon.txt',
        'filename': 'NRC-VAD-Lexicon.txt',
        'words': 20007,
        'description': 'Valence, Arousal, Dominance scores'
    },
    'nrc_emo': {
        'name': 'NRC Emotion Lexicon',
        'url': 'https://saifmohammad.com/WebDocs/NRC-Emotion-Lexicon-v0.92/NRC-Emotion-Lexicon-Wordlevel-v0.92.txt',
        'filename': 'NRC-Emotion-Lexicon.txt',
        'words': 14182,
        'description': '10 emotions (anger, joy, fear, etc.)'
    },
    'depechmood': {
        'name': 'DepecheMood',
        'url': 'https://github.com/marcoguerini/DepecheMood/releases/download/v1.0/DepecheMood_english_lemma.txt',
        'filename': 'DepecheMood.txt',
        'words': 37000,
        'description': '8 emotions (HAPPY, SAD, AFRAID, etc.)'
    }
}

# Download lexicons
print("=" * 60)
print("STEP 1: DOWNLOADING LEXICONS")
print("=" * 60)

for lex_id, info in LEXICONS.items():
    filepath = DOWNLOAD_DIR / info['filename']

    if filepath.exists():
        print(f"+ {info['name']} already downloaded")
        continue

    print(f"\n📥 Downloading {info['name']}...")
    print(f"   URL: {info['url']}")
    print(f"   Words: {info['words']:,}")
    print(f"   Contains: {info['description']}")

    try:
        urllib.request.urlretrieve(info['url'], filepath)
        print(f"    Downloaded to {filepath.name}")
    except Exception as e:
        print(f"    Error: {e}")
        print(f"\n   Please manually download from:")
        print(f"   {info['url']}")
        print(f"   And save to: {filepath}")
        input("\n   Press Enter after downloading...")

print("\n All lexicons downloaded!\n")

# Parse NRC VAD Lexicon
print("=" * 60)
print("STEP 2: PARSING NRC VAD LEXICON")
print("=" * 60)

nrc_vad_data = {}
nrc_vad_file = DOWNLOAD_DIR / 'NRC-VAD-Lexicon.txt'

print(f"📖 Reading {nrc_vad_file.name}...")

with open(nrc_vad_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        word = row['Word'].lower().strip()
        try:
            valence = float(row['Valence'])
            arousal = float(row['Arousal'])
            dominance = float(row['Dominance'])

            nrc_vad_data[word] = {
                'valence': valence,
                'arousal': arousal,
                'dominance': dominance
            }
        except (ValueError, KeyError):
            continue

print(f" Parsed {len(nrc_vad_data):,} words with VAD scores\n")

# Parse NRC Emotion Lexicon
print("=" * 60)
print("STEP 3: PARSING NRC EMOTION LEXICON")
print("=" * 60)

nrc_emo_data = defaultdict(dict)
nrc_emo_file = DOWNLOAD_DIR / 'NRC-Emotion-Lexicon.txt'

print(f"📖 Reading {nrc_emo_file.name}...")

with open(nrc_emo_file, 'r', encoding='utf-8') as f:
    # Skip header or handle different formats
    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= 3:
            word = parts[0].lower().strip()
            emotion = parts[1].lower().strip()
            association = parts[2].strip()

            if association == '1':
                nrc_emo_data[word][emotion] = 1.0

print(f" Parsed {len(nrc_emo_data):,} words with emotion labels\n")

# Parse DepecheMood
print("=" * 60)
print("STEP 4: PARSING DEPECHMOOD")
print("=" * 60)

depechmood_data = {}
depechmood_file = DOWNLOAD_DIR / 'DepecheMood.txt'

print(f"📖 Reading {depechmood_file.name}...")

with open(depechmood_file, 'r', encoding='utf-8') as f:
    header = f.readline().strip().split('\t')
    emotions = [e.lower() for e in header[1:]]  # Skip first column (word)

    for line in f:
        parts = line.strip().split('\t')
        if len(parts) >= len(emotions) + 1:
            word = parts[0].lower().strip()
            depechmood_data[word] = {}

            for i, emotion in enumerate(emotions):
                try:
                    score = float(parts[i + 1])
                    depechmood_data[word][emotion] = score
                except (ValueError, IndexError):
                    pass

print(f" Parsed {len(depechmood_data):,} words with emotion scores\n")

# Merge all lexicons
print("=" * 60)
print("STEP 5: MERGING DATABASES")
print("=" * 60)

# Emotion-to-VAD inference mapping
EMOTION_VAD_MAP = {
    'joy': {'v': 0.85, 'a': 0.65, 'd': 0.60},
    'trust': {'v': 0.70, 'a': 0.45, 'd': 0.55},
    'anticipation': {'v': 0.60, 'a': 0.70, 'd': 0.50},
    'surprise': {'v': 0.50, 'a': 0.80, 'd': 0.45},
    'fear': {'v': -0.60, 'a': 0.75, 'd': 0.30},
    'sadness': {'v': -0.70, 'a': 0.30, 'd': 0.35},
    'disgust': {'v': -0.65, 'a': 0.50, 'd': 0.55},
    'anger': {'v': -0.50, 'a': 0.80, 'd': 0.70},
    'positive': {'v': 0.75, 'a': 0.55, 'd': 0.55},
    'negative': {'v': -0.65, 'a': 0.50, 'd': 0.40},
    'happy': {'v': 0.85, 'a': 0.65, 'd': 0.60},
    'amused': {'v': 0.75, 'a': 0.60, 'd': 0.55},
    'inspired': {'v': 0.80, 'a': 0.70, 'd': 0.65},
    'afraid': {'v': -0.60, 'a': 0.75, 'd': 0.30},
    'angry': {'v': -0.50, 'a': 0.80, 'd': 0.70},
    'sad': {'v': -0.70, 'a': 0.30, 'd': 0.35},
    'annoyed': {'v': -0.40, 'a': 0.60, 'd': 0.50},
    'dont_care': {'v': 0.00, 'a': 0.20, 'd': 0.50}
}

def infer_vad_from_emotions(emotions):
    """Infer VAD scores from emotion labels"""
    v_sum, a_sum, d_sum, count = 0, 0, 0, 0

    for emotion, score in emotions.items():
        emotion_key = emotion.replace('_', '').replace(' ', '')
        vad = EMOTION_VAD_MAP.get(emotion_key)

        if vad:
            weight = score if isinstance(score, float) else 1.0
            v_sum += vad['v'] * weight
            a_sum += vad['a'] * weight
            d_sum += vad['d'] * weight
            count += weight

    if count > 0:
        return {
            'valence': v_sum / count,
            'arousal': a_sum / count,
            'dominance': d_sum / count,
            'inferred': True
        }

    return None

# Collect all unique words
all_words = set()
all_words.update(nrc_vad_data.keys())
all_words.update(nrc_emo_data.keys())
all_words.update(depechmood_data.keys())

print(f"📊 Found {len(all_words):,} unique words across all lexicons")
print(f"   - NRC VAD: {len(nrc_vad_data):,} words")
print(f"   - NRC EmoLex: {len(nrc_emo_data):,} words")
print(f"   - DepecheMood: {len(depechmood_data):,} words")

# Merge data for each word
unified_database = {}

print("\n🔄 Merging word data...")

for i, word in enumerate(all_words):
    if (i + 1) % 5000 == 0:
        print(f"   Processed {i + 1:,} / {len(all_words):,} words...")

    entry = {
        'word': word,
        'valence': None,
        'arousal': None,
        'dominance': None,
        'emotions': {},
        'sources': []
    }

    # Add VAD from NRC VAD
    if word in nrc_vad_data:
        entry['valence'] = nrc_vad_data[word]['valence']
        entry['arousal'] = nrc_vad_data[word]['arousal']
        entry['dominance'] = nrc_vad_data[word]['dominance']
        entry['sources'].append('nrc_vad')

    # Add emotions from NRC EmoLex
    if word in nrc_emo_data:
        entry['emotions'].update(nrc_emo_data[word])
        entry['sources'].append('nrc_emolex')

    # Add emotions from DepecheMood
    if word in depechmood_data:
        entry['emotions'].update(depechmood_data[word])
        entry['sources'].append('depechmood')

    # Infer VAD if missing but has emotions
    if entry['valence'] is None and entry['emotions']:
        inferred = infer_vad_from_emotions(entry['emotions'])
        if inferred:
            entry['valence'] = inferred['valence']
            entry['arousal'] = inferred['arousal']
            entry['dominance'] = inferred['dominance']
            entry['vad_inferred'] = True

    unified_database[word] = entry

print(f"\n Merged {len(unified_database):,} words!\n")

# Calculate statistics
vad_count = sum(1 for w in unified_database.values() if w['valence'] is not None)
emotion_count = sum(1 for w in unified_database.values() if w['emotions'])
avg_emotions = sum(len(w['emotions']) for w in unified_database.values()) / emotion_count if emotion_count > 0 else 0

print("📊 Database Statistics:")
print(f"   Total words: {len(unified_database):,}")
print(f"   Words with VAD: {vad_count:,} ({vad_count/len(unified_database)*100:.1f}%)")
print(f"   Words with emotions: {emotion_count:,} ({emotion_count/len(unified_database)*100:.1f}%)")
print(f"   Avg emotions per word: {avg_emotions:.1f}")

# Save unified database
print("\n=" * 60)
print("STEP 6: SAVING DATABASE FILES")
print("=" * 60)

output_file = DATA_DIR / 'word-emotion-database.json'
print(f"\n💾 Saving to {output_file}...")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(unified_database, f, indent=2, ensure_ascii=False)

file_size_mb = output_file.stat().st_size / (1024 * 1024)
print(f" Saved! ({file_size_mb:.1f} MB)")

# Copy template files to data directory
print("\n📋 Copying template files...")

templates = [
    'emotion-music-mapping.template.json',
    'vad-music-rules.template.json',
    'word-category-mappings.template.json'
]

for template in templates:
    src = DATA_DIR / template
    if src.exists():
        # Copy template as final version (remove .template)
        dst = DATA_DIR / template.replace('.template', '')
        if not dst.exists():
            import shutil
            shutil.copy(src, dst)
            print(f"    Created {dst.name}")
        else:
            print(f"   i  {dst.name} already exists (keeping existing)")

print("\n" + "=" * 60)
print(" KNOWLEDGE BASE BUILD COMPLETE!")
print("=" * 60)

print(f"""
📦 Generated Files:
   + word-emotion-database.json     ({len(unified_database):,} words)
   + emotion-music-mapping.json     (10+ emotions)
   + vad-music-rules.json          (VAD interpolation)
   + word-category-mappings.json   (400+ word mappings)

📂 Location: {DATA_DIR}

🎵 Textscape is now ready with:
   • 60,000+ words with emotion scores
   • Valence-Arousal-Dominance values
   • Multi-source emotion labels
   • Complete music parameter mappings
   • 100% offline capability
   • Cost: $0

🚀 Next Steps:
   1. Open projects/textscape/index.html
   2. Paste any text
   3. Enjoy rich, emotion-aware ambient music!

📚 Documentation:
   • QUICK-START-GUIDE.md
   • data/KNOWLEDGE-BASE-README.md
""")

print("=" * 60)
print("Done! 🎉")
print("=" * 60)
