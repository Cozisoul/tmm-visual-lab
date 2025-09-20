/**
 * @class KineticTypeEngine
 * @description A tool for creating animated typography. It supports multiple algorithms
 * like a horizontal "ticker tape", a vertical "wave", and a combination of both.
 */
/**
 * @class KineticTypeEngine
 * @description A tool for creating animated typography. It supports multiple algorithms
 * like a horizontal "ticker tape", a vertical "wave", and a combination of both.
 */
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
    this.font = 'JetBrains Mono'; // Added font property
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (options.isAudioReactive && options.audioLevel > 0.02) {
      this.pulse = 1.0 + options.audioLevel * 2.5;
    }
    this.pulse = lerp(this.pulse, 1.0, 0.1);

    const currentSpeed = this.speed * this.pulse;
    const currentAmplitude = this.amplitude * this.pulse;

    if (!options.noBackground) {
      buffer.background(options.backgroundColor || color(17, 17, 17));
    }
    buffer.fill(this.color);
    buffer.noStroke();
    buffer.textFont(this.font); // Use this.font
    buffer.textSize(this.fontSize);

    const baseText = this.isUppercase ? this.text.toUpperCase() : this.text;
    const displayText = (baseText + ' ').repeat(this.repetitions).trim();

    if (!displayText || displayText.length === 0) return;

    if (golGrid) {
      const offscreenBuffer = createGraphics(buffer.width, buffer.height);
      if (!options.noBackground) {
        offscreenBuffer.background(options.backgroundColor || color(17, 17, 17));
      }
      offscreenBuffer.fill(this.color);
      offscreenBuffer.noStroke();
      offscreenBuffer.textFont(this.font);
      offscreenBuffer.textSize(this.fontSize);

      const totalLineHeight = this.fontSize * this.lineCount;
      const startY = offscreenBuffer.height / 2 - totalLineHeight / 2 + this.fontSize / 2;

      for (let line = 0; line < this.lineCount; line++) {
        const yPosition = startY + line * this.fontSize;

        if (this.algorithm === 'ticker') {
          if (displayText !== this.prevText) {
            this.x = -offscreenBuffer.textWidth(displayText);
            this.prevText = displayText;
          }
          offscreenBuffer.textAlign(LEFT, CENTER);
          
          let currentX = this.x;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const charWidth = offscreenBuffer.textWidth(char);
            offscreenBuffer.text(char, currentX, yPosition);
            currentX += charWidth + this.tracking;
          }
          this.x += currentSpeed;
          if (this.x > offscreenBuffer.width) {
            this.x = -offscreenBuffer.textWidth(displayText);
          }
        } else if (this.algorithm === 'wave') {
          this.prevText = "";
          offscreenBuffer.textAlign(CENTER, CENTER);
          let xPos = offscreenBuffer.width / 2;
          let totalTextWidth = 0;
          for (let i = 0; i < displayText.length; i++) {
            totalTextWidth += offscreenBuffer.textWidth(displayText[i]) + this.tracking;
          }
          xPos -= totalTextWidth / 2;

          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const angle = frameCount * currentSpeed * 0.1 + i * 0.5 + line * 2;
            const yOffset = sin(angle) * currentAmplitude;
            const charWidth = offscreenBuffer.textWidth(char);
            offscreenBuffer.text(char, xPos + charWidth / 2, yPosition + yOffset);
            xPos += charWidth + this.tracking;
          }
        } else if (this.algorithm === 'wave-ticker') {
          if (displayText !== this.prevText) {
            this.x = -offscreenBuffer.textWidth(displayText);
            this.prevText = displayText;
          }
          offscreenBuffer.textAlign(LEFT, CENTER);
          
          let currentX = this.x;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const angle = (frameCount * currentSpeed * 0.1) + i * 0.5 + line * 2;
            const yOffset = sin(angle) * currentAmplitude;
            const charWidth = offscreenBuffer.textWidth(char);
            offscreenBuffer.text(char, currentX, yPosition + yOffset);
            currentX += charWidth + this.tracking;
          }

          this.x += currentSpeed;
          if (this.x > offscreenBuffer.width) {
            this.x = -offscreenBuffer.textWidth(displayText);
          }
        } else if (this.algorithm === 'circle') {
          offscreenBuffer.textAlign(CENTER, CENTER);
          const centerX = offscreenBuffer.width / 2;
          const centerY = offscreenBuffer.height / 2;
          const radius = (min(offscreenBuffer.width, offscreenBuffer.height) / 3) * this.pulse;
          const startAngle = frameCount * currentSpeed * 0.01;

          let currentAngle = startAngle;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const charWidth = offscreenBuffer.textWidth(char);
            const angleOffset = (charWidth / 2 + this.tracking / 2) / radius;
            
            currentAngle += angleOffset;
            
            const x = centerX + cos(currentAngle) * radius;
            const y = centerY + sin(currentAngle) * radius;
            
            offscreenBuffer.push();
            offscreenBuffer.translate(x, y);
            offscreenBuffer.rotate(currentAngle + HALF_PI);
            offscreenBuffer.text(char, 0, 0);
            offscreenBuffer.pop();
            
            currentAngle += angleOffset;
          }
        }
      }

      // Apply GOL mask
      const golGridCols = golGrid.length;
      const golGridRows = golGrid[0].length;
      const cellW = buffer.width / golGridCols;
      const cellH = buffer.height / golGridRows;

      if (!options.noBackground) {
        buffer.background(options.backgroundColor || color(17, 17, 17));
      }

      for (let i = 0; i < golGridCols; i++) {
        for (let j = 0; j < golGridRows; j++) {
          if (golGrid[i][j] === 1) { // If cell is alive
            buffer.image(offscreenBuffer,
              i * cellW, j * cellH, cellW, cellH, // Destination: x, y, w, h
              i * cellW, j * cellH, cellW, cellH  // Source: sx, sy, sw, sh
            );
          }
        }
      }
      offscreenBuffer.remove();

    } else {
      // Original drawing logic if GOL is not active
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
          
          let currentX = this.x;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const charWidth = buffer.textWidth(char);
            buffer.text(char, currentX, yPosition);
            currentX += charWidth + this.tracking;
          }
          this.x += currentSpeed;
          if (this.x > buffer.width) {
            this.x = -buffer.textWidth(displayText);
          }
        } else if (this.algorithm === 'wave') {
          this.prevText = "";
          buffer.textAlign(CENTER, CENTER);
          let xPos = buffer.width / 2;
          let totalTextWidth = 0;
          for (let i = 0; i < displayText.length; i++) {
            totalTextWidth += buffer.textWidth(displayText[i]) + this.tracking;
          }
          xPos -= totalTextWidth / 2;

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
            const angle = (frameCount * currentSpeed * 0.1) + i * 0.5 + line * 2;
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
          const radius = (min(buffer.width, buffer.height) / 3) * this.pulse;
          const startAngle = frameCount * currentSpeed * 0.01;

          let currentAngle = startAngle;
          for (let i = 0; i < displayText.length; i++) {
            const char = displayText[i];
            const charWidth = buffer.textWidth(char);
            const angleOffset = (charWidth / 2 + this.tracking / 2) / radius;
            
            currentAngle += angleOffset;
            
            const x = centerX + cos(currentAngle) * radius;
            const y = centerY + sin(currentAngle) * radius;
            
            buffer.push();
            buffer.translate(x, y);
            buffer.rotate(currentAngle + HALF_PI);
            buffer.text(char, 0, 0);
            buffer.pop();
            
            currentAngle += angleOffset;
          }
        }
      }
    }
  }
}

window.KineticTypeEngine = KineticTypeEngine;

window.KineticTypeEngine = KineticTypeEngine;
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
    if (options.isAudioReactive && options.audioLevel > 0.02) {
      this.pulse = 1.0 + options.audioLevel * 2.5;
    }
    this.pulse = lerp(this.pulse, 1.0, 0.1);

    const currentSpeed = this.speed * this.pulse;
    const currentAmplitude = this.amplitude * this.pulse;

    if (!options.noBackground) {
      buffer.background(options.backgroundColor || color(17, 17, 17));
    }
    buffer.fill(this.color);
    buffer.noStroke();
    buffer.textFont('JetBrains Mono');
    buffer.textSize(this.fontSize);

    const baseText = this.isUppercase ? this.text.toUpperCase() : this.text;
    const displayText = (baseText + ' ').repeat(this.repetitions).trim();

    if (!displayText || displayText.length === 0) return;

    // If GOL is active, we need to map character positions to GOL grid.
    const golActive = !!golGrid;
    let golGridCols, golGridRows;
    if (golActive) {
      golGridCols = golGrid.length;
      if (golGridCols === 0) return;
      golGridRows = golGrid[0].length;
    }

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
        
        let currentX = this.x;
        for (let i = 0; i < displayText.length; i++) {
          const char = displayText[i];
          const charWidth = buffer.textWidth(char);
          const charX = currentX + charWidth / 2; // Center of the character for GOL mapping
          const charY = yPosition; // Center of the character for GOL mapping

          if (golActive) {
            const golX = floor(map(charX, 0, buffer.width, 0, golGridCols));
            const golY = floor(map(charY, 0, buffer.height, 0, golGridRows));
            if (!golGrid[golX] || golGrid[golX][golY] !== 1) {
              currentX += charWidth + this.tracking;
              continue; // Skip drawing if GOL cell is dead
            }
          }
          buffer.text(char, currentX, yPosition);
          currentX += charWidth + this.tracking;
        }
        this.x += currentSpeed;
        if (this.x > buffer.width) {
          this.x = -buffer.textWidth(displayText);
        }
      } else if (this.algorithm === 'wave') {
        this.prevText = "";
        buffer.textAlign(CENTER, CENTER);
        let xPos = buffer.width / 2;
        let totalTextWidth = 0;
        for (let i = 0; i < displayText.length; i++) {
          totalTextWidth += buffer.textWidth(displayText[i]) + this.tracking;
        }
        xPos -= totalTextWidth / 2; // Adjust xPos to center the entire text block

        for (let i = 0; i < displayText.length; i++) {
          const char = displayText[i];
          const angle = frameCount * currentSpeed * 0.1 + i * 0.5 + line * 2;
          const yOffset = sin(angle) * currentAmplitude;
          const charWidth = buffer.textWidth(char);
          const charX = xPos + charWidth / 2;
          const charY = yPosition + yOffset;

          if (golActive) {
            const golX = floor(map(charX, 0, buffer.width, 0, golGridCols));
            const golY = floor(map(charY, 0, buffer.height, 0, golGridRows));
            if (!golGrid[golX] || golGrid[golX][golY] !== 1) {
              xPos += charWidth + this.tracking;
              continue; // Skip drawing if GOL cell is dead
            }
          }
          buffer.text(char, charX, charY);
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
          const angle = (frameCount * currentSpeed * 0.1) + i * 0.5 + line * 2;
          const yOffset = sin(angle) * currentAmplitude;
          const charWidth = buffer.textWidth(char);
          const charX = currentX + charWidth / 2;
          const charY = yPosition + yOffset;

          if (golActive) {
            const golX = floor(map(charX, 0, buffer.width, 0, golGridCols));
            const golY = floor(map(charY, 0, buffer.height, 0, golGridRows));
            if (!golGrid[golX] || golGrid[golX][golY] !== 1) {
              currentX += charWidth + this.tracking;
              continue; // Skip drawing if GOL cell is dead
            }
          }
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
        const radius = (min(buffer.width, buffer.height) / 3) * this.pulse;
        const startAngle = frameCount * currentSpeed * 0.01;

        let currentAngle = startAngle;
        for (let i = 0; i < displayText.length; i++) {
          const char = displayText[i];
          const charWidth = buffer.textWidth(char);
          const angleOffset = (charWidth / 2 + this.tracking / 2) / radius;
          
          currentAngle += angleOffset;
          
          const x = centerX + cos(currentAngle) * radius;
          const y = centerY + sin(currentAngle) * radius;
          
          // For GOL mapping, we need the actual character position before rotation
          const charX = x;
          const charY = y;

          if (golActive) {
            const golX = floor(map(charX, 0, buffer.width, 0, golGridCols));
            const golY = floor(map(charY, 0, buffer.height, 0, golGridRows));
            if (!golGrid[golX] || golGrid[golX][golY] !== 1) {
              currentAngle += angleOffset; // Adjust angle even if not drawn
              continue; // Skip drawing if GOL cell is dead
            }
          }

          buffer.push();
          buffer.translate(x, y);
          buffer.rotate(currentAngle + HALF_PI); // Rotate character to be tangent to the circle
          buffer.text(char, 0, 0);
          buffer.pop();
          
          currentAngle += angleOffset;
        }
      }
    }
  }

window.KineticTypeEngine = KineticTypeEngine;