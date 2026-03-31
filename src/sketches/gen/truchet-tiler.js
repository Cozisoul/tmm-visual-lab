import { ToolBase } from '../../core/tool-base.js';

export class TruchetTiler extends ToolBase {
    constructor(p) {
        super(p);
        this.tiles = [];
        this.tileSize = 80;
        this.lineWeight = 2;
        this.density = 1;
        this.animSpeed = 0;
        this.strokeColor = '#FFF8E7';
        this.backgroundColor = '#111111';
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        this.tiles = [];
        const step = this.tileSize / this.density;
        const bufferWidth = p.width || 1080;
        const bufferHeight = p.height || 1080;

        for (let x = 0; x < bufferWidth + step; x += step) {
            for (let y = 0; y < bufferHeight + step; y += step) {
                this.tiles.push({
                    x: x,
                    y: y,
                    type: p.random() > 0.5
                });
            }
        }
    }

    draw() {
        const p = this.p;

        if (!this.showBackground) {
            p.background(this.backgroundColor);
        }

        p.noFill();
        p.stroke(this.strokeColor);
        p.strokeWeight(this.lineWeight);

        const step = this.tileSize / this.density;

        for (const tile of this.tiles) {
            let type = tile.type;
            if (this.animSpeed > 0 && p.frameCount % (60 - this.animSpeed) < 2) {
                if (p.random() < 0.1) tile.type = !tile.type;
            }

            if (type) {
                p.arc(tile.x, tile.y, step, step, 0, p.HALF_PI);
                p.arc(tile.x + step, tile.y + step, step, step, p.PI, p.PI + p.HALF_PI);
            } else {
                p.arc(tile.x + step, tile.y, step, step, p.HALF_PI, p.PI);
                p.arc(tile.x, tile.y + step, step, step, p.PI + p.HALF_PI, p.TWO_PI);
            }
        }
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            tileSize: document.getElementById('tt-tile-size'),
            density: document.getElementById('tt-density'),
            animSpeed: document.getElementById('tt-anim-speed'),
            lineWeight: document.getElementById('tt-line-weight'),
            strokeColor: document.getElementById('tt-stroke-color'),
            backgroundColor: document.getElementById('tt-bg-color'),
            regenerateBtn: document.getElementById('tt-regenerate-btn')
        };

        const update = () => {
            const oldTileSize = this.tileSize;
            const oldDensity = this.density;

            this.tileSize = parseInt(inputs.tileSize?.value || 80, 10);
            this.density = parseInt(inputs.density?.value || 1, 10);
            this.animSpeed = parseInt(inputs.animSpeed?.value || 0, 10);
            this.lineWeight = parseFloat(inputs.lineWeight?.value || 2.0);
            this.strokeColor = inputs.strokeColor?.value || '#FFF8E7';
            this.backgroundColor = inputs.backgroundColor?.value || '#111111';

            if (this.tileSize !== oldTileSize || this.density !== oldDensity) {
                this.regenerate();
            }
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'tt-regenerate-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
