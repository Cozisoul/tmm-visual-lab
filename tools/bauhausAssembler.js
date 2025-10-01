/**
 * @class BauhausAssembler
 * @description A generative art tool inspired by the Bauhaus movement. It creates compositions
 * by randomly placing simple geometric shapes (rectangles, ellipses) with a limited color palette.
 */
class BauhausAssembler extends ToolBase {
  constructor() {
    super();
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
          // Use WEBGL coordinates (centered around 0,0)
          x: random(-width/2, width/2),
          y: random(-height/2, height/2),
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

    const audioScale = options.isAudioReactive ? 1 + options.audioLevel * 0.5 : 1; // Subtle scaling effect

    if (!options.noBackground) {
      buffer.background(options.backgroundColor || '#111111');
    }

    // Ensure proper canvas sizing for tools
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;

    if (golGrid) {
      const golGridCols = golGrid.length;
      const golGridRows = golGrid[0].length;
      const cellW = canvasWidth / golGridCols;
      const cellH = canvasHeight / golGridRows;
      const colors = this.getColors();

      for (let i = 0; i < golGridCols; i++) {
        for (let j = 0; j < golGridRows; j++) {
          if (golGrid[i][j] === 1) { // If cell is alive
            const cellX = i * cellW;
            const cellY = j * cellH;

            // Generate a shape for this alive GOL cell
            const shapeType = random(['rect', 'ellipse']);
            const shapeColor = random(colors);
            
            // Generate size based on maxSize, with a small random variation
            const baseShapeW = cellW * (this.maxSize / 100);
            const baseShapeH = cellH * (this.maxSize / 100);
            const shapeW = baseShapeW * random(0.8, 1.2) * audioScale; // Apply small random variation
            const shapeH = baseShapeH * random(0.8, 1.2) * audioScale;

            // Use elementCount as a probability to draw a shape
            // Assuming elementCount ranges from 1 to 200 (from script.js)
            const drawProbability = map(this.elementCount, 1, 200, 0.1, 1.0); // Map to 10% to 100% probability
            if (random() < drawProbability) {
              buffer.fill(shapeColor);
              if (shapeType === 'rect') {
                buffer.rect(cellX + (cellW - shapeW) / 2, cellY + (cellH - shapeH) / 2, shapeW, shapeH);
              } else {
                buffer.ellipse(cellX + cellW / 2, cellY + cellH / 2, shapeW, shapeH);
              }
            }
          }
        }
      }
    } else {
      // Existing drawing logic when GOL is not active - WEBGL coordinates
      buffer.push();
      buffer.translate(0, 0); // Center in WEBGL mode
      
      for (const s of this.shapes) {
        buffer.fill(s.color);
        const scaledW = s.w * audioScale;
        const scaledH = s.h * audioScale;
        const scaledX = s.x - (scaledW - s.w) / 2;
        const scaledY = s.y - (scaledH - s.h) / 2;

        if (s.type === 'rect') {
          buffer.rect(scaledX, scaledY, scaledW, scaledH);
        } else {
          buffer.ellipse(scaledX + scaledW / 2, scaledY + scaledH / 2, scaledW, scaledH);
        }
      }
      
      buffer.pop();
    }
  }
}

window.BauhausAssembler = BauhausAssembler;