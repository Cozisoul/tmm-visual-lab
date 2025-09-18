/**
 * @class PosterComposer
 * @description A layout tool for generating poster compositions based on different design
 * principles, including generative, Molnar-style, and Müller-Brockmann-style layouts.
 */
class PosterComposer {
  constructor() {
    console.log("Poster Composer loaded.");
    this.imageBlocks = 2;
    this.preset = 'generative';
    this.textBlocks = 3;
    this.imageColor = '#232323';
    this.textColor = '#3C3C3C';
    this.blockScale = 1.0;
    this.margin = 50;
    this.layout = [];
    this.regenerate(); // Generate an initial layout
  }

  regenerate() {
    this.layout = [];
    switch (this.preset) {
      case 'molnar':
        this.generateMolnarLayout();
        break;
      case 'brockmann':
        this.generateBrockmannLayout();
        break;
      default: // generative
        this.generateGenerativeLayout();
        break;
    }
  }

  generateGenerativeLayout() {
    const areaX = this.margin;
    const areaY = this.margin;
    const areaW = artboard.width - this.margin * 2;
    const areaH = artboard.height - this.margin * 2;
    
    // Create a grid system for better organization
    const gridCols = 6;
    const gridRows = 6;
    const cellW = areaW / gridCols;
    const cellH = areaH / gridRows;
    
    // Track occupied cells to prevent overlaps
    const occupiedCells = new Set();
    
    // Helper function to check if a cell region is available
    const isCellRegionAvailable = (startCol, startRow, spanCols, spanRows) => {
      for (let col = startCol; col < startCol + spanCols; col++) {
        for (let row = startRow; row < startRow + spanRows; row++) {
          if (col >= gridCols || row >= gridRows) return false;
          if (occupiedCells.has(`${col},${row}`)) return false;
        }
      }
      return true;
    };
    
    // Helper function to mark cells as occupied
    const occupyCellRegion = (startCol, startRow, spanCols, spanRows) => {
      for (let col = startCol; col < startCol + spanCols; col++) {
        for (let row = startRow; row < startRow + spanRows; row++) {
          occupiedCells.add(`${col},${row}`);
        }
      }
    };
    
    // Helper function to find available space for a block
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
    
    // Place image blocks in larger spaces
    for (let i = 0; i < this.imageBlocks; i++) {
      const space = findAvailableSpace(2, 2);
      if (space) {
        const { startCol, startRow, spanCols, spanRows } = space;
        occupyCellRegion(startCol, startRow, spanCols, spanRows);
        
        // Add some randomness to the exact position within the grid cells
        const jitterX = random(-cellW * 0.1, cellW * 0.1);
        const jitterY = random(-cellH * 0.1, cellH * 0.1);
        
        this.layout.push({
          type: 'image',
          x: areaX + startCol * cellW + jitterX,
          y: areaY + startRow * cellH + jitterY,
          w: spanCols * cellW * this.blockScale * random(0.8, 1),
          h: spanRows * cellH * this.blockScale * random(0.8, 1)
        });
      }
    }
    
    // Place text blocks in remaining spaces, preferring horizontal arrangements
    for (let i = 0; i < this.textBlocks; i++) {
      const space = findAvailableSpace(2, 1);
      if (space) {
        const { startCol, startRow, spanCols, spanRows } = space;
        occupyCellRegion(startCol, startRow, spanCols, spanRows);
        
        // Add some randomness to the exact position
        const jitterX = random(-cellW * 0.05, cellW * 0.05);
        const jitterY = random(-cellH * 0.05, cellH * 0.05);
        
        this.layout.push({
          type: 'text',
          x: areaX + startCol * cellW + jitterX,
          y: areaY + startRow * cellH + jitterY,
          w: spanCols * cellW * this.blockScale * random(0.9, 1),
          h: spanRows * cellH * this.blockScale * random(0.3, 0.4)
        });
      }
    }
  }

  generateMolnarLayout() {
    const cols = 5;
    const rows = 5;
    const areaW = artboard.width - this.margin * 2;
    const areaH = artboard.height - this.margin * 2;
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
        h: random(cellH * 0.5, cellH * 1.5) * this.blockScale
      });
    }
  }

  generateBrockmannLayout() {
    const cols = 8;
    const areaW = artboard.width - this.margin * 2;
    const areaH = artboard.height - this.margin * 2;
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
        h: random(areaH * 0.1, areaH * 0.5) * this.blockScale
      });
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(17, 17, 17); // Clear the artboard
    }
    buffer.noStroke();

    if (golGrid) {
      // --- START GOL INTEGRATION ---
      // When GOL is active, ignore the pre-generated layout and draw blocks on living cells.
      const w = gameOfLifeCellSize;
      const h = gameOfLifeCellSize;
      let liveCellCount = 0;
      
      // First, count live cells to determine total blocks
      for (let i = 0; i < golGrid.length; i++) {
        for (let j = 0; j < golGrid[i].length; j++) {
          if (golGrid[i][j] === 1) {
            liveCellCount++;
          }
        }
      }
      
      // Determine how many image blocks to draw based on the ratio set by the user
      const totalBlocks = this.imageBlocks + this.textBlocks;
      const imageBlockProportion = totalBlocks > 0 ? this.imageBlocks / totalBlocks : 0;
      const imageBlockCutoff = floor(liveCellCount * imageBlockProportion);

      let blockCounter = 0;
      for (let i = 0; i < golGrid.length; i++) {
        for (let j = 0; j < golGrid[i].length; j++) {
          if (golGrid[i][j] === 1) {
            // Use blockScale for GOL mode size control
            const sizeMultiplier = random(0.5, 1.5) * this.blockScale;
            const w = gameOfLifeCellSize * sizeMultiplier;
            const h = gameOfLifeCellSize * sizeMultiplier;
            const x = i * gameOfLifeCellSize + (gameOfLifeCellSize - w) / 2;
            const y = j * gameOfLifeCellSize + (gameOfLifeCellSize - h) / 2;
            
            // Use imageColor for the first N blocks, then textColor
            const blockColor = (blockCounter < imageBlockCutoff) ? this.imageColor : this.textColor;
            buffer.fill(blockColor);
            buffer.rect(x, y, w, h);
            blockCounter++;
          }
        }
      }
      // --- END GOL INTEGRATION ---
    } else {
      // Draw the pre-generated layout
      for (const block of this.layout) {
        buffer.fill(block.type === 'image' ? this.imageColor : this.textColor);
        buffer.rect(block.x, block.y, block.w, block.h);
      }
    }
  }
}

window.PosterComposer = PosterComposer;