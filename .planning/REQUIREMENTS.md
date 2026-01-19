# Requirements: Portfolio Repository Migration

**Defined:** 2026-01-19
**Core Value:** Projects become independently maintainable and deployable while preserving all existing portfolio functionality and URLs

## v1 Requirements

Requirements for complete migration. Each maps to roadmap phases.

### Repository Creation

- [ ] **REPO-01**: Create 10 new GitHub repositories with exact folder names
- [ ] **REPO-02**: Each repository created under same GitHub account
- [ ] **REPO-03**: GitHub Pages enabled for each repository
- [ ] **REPO-04**: Each project accessible at pebaum.github.io/[project-name]/

### File Migration

- [ ] **MIGR-01**: Move 4-track project files to new repo
- [ ] **MIGR-02**: Move dnd-dm-screen project files to new repo
- [ ] **MIGR-03**: Move drift (all versions) to single new repo
- [ ] **MIGR-04**: Move generative-web-art (interactive-art) files to new repo
- [ ] **MIGR-05**: Move granular-ambient project files to new repo
- [ ] **MIGR-06**: Move ps4-synth project files to new repo
- [ ] **MIGR-07**: Move textscape project files to new repo
- [ ] **MIGR-08**: Move the-duel project files to new repo
- [ ] **MIGR-09**: Move forward-playground project files to new repo
- [ ] **MIGR-10**: Move nova3-clone-wip project files to new repo

### Local Setup

- [ ] **LOCL-01**: Clone all new repos to C:\GitHub Repos\[project-name]\
- [ ] **LOCL-02**: Remove project folders from original portfolio repo
- [ ] **LOCL-03**: Delete commander-deck-builder folder completely

### Portfolio Updates

- [ ] **PORT-01**: Update all project links in index.html to new URLs
- [ ] **PORT-02**: Preserve benji-site in main portfolio repo
- [ ] **PORT-03**: Preserve archive folder in main portfolio repo
- [ ] **PORT-04**: Test all links work after migration

### Special Handling

- [ ] **SPEC-01**: Drift repo contains all 7 versions in organized structure
- [ ] **SPEC-02**: Drift repo has index allowing access to all versions
- [ ] **SPEC-03**: Interactive-art pieces combined into generative-web-art repo
- [ ] **SPEC-04**: Generative-web-art has index listing all pieces

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Project Enhancement

- **ENHC-01**: Add README.md to each project repository
- **ENHC-02**: Add package.json with dependencies to each project
- **ENHC-03**: Set up build processes for projects that need them
- **ENHC-04**: Add .gitignore files appropriate to each project
- **ENHC-05**: Fix identified tech debt in individual projects

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Custom domains | Using GitHub Pages default URLs is sufficient |
| CI/CD pipelines | Not needed for static projects |
| Dependency updates | Move as-is, modernize later |
| Code cleanup | Preserve current state, refactor post-migration |
| Documentation | Add READMEs in v2, not during migration |
| Bug fixes | Migrate bugs and all, fix later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REPO-01 | Phase 1 | Pending |
| REPO-02 | Phase 1 | Pending |
| REPO-03 | Phase 1 | Pending |
| REPO-04 | Phase 1 | Pending |
| MIGR-01 | Phase 2 | Pending |
| MIGR-02 | Phase 2 | Pending |
| MIGR-03 | Phase 2 | Pending |
| MIGR-04 | Phase 2 | Pending |
| MIGR-05 | Phase 2 | Pending |
| MIGR-06 | Phase 2 | Pending |
| MIGR-07 | Phase 2 | Pending |
| MIGR-08 | Phase 2 | Pending |
| MIGR-09 | Phase 2 | Pending |
| MIGR-10 | Phase 2 | Pending |
| LOCL-01 | Phase 3 | Pending |
| LOCL-02 | Phase 3 | Pending |
| LOCL-03 | Phase 3 | Pending |
| PORT-01 | Phase 4 | Pending |
| PORT-02 | Phase 4 | Pending |
| PORT-03 | Phase 4 | Pending |
| PORT-04 | Phase 4 | Pending |
| SPEC-01 | Phase 2 | Pending |
| SPEC-02 | Phase 2 | Pending |
| SPEC-03 | Phase 2 | Pending |
| SPEC-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-19*
*Last updated: 2026-01-19 after initial definition*