/**
 * Random utilities for Drift
 * Includes Perlin noise, weighted random, and various distributions
 */

const DriftRandom = {
  // Simple seeded random for reproducibility (optional)
  seed: null,

  /**
   * Basic random with optional seed
   */
  random() {
    return Math.random();
  },

  /**
   * Random float between min and max
   */
  range(min, max) {
    return min + this.random() * (max - min);
  },

  /**
   * Random integer between min and max (inclusive)
   */
  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  },

  /**
   * Random choice from array
   */
  choice(arr) {
    return arr[Math.floor(this.random() * arr.length)];
  },

  /**
   * Weighted random choice
   * @param {Array} items - Array of {value, weight} objects
   */
  weightedChoice(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.random() * totalWeight;

    for (const item of items) {
      random -= item.weight;
      if (random <= 0) {
        return item.value;
      }
    }
    return items[items.length - 1].value;
  },

  /**
   * Gaussian (normal) distribution
   * Uses Box-Muller transform
   */
  gaussian(mean = 0, stdDev = 1) {
    const u1 = this.random();
    const u2 = this.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  },

  /**
   * Probability check
   */
  chance(probability) {
    return this.random() < probability;
  },

  /**
   * Shuffle array (Fisher-Yates)
   */
  shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  // ============ PERLIN NOISE ============
  // Simplified 1D/2D Perlin noise implementation

  _perlinGrad: null,
  _perlinPerm: null,

  _initPerlin() {
    if (this._perlinPerm) return;

    // Permutation table
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    this._perlinPerm = [...perm, ...perm]; // Double for overflow

    // Gradient vectors for 2D
    this._perlinGrad = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
  },

  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  _lerp(a, b, t) {
    return a + t * (b - a);
  },

  _grad1D(hash, x) {
    return (hash & 1) === 0 ? x : -x;
  },

  _grad2D(hash, x, y) {
    const g = this._perlinGrad[hash & 7];
    return g[0] * x + g[1] * y;
  },

  /**
   * 1D Perlin noise
   * @param {number} x - Input coordinate
   * @returns {number} Value between -1 and 1
   */
  perlin1D(x) {
    this._initPerlin();

    const xi = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    const u = this._fade(xf);

    const a = this._perlinPerm[xi];
    const b = this._perlinPerm[xi + 1];

    return this._lerp(
      this._grad1D(a, xf),
      this._grad1D(b, xf - 1),
      u
    );
  },

  /**
   * 2D Perlin noise
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Value between -1 and 1
   */
  perlin2D(x, y) {
    this._initPerlin();

    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this._fade(xf);
    const v = this._fade(yf);

    const aa = this._perlinPerm[this._perlinPerm[xi] + yi];
    const ab = this._perlinPerm[this._perlinPerm[xi] + yi + 1];
    const ba = this._perlinPerm[this._perlinPerm[xi + 1] + yi];
    const bb = this._perlinPerm[this._perlinPerm[xi + 1] + yi + 1];

    const x1 = this._lerp(
      this._grad2D(aa, xf, yf),
      this._grad2D(ba, xf - 1, yf),
      u
    );
    const x2 = this._lerp(
      this._grad2D(ab, xf, yf - 1),
      this._grad2D(bb, xf - 1, yf - 1),
      u
    );

    return this._lerp(x1, x2, v);
  },

  /**
   * Fractal Brownian Motion (layered noise)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate (optional, for 1D use 0)
   * @param {number} octaves - Number of layers
   * @param {number} persistence - Amplitude falloff per octave
   */
  fbm(x, y = 0, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlin2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  },

  /**
   * Smoothly varying value over time
   * Good for slowly evolving parameters
   * @param {number} time - Current time
   * @param {number} speed - How fast it changes
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   */
  smoothValue(time, speed = 0.1, min = 0, max = 1) {
    const noise = (this.perlin1D(time * speed) + 1) / 2; // 0 to 1
    return min + noise * (max - min);
  }
};

// Make available globally
window.DriftRandom = DriftRandom;
