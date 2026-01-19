# Codebase Concerns

**Analysis Date:** 2026-01-18

## Tech Debt

**Deprecated API in Textscape:**
- Issue: `selectScale()` function deprecated but still exists for backward compatibility
- Files: `projects/textscape/js/mapping/parameter-mapper.js` (line 180-184)
- Impact: Code maintainability degraded, potential for developers to use old API
- Fix approach: Remove deprecated function after ensuring all callers use `TonalCenterCalculator.calculateTonalCenter()`

**Drift versioning proliferation:**
- Issue: Seven separate versions of Drift project (v1-v7) with duplicated code and no clear migration path
- Files: `projects/drift/Drift v1/`, `projects/drift/Drift v2/`, ..., `projects/drift/Drift v7/`
- Impact: Difficult to maintain bug fixes across versions, unclear which is canonical, consumes excessive storage
- Fix approach: Archive old versions, document progression, consolidate shared code into libraries

**Missing modularization in 4-track:**
- Issue: All JavaScript in single-file classes without module bundler or build process
- Files: `projects/4-track/js/recorder.js` (660 lines), `projects/4-track/js/ui.js` (515 lines)
- Impact: Difficult to test individual components, no tree-shaking or optimization
- Fix approach: Migrate to ES modules with import/export, add bundler like Vite or esbuild

**Large monolithic HTML files:**
- Issue: Drift v3 has 6322-line HTML file with inline JavaScript and CSS
- Files: `projects/drift/Drift v3/index.html` (6322 lines)
- Impact: Slow to load, impossible to maintain, no code reuse
- Fix approach: Extract JavaScript to separate files, use CSS preprocessor, modularize components

**No dependency management for most projects:**
- Issue: Only root `package.json` exists, individual projects have no dependency tracking
- Files: Root `package.json` only lists `@notionhq/client`
- Impact: No version locking for browser libraries, difficult to audit security
- Fix approach: Add package.json to each project with explicit dependencies

## Known Bugs

**Audio context state warnings:**
- Symptoms: Console warnings "AudioContext not running" in Drift projects
- Files: `projects/drift/Drift v3/index.html` (line 4791), `projects/drift/Drift v1/index-v2.html` (line 2466), `projects/drift/Drift v2/index.html` (line 2591)
- Trigger: Browsers require user interaction before AudioContext resumes
- Workaround: Wrapped in try-catch but logs warnings

**Microphone permission not requested automatically:**
- Symptoms: 4-track recorder doesn't auto-request mic access
- Files: `projects/4-track/js/recorder.js` (line 222 error handler)
- Trigger: User must manually select audio source
- Workaround: UI requires explicit user selection, documented as intentional design

**Search path detection fragility:**
- Symptoms: DND DM Screen search fails when run from file:// protocol
- Files: `projects/dnd-dm-screen/js/data-loader.js` (line 23-56 path detection)
- Trigger: Opening HTML file directly instead of via web server
- Workaround: Test page (`test-search.html`) provides diagnostic messages

**Oscillator errors in Drift v3:**
- Symptoms: Occasional console errors "Oscillator error"
- Files: `projects/drift/Drift v3/index.html` (line 5176)
- Trigger: Rapid stopping/starting of audio nodes
- Workaround: Wrapped in try-catch, errors suppressed

## Security Considerations

**Sensitive config files in .gitignore but potentially committed:**
- Risk: API tokens and credentials could be exposed if .gitignore added after files committed
- Files: `.gitignore` lists `.mcp.json`, `projects/textscape/tools/config.js`
- Current mitigation: Files in .gitignore
- Recommendations: Add pre-commit hook to scan for tokens, use environment variables instead

**No Content Security Policy:**
- Risk: XSS vulnerabilities if user input rendered without sanitization
- Files: All HTML files lack CSP meta tags
- Current mitigation: None detected
- Recommendations: Add CSP headers/meta tags to all production HTML

**LocalStorage usage without encryption:**
- Risk: Initiative tracker stores combat data in plain text localStorage
- Files: `projects/dnd-dm-screen/js/initiative-tracker.js` (line 54 loads state)
- Current mitigation: Data is non-sensitive (game stats)
- Recommendations: Document data stored, add clear data button

**CORS issues with file:// protocol:**
- Risk: Browser security prevents loading JSON files locally
- Files: `projects/dnd-dm-screen/js/data-loader.js` warns but doesn't block
- Current mitigation: Warning logged to console
- Recommendations: Add prominent message in UI when file:// detected

## Performance Bottlenecks

**Massive reverb impulse generation:**
- Problem: 15-second reverb impulse generated synchronously on init
- Files: `projects/4-track/js/recorder.js` (line 67-70)
- Cause: Large buffer allocation blocks main thread
- Improvement path: Generate impulse in Web Worker or use pre-rendered IR file

**Large JSON data files loaded synchronously:**
- Problem: DND DM Screen loads 4+ large JSON files on startup
- Files: `projects/dnd-dm-screen/js/data-loader.js` fetches all data upfront
- Cause: No lazy loading or pagination for monster/spell databases
- Improvement path: Implement progressive loading, index by first letter, or use IndexedDB

**Unoptimized search algorithm:**
- Problem: Linear search through entire monster/spell arrays on every keystroke
- Files: `projects/dnd-dm-screen/js/search-engine.js` (line 64 debounce 200ms)
- Cause: No indexing, simple includes() matching
- Improvement path: Build search index with Fuse.js or similar, use Web Worker

**Canvas visualizer running at 60fps always:**
- Problem: Visualizer animates continuously even when not visible
- Files: `projects/4-track/js/visualizer.js` starts animation on init
- Cause: No pause when tab inactive or visualizer off-screen
- Improvement path: Use Intersection Observer, pause on document.hidden

**Text emotion database loads 250k+ word entries:**
- Problem: Textscape loads massive word-emotion database into memory
- Files: `projects/textscape/data/word-emotion-database.json` (massive file)
- Cause: No filtering or on-demand lookup
- Improvement path: Split into chunks by first letter, load only needed entries

## Fragile Areas

**Audio node cleanup in 4-track:**
- Files: `projects/4-track/js/track.js`, `projects/4-track/js/recorder.js`
- Why fragile: Complex audio graph with sources, effects chains, and buses; missing disconnect() can cause memory leaks
- Safe modification: Always disconnect nodes before creating new sources, use try-finally blocks
- Test coverage: No automated tests for audio node lifecycle

**5etools integration (massive external codebase):**
- Files: `projects/dnd-dm-screen/5etools-v2.23.0/` (entire framework)
- Why fragile: Third-party codebase with 100+ files, no version control, unclear update path
- Safe modification: Treat as black box, only modify data conversion scripts
- Test coverage: No tests, manual testing required

**Drift interconnect logic:**
- Files: `projects/drift/Drift v2/index.html` (lines 1950-2140 musical interconnects)
- Why fragile: Complex musical logic with timing dependencies, retrograde/inversion calculations
- Safe modification: Any changes to note timing affect all interconnect patterns
- Test coverage: No tests

**Path detection across GitHub Pages vs localhost:**
- Files: `projects/dnd-dm-screen/js/data-loader.js` (line 23-56)
- Why fragile: String matching on URLs, different behavior for file://, localhost, github.io
- Safe modification: Test on all three environments before deploying
- Test coverage: Manual only, no automated cross-environment tests

## Scaling Limits

**Browser memory for audio buffers:**
- Current capacity: Limited testing with 4 concurrent tracks in 4-track app
- Limit: Browser tab crashes with 10+ minutes of recorded audio per track
- Scaling path: Implement track offloading to IndexedDB, clear old buffers

**Number of Drift agents:**
- Current capacity: 12 agents in Drift v4
- Limit: AudioContext performance degrades with 20+ simultaneous synth voices
- Scaling path: Agent pooling, voice stealing algorithm, reduce polyphony

**Search result display:**
- Current capacity: Shows 5 results per category
- Limit: UI becomes unusable with 100+ monster results
- Scaling path: Virtual scrolling, pagination, better filtering

## Dependencies at Risk

**No external dependencies in production:**
- Risk: All projects use vanilla JavaScript, no vulnerability to supply chain attacks
- Impact: Minimal - this is actually a strength
- Migration plan: N/A - intentional design choice

**5etools version locked at v2.23.0:**
- Risk: No security updates, bug fixes, or new content from upstream
- Impact: DND DM Screen uses potentially stale D&D data
- Migration plan: Document upgrade process, create data migration script

**Web Audio API browser compatibility:**
- Risk: Projects rely heavily on Web Audio API without feature detection
- Impact: Breaks completely in older browsers
- Migration plan: Add polyfills or graceful degradation

## Missing Critical Features

**No save/load for 4-track sessions:**
- Problem: Users lose all work when closing browser
- Blocks: Cannot share projects, collaborate, or resume work
- Priority: High

**No error recovery in audio engine:**
- Problem: AudioContext errors crash entire music generation
- Blocks: Poor user experience, no retry mechanism
- Priority: Medium

**No mobile responsiveness:**
- Problem: Console mixer UI designed for desktop only
- Blocks: Cannot use on tablets or phones
- Priority: Medium

**No accessibility features:**
- Problem: No ARIA labels, keyboard navigation incomplete
- Blocks: Screen reader users cannot use applications
- Priority: Medium

## Test Coverage Gaps

**Zero automated tests:**
- What's not tested: Entire codebase has no test suite
- Files: No `*.test.js` or `*.spec.js` files found
- Risk: Regressions go undetected, refactoring is dangerous
- Priority: High

**No CI/CD pipeline:**
- What's not tested: No automated checks on commit
- Files: `.github/workflows/` exists but contains no CI config
- Risk: Broken code can be deployed to production
- Priority: Medium

**Manual testing only for audio:**
- What's not tested: All Web Audio functionality requires manual listening
- Files: All audio engine files
- Risk: Subtle audio bugs (clicks, distortion) may go unnoticed
- Priority: Low (hard to automate audio testing)

---

*Concerns audit: 2026-01-18*
