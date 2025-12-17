# MTG Strategy Corpus

This folder contains a curated collection of Magic: The Gathering strategy articles for use as an LLM training/reference corpus.

## Downloaded Articles

### Fundamentals & Game Theory

| File | Title | Source | Size |
|------|-------|--------|------|
| `whos-the-beatdown.txt` | Who's The Beatdown? | StarCityGames (The Dojo) | 9.2 KB |
| `basics-card-advantage-2014-08-25.txt` | The Basics of Card Advantage | Wizards of the Coast | 13 KB |
| `quadrant-theory-2014-08-20.txt` | Quadrant Theory | Wizards of the Coast | 10.7 KB |
| `level-one-full-course-2015-10-05.txt` | Level One (Course Overview) | Wizards of the Coast | 3.2 KB |
| `shoulders-giants-2013-08-06.txt` | On the Shoulders of Giants | Wizards of the Coast | 15.6 KB |
| `tcg-deep-dive-card-advantage.txt` | Deep Dive: Card Advantage | TCGPlayer | 16.6 KB |
| `tcg-whats-your-role-in-mtg.txt` | What's Your Role in a Game of MTG? | TCGPlayer | 12.5 KB |

### Commander / EDH Strategy & Philosophy

| File | Title | Source | Size |
|------|-------|--------|------|
| `the-philosophy-of-commander.txt` | The Philosophy of Commander | Commander RC (Official) | 2.9 KB |
| `commander-philosophy.txt` | Commander Philosophy | Corry Frydlewicz | 17 KB |
| `ethos-of-edh.txt` | Ethos of EDH | Gathering 4 Magic | 6.8 KB |
| `MTG-Commander-Politics---A-Guide-To-Diplomacy-At-The-Table.txt` | Commander Politics Guide | AetherHub | 13.4 KB |
| `politics-and-win-rates-in-multiplayer-games-of-magic.txt` | Politics and Win Rates in Multiplayer | Hipsters of the Coast | 11.5 KB |
| `tcg-how-to-build-commander.txt` | How to Build and Play Commander | TCGPlayer | 10.4 KB |

## Total Corpus Size

- **13 articles**
- **~143 KB** of strategy content

## Articles That Could Not Be Downloaded

Some articles from the original list were behind paywalls, required login, or had aggressive bot protection:

- StarCityGames: "The Danger of Cool Things", "Back to Basics: Counting Card Advantage", "Five Lies You Believe About Magic Strategy", "The Problem with Politics in Commander" (require subscription)
- BrainstormBrewery: "Unified Theory of Commander Card Advantage" (site issues)
- Card Kingdom Blog: "Powering Up Your Commander Decks" (bot protection)
- MTGSalvation: "Let's Talk Commander Strategy" (forum format, dynamic loading)

## Usage

These text files are formatted for easy parsing:
- Each file starts with metadata (TITLE, SOURCE, AUTHOR if available)
- Main content follows a separator line
- Text is clean and readable, suitable for LLM training or RAG systems

## Script

The Python script `download_mtg_articles.py` can be used to re-download or extend this corpus. It includes:
- Selenium support for JavaScript-heavy sites
- Wayback Machine fallback for archived content
- Smart text extraction from HTML
- Rate limiting to be respectful to servers

### Requirements
```
pip install requests beautifulsoup4 selenium webdriver-manager
```

### Run
```
python download_mtg_articles.py
```
