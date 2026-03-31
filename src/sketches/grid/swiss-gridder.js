import { ToolBase } from '../../core/tool-base.js';

export class SwissGridder extends ToolBase {
    constructor(p) {
        super(p);
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
        this.textAlignment = 'center';
        this.textYOffset = 0;
        this.textXOffset = 0;
        this.textRotation = 0;
        this.textEnabled = true;
        this.alternateText = '';
        this.textPattern = 'single';

        this.lineColor = '#333333';
        this.fillColor = '#111111';
        this.showGrid = true;
        this.showBackground = true;
        this.backgroundColor = '#000000';
    }

    setup() {
        // Initial setup if needed
    }

    draw() {
        const p = this.p;

        if (!this.showGrid) {
            if (this.showBackground) {
                p.background(this.backgroundColor);
            }
            return;
        }

        if (this.showBackground) {
            p.background(this.backgroundColor);
        }

        if (this.layoutType === 'cartesian') {
            this.drawCartesianGrid();
        } else if (this.layoutType === 'isometric') {
            this.drawIsometricGrid();
        } else if (this.layoutType === 'polar') {
            this.drawPolarGrid();
        }
    }

    drawCartesianGrid() {
        const p = this.p;
        p.push();
        p.translate(p.width / 2, p.height / 2);

        p.fill(this.fillColor);
        p.stroke(this.lineColor);
        p.strokeWeight(this.lineWeight);

        const totalGutterW = this.gutterX * (this.cols - 1);
        const totalGutterH = this.gutterY * (this.rows - 1);

        const availableW = p.width - this.marginX * 2;
        const availableH = p.height - this.marginY * 2;
        const gridW = Math.max(100, availableW - totalGutterW);
        const gridH = Math.max(100, availableH - totalGutterH);

        const cellW = gridW / this.cols;
        const cellH = gridH / this.rows;

        const startX = -gridW / 2;
        const startY = -gridH / 2;

        if (cellW <= 0 || cellH <= 0) {
            p.pop();
            return;
        }

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const x = startX + i * (cellW + this.gutterX);
                const y = startY + j * (cellH + this.gutterY);

                if (this.cellShape === 'rectangle') {
                    p.push();
                    p.fill(this.fillColor);
                    p.stroke(this.lineColor);
                    p.strokeWeight(this.lineWeight);
                    p.rect(x, y, cellW, cellH);
                    p.pop();
                } else if (this.cellShape === 'ellipse') {
                    p.ellipse(x + cellW / 2, y + cellH / 2, cellW, cellH);
                } else if (this.cellShape === 'triangle') {
                    p.push();
                    p.translate(x + cellW / 2, y + cellH / 2);
                    p.triangle(0, -cellH / 2, -cellW / 2, cellH / 2, cellW / 2, cellH / 2);
                    p.pop();
                }

                this.drawCellText(x, y, cellW, cellH, i * this.rows + j);
            }
        }
        p.pop();
    }

    drawIsometricGrid() {
        const p = this.p;
        p.push();
        p.translate(p.width / 2, p.height / 2);

        p.fill(this.fillColor);
        p.stroke(this.lineColor);
        p.strokeWeight(this.lineWeight);

        const availableWidth = p.width - this.marginX * 2;
        const availableHeight = p.height - this.marginY * 2;

        const maxSpan = Math.min(availableWidth, availableHeight);
        const totalGridSpan = Math.max(this.cols, this.rows) * 1.5;
        const step = Math.max(10, (maxSpan / totalGridSpan) * 0.7);

        const angle = 30;
        const cellW = step * p.cos(p.radians(angle)) * 2;
        const cellH = step * p.sin(p.radians(angle)) * 2;

        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                const x = (i - j) * step * p.cos(p.radians(angle));
                const y = (i + j) * step * p.sin(p.radians(angle));

                p.push();
                p.translate(x, y);

                // Draw the flat diamond shape
                p.beginShape();
                p.vertex(0, -cellH / 2);
                p.vertex(cellW / 2, 0);
                p.vertex(0, cellH / 2);
                p.vertex(-cellW / 2, 0);
                p.endShape(p.CLOSE);

                this.drawCellText(-cellW / 2, -cellH / 2, cellW, cellH, i * this.rows + j);
                p.pop();
            }
        }
        p.pop();
    }

    drawPolarGrid() {
        const p = this.p;
        p.fill(this.fillColor);
        p.stroke(this.lineColor);
        p.strokeWeight(this.lineWeight);

        p.push();
        p.translate(p.width / 2, p.height / 2);

        const availableWidth = p.width - this.marginX * 2;
        const availableHeight = p.height - this.marginY * 2;
        const maxRadius = Math.min(availableWidth, availableHeight) / 2 * 0.6;
        const radiusStep = maxRadius / this.rows;
        const angleStep = p.TWO_PI / this.cols;

        for (let r = 0; r < this.rows; r++) {
            for (let i = 0; i < this.cols; i++) {
                const startAngle = i * angleStep;
                const endAngle = (i + 1) * angleStep;
                const innerRadius = r * radiusStep;
                const outerRadius = (r + 1) * radiusStep;

                p.beginShape();
                for (let a = startAngle; a < endAngle; a += 0.05) { p.vertex(p.cos(a) * outerRadius, p.sin(a) * outerRadius); }
                p.vertex(p.cos(endAngle) * outerRadius, p.sin(endAngle) * outerRadius);
                for (let a = endAngle; a > startAngle; a -= 0.05) { p.vertex(p.cos(a) * innerRadius, p.sin(a) * innerRadius); }
                p.vertex(p.cos(startAngle) * innerRadius, p.sin(startAngle) * innerRadius);
                p.endShape(p.CLOSE);

                if (this.textEnabled && this.cellText) {
                    const midAngle = startAngle + angleStep / 2;
                    const midRadius = innerRadius + radiusStep / 2;
                    const textX = p.cos(midAngle) * midRadius;
                    const textY = p.sin(midAngle) * midRadius;

                    let displayText = this.cellText;
                    const cellIndex = i * this.rows + r;
                    if (this.textPattern === 'alternate' && this.alternateText) {
                        displayText = (cellIndex % 2 === 0) ? this.cellText : this.alternateText;
                    } else if (this.textPattern === 'random' && this.alternateText) {
                        displayText = (p.random() > 0.5) ? this.cellText : this.alternateText;
                    }

                    p.push();
                    p.fill(this.textColor);
                    p.noStroke();
                    p.textFont(this.textFont);
                    p.textSize(radiusStep * this.textSizeRatio);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.translate(textX, textY);
                    p.rotate(midAngle);
                    if (this.textRotation !== 0) {
                        p.rotate(p.radians(this.textRotation));
                    }
                    p.text(displayText, 0, 0);
                    p.pop();
                }
            }
        }
        p.pop();
    }

    drawCellText(x, y, cellW, cellH, cellIndex) {
        if (!this.textEnabled || !this.cellText) return;
        const p = this.p;

        p.push();
        p.fill(this.textColor);
        p.noStroke();
        p.textFont(this.textFont);
        p.textSize(Math.min(cellW, cellH) * this.textSizeRatio);

        let alignX = p.CENTER;
        let alignY = p.CENTER;
        if (this.textAlignment === 'left') alignX = p.LEFT;
        if (this.textAlignment === 'right') alignX = p.RIGHT;
        p.textAlign(alignX, alignY);

        const textX = x + cellW / 2 + (this.textXOffset * cellW / 2);
        const textY = y + cellH / 2 + (this.textYOffset * cellH / 2);

        let displayText = this.cellText;
        if (this.textPattern === 'alternate' && this.alternateText) {
            displayText = (cellIndex % 2 === 0) ? this.cellText : this.alternateText;
        } else if (this.textPattern === 'random' && this.alternateText) {
            displayText = (p.random() > 0.5) ? this.cellText : this.alternateText;
        }

        if (this.textRotation !== 0) {
            p.translate(textX, textY);
            p.rotate(p.radians(this.textRotation));
            p.text(displayText, 0, 0);
        } else {
            p.text(displayText, textX, textY);
        }

        p.pop();
    }

    bindControls() {
        const inputs = {
            layoutType: document.getElementById('ga-layout-type'),
            cols: document.getElementById('ga-cols'),
            rows: document.getElementById('ga-rows'),
            marginX: document.getElementById('ga-margin-x'),
            marginY: document.getElementById('ga-margin-y'),
            gutterX: document.getElementById('ga-gutter-x'),
            gutterY: document.getElementById('ga-gutter-y'),
            cellShape: document.getElementById('ga-cell-shape'),
            cellText: document.getElementById('ga-cell-text'),
            textColor: document.getElementById('ga-text-color'),
            textSize: document.getElementById('ga-text-size'),
            lineWeight: document.getElementById('ga-line-weight'),
            lineColor: document.getElementById('ga-line-color'),
            fillColor: document.getElementById('ga-fill-color'),
            showGrid: document.getElementById('ga-show-grid'),
            showBackground: document.getElementById('ga-showBackground'),
            backgroundColor: document.getElementById('ga-backgroundColor'),
        };

        const update = () => {
            this.layoutType = inputs.layoutType?.value || 'cartesian';
            this.cols = parseInt(inputs.cols?.value || 10, 10);
            this.rows = parseInt(inputs.rows?.value || 10, 10);
            this.marginX = parseInt(inputs.marginX?.value || 50, 10);
            this.marginY = parseInt(inputs.marginY?.value || 50, 10);
            this.gutterX = parseInt(inputs.gutterX?.value || 0, 10);
            this.gutterY = parseInt(inputs.gutterY?.value || 0, 10);
            this.cellShape = inputs.cellShape?.value || 'rectangle';
            this.cellText = inputs.cellText?.value || '';
            this.textColor = inputs.textColor?.value || '#FFF8E7';
            this.textSizeRatio = parseInt(inputs.textSize?.value || 80, 10) / 100;
            this.lineWeight = parseFloat(inputs.lineWeight?.value || 1);
            this.lineColor = inputs.lineColor?.value || '#333333';
            this.fillColor = inputs.fillColor?.value || '#111111';
            this.showGrid = inputs.showGrid?.checked !== false;
            this.showBackground = inputs.showBackground?.checked !== false;
            this.backgroundColor = inputs.backgroundColor?.value || '#000000';
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input) {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });
    }
}
