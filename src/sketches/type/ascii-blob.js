import { ToolBase } from '../../core/tool-base.js';

/**
 * ASCII Blob - Inspired by Tim Rodenbroeker
 * Creates pulsating ASCII art using sine waves
 */
export class AsciiBlob extends ToolBase {
    constructor(p) {
        super(p);
        this.text = 'BLOB';
        this.fontSize = 120;
        this.pulseSpeed = 1.5;
        this.pulseIntensity = 200;
        this.gridRows = 5;
        this.gridCols = 5;
        this.color = '#FFF8E7';
        this.rotationSpeed = 0;
    }

    setup() {
        const p = this.p;
        p.textAlign(p.CENTER, p.CENTER);
    }

    draw() {
        const p = this.p;

        p.background(17, 17, 17);
        p.fill(this.color);
        p.noStroke();
        p.textFont('monospace');
        p.textSize(this.fontSize);

        const displayText = this.text.toUpperCase();

        // Calculate spacing
        const cellWidth = p.width / this.gridCols;
        const cellHeight = p.height / this.gridRows;

        let charIndex = 0;

        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const centerX = col * cellWidth + cellWidth / 2;
                const centerY = row * cellHeight + cellHeight / 2;

                // Use Tim's sine-based pulsation technique
                const pulseOffset = p.sin(p.radians(p.frameCount * this.pulseSpeed + row * 20 + col * 20));
                const offsetX = p.map(pulseOffset, -1, 1, -this.pulseIntensity, this.pulseIntensity);
                const offsetY = p.map(p.cos(p.radians(p.frameCount * this.pulseSpeed + row * 15 + col * 15)), -1, 1, -this.pulseIntensity, this.pulseIntensity);

                // Scale variation
                const scaleVar = p.map(pulseOffset, -1, 1, 0.5, 1.5);

                p.push();
                p.translate(centerX + offsetX, centerY + offsetY);

                if (this.rotationSpeed > 0) {
                    p.rotate(p.radians(p.frameCount * this.rotationSpeed + row * 10));
                }

                p.scale(scaleVar);
                p.text(displayText[charIndex % displayText.length], 0, 0);
                p.pop();

                charIndex++;
            }
        }
    }

    bindControls() {
        const inputs = {
            text: document.getElementById('ab-text'),
            fontSize: document.getElementById('ab-font-size'),
            gridRows: document.getElementById('ab-grid-rows'),
            gridCols: document.getElementById('ab-grid-cols'),
            pulseSpeed: document.getElementById('ab-pulse-speed'),
            pulseIntensity: document.getElementById('ab-pulse-intensity'),
            rotationSpeed: document.getElementById('ab-rotation-speed'),
            color: document.getElementById('ab-color')
        };

        const update = () => {
            this.text = inputs.text?.value || 'BLOB';
            this.fontSize = parseInt(inputs.fontSize?.value || 120, 10);
            this.gridRows = parseInt(inputs.gridRows?.value || 5, 10);
            this.gridCols = parseInt(inputs.gridCols?.value || 5, 10);
            this.pulseSpeed = parseFloat(inputs.pulseSpeed?.value || 1.5);
            this.pulseIntensity = parseInt(inputs.pulseIntensity?.value || 200, 10);
            this.rotationSpeed = parseFloat(inputs.rotationSpeed?.value || 0);
            this.color = inputs.color?.value || '#FFF8E7';
        };

        update();

        Object.values(inputs).forEach(input => {
            if (input) {
                input.addEventListener('input', update);
            }
        });
    }
}
