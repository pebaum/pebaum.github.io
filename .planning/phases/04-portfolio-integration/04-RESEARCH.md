# Phase 4: Portfolio Integration - Research

**Researched:** 2026-01-19
**Domain:** HTML link updating, GitHub Pages URL structure, portfolio integration
**Confidence:** HIGH

## Summary

Phase 4 involves updating the main portfolio's index.html to point project links to their new GitHub Pages URLs, while preserving benji-site and archive folders in the main repository. This is a straightforward HTML link replacement task with specific URL mapping patterns.

The standard approach is to replace relative paths (e.g., `projects/4-track/index.html`) with absolute GitHub Pages URLs (e.g., `https://pebaum.github.io/4-track-tape-looper/`). Based on Phase 2 migration summaries, 10 projects were migrated to independent repositories with GitHub Pages enabled. The portfolio currently contains 21 project links, of which 10 need updating to new URLs, 1 (benji-site) remains in the main repo, and 10 need investigation.

**Primary recommendation:** Use sed for bulk find-replace operations on index.html with careful URL mapping, commit the change atomically, then manually test all links in browser with cache bypass.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| sed | Built-in | Text stream editing for bulk find-replace | Universal Unix/Linux text processing tool, ideal for HTML href pattern replacement |
| git | 2.x+ | Version control for atomic commits | Standard for tracking portfolio changes |
| Browser DevTools | N/A | Link testing and cache bypass | Built into all modern browsers, essential for validation |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| W3C Link Checker | Web-based | Automated broken link detection | Post-update validation (optional) |
| grep | Built-in | Pattern matching for link extraction | Pre-update audit of links to update |
| Hard refresh shortcuts | N/A | Cache bypass for testing | Ctrl+F5 (Windows), Cmd+Shift+R (Mac) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sed | Manual find-replace in editor | Editor safer for small changes, sed faster for bulk patterns |
| Manual testing | Automated link checker tools | Manual testing catches UX issues, automation catches 404s only |
| Absolute URLs | Relative URLs | Absolute URLs work across domains, relative break on GitHub Pages project repos |

**Installation:**
No installation needed - sed and git are standard Unix/Linux tools, already available in bash environment.

## Architecture Patterns

### GitHub Pages URL Structure

**User/Organization Page:**
- Repository: `username.github.io`
- URL: `https://username.github.io/`
- Purpose: Main portfolio site

**Project Pages:**
- Repository: `project-name`
- URL: `https://username.github.io/project-name/`
- Pattern: Every repository in account auto-hosts at `<username>.github.io/<repo_name>`

**Key Rules (from GitHub Docs):**
- User site repos must be named `username.github.io` (serves at root domain)
- All other repos serve at `https://username.github.io/<repo_name>/`
- This structure is immutable to prevent user conflicts
- Pages can take up to 10 minutes to build + 10 minutes for CDN propagation = 20 minutes total deploy time

### URL Mapping Pattern

Based on Phase 2 migration summaries, the mapping is:

```
OLD (monorepo relative):        NEW (GitHub Pages absolute):
projects/4-track/               https://pebaum.github.io/4-track-tape-looper/
projects/ps4-synth/             https://pebaum.github.io/dualshock-synth/
projects/drift/Drift v7/        https://pebaum.github.io/drift/v7/
projects/drift/Drift v[2-6]/    https://pebaum.github.io/drift/v[2-6]/
projects/granular-ambient/      https://pebaum.github.io/granular-ambient/
projects/textscape/             https://pebaum.github.io/textscape/
projects/interactive-art/*.html https://pebaum.github.io/generative-web-art/*.html
projects/dnd-dm-screen/         https://pebaum.github.io/dnd-dm-screen/
projects/the-duel/              https://pebaum.github.io/the-duel-boardgame/
projects/forward-playground/    https://pebaum.github.io/forward-boardgame/

PRESERVED (stays in main repo):
projects/benji-site/            (no change - remains relative)
```

**Special cases:**
- **Drift versions:** Organized as v1-v7 subdirectories, links point to `/drift/v[N]/` not individual repos
- **Interactive art:** 7 pieces migrated to generative-web-art gallery, links point to individual HTML files
- **Repository renames:** ps4-synth → dualshock-synth, the-duel → the-duel-boardgame, forward-playground → forward-boardgame
- **Entry point variations:** forward-boardgame has play.html entry but also includes redirect index.html

### Recommended Update Structure

**Step 1: Create mapping reference**
```bash
# Extract all current links for audit
grep -E 'href="projects/' index.html > links-audit.txt
```

**Step 2: Bulk replace with sed**
```bash
# Use | delimiter to avoid escaping / in URLs
# Replace one pattern at a time for safety

sed -i 's|href="projects/4-track/index.html"|href="https://pebaum.github.io/4-track-tape-looper/"|g' index.html
sed -i 's|href="projects/ps4-synth/index.html"|href="https://pebaum.github.io/dualshock-synth/"|g' index.html
# ... continue for each mapping
```

**Step 3: Verify changes**
```bash
# Check what changed
git diff index.html

# Count replacements
grep -c "pebaum.github.io" index.html
```

**Step 4: Test manually**
- Open index.html in browser
- Hard refresh (Ctrl+F5 / Cmd+Shift+R) to bypass cache
- Click each link to verify destination
- Check for 404s (nova4 expected, it's VST files only)

**Step 5: Commit atomically**
```bash
git add index.html
git commit -m "fix(portfolio): update project links to GitHub Pages URLs

- Update 10 migrated projects to pebaum.github.io/[repo] URLs
- Preserve benji-site relative link (remains in main repo)
- Drift versions point to /drift/v[N]/ subdirectories
- Interactive art pieces point to generative-web-art collection

All links manually tested and verified working."
```

### Anti-Patterns to Avoid

- **Mixing changes:** Don't update links AND make other changes in same commit (breaks atomic commit principle)
- **Skipping verification:** Always `git diff` before committing to catch typos in URLs
- **Relative paths for external repos:** GitHub Pages project repos require absolute URLs, relative paths will 404
- **Cached testing:** Browser cache can show old links working when they're broken - always hard refresh
- **Mass replace without mapping:** sed can replace wrong patterns if not specific enough (e.g., replacing all `/index.html` would break archive links)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Broken link detection | Custom crawler script | W3C Link Checker, BrokenLinkCheck.com | Edge cases: redirects (3xx), timeouts, DNS failures, HTTPS issues |
| URL validation | Regex patterns | Browser manual testing + DevTools Network tab | GitHub Pages CDN caching (10-30min), dynamic redirects, authentication states |
| Cache busting | Custom headers | Browser hard refresh shortcuts | Browser-specific cache behavior, ServiceWorkers, CDN layers |
| Bulk text replacement | Python/Node script | sed with specific patterns | sed is built-in, battle-tested, atomic, reversible with git |

**Key insight:** Link testing must account for CDN propagation delays (up to 20 minutes for GitHub Pages), browser caching, and redirect chains. Manual testing with hard refresh is more reliable than automated tools for immediate post-update validation.

## Common Pitfalls

### Pitfall 1: GitHub Pages CDN Caching Delays
**What goes wrong:** Links appear broken or point to old content immediately after update
**Why it happens:** GitHub Pages uses CDN with 10-20 minute propagation time for deploys
**How to avoid:** Wait 20 minutes after pushing changes before testing; use hard refresh to bypass browser cache
**Warning signs:** 404 errors on newly deployed repos, old content showing on recently updated projects

### Pitfall 2: Browser Cache Masking Broken Links
**What goes wrong:** Old links appear to work during testing but fail for new visitors
**Why it happens:** Browser caches pages and follows cached redirects even after URLs change
**How to avoid:** Always test with Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) hard refresh; consider testing in incognito/private mode
**Warning signs:** Links work in your browser but fail when teammate tests; links work until browser cache cleared

### Pitfall 3: Space-Containing URLs Breaking Links
**What goes wrong:** Links with spaces (e.g., `Drift v7`) return 404 or malformed URLs
**Why it happens:** Spaces in URLs must be encoded as %20; filesystem paths with spaces work locally but fail on web
**How to avoid:** Verify Phase 2 migrations removed spaces from directory names (v7 not "Drift v7"); use exact migration mapping
**Warning signs:** URLs with literal spaces in browser address bar, %20 appearing in some but not all links

### Pitfall 4: Incorrect Repository Name Mapping
**What goes wrong:** Links point to repos that don't exist (e.g., ps4-synth instead of dualshock-synth)
**Why it happens:** Projects were renamed during Phase 1 repository setup; folder names don't match repo names
**How to avoid:** Reference Phase 2 SUMMARY files for exact repository names; verify repos exist on GitHub before updating links
**Warning signs:** Consistent 404s on specific projects, repo-not-found errors on GitHub

### Pitfall 5: Forgetting benji-site and archive Preservation
**What goes wrong:** Accidentally updating benji-site links to external URL, breaking the preserved folder
**Why it happens:** Overly broad sed patterns or forgetting Phase 4 requirement to preserve these folders
**How to avoid:** Use specific sed patterns for each project; manually verify benji-site link stays relative
**Warning signs:** git diff shows benji-site or archive links changing when they shouldn't

### Pitfall 6: Multi-Version Projects Missing Index Path
**What goes wrong:** Drift links point to /drift/ root instead of /drift/v7/ (or specific version)
**Why it happens:** Drift has version selector at root; individual versions are in v[N]/ subdirectories
**How to avoid:** Map each Drift version link individually to /drift/v[N]/ path with trailing slash
**Warning signs:** Drift links show version selector page instead of specific version's synth interface

### Pitfall 7: Not Testing All Link Variants
**What goes wrong:** Some projects have multiple entry points (index.html vs play.html) that get missed
**Why it happens:** Assuming all projects follow same index.html pattern; forward-boardgame uses play.html
**How to avoid:** Audit all 21 links before updating; verify Phase 2 notes about alternate entry points
**Warning signs:** Link updates complete but some project links weren't included in sed commands

## Code Examples

Verified patterns from official sources and best practices:

### Safe sed Pattern for HTML href Replacement
```bash
# Source: sed best practices (nixCraft, 2025)
# Use | delimiter to avoid escaping / in URLs
# -i flag edits in-place (use -i.bak for backup on macOS)

sed -i 's|href="OLD_PATH"|href="NEW_URL"|g' index.html

# Example: Update 4-track link
sed -i 's|href="projects/4-track/index.html"|href="https://pebaum.github.io/4-track-tape-looper/"|g' index.html

# Verify change before committing
git diff index.html
```

### Extract Link Audit for Verification
```bash
# Source: grep best practices
# Extract all project links to audit what needs updating

grep -E 'href="projects/' index.html > links-before.txt

# After updates, extract again to compare
grep -E 'href="https://pebaum.github.io/' index.html > links-after.txt

# Count migrations
wc -l links-after.txt
```

### GitHub Pages URL Construction Pattern
```javascript
// Source: GitHub Pages documentation
// Pattern: https://<username>.github.io/<repository-name>/

const username = "pebaum";
const repoName = "4-track-tape-looper";
const githubPagesURL = `https://${username}.github.io/${repoName}/`;
// Result: https://pebaum.github.io/4-track-tape-looper/
```

### Hard Refresh for Cache Bypass Testing
```
Source: Browser cache testing best practices (2025)

Windows/Linux:
  Chrome/Firefox/Edge: Ctrl + F5 or Ctrl + Shift + R

Mac:
  All browsers: Cmd + Shift + R

Alternative (DevTools method):
  1. Open DevTools (F12)
  2. Right-click Reload button
  3. Select "Empty Cache and Hard Reload"

Incognito mode (cleanest test):
  - Ctrl+Shift+N (Windows) or Cmd+Shift+N (Mac)
  - Load portfolio page
  - Test all links without any cache interference
```

### Git Commit for Link Updates
```bash
# Source: Git commit best practices (2025)
# Use conventional commits format: type(scope): description

git add index.html
git commit -m "fix(portfolio): update project links to GitHub Pages URLs

- Update 10 migrated projects to https://pebaum.github.io/[repo]/ URLs
- Preserve benji-site relative link (remains in main repo)
- Map Drift versions to /drift/v[N]/ subdirectories
- Map interactive art to /generative-web-art/ gallery
- Account for renamed repos (ps4-synth→dualshock-synth, etc.)

All 21 links manually tested with hard refresh. GitHub Pages deployments
verified accessible. Expected 404 on nova4 (VST plugin, no HTML).

Fixes PORT-01, PORT-04"
```

### Link Testing Checklist Script
```bash
# Source: Manual testing best practices
# Systematic verification of all updated links

#!/bin/bash
# Test each link category

echo "Testing migrated project links..."
curl -I https://pebaum.github.io/4-track-tape-looper/ | grep "HTTP/"
curl -I https://pebaum.github.io/dualshock-synth/ | grep "HTTP/"
curl -I https://pebaum.github.io/dnd-dm-screen/ | grep "HTTP/"
curl -I https://pebaum.github.io/granular-ambient/ | grep "HTTP/"
curl -I https://pebaum.github.io/textscape/ | grep "HTTP/"
curl -I https://pebaum.github.io/the-duel-boardgame/ | grep "HTTP/"
curl -I https://pebaum.github.io/forward-boardgame/ | grep "HTTP/"

echo "Testing Drift versions..."
curl -I https://pebaum.github.io/drift/v7/ | grep "HTTP/"
curl -I https://pebaum.github.io/drift/v6/ | grep "HTTP/"
curl -I https://pebaum.github.io/drift/v5/ | grep "HTTP/"
curl -I https://pebaum.github.io/drift/v4/ | grep "HTTP/"
curl -I https://pebaum.github.io/drift/v3/ | grep "HTTP/"
curl -I https://pebaum.github.io/drift/v2/ | grep "HTTP/"

echo "Testing generative-web-art pieces..."
curl -I https://pebaum.github.io/generative-web-art/dungeongame.html | grep "HTTP/"
curl -I https://pebaum.github.io/generative-web-art/mazesend.html | grep "HTTP/"
curl -I https://pebaum.github.io/generative-web-art/waterlillies.html | grep "HTTP/"
curl -I https://pebaum.github.io/generative-web-art/viewofaburningcity.html | grep "HTTP/"
curl -I https://pebaum.github.io/generative-web-art/wordprocessor.html | grep "HTTP/"
curl -I https://pebaum.github.io/generative-web-art/colorexplore.html | grep "HTTP/"
curl -I https://pebaum.github.io/generative-web-art/blocksnow.html | grep "HTTP/"

echo "Verifying preserved folders (should be local paths)..."
ls -la /c/pebaum.github.io/projects/benji-site/index.html
ls -la /c/pebaum.github.io/archive/

echo "All links tested. Expect HTTP/2 200 for working links, 404 for nova4 (expected)."
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Relative paths for all projects | Absolute GitHub Pages URLs for migrated projects | 2025 (this migration) | Enables distributed hosting, preserves portfolio as hub |
| Manual HTML editing | sed bulk replacement with git verification | 2020s standard | Faster, less error-prone, auditable changes |
| `<a href="/path">` root-relative | `<a href="https://domain/path">` absolute | Varies by architecture | Required for GitHub Pages project repos (different domains) |
| Testing links in same browser session | Hard refresh + incognito testing | 2020+ (CDN/cache awareness) | Catches cache-masked broken links |
| rel="noopener" for target="_blank" | Auto-applied by browsers | 2021+ (Chrome last) | Security feature now automatic, attribute optional |

**Deprecated/outdated:**
- Using `#` as href placeholder: Violates a11y standards, breaks keyboard navigation (use valid URLs)
- `href=""` empty attributes: Causes page reload, breaks expected link behavior (always provide destination)
- Relative paths to external repos: Don't work on GitHub Pages project repos (different base URLs)
- Testing without cache bypass: CDN caching makes this unreliable (always hard refresh)

## Open Questions

Things that couldn't be fully resolved:

1. **nova4 VST Plugin Repository**
   - What we know: Migrated in Phase 2, contains VST plugin files without HTML entry point
   - What's unclear: Whether to remove nova4 link from portfolio or mark it differently
   - Recommendation: Keep link with note that it's code-only (no live demo), or investigate if README renders

2. **Archive Folder Contents**
   - What we know: Archive folder exists with ffix-site, old-index.html, build-index.js
   - What's unclear: Whether archive should be linked in portfolio or remain unlisted
   - Recommendation: Leave archive folder in repo but don't add navigation links unless user requests

3. **GitHub Pages Deployment Status Verification**
   - What we know: Repos created in Phase 1-2, GitHub Pages enabled from master/root
   - What's unclear: Whether all deployments are currently active and accessible
   - Recommendation: Verify each repo's GitHub Pages settings before finalizing link updates; check GitHub Actions logs if 404s persist beyond 20min

4. **Drift v1 Existence**
   - What we know: Phase 2-03 summary mentions "v1-v7" but index.html links show v2-v7 (no v1 link)
   - What's unclear: Does v1 exist? Should link be added to portfolio?
   - Recommendation: Check drift repo structure; if v1/ exists, add link to index.html during update

## Sources

### Primary (HIGH confidence)
- GitHub Pages Quickstart - https://docs.github.com/en/pages/quickstart - User/org page URL structure
- MDN Creating Links Guide - https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links - HTML href best practices, absolute vs relative URLs
- Phase 02 Plan 01-04 SUMMARY files (local) - Exact repository names and migration mappings
- index.html current state (local) - Exact 21 project links requiring update

### Secondary (MEDIUM confidence)
- GitHub Docs: User, Organization, and Project Pages - https://docs.github.com/en/enterprise/2.14/user/articles/user-organization-and-project-pages - Project pages URL pattern `username.github.io/project-name`
- nixCraft sed tutorial - https://www.cyberciti.biz/faq/how-to-use-sed-to-find-and-replace-text-in-files-in-linux-unix-shell/ - sed find-replace patterns with URL-safe delimiters
- Git commit best practices (2025) - https://blog.pullnotifier.com/blog/8-git-commit-message-best-practices-for-2025 - Conventional commits format

### Tertiary (LOW confidence - WebSearch only)
- GitHub Pages CDN caching behavior - Community discussions indicate 10-30min delays, but not official documentation
- Broken link checker tools comparison - Multiple tools exist but not verified which works best for GitHub Pages
- Cache busting version parameters (v=timestamp) - Mentioned in community discussion but not needed for this use case

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - sed, git, browser DevTools are well-established tools with extensive documentation
- Architecture: HIGH - GitHub Pages URL structure verified from official docs; URL mappings extracted from Phase 2 summaries
- Pitfalls: MEDIUM - Based on general web development experience and community discussions; not all GitHub Pages-specific

**Research date:** 2026-01-19
**Valid until:** 60 days (stable - GitHub Pages URL structure rarely changes; HTML link patterns are stable web standards)

**Knowledge sources:**
- GitHub official documentation (authoritative)
- MDN Web Docs (authoritative for HTML standards)
- Local Phase 2 migration summaries (project-specific, authoritative)
- WebSearch for best practices (current but needs verification in practice)

**Assumptions verified:**
- GitHub Pages URL pattern: Confirmed from official docs
- Migrated repository names: Extracted from Phase 2 SUMMARY files
- Current portfolio links: Read from index.html
- sed availability: Standard Unix/Linux tool, available in Git Bash on Windows

**Assumptions requiring validation:**
- All 10 repositories have active GitHub Pages deployments (should verify in GitHub repo settings)
- Drift repo contains v1-v7 (vs v2-v7 as currently linked)
- nova4 repo exists but expectedly shows 404 (should confirm this is acceptable)
- Archive folder should remain unlinked (user preference, not technical requirement)
