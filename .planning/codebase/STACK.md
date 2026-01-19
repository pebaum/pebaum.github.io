# Technology Stack

**Analysis Date:** 2026-01-18

## Languages

**Primary:**
- JavaScript (ES6+) - All client-side code, generative audio projects, interactive web apps
- HTML5 - Static pages and web applications
- CSS3 - Styling across all projects

**Secondary:**
- Node.js (JavaScript) - Build scripts and tooling (archived `build-index.js`, 5etools development)

## Runtime

**Environment:**
- Browser (Client-side only) - All code runs in modern web browsers
- Web Audio API - Core audio engine for generative music projects
- Canvas API - Visual rendering in `drift` and other projects

**Package Manager:**
- npm - Used in root and `projects/dnd-dm-screen/5etools-v2.23.0/`
- Lockfile: Not present in root (minimal dependencies)

## Frameworks

**Core:**
- Vanilla JavaScript - No frontend frameworks used
- Web Audio API (native) - Audio synthesis and processing
- Canvas 2D API (native) - Particle systems and visualizations

**Testing:**
- Jest ^29.7.0 - Used in 5etools subproject at `projects/dnd-dm-screen/5etools-v2.23.0/`

**Build/Dev:**
- Sass ^1.71.1 - CSS preprocessing (5etools subproject)
- ESLint ^9.19.0 - JavaScript linting (5etools subproject)
- Prettier ^3.2.5 - Code formatting (5etools subproject)
- http-server ^14.1.1 - Local development server (5etools)

## Key Dependencies

**Critical:**
- @notionhq/client ^5.6.0 - Notion API integration for portfolio updates (root `package.json`)

**Infrastructure (5etools subproject):**
- 5etools-utils ^0.14.33 - D&D 5e tools utilities
- esbuild ^0.20.1 - JavaScript bundler
- handlebars ^4.7.8 - Template engine
- ajv ^8.12.0 - JSON schema validation
- localforage (vendored in `lib/`) - Browser storage abstraction
- jQuery (vendored in `lib/`) - DOM manipulation for 5etools

**Audio Processing:**
- No external dependencies - All audio synthesis uses native Web Audio API

## Configuration

**Environment:**
- No environment variables in production
- Notion API key required for build script (archived)
- Local development: HTTP server required (CORS restrictions prevent `file://` access)

**Build:**
- `package.json` scripts (root): `build` command for Notion integration
- `projects/dnd-dm-screen/5etools-v2.23.0/package.json`: Comprehensive build system with CSS compilation, data generation, and service worker builds

## Platform Requirements

**Development:**
- Node.js 17.1.0+ (specified in `projects/dnd-dm-screen/5etools-v2.23.0/.node-version`)
- Modern browser with Web Audio API support
- Local HTTP server for CORS compliance

**Production:**
- GitHub Pages - Static hosting
- Modern browser (Chrome, Firefox, Safari, Edge)
- Web Audio API support required for generative audio projects
- No server-side runtime needed

---

*Stack analysis: 2026-01-18*
