# Copilot Instructions for pebaum.github.io

## Architecture Overview

This is a retro-themed personal website built with vanilla HTML/CSS/JS, styled to replicate Final Fantasy IX's menu system with PS1-era visual effects. The site consists of multiple standalone pages sharing common assets.

### Key Components

- **FFIX Menu System**: Core interactive menu using `FFIXMenu` class with keyboard/mouse navigation
- **PS1 Effects**: Visual effects system (`PS1Effects` class) for scanlines, dithering, and low-res rendering
- **Audio System**: Custom cursor sounds and background music (`StoneBGMPlayer` class)
- **Responsive Design**: PS1-viewport container with mobile-first breakpoints

## Project Structure

```
main-site/index.html     # Primary homepage with FFIX menu
benji-site/index.html    # Secondary character page
artworks/               # Standalone interactive art pieces
assets/                 # Shared resources (fonts, images, audio)
  fonts/Alexandria.ttf  # Custom font used throughout
  images/cursor.png     # FFIX hand cursor (112x52 offset)
  audio/               # Menu sounds and BGM
Save files/             # Archived versions for "save states"
```

## Development Patterns

### Menu System Architecture
- Menu items use `data-menu` attributes linking to `menuContent` object
- Navigation: Arrow keys, mouse hover, click interactions
- Special handlers: `contact` opens mailto, `magic` opens external link, `save` triggers loading sequence
- Sound feedback on all interactions using shared cursor sound

### CSS Styling Conventions
- Uses CSS custom properties: `--ff9-cursor-url` for cursor theming
- PS1 effects: `image-rendering: pixelated`, contrast/saturation filters
- Responsive breakpoints: 768px (tablet), 480px (mobile)
- Layout: 75% character area, 25% menu area on desktop

### Audio Integration
- Menu cursor sound: `../assets/audio/Final Fantasy IX (PS1) - Cut Menu Cursor Sound.mp3`
- BGM files: Root-level `.mp3` files (e.g., `Stone.mp3`)
- Volume standardized at 0.3-0.4 for UX
- Autoplay prevention with user interaction fallbacks

### Asset References
- Always use relative paths from site folders: `../assets/`
- Font loading with `font-display: swap` for performance
- Images: Pixelated rendering for retro aesthetic
- Cache busting headers for development

## Common Tasks

### Adding New Menu Items
1. Add `<div class="menu-item" data-menu="newkey">Label</div>` to command menu
2. Add entry to `menuContent` object in `FFIXMenu` constructor
3. Content supports inline styles and external links

### Creating New Pages
- Follow existing structure with shared `assets/` references
- Include Alexandria font and cursor styling
- Maintain PS1 viewport container pattern
- Add to main menu if needed

### Modifying PS1 Effects
- Canvas operations in `PS1Effects.applyPS1Effects()`
- Effects contained within `.ps1-viewport` boundary
- Use `requestAnimationFrame` for smooth rendering

## Integration Points

- **GitHub Pages**: Static hosting, no build process
- **External Services**: Spotify links, YouTube embeds, mailto handlers
- **Save States**: Archived versions linked from main menu for versioning

## Critical Files

- `main-site/index.html`: Primary interface (1500+ lines, self-contained)
- `assets/fonts/Alexandria.ttf`: Required for consistent theming
- `assets/images/cursor.png`: Custom cursor with specific offset requirements
