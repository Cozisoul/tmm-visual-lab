import { ToolBase } from '../../core/tool-base.js';

export class BauhausAssembler extends ToolBase {
    constructor(p) {
        super(p);
        this.colorPalette = 'primary';
        this.elementCount = 15;
        this.maxSize = 20;
        this.allowOverlap = true;
        this.shapes = [];
    }

    setup() {
        this.regenerate();
    }

    getColors() {
        const palettes = {
            primary: ['#ff0000', '#0000ff', '#ffff00', '#111111', '#FFF8E7'],
            muted: ['#EAE2B7', '#FCBF49', '#F77F00', '#D62828', '#003049'],
            destijl: ['#dd0000', '#fac901', '#225095', '#222222', '#dddddd'],
            pastel: ['#fec5bb', '#fcd5ce', '#fae1dd', '#f8edeb', '#e8e8e4'],
            monochrome: ['#111111', '#444444', '#888888', '#BBBBBB', '#EEEEEE']
        };
        return palettes[this.colorPalette] || palettes.primary;
    }

    regenerate() {
        const p = this.p;
        const width = p.width;
        const height = p.height;

        if (!width || !height) return;

        this.shapes = [];
        const colors = this.getColors();

        for (let i = 0; i < this.elementCount; i++) {
            let newShape;
            let attempts = 0;
            const maxAttempts = 200;

            do {
                newShape = {
                    type: p.random(['rect', 'ellipse']),
                    x: p.random(-width / 2, width / 2),
                    y: p.random(-height / 2, height / 2),
                    w: p.random(width * 0.05, width * (this.maxSize / 100)),
                    h: p.random(height * 0.05, height * (this.maxSize / 100)),
                    color: p.random(colors)
                };
                attempts++;
            } while (!this.allowOverlap && this.checkOverlap(newShape) && attempts < maxAttempts);

            if (attempts < maxAttempts) {
                this.shapes.push(newShape);
            }
        }
    }

    checkOverlap(newShape) {
        for (const existingShape of this.shapes) {
            if (newShape.x < existingShape.x + existingShape.w &&
                newShape.x + newShape.w > existingShape.x &&
                newShape.y < existingShape.y + existingShape.h &&
                newShape.y + newShape.h > existingShape.y) {
                return true;
            }
        }
        return false;
    }

    draw() {
        const p = this.p;
        p.push();
        p.translate(0, 0); // Center in WEBGL mode (if applicable, but we are likely in P2D or default)
        // Note: If Renderer uses P2D, translate(0,0) is top-left. If WEBGL, it's center.
        // The original code assumed WEBGL coordinates in draw() but random(-width/2, width/2) in regenerate.
        // This implies the renderer is likely using WEBGL or the original code was using WEBGL.
        // However, SwissGridder used translate(width/2, height/2) which implies P2D but manual centering.
        // Let's assume P2D for now and translate to center if the shapes are generated centered around 0.
        p.translate(p.width / 2, p.height / 2);

        p.noStroke();
        p.background(17, 17, 17); // Default background

        for (const s of this.shapes) {
            p.fill(s.color);
            const scaledW = s.w;
            const scaledH = s.h;
            // Shapes are centered at s.x, s.y
            const scaledX = s.x - (scaledW - s.w) / 2; // This logic seems redundant if scaledW == s.w
            const scaledY = s.y - (scaledH - s.h) / 2;

            if (s.type === 'rect') {
                // rect draws from top-left by default in p5
                // s.x is center? No, random(-width/2, width/2).
                // If we translate to center, then s.x is relative to center.
                // But rect() expects x,y.
                // Let's assume s.x, s.y are top-left of the shape relative to center?
                // Or center of the shape?
                // The original checkOverlap assumes x,y is top-left.
                p.rect(s.x, s.y, s.w, s.h);
            } else {
                // ellipse draws from center by default
                // But checkOverlap treats x,y as top-left.
                // So ellipse center should be x + w/2, y + h/2
                p.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
            }
        }

        p.pop();
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            elementCount: document.getElementById('ba-element-count'),
            maxSize: document.getElementById('ba-max-size'),
            colorPalette: document.getElementById('ba-color-palette'),
            allowOverlap: document.getElementById('ba-allow-overlap'),
            regenerateBtn: document.getElementById('ba-regenerate-btn')
        };

        const update = () => {
            this.elementCount = parseInt(inputs.elementCount?.value || 15, 10);
            this.maxSize = parseInt(inputs.maxSize?.value || 20, 10);
            this.colorPalette = inputs.colorPalette?.value || 'primary';
            this.allowOverlap = inputs.allowOverlap?.checked !== false;

            this.regenerate();
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'ba-regenerate-btn') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
