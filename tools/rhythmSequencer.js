/**
 * @class RhythmSequencer
 * @description An audio-visual step sequencer. It allows users to create rhythmic patterns
 * and triggers synthesized drum sounds, while also providing a visual representation on the canvas.
 */
class RhythmSequencer {
  constructor() {
    console.log("Rhythm Sequencer loaded.");
    this.bpm = 120;
    this.steps = 16; // Default steps
    this.pattern = Array(4).fill(0).map(() => Array(this.steps).fill(0));
    this.currentStep = 0;
    this.lastBeatTime = 0;
    this.masterVolume = 0.5;
    this.showVisualizer = false;
    this.detectBpm = false;

    // Audio properties
    this.audioEnabled = false;
    this.audioInitialized = false;
    this.sounds = {};

    // BPM Detection properties
    this.beatHistory = [];
    this.beatThreshold = 0.2; // Sensitivity for peak detection
    this.lastLevel = 0;
    this.minBeatInterval = (60 / 240) * 1000; // Corresponds to max BPM of 240

    this.updatePatternFromUI();
  }

  regenerate() {
    // Reset sequencer state
    this.currentStep = 0;
    this.beatHistory = [];
  }

  toggleAudio(enabled) {
    this.audioEnabled = enabled;
    if (this.audioEnabled && !this.audioInitialized) {
      this.initAudio();
    }
  }

  // Create synthesized drum sounds
  initAudio() {
    userStartAudio(); // Required to start audio context in the browser
    this.sounds.kick = new DrumSound('sine', 60, 0.4, 0.01);
    this.sounds.snare = new DrumSound('noise', null, 0.2, 0.01, 1000); // Noise with high-pass
    this.sounds.hat = new DrumSound('noise', null, 0.05, 0.01, 5000); // Noise with higher high-pass
    this.sounds.openHat = new DrumSound('noise', null, 0.5, 0.01, 4000);
    this.audioInitialized = true;
    console.log("Rhythm Sequencer audio initialized.");
  }

  setStepCount(numSteps) {
    if (this.steps === numSteps) return;
    this.steps = numSteps;
    this.pattern = Array(4).fill(0).map(() => Array(this.steps).fill(0));
    this.currentStep = 0; // Reset step on resize
  }

  cleanup() {
    // Clear any existing patterns
    this.pattern = this.pattern.map(row => row.fill(0));
    this.currentStep = 0;
    this.lastBeatTime = 0;
    // Stop any playing sounds if the tool is cleaned up
    if (this.audioInitialized) {
      Object.values(this.sounds).forEach(sound => {
        if (sound.osc) sound.osc.stop();
      });
    }
  }

  updatePatternFromUI() {
    const steps = document.querySelectorAll('#rs-sequencer-grid .rs-step');
    if (!steps.length) return;
    
    try {
      steps.forEach((step, i) => {
        const row = Math.floor(i / this.steps);
        const col = i % this.steps;
        if (row < this.pattern.length && col < this.pattern[row].length) {
          this.pattern[row][col] = step.classList.contains('active') ? 1 : 0;
        }
      });
    } catch (e) {
      console.error("Error updating pattern:", e);
    }
  }

  updateBpmFromAudio(audioLevel) {
    if (audioLevel > this.beatThreshold && this.lastLevel <= this.beatThreshold) {
      const now = millis();
      if (this.beatHistory.length > 0) {
        const lastBeat = this.beatHistory[this.beatHistory.length - 1];
        if (now - lastBeat < this.minBeatInterval) {
          // Too fast, likely a false positive, ignore.
          this.lastLevel = audioLevel;
          return;
        }
      }

      this.beatHistory.push(now);
      if (this.beatHistory.length > 4) {
        this.beatHistory.shift(); // Keep the history to a reasonable size
      }

      if (this.beatHistory.length > 1) {
        let totalInterval = 0;
        for (let i = 1; i < this.beatHistory.length; i++) {
          totalInterval += this.beatHistory[i] - this.beatHistory[i - 1];
        }
        const avgInterval = totalInterval / (this.beatHistory.length - 1);
        if (avgInterval > 0) {
          const newBpm = 60000 / avgInterval;
          // Use lerp to smoothly transition to the new BPM
          this.bpm = lerp(this.bpm, newBpm, 0.2);
        }
      }
    }
    this.lastLevel = audioLevel;
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    const quarterNoteDurationMs = (60 / Math.max(1, this.bpm)) * 1000; // Duration of a quarter note in ms
    const stepDurationMs = quarterNoteDurationMs / 4; // Assuming 4 steps per quarter note (16th notes)
    const now = millis();

    try {
      if (now - this.lastBeatTime > stepDurationMs) {
        this.lastBeatTime = now;
        this.currentStep = (this.currentStep + 1) % this.steps;

        if (this.detectBpm && options.isAudioReactive) {
          this.updateBpmFromAudio(options.audioLevel);
        }

        // Trigger sounds
        if (this.audioEnabled && this.audioInitialized) {
          if (this.pattern[0][this.currentStep]) this.sounds.kick.play(this.masterVolume);
          if (this.pattern[1][this.currentStep]) this.sounds.snare.play(this.masterVolume);
          if (this.pattern[2][this.currentStep]) this.sounds.hat.play(this.masterVolume);
          if (this.pattern[3][this.currentStep]) this.sounds.openHat.play(this.masterVolume);
        }
      }

    // Update UI to show current step
    const stepElements = document.querySelectorAll('#rs-sequencer-grid .rs-step');
    stepElements.forEach((el, i) => {
      el.classList.toggle('current', (i % this.steps) === this.currentStep);
    });

    // Get proper canvas dimensions for centering
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;

    if (this.showVisualizer) {
      if (!options.noBackground) {
        // Clear background only for visualizer mode to see bars clearly
        buffer.background(17, 17, 17);
      }
      // Draw visualizer based on pattern
      buffer.noStroke();
      const barWidth = canvasWidth / 4;
      for (let i = 0; i < 4; i++) {
        if (this.pattern[i][this.currentStep]) {
          buffer.fill(255, 248, 231, 150);
          buffer.rect(i * barWidth, 0, barWidth, canvasHeight);
        }
      }
    } else {
      // Draw a visual metronome
      const beatProgress = (now % stepDurationMs) / stepDurationMs; // Progress within the current step
      const size = 50 + (1 - beatProgress) * 100;
      const alpha = 255 * (1 - beatProgress);

      buffer.noFill();
      buffer.stroke(255, 248, 231, alpha);
      buffer.strokeWeight(4);
      buffer.ellipse(canvasWidth / 2, canvasHeight / 2, size, size);
    }
    } catch (e) {
      console.error("Error in RhythmSequencer draw:", e);
    }
  }
}

/**
 * A helper class to create a simple synthesized drum sound.
 */
class DrumSound {
  constructor(type, freq, decay, attack, highPassFreq = null) {
    this.type = type;
    this.env = new p5.Envelope();
    this.env.setADSR(attack, decay, 0.1, 0.1);
    this.env.setRange(1, 0);

    if (type === 'noise') {
      this.osc = new p5.Noise('white');
    } else {
      this.osc = new p5.Oscillator(type);
      this.osc.freq(freq);
    }

    if (highPassFreq) {
      this.filter = new p5.HighPass();
      this.filter.freq(highPassFreq);
      this.osc.disconnect();
      this.osc.connect(this.filter);
    }

    this.osc.amp(this.env);
    this.osc.start();
  }

  play(volume) {
    if (this.type !== 'noise' && this.osc.freq) {
      // Optional: Add a pitch envelope for kicks
      const baseFreq = this.osc.getFreq(); // Get current base frequency
      this.osc.freq(baseFreq * 2.5, 0.001); // Start high
      this.osc.freq(baseFreq, 0.05);       // Drop to base frequency quickly
    }
    this.env.setRange(volume, 0);
    this.env.play();
  }
}

window.RhythmSequencer = RhythmSequencer;