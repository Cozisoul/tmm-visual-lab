import { ToolBase } from '../../core/tool-base.js';

export class ColorSystemAnalyzer extends ToolBase {
    constructor(p) {
        super(p);
        this.paletteSize = 8;
        this.palette = [];
        this.isAnalyzing = false;

        // Media property
        this.media = null;
    }

    setup() {
        // No specific setup
    }

    analyze(sourceMedia) {
        if (!sourceMedia || this.isAnalyzing) return;

        this.isAnalyzing = true;
        this.palette = [];

        try {
            const source = sourceMedia;
            source.loadPixels();

            if (!source.pixels || !source.pixels.length) {
                throw new Error("No pixel data available");
            }

            const colorCounts = new Map();
            const step = 4 * 4; // Check every 4th pixel

            for (let i = 0; i < source.pixels.length; i += step) {
                if (i + 2 >= source.pixels.length) break;

                const r = source.pixels[i];
                const g = source.pixels[i + 1];
                const b = source.pixels[i + 2];
                const key = `${r},${g},${b}`;
                colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
            }

            const sortedColors = Array.from(colorCounts.keys()).sort((a, b) => colorCounts.get(b) - colorCounts.get(a));
            this.palette = sortedColors.slice(0, this.paletteSize).map(c => {
                const [r, g, b] = c.split(',').map(Number);
                return this.p.color(r, g, b);
            });

        } catch (error) {
            console.error("Error analyzing colors:", error);
            this.isAnalyzing = false;
            return;
        }

        this.isAnalyzing = false;

        // Update UI swatches
        const outputDiv = document.getElementById('csa-palette-output');
        if (outputDiv) {
            outputDiv.innerHTML = '';
            this.palette.forEach(c => {
                const swatch = document.createElement('div');
                swatch.className = 'palette-swatch';
                swatch.style.backgroundColor = c.toString('#rrggbb');
                outputDiv.appendChild(swatch);
            });
        }
    }

    draw() {
        const p = this.p;

        if (!this.showBackground) {
            p.background(17, 17, 17);
        }

        if (this.palette.length > 0) {
            const barHeight = p.height / this.palette.length;
            p.noStroke();
            for (let i = 0; i < this.palette.length; i++) {
                p.fill(this.palette[i]);
                p.rect(0, i * barHeight, p.width, barHeight);
            }
        } else {
            p.fill(128);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('UPLOAD AN IMAGE AND CLICK "ANALYZE"', p.width / 2, p.height / 2);
        }
    }

    bindControls() {
        const inputs = {
            paletteSize: document.getElementById('csa-palette-size'),
            analyzeBtn: document.getElementById('csa-analyze-btn')
        };

        const update = () => {
            this.paletteSize = parseInt(inputs.paletteSize?.value || 8, 10);
        };

        // Initial update
        update();

        // Bind events
        if (inputs.paletteSize) {
            inputs.paletteSize.addEventListener('input', update);
        }

        inputs.analyzeBtn?.addEventListener('click', () => {
            if (this.media) {
                this.analyze(this.media);
            }
        });
    }
}
