# Roadmap: Portfolio Repository Migration

## Overview

This roadmap transforms a monolithic 300MB+ portfolio repository into a hub-and-spoke architecture with 10 independent project repositories. The migration follows a sequential path: establish GitHub infrastructure, migrate project content with special handling for multi-version projects, clean up the original monorepo, and finally update portfolio links to point to the new distributed architecture.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Repository Setup** - Create GitHub repos and enable Pages
- [ ] **Phase 2: Content Migration** - Move projects to new repos with special handling
- [ ] **Phase 3: Local Cleanup** - Remove migrated folders from monorepo
- [ ] **Phase 4: Portfolio Integration** - Update links and verify functionality

## Phase Details

### Phase 1: Repository Setup
**Goal**: All GitHub infrastructure is ready to receive project content
**Depends on**: Nothing (first phase)
**Requirements**: REPO-01, REPO-02, REPO-03, REPO-04
**Success Criteria** (what must be TRUE):
  1. 10 new GitHub repositories exist with exact project folder names
  2. All repositories are under the same GitHub account
  3. GitHub Pages is enabled for each repository
  4. Each project is accessible at pebaum.github.io/[project-name]/
**Plans**: 1 plan in 1 wave

Plans:
- [x] 01-01-PLAN.md — Create 10 GitHub repositories and enable Pages

### Phase 2: Content Migration
**Goal**: All 10 projects exist in their own repositories with proper structure
**Depends on**: Phase 1
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04, MIGR-05, MIGR-06, MIGR-07, MIGR-08, MIGR-09, MIGR-10, SPEC-01, SPEC-02, SPEC-03, SPEC-04
**Success Criteria** (what must be TRUE):
  1. Each of the 10 projects has been moved to its own repository
  2. Drift repository contains all 7 versions in organized structure with version selector
  3. Generative-web-art repository contains all interactive-art pieces with index page
  4. All project files are preserved as-is without cleanup or modification
  5. Each repository deploys successfully to GitHub Pages
**Plans**: TBD

Plans:
- [ ] 02-01: [TBD - to be defined during planning]

### Phase 3: Local Cleanup
**Goal**: Original monorepo is cleaned up with only portfolio core remaining
**Depends on**: Phase 2
**Requirements**: LOCL-01, LOCL-02, LOCL-03
**Success Criteria** (what must be TRUE):
  1. All 10 new repositories are cloned to C:\GitHub Repos\[project-name]\
  2. Migrated project folders are removed from original portfolio repo
  3. Commander-deck-builder folder is completely deleted
  4. Benji-site and archive folders remain in main portfolio repo
**Plans**: TBD

Plans:
- [ ] 03-01: [TBD - to be defined during planning]

### Phase 4: Portfolio Integration
**Goal**: Portfolio site links to all distributed projects and everything works
**Depends on**: Phase 3
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04
**Success Criteria** (what must be TRUE):
  1. All project links in index.html point to new GitHub Pages URLs
  2. Benji-site remains functional in main portfolio repo
  3. Archive folder remains accessible in main portfolio repo
  4. All links have been manually tested and work correctly
  5. Original portfolio functionality is completely preserved
**Plans**: TBD

Plans:
- [ ] 04-01: [TBD - to be defined during planning]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Repository Setup | 1/1 | ✓ Complete | 2026-01-19 |
| 2. Content Migration | 0/TBD | Not started | - |
| 3. Local Cleanup | 0/TBD | Not started | - |
| 4. Portfolio Integration | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-19*
*Last updated: 2026-01-19 (Phase 1 complete)*
