// Firelink Shrine - Roguelike Portfolio Engine
// Main game engine with player, world, NPCs, dialogue, and audio

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    tileSize: 24, // Larger tiles for more detail
    canvasWidth: 960,
    canvasHeight: 640,
    playerColor: '#e8d5c4',
    playerChar: '●',
    moveSpeed: 8,
    interactionDistance: 1.5,
    // Ico-inspired visual settings
    ambientLight: 0.7,
    wallHeight: 32, // Visual height for pseudo-3D walls
    shadowOpacity: 0.4,
    lightFalloff: 0.15
};

// ============================================================================
// INPUT MANAGER
// ============================================================================

class InputManager {
    constructor() {
        this.keys = {};
        this.keyPressed = {};

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;

            // Prevent default for game controls
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'e'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            this.keyPressed[e.key.toLowerCase()] = false;
        });
    }

    isDown(key) {
        return this.keys[key.toLowerCase()] || false;
    }

    wasPressed(key) {
        key = key.toLowerCase();
        if (this.keys[key] && !this.keyPressed[key]) {
            this.keyPressed[key] = true;
            return true;
        }
        return false;
    }
}

// ============================================================================
// AUDIO MANAGER
// ============================================================================

class AudioManager {
    constructor() {
        this.bgm = null;
        this.muted = false;
        this.volume = 0.5;
        this.audioContext = null;
        this.gainNode = null;
        this.sounds = {};
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Initialize Web Audio API
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;

            // Load background music
            this.bgm = new Audio('Stone.mp3');
            this.bgm.loop = true;
            this.bgm.volume = this.volume;

            // Create MediaElementSource to connect to Web Audio API
            const source = this.audioContext.createMediaElementSource(this.bgm);
            source.connect(this.gainNode);

            // Generate simple sound effects using Web Audio API
            this.generateSoundEffects();

            this.initialized = true;
        } catch (error) {
            console.warn('Audio initialization failed:', error);
        }
    }

    async play() {
        if (!this.initialized) {
            await this.init();
        }

        if (this.bgm && !this.muted) {
            try {
                await this.bgm.play();
                this.updateIndicator();
            } catch (error) {
                console.warn('Audio play failed:', error);
            }
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.bgm) {
            this.bgm.volume = this.muted ? 0 : this.volume;
        }
        this.updateIndicator();
    }

    adjustVolume(delta) {
        this.volume = Math.max(0, Math.min(1, this.volume + delta));
        if (this.bgm && !this.muted) {
            this.bgm.volume = this.volume;
        }
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
        this.updateIndicator();
    }

    updateIndicator() {
        const indicator = document.getElementById('audioIndicator');
        if (indicator) {
            if (this.muted) {
                indicator.textContent = '🔇 MUTED';
            } else {
                const bars = Math.floor(this.volume * 5);
                indicator.textContent = `🔊 ${'█'.repeat(bars)}${'░'.repeat(5 - bars)}`;
            }
        }
    }

    generateSoundEffects() {
        // Simple beep for footsteps
        this.sounds.step = () => this.playTone(100, 0.05, 0.02);

        // Chime for interactions
        this.sounds.interact = () => this.playTone(440, 0.1, 0.1);

        // Menu navigation
        this.sounds.menuMove = () => this.playTone(300, 0.05, 0.03);

        // Key pickup
        this.sounds.pickup = () => {
            this.playTone(523, 0.05, 0.1);
            setTimeout(() => this.playTone(659, 0.05, 0.1), 100);
        };

        // Door unlock
        this.sounds.unlock = () => {
            this.playTone(200, 0.1, 0.15);
            setTimeout(() => this.playTone(300, 0.1, 0.15), 150);
        };
    }

    playTone(frequency, duration, volume) {
        if (!this.audioContext || this.muted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.value = volume * this.volume;

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
}

// ============================================================================
// PARTICLE SYSTEM
// ============================================================================

class Particle {
    constructor(x, y, char, color, lifetime, velocityX = 0, velocityY = 0) {
        this.x = x;
        this.y = y;
        this.char = char;
        this.color = color;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.opacity = 1;
    }

    update() {
        this.lifetime--;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.opacity = this.lifetime / this.maxLifetime;
        return this.lifetime > 0;
    }

    render(ctx, tileSize, offsetX, offsetY) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = `${tileSize}px Alexandria, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
            this.char,
            (this.x * tileSize) + offsetX + tileSize / 2,
            (this.y * tileSize) + offsetY + tileSize / 2
        );
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, char, color, lifetime, velocityX = 0, velocityY = 0) {
        this.particles.push(new Particle(x, y, char, color, lifetime, velocityX, velocityY));
    }

    update() {
        this.particles = this.particles.filter(p => p.update());
    }

    render(ctx, tileSize, offsetX, offsetY) {
        this.particles.forEach(p => p.render(ctx, tileSize, offsetX, offsetY));
    }

    // Create bonfire particles - soft and warm
    createBonfireEffect(x, y) {
        if (Math.random() < 0.2) {
            const offsetX = (Math.random() - 0.5) * 0.6;
            const chars = ['·', '·', '°', '˙', '⋅'];
            const colors = ['#ffb366', '#ffc999', '#ffd5b3', '#ffe6cc'];
            this.emit(
                x + offsetX,
                y,
                chars[Math.floor(Math.random() * chars.length)],
                colors[Math.floor(Math.random() * colors.length)],
                40 + Math.random() * 40,
                (Math.random() - 0.5) * 0.03,
                -0.04 - Math.random() * 0.04
            );
        }
    }

    // Create ambient dust particles - soft atmospheric motes
    createAmbientDust(worldWidth, worldHeight) {
        if (Math.random() < 0.03) {
            const chars = ['·', '˙', '⋅'];
            const colors = ['#8a8278', '#9a9288', '#b0a898'];
            this.emit(
                Math.random() * worldWidth,
                Math.random() * worldHeight,
                chars[Math.floor(Math.random() * chars.length)],
                colors[Math.floor(Math.random() * colors.length)],
                80 + Math.random() * 80,
                (Math.random() - 0.5) * 0.01,
                -0.01 + (Math.random() - 0.5) * 0.01
            );
        }
    }
}

// ============================================================================
// PLAYER
// ============================================================================

class Player {
    constructor(x, y, world) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.world = world;
        this.moving = false;
        this.inventory = {
            hasKey: false
        };
    }

    update(input) {
        // If we're moving to a target, interpolate
        if (this.moving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.1) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.moving = false;

                // Check for pickups at current position
                this.checkPickups();
            } else {
                const speed = 0.2;
                this.x += dx * speed;
                this.y += dy * speed;
            }
            return;
        }

        // Handle new movement input
        let moveX = 0;
        let moveY = 0;

        if (input.isDown('w') || input.isDown('arrowup')) moveY = -1;
        if (input.isDown('s') || input.isDown('arrowdown')) moveY = 1;
        if (input.isDown('a') || input.isDown('arrowleft')) moveX = -1;
        if (input.isDown('d') || input.isDown('arrowright')) moveX = 1;

        // Only allow cardinal directions (no diagonal)
        if (moveX !== 0 && moveY !== 0) {
            moveY = 0; // Prioritize horizontal movement
        }

        if (moveX !== 0 || moveY !== 0) {
            const newX = Math.round(this.x) + moveX;
            const newY = Math.round(this.y) + moveY;

            if (this.world.isWalkable(newX, newY)) {
                this.targetX = newX;
                this.targetY = newY;
                this.moving = true;

                // Play step sound
                if (game.audio) {
                    game.audio.playSound('step');
                }
            }
        }
    }

    checkPickups() {
        const tile = this.world.getTile(Math.round(this.x), Math.round(this.y));
        if (tile === 'k' && !this.inventory.hasKey) {
            this.inventory.hasKey = true;
            this.world.removeTile(Math.round(this.x), Math.round(this.y));
            game.audio.playSound('pickup');
            game.showMessage('You found a bronze key! It gleams with ancient power.');
        }
    }

    render(ctx, tileSize, offsetX, offsetY) {
        ctx.save();

        const renderX = (this.x * tileSize) + offsetX + tileSize / 2;
        const renderY = (this.y * tileSize) + offsetY + tileSize / 2;

        // Soft shadow beneath player
        ctx.fillStyle = 'rgba(42, 37, 32, 0.4)';
        ctx.beginPath();
        ctx.ellipse(renderX, renderY + tileSize * 0.4, tileSize * 0.4, tileSize * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Player character with soft glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = CONFIG.playerColor;

        ctx.fillStyle = CONFIG.playerColor;
        ctx.font = `${tileSize * 0.8}px Alexandria, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Gentle pulsing
        const pulse = Math.sin(Date.now() / 800) * 0.05 + 0.95;
        ctx.globalAlpha = pulse;

        ctx.fillText(CONFIG.playerChar, renderX, renderY);

        ctx.restore();
    }

    getNearbyNPC() {
        const playerTileX = Math.round(this.x);
        const playerTileY = Math.round(this.y);

        for (const npc of this.world.npcs) {
            const dx = npc.x - playerTileX;
            const dy = npc.y - playerTileY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= CONFIG.interactionDistance) {
                return npc;
            }
        }

        return null;
    }

    tryUnlockDoor() {
        if (!this.inventory.hasKey) return false;

        const playerTileX = Math.round(this.x);
        const playerTileY = Math.round(this.y);

        // Check adjacent tiles for secret door
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        for (const dir of directions) {
            const checkX = playerTileX + dir.x;
            const checkY = playerTileY + dir.y;
            const tile = this.world.getTile(checkX, checkY);

            if (tile === 'D') {
                this.world.unlockDoor(checkX, checkY);
                game.audio.playSound('unlock');
                game.showMessage('The bronze key fits perfectly! The secret door opens...');
                return true;
            }
        }

        return false;
    }
}

// ============================================================================
// NPC
// ============================================================================

class NPC {
    constructor(x, y, type, data) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.data = data;
        this.animFrame = 0;
        this.animCounter = 0;
    }

    update() {
        // Simple idle animation
        this.animCounter++;
        if (this.animCounter > 60) {
            this.animFrame = (this.animFrame + 1) % 2;
            this.animCounter = 0;
        }
    }

    render(ctx, tileSize, offsetX, offsetY) {
        ctx.save();

        // Soft, warm glow instead of harsh glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.data.color;

        // Subtle breathing animation
        const scale = 1 + (this.animFrame === 0 ? 0 : 0.03);
        const opacity = 0.9 + (this.animFrame === 0 ? 0 : 0.1);

        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.data.color;
        ctx.font = `${tileSize * scale}px Alexandria, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const renderX = (this.x * tileSize) + offsetX + tileSize / 2;
        const renderY = (this.y * tileSize) + offsetY + tileSize / 2;

        // Add soft halo
        ctx.shadowBlur = 30;
        ctx.fillText(this.data.char, renderX, renderY);

        ctx.restore();
    }
}

// ============================================================================
// WORLD
// ============================================================================

class World {
    constructor(levelData) {
        this.width = levelData.width;
        this.height = levelData.height;
        this.tiles = levelData.map.map(row => row.split(''));
        this.tileConfig = levelData.tiles;
        this.npcs = [];
        this.bonfires = [];

        // Find and create NPCs
        this.initializeNPCs(levelData);

        // Find bonfire locations
        this.findBonfires();
    }

    initializeNPCs(levelData) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                if (levelData.npcs[tile]) {
                    this.npcs.push(new NPC(x, y, tile, levelData.npcs[tile]));
                }
            }
        }
    }

    findBonfires() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.tiles[y][x] === 'f') {
                    this.bonfires.push({ x, y });
                }
            }
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return ' ';
        }
        return this.tiles[y][x];
    }

    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        const config = this.tileConfig[tile];
        if (!config) return false;

        // NPCs block movement
        for (const npc of this.npcs) {
            if (npc.x === x && npc.y === y) return false;
        }

        return config.walkable;
    }

    removeTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.tiles[y][x] = ','; // Replace with floor
        }
    }

    unlockDoor(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            if (this.tiles[y][x] === 'D') {
                this.tiles[y][x] = '.'; // Replace with walkable floor
            }
        }
    }

    update() {
        this.npcs.forEach(npc => npc.update());
    }

    render(ctx, tileSize, offsetX, offsetY) {
        // Multi-pass rendering for depth and atmosphere

        // Pass 1: Floor layer with subtle shading
        this.renderFloor(ctx, tileSize, offsetX, offsetY);

        // Pass 2: Shadows cast by walls
        this.renderShadows(ctx, tileSize, offsetX, offsetY);

        // Pass 3: Walls with height/depth
        this.renderWalls(ctx, tileSize, offsetX, offsetY);

        // Pass 4: Props (bonfire, plants, etc.)
        this.renderProps(ctx, tileSize, offsetX, offsetY);

        // Pass 5: Lighting layer
        this.renderLighting(ctx, tileSize, offsetX, offsetY);

        // Pass 6: NPCs on top
        this.npcs.forEach(npc => npc.render(ctx, tileSize, offsetX, offsetY));
    }

    renderFloor(ctx, tileSize, offsetX, offsetY) {
        ctx.font = `${tileSize * 0.5}px Alexandria, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const config = this.tileConfig[tile];

                if (!config || !config.floor) continue;

                const renderX = (x * tileSize) + offsetX + tileSize / 2;
                const renderY = (y * tileSize) + offsetY + tileSize / 2;

                // Fill floor tile with stone color
                ctx.fillStyle = config.color;
                ctx.fillRect(
                    (x * tileSize) + offsetX,
                    (y * tileSize) + offsetY,
                    tileSize,
                    tileSize
                );

                // Add subtle texture
                ctx.fillStyle = this.adjustColor(config.color, -0.05);
                ctx.fillText(config.char, renderX, renderY);
            }
        }
    }

    renderShadows(ctx, tileSize, offsetX, offsetY) {
        ctx.fillStyle = `rgba(42, 37, 32, ${CONFIG.shadowOpacity})`;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const config = this.tileConfig[tile];

                if (!config || !config.wall) continue;

                // Cast shadow downward and to the right
                const shadowOffset = 4;
                ctx.fillRect(
                    (x * tileSize) + offsetX + shadowOffset,
                    (y * tileSize) + offsetY + tileSize - shadowOffset,
                    tileSize,
                    shadowOffset * 2
                );
            }
        }
    }

    renderWalls(ctx, tileSize, offsetX, offsetY) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const config = this.tileConfig[tile];

                if (!config || !config.wall) continue;
                if (FIRELINK_SHRINE.npcs[tile]) continue;

                const renderX = (x * tileSize) + offsetX;
                const renderY = (y * tileSize) + offsetY;

                // Draw wall with height/depth
                // Top edge (lighter)
                ctx.fillStyle = this.adjustColor(config.color, 0.1);
                ctx.fillRect(renderX, renderY - CONFIG.wallHeight * 0.3, tileSize, 4);

                // Main wall body
                const gradient = ctx.createLinearGradient(
                    renderX, renderY - CONFIG.wallHeight * 0.3,
                    renderX, renderY + tileSize
                );
                gradient.addColorStop(0, this.adjustColor(config.color, 0.05));
                gradient.addColorStop(1, this.adjustColor(config.color, -0.1));

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    renderX,
                    renderY - CONFIG.wallHeight * 0.3 + 4,
                    tileSize,
                    tileSize + CONFIG.wallHeight * 0.3
                );

                // Edge highlights for depth
                ctx.fillStyle = this.adjustColor(config.color, 0.15);
                ctx.fillRect(renderX, renderY, 2, tileSize);
            }
        }
    }

    renderProps(ctx, tileSize, offsetX, offsetY) {
        ctx.font = `${tileSize}px Alexandria, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const config = this.tileConfig[tile];

                if (!config || config.wall || config.floor) continue;
                if (FIRELINK_SHRINE.npcs[tile]) continue;

                const renderX = (x * tileSize) + offsetX + tileSize / 2;
                const renderY = (y * tileSize) + offsetY + tileSize / 2;

                ctx.save();

                // Gentle glow for light sources
                if (config.glow && config.light) {
                    ctx.shadowBlur = config.light * 8;
                    ctx.shadowColor = config.color;
                }

                ctx.fillStyle = config.color;
                ctx.fillText(config.char, renderX, renderY);

                ctx.restore();
            }
        }
    }

    renderLighting(ctx, tileSize, offsetX, offsetY) {
        // Soft atmospheric lighting from light sources
        ctx.globalCompositeOperation = 'lighter';

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.tiles[y][x];
                const config = this.tileConfig[tile];

                if (!config || !config.light) continue;

                const lightRadius = config.light * tileSize * 2;
                const centerX = (x * tileSize) + offsetX + tileSize / 2;
                const centerY = (y * tileSize) + offsetY + tileSize / 2;

                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, lightRadius
                );

                const lightColor = config.color;
                gradient.addColorStop(0, this.hexToRGBA(lightColor, 0.3));
                gradient.addColorStop(0.5, this.hexToRGBA(lightColor, 0.1));
                gradient.addColorStop(1, this.hexToRGBA(lightColor, 0));

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    centerX - lightRadius,
                    centerY - lightRadius,
                    lightRadius * 2,
                    lightRadius * 2
                );
            }
        }

        ctx.globalCompositeOperation = 'source-over';
    }

    adjustColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount * 255));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount * 255));
        const b = Math.max(0, Math.min(255, (num & 0xff) + amount * 255));
        return `rgb(${r}, ${g}, ${b})`;
    }

    hexToRGBA(hex, alpha) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = (num >> 16) & 0xff;
        const g = (num >> 8) & 0xff;
        const b = num & 0xff;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// ============================================================================
// DIALOGUE SYSTEM
// ============================================================================

class DialogueSystem {
    constructor() {
        this.active = false;
        this.npc = null;
        this.selectedIndex = 0;
        this.typewriterText = '';
        this.fullText = '';
        this.typewriterIndex = 0;
        this.typewriterSpeed = 2;
        this.typewriterCounter = 0;
    }

    open(npc) {
        this.active = true;
        this.npc = npc;
        this.selectedIndex = 0;
        this.fullText = `${npc.data.name}: ${npc.data.description}`;
        this.typewriterText = '';
        this.typewriterIndex = 0;

        game.audio.playSound('interact');
    }

    close() {
        this.active = false;
        this.npc = null;
    }

    update(input) {
        if (!this.active) return;

        // Update typewriter effect
        if (this.typewriterIndex < this.fullText.length) {
            this.typewriterCounter++;
            if (this.typewriterCounter >= this.typewriterSpeed) {
                this.typewriterText += this.fullText[this.typewriterIndex];
                this.typewriterIndex++;
                this.typewriterCounter = 0;
            }
        }

        // Handle input
        if (input.wasPressed('escape')) {
            this.close();
            return;
        }

        if (input.wasPressed('arrowup') || input.wasPressed('w')) {
            if (this.selectedIndex > 0) {
                this.selectedIndex--;
                game.audio.playSound('menuMove');
            }
        }

        if (input.wasPressed('arrowdown') || input.wasPressed('s')) {
            if (this.selectedIndex < this.npc.data.items.length - 1) {
                this.selectedIndex++;
                game.audio.playSound('menuMove');
            }
        }

        if (input.wasPressed('enter') || input.wasPressed('e')) {
            const item = this.npc.data.items[this.selectedIndex];
            if (item.url && item.url !== '#contact' && item.url !== '#links') {
                window.location.href = item.url;
            }
        }
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (!this.active || !this.npc) return;

        const boxHeight = canvasHeight * 0.4;
        const boxY = canvasHeight - boxHeight - 20;
        const padding = 20;

        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(20, boxY, canvasWidth - 40, boxHeight);

        // Border
        ctx.strokeStyle = this.npc.data.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, boxY, canvasWidth - 40, boxHeight);

        // Title
        ctx.fillStyle = this.npc.data.color;
        ctx.font = '20px Alexandria, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`┌─ ${this.npc.data.title} ─┐`, 40, boxY + 30);

        // Typewriter description
        ctx.fillStyle = '#c0c0c0';
        ctx.font = '14px Alexandria, monospace';
        this.wrapText(ctx, this.typewriterText, 40, boxY + 60, canvasWidth - 80, 18);

        // Menu items
        const menuStartY = boxY + 100;
        ctx.font = '16px Alexandria, monospace';

        this.npc.data.items.forEach((item, index) => {
            const itemY = menuStartY + (index * 30);
            const isSelected = index === this.selectedIndex;

            if (isSelected) {
                ctx.fillStyle = this.npc.data.color;
                ctx.fillText('►', 40, itemY);
            }

            ctx.fillStyle = isSelected ? '#ffffff' : '#808080';
            ctx.fillText(item.name, 60, itemY);

            // Description
            ctx.font = '12px Alexandria, monospace';
            ctx.fillStyle = '#606060';
            ctx.fillText(item.description, 250, itemY);
            ctx.font = '16px Alexandria, monospace';
        });

        // Controls hint
        ctx.fillStyle = '#505050';
        ctx.font = '12px Alexandria, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ Navigate | ENTER Select | ESC Close', canvasWidth / 2, canvasHeight - 40);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line, x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }
}

// ============================================================================
// MESSAGE SYSTEM
// ============================================================================

class MessageSystem {
    constructor() {
        this.messages = [];
    }

    show(text, duration = 180) {
        this.messages.push({ text, duration, maxDuration: duration });
    }

    update() {
        this.messages = this.messages.filter(msg => {
            msg.duration--;
            return msg.duration > 0;
        });
    }

    render(ctx, canvasWidth, canvasHeight) {
        if (this.messages.length === 0) return;

        ctx.save();
        ctx.font = '16px Alexandria, monospace';
        ctx.textAlign = 'center';

        this.messages.forEach((msg, index) => {
            const opacity = Math.min(1, msg.duration / 30);
            const y = canvasHeight - 100 - (index * 25);

            ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
            ctx.fillText(msg.text, canvasWidth / 2, y);
        });

        ctx.restore();
    }
}

// ============================================================================
// MAIN GAME
// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.effectsCanvas = document.getElementById('effectsCanvas');
        this.effects = new CRTEffects(this.effectsCanvas, this.canvas);

        this.input = new InputManager();
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.dialogue = new DialogueSystem();
        this.messages = new MessageSystem();

        this.world = null;
        this.player = null;
        this.camera = { x: 0, y: 0 };

        this.running = false;
        this.loaded = false;

        this.setupCanvas();
        this.init();
    }

    setupCanvas() {
        this.canvas.width = CONFIG.canvasWidth;
        this.canvas.height = CONFIG.canvasHeight;
        this.effectsCanvas.width = CONFIG.canvasWidth;
        this.effectsCanvas.height = CONFIG.canvasHeight;

        // Disable image smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;
    }

    async init() {
        // Create world and player
        this.world = new World(FIRELINK_SHRINE);
        this.player = new Player(
            FIRELINK_SHRINE.playerStart.x,
            FIRELINK_SHRINE.playerStart.y,
            this.world
        );

        // Wait a moment then start
        setTimeout(() => {
            this.loaded = true;
            this.fadeInGame();
        }, 1000);
    }

    fadeInGame() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.add('fade-out');

        // Start audio on first interaction
        const startAudio = () => {
            this.audio.play();
            document.removeEventListener('keydown', startAudio);
            document.removeEventListener('click', startAudio);
        };

        document.addEventListener('keydown', startAudio);
        document.addEventListener('click', startAudio);

        setTimeout(() => {
            loadingScreen.style.display = 'none';
            this.start();
            this.showMessage('Welcome to Firelink Shrine. Speak with the Fire Keeper to begin your journey.', 300);
        }, 1000);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.running) return;

        const now = performance.now();
        const dt = (now - this.lastTime) / 16.67; // Normalize to 60fps
        this.lastTime = now;

        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        // Handle global input
        if (this.input.wasPressed('m')) {
            this.audio.toggleMute();
        }
        if (this.input.wasPressed('=') || this.input.wasPressed('+')) {
            this.audio.adjustVolume(0.1);
        }
        if (this.input.wasPressed('-')) {
            this.audio.adjustVolume(-0.1);
        }

        // Update dialogue system
        if (this.dialogue.active) {
            this.dialogue.update(this.input);
            return; // Don't update game while dialogue is open
        }

        // Handle interactions
        if (this.input.wasPressed('e')) {
            const nearbyNPC = this.player.getNearbyNPC();
            if (nearbyNPC) {
                this.dialogue.open(nearbyNPC);
            } else {
                // Try to unlock door
                this.player.tryUnlockDoor();
            }
        }

        // Update game objects
        this.player.update(this.input);
        this.world.update();
        this.particles.update();
        this.messages.update();

        // Update camera to follow player
        this.updateCamera();

        // Generate particles
        this.generateParticles();
    }

    updateCamera() {
        const targetX = (this.player.x * CONFIG.tileSize) - CONFIG.canvasWidth / 2;
        const targetY = (this.player.y * CONFIG.tileSize) - CONFIG.canvasHeight / 2;

        // Smooth camera movement
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;

        // Clamp camera to world bounds
        const maxX = (this.world.width * CONFIG.tileSize) - CONFIG.canvasWidth;
        const maxY = (this.world.height * CONFIG.tileSize) - CONFIG.canvasHeight;

        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
    }

    generateParticles() {
        // Bonfire particles
        this.world.bonfires.forEach(bonfire => {
            this.particles.createBonfireEffect(bonfire.x, bonfire.y);
        });

        // Ambient dust
        this.particles.createAmbientDust(this.world.width, this.world.height);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const offsetX = -this.camera.x;
        const offsetY = -this.camera.y;

        // Render world
        this.world.render(this.ctx, CONFIG.tileSize, offsetX, offsetY);

        // Render particles
        this.particles.render(this.ctx, CONFIG.tileSize, offsetX, offsetY);

        // Render player
        this.player.render(this.ctx, CONFIG.tileSize, offsetX, offsetY);

        // Render interaction prompt if near NPC
        if (!this.dialogue.active) {
            const nearbyNPC = this.player.getNearbyNPC();
            if (nearbyNPC) {
                this.renderInteractionPrompt(nearbyNPC, offsetX, offsetY);
            }
        }

        // Render dialogue
        this.dialogue.render(this.ctx, this.canvas.width, this.canvas.height);

        // Render messages
        this.messages.render(this.ctx, this.canvas.width, this.canvas.height);

        // Apply CRT effects
        this.effects.applyEffects();
    }

    renderInteractionPrompt(npc, offsetX, offsetY) {
        this.ctx.save();
        this.ctx.font = '14px Alexandria, monospace';
        this.ctx.textAlign = 'center';

        const promptX = (npc.x * CONFIG.tileSize) + offsetX + CONFIG.tileSize / 2;
        const promptY = (npc.y * CONFIG.tileSize) + offsetY - 12;

        // Soft glow
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = npc.data.color;

        // Pulsing animation
        const pulse = Math.sin(Date.now() / 300) * 0.15 + 0.85;
        this.ctx.globalAlpha = pulse;

        // Use NPC's color but lighter
        const color = this.adjustLightness(npc.data.color, 0.2);
        this.ctx.fillStyle = color;

        this.ctx.fillText('[E] Talk', promptX, promptY);

        this.ctx.restore();
    }

    adjustLightness(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount * 255));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount * 255));
        const b = Math.max(0, Math.min(255, (num & 0xff) + amount * 255));
        return `rgb(${r}, ${g}, ${b})`;
    }

    showMessage(text) {
        this.messages.show(text);
    }
}

// ============================================================================
// START GAME
// ============================================================================

let game;

window.addEventListener('load', () => {
    game = new Game();
});
