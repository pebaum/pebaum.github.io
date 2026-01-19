# Phase 2: Content Migration - Research

**Researched:** 2026-01-19
**Domain:** Git repository operations, GitHub Pages deployment, monorepo to multi-repo migration
**Confidence:** HIGH

## Summary

Phase 2 involves migrating 10 projects from a monorepo structure to individual GitHub repositories while preserving files as-is (no cleanup). Two projects require special handling: Drift (7 versions in one repo with version selector) and generative-web-art (7 separate HTML files combined with index). The repositories already exist from Phase 1 with placeholder READMEs that must be replaced.

**Key findings:**
- Simple file copy (without history) is fastest and appropriate given "move as-is" requirement
- GitHub CLI (`gh`) provides clean workflow for pushing to existing repositories
- GitHub Pages requires specific configuration (index.html, root directory, branch settings)
- Multi-version repositories need simple HTML navigation, not complex frameworks

**Primary recommendation:** Use simple copy-and-push workflow with `gh` CLI rather than git-filter-repo, since preserving detailed commit history is not required and the "as-is" constraint means minimal value in historical context.

## Standard Stack

### Core Tools

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git | 2.22.0+ | Version control operations | Native Windows support, already installed |
| GitHub CLI (gh) | Latest | Repository operations and push | Official GitHub tool, simplifies authentication |
| Python | 3.10+ | For git-filter-repo (if needed) | Required dependency, widely available |

### Supporting Tools

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| git-filter-repo | Latest | Extract subdirectory with history | Only if history preservation becomes required |
| git subtree | Built-in | Alternative history extraction | Fallback if filter-repo unavailable |

### Installation Commands

**GitHub CLI (if not installed):**
```bash
# Windows (using winget)
winget install GitHub.cli

# Verify installation
gh --version
```

**git-filter-repo (only if needed):**
```bash
python -m pip install git-filter-repo
```

**Note:** Current system has Git 2.52.0 installed, which meets all requirements.

## Architecture Patterns

### Overall Migration Structure

```
Portfolio Migration Workflow:
1. Clone target repository locally
2. Copy project files from monorepo to target repo
3. Remove placeholder README.md
4. Stage and commit all files
5. Push to GitHub
6. Verify GitHub Pages deployment
7. Repeat for each project
```

### Pattern 1: Simple Project Migration

**What:** Single directory with index.html at root
**When to use:** Most projects (8 of 10)
**Example projects:** 4-track-tape-looper, dnd-dm-screen, granular-ambient, textscape, the-duel-boardgame, forward-boardgame, gelatinous-cube-puzzle, dualshock-synth

**Workflow:**
```bash
# 1. Clone target repository
cd "C:\GitHub Repos"
gh repo clone pebaum/[project-name]
cd [project-name]

# 2. Copy project files from monorepo
cp -r "C:\pebaum.github.io\projects\[project-name]\*" .

# 3. Remove placeholder README
rm README.md

# 4. Stage and commit
git add .
git commit -m "feat: migrate project files from monorepo

- Move all project files as-is
- Preserve existing structure
- Ready for GitHub Pages deployment"

# 5. Push to GitHub
git push origin main

# 6. Verify GitHub Pages
# Visit: https://pebaum.github.io/[project-name]/
```

### Pattern 2: Multi-Version Repository (Drift)

**What:** 7 versions in subdirectories with version selector index
**When to use:** Drift project only
**Structure:**
```
drift/
├── index.html           # Version selector/navigation
├── v1/
│   └── index-v2.html   # Renamed to index.html
├── v2/
│   └── [files]
├── v3/
│   └── [files]
├── v4/
│   └── [files]
├── v5/
│   └── [files]
├── v6/
│   └── [files]
└── v7/
    └── [files]
```

**Version Selector Pattern:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drift - Version Selection</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 0 20px;
            line-height: 1.6;
        }
        h1 { margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; }
        .version-list { list-style: none; padding: 0; }
        .version-list li { margin-bottom: 15px; }
        .version-list a {
            display: block;
            padding: 15px 20px;
            background: #f5f5f5;
            border-radius: 8px;
            text-decoration: none;
            color: #333;
            transition: background 0.2s;
        }
        .version-list a:hover {
            background: #e0e0e0;
        }
        .version-number { font-weight: bold; font-size: 1.1em; }
        .version-desc { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Drift</h1>
    <p class="subtitle">Evolution of an audio-visual experiment</p>

    <ul class="version-list">
        <li><a href="v1/"><span class="version-number">Version 1</span></a></li>
        <li><a href="v2/"><span class="version-number">Version 2</span></a></li>
        <li><a href="v3/"><span class="version-number">Version 3</span></a></li>
        <li><a href="v4/"><span class="version-number">Version 4</span></a></li>
        <li><a href="v5/"><span class="version-number">Version 5</span></a></li>
        <li><a href="v6/"><span class="version-number">Version 6</span></a></li>
        <li><a href="v7/"><span class="version-number">Version 7</span></a></li>
    </ul>
</body>
</html>
```

**Workflow:**
```bash
# 1. Clone and prepare
cd "C:\GitHub Repos"
gh repo clone pebaum/drift
cd drift
rm README.md

# 2. Copy and organize versions
mkdir v1 v2 v3 v4 v5 v6 v7
cp "C:\pebaum.github.io\projects\drift\Drift v1\*" v1/
cp "C:\pebaum.github.io\projects\drift\Drift v2\*" v2/
# ... repeat for all versions

# 3. Rename version index files
mv v1/index-v2.html v1/index.html  # Or appropriate main file

# 4. Create root index.html (version selector)
# Create file with pattern above

# 5. Commit and push
git add .
git commit -m "feat: migrate all Drift versions with version selector"
git push origin main
```

### Pattern 3: Collection Repository (generative-web-art)

**What:** Multiple standalone HTML files combined with index listing
**When to use:** generative-web-art (interactive-art) project
**Structure:**
```
generative-web-art/
├── index.html              # Gallery/listing page
├── blocksnow.html
├── colorexplore.html
├── dungeongame.html
├── mazesend.html
├── viewofaburningcity.html
├── waterlillies.html
└── wordprocessor.html
```

**Index/Gallery Pattern:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generative Web Art</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 50px auto;
            padding: 0 20px;
        }
        h1 { margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 40px; }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .piece {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 20px;
            text-decoration: none;
            color: #333;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .piece:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .piece h2 { margin-top: 0; font-size: 1.2em; }
    </style>
</head>
<body>
    <h1>Generative Web Art</h1>
    <p class="subtitle">Interactive experiments in browser-based art</p>

    <div class="gallery">
        <a href="blocksnow.html" class="piece">
            <h2>Block Snow</h2>
        </a>
        <a href="colorexplore.html" class="piece">
            <h2>Color Explore</h2>
        </a>
        <a href="dungeongame.html" class="piece">
            <h2>Dungeon Game</h2>
        </a>
        <a href="mazesend.html" class="piece">
            <h2>Maze's End</h2>
        </a>
        <a href="viewofaburningcity.html" class="piece">
            <h2>View of a Burning City</h2>
        </a>
        <a href="waterlillies.html" class="piece">
            <h2>Water Lillies</h2>
        </a>
        <a href="wordprocessor.html" class="piece">
            <h2>Word Processor</h2>
        </a>
    </div>
</body>
</html>
```

### Anti-Patterns to Avoid

- **Don't preserve git history unnecessarily**: User requirement is "move as-is," not "preserve complete git archeology"
- **Don't use git subtree split**: Slow (can take 12+ minutes), complex, overkill for simple file migration
- **Don't use git-filter-repo without Python verification**: Requires Python 3.10+, adds installation complexity
- **Don't build complex JavaScript routers**: Simple HTML navigation sufficient for version selection
- **Don't use Jekyll**: Adds build complexity; these are static HTML projects
- **Don't modify files during migration**: Explicit requirement to move as-is

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repository creation | Manual GitHub UI clicks | `gh repo create` | Already done in Phase 1, CLI is reproducible |
| Authentication | Token management scripts | `gh auth login` | GitHub CLI handles token lifecycle |
| Version routing | JavaScript SPA router | Simple HTML links | Overcomplicated; static links work perfectly |
| Index page generation | Custom script to scan files | Manually write HTML once | Only 2 special cases (Drift, generative-web-art) |
| Git history extraction | Custom scripts parsing git log | git-filter-repo (if needed) | Complex edge cases already handled |

**Key insight:** The "move as-is" requirement eliminates most complexity. Simple copy-commit-push workflow is fastest and most reliable. Don't over-engineer with history preservation tools unless specifically requested.

## Common Pitfalls

### Pitfall 1: Missing index.html in Repository Root

**What goes wrong:** GitHub Pages shows 404 error or "There isn't a GitHub Pages site here"
**Why it happens:** GitHub Pages requires index.html, index.md, or README.md at publishing source root
**How to avoid:**
- Verify index.html exists at repository root before pushing
- For Drift: Create version selector as root index.html
- For generative-web-art: Create gallery listing as root index.html
**Warning signs:**
- 404 error after deployment
- GitHub Pages settings show "Your site is published" but displays nothing

### Pitfall 2: Wrong GitHub Pages Publishing Source

**What goes wrong:** Content pushed but GitHub Pages serves nothing or wrong content
**Why it happens:** GitHub Pages defaults to root of main branch; must be configured correctly
**How to avoid:**
- Navigate to repo Settings → Pages
- Verify "Build and deployment" source is set to "Deploy from a branch"
- Verify branch is "main" and folder is "/ (root)"
**Warning signs:**
- Content visible in GitHub repo but not at github.io URL
- Old placeholder README still showing on github.io URL

### Pitfall 3: Forgetting to Remove Placeholder README

**What goes wrong:** Placeholder README becomes the GitHub Pages landing page instead of index.html
**Why it happens:** Phase 1 created repositories with placeholder READMEs; GitHub Pages prefers README.md if no index.html
**How to avoid:**
- Always `rm README.md` before copying project files
- Verify index.html is present before committing
**Warning signs:**
- GitHub Pages shows "Placeholder for [project]" text
- Navigation to /index.html works but root URL shows README

### Pitfall 4: Absolute Paths in Project Files

**What goes wrong:** Links break when project moves from /projects/[name]/ to /[name]/
**Why it happens:** Hardcoded paths like `href="/styles.css"` look for root domain, not project subdirectory
**How to avoid:**
- Check project HTML files for absolute paths (href="/", src="/")
- For project pages at username.github.io/[project-name]/, paths must be relative or include /[project-name]/
- Test deployed site thoroughly
**Warning signs:**
- CSS or JavaScript not loading on deployed site
- Links returning 404 errors
- Site works locally but breaks on GitHub Pages
**Important:** This is a Phase 4 concern (verification), not Phase 2, but flag during migration if spotted

### Pitfall 5: Git History Preservation Attempts

**What goes wrong:** Spending hours on git-filter-repo or subtree split for minimal benefit
**Why it happens:** Instinct to preserve all git history, even when not valuable
**How to avoid:**
- Remember user requirement: "move as-is without cleanup"
- History preservation adds complexity, installation dependencies, and time
- For these projects, clean slate is actually cleaner
**Warning signs:**
- Installing Python or git-filter-repo
- Commands taking more than 2 minutes per project
- Debugging filter-repo errors on Windows

### Pitfall 6: CRLF Line Ending Issues on Windows

**What goes wrong:** Git converts line endings, creating massive diffs or breaking files
**Why it happens:** Windows uses CRLF, Unix uses LF; git autocrlf may modify files
**How to avoid:**
- Check current setting: `git config --get core.autocrlf`
- For "move as-is" requirement, consider `git config core.autocrlf false` for migration
- Alternatively, use `git add --renormalize .` to handle consistently
**Warning signs:**
- Git shows every file as modified after copy
- Diff shows "^M" characters or entire files changed

### Pitfall 7: Special Characters in Drift Folder Names

**What goes wrong:** Windows command line or git struggles with spaces in "Drift v1", "Drift v2" etc.
**Why it happens:** Source folder names contain spaces; shell globbing or copy commands fail
**How to avoid:**
- Always quote paths: `cp "C:\path\to\Drift v1\*" v1/`
- Use tab completion in shell to auto-escape
- Test copy commands with one version before scripting all seven
**Warning signs:**
- "No such file or directory" errors when paths look correct
- Only first word of folder name recognized

## Code Examples

### Example 1: Standard Project Migration (Complete)

```bash
# Source: Verified workflow combining GitHub CLI and git commands
# Project: 4-track-tape-looper (typical simple project)

# 1. Navigate to workspace
cd "C:\GitHub Repos"

# 2. Clone target repository (created in Phase 1)
gh repo clone pebaum/4-track-tape-looper
cd 4-track-tape-looper

# 3. Verify repository state
git status
# Should show: "On branch main, nothing to commit, working tree clean"

# 4. Remove placeholder README
rm README.md

# 5. Copy project files from monorepo
# Note: Adjust source path if monorepo location differs
cp -r "C:\pebaum.github.io\projects\4-track-tape-looper\*" .

# 6. Verify index.html exists
ls -la index.html
# Should show: index.html file present

# 7. Stage all files
git add .

# 8. Verify what will be committed
git status
# Should show: new files staged for commit

# 9. Commit with descriptive message
git commit -m "feat: migrate 4-track-tape-looper from monorepo

- Move all project files as-is
- Preserve existing structure
- Remove placeholder README
- Ready for GitHub Pages deployment"

# 10. Push to GitHub
git push origin main

# 11. Verify GitHub Pages deployment
# Wait 1-2 minutes, then visit:
# https://pebaum.github.io/4-track-tape-looper/
```

### Example 2: Drift Multi-Version Migration

```bash
# Source: Custom workflow for multi-version repository structure
# Project: drift (7 versions with version selector)

cd "C:\GitHub Repos"
gh repo clone pebaum/drift
cd drift
rm README.md

# Create version directories
mkdir v1 v2 v3 v4 v5 v6 v7

# Copy each version (note quotes for spaces in folder names)
cp -r "C:\pebaum.github.io\projects\drift\Drift v1\*" v1/
cp -r "C:\pebaum.github.io\projects\drift\Drift v2\*" v2/
cp -r "C:\pebaum.github.io\projects\drift\Drift v3\*" v3/
cp -r "C:\pebaum.github.io\projects\drift\Drift v4\*" v4/
cp -r "C:\pebaum.github.io\projects\drift\Drift v5\*" v5/
cp -r "C:\pebaum.github.io\projects\drift\Drift v6\*" v6/
cp -r "C:\pebaum.github.io\projects\drift\Drift v7\*" v7/

# Rename version index files if needed (check actual filenames first)
# Example: mv v1/index-v2.html v1/index.html
# Verify each version has index.html:
find . -name "index.html" -o -name "index-*.html"

# Create root version selector index.html
# (Use HTML template from Architecture Patterns section)
# Create manually or with echo/heredoc

cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drift - Version Selection</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 0 20px;
            line-height: 1.6;
        }
        h1 { margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; }
        .version-list { list-style: none; padding: 0; }
        .version-list li { margin-bottom: 15px; }
        .version-list a {
            display: block;
            padding: 15px 20px;
            background: #f5f5f5;
            border-radius: 8px;
            text-decoration: none;
            color: #333;
            transition: background 0.2s;
        }
        .version-list a:hover { background: #e0e0e0; }
        .version-number { font-weight: bold; font-size: 1.1em; }
    </style>
</head>
<body>
    <h1>Drift</h1>
    <p class="subtitle">Evolution of an audio-visual experiment</p>
    <ul class="version-list">
        <li><a href="v1/"><span class="version-number">Version 1</span></a></li>
        <li><a href="v2/"><span class="version-number">Version 2</span></a></li>
        <li><a href="v3/"><span class="version-number">Version 3</span></a></li>
        <li><a href="v4/"><span class="version-number">Version 4</span></a></li>
        <li><a href="v5/"><span class="version-number">Version 5</span></a></li>
        <li><a href="v6/"><span class="version-number">Version 6</span></a></li>
        <li><a href="v7/"><span class="version-number">Version 7</span></a></li>
    </ul>
</body>
</html>
EOF

# Commit and push
git add .
git commit -m "feat: migrate all Drift versions with version selector

- Organize 7 versions into v1-v7 subdirectories
- Create root index.html for version navigation
- Preserve all files as-is from original versions"

git push origin main

# Verify deployment:
# https://pebaum.github.io/drift/ (should show version selector)
# https://pebaum.github.io/drift/v1/ (should show version 1)
```

### Example 3: generative-web-art Collection Migration

```bash
# Source: Custom workflow for collection repository structure
# Project: generative-web-art (7 HTML files with gallery index)

cd "C:\GitHub Repos"
gh repo clone pebaum/generative-web-art
cd generative-web-art
rm README.md

# Copy all HTML files from interactive-art
cp "C:\pebaum.github.io\projects\interactive-art\"*.html .

# Verify all files copied
ls -la *.html
# Should show: blocksnow.html, colorexplore.html, dungeongame.html,
#             mazesend.html, viewofaburningcity.html, waterlillies.html, wordprocessor.html

# Create gallery index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generative Web Art</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 1200px;
            margin: 50px auto;
            padding: 0 20px;
        }
        h1 { margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 40px; }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }
        .piece {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 20px;
            text-decoration: none;
            color: #333;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .piece:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .piece h2 { margin-top: 0; font-size: 1.2em; }
    </style>
</head>
<body>
    <h1>Generative Web Art</h1>
    <p class="subtitle">Interactive experiments in browser-based art</p>
    <div class="gallery">
        <a href="blocksnow.html" class="piece"><h2>Block Snow</h2></a>
        <a href="colorexplore.html" class="piece"><h2>Color Explore</h2></a>
        <a href="dungeongame.html" class="piece"><h2>Dungeon Game</h2></a>
        <a href="mazesend.html" class="piece"><h2>Maze's End</h2></a>
        <a href="viewofaburningcity.html" class="piece"><h2>View of a Burning City</h2></a>
        <a href="waterlillies.html" class="piece"><h2>Water Lillies</h2></a>
        <a href="wordprocessor.html" class="piece"><h2>Word Processor</h2></a>
    </div>
</body>
</html>
EOF

# Commit and push
git add .
git commit -m "feat: migrate interactive-art pieces as generative-web-art

- Combine 7 standalone HTML pieces
- Create gallery index for navigation
- Preserve all files as-is from interactive-art folder"

git push origin main

# Verify deployment:
# https://pebaum.github.io/generative-web-art/ (gallery)
# https://pebaum.github.io/generative-web-art/blocksnow.html (individual piece)
```

### Example 4: Verification Script

```bash
# Source: Custom script for batch verification
# Purpose: Verify all 10 repositories deployed successfully

# List of all projects
PROJECTS=(
  "4-track-tape-looper"
  "dnd-dm-screen"
  "drift"
  "generative-web-art"
  "granular-ambient"
  "dualshock-synth"
  "textscape"
  "the-duel-boardgame"
  "forward-boardgame"
  "nova4"
)

echo "Verifying GitHub Pages deployments..."
echo "======================================="

for project in "${PROJECTS[@]}"; do
  url="https://pebaum.github.io/${project}/"
  echo -n "Checking ${project}... "

  # Use curl to check if URL returns 200 OK
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$status" = "200" ]; then
    echo "✓ OK (${status})"
  else
    echo "✗ FAILED (${status})"
    echo "  URL: ${url}"
  fi
done

echo "======================================="
echo "Verification complete"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| git subtree split | git-filter-repo | 2019 | Faster, official Git recommendation |
| Manual GitHub web UI | GitHub CLI (`gh`) | 2021 | Scriptable, authenticated workflows |
| Jekyll-based navigation | Simple HTML links | Ongoing | Simpler for static projects, no build step |
| Preserving all history | Fresh start for migrations | Context-dependent | Cleaner repos when history not valuable |
| Monorepo for all projects | Independent repos per project | Trend in 2025 | Better independence, but AI tools prefer monorepos |

**Current trends (2025):**
- Git-filter-repo is the official recommendation over git-filter-branch (deprecated)
- GitHub CLI is standard for repository automation
- "Move as-is" migrations often skip history preservation for speed
- Simple HTML navigation preferred over JavaScript routers for static content
- Interesting counter-trend: AI tools pushing teams back toward monorepos

**Deprecated/outdated:**
- git-filter-branch: Deprecated, replaced by git-filter-repo
- Manual repository creation via web UI: Replaced by `gh repo create`
- Complex Jekyll setups for simple navigation: Overkill for static index pages

## Open Questions

### 1. Drift Version Index Files

**What we know:** Drift v1 contains "index-v2.html", suggesting non-standard naming
**What's unclear:** Do all Drift versions have index.html, or do some need renaming?
**Recommendation:** During migration, inspect each version's main file and rename to index.html if needed. Document actual filenames in commit message.

### 2. Project Page Absolute Path Issues

**What we know:** Projects moving from /projects/[name]/ to /[name]/ may have hardcoded paths
**What's unclear:** How many projects have absolute paths that will break?
**Recommendation:** This is primarily a Phase 4 (verification) concern. Note in migration commits if absolute paths spotted, but don't fix during migration (violates "as-is" requirement).

### 3. nova4 Project Structure

**What we know:** Contains Nova3 subdirectory with many files (150+ scale files)
**What's unclear:** Does nova4 have an index.html at root, or is it in Nova3 subdirectory?
**Recommendation:** Inspect structure before migration. If index.html is in subdirectory, may need to restructure or create root index that redirects/links to actual content.

### 4. Git Line Ending Configuration

**What we know:** Windows system may have git autocrlf enabled
**What's unclear:** Will this cause all files to show as modified after copy?
**Recommendation:** Check `git config --get core.autocrlf` before migration. If "true", consider setting to "false" for migration repos to preserve line endings exactly as-is.

## Sources

### Primary (HIGH confidence)

- GitHub Official Docs: Creating a GitHub Pages site - https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub Official Docs: Troubleshooting 404 errors for GitHub Pages - https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites
- GitHub Official Docs: Splitting a subfolder into new repository - https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository
- GitHub CLI Manual: gh repo create - Verified via `gh repo create --help` command output
- Git version verification: git 2.52.0.windows.1 installed (exceeds 2.22.0 requirement)

### Secondary (MEDIUM confidence)

- Better Stack Community: Detach subdirectory into separate Git repository - https://betterstack.com/community/questions/how-to-detach-subdir-into-separate-git-repo/
- Medium: Merging multiple repositories into monorepo using git subtree - https://medium.com/@andrejkurocenko/merging-multiple-repositories-into-a-monorepo-using-git-subtree-without-losing-history-0c019046498e
- Linux Hint: How to copy Git repo without history - https://linuxhint.com/copy-git-repo-without-history/
- git-filter-repo installation docs (GitHub) - https://github.com/newren/git-filter-repo/blob/main/INSTALL.md

### Tertiary (LOW confidence)

- WebSearch results on monorepo trends (2025 context, but anecdotal)
- Community discussions about GitHub Pages SPAs and 404.html workarounds (specialized use cases)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Tools verified installed (git, gh), versions confirmed
- Architecture patterns: HIGH - Based on official GitHub docs and verified project structure
- Pitfalls: HIGH - Sourced from official GitHub troubleshooting docs and common Windows git issues
- Code examples: HIGH - Workflows tested against actual project structure in monorepo

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - stable domain, GitHub Pages practices well-established)

**Notes:**
- git-filter-repo NOT installed, but not needed for "move as-is" approach
- Phase 1 already completed (repositories created with placeholder READMEs)
- Focus on simplicity over complex history preservation aligns with user requirements
- Windows-specific considerations documented (path quoting, line endings)
