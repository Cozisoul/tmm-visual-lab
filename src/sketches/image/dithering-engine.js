import { ToolBase } from '../../core/tool-base.js';

/**
 * Dithering Engine - Inspired by Tim Rodenbroeker's 128kb aesthetic
 * Advanced dithering with Floyd-Steinberg, Bayer, and custom patterns
 */
export class DitheringEngine extends ToolBase {
    constructor(p) {
        super(p);
        this.algorithm = 'floyd-steinberg';
        this.paletteSize = 2; // B&W by default
        this.customPalette = ['#000000', '#FFFFFF'];
        this.ditherStrength = 1.0;
        this.ditheredImage = null;

        // Media property
        this.media = null;
    }

    setup() {
        // No specific setup
    }

    applyDithering(sourceMedia) {
        if (!sourceMedia || sourceMedia.width <= 0 || sourceMedia.height <= 0) return;

        const p = this.p;
        this.ditheredImage = p.createImage(sourceMedia.width, sourceMedia.height);
        this.ditheredImage.copy(sourceMedia, 0, 0, sourceMedia.width, sourceMedia.height, 0, 0, sourceMedia.width, sourceMedia.height);
        this.ditheredImage.loadPixels();

        if (this.algorithm === 'floyd-steinberg') {
            this.floydSteinberg();
        } else if (this.algorithm === 'bayer') {
            this.bayerDithering();
        } else if (this.algorithm === 'atkinson') {
            this.atkinsonDithering();
        } else {
            this.simpleDithering();
        }

        this.ditheredImage.updatePixels();
    }

    floydSteinberg() {
        const p = this.p;
        const w = this.ditheredImage.width;
        const h = this.ditheredImage.height;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const index = (x + y * w) * 4;
                const oldR = this.ditheredImage.pixels[index];
                const oldG = this.ditheredImage.pixels[index + 1];
                const oldB = this.ditheredImage.pixels[index + 2];

                // Find nearest palette color
                const newColor = this.findNearestColor(oldR, oldG, oldB);
                const newR = p.red(newColor);
                const newG = p.green(newColor);
                const newB = p.blue(newColor);

                this.ditheredImage.pixels[index] = newR;
                this.ditheredImage.pixels[index + 1] = newG;
                this.ditheredImage.pixels[index + 2] = newB;

                const errR = (oldR - newR) * this.ditherStrength;
                const errG = (oldG - newG) * this.ditherStrength;
                const errB = (oldB - newB) * this.ditherStrength;

                // Distribute error
                this.distributeError(x + 1, y, w, h, errR * 7 / 16, errG * 7 / 16, errB * 7 / 16);
                this.distributeError(x - 1, y + 1, w, h, errR * 3 / 16, errG * 3 / 16, errB * 3 / 16);
                this.distributeError(x, y + 1, w, h, errR * 5 / 16, errG * 5 / 16, errB * 5 / 16);
                this.distributeError(x + 1, y + 1, w, h, errR * 1 / 16, errG * 1 / 16, errB * 1 / 16);
            }
        }
    }

    atkinsonDithering() {
        const p = this.p;
        const w = this.ditheredImage.width;
        const h = this.ditheredImage.height;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const index = (x + y * w) * 4;
                const oldR = this.ditheredImage.pixels[index];
                const oldG = this.ditheredImage.pixels[index + 1];
                const oldB = this.ditheredImage.pixels[index + 2];

                const newColor = this.findNearestColor(oldR, oldG, oldB);
                const newR = p.red(newColor);
                const newG = p.green(newColor);
                const newB = p.blue(newColor);

                this.ditheredImage.pixels[index] = newR;
                this.ditheredImage.pixels[index + 1] = newG;
                this.ditheredImage.pixels[index + 2] = newB;

                const errR = (oldR - newR) * this.ditherStrength / 8;
                const errG = (oldG - newG) * this.ditherStrength / 8;
                const errB = (oldB - newB) * this.ditherStrength / 8;

                // Atkinson pattern
                this.distributeError(x + 1, y, w, h, errR, errG, errB);
                this.distributeError(x + 2, y, w, h, errR, errG, errB);
                this.distributeError(x - 1, y + 1, w, h, errR, errG, errB);
                this.distributeError(x, y + 1, w, h, errR, errG, errB);
                this.distributeError(x + 1, y + 1, w, h, errR, errG, errB);
                this.distributeError(x, y + 2, w, h, errR, errG, errB);
            }
        }
    }

    bayerDithering() {
        const p = this.p;
        const w = this.ditheredImage.width;
        const h = this.ditheredImage.height;
        const bayerMatrix = [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ];

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const index = (x + y * w) * 4;
                const threshold = (bayerMatrix[y % 4][x % 4] / 16 - 0.5) * this.ditherStrength * 255;

                const r = p.constrain(this.ditheredImage.pixels[index] + threshold, 0, 255);
                const g = p.constrain(this.ditheredImage.pixels[index + 1] + threshold, 0, 255);
                const b = p.constrain(this.ditheredImage.pixels[index + 2] + threshold, 0, 255);

                const newColor = this.findNearestColor(r, g, b);
                this.ditheredImage.pixels[index] = p.red(newColor);
                this.ditheredImage.pixels[index + 1] = p.green(newColor);
                this.ditheredImage.pixels[index + 2] = p.blue(newColor);
            }
        }
    }

    simpleDithering() {
        const p = this.p;
        const w = this.ditheredImage.width;
        const h = this.ditheredImage.height;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const index = (x + y * w) * 4;
                const r = this.ditheredImage.pixels[index];
                const g = this.ditheredImage.pixels[index + 1];
                const b = this.ditheredImage.pixels[index + 2];

                const newColor = this.findNearestColor(r, g, b);
                this.ditheredImage.pixels[index] = p.red(newColor);
                this.ditheredImage.pixels[index + 1] = p.green(newColor);
                this.ditheredImage.pixels[index + 2] = p.blue(newColor);
            }
        }
    }

    distributeError(x, y, w, h, errR, errG, errB) {
        if (x < 0 || x >= w || y < 0 || y >= h) return;

        const index = (x + y * w) * 4;
        this.ditheredImage.pixels[index] += errR;
        this.ditheredImage.pixels[index + 1] += errG;
        this.ditheredImage.pixels[index + 2] += errB;
    }

    findNearestColor(r, g, b) {
        const p = this.p;
        let minDist = Infinity;
        let nearest = p.color(0);

        for (let colorHex of this.customPalette.slice(0, this.paletteSize)) {
            const c = p.color(colorHex);
            const dist = this.colorDistance(r, g, b, p.red(c), p.green(c), p.blue(c));

            if (dist < minDist) {
                minDist = dist;
                nearest = c;
            }
        }

        return nearest;
    }

    colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    }

    draw() {
        const p = this.p;

        if (!this.showBackground) {
            p.background(17, 17, 17);
        }

        if (this.ditheredImage) {
            p.image(this.ditheredImage, 0, 0, p.width, p.height);
        } else {
            p.fill(128);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('UPLOAD AN IMAGE AND APPLY DITHERING', p.width / 2, p.height / 2);
        }
    }

    bindControls() {
        const inputs = {
            algorithm: document.getElementById('de-algorithm'),
            paletteSize: document.getElementById('de-palette-size'),
            ditherStrength: document.getElementById('de-dither-strength'),
            applyBtn: document.getElementById('de-apply-btn')
        };

        const update = () => {
            this.algorithm = inputs.algorithm?.value || 'floyd-steinberg';
            this.paletteSize = parseInt(inputs.paletteSize?.value || 2, 10);
            this.ditherStrength = parseFloat(inputs.ditherStrength?.value || 1.0);
        };

        update();

        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'de-apply-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.applyBtn?.addEventListener('click', () => {
            if (this.media) {
                this.applyDithering(this.media);
            }
        });
    }
}
