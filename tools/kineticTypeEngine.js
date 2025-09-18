/**
 * @class KineticTypeEngine
 * @description A tool for creating animated typography. It supports multiple algorithms
 * like a horizontal "ticker tape", a vertical "wave", and a combination of both.
 */
class KineticTypeEngine {
  constructor() {
    console.log("Kinetic Type Engine loaded.");
    this.x = -200;
    this.text = "KINETIC TYPE ENGINE";
    this.speed = 2;
    this.prevText = ""; // Used to detect when text changes
    this.fontSize = 64;
    this.repetitions = 1;
    this.lineCount = 1;
    this.isUppercase = true;
    this.algorithm = 'ticker';
    this.amplitude = 50;
    this.tracking = 0;
    this.color = '#FFF8E7';
    this.pulse = 1.0;
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    // --- Audio Reactivity ---
    if (options.isAudioReactive && options.audioLevel > 0.02) {
      // When audio is detected, boost the pulse. A higher multiplier gives a more dramatic "kick".
      this.pulse = 1.0 + options.audioLevel * 2.5;
    }
    // For a smooth animation, always decay the pulse back to its resting state of 1.0.
    this.pulse = lerp(this.pulse, 1.0, 0.1);

    const currentSpeed = this.speed * this.pulse;
    const currentAmplitude = this.amplitude * this.pulse;

    if (!options.noBackground) {
      buffer.background(17, 17, 17);
    }
    buffer.fill(this.color);
    buffer.noStroke();
    buffer.textFont('JetBrains Mono');
    buffer.textSize(this.fontSize);

    const baseText = this.isUppercase ? this.text.toUpperCase() : this.text;
    const displayText = (baseText + ' ').repeat(this.repetitions).trim();

    if (golGrid) {
      // GOL mode: Draw text characters as particles on living cells.
      if (!displayText || displayText.length === 0) return;

      // Make font size relative to the GOL cell size, but still controllable by the tool's 'fontSize' slider.
      // A 'fontSize' of 64 (the default) will roughly fill the cell.
      const relativeFontSize = gameOfLifeCellSize * (this.fontSize / 64);
      buffer.textSize(relativeFontSize);

      buffer.textAlign(CENTER, CENTER);
      let charIndex = 0;

      for (let i = 0; i < golGrid.length; i++) {
        for (let j = 0; j < golGrid[i].length; j++) {
          if (golGrid[i][j] === 1) {
            const x = i * gameOfLifeCellSize + gameOfLifeCellSize / 2;
            const y = j * gameOfLifeCellSize + gameOfLifeCellSize / 2;
            
            const charToDraw = displayText[charIndex % displayText.length];
            buffer.text(charToDraw, x, y);
            charIndex++;
          }
        }
      }
    } else {
      // Original mode: ticker or wave animation.
      const totalLineHeight = this.fontSize * this.lineCount;
      const startY = buffer.height / 2 - totalLineHeight / 2 + this.fontSize / 2;

      for (let line = 0; line < this.lineCount; line++) {
        const yPosition = startY + line * this.fontSize;

        if (this.algorithm === 'ticker') {
          if (displayText !== this.prevText) {
            this.x = -buffer.textWidth(displayText);
            this.prevText = displayText;
          }
          buffer.textAlign(LEFT, CENTER);
          buffer.text(displayText, this.x, yPosition);
          this.x += currentSpeed;
          if (this.x > buffer.width) {
            this.x = -buffer.textWidth(displayText);
          }
        } else if (this.algorithm === 'wave') {
          this.prevText = ""; // Reset ticker-specific memory
          buffer.textAlign(CENTER, CENTER);
          let totalWidth = 0;
          for (let i = 0; i < displayText.length; i++) {
            totalWidth += buffer.textWidth(displayText[i]) + this.tracking;
          }
          let xPos = buffer.width / 2 - totalWidth / 2;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const angle = frameCount * currentSpeed * 0.1 + i * 0.5 + line * 2;
            const yOffset = sin(angle) * currentAmplitude;
            const charWidth = buffer.textWidth(char);
            buffer.text(char, xPos + charWidth / 2, yPosition + yOffset);
            xPos += charWidth + this.tracking;
          }
        } else if (this.algorithm === 'wave-ticker') {
          if (displayText !== this.prevText) {
            this.x = -buffer.textWidth(displayText);
            this.prevText = displayText;
          }
          buffer.textAlign(LEFT, CENTER);
          
          let currentX = this.x;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const angle = (frameCount * currentSpeed * 0.1) + i * 0.5 + line * 2; // Use index for consistent wave
            const yOffset = sin(angle) * currentAmplitude;
            const charWidth = buffer.textWidth(char);
            
            buffer.text(char, currentX, yPosition + yOffset);
            currentX += charWidth + this.tracking;
          }

          this.x += currentSpeed;
          if (this.x > buffer.width) {
            this.x = -buffer.textWidth(displayText);
          }
        } else if (this.algorithm === 'circle') {
          buffer.textAlign(CENTER, CENTER);
          const centerX = buffer.width / 2;
          const centerY = buffer.height / 2;
          const radius = min(buffer.width, buffer.height) / 3;
          const startAngle = frameCount * currentSpeed * 0.01;

          let totalArcLength = 0;
          for (let i = 0; i < displayText.length; i++) {
            totalArcLength += buffer.textWidth(displayText[i]) + this.tracking;
          }
          
          let currentAngle = startAngle;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const charWidth = buffer.textWidth(char);
            const angleOffset = (charWidth / 2 + this.tracking / 2) / radius;
            currentAngle += angleOffset;
            const x = centerX + cos(currentAngle) * radius;
            const y = centerY + sin(currentAngle) * radius;
            buffer.text(char, x, y);
            currentAngle += angleOffset;
          }
        }
      }
    }
  }
}

window.KineticTypeEngine = KineticTypeEngine;