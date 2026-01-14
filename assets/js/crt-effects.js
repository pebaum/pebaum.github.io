// CRT Post-Processing Effects
// Handles scanlines, bloom, vignette, chromatic aberration, etc.

class CRTEffects {
    constructor(canvas, sourceCanvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sourceCanvas = sourceCanvas;
        this.sourceCtx = sourceCanvas.getContext('2d');

        // Subtle Ico-inspired effects instead of harsh CRT
        this.scanlineOpacity = 0.03; // Very subtle
        this.scanlineSpeed = 0.2;
        this.scanlineOffset = 0;

        this.vignetteStrength = 0.3; // Gentler vignette
        this.bloomEnabled = true;
        this.atmosphericHaze = true;

        this.time = 0;
    }

    applyEffects() {
        this.time++;

        // Copy source canvas to effects canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.sourceCanvas, 0, 0);

        // Apply soft atmospheric effects
        if (this.bloomEnabled) {
            this.applyBloom();
        }
        if (this.atmosphericHaze) {
            this.applyAtmosphericHaze();
        }
        this.applyScanlines(); // Very subtle
        this.applyVignette();
        // No harsh flicker for Ico aesthetic
    }

    applyBloom() {
        // Simple bloom effect using shadowBlur
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Find bright pixels and enhance them
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;

            // If pixel is bright, enhance it
            if (brightness > 128) {
                const boost = (brightness - 128) / 128;
                data[i] = Math.min(255, r + r * boost * 0.2);
                data[i + 1] = Math.min(255, g + g * boost * 0.2);
                data[i + 2] = Math.min(255, b + b * boost * 0.2);
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    applyScanlines() {
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = '#000';

        // Animate scanline offset
        this.scanlineOffset += this.scanlineSpeed;
        if (this.scanlineOffset > 4) this.scanlineOffset = 0;

        // Draw horizontal scanlines
        for (let y = 0; y < this.canvas.height; y += 2) {
            this.ctx.globalAlpha = this.scanlineOpacity;
            this.ctx.fillRect(0, y + this.scanlineOffset, this.canvas.width, 1);
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    applyVignette() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.max(this.canvas.width, this.canvas.height) * 0.7;

        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, radius * 0.3,
            centerX, centerY, radius
        );

        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteStrength})`);

        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over';

        // Rounded corners
        this.applyRoundedCorners();
    }

    applyRoundedCorners() {
        const cornerRadius = 8;

        this.ctx.globalCompositeOperation = 'destination-in';
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.roundRect(0, 0, this.canvas.width, this.canvas.height, cornerRadius);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
    }

    applyAtmosphericHaze() {
        // Soft, warm atmospheric haze inspired by Ico
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 3, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.8
        );

        // Warm, soft light from above
        gradient.addColorStop(0, 'rgba(255, 250, 235, 0.05)');
        gradient.addColorStop(0.6, 'rgba(255, 248, 220, 0.02)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    // Optional chromatic aberration (expensive, disabled by default)
    applyChromaticAberration() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const offset = Math.floor(this.chromaticAberration);

        const newData = new Uint8ClampedArray(data);

        for (let y = 0; y < this.canvas.height; y++) {
            for (let x = 0; x < this.canvas.width; x++) {
                const i = (y * this.canvas.width + x) * 4;

                // Offset red channel
                const rOffset = Math.max(0, i - offset * 4);
                newData[i] = data[rOffset];

                // Keep green
                newData[i + 1] = data[i + 1];

                // Offset blue channel
                const bOffset = Math.min(data.length - 4, i + offset * 4);
                newData[i + 2] = data[bOffset + 2];
                newData[i + 3] = data[i + 3];
            }
        }

        imageData.data.set(newData);
        this.ctx.putImageData(imageData, 0, 0);
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}
