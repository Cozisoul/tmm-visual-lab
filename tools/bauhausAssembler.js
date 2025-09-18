/**
 * @class BauhausAssembler
 * @description A generative art tool inspired by the Bauhaus movement. It creates compositions
 * by randomly placing simple geometric shapes (rectangles, ellipses) with a limited color palette.
 */
class BauhausAssembler {
  constructor() {
    console.log("Bauhaus Assembler loaded.");
    this.colorPalette = 'primary';
    this.elementCount = 15; // Default value matching HTML
    this.maxSize = 20;
    this.allowOverlap = true;
    this.shapes = [];
    this.regenerate();
  }

  regenerate() {
    this.shapes = [];
    let colors;
    if (this.colorPalette === 'primary') {
      colors = ['#ff0000', '#0000ff', '#ffff00', '#111111', '#FFF8E7'];
    } else if (this.colorPalette === 'muted') {
      colors = ['#EAE2B7', '#FCBF49', '#F77F00', '#D62828', '#003049'];
    } else if (this.colorPalette === 'destijl') {
      colors = ['#dd0000', '#fac901', '#225095', '#222222', '#dddddd'];
    } else if (this.colorPalette === 'pastel') {
      colors = ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4'];
    } else { // monochrome
      colors = ['#111111', '#444444', '#888888', '#BBBBBB', '#EEEEEE'];
    }

    for (let i = 0; i < this.elementCount; i++) { 
      let newShape;
      let attempts = 0;
      const maxAttempts = 200; // Prevent infinite loops

      do {
        newShape = {
          type: random(['rect', 'ellipse']),
          x: random(artboard.width),
          y: random(artboard.height),
          // Use the maxSize control, converting from percentage
          w: random(artboard.width * 0.05, artboard.width * (this.maxSize / 100)),
          h: random(artboard.height * 0.05, artboard.height * (this.maxSize / 100)),
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
      // Simple AABB (Axis-Aligned Bounding Box) collision detection
      if (newShape.x < existingShape.x + existingShape.w &&
          newShape.x + newShape.w > existingShape.x &&
          newShape.y < existingShape.y + existingShape.h &&
          newShape.y + newShape.h > existingShape.y) {
        return true; // Overlap detected
      }
    }
    return false; // No overlap
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(options.backgroundColor || '#111111');
    }
    buffer.noStroke();

    if (golGrid) {
      // GOL mode: Draw elements at the location of "living" GOL cells.
      let colors;
      if (this.colorPalette === 'primary') {
        colors = ['#ff0000', '#0000ff', '#ffff00', '#111111', '#FFF8E7'];
      } else if (this.colorPalette === 'muted') {
        colors = ['#EAE2B7', '#FCBF49', '#F77F00', '#D62828', '#003049'];
      } else if (this.colorPalette === 'destijl') {
        colors = ['#dd0000', '#fac901', '#225095', '#222222', '#dddddd'];
      } else if (this.colorPalette === 'pastel') {
        colors = ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4'];
      } else { // monochrome
        colors = ['#111111', '#444444', '#888888', '#BBBBBB', '#EEEEEE'];
      }
      let colorIndex = 0;

      for (let i = 0; i < golGrid.length; i++) {
        for (let j = 0; j < golGrid[i].length; j++) {
          if (golGrid[i][j] === 1) {
            // Use maxSize as a multiplier for GOL mode size
            const sizeMultiplier = (this.maxSize / 20); // Normalize (default slider is 20)
            const w = random(0.5, 1.5) * gameOfLifeCellSize * sizeMultiplier;
            const h = random(0.5, 1.5) * gameOfLifeCellSize * sizeMultiplier;
            const x = i * gameOfLifeCellSize + (gameOfLifeCellSize - w) / 2;
            const y = j * gameOfLifeCellSize + (gameOfLifeCellSize - h) / 2;
            
            buffer.fill(colors[colorIndex % colors.length]);
            // Draw a small shape, respecting the GOL cell size
            if (random() > 0.5) {
              buffer.rect(x, y, w, h);
            } else {
              buffer.ellipse(x + w / 2, y + h / 2, w, h);
            }
            colorIndex++;
          }
        }
      }
    } else {
      // Default mode: Draw the pre-generated shapes.
      for (const s of this.shapes) {
        buffer.fill(s.color);
        if (s.type === 'rect') {
          buffer.rect(s.x, s.y, s.w, s.h);
        } else {
          buffer.ellipse(s.x, s.y, s.w, s.h);
        }
      }
    }
  }
}

window.BauhausAssembler = BauhausAssembler;