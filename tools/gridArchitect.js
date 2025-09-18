/**
 * @class GridArchitect
 * @description A tool for creating systematic grid layouts, including Cartesian, isometric, and polar grids.
 * It allows for detailed control over columns, rows, margins, gutters, and cell appearance.
 */
class GridArchitect {
  constructor() {
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
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(17, 17, 17); // #111111
    }

    if (!this.showGrid) {
      return;
    }

    if (this.layoutType === 'cartesian') {
      this.drawCartesianGrid(buffer, golGrid);
    } else if (this.layoutType === 'isometric') {
      this.drawIsometricGrid(buffer, golGrid, options);
    } else if (this.layoutType === 'polar') {
      this.drawPolarGrid(buffer, golGrid, options);
    }
  }

  drawCartesianGrid(buffer, golGrid = null) {
    // If background is transparent, we should probably still fill the shapes
    buffer.fill(this.fillColor);
    buffer.stroke(this.lineColor);
    buffer.strokeWeight(this.lineWeight);

    const totalGutterW = this.gutterX * (this.cols - 1);
    const totalGutterH = this.gutterY * (this.rows - 1);

    const gridW = buffer.width - this.marginX * 2 - totalGutterW;
    const gridH = buffer.height - this.marginY * 2 - totalGutterH;
    
    const cellW = gridW / this.cols;
    const cellH = gridH / this.rows;

    // If cells have no size (e.g., margins are too large), don't try to draw anything.
    if (cellW <= 0 || cellH <= 0) return;

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

        const x = this.marginX + i * (cellW + this.gutterX);
        const y = this.marginY + j * (cellH + this.gutterY);
        if (this.cellShape === 'rectangle') {
          buffer.rect(x, y, cellW, cellH);
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
  }

  drawIsometricGrid(buffer, golGrid = null, options = {}) {
    buffer.fill(this.fillColor);
    buffer.stroke(this.lineColor); 
    buffer.strokeWeight(this.lineWeight);

    const step = (buffer.width - this.marginX * 2) / this.cols;
    const angle = 30;
    const cellW = step * cos(radians(angle)) * 2;
    const cellH = step * sin(radians(angle)) * 2;

    buffer.push();
    buffer.translate(buffer.width / 2, this.marginY * 1.5);
    buffer.scale(options.zoom || 1.0);

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

  drawPolarGrid(buffer, golGrid = null, options = {}) {
    buffer.fill(this.fillColor);
    buffer.stroke(this.lineColor);
    buffer.strokeWeight(this.lineWeight);

    buffer.push();
    buffer.translate(buffer.width / 2, buffer.height / 2);

    const maxRadius = min(buffer.width, buffer.height) / 2 - this.marginX;
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
        this.drawCellText(buffer, cos(midAngle) * midRadius, sin(midAngle) * midRadius, radiusStep, angleStep * midRadius, i * this.rows + r);
      }
    }
    buffer.pop();
  }
}

window.GridArchitect = GridArchitect;