# Sentiment Library Cache

This directory contains cached sentiment analysis data to enhance Textscape's text-to-music mapping.

## How It Works

1. **Build the library** using `tools/build-sentiment-library.html`
   - Processes ~800 words across 15 categories (emotions, nature, colors, textures, etc.)
   - Uses 5 state-of-the-art HuggingFace transformer models:
     - SamLowe/roberta-base-go_emotions (28 emotions)
     - j-hartmann/emotion-english-distilroberta-base (7 core emotions)
     - cardiffnlp/twitter-roberta-base-sentiment-latest (sentiment)
     - facebook/bart-large-mnli (zero-shot cultural concepts)
     - sentence-transformers/all-MiniLM-L6-v2 (semantic embeddings)

2. **Download the generated library** as `sentiment-library.json`

3. **Place it here** in `data/sentiment-library.json`

4. **Textscape automatically loads it** on startup for enhanced analysis

## What's Stored

For each word, the library contains:
- `valence`: -1 (negative) to 1 (positive) emotional value
- `arousal`: 0 (calm) to 1 (energetic) activation level
- `dominance`: 0 (submissive) to 1 (dominant) control level
- `emotions`: Detected emotions from multiple models with confidence scores
- `sentiment`: Positive/negative/neutral classification
- `cultural_associations`: Culturally-specific emotion concepts
- `models_used`: Which AI models successfully analyzed the word

## Benefits

- **More accurate** sentiment analysis using AI instead of simple keyword matching
- **Multi-cultural awareness** - detects emotions like "saudade", "mono no aware", "duende"
- **Offline capable** - once cached, works without internet
- **Faster** - no API calls needed during music generation
- **Consistent** - same text always produces same music

## Fallback Behavior

If no cached library is found, Textscape falls back to rule-based sentiment analysis using keyword matching. The app works fine without a cache, but the cached version provides richer, more nuanced mappings.
