const fs = require('fs');
const path = require('path');

// Directories to exclude from the index
const EXCLUDE_DIRS = [
    '.git',
    '.github',
    '.claude',
    'node_modules',
    '.venv',
    'main-site'
];

// Files to exclude
const EXCLUDE_FILES = [
    '.gitignore',
    '.mcp.json',
    'build-index.js',
    'package.json',
    'package-lock.json',
    'temp_head.txt',
    'Stone.mp3',
    '.temp_notion_explorer.js',
    'README.md'
];

// File extensions to include
const INCLUDE_EXTENSIONS = [
    '.html',
    '.htm'
];

function shouldInclude(name, isDirectory) {
    if (isDirectory) {
        return !EXCLUDE_DIRS.includes(name);
    }
    if (EXCLUDE_FILES.includes(name)) {
        return false;
    }
    const ext = path.extname(name).toLowerCase();
    return INCLUDE_EXTENSIONS.includes(ext);
}

function scanDirectory(dir, relativePath = '') {
    const items = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (!shouldInclude(entry.name, entry.isDirectory())) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
            const children = scanDirectory(fullPath, relPath);
            if (children.length > 0) {
                items.push({
                    name: entry.name,
                    type: 'directory',
                    path: relPath,
                    children: children
                });
            }
        } else {
            items.push({
                name: entry.name,
                type: 'file',
                path: relPath.replace(/\\/g, '/')
            });
        }
    }

    return items.sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === 'directory' ? -1 : 1;
    });
}

function generateTreeHTML(items, indent = '') {
    let html = '';
    const isLast = (index, array) => index === array.length - 1;

    items.forEach((item, index) => {
        const prefix = isLast(index, items) ? '└── ' : '├── ';
        const nextIndent = indent + (isLast(index, items) ? '    ' : '│   ');

        if (item.type === 'directory') {
            html += `<span class="tree-line"><span class="tree-indent">${indent}${prefix}</span><span class="tree-folder">${item.name}/</span></span>\n`;
            html += generateTreeHTML(item.children, nextIndent);
        } else {
            const cleanName = item.name.replace('.html', '').replace('.htm', '');
            html += `<span class="tree-line"><span class="tree-indent">${indent}${prefix}</span><a href="./${item.path}" class="tree-link">${cleanName}</a></span>\n`;
        }
    });

    return html;
}

function buildIndex() {
    console.log('Scanning repository...');
    const repoRoot = __dirname;
    const structure = scanDirectory(repoRoot);

    console.log(`Found ${JSON.stringify(structure, null, 2).match(/html/gi)?.length || 0} HTML files`);

    const treeHTML = generateTreeHTML(structure);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peter Baumgartner</title>
    <style>
        @font-face {
            font-family: 'Alexandria';
            src: url('./assets/fonts/Alexandria.ttf') format('truetype');
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #000;
            color: #FFF;
            font-family: 'Alexandria', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.8;
            padding: 30px;
            cursor: none;
        }

        #cursor {
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            font-size: 16px;
            transform: translate(-50%, -50%);
            mix-blend-mode: difference;
        }

        .container {
            max-width: 800px;
            margin: 0;
        }

        h1 {
            font-size: 18px;
            font-weight: normal;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }

        .tree {
            white-space: pre;
            font-size: 13px;
        }

        .tree-line {
            display: block;
            transition: background 0.05s;
        }

        .tree-line:hover {
            background: #111;
        }

        .tree-link {
            color: #FFF;
            text-decoration: none;
        }

        .tree-link:hover {
            color: #888;
        }

        .tree-folder {
            color: #666;
        }

        .tree-indent {
            color: #333;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #222;
            color: #444;
            font-size: 11px;
        }

        body * {
            cursor: none !important;
        }

        ::selection {
            background: #FFF;
            color: #000;
        }
    </style>
</head>
<body>
    <div id="cursor">█</div>
    <div class="container">
        <h1>PETER BAUMGARTNER</h1>
        <div class="tree">
<span class="tree-line"><span class="tree-folder">pebaum.github.io/</span></span>
${treeHTML}
        </div>
        <div class="footer">
            <p>Auto-generated from repository structure</p>
            <p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
        </div>
    </div>
    <script>
        const cursor = document.getElementById('cursor');
        document.addEventListener('mousemove', e => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        document.querySelectorAll('.tree-link').forEach(link => {
            link.addEventListener('mouseenter', () => cursor.textContent = '▓');
            link.addEventListener('mouseleave', () => cursor.textContent = '█');
        });
    </script>
</body>
</html>`;

    const outputPath = path.join(repoRoot, 'index.html');
    fs.writeFileSync(outputPath, html);
    console.log(`✓ Generated ${outputPath}`);
    console.log('\nRun this script whenever you add new content to auto-update the homepage.');
}

buildIndex();
