import { ToolBase } from '../../core/tool-base.js';

export class GlyphDeconstructor extends ToolBase {
    constructor(p) {
        super(p);
        this.text = "GLYPH";
        this.scale = 1;
        this.jitter = 20;
        this.lineCount = 1;
        this.rotation = 10;
        this.color = '#FFF8E7';
        this.glyphs = [];

        // Audio reactivity state
        this.isAudioReactive = false;
        this.audioLevel = 0;
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        this.glyphs = [];
        const textToDraw = this.text.toUpperCase();
        for (let i = 0; i < textToDraw.length; i++) {
            this.glyphs.push({
                char: textToDraw[i],
                x: p.random(-this.jitter, this.jitter),
                y: p.random(-this.jitter, this.jitter),
                rot: p.radians(p.random(-this.rotation, this.rotation))
            });
        }
    }

    draw() {
        const p = this.p;
        let currentScale = this.scale;

        if (this.isAudioReactive && this.audioLevel > 0.01) {
            currentScale = this.scale * (1 + this.audioLevel * 1.5);
        }

        const canvasWidth = p.width;
        const canvasHeight = p.height;

        p.background(17, 17, 17);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('monospace'); // Using monospace as fallback or specific font if loaded
        p.fill(this.color);

        const fontSize = 150 * currentScale;
        p.textSize(fontSize);

        const totalLineHeight = (this.glyphs.length > 0 ? fontSize : 0) * this.lineCount;
        const startY = canvasHeight / 2 - totalLineHeight / 2 + fontSize / 2;

        for (let line = 0; line < this.lineCount; line++) {
            const totalWidth = this.glyphs.reduce((w, glyph) => w + p.textWidth(glyph.char), 0);
            let currentX = (canvasWidth - totalWidth) / 2;
            const yPos = startY + line * fontSize;

            for (const glyph of this.glyphs) {
                const charWidth = p.textWidth(glyph.char);
                p.push();
                p.translate(currentX + charWidth / 2 + glyph.x, yPos + glyph.y);
                p.rotate(glyph.rot);
                p.text(glyph.char, 0, 0);
                p.pop();
                currentX += charWidth;
            }
        }
    }

    bindControls() {
        const inputs = {
            text: document.getElementById('gd-text'),
            lineCount: document.getElementById('gd-line-count'),
            scale: document.getElementById('gd-scale'),
            jitter: document.getElementById('gd-jitter'),
            rotation: document.getElementById('gd-rotation'),
            color: document.getElementById('gd-color'),
            regenerateBtn: document.getElementById('gd-regenerate-btn')
        };

        const update = () => {
            this.text = inputs.text?.value || 'GLYPH';
            this.lineCount = parseInt(inputs.lineCount?.value || 1, 10);
            this.scale = parseFloat(inputs.scale?.value || 1.0);
            this.jitter = parseInt(inputs.jitter?.value || 20, 10);
            this.rotation = parseInt(inputs.rotation?.value || 10, 10);
            this.color = inputs.color?.value || '#FFF8E7';

            this.regenerate();
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'gd-regenerate-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
