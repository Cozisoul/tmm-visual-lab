/**
 * @class BauhausAssembler
 * @description A generative art tool inspired by the Bauhaus movement. It creates compositions
 * by randomly placing simple geometric shapes (rectangles, ellipses) with a limited color palette.
 */
class BauhausAssembler {
  constructor() {
    console.log("Bauhaus Assembler loaded.");
    this.colorPalette = 'primary';
    this.elementCount = 15;
    this.maxSize = 20;
    this.allowOverlap = true;
    this.shapes = [];
  }

  getColors() {
    const palettes = {
      primary: ['#ff0000', '#0000ff', '#ffff00', '#111111', '#FFF8E7'],
      muted: ['#EAE2B7', '#FCBF49', '#F77F00', '#D62828', '#003049'],
      destijl: ['#dd0000', '#fac901', '#225095', '#222222', '#dddddd'],
      pastel: ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4'],
      monochrome: ['#111111', '#444444', '#888888', '#BBBBBB', '#EEEEEE']
    };
    return palettes[this.colorPalette] || palettes.primary;
  }

  regenerate(width, height) {
    if (!width || !height) return;

    this.shapes = [];
    const colors = this.getColors();

    for (let i = 0; i < this.elementCount; i++) { 
      let newShape;
      let attempts = 0;
      const maxAttempts = 200;

      do {
        newShape = {
          type: random(['rect', 'ellipse']),
          x: random(width),
          y: random(height),
          w: random(width * 0.05, width * (this.maxSize / 100)),
          h: random(height * 0.05, height * (this.maxSize / 100)),
          color: random(colors)
        };
        attempts++;
      } while (!this.allowOverlap && this.checkOverlap(newShape) && attempts < maxAttempts);

      if (attempts < maxAttempts) {
        this.shapes.push(newShape);
      }
    }
  }

  checkOverlap(newShape) {
    for (const existingShape of this.shapes) {
      if (newShape.x < existingShape.x + existingShape.w &&
          newShape.x + newShape.w > existingShape.x &&
          newShape.y < existingShape.y + existingShape.h &&
          newShape.y + newShape.h > existingShape.y) {
        return true;
      }
    }
    return false;
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    buffer.noStroke();

    if (golGrid) {
      const offscreenBuffer = createGraphics(buffer.width, buffer.height);
      if (!options.noBackground) {
        offscreenBuffer.background(options.backgroundColor || '#111111');
      }
      offscreenBuffer.noStroke();

      for (const s of this.shapes) {
        offscreenBuffer.fill(s.color);
        if (s.type === 'rect') {
          offscreenBuffer.rect(s.x, s.y, s.w, s.h);
        } else {
          offscreenBuffer.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
        }
      }

      const golGridCols = golGrid.length;
      const golGridRows = golGrid[0].length;
      const cellW = buffer.width / golGridCols;
      const cellH = buffer.height / golGridRows;

      if (!options.noBackground) {
        buffer.background(options.backgroundColor || '#111111');
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
      if (!options.noBackground) {
        buffer.background(options.backgroundColor || '#111111');
      }

      for (const s of this.shapes) {
        buffer.fill(s.color);
        if (s.type === 'rect') {
          buffer.rect(s.x, s.y, s.w, s.h);
        } else {
          buffer.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
        }
      }
    }
  }
}

window.BauhausAssembler = BauhausAssembler;