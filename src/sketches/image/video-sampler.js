import { ToolBase } from '../../core/tool-base.js';

export class VideoSampler extends ToolBase {
    constructor(p) {
        super(p);
        this.cols = 16;
        this.mode = 'grid';
        this.slitDirection = 'horizontal';
        this.slitPosition = 50;
        this.slitScanBuffer = null;
        this.slitScanPos = 0;

        // Media property
        this.media = null;
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        if (this.slitScanBuffer) {
            this.slitScanBuffer.remove();
        }
        this.slitScanBuffer = p.createGraphics(p.width, p.height);
        this.reset();
    }

    reset() {
        this.slitScanPos = 0;
        if (this.slitScanBuffer) {
            this.slitScanBuffer.background(0, 0, 0, 0);
        }
    }

    cleanup() {
        if (this.slitScanBuffer) {
            this.slitScanBuffer.remove();
            this.slitScanBuffer = null;
        }
    }

    draw() {
        const p = this.p;

        if (this.mode === 'grid') {
            if (!this.showBackground) {
                p.background(17, 17, 17);
            }
            const cellW = p.width / this.cols;
            const cellH = cellW;
            const rows = p.floor(p.height / cellH);

            if (this.media && this.media.width > 0) {
                for (let i = 0; i < this.cols; i++) {
                    for (let j = 0; j < rows; j++) {
                        const x = i * cellW;
                        const y = j * cellH;
                        p.image(this.media, x, y, cellW, cellH);
                    }
                }
            } else {
                p.fill(128);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('UPLOAD A VIDEO/IMAGE VIA THE MEDIA BUS', p.width / 2, p.height / 2);
            }
        } else if (this.mode === 'slit-scan') {
            if (!this.slitScanBuffer || this.slitScanBuffer.width !== p.width || this.slitScanBuffer.height !== p.height) {
                this.regenerate();
            }

            if (this.media && this.media.width > 0 && this.media.height > 0) {
                if (this.slitDirection === 'horizontal') {
                    const slitY = p.floor(this.media.height * (this.slitPosition / 100));
                    this.slitScanBuffer.copy(this.media, 0, slitY, this.media.width, 1, this.slitScanPos, 0, 1, p.height);
                    this.slitScanPos = (this.slitScanPos + 1) % p.width;
                } else {
                    const slitX = p.floor(this.media.width * (this.slitPosition / 100));
                    this.slitScanBuffer.copy(this.media, slitX, 0, 1, this.media.height, 0, this.slitScanPos, p.width, 1);
                    this.slitScanPos = (this.slitScanPos + 1) % p.height;
                }
            }
            p.image(this.slitScanBuffer, 0, 0);
        }
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            mode: document.getElementById('vs-mode'),
            slitPosition: document.getElementById('vs-slit-position'),
            slitDirection: document.getElementById('vs-slit-direction'),
            cols: document.getElementById('vs-cols')
        };

        const update = () => {
            const oldMode = this.mode;
            const oldDirection = this.slitDirection;

            this.mode = inputs.mode?.value || 'grid';
            this.slitPosition = parseInt(inputs.slitPosition?.value || 50, 10);
            this.slitDirection = inputs.slitDirection?.value || 'horizontal';
            this.cols = parseInt(inputs.cols?.value || 16, 10);

            if (oldMode !== this.mode || oldDirection !== this.slitDirection) {
                this.reset();
            }

            // Handle UI visibility for slit-scan settings
            const slitScanSettings = document.querySelectorAll('.slit-scan-settings');
            const isSlitScan = this.mode === 'slit-scan';
            slitScanSettings.forEach(el => {
                el.style.display = isSlitScan ? (el.classList.contains('control-group') ? 'flex' : 'block') : 'none';
            });
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
