/**
 * Synth Patches - Synthesis parameter presets for different timbres
 *
 * Defines synthesis parameters for various instruments and textures
 * optimized for ambient music
 */

const SynthPatches = {

    /**
     * Drone patches - long sustained tones
     */
    drones: {
        subDrone: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.5 },
                { type: 'sine', detune: -2, gain: 0.3 },
                { type: 'triangle', detune: 1200, gain: 0.2 } // Octave up
            ],
            envelope: {
                attack: 3.0,
                decay: 0.5,
                sustain: 0.9,
                release: 4.0
            },
            filter: {
                type: 'lowpass',
                frequency: 400,
                Q: 0.5
            },
            vibrato: {
                rate: 0.1,
                depth: 2
            }
        },

        warmDrone: {
            oscillators: [
                { type: 'triangle', detune: 0, gain: 0.4 },
                { type: 'triangle', detune: -7, gain: 0.3 },
                { type: 'sine', detune: 5, gain: 0.3 }
            ],
            envelope: {
                attack: 2.5,
                decay: 1.0,
                sustain: 0.85,
                release: 3.5
            },
            filter: {
                type: 'lowpass',
                frequency: 800,
                Q: 1.0
            },
            vibrato: {
                rate: 0.15,
                depth: 3
            }
        }
    },

    /**
     * Pad patches - harmonic beds
     */
    pads: {
        softPad: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.3 },
                { type: 'sine', detune: -4, gain: 0.25 },
                { type: 'sine', detune: 4, gain: 0.25 },
                { type: 'triangle', detune: 1200, gain: 0.15 }
            ],
            envelope: {
                attack: 1.5,
                decay: 0.5,
                sustain: 0.7,
                release: 2.5
            },
            filter: {
                type: 'lowpass',
                frequency: 2000,
                Q: 0.7
            },
            tremolo: {
                rate: 0.5,
                depth: 0.1
            }
        },

        lushPad: {
            oscillators: [
                { type: 'sawtooth', detune: 0, gain: 0.15 },
                { type: 'sawtooth', detune: -7, gain: 0.15 },
                { type: 'sawtooth', detune: 7, gain: 0.15 },
                { type: 'triangle', detune: 1200, gain: 0.2 }
            ],
            envelope: {
                attack: 2.0,
                decay: 1.0,
                sustain: 0.75,
                release: 3.0
            },
            filter: {
                type: 'lowpass',
                frequency: 1500,
                Q: 1.5
            },
            chorus: true
        }
    },

    /**
     * Melodic patches - lead voices
     */
    melodic: {
        pureTone: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.6 },
                { type: 'sine', detune: -2, gain: 0.3 }
            ],
            envelope: {
                attack: 0.3,
                decay: 0.2,
                sustain: 0.6,
                release: 1.2
            },
            filter: {
                type: 'lowpass',
                frequency: 3000,
                Q: 0.5
            },
            vibrato: {
                rate: 4.0,
                depth: 5
            }
        },

        flute: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.5 },
                { type: 'sine', detune: 1200, gain: 0.2 },
                { type: 'sine', detune: 1900, gain: 0.1 }
            ],
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.5,
                release: 0.8
            },
            filter: {
                type: 'lowpass',
                frequency: 4000,
                Q: 1.0
            },
            vibrato: {
                rate: 5.0,
                depth: 8
            }
        },

        bells: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.4 },
                { type: 'sine', detune: 1200, gain: 0.3 },
                { type: 'sine', detune: 1783, gain: 0.2 }, // Minor 7th
                { type: 'sine', detune: 2400, gain: 0.1 }
            ],
            envelope: {
                attack: 0.01,
                decay: 1.5,
                sustain: 0.0,
                release: 2.0
            },
            filter: {
                type: 'lowpass',
                frequency: 6000,
                Q: 0.3
            }
        }
    },

    /**
     * Texture patches - atmospheric sounds
     */
    textures: {
        breath: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.1 },
                { type: 'sine', detune: 700, gain: 0.15 }
            ],
            noise: {
                type: 'white',
                gain: 0.3
            },
            envelope: {
                attack: 1.0,
                decay: 0.5,
                sustain: 0.4,
                release: 1.5
            },
            filter: {
                type: 'bandpass',
                frequency: 1500,
                Q: 2.0
            }
        },

        shimmer: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.2 },
                { type: 'sine', detune: 1200, gain: 0.2 },
                { type: 'sine', detune: 2400, gain: 0.15 },
                { type: 'sine', detune: 3600, gain: 0.1 }
            ],
            envelope: {
                attack: 0.5,
                decay: 1.0,
                sustain: 0.3,
                release: 2.0
            },
            filter: {
                type: 'highpass',
                frequency: 1000,
                Q: 0.7
            },
            tremolo: {
                rate: 6.0,
                depth: 0.3
            }
        },

        granular: {
            oscillators: [
                { type: 'sine', detune: 0, gain: 0.3 }
            ],
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.2,
                release: 0.3
            },
            filter: {
                type: 'bandpass',
                frequency: 2000,
                Q: 3.0
            },
            randomize: {
                frequency: 0.2, // 20% random pitch variation
                filter: 0.4 // 40% random filter variation
            }
        }
    },

    /**
     * Pulse patches - rhythmic elements
     */
    pulse: {
        softPulse: {
            oscillators: [
                { type: 'triangle', detune: 0, gain: 0.4 },
                { type: 'sine', detune: 1200, gain: 0.2 }
            ],
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.0,
                release: 0.4
            },
            filter: {
                type: 'lowpass',
                frequency: 1500,
                Q: 1.0
            }
        },

        pluck: {
            oscillators: [
                { type: 'triangle', detune: 0, gain: 0.5 },
                { type: 'triangle', detune: 1200, gain: 0.3 }
            ],
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.0,
                release: 0.5
            },
            filter: {
                type: 'lowpass',
                frequency: 3000,
                Q: 2.0,
                envelopeAmount: 2000 // Filter follows envelope
            }
        }
    },

    /**
     * Get a patch by category and name
     */
    getPatch(category, name) {
        if (this[category] && this[category][name]) {
            return JSON.parse(JSON.stringify(this[category][name])); // Deep copy
        }

        console.warn(`Patch ${category}/${name} not found, using default`);
        return this.pads.softPad;
    },

    /**
     * Blend two patches
     */
    blendPatches(patch1, patch2, mix = 0.5) {
        const blended = JSON.parse(JSON.stringify(patch1));

        // Blend envelope
        blended.envelope.attack = patch1.envelope.attack * (1 - mix) + patch2.envelope.attack * mix;
        blended.envelope.decay = patch1.envelope.decay * (1 - mix) + patch2.envelope.decay * mix;
        blended.envelope.sustain = patch1.envelope.sustain * (1 - mix) + patch2.envelope.sustain * mix;
        blended.envelope.release = patch1.envelope.release * (1 - mix) + patch2.envelope.release * mix;

        // Blend filter
        blended.filter.frequency = patch1.filter.frequency * (1 - mix) + patch2.filter.frequency * mix;
        blended.filter.Q = patch1.filter.Q * (1 - mix) + patch2.filter.Q * mix;

        return blended;
    }
};
