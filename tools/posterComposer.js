/**
 * @class PosterComposer
 * @description A layout tool for generating poster compositions based on different design
 * principles, including generative, Molnar-style, and Müller-Brockmann-style layouts.
 */
class PosterComposer extends ToolBase {
  constructor() {
    super();
    console.log("Poster Composer loaded.");
    this.imageBlocks = 2;
    this.preset = 'generative';
    this.textBlocks = 3;
    this.imageColor = '#232323';
    this.textColor = '#3C3C3C';
    this.blockScale = 1.0;
    this.margin = 50;
    this.layout = [];
    // Text properties for text blocks
    this.text = "Creative Coding"; // Default text
    this.textFont = "Arial";
    this.textSize = 24;
    this.textAlignment = "center"; // center, left, right
    // Regeneration is now triggered by script.js after the tool is loaded.
  }

  regenerate(width, height) {
    if (!width || !height) {
      console.error("PosterComposer.regenerate() requires width and height.");
      return;
    }
    this.layout = [];
    switch (this.preset) {
      case 'molnar':
        this.generateMolnarLayout(width, height);
        break;
      case 'brockmann':
        this.generateBrockmannLayout(width, height);
        break;
      default: // generative
        this.generateGenerativeLayout(width, height);
        break;
    }
  }

  generateGenerativeLayout(width, height) {
    const areaX = this.margin;
    const areaY = this.margin;
    const areaW = width - this.margin * 2;
    const areaH = height - this.margin * 2;
    
    const gridCols = 6;
    const gridRows = 6;
    const cellW = areaW / gridCols;
    const cellH = areaH / gridRows;
    
    const occupiedCells = new Set();
    
    const isCellRegionAvailable = (startCol, startRow, spanCols, spanRows) => {
      for (let col = startCol; col < startCol + spanCols; col++) {
        for (let row = startRow; row < startRow + spanRows; row++) {
          if (col >= gridCols || row >= gridRows) return false;
          if (occupiedCells.has(`${col},${row}`)) return false;
        }
      }
      return true;
    };
    
    const occupyCellRegion = (startCol, startRow, spanCols, spanRows) => {
      for (let col = startCol; col < startCol + spanCols; col++) {
        for (let row = startRow; row < startRow + spanRows; row++) {
          occupiedCells.add(`${col},${row}`);
        }
      }
    };
    
    const findAvailableSpace = (minCols, minRows) => {
      const maxAttempts = 50;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const startCol = floor(random(gridCols - minCols + 1));
        const startRow = floor(random(gridRows - minRows + 1));
        const spanCols = minCols + floor(random(2));
        const spanRows = minRows + floor(random(2));
        
        if (isCellRegionAvailable(startCol, startRow, spanCols, spanRows)) {
          return { startCol, startRow, spanCols, spanRows };
        }
      }
      return null;
    };
    
    for (let i = 0; i < this.imageBlocks; i++) {
      const space = findAvailableSpace(2, 2);
      if (space) {
        const { startCol, startRow, spanCols, spanRows } = space;
        occupyCellRegion(startCol, startRow, spanCols, spanRows);
        
        const jitterX = random(-cellW * 0.1, cellW * 0.1);
        const jitterY = random(-cellH * 0.1, cellH * 0.1);
        
        this.layout.push({
          type: 'image',
          x: areaX + startCol * cellW + jitterX,
          y: areaY + startRow * cellH + jitterY,
          w: spanCols * cellW * this.blockScale * random(0.8, 1),
          h: spanRows * cellH * this.blockScale * random(0.8, 1),
          imageIndex: this.layout.filter(b => b.type === 'image').length // Assign a unique index
        });
      }
    }
    
    for (let i = 0; i < this.textBlocks; i++) {
      const space = findAvailableSpace(2, 1);
      if (space) {
        const { startCol, startRow, spanCols, spanRows } = space;
        occupyCellRegion(startCol, startRow, spanCols, spanRows);
        
        const jitterX = random(-cellW * 0.05, cellW * 0.05);
        const jitterY = random(-cellH * 0.05, cellH * 0.05);
        
        this.layout.push({
          type: 'text',
          x: areaX + startCol * cellW + jitterX,
          y: areaY + startRow * cellH + jitterY,
          w: spanCols * cellW * this.blockScale * random(0.9, 1),
          h: spanRows * cellH * this.blockScale * random(0.3, 0.4),
          text: "Text Block " + (this.layout.filter(b => b.type === 'text').length + 1)
        });
      }
    }
  }

  generateMolnarLayout(width, height) {
    const cols = 5;
    const rows = 5;
    const areaW = width - this.margin * 2;
    const areaH = height - this.margin * 2;
    const cellW = areaW / cols;
    const cellH = areaH / rows;
    const totalBlocks = this.imageBlocks + this.textBlocks;

    for (let i = 0; i < totalBlocks; i++) {
      const gridX = floor(random(cols));
      const gridY = floor(random(rows));
      const xPos = this.margin + gridX * cellW;
      const yPos = this.margin + gridY * cellH;
      this.layout.push({
        type: i < this.imageBlocks ? 'image' : 'text',
        x: xPos + random(-cellW / 4, cellW / 4),
        y: yPos + random(-cellH / 4, cellH / 4),
        w: random(cellW * 0.5, cellW * 1.5) * this.blockScale,
        h: random(cellH * 0.5, cellH * 1.5) * this.blockScale,
        imageIndex: i < this.imageBlocks ? this.layout.filter(b => b.type === 'image').length : undefined,
        text: i >= this.imageBlocks ? "Text Block " + (this.layout.filter(b => b.type === 'text').length + 1) : undefined
      });
    }
  }

  generateBrockmannLayout(width, height) {
    const cols = 8;
    const areaW = width - this.margin * 2;
    const areaH = height - this.margin * 2;
    const cellW = areaW / cols;
    const totalBlocks = this.imageBlocks + this.textBlocks;

    for (let i = 0; i < totalBlocks; i++) {
      const startCol = floor(random(cols));
      const colSpan = floor(random(1, cols - startCol));
      this.layout.push({
        type: i < this.imageBlocks ? 'image' : 'text',
        x: this.margin + startCol * cellW,
        y: this.margin + random(areaH * 0.8),
        w: colSpan * cellW * this.blockScale,
        h: random(areaH * 0.1, areaH * 0.5) * this.blockScale,
        imageIndex: i < this.imageBlocks ? this.layout.filter(b => b.type === 'image').length : undefined,
        text: i >= this.imageBlocks ? "Text Block " + (this.layout.filter(b => b.type === 'text').length + 1) : undefined
      });
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    buffer.push();
    
    // Ensure proper canvas sizing for tools
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;
    
    buffer.translate(-canvasWidth / 2, -canvasHeight / 2);
    buffer.noStroke();

    const audioScale = options.isAudioReactive ? 1 + options.audioLevel * 0.5 : 1; // Subtle scaling effect

    if (!options.noBackground) {
      buffer.background(options.backgroundColor || color(17, 17, 17));
    }

    if (golGrid) {
      const golGridCols = golGrid.length;
      const golGridRows = golGrid[0].length;
      const cellW = canvasWidth / golGridCols;
      const cellH = canvasHeight / golGridRows;

      for (let i = 0; i < golGridCols; i++) {
        for (let j = 0; j < golGridRows; j++) {
          if (golGrid[i][j] === 1) { // If cell is alive
            const cellX = i * cellW;
            const cellY = j * cellH;

            // Randomly decide between image and text block
            const blockType = random() > 0.5 ? 'image' : 'text';

            if (blockType === 'image') {
              let imgToDraw = null;
              if (Array.isArray(media) && media.length > 0) {
                imgToDraw = random(media); // Pick a random image if multiple are provided
              } else if (media && media.width && media.height) {
                imgToDraw = media;
              }

              if (imgToDraw) {
                buffer.image(imgToDraw, cellX, cellY, cellW * audioScale, cellH * audioScale);
              } else {
                buffer.fill(this.imageColor);
                buffer.rect(cellX, cellY, cellW * audioScale, cellH * audioScale);
              }
            } else if (blockType === 'text') {
              buffer.fill(this.textColor);
              // Instead of rendering text, just draw a rectangle
              buffer.rect(cellX, cellY, cellW * audioScale, cellH * audioScale);
            }
          }
        }
      }
    } else {
      // Original drawing logic if GOL is not active
      for (const block of this.layout) {
        if (block.type === 'image') {
          let imgToDraw = null;
          if (Array.isArray(media) && media.length > 0) {
            imgToDraw = media[block.imageIndex % media.length];
          } else if (media && media.width && media.height) {
            imgToDraw = media;
          }

          if (imgToDraw) {
            buffer.image(imgToDraw, block.x, block.y, block.w, block.h);
          } else {
            buffer.fill(this.imageColor);
            buffer.rect(block.x, block.y, block.w, block.h);
          }
        } else if (block.type === 'text') {
          buffer.fill(this.textColor);
          buffer.textFont(this.textFont);
          buffer.textSize(this.textSize);
          buffer.textAlign(CENTER, CENTER);
          const textX = block.x + block.w / 2;
          const textY = block.y + block.h / 2;
          buffer.text(block.text, textX, textY, block.w, block.h);
        }
      }
    }
    buffer.pop();
  }
}

window.PosterComposer = PosterComposer;