import { ToolBase } from '../../core/tool-base.js';

export class PosterComposer extends ToolBase {
    constructor(p) {
        super(p);
        this.imageBlocks = 2;
        this.preset = 'generative';
        this.textBlocks = 3;
        this.imageColor = '#232323';
        this.textColor = '#3C3C3C';
        this.blockScale = 1.0;
        this.margin = 50;
        this.layout = [];
        this.text = "Creative Coding";
        this.textFont = "Arial";
        this.textSize = 24;
        this.textAlignment = "center";
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        const width = p.width;
        const height = p.height;

        if (!width || !height) return;

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
        const p = this.p;
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
                const startCol = p.floor(p.random(gridCols - minCols + 1));
                const startRow = p.floor(p.random(gridRows - minRows + 1));
                const spanCols = minCols + p.floor(p.random(2));
                const spanRows = minRows + p.floor(p.random(2));

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

                const jitterX = p.random(-cellW * 0.1, cellW * 0.1);
                const jitterY = p.random(-cellH * 0.1, cellH * 0.1);

                this.layout.push({
                    type: 'image',
                    x: areaX + startCol * cellW + jitterX,
                    y: areaY + startRow * cellH + jitterY,
                    w: spanCols * cellW * this.blockScale * p.random(0.8, 1),
                    h: spanRows * cellH * this.blockScale * p.random(0.8, 1),
                    imageIndex: this.layout.filter(b => b.type === 'image').length
                });
            }
        }

        for (let i = 0; i < this.textBlocks; i++) {
            const space = findAvailableSpace(2, 1);
            if (space) {
                const { startCol, startRow, spanCols, spanRows } = space;
                occupyCellRegion(startCol, startRow, spanCols, spanRows);

                const jitterX = p.random(-cellW * 0.05, cellW * 0.05);
                const jitterY = p.random(-cellH * 0.05, cellH * 0.05);

                this.layout.push({
                    type: 'text',
                    x: areaX + startCol * cellW + jitterX,
                    y: areaY + startRow * cellH + jitterY,
                    w: spanCols * cellW * this.blockScale * p.random(0.9, 1),
                    h: spanRows * cellH * this.blockScale * p.random(0.3, 0.4),
                    text: "Text Block " + (this.layout.filter(b => b.type === 'text').length + 1)
                });
            }
        }
    }

    generateMolnarLayout(width, height) {
        const p = this.p;
        const cols = 5;
        const rows = 5;
        const areaW = width - this.margin * 2;
        const areaH = height - this.margin * 2;
        const cellW = areaW / cols;
        const cellH = areaH / rows;
        const totalBlocks = this.imageBlocks + this.textBlocks;

        for (let i = 0; i < totalBlocks; i++) {
            const gridX = p.floor(p.random(cols));
            const gridY = p.floor(p.random(rows));
            const xPos = this.margin + gridX * cellW;
            const yPos = this.margin + gridY * cellH;
            this.layout.push({
                type: i < this.imageBlocks ? 'image' : 'text',
                x: xPos + p.random(-cellW / 4, cellW / 4),
                y: yPos + p.random(-cellH / 4, cellH / 4),
                w: p.random(cellW * 0.5, cellW * 1.5) * this.blockScale,
                h: p.random(cellH * 0.5, cellH * 1.5) * this.blockScale,
                imageIndex: i < this.imageBlocks ? this.layout.filter(b => b.type === 'image').length : undefined,
                text: i >= this.imageBlocks ? "Text Block " + (this.layout.filter(b => b.type === 'text').length + 1) : undefined
            });
        }
    }

    generateBrockmannLayout(width, height) {
        const p = this.p;
        const cols = 8;
        const areaW = width - this.margin * 2;
        const areaH = height - this.margin * 2;
        const cellW = areaW / cols;
        const totalBlocks = this.imageBlocks + this.textBlocks;

        for (let i = 0; i < totalBlocks; i++) {
            const startCol = p.floor(p.random(cols));
            const colSpan = p.floor(p.random(1, cols - startCol));
            this.layout.push({
                type: i < this.imageBlocks ? 'image' : 'text',
                x: this.margin + startCol * cellW,
                y: this.margin + p.random(areaH * 0.8),
                w: colSpan * cellW * this.blockScale,
                h: p.random(areaH * 0.1, areaH * 0.5) * this.blockScale,
                imageIndex: i < this.imageBlocks ? this.layout.filter(b => b.type === 'image').length : undefined,
                text: i >= this.imageBlocks ? "Text Block " + (this.layout.filter(b => b.type === 'text').length + 1) : undefined
            });
        }
    }

    draw() {
        const p = this.p;
        p.push();
        p.translate(-p.width / 2, -p.height / 2); // Adjust for WEBGL center
        p.noStroke();
        p.background(17, 17, 17);

        for (const block of this.layout) {
            if (block.type === 'image') {
                p.fill(this.imageColor);
                p.rect(block.x, block.y, block.w, block.h);
            } else if (block.type === 'text') {
                p.fill(this.textColor);
                p.textFont(this.textFont);
                p.textSize(this.textSize);
                p.textAlign(p.CENTER, p.CENTER);
                const textX = block.x + block.w / 2;
                const textY = block.y + block.h / 2;
                p.text(block.text, textX, textY, block.w, block.h);
            }
        }
        p.pop();
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            preset: document.getElementById('pc-preset'),
            imageBlocks: document.getElementById('pc-image-blocks'),
            textBlocks: document.getElementById('pc-text-blocks'),
            imageColor: document.getElementById('pc-image-color'),
            textColor: document.getElementById('pc-text-color'),
            blockScale: document.getElementById('pc-block-scale'),
            regenerateBtn: document.getElementById('pc-regenerate-btn')
        };

        const update = () => {
            const oldPreset = this.preset;
            this.preset = inputs.preset?.value || 'generative';
            this.imageBlocks = parseInt(inputs.imageBlocks?.value || 2, 10);
            this.textBlocks = parseInt(inputs.textBlocks?.value || 3, 10);
            this.imageColor = inputs.imageColor?.value || '#232323';
            this.textColor = inputs.textColor?.value || '#3C3C3C';
            this.blockScale = parseFloat(inputs.blockScale?.value || 1.0);

            if (this.preset !== oldPreset) {
                this.regenerate();
            }
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'pc-regenerate-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
