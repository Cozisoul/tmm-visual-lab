/**
 * @class WaveformSynthesizer
 * @description A tool for drawing and animating classic synthesizer waveforms like sine,
 * square, sawtooth, and triangle waves. It includes controls for frequency, amplitude, and phase.
 */
class WaveformSynthesizer {
  constructor() {
    console.log("Waveform Synthesizer loaded.");
    this.amp = 100;
    this.freq = 4;
    this.mode = 'line';
    this.waveform = 'sine';
    this.timeSpeed = 0.05;
    this.phase = 0;
    this.lineCount = 1;
    this.color = '#FFF8E7';
    this.noiseAmount = 0;
    this.lineWeight = 3;
    this.pulse = 1.0;
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(options.backgroundColor || '#111111');
    }

    if (options.isAudioReactive && options.audioLevel > 0.02) {
      // When audio is detected, boost the pulse. A higher multiplier gives a more dramatic "kick".
      this.pulse = 1.0 + options.audioLevel * 3.0;
    }

    // For a smooth animation, always decay the pulse back to its resting state of 1.0.
    // The lerp function creates a nice, organic decay.
    this.pulse = lerp(this.pulse, 1.0, 0.1);

    // The current amplitude is now the base amplitude multiplied by the audio-driven pulse.
    const currentAmp = this.amp * this.pulse;

    if (this.mode === 'field') {
      this.drawIsometricField(buffer, currentAmp, options);
    } else if (this.mode === 'isometric-line') {
      this.drawIsometricLine(buffer, currentAmp, options);
    } else { // 'line' mode
      const baseColor = color(this.color);
      const alpha = this.lineCount > 1 ? 255 / this.lineCount : 255;
      buffer.stroke(red(baseColor), green(baseColor), blue(baseColor), alpha);
      buffer.noFill();
      buffer.strokeWeight(this.lineWeight);

      const totalLineHeight = buffer.height * 0.8;
      const startY = buffer.height / 2 - totalLineHeight / 2;
      const lineSpacing = this.lineCount > 1 ? totalLineHeight / (this.lineCount - 1) : 0;

      for (let line = 0; line < this.lineCount; line++) {
        const yBase = this.lineCount === 1 ? buffer.height / 2 : startY + line * lineSpacing;

        buffer.beginShape();
        for (let x = 0; x < buffer.width; x++) {
          const angle = map(x, 0, buffer.width, 0, TWO_PI * this.freq) + radians(this.phase);
          let yOffset = 0;
          const t = frameCount * this.timeSpeed + line * 0.5; // Offset time for each line
          const noiseVal = noise(x * 0.01, t) * 2 - 1; // Noise between -1 and 1
          const noiseEffect = noiseVal * this.noiseAmount;

          if (this.waveform === 'sine') yOffset = sin(angle + t) * currentAmp;
          else if (this.waveform === 'square') yOffset = (sin(angle + t) > 0 ? 1 : -1) * currentAmp;
          else if (this.waveform === 'sawtooth') yOffset = (((angle + t) % TWO_PI) / PI - 1) * currentAmp;
          else if (this.waveform === 'triangle') yOffset = (abs(((angle + t) % TWO_PI) - PI) / PI * 2 - 1) * -currentAmp;

          const y = yBase + yOffset + noiseEffect;
          buffer.vertex(x, y);
        }
        buffer.endShape();
      }
    }
  }

  /**
   * Draws waves along an isometric grid.
   * This replaces the previous pixel-based field mode.
   */
  drawIsometricField(buffer, currentAmp, options) {
    buffer.stroke(this.color);
    buffer.noFill();
    buffer.strokeWeight(this.lineWeight);
    buffer.push();
    buffer.scale(options.zoom || 1.0);
    buffer.translate(buffer.width / 2, buffer.height / 2);

    // Use frequency to determine line density, with a minimum.
    const numLines = max(4, this.freq * 2);
    const gridSpan = min(buffer.width, buffer.height);
    const lineSpacing = gridSpan / numLines;

    const t = frameCount * this.timeSpeed;

    // Define the two isometric angles
    const angles = [radians(30), radians(150)];

    for (const baseAngle of angles) {
      const cosBase = cos(baseAngle);
      const sinBase = sin(baseAngle);
      const perpAngle = baseAngle + HALF_PI;
      const cosPerp = cos(perpAngle);
      const sinPerp = sin(perpAngle);

      for (let i = 0; i <= numLines; i++) {
        const offset = (i - numLines / 2) * lineSpacing;
        const startX = offset * cosPerp;
        const startY = offset * sinPerp;

        buffer.beginShape();
        for (let p = -gridSpan / 2; p <= gridSpan / 2; p += 5) {
          const baseX = startX + p * cosBase;
          const baseY = startY + p * sinBase;

          const waveAngle = map(p, -gridSpan / 2, gridSpan / 2, 0, TWO_PI * this.freq) + radians(this.phase);
          let waveOffset = 0;
          const timeAndLineOffset = t + i * 0.3;

          if (this.waveform === 'sine') waveOffset = sin(waveAngle + timeAndLineOffset) * currentAmp;
          else if (this.waveform === 'square') waveOffset = (sin(waveAngle + timeAndLineOffset) > 0 ? 1 : -1) * currentAmp;
          else if (this.waveform === 'sawtooth') waveOffset = (((waveAngle + timeAndLineOffset) % TWO_PI) / PI - 1) * currentAmp;
          else if (this.waveform === 'triangle') waveOffset = (abs(((waveAngle + timeAndLineOffset) % TWO_PI) - PI) / PI * 2 - 1) * -currentAmp;
          
          const noiseVal = noise(baseX * 0.01, baseY * 0.01, t) * 2 - 1;
          const noiseEffect = noiseVal * this.noiseAmount;

          buffer.vertex(baseX + (waveOffset + noiseEffect) * cosPerp, baseY + (waveOffset + noiseEffect) * sinPerp);
        }
        buffer.endShape();
      }
    }
    buffer.pop();
  }

  /**
   * Draws lines of waves along an isometric axis.
   */
  drawIsometricLine(buffer, currentAmp, options) {
    const baseColor = color(this.color);
    // Make lines more transparent as more are added
    const alpha = this.lineCount > 1 ? 150 / this.lineCount : 255;
    buffer.stroke(red(baseColor), green(baseColor), blue(baseColor), alpha);
    buffer.noFill();
    buffer.strokeWeight(this.lineWeight);
    buffer.push();
    buffer.scale(options.zoom || 1.0);
    buffer.translate(buffer.width / 2, buffer.height / 4); // Start higher up to leave room for the wave

    // Draw a grid on the "floor" to give a sense of space and make the wave "float"
    this._drawIsometricFloorGrid(buffer);

    const totalLineHeight = buffer.height * 0.7;
    const lineSpacing = this.lineCount > 1 ? totalLineHeight / (this.lineCount - 1) : 0;
    const isoAngle = radians(30);
    const cosAngle = cos(isoAngle);
    const sinAngle = sin(isoAngle);

    for (let line = 0; line < this.lineCount; line++) {
      const yBase = this.lineCount === 1 ? buffer.height / 2 : line * lineSpacing;

      buffer.beginShape();
      for (let x = -buffer.width / 2; x < buffer.width / 2; x += 5) {
        const waveAngle = map(x, -buffer.width / 2, buffer.width / 2, 0, TWO_PI * this.freq) + radians(this.phase);
        let yOffset = 0;
        const t = frameCount * this.timeSpeed + line * 0.5; // Offset time for each line
        const noiseVal = noise(x * 0.01, t) * 2 - 1;
        const noiseEffect = noiseVal * this.noiseAmount;

        if (this.waveform === 'sine') yOffset = sin(waveAngle + t) * currentAmp;
        else if (this.waveform === 'square') yOffset = (sin(waveAngle + t) > 0 ? 1 : -1) * currentAmp;
        else if (this.waveform === 'sawtooth') yOffset = (((waveAngle + t) % TWO_PI) / PI - 1) * currentAmp;
        else if (this.waveform === 'triangle') yOffset = (abs(((waveAngle + t) % TWO_PI) - PI) / PI * 2 - 1) * -currentAmp;

        const finalY = yBase + yOffset + noiseEffect;

        // --- UPRIGHT WAVE LOGIC ---
        // 1. Calculate the isometric position of the baseline point
        const isoX_base = (x - yBase) * cosAngle;
        const isoY_base = (x + yBase) * sinAngle;
        // 2. The wave's amplitude goes straight "up" (negative Y in screen space) from the baseline
        const finalY_offset = yOffset + noiseEffect;
        // 3. Draw the vertex
        buffer.vertex(isoX_base, isoY_base - finalY_offset);
      }
      buffer.endShape();
    }

    buffer.pop();
  }

  /**
   * Helper to draw a simple isometric grid on the buffer to act as a "floor".
   * @private
   */
  _drawIsometricFloorGrid(buffer) {
    buffer.push();
    buffer.strokeWeight(1);
    // Make the grid lines faint so they don't distract from the main wave
    const baseColor = color(this.color);
    buffer.stroke(red(baseColor), green(baseColor), blue(baseColor), 50);

    const gridSize = buffer.width * 1.5;
    const numLines = 20;
    const lineSpacing = gridSize / numLines;
    const isoAngle = radians(30);
    const cosAngle = cos(isoAngle);
    const sinAngle = sin(isoAngle);

    // Translate down to create the floor effect, placing it below the wave's origin
    buffer.translate(0, buffer.height / 2.5);

    for (let i = -numLines / 2; i <= numLines / 2; i++) {
      const offset = i * lineSpacing;

      // Lines in one direction (top-left to bottom-right)
      let x1 = (offset - (-gridSize / 2)) * cosAngle;
      let y1 = (offset + (-gridSize / 2)) * sinAngle;
      let x2 = (offset - (gridSize / 2)) * cosAngle;
      let y2 = (offset + (gridSize / 2)) * sinAngle;
      buffer.line(x1, y1, x2, y2);

      // Lines in the other direction (top-right to bottom-left)
      x1 = ((-gridSize / 2) - offset) * cosAngle;
      y1 = ((-gridSize / 2) + offset) * sinAngle;
      x2 = ((gridSize / 2) - offset) * cosAngle;
      y2 = ((gridSize / 2) + offset) * sinAngle;
      buffer.line(x1, y1, x2, y2);
    }
    buffer.pop();
  }
}

window.WaveformSynthesizer = WaveformSynthesizer;