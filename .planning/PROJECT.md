# Portfolio Repository Migration

## What This Is

A migration project to split the monorepo portfolio site (pebaum.github.io) into a hub-and-spoke architecture with 10 separate project repositories. Each project will have its own GitHub repo, deploy to its own GitHub Pages site at pebaum.github.io/[project-name]/, and the main portfolio will link to these independent project sites.

## Core Value

Projects become independently maintainable and deployable while preserving all existing portfolio functionality and URLs.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Each of 10 projects migrated to its own repository
- [ ] Each project repository deploys to GitHub Pages at pebaum.github.io/[project-name]/
- [ ] All projects moved to C:\GitHub Repos\[project-name]\ local folders
- [ ] Main portfolio links updated to point to new project URLs
- [ ] Drift project contains all 7 versions in one repo with version selector
- [ ] Interactive-art pieces consolidated into generative-web-art repo
- [ ] Original portfolio functionality preserved (no broken features)
- [ ] Commander-deck-builder folder removed
- [ ] Archive and benji-site remain in main portfolio repo

### Out of Scope

- [ ] Adding README files to projects — handle post-migration
- [ ] Setting up build processes — move as-is
- [ ] Fixing existing bugs/tech debt — preserve current state
- [ ] Adding package.json to projects — handle post-migration
- [ ] Cleaning up Drift versions — keep all 7 as-is
- [ ] Custom domains — use GitHub Pages project sites

## Context

The current monorepo contains 12+ projects totaling 300MB+, with the D&D DM Screen alone at 202MB. This makes the repo unwieldy, slow to clone, and difficult to maintain individual projects. Some projects have significant tech debt (6000+ line HTML files, 7 versions of Drift with duplicated code) but the goal is to migrate first, improve later.

Projects to migrate:
1. 4-track (112KB) - Audio multitrack recorder
2. dnd-dm-screen (202MB) - D&D 5e reference tool
3. drift (1.2MB) - All 7 versions of generative ambient music
4. generative-web-art - Collection of 7 interactive art pieces
5. granular-ambient (88KB) - Granular synthesis experiment
6. ps4-synth (104KB) - Gamepad-controlled synthesizer
7. textscape (109MB) - Text-to-music generator
8. the-duel - Game project
9. forward-playground (312KB) - WIP project
10. nova3-clone-wip (2.2MB) - WIP project

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
| Move files as-is without cleanup | Faster migration, fix issues post-migration | — Pending |
| Keep all Drift versions in one repo | Preserve history, allow version comparison | — Pending |
| Combine interactive-art pieces into one repo | They're related small pieces, easier to maintain together | — Pending |
| Keep benji-site in main repo | Part of main portfolio, not a standalone project | — Pending |

---
*Last updated: 2026-01-19 after initialization*