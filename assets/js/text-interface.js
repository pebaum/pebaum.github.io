// Text-Based DOS-Style Interface
// Classic terminal/DOS game aesthetic

const COLORS = {
    bg: '#000000',
    text: '#c0c0c0',
    header: '#00ffff',
    highlight: '#ffff00',
    accent: '#00ff00',
    dim: '#808080',
    border: '#ffffff'
};

const SCREEN = {
    width: 80,
    height: 25,
    fontSize: 16,
    lineHeight: 20
};

class TextInterface {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = SCREEN.width * (SCREEN.fontSize * 0.6);
        this.canvas.height = SCREEN.height * SCREEN.lineHeight;

        this.currentMenu = 'main';
        this.selectedIndex = 0;
        this.menuData = this.buildMenuData();

        this.setupInput();
        this.render();
    }

    buildMenuData() {
        return {
            main: {
                title: 'FIRELINK SHRINE',
                subtitle: 'A Digital Portfolio',
                options: [
                    { label: 'About Me', action: () => this.showMenu('about') },
                    { label: 'Music Projects', action: () => this.showMenu('music') },
                    { label: 'Art Projects', action: () => this.showMenu('art') },
                    { label: 'Code Projects', action: () => this.showMenu('code') },
                    { label: 'Work & Resume', action: () => this.showMenu('work') },
                    { label: 'Writing', action: () => this.showMenu('writing') },
                    { label: 'Secret Archives', action: () => this.showMenu('secret') }
                ]
            },
            about: {
                title: 'ABOUT ME',
                back: true,
                options: [
                    { label: 'Bio', url: 'about/index.html' },
                    { label: 'Contact', action: () => this.showMessage('Contact info coming soon...') },
                    { label: 'Links', action: () => this.showMessage('Links coming soon...') }
                ]
            },
            music: {
                title: 'MUSIC PROJECTS',
                subtitle: 'Generative Ambient Soundscapes',
                back: true,
                options: [
                    { label: 'Drift v7 - Latest', url: 'projects/music/drift/Drift v7/index.html' },
                    { label: 'Drift v6', url: 'projects/music/drift/Drift v6/index.html' },
                    { label: 'Drift v5', url: 'projects/music/drift/Drift v5/index.html' },
                    { label: 'Drift v4', url: 'projects/music/drift/Drift v4/index.html' },
                    { label: 'Drift v3', url: 'projects/music/drift/Drift v3/index.html' },
                    { label: 'Drift v2', url: 'projects/music/drift/Drift v2/index.html' },
                    { label: 'Drift v1', url: 'projects/music/drift/Drift v1/index.html' }
                ]
            },
            art: {
                title: 'ART PROJECTS',
                subtitle: 'Interactive Digital Art',
                back: true,
                options: [
                    { label: 'Dungeon Game', url: 'projects/art/interactive-art/dungeongame.html' },
                    { label: 'Maze Send', url: 'projects/art/interactive-art/mazesend.html' },
                    { label: 'Color Explore', url: 'projects/art/interactive-art/colorexplore.html' },
                    { label: 'Water Lillies', url: 'projects/art/interactive-art/waterlillies.html' },
                    { label: 'View of a Burning City', url: 'projects/art/interactive-art/viewofaburningcity.html' },
                    { label: 'Block Snow', url: 'projects/art/interactive-art/blocksnow.html' },
                    { label: 'Word Processor', url: 'projects/art/interactive-art/wordprocessor.html' }
                ]
            },
            code: {
                title: 'CODE PROJECTS',
                subtitle: 'Miscellaneous Experiments',
                back: true,
                options: [
                    { label: 'Benji Site', url: 'projects/miscellaneous/benji-site/index.html' },
                    { label: 'Blade Honor', url: 'projects/miscellaneous/blade-honor/index.html' },
                    { label: 'Forward Playground', url: 'projects/miscellaneous/forward-playground/index.html' }
                ]
            },
            work: {
                title: 'WORK & RESUME',
                back: true,
                options: [
                    { label: 'Resume', url: 'projects/work/index.html' },
                    { label: 'Portfolio', url: 'projects/work/index.html' },
                    { label: 'Experience', url: 'projects/work/index.html' }
                ]
            },
            writing: {
                title: 'WRITING',
                back: true,
                options: [
                    { label: 'Blog Posts', url: 'projects/writing/index.html' },
                    { label: 'Notes', url: 'projects/writing/index.html' }
                ]
            },
            secret: {
                title: 'SECRET ARCHIVES',
                subtitle: 'Hidden Treasures',
                back: true,
                options: [
                    { label: 'The Original Dungeon', url: 'projects/art/interactive-art/dungeongame.html' },
                    { label: 'FFIX Tribute', url: 'archive/ffix-site/index.html' },
                    { label: 'Old Shrine', url: 'archive/old-index.html' }
                ]
            }
        };
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            const menu = this.menuData[this.currentMenu];
            const maxIndex = menu.options.length - 1;

            if (e.key === 'ArrowUp' || e.key === 'w') {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.render();
                e.preventDefault();
            } else if (e.key === 'ArrowDown' || e.key === 's') {
                this.selectedIndex = Math.min(maxIndex, this.selectedIndex + 1);
                this.render();
                e.preventDefault();
            } else if (e.key === 'Enter' || e.key === 'e') {
                this.selectOption();
                e.preventDefault();
            } else if (e.key === 'Escape' && menu.back) {
                this.showMenu('main');
                e.preventDefault();
            }

            // Number keys
            const num = parseInt(e.key);
            if (!isNaN(num) && num >= 1 && num <= menu.options.length) {
                this.selectedIndex = num - 1;
                this.selectOption();
                e.preventDefault();
            }
        });
    }

    selectOption() {
        const menu = this.menuData[this.currentMenu];
        const option = menu.options[this.selectedIndex];

        if (option.url) {
            window.location.href = option.url;
        } else if (option.action) {
            option.action();
        }
    }

    showMenu(menuName) {
        this.currentMenu = menuName;
        this.selectedIndex = 0;
        this.render();
    }

    showMessage(msg) {
        // For now, just alert
        alert(msg);
    }

    render() {
        // Clear screen
        this.ctx.fillStyle = COLORS.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const menu = this.menuData[this.currentMenu];
        let line = 2;

        // Draw border
        this.drawBorder();

        // Title
        line = 3;
        this.drawText(menu.title, 'center', line, COLORS.header);

        if (menu.subtitle) {
            line++;
            this.drawText(menu.subtitle, 'center', line, COLORS.dim);
        }

        line += 2;
        this.drawLine(line);
        line += 2;

        // Options
        menu.options.forEach((option, index) => {
            const isSelected = index === this.selectedIndex;
            const prefix = isSelected ? '>' : ' ';
            const color = isSelected ? COLORS.highlight : COLORS.text;
            const number = `${index + 1}.`;

            this.drawText(`${prefix} ${number} ${option.label}`, 10, line, color);
            line++;
        });

        // Footer
        line = SCREEN.height - 3;
        this.drawLine(line);
        line++;

        const controls = menu.back
            ? 'ARROWS: Navigate | ENTER: Select | ESC: Back | 1-9: Quick Select'
            : 'ARROWS: Navigate | ENTER: Select | 1-9: Quick Select';
        this.drawText(controls, 'center', line, COLORS.dim);
    }

    drawBorder() {
        const width = SCREEN.width - 2;
        const height = SCREEN.height - 2;

        this.ctx.strokeStyle = COLORS.border;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            SCREEN.fontSize * 0.3,
            SCREEN.lineHeight * 0.5,
            (width + 1) * (SCREEN.fontSize * 0.6),
            (height + 1) * SCREEN.lineHeight
        );
    }

    drawLine(line) {
        const y = line * SCREEN.lineHeight;
        const width = (SCREEN.width - 4) * (SCREEN.fontSize * 0.6);

        this.ctx.strokeStyle = COLORS.dim;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(SCREEN.fontSize * 0.6 * 2, y);
        this.ctx.lineTo(width, y);
        this.ctx.stroke();
    }

    drawText(text, x, line, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${SCREEN.fontSize}px 'Courier New', monospace`;
        this.ctx.textBaseline = 'top';

        const y = line * SCREEN.lineHeight;

        if (x === 'center') {
            this.ctx.textAlign = 'center';
            this.ctx.fillText(text, this.canvas.width / 2, y);
        } else {
            this.ctx.textAlign = 'left';
            const xPos = x * (SCREEN.fontSize * 0.6);
            this.ctx.fillText(text, xPos, y);
        }
    }
}

// Initialize
let textInterface;
window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    textInterface = new TextInterface(canvas);
});
