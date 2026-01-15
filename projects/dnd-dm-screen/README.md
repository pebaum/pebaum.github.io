# D&D 5e DM Screen

A minimal, offline-capable Dungeon Master screen for D&D 5th Edition with powerful search, initiative tracking, dice rolling, and reference tools.

## Features

### Universal Search
- **Press `/` to focus search** - Quick keyboard access
- Search across all data: monsters, spells, conditions
- Real-time filtering as you type
- Click results to view full details
- Add monsters directly to initiative tracker from search

### Initiative Tracker
- Add combatants with name, initiative, and HP
- Auto-sorts by initiative order
- Track current turn (highlighted)
- Adjust HP with +/- buttons (±1, ±5)
- Remove combatants
- Persistent storage (saves between sessions)
- Next/Previous turn controls

### Dice Roller
- One-click dice: d4, d6, d8, d10, d12, d20, d100
- Custom dice expressions (e.g., "2d6+3", "1d20-2")
- Advantage/Disadvantage buttons for d20
- Roll history with visual feedback
- **Press `R` for quick d20 roll**
- Critical hits/fumbles highlighted

### DC Table & Quick Reference
- Difficulty table from Very Easy (DC 5) to Nearly Impossible (DC 30)
- Quick rules reference: advantage, disadvantage, critical hits, rests
- Always visible for quick reference

### Notepad
- Auto-saving session notes
- Persistent localStorage storage
- Clean, minimal interface

### Conditions Reference
- All D&D 5e conditions in searchable cards
- Click to view full condition text
- Quick reference during combat

## Data Included

- **15 Conditions**: All core D&D conditions (Blinded, Charmed, Frightened, etc.)
- **10 Monsters**: Common SRD creatures (Goblin, Orc, Zombie, Skeleton, etc.)
- **10 Spells**: Popular spells (Magic Missile, Fireball, Cure Wounds, etc.)
- **DC Reference**: Standard difficulty tables and damage by level

## Keyboard Shortcuts

- `/` - Focus search bar
- `R` - Quick d20 roll (when not in input field)
- `Space` - Next turn (suggested)
- `Esc` - Close modal/search results

## Technical Details

- **Pure vanilla JavaScript** - No frameworks or dependencies
- **ES6 modules** - Clean, organized codebase
- **localStorage** - Persistent state for notes and initiative
- **Fully offline** - All data stored locally
- **Responsive** - Works on desktop and mobile

## Architecture

```
dnd-dm-screen/
├── index.html              # Main interface
├── styles.css              # Dark minimal aesthetic
├── js/
│   ├── main.js             # App controller
│   ├── data-loader.js      # JSON data loading
│   ├── search-engine.js    # Universal search
│   ├── initiative-tracker.js
│   ├── dice-roller.js
│   ├── notepad.js
│   ├── reference-viewer.js
└── data/
    ├── conditions.json     # SRD conditions
    ├── monsters.json       # SRD monsters
    ├── spells.json         # SRD spells
    └── dc-table.json       # Reference tables
```

## Design Philosophy

Matches the site's dark minimal aesthetic:
- Pure black background (#000)
- White borders and text (#fff)
- Courier New monospace typography
- Subtle opacity hierarchy
- Grid-based layout
- Smooth animations
- Information-dense but clean

## Usage

1. **Search for content** - Use the search bar to find monsters, spells, or conditions
2. **Build encounters** - Add combatants to initiative tracker
3. **Roll dice** - Click dice buttons or enter custom expressions
4. **Track combat** - Use HP adjustment buttons and turn controls
5. **Reference rules** - Quick access to DCs and conditions
6. **Take notes** - Session notes auto-save

## Future Enhancements

Potential additions:
- More monsters, spells, and items from SRD
- Encounter builder with CR calculation
- Combat log/history
- Custom conditions/status effects
- Import/export encounters
- Monster HP auto-calculation from HD
- Spell slots tracker
- Wild Magic table
- Random encounter generator

## License

Built with SRD (Systems Reference Document) content under the Open Gaming License.

---

**Built with Claude Code** | Dark Minimal Design | Offline-First
