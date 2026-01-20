# Portfolio Repository Migration

## What This Is

A successfully completed migration that transformed the monolithic portfolio site (pebaum.github.io) into a hub-and-spoke architecture with 10 independent project repositories. Each project now has its own GitHub repo, deploys to its own GitHub Pages site at pebaum.github.io/[project-name]/, and the main portfolio links to these distributed project sites.

## Core Value

Projects become independently maintainable and deployable while preserving all existing portfolio functionality and URLs.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

**v1.0 (2026-01-20):**
- ✓ Each of 10 projects migrated to its own repository — v1.0 (MIGR-01 through MIGR-10)
- ✓ Each project repository deploys to GitHub Pages at pebaum.github.io/[project-name]/ — v1.0 (REPO-03, REPO-04)
- ✓ All projects moved to C:\GitHub Repos\[project-name]\ local folders — v1.0 (LOCL-01)
- ✓ Main portfolio links updated to point to new project URLs — v1.0 (PORT-01, verified working)
- ✓ Drift project contains all 7 versions in one repo with version selector — v1.0 (SPEC-01, SPEC-02)
- ✓ Interactive-art pieces consolidated into generative-web-art repo — v1.0 (SPEC-03, SPEC-04)
- ✓ Original portfolio functionality preserved (no broken features) — v1.0 (manual verification)
- ✓ Commander-deck-builder folder removed — v1.0 (LOCL-03)
- ✓ Archive and benji-site remain in main portfolio repo — v1.0 (PORT-02, PORT-03)

### Active

<!-- Current scope. Building toward these. -->

(None — v1.0 complete, next milestone requirements TBD)

### Out of Scope

- [ ] Adding README files to projects — handle post-migration
- [ ] Setting up build processes — move as-is
- [ ] Fixing existing bugs/tech debt — preserve current state
- [ ] Adding package.json to projects — handle post-migration
- [ ] Cleaning up Drift versions — keep all 7 as-is
- [ ] Custom domains — use GitHub Pages project sites

## Context

**v1.0 Shipped (2026-01-20):** Successfully transformed the 300MB+ monorepo into a lightweight portfolio hub with 10 distributed project repositories. The main repository is now under 20MB, making it fast to clone and easy to maintain. Each project can evolve independently while maintaining all portfolio functionality.

**Migration Results:**
- Repository size: 300MB+ → <20MB (95% reduction)
- Lines removed: 7.2 million (content migrated, not deleted)
- Repositories created: 10 independent GitHub Pages deployments
- Timeline: 1 day from start to ship
- All 21 project links verified working

**Projects Successfully Migrated:**
1. 4-track-tape-looper - Audio multitrack recorder ✓
2. dnd-dm-screen - D&D 5e reference tool (202MB) ✓
3. drift - All 7 versions of generative ambient music ✓
4. generative-web-art - Collection of 7 interactive art pieces ✓
5. granular-ambient - Granular synthesis experiment ✓
6. dualshock-synth - Gamepad-controlled synthesizer ✓
7. textscape - Text-to-music generator (109MB) ✓
8. gelatinous-cube-puzzle - The duel game ✓
9. forward-boardgame - Forward playground WIP ✓
10. nova4 - Nova WIP project ✓

## Constraints

- **GitHub Pages**: Must use project sites pattern (username.github.io/repository-name/)
- **URL Preservation**: Existing links from portfolio must continue to work
- **Local Structure**: All repos must be in C:\GitHub Repos\ folder
- **Migration Order**: Portfolio link updates must happen last to avoid broken links
- **File Preservation**: Move everything as-is, no cleanup during migration

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Move files as-is without cleanup | Faster migration, fix issues post-migration | ✓ Good - Migration completed in 1 day |
| Keep all Drift versions in one repo | Preserve history, allow version comparison | ✓ Good - All 7 versions accessible with index |
| Combine interactive-art pieces into one repo | They're related small pieces, easier to maintain together | ✓ Good - generative-web-art repo with 7 pieces |
| Keep benji-site in main repo | Part of main portfolio, not a standalone project | ✓ Good - Portfolio integrity maintained |
| Use exact folder names for repos | Maintain traceability and consistency | ✓ Good - Clear 1:1 mapping |
| Enable Pages from master branch root | Simplest deployment configuration | ✓ Good - All sites deployed successfully |

---
*Last updated: 2026-01-20 after v1.0 milestone completion*