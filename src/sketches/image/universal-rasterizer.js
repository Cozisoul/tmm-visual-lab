import { ToolBase } from '../../core/tool-base.js';

export class UniversalRasterizer extends ToolBase {
    constructor(p) {
        super(p);
        this.cellSize = 10;
        this.mode = 'shape';
        this.shape = 'ellipse';
        this.invert = false;
        this.threshold = 128;
        this.rasterColor = '#FFF8E7';
        this.text = 'A';
        this.textColor = '#111111';
        this.asciiRamp = ' .:-=+*#%@';

        // Media property to be set by the controller/renderer
        this.media = null;
    }

    setup() {
        // No specific setup needed
    }

    draw() {
        const p = this.p;
        const canvasWidth = p.width;
        const canvasHeight = p.height;

        if (!this.showBackground) {
            p.background(17, 17, 17);
        }
        p.rectMode(p.CORNER);

        if (this.media && this.media.width > 0 && this.media.height > 0) {
            // Ensure pixels are loaded
            try {
                this.media.loadPixels();
                if (this.media.pixels.length === 0) return;

                for (let y = 0; y < canvasHeight; y += this.cellSize) {
                    for (let x = 0; x < canvasWidth; x += this.cellSize) {
                        const imgX = p.floor(p.map(x, 0, canvasWidth, 0, this.media.width));
                        const imgY = p.floor(p.map(y, 0, canvasHeight, 0, this.media.height));
                        const index = (imgY * this.media.width + imgX) * 4;

                        // Safety check for index
                        if (index < 0 || index >= this.media.pixels.length) continue;

                        const r = this.media.pixels[index];
                        const g = this.media.pixels[index + 1];
                        const b = this.media.pixels[index + 2];
                        // const a = this.media.pixels[index + 3]; // Alpha not used

                        // Calculate brightness manually or use p5 color
                        // Simple brightness: (r+g+b)/3 or luminance formula
                        const brightnessValueRaw = (r + g + b) / 3;
                        const bNorm = brightnessValueRaw / 255;
                        const brightnessValue = this.invert ? 1.0 - bNorm : bNorm;

                        if (this.mode === 'shape') {
                            const size = brightnessValue * this.cellSize * 1.5;
                            p.fill(this.rasterColor);
                            p.noStroke();
                            if (this.shape === 'ellipse') {
                                p.ellipse(x + this.cellSize / 2, y + this.cellSize / 2, size);
                            } else if (this.shape === 'rect') {
                                p.rectMode(p.CENTER);
                                p.rect(x + this.cellSize / 2, y + this.cellSize / 2, size, size);
                                p.rectMode(p.CORNER);
                            } else if (this.shape === 'triangle') {
                                p.push();
                                p.translate(x + this.cellSize / 2, y + this.cellSize / 2);
                                p.triangle(0, -size / 2, -size / 2, size / 2, size / 2, size / 2);
                                p.pop();
                            }
                            if (this.text && this.text.length > 0) {
                                p.fill(this.textColor);
                                p.textAlign(p.CENTER, p.CENTER);
                                p.textSize(size * 0.8);
                                p.text(this.text, x + this.cellSize / 2, y + this.cellSize / 2);
                            }
                        } else if (this.mode === 'ascii') {
                            const charIndex = p.floor(brightnessValue * (this.asciiRamp.length - 1));
                            const char = this.asciiRamp.charAt(charIndex);
                            p.fill(this.rasterColor);
                            p.noStroke();
                            p.textAlign(p.CENTER, p.CENTER);
                            p.textSize(this.cellSize);
                            p.text(char, x + this.cellSize / 2, y + this.cellSize / 2);
                        } else if (this.mode === 'bitmap') {
                            const isAboveThreshold = brightnessValueRaw > this.threshold;
                            // Logic check: original code: if (this.invert ? !isAboveThreshold : isAboveThreshold)
                            // My brightnessValue is already inverted if this.invert is true.
                            // But threshold comparison is against raw brightness.
                            // Let's stick to original logic:
                            // const isAboveThreshold = brightness(c) > this.threshold;
                            // if (this.invert ? !isAboveThreshold : isAboveThreshold)

                            if (this.invert ? !isAboveThreshold : isAboveThreshold) {
                                p.fill(this.rasterColor);
                                p.noStroke();
                                p.rect(x, y, this.cellSize, this.cellSize);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Error in UniversalRasterizer draw:", e);
            }
        } else {
            p.fill(128);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(12);
            p.text('UPLOAD AN IMAGE VIA THE MEDIA BUS', canvasWidth / 2, canvasHeight / 2);
        }
    }

    bindControls() {
        const inputs = {
            cellSize: document.getElementById('ur-cell-size'),
            mode: document.getElementById('ur-mode'),
            shape: document.getElementById('ur-shape'),
            threshold: document.getElementById('ur-threshold'),
            invert: document.getElementById('ur-invert'),
            rasterColor: document.getElementById('ur-raster-color'),
            text: document.getElementById('ur-text'),
            textColor: document.getElementById('ur-text-color')
        };

        const update = () => {
            this.cellSize = parseInt(inputs.cellSize?.value || 10, 10);
            this.mode = inputs.mode?.value || 'shape';
            this.shape = inputs.shape?.value || 'ellipse';
            this.threshold = parseInt(inputs.threshold?.value || 128, 10);
            this.invert = inputs.invert?.checked !== false; // Assuming default false if not checked? Original: checked !== false (so default true?)
            // Wait, inputs.invert.checked is boolean.
            // If inputs.invert is null, checked is undefined.
            // Original code: tool.invert = inputs.invert?.checked !== false;
            // If checkbox is checked, it returns true. true !== false => true.
            // If checkbox is unchecked, it returns false. false !== false => false.
            // If input is missing, undefined !== false => true.
            // So default is true if input missing?
            // Let's check HTML default. <input type="checkbox" id="ur-invert"> (no checked attribute) -> default unchecked.
            // So inputs.invert.checked is false.
            // false !== false is false.
            // So default is false.
            // But if input is missing, it becomes true.
            // I'll stick to simple check:
            this.invert = inputs.invert ? inputs.invert.checked : false;

            this.rasterColor = inputs.rasterColor?.value || '#FFF8E7';
            this.text = inputs.text?.value || 'A';
            this.textColor = inputs.textColor?.value || '#111111';

            // UI Visibility Logic (from script.js updateUiState or similar, but here we can do it locally or rely on CSS classes if they are toggled elsewhere)
            // The original script.js handled UI visibility in `updateUiState` or inside `update`.
            // I should replicate that visibility logic if possible, or just let CSS handle it if classes are used.
            // The HTML has classes like `ur-shape-settings`.
            // I can toggle them here.
            const shapeSettings = document.querySelectorAll('.ur-shape-settings');
            const isShapeMode = this.mode === 'shape';
            shapeSettings.forEach(el => {
                el.style.display = isShapeMode ? 'block' : 'none'; // or 'flex' depending on original CSS
                // Actually original CSS might use 'flex' for control-group.
                // Let's assume 'flex' for control-group and 'block' for header.
                if (el.classList.contains('control-group')) {
                    el.style.display = isShapeMode ? 'flex' : 'none';
                } else {
                    el.style.display = isShapeMode ? 'block' : 'none';
                }
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
