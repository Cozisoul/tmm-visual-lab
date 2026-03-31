import { ToolBase } from '../../core/tool-base.js';

/**
 * Metaball Field - Inspired by Tim Rodenbroeker & The Coding Train
 * Creates organic blob/metaball effects using pixel-based rendering
 */
export class MetaballField extends ToolBase {
    constructor(p) {
        super(p);
        this.numBlobs = 5;
        this.blobSize = 100;
        this.threshold = 1.0;
        this.colorMode = 'gradient';
        this.baseColor = '#FF0066';
        this.secondColor = '#00FFFF';
        this.animationSpeed = 1;
        this.blobs = [];
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        this.blobs = [];

        for (let i = 0; i < this.numBlobs; i++) {
            this.blobs.push({
                x: p.random(p.width),
                y: p.random(p.height),
                vx: p.random(-2, 2),
                vy: p.random(-2, 2),
                r: p.random(this.blobSize * 0.5, this.blobSize * 1.5)
            });
        }
    }

    draw() {
        const p = this.p;

        p.loadPixels();

        // Update blob positions
        for (let blob of this.blobs) {
            blob.x += blob.vx * this.animationSpeed;
            blob.y += blob.vy * this.animationSpeed;

            // Bounce off edges
            if (blob.x < 0 || blob.x > p.width) blob.vx *= -1;
            if (blob.y < 0 || blob.y > p.height) blob.vy *= -1;

            blob.x = p.constrain(blob.x, 0, p.width);
            blob.y = p.constrain(blob.y, 0, p.height);
        }

        // Render metaballs
        const step = 4; // Sample every 4th pixel for performance

        for (let x = 0; x < p.width; x += step) {
            for (let y = 0; y < p.height; y += step) {
                let sum = 0;

                // Calculate metaball field value
                for (let blob of this.blobs) {
                    const dx = x - blob.x;
                    const dy = y - blob.y;
                    const d = p.sqrt(dx * dx + dy * dy);

                    if (d > 0) {
                        sum += (blob.r * blob.r) / (d * d);
                    }
                }

                // Set pixel color based on field value
                const index = (x + y * p.width) * 4;

                if (sum > this.threshold) {
                    if (this.colorMode === 'solid') {
                        const c = p.color(this.baseColor);
                        p.pixels[index] = p.red(c);
                        p.pixels[index + 1] = p.green(c);
                        p.pixels[index + 2] = p.blue(c);
                        p.pixels[index + 3] = 255;
                    } else {
                        // Gradient based on field strength
                        const c1 = p.color(this.baseColor);
                        const c2 = p.color(this.secondColor);
                        const amt = p.map(sum, this.threshold, this.threshold * 3, 0, 1);
                        const c = p.lerpColor(c1, c2, p.constrain(amt, 0, 1));

                        p.pixels[index] = p.red(c);
                        p.pixels[index + 1] = p.green(c);
                        p.pixels[index + 2] = p.blue(c);
                        p.pixels[index + 3] = 255;
                    }

                    // Fill neighboring pixels for performance
                    for (let dx = 0; dx < step; dx++) {
                        for (let dy = 0; dy < step; dy++) {
                            const ni = ((x + dx) + (y + dy) * p.width) * 4;
                            if (ni < p.pixels.length - 3) {
                                p.pixels[ni] = p.pixels[index];
                                p.pixels[ni + 1] = p.pixels[index + 1];
                                p.pixels[ni + 2] = p.pixels[index + 2];
                                p.pixels[ni + 3] = 255;
                            }
                        }
                    }
                } else {
                    // Background
                    for (let dx = 0; dx < step; dx++) {
                        for (let dy = 0; dy < step; dy++) {
                            const ni = ((x + dx) + (y + dy) * p.width) * 4;
                            if (ni < p.pixels.length - 3) {
                                p.pixels[ni] = 17;
                                p.pixels[ni + 1] = 17;
                                p.pixels[ni + 2] = 17;
                                p.pixels[ni + 3] = 255;
                            }
                        }
                    }
                }
            }
        }

        p.updatePixels();
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            numBlobs: document.getElementById('mb-num-blobs'),
            blobSize: document.getElementById('mb-blob-size'),
            threshold: document.getElementById('mb-threshold'),
            colorMode: document.getElementById('mb-color-mode'),
            baseColor: document.getElementById('mb-base-color'),
            secondColor: document.getElementById('mb-second-color'),
            animationSpeed: document.getElementById('mb-animation-speed'),
            regenerateBtn: document.getElementById('mb-regenerate-btn')
        };

        const update = () => {
            const oldNumBlobs = this.numBlobs;
            this.numBlobs = parseInt(inputs.numBlobs?.value || 5, 10);
            this.blobSize = parseInt(inputs.blobSize?.value || 100, 10);
            this.threshold = parseFloat(inputs.threshold?.value || 1.0);
            this.colorMode = inputs.colorMode?.value || 'gradient';
            this.baseColor = inputs.baseColor?.value || '#FF0066';
            this.secondColor = inputs.secondColor?.value || '#00FFFF';
            this.animationSpeed = parseFloat(inputs.animationSpeed?.value || 1);

            if (oldNumBlobs !== this.numBlobs) {
                this.regenerate();
            }

            // UI visibility for second color
            if (inputs.secondColor) {
                inputs.secondColor.parentElement.style.display = this.colorMode === 'gradient' ? 'flex' : 'none';
            }
        };

        update();

        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'mb-regenerate-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
