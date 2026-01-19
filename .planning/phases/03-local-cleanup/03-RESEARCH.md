# Phase 3: Local Cleanup - Research

**Researched:** 2026-01-19
**Domain:** Git repository cleanup and local filesystem synchronization
**Confidence:** HIGH

## Summary

Phase 3 involves cleaning up the original monorepo after successful migration to distributed repositories. The research identified that this is a straightforward git workflow operation with minimal complexity: verifying repository clones, staging deletions, and committing cleanup.

The current state shows that files have been deleted from the working directory but not yet staged in git. The target directory `C:\GitHub Repos\` already contains all 11 cloned repositories (the 10 migrated projects plus the-duel-boardgame created during Phase 2). Commander-deck-builder folder does not exist, so LOCL-03 is already satisfied.

The primary risk is accidentally staging unintended deletions or missing verification steps that ensure cloned repositories are complete and functional before removing source folders.

**Primary recommendation:** Use git's standard deletion workflow with verification steps before and after staging changes. Always verify cloned repositories are complete before committing deletions to the original monorepo.

## Standard Stack

This phase uses standard git commands and Windows filesystem tools. No external libraries required.

### Core Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git | 2.x | Version control operations | Built into git, official tool for repository management |
| git-fsck | built-in | Repository integrity verification | Official git tool for checking repository health |
| bash/cmd | native | Filesystem operations | Standard shell for Windows git operations |

### Common Git Commands
| Command | Purpose | When to Use |
|---------|---------|-------------|
| `git status` | Check working directory state | Before and after operations to verify changes |
| `git rm -r` | Remove directories from git | When removing tracked folders |
| `git add -A` | Stage all changes including deletions | After removing untracked folders to stage deletions |
| `git commit` | Record changes | After verifying all deletions are correct |
| `git fsck` | Verify repository integrity | After cloning to ensure complete transfer |
| `git remote -v` | Verify remote connections | To confirm clones are properly configured |

**Installation:**
No installation needed - uses built-in git commands.

## Architecture Patterns

### Recommended Cleanup Workflow
```
1. Verification Phase
   ├── Verify all target repos are cloned
   ├── Check repository integrity with git fsck
   └── Confirm remote connections

2. Deletion Phase
   ├── Stage deletions in git
   ├── Verify correct files staged
   └── Commit cleanup

3. Validation Phase
   └── Confirm only intended folders remain
```

### Pattern 1: Pre-Deletion Verification
**What:** Verify cloned repositories are complete before removing source
**When to use:** Before any deletion operations
**Example:**
```bash
# Source: https://git-scm.com/docs/git-fsck
# For each cloned repository
cd "/c/GitHub Repos/[project-name]"
git fsck                    # Verify integrity
git remote -v              # Verify remote connection
git status                 # Check for uncommitted changes
```

### Pattern 2: Safe Deletion Staging
**What:** Stage deletions with verification at each step
**When to use:** When removing multiple folders from repository
**Example:**
```bash
# Source: https://git-scm.com/docs/git-rm
cd /c/pebaum.github.io

# Check current state
git status

# Stage all deletions (files already removed from working directory)
git add -A

# Verify what's staged
git status

# If everything looks correct, commit
git commit -m "chore: remove migrated project folders

Removed projects now in separate repositories:
- 4-track (now in 4-track-tape-looper)
- ps4-synth (now in dualshock-synth)
- forward-playground (now in forward-boardgame)
- gelatinous-cube-puzzle-wip (now in gelatinous-cube-puzzle)
- nova3-clone-wip (now in nova4)
- the-duel (now in the-duel-boardgame)

All projects verified as cloned and functional."
```

### Pattern 3: Post-Cleanup Validation
**What:** Verify repository state after cleanup
**When to use:** After committing deletions
**Example:**
```bash
# Source: Git best practices
# Verify only intended folders remain
ls projects/

# Expected output:
# benji-site/
# dnd-dm-screen/
# drift/
# dualshock-synth/
# 4-track-tape-looper/
# forward-boardgame/
# gelatinous-cube-puzzle/
# granular-ambient/
# interactive-art/
# nova4/
# textscape/
# the-duel-boardgame/

# Note: New project folders (with full names) remain
# Old project folders (with -wip suffixes or abbreviated names) are removed
```

### Anti-Patterns to Avoid
- **Using git clean -f -d on tracked files:** git clean only works on untracked files. For tracked files that are already deleted from working directory, use `git add -A` to stage deletions.
- **Using git rm on already-deleted files:** If files are already removed from working directory, git rm will fail. Use `git add -A` to stage the deletions instead.
- **Committing before verification:** Always verify cloned repositories are complete before committing deletions of source folders.
- **Force operations without dry run:** Never use force flags (-f) without first using dry run (-n) or verification steps.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repository integrity checking | Custom file comparison scripts | `git fsck` | Checks object database integrity, connectivity, and validates SHA-1 hashes - catches corruption that file listing misses |
| Verifying clone completeness | Manual file counting | `git remote -v` + `git status` + `git fsck` | Verifies remote connection, working directory state, and database integrity in one workflow |
| Staging many deletions | Individual git rm commands | `git add -A` | Stages all changes including deletions in one command, less error-prone |
| Finding repository differences | DIY diff scripts | `git diff origin/main` | Built-in comparison shows exact differences between local and remote |
| Path handling on Windows | String replacement for slashes | Git Bash automatic conversion | Git Bash handles Windows-to-POSIX path conversion automatically |

**Key insight:** Git provides comprehensive verification and staging tools specifically designed for these operations. Custom scripts miss edge cases like object database corruption, unreachable objects, and SHA-1 hash mismatches.

## Common Pitfalls

### Pitfall 1: Deleting Source Before Verifying Clones
**What goes wrong:** Commit deletions before confirming cloned repositories are complete and functional.
**Why it happens:** Assumption that git clone always succeeds completely.
**How to avoid:**
- Run `git fsck` in each cloned repository to verify integrity
- Check for "hash mismatch" or "missing object" errors
- Verify remote connection with `git remote -v`
- Confirm no uncommitted changes with `git status`
**Warning signs:**
- Git fsck shows errors about unreachable or missing objects
- Cloned repository size significantly differs from source
- Git remote -v returns nothing or wrong URL

### Pitfall 2: Windows Path Handling Confusion
**What goes wrong:** Mixing Windows backslashes and POSIX forward slashes causes operations to fail or target wrong files.
**Why it happens:** Git Bash uses POSIX paths, but Windows tools require backslashes.
**How to avoid:**
- In Git Bash, always use forward slashes: `/c/GitHub Repos/project-name/`
- Use quotes around paths with spaces: `"/c/GitHub Repos/project name/"`
- Let Git Bash handle conversion automatically - don't try to manually convert
**Warning signs:**
- "No such file or directory" errors despite path existing
- Operations work in Windows Explorer but fail in Git Bash
- Paths with spaces break commands

### Pitfall 3: Staging Wrong Files
**What goes wrong:** Accidentally staging unintended deletions or modifications along with intended cleanup.
**Why it happens:** Using `git add -A` without reviewing current git status first.
**How to avoid:**
- Always run `git status` before staging to see what will be staged
- Review the output carefully - look for unexpected deletions
- Use `git status` again after staging to verify what's staged
- If wrong files are staged, use `git restore --staged <file>` to unstage
**Warning signs:**
- Git status shows deletions of benji-site or archive folders
- More files staged than expected
- Modifications to files you didn't change

### Pitfall 4: Incomplete Commit Messages
**What goes wrong:** Vague commit message doesn't document what was deleted and why.
**Why it happens:** Rushing through cleanup operations.
**How to avoid:**
- List all deleted folders explicitly in commit message
- Reference that they now exist in separate repositories
- Include verification that clones are complete
- Follow conventional commit format: `chore: remove migrated project folders`
**Warning signs:**
- Future confusion about why folders were deleted
- Difficulty tracing which folders went to which repositories
- Unclear whether deletion was intentional or accidental

### Pitfall 5: Commander-Deck-Builder Assumption
**What goes wrong:** Trying to delete a folder that doesn't exist (commander-deck-builder).
**Why it happens:** Requirements mention it but it may have been deleted previously or never existed.
**How to avoid:**
- Check if folder exists before trying to delete it
- Use `find` or `ls` to verify folder presence first
- Don't treat requirement as "must delete" - treat as "must ensure deleted"
**Warning signs:**
- File not found errors when trying to delete
- Grep/find commands return no results

### Pitfall 6: Forgetting to Verify Remaining Folders
**What goes wrong:** Delete too much or too little, leaving repository in incorrect state.
**Why it happens:** Not checking final state against requirements.
**How to avoid:**
- After cleanup, list remaining folders explicitly
- Verify benji-site remains (requirement PORT-02)
- Verify archive remains (requirement PORT-03)
- Confirm all migrated project folders are gone
**Warning signs:**
- Old project folders with -wip or abbreviated names still present
- Benji-site or archive accidentally deleted
- Projects/ folder structure doesn't match requirements

## Code Examples

Verified patterns from official sources:

### Verify Clone Integrity
```bash
# Source: https://git-scm.com/docs/git-fsck
# Run in each cloned repository
cd "/c/GitHub Repos/4-track-tape-looper"
git fsck

# Expected output (healthy repo):
# Checking object directories: 100% (256/256), done.
# Checking objects: 100% (1234/1234), done.
# (no errors about missing or unreachable objects)

# Verify remote connection
git remote -v
# Expected output:
# origin  https://github.com/pebaum/4-track-tape-looper.git (fetch)
# origin  https://github.com/pebaum/4-track-tape-looper.git (push)
```

### Stage Deletions Safely
```bash
# Source: https://git-scm.com/docs/git-rm (adapted for already-deleted files)
cd /c/pebaum.github.io

# Step 1: Check what git sees
git status
# Shows: deleted: projects/4-track/index.html (and many others)

# Step 2: Stage all deletions
git add -A

# Step 3: Verify what's staged
git status
# Shows staged deletions only (no unintended files)

# Step 4: Commit if verified
git commit -m "chore: remove migrated project folders"
```

### Verify Specific Folder Exists
```bash
# Source: Standard bash practices
# Check if commander-deck-builder exists before trying to delete
if [ -d "commander-deck-builder" ]; then
    echo "Folder exists, will be deleted"
    rm -rf commander-deck-builder
else
    echo "Folder does not exist (already deleted or never existed)"
fi
```

### Compare Local and Remote Repository
```bash
# Source: https://git-scm.com/docs/git-ls-remote
# Verify local clone matches remote without fetching
cd "/c/GitHub Repos/4-track-tape-looper"

# Get remote HEAD commit
git ls-remote origin HEAD

# Get local HEAD commit
git rev-parse HEAD

# If hashes match, clone is up-to-date
# If they don't match, clone may be incomplete or behind
```

### List Remaining Folders After Cleanup
```bash
# Source: Standard bash practices
cd /c/pebaum.github.io

# List only directories in projects/
ls -d projects/*/

# Verify against requirements:
# MUST remain: benji-site, dnd-dm-screen, drift, dualshock-synth,
#              4-track-tape-looper, forward-boardgame, gelatinous-cube-puzzle,
#              granular-ambient, interactive-art, nova4, textscape, the-duel-boardgame
# MUST be gone: 4-track, ps4-synth, forward-playground,
#               gelatinous-cube-puzzle-wip, nova3-clone-wip, the-duel
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| git filter-branch | git filter-repo | 2019+ | 10-720x faster for history rewriting (not needed for this phase) |
| Manual file comparison | git fsck | Always standard | Catches object database corruption that file comparison misses |
| git rm on deleted files | git add -A | Always standard | Stages deletions of already-removed files without error |
| Backslash paths in Git Bash | Forward slash POSIX paths | Git Bash default | Automatic conversion, less error-prone |

**Deprecated/outdated:**
- git filter-branch: Slow and complex, replaced by git filter-repo for history rewriting
- Manual path separator conversion: Git Bash handles this automatically
- Individual git rm commands for many files: git add -A is more efficient

**Current best practice (2025):**
- Use `git fsck` for integrity verification (not manual file checking)
- Use `git add -A` to stage deletions of already-removed files
- Use Git Bash's automatic path handling (don't manually convert)
- Always verify before committing deletions

## Open Questions

Things that couldn't be fully resolved:

1. **Exact state of git working directory vs index**
   - What we know: Git status shows deleted files but they aren't staged
   - What's unclear: Whether files were removed with `rm` or `git rm`
   - Recommendation: Use `git add -A` which works regardless of how files were deleted

2. **Commander-deck-builder historical existence**
   - What we know: Folder doesn't exist now, requirement mentions deleting it
   - What's unclear: Whether it existed before and was already deleted
   - Recommendation: Check for folder, delete if exists, skip if not (use conditional)

3. **Timing of repository clones**
   - What we know: All repos exist in C:\GitHub Repos\ already
   - What's unclear: Whether they were cloned as part of Phase 2 or earlier
   - Recommendation: Verify integrity regardless of when they were cloned

## Sources

### Primary (HIGH confidence)
- Official Git Documentation (git-scm.com/docs/git-rm) - git rm command options and best practices
- Official Git Documentation (git-scm.com/docs/git-fsck) - Repository integrity verification
- WebFetch: git-scm.com/docs/git-rm - Confirmed -r flag requirement, --cached option, safety constraints
- WebFetch: git-scm.com/docs/git-fsck - Confirmed integrity checking methodology

### Secondary (MEDIUM confidence)
- WebSearch: "git remove directory safely stage deletion best practices 2025" - Cross-verified git rm usage patterns, confirmed git add -A for staging deletions
- WebSearch: "verify git clone successful integrity check 2025" - Confirmed git fsck workflow, git remote -v verification
- WebSearch: "git clean repository remove folders commit practices 2025" - Confirmed git clean is NOT appropriate for already-deleted tracked files
- WebSearch: "git Windows file path spaces backslash best practices 2025" - Confirmed Git Bash path handling, quote usage for spaces
- WebSearch: "verify git repository cloned correctly compare local remote 2025" - Confirmed git ls-remote comparison technique
- WebSearch: "git monorepo cleanup remove folders preserve history best practices 2025" - Confirmed standard deletion workflow (history rewriting not needed here)
- WebSearch: "git commit large deletion organized strategy multiple folders 2025" - Confirmed commit message best practices for large deletions

### Tertiary (LOW confidence)
- None - all findings verified with official documentation or multiple agreeing sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using built-in git commands, verified with official documentation
- Architecture: HIGH - Standard git workflow patterns, well-documented
- Pitfalls: HIGH - Common issues verified across multiple sources and official docs

**Research date:** 2026-01-19
**Valid until:** 60 days (stable git commands, unlikely to change)

## Current State Analysis

Based on investigation of the repository:

**What exists now:**
- `C:\GitHub Repos\` contains all 11 repositories (10 migrated + the-duel-boardgame)
- Original monorepo has files deleted from working directory but not staged
- Git status shows ~150+ deleted files across 6 old project folders
- Commander-deck-builder folder does not exist (LOCL-03 already satisfied)
- Archive and benji-site folders exist and should remain

**Old folders to remove (deleted from working directory, need staging):**
- projects/4-track (migrated to 4-track-tape-looper)
- projects/ps4-synth (migrated to dualshock-synth)
- projects/forward-playground (migrated to forward-boardgame)
- projects/gelatinous-cube-puzzle-wip (migrated to gelatinous-cube-puzzle)
- projects/nova3-clone-wip (migrated to nova4)
- projects/the-duel (migrated to the-duel-boardgame)

**New folders that should remain:**
- projects/benji-site (required by PORT-02)
- projects/dnd-dm-screen (migrated and cloned)
- projects/drift (migrated and cloned)
- projects/dualshock-synth (migrated and cloned)
- projects/4-track-tape-looper (migrated and cloned)
- projects/forward-boardgame (migrated and cloned)
- projects/gelatinous-cube-puzzle (migrated and cloned)
- projects/granular-ambient (migrated and cloned)
- projects/interactive-art (migrated to generative-web-art, but folder remains)
- projects/nova4 (migrated and cloned)
- projects/textscape (migrated and cloned)
- projects/the-duel-boardgame (migrated and cloned)

**Root folders that should remain:**
- archive/ (required by PORT-03)
- assets/ (portfolio assets)
- .github/ (workflows)
- .planning/ (this documentation)

**Next actions needed:**
1. Verify all 11 cloned repositories with git fsck
2. Stage deletions with git add -A
3. Verify staging with git status
4. Commit cleanup with descriptive message
5. Validate final state matches requirements
