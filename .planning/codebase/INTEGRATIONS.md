# External Integrations

**Analysis Date:** 2026-01-18

## APIs & External Services

**Content Management:**
- Notion API - Portfolio content generation
  - SDK/Client: @notionhq/client ^5.6.0
  - Auth: API key (not in repo)
  - Implementation: Archived build script at `archive/build-index.js`
  - Status: Build script archived, not actively used

**Browser APIs:**
- Web Audio API - Core audio synthesis engine
  - Implementation: `projects/4-track/js/recorder.js`, `projects/drift/Drift v7/drift7.js`, and other audio projects
  - Features: AudioContext, oscillators, filters, compressors, convolution reverb

- Media Capture API - Microphone and tab audio recording
  - Implementation: `projects/4-track/js/recorder.js`
  - Methods: `navigator.mediaDevices.getUserMedia()`, `navigator.mediaDevices.getDisplayMedia()`

- Canvas API - Particle systems and visualizations
  - Implementation: `index.html`, `projects/4-track/js/visualizer.js`

## Data Storage

**Databases:**
- None - No backend database

**File Storage:**
- Local filesystem only (browser downloads)
- Implementation: Export functionality in `projects/4-track/index.html` for audio mixdowns

**Caching:**
- Browser LocalStorage - User preferences and session data
  - Implementation: `projects/dnd-dm-screen/5etools-v2.23.0/js/utils.js`, `projects/dnd-dm-screen/5etools-v2.23.0/js/styleswitch.js`

- IndexedDB - Offline D&D reference data
  - Client: localforage library (vendored at `projects/dnd-dm-screen/5etools-v2.23.0/lib/localforage.js`)
  - Implementation: `projects/dnd-dm-screen/5etools-v2.23.0/js/utils.js`

- SessionStorage - Temporary session state
  - Implementation: `projects/dnd-dm-screen/5etools-v2.23.0/js/utils.js`

## Authentication & Identity

**Auth Provider:**
- None - Static site with no user authentication
  - Notion API key used only in archived build script (not in production)

## Monitoring & Observability

**Error Tracking:**
- None - Browser console only

**Logs:**
- Browser console.log statements throughout codebase
- No centralized logging service

## CI/CD & Deployment

**Hosting:**
- GitHub Pages
  - URL: https://pebaum.github.io
  - Configuration: `.github/workflows/static.yml`

**CI Pipeline:**
- GitHub Actions
  - Workflow: Deploy static content on push to master
  - Config: `.github/workflows/static.yml`
  - Actions: checkout@v4, configure-pages@v5, upload-pages-artifact@v3, deploy-pages@v4
  - Triggers: Push to master branch, manual workflow_dispatch

## Environment Configuration

**Required env vars:**
- None in production (static site)
- Notion API key required for archived build script (not actively used)

**Secrets location:**
- No production secrets
- Build-time secrets would be in GitHub Actions (if build script were active)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Data Sources

**Static JSON:**
- D&D 5e Reference Data - Loaded via fetch from `projects/dnd-dm-screen/5etools-v2.23.0/data/`
  - Implementation: `projects/dnd-dm-screen/js/data-loader.js`
  - Files: monsters, spells, conditions, classes, items (JSON format)
  - Note: Requires HTTP server for local development (CORS restrictions on `file://` protocol)

**Audio Files:**
- Stone.mp3 - Background audio file at root (22.5 MB)

---

*Integration audit: 2026-01-18*
