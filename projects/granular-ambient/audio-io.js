/**
 * Audio I/O Module
 * Handles sample loading (mic, file upload, drag-drop) and audio recording
 */

class AudioIO {
  constructor() {
    this.audioContext = null;
    this.sampleBuffer = null;
    this.mediaRecorder = null;
    this.recordingStream = null;
    this.recordingChunks = [];
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.outputRecorder = null;
    this.outputChunks = [];
    this.onSampleLoaded = null; // Callback when sample is loaded
  }

  /**
   * Initialize audio context
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Start recording from microphone
   */
  async startMicRecording() {
    try {
      this.recordingStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      this.mediaRecorder = new MediaRecorder(this.recordingStream);
      this.recordingChunks = [];

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordingChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordingChunks, { type: 'audio/webm' });
        await this.loadFromBlob(blob);

        // Clean up
        this.recordingStream.getTracks().forEach(track => track.stop());
        this.recordingStream = null;
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.recordingStartTime = Date.now();

      // Start timer
      this.updateRecordingTimer();

      return true;
    } catch (error) {
      console.error('Error starting mic recording:', error);
      alert('Could not access microphone. Please check permissions.');
      return false;
    }
  }

  /**
   * Update recording timer display
   */
  updateRecordingTimer() {
    const timerElement = document.getElementById('rec-timer');
    if (!timerElement) return;

    this.recordingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      timerElement.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      // Auto-stop at 10 minutes
      if (elapsed >= 600) {
        this.stopMicRecording();
      }
    }, 100);
  }

  /**
   * Stop mic recording
   */
  stopMicRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  /**
   * Load audio from file
   */
  async loadFromFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      await this.loadFromArrayBuffer(arrayBuffer, file.name);
      return true;
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Could not load audio file. Please try a different format.');
      return false;
    }
  }

  /**
   * Load audio from blob (for mic recordings)
   */
  async loadFromBlob(blob) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      await this.loadFromArrayBuffer(arrayBuffer, 'Microphone Recording');
      return true;
    } catch (error) {
      console.error('Error loading blob:', error);
      alert('Could not process recording.');
      return false;
    }
  }

  /**
   * Load audio from ArrayBuffer
   */
  async loadFromArrayBuffer(arrayBuffer, name = 'Sample') {
    if (!this.audioContext) {
      this.init();
    }

    try {
      const decodedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Normalize the audio to consistent levels
      this.sampleBuffer = this.normalizeBuffer(decodedBuffer);

      // Detect pitch and calculate transpose offset to middle C
      this.detectAndNormalizePitch(this.sampleBuffer);

      // Update UI
      this.updateSampleInfo(name, this.sampleBuffer.duration);

      // Call callback if set
      if (this.onSampleLoaded) {
        this.onSampleLoaded(this.sampleBuffer);
      }

      return true;
    } catch (error) {
      console.error('Error decoding audio:', error);
      alert('Could not decode audio file. Please try a different format.');
      return false;
    }
  }

  /**
   * Normalize buffer using intelligent peak + RMS analysis
   * Ensures consistent levels regardless of input volume
   */
  normalizeBuffer(buffer) {
    // Target levels
    const targetPeak = 0.707;  // -3dB peak (leaves headroom)
    const targetRMS = 0.15;    // ~-16dB RMS (good average level)

    // Analyze all channels
    let maxPeak = 0;
    let sumSquares = 0;
    let sampleCount = 0;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const sample = data[i];
        const absSample = Math.abs(sample);

        // Peak analysis
        if (absSample > maxPeak) {
          maxPeak = absSample;
        }

        // RMS analysis
        sumSquares += sample * sample;
        sampleCount++;
      }
    }

    // Calculate RMS
    const rms = Math.sqrt(sumSquares / sampleCount);

    // If audio is silent, return as-is
    if (maxPeak < 0.001 || rms < 0.0001) {
      console.warn('Input audio is nearly silent');
      return buffer;
    }

    // Calculate gains for both methods
    const peakGain = targetPeak / maxPeak;
    const rmsGain = targetRMS / rms;

    // Use the smaller gain to avoid clipping
    // This ensures we normalize to good loudness while respecting peaks
    const gain = Math.min(peakGain, rmsGain);

    // Clamp gain to reasonable range (don't boost more than 40dB or reduce more than 40dB)
    const maxGain = 100;  // +40dB
    const minGain = 0.01; // -40dB
    const finalGain = Math.max(minGain, Math.min(maxGain, gain));

    // Create new normalized buffer
    const normalizedBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );

    // Apply gain to all channels
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = normalizedBuffer.getChannelData(channel);

      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i] * finalGain;
      }
    }

    // Log normalization info
    const gainDb = 20 * Math.log10(finalGain);
    const peakDb = 20 * Math.log10(maxPeak);
    const rmsDb = 20 * Math.log10(rms);
    console.log(`Audio normalized:
  Input  - Peak: ${peakDb.toFixed(1)}dB, RMS: ${rmsDb.toFixed(1)}dB
  Output - Peak: ${(peakDb + gainDb).toFixed(1)}dB, RMS: ${(rmsDb + gainDb).toFixed(1)}dB
  Gain applied: ${gainDb > 0 ? '+' : ''}${gainDb.toFixed(1)}dB`);

    return normalizedBuffer;
  }

  /**
   * Detect pitch and normalize to middle C (MIDI 60)
   * Uses autocorrelation to find fundamental frequency
   */
  detectAndNormalizePitch(buffer) {
    try {
      // Analyze a representative section of the audio (middle 1 second)
      const sampleRate = buffer.sampleRate;
      const channelData = buffer.getChannelData(0);

      // Use middle second of audio (or less if shorter)
      const analysisDuration = Math.min(1.0, buffer.duration * 0.5);
      const startSample = Math.floor((buffer.duration / 2 - analysisDuration / 2) * sampleRate);
      const endSample = Math.floor(startSample + analysisDuration * sampleRate);

      // Limit analysis to prevent performance issues
      const maxSamples = sampleRate * 2; // Max 2 seconds
      const actualEndSample = Math.min(endSample, startSample + maxSamples);
      const samples = channelData.slice(startSample, actualEndSample);

      // Detect pitch using autocorrelation
      const detectedFreq = this.autocorrelate(samples, sampleRate);

      if (detectedFreq > 0 && detectedFreq < 5000) {
        // Convert frequency to MIDI note
        const detectedMidi = 69 + 12 * Math.log2(detectedFreq / 440);

        // Calculate offset to transpose to middle C (MIDI 60)
        const transposeOffset = 60 - detectedMidi;

        // Clamp transpose to reasonable range (-36 to +36 semitones)
        const clampedOffset = Math.max(-36, Math.min(36, transposeOffset));

        // Store globally for voices to use
        window.pitchTransposeOffset = clampedOffset;

        console.log(`Pitch detection:
  Detected: ${detectedFreq.toFixed(1)}Hz (MIDI ${detectedMidi.toFixed(1)})
  Transpose to C4: ${clampedOffset > 0 ? '+' : ''}${clampedOffset.toFixed(1)} semitones`);
      } else {
        // No pitch detected - assume it's already at middle C
        window.pitchTransposeOffset = 0;
        console.log('Pitch detection: No clear pitch found, assuming middle C');
      }
    } catch (error) {
      console.error('Pitch detection error:', error);
      window.pitchTransposeOffset = 0;
    }
  }

  /**
   * Autocorrelation-based pitch detection
   * Returns fundamental frequency in Hz, or -1 if no pitch detected
   */
  autocorrelate(buffer, sampleRate) {
    // Define pitch range to search (50Hz - 2000Hz)
    const minFreq = 50;
    const maxFreq = 2000;
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);

    // Calculate autocorrelation
    let bestCorrelation = 0;
    let bestPeriod = -1;

    for (let period = minPeriod; period < maxPeriod; period++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
      }

      // Normalize by number of samples
      correlation /= (buffer.length - period);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    // Require minimum correlation threshold to avoid noise
    if (bestCorrelation < 0.01 || bestPeriod < 0) {
      return -1;
    }

    return sampleRate / bestPeriod;
  }

  /**
   * Update sample info display
   */
  updateSampleInfo(name, duration) {
    const nameElement = document.getElementById('sample-name');
    const durationElement = document.getElementById('sample-duration');
    const infoContainer = document.getElementById('sample-info');

    if (nameElement) {
      nameElement.textContent = name;
    }
    if (durationElement) {
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      durationElement.textContent =
        `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    if (infoContainer) {
      infoContainer.style.display = 'flex';
    }
  }

  /**
   * Start recording audio output
   */
  async startOutputRecording(destination) {
    try {
      // Create a MediaStreamDestination
      const streamDestination = this.audioContext.createMediaStreamDestination();

      // Connect the audio graph to this destination
      destination.connect(streamDestination);

      // Create recorder
      this.outputRecorder = new MediaRecorder(streamDestination.stream);
      this.outputChunks = [];

      this.outputRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.outputChunks.push(e.data);
        }
      };

      this.outputRecorder.start(100);
      return true;
    } catch (error) {
      console.error('Error starting output recording:', error);
      alert('Could not start output recording.');
      return false;
    }
  }

  /**
   * Stop recording and download as WAV
   */
  stopOutputRecording() {
    return new Promise((resolve) => {
      if (!this.outputRecorder || this.outputRecorder.state === 'inactive') {
        resolve(false);
        return;
      }

      this.outputRecorder.onstop = async () => {
        const blob = new Blob(this.outputChunks, { type: 'audio/webm' });

        // Download the file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `granular-output-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.outputRecorder = null;
        this.outputChunks = [];
        resolve(true);
      };

      this.outputRecorder.stop();
    });
  }

  /**
   * Get current sample buffer
   */
  getSampleBuffer() {
    return this.sampleBuffer;
  }

  /**
   * Check if sample is loaded
   */
  hasSample() {
    return this.sampleBuffer !== null;
  }
}

// Make available globally
window.AudioIO = AudioIO;
