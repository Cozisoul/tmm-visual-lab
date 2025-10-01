/**
 * @class GridArchitect
 * @description A tool for creating systematic grid layouts, including Cartesian, isometric, and polar grids.
 * It allows for detailed control over columns, rows, margins, gutters, and cell appearance.
 */
class GridArchitect extends ToolBase {
  constructor() {
    super();
    this.cols = 10;
    this.layoutType = 'cartesian';
    this.rows = 10;
    this.marginX = 50;
    this.marginY = 50;
    this.gutterX = 0;
    this.gutterY = 0;
    this.lineWeight = 1;
    this.cellShape = 'rectangle';
    
    // Enhanced text properties
    this.cellText = '';
    this.textColor = '#FFF8E7';
    this.textFont = 'Arial';
    this.textSizeRatio = 0.8;
    this.textAlignment = 'center'; // center, left, right
    this.textYOffset = 0; // -1 to 1, for fine-tuning vertical position
    this.textXOffset = 0; // -1 to 1, for fine-tuning horizontal position
    this.textRotation = 0; // degrees
    this.textEnabled = true;
    this.alternateText = ''; // for alternating text pattern
    this.textPattern = 'single'; // single, alternate, random
    
    this.lineColor = '#333333';
    this.fillColor = '#111111';
    this.showGrid = true;
    this.showBackground = true; // New property
    this.backgroundColor = '#000000'; // New property

    // State for animations
    this.cellStates = [];
    this.lastCols = 0;
    this.lastRows = 0;
    this.easingFactor = 0.2; // How quickly cells pop, higher is faster
    this.popHeightMultiplier = 1.5; // How high cells pop, relative to their height
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    // Ensure proper canvas sizing for tools
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;
    
    // Performance optimization: Skip drawing if not visible
    if (!this.showGrid) {
      if (!options.noBackground && this.showBackground) {
        buffer.background(this.backgroundColor);
      }
      return;
    }

    if (!options.noBackground && this.showBackground) {
      buffer.background(this.backgroundColor);
    }

    // Performance optimization: Cache expensive calculations
    if (this.layoutType === 'cartesian') {
      this.drawCartesianGrid(buffer, golGrid, canvasWidth, canvasHeight);
    } else if (this.layoutType === 'isometric') {
      this.drawIsometricGrid(buffer, golGrid, options, canvasWidth, canvasHeight);
    } else if (this.layoutType === 'polar') {
      this.drawPolarGrid(buffer, golGrid, options, canvasWidth, canvasHeight);
    }
  }

  drawCartesianGrid(buffer, golGrid = null, canvasWidth, canvasHeight) {
    buffer.push();
    
    // Center the grid within the buffer
    buffer.translate(canvasWidth / 2, canvasHeight / 2);
    
    // If background is transparent, we should probably still fill the shapes
    buffer.fill(this.fillColor);
    buffer.stroke(this.lineColor);
    buffer.strokeWeight(this.lineWeight);

    const totalGutterW = this.gutterX * (this.cols - 1);
    const totalGutterH = this.gutterY * (this.rows - 1);

    // Ensure grid fits within canvas bounds with proper margins
    const availableW = canvasWidth - this.marginX * 2;
    const availableH = canvasHeight - this.marginY * 2;
    const gridW = Math.max(100, availableW - totalGutterW);
    const gridH = Math.max(100, availableH - totalGutterH);
    
    const cellW = gridW / this.cols;
    const cellH = gridH / this.rows;
    
    // Center the grid within the available space - WEBGL coordinates
    const startX = -gridW / 2;
    const startY = -gridH / 2;

    // If cells have no size (e.g., margins are too large), don't try to draw anything.
    if (cellW <= 0 || cellH <= 0) {
        buffer.pop(); // Make sure to pop before returning
        return;
    }

    // Draw the grid
    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        // --- START GOL INTEGRATION ---
        if (golGrid) {
          const golGridCols = golGrid.length;
          if (golGridCols === 0) continue;
          const golGridRows = golGrid[0].length;
          // Map the grid cell (i, j) to the GOL grid coordinates
          const golX = floor(map(i, 0, this.cols, 0, golGridCols));
          const golY = floor(map(j, 0, this.rows, 0, golGridRows));
          // Check if the corresponding GOL cell is alive
          if (!golGrid[golX] || golGrid[golX][golY] !== 1) {
            continue; // Skip drawing this cell if GOL cell is dead
          }
        }
        // --- END GOL INTEGRATION ---

        const x = startX + i * (cellW + this.gutterX);
        const y = startY + j * (cellH + this.gutterY);
        
        // Cell positioning
        
        if (this.cellShape === 'rectangle') {
          // Draw cell with stroke to make individual cells visible
          buffer.push();
          buffer.fill(this.fillColor);
          buffer.stroke(this.lineColor);
          buffer.strokeWeight(this.lineWeight);
          buffer.rect(x, y, cellW, cellH);
          buffer.pop();
        } else if (this.cellShape === 'ellipse') {
          buffer.ellipse(x + cellW / 2, y + cellH / 2, cellW, cellH);
        } else if (this.cellShape === 'triangle') {
          buffer.push();
          buffer.translate(x + cellW / 2, y + cellH / 2);
          // Equilateral-style triangle centered in the cell
          buffer.triangle(0, -cellH / 2, -cellW / 2, cellH / 2, cellW / 2, cellH / 2);
          buffer.pop();
        }

        // Draw text inside the cell if specified
        // Draw text with enhanced text controls
        this.drawCellText(buffer, x, y, cellW, cellH, i * this.rows + j);
      }
    }
    buffer.pop();
  }

  drawIsometricGrid(buffer, golGrid = null, options = {}, canvasWidth, canvasHeight) {
    buffer.push();
    
    // Center the grid within the buffer
    buffer.translate(canvasWidth / 2, canvasHeight / 2);
    
    buffer.fill(this.fillColor);
    buffer.stroke(this.lineColor);
    buffer.strokeWeight(this.lineWeight);

    // Calculate proper scaling to fit canvas for isometric grid
    const availableWidth = canvasWidth - this.marginX * 2;
    const availableHeight = canvasHeight - this.marginY * 2;
    
    // For isometric grids, we need to calculate based on the diagonal span
    // The isometric grid spans diagonally, so we need to account for both dimensions
    const maxSpan = Math.min(availableWidth, availableHeight);
    
    // Calculate step size based on the maximum diagonal span of the grid
    // For isometric, the total span is roughly (cols + rows) * step
    const totalGridSpan = Math.max(this.cols, this.rows) * 1.5; // 1.5 accounts for isometric projection
    const step = Math.max(10, (maxSpan / totalGridSpan) * 0.7); // Increased padding and minimum step size
    
    // Debug logging (removed to reduce console spam)
    
    // Safety check: ensure step is reasonable
    if (step < 8) {
      console.warn('Isometric grid step too small, adjusting...');
      // Don't return, just use a minimum step size
    }
    
    const angle = 30;
    const cellW = step * cos(radians(angle)) * 2;
    const cellH = step * sin(radians(angle)) * 2;

    buffer.push();
    // Center the isometric grid within the buffer - already centered above
    // Don't apply zoom scaling here as it's handled by the main canvas scaling
    // buffer.scale(options.zoom || 1.0);
    
    // Debug: Draw bounds to verify centering
    if (frameCount < 120) { // Show for 2 seconds
      buffer.stroke(255, 0, 0);
      buffer.strokeWeight(2);
      buffer.noFill();
      const debugSize = Math.min(canvasWidth, canvasHeight) * 0.4;
      buffer.rect(-debugSize/2, -debugSize/2, debugSize, debugSize);
    }

    for (let i = 0; i < this.cols; i++) {
      for (let j = 0; j < this.rows; j++) {
        let isAlive = false;
        if (golGrid) {
          const golGridCols = golGrid.length;
          if (golGridCols > 0) {
            const golGridRows = golGrid[0].length;
            const golX = floor(map(i, 0, this.cols, 0, golGridCols));
            const golY = floor(map(j, 0, this.rows, 0, golGridRows));
            if (golGrid[golX] && golGrid[golX][golY] === 1) {
              isAlive = true;
            }
          }
        }

        const x = (i - j) * step * cos(radians(angle));
        const y = (i + j) * step * sin(radians(angle));

        buffer.push();
        buffer.translate(x, y);

        if (isAlive) {
          const raiseHeight = cellH * 0.5;
          const topYOffset = -raiseHeight;
          const baseColor = color(this.fillColor);
          const sideColor1 = color(red(baseColor) * 0.7, green(baseColor) * 0.7, blue(baseColor) * 0.7);
          const sideColor2 = color(red(baseColor) * 0.5, green(baseColor) * 0.5, blue(baseColor) * 0.5);

          // Draw side faces
          buffer.fill(sideColor1);
          buffer.quad(-cellW / 2, 0, 0, cellH / 2, 0, cellH / 2 + topYOffset, -cellW / 2, topYOffset);
          buffer.fill(sideColor2);
          buffer.quad(cellW / 2, 0, 0, cellH / 2, 0, cellH / 2 + topYOffset, cellW / 2, topYOffset);

          // Draw top face
          buffer.fill(this.fillColor);
          buffer.beginShape();
          buffer.vertex(0, -cellH / 2 + topYOffset);
          buffer.vertex(cellW / 2, topYOffset);
          buffer.vertex(0, cellH / 2 + topYOffset);
          buffer.vertex(-cellW / 2, topYOffset);
          buffer.endShape(CLOSE);
        } else {
          // Draw the flat diamond shape
          buffer.beginShape();
          buffer.vertex(0, -cellH / 2);
          buffer.vertex(cellW / 2, 0);
          buffer.vertex(0, cellH / 2);
          buffer.vertex(-cellW / 2, 0);
          buffer.endShape(CLOSE);
        }

        // Draw text, adjusting for isometric perspective
        buffer.push();
        buffer.translate(0, 0); // Already at cell center
        this.drawCellText(buffer, -cellW/2, -cellH/2, cellW, cellH, i * this.rows + j);
        buffer.pop();

        buffer.pop();
      }
    }
    buffer.pop();
  }

  drawCellText(buffer, x, y, cellW, cellH, cellIndex) {
    if (!this.textEnabled || !this.cellText) return;

    buffer.push();
    
    // Text styling
    buffer.fill(this.textColor);
    buffer.noStroke();
    buffer.textFont(this.textFont);
    buffer.textSize(min(cellW, cellH) * this.textSizeRatio);

    // Text alignment
    let alignX = CENTER;
    let alignY = CENTER;
    if (this.textAlignment === 'left') alignX = LEFT;
    if (this.textAlignment === 'right') alignX = RIGHT;
    buffer.textAlign(alignX, alignY);

    // Position calculation with offsets
    const textX = x + cellW/2 + (this.textXOffset * cellW/2);
    const textY = y + cellH/2 + (this.textYOffset * cellH/2);

    // Text pattern selection
    let displayText = this.cellText;
    if (this.textPattern === 'alternate' && this.alternateText) {
      displayText = (cellIndex % 2 === 0) ? this.cellText : this.alternateText;
    } else if (this.textPattern === 'random' && this.alternateText) {
      displayText = (random() > 0.5) ? this.cellText : this.alternateText;
    }

    // Apply rotation if any
    if (this.textRotation !== 0) {
      buffer.translate(textX, textY);
      buffer.rotate(radians(this.textRotation));
      buffer.text(displayText, 0, 0);
    } else {
      buffer.text(displayText, textX, textY);
    }

    buffer.pop();
  }

  drawPolarGrid(buffer, golGrid = null, options = {}, canvasWidth, canvasHeight) {
    buffer.fill(this.fillColor);
    buffer.stroke(this.lineColor);
    buffer.strokeWeight(this.lineWeight);

    buffer.push();
    // Center properly in WEBGL mode - origin is already at center
    buffer.translate(0, 0);
    // Don't apply zoom scaling here as it's handled by the main canvas scaling
    // buffer.scale(options.zoom || 1.0);

    // Calculate proper scaling to fit canvas with margins
    const availableWidth = canvasWidth - this.marginX * 2;
    const availableHeight = canvasHeight - this.marginY * 2;
    const maxRadius = min(availableWidth, availableHeight) / 2 * 0.6; // Reduced from 0.7 to 0.6 for better centering
    const radiusStep = maxRadius / this.rows;
    const angleStep = TWO_PI / this.cols;

    for (let r = 0; r < this.rows; r++) {
      for (let i = 0; i < this.cols; i++) {
        const startAngle = i * angleStep;
        const endAngle = (i + 1) * angleStep;
        const innerRadius = r * radiusStep;
        const outerRadius = (r + 1) * radiusStep;

        // Draw the arc segment
        buffer.beginShape();
        for (let a = startAngle; a < endAngle; a += 0.05) { buffer.vertex(cos(a) * outerRadius, sin(a) * outerRadius); }
        buffer.vertex(cos(endAngle) * outerRadius, sin(endAngle) * outerRadius);
        for (let a = endAngle; a > startAngle; a -= 0.05) { buffer.vertex(cos(a) * innerRadius, sin(a) * innerRadius); }
        buffer.vertex(cos(startAngle) * innerRadius, sin(startAngle) * innerRadius);
        buffer.endShape(CLOSE);

        // Draw text in the middle of the cell, rotated
        const midAngle = startAngle + angleStep / 2;
        const midRadius = innerRadius + radiusStep / 2;
                // Draw text in the middle of the cell, rotated
        if (this.textEnabled && this.cellText) {
            const midAngle = startAngle + angleStep / 2;
            const midRadius = innerRadius + radiusStep / 2;
            const textX = cos(midAngle) * midRadius;
            const textY = sin(midAngle) * midRadius;
            
            let displayText = this.cellText;
            const cellIndex = i * this.rows + r;
            if (this.textPattern === 'alternate' && this.alternateText) {
              displayText = (cellIndex % 2 === 0) ? this.cellText : this.alternateText;
            } else if (this.textPattern === 'random' && this.alternateText) {
              displayText = (random() > 0.5) ? this.cellText : this.alternateText;
            }

            buffer.push();
            buffer.fill(this.textColor);
            buffer.noStroke();
            buffer.textFont(this.textFont);
            buffer.textSize(radiusStep * this.textSizeRatio);
            buffer.textAlign(CENTER, CENTER);
            buffer.translate(textX, textY);
            buffer.rotate(midAngle);
            if (this.textRotation !== 0) {
                buffer.rotate(radians(this.textRotation));
            }
            buffer.text(displayText, 0, 0);
            buffer.pop();
        }
      }
    }
    buffer.pop();
  }
}

window.GridArchitect = GridArchitect;

