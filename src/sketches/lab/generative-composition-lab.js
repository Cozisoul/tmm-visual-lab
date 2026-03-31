import { ToolBase } from '../../core/tool-base.js';

export class GenerativeCompositionLab extends ToolBase {
    constructor(p) {
        super(p);
        this.layers = 3;
        this.elementsPerLayer = 20;
        this.composition = [];
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        this.composition = [];
        const colorPalettes = [
            ['#FF6B6B', '#FFE66D', '#4ECDC4', '#1A535C'],
            ['#F7FFF7', '#4ECDC4', '#FFE66D', '#FF6B6B'],
            ['#DBC2CF', '#9FA2B2', '#545775', '#2A2C49']
        ];

        for (let i = 0; i < this.layers; i++) {
            const layer = [];
            const palette = colorPalettes[i % colorPalettes.length];
            for (let j = 0; j < this.elementsPerLayer; j++) {
                layer.push({
                    x: p.random(p.width || 1080),
                    y: p.random(p.height || 1080),
                    w: p.random(50, 200),
                    h: p.random(50, 200),
                    color: p.color(p.random(palette)),
                    shape: p.random(['rect', 'ellipse'])
                });
            }
            this.composition.push(layer);
        }
    }

    draw() {
        const p = this.p;
        p.background(17, 17, 17);
        p.noStroke();

        for (const layer of this.composition) {
            for (const element of layer) {
                const c = element.color;
                p.fill(p.red(c), p.green(c), p.blue(c), 150);
                if (element.shape === 'rect') {
                    p.rect(element.x, element.y, element.w, element.h);
                } else {
                    p.ellipse(element.x, element.y, element.w, element.h);
                }
            }
        }
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            regenerateBtn: document.getElementById('gcl-regenerate')
        };

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
