/**
 * @class GlyphDeconstructor
 * @description An experimental typography tool that breaks a string of text into its
 * individual characters (glyphs) and redraws them with random position and rotation jitter.
 */
class GlyphDeconstructor {
  constructor() {
    console.log("Glyph Deconstructor loaded.");
    this.text = "GLYPH";
    this.scale = 1;
    this.jitter = 20;
    this.lineCount = 1;
    this.rotation = 10;
    this.color = '#FFF8E7';
    this.glyphs = [];
    this.regenerate();
  }

  regenerate() {
    this.glyphs = [];
    const textToDraw = this.text.toUpperCase();
    for (let i = 0; i < textToDraw.length; i++) {
      this.glyphs.push({
        char: textToDraw[i],
        x: random(-this.jitter, this.jitter),
        y: random(-this.jitter, this.jitter),
        rot: radians(random(-this.rotation, this.rotation))
      });
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    let currentScale = this.scale;
    if (options.isAudioReactive && options.audioLevel > 0.01) {
      // Modulate scale based on audio input. audioLevel is 0-1.
      // A multiplier of 1.5 provides a nice "pulse" effect.
      currentScale = this.scale * (1 + options.audioLevel * 1.5);
    }

    if (!options.noBackground) {
      buffer.background(17, 17, 17);
    }
    buffer.textAlign(CENTER, CENTER);
    buffer.textFont('JetBrains Mono');
    buffer.fill(this.color);

    if (golGrid) {
      // GOL mode: Draw jittery glyphs on living cells.
      const textToDraw = this.text.toUpperCase();
      if (!textToDraw || textToDraw.length === 0) return;

      // Scale font size relative to the GOL cell size for visibility
      buffer.textSize(gameOfLifeCellSize * 1.2 * currentScale);
      let charIndex = 0;

      for (let i = 0; i < golGrid.length; i++) {
        for (let j = 0; j < golGrid[i].length; j++) {
          if (golGrid[i][j] === 1) {
            const x = i * gameOfLifeCellSize + gameOfLifeCellSize / 2;
            const y = j * gameOfLifeCellSize + gameOfLifeCellSize / 2;
            const charToDraw = textToDraw[charIndex % textToDraw.length];
            
            buffer.push();
            buffer.translate(x + random(-this.jitter, this.jitter), y + random(-this.jitter, this.jitter));
            buffer.rotate(radians(random(-this.rotation, this.rotation)));
            buffer.text(charToDraw, 0, 0);
            buffer.pop();

            charIndex++;
          }
        }
      }
    } else {
      // Original mode: Draw deconstructed glyphs in the center.
      const fontSize = 150 * currentScale;
      buffer.textSize(fontSize);

      const totalLineHeight = (this.glyphs.length > 0 ? fontSize : 0) * this.lineCount;
      const startY = buffer.height / 2 - totalLineHeight / 2 + fontSize / 2;

      for (let line = 0; line < this.lineCount; line++) {
        const totalWidth = this.glyphs.reduce((w, glyph) => w + buffer.textWidth(glyph.char), 0);
        let currentX = (buffer.width - totalWidth) / 2;
        const yPos = startY + line * fontSize;

        for (const glyph of this.glyphs) {
          const charWidth = buffer.textWidth(glyph.char);
          buffer.push();
          buffer.translate(currentX + charWidth / 2 + glyph.x, yPos + glyph.y);
          buffer.rotate(glyph.rot);
          buffer.text(glyph.char, 0, 0);
          buffer.pop();
          currentX += charWidth;
        }
      }
    }
  }
}

window.GlyphDeconstructor = GlyphDeconstructor;