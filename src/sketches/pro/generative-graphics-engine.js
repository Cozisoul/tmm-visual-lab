import { ToolBase } from '../../core/tool-base.js';

export class GenerativeGraphicsEngine extends ToolBase {
    constructor(p) {
        super(p);
        this.mode = 'flowField';
        this.density = 20;
    }

    setup() {
        // No specific setup needed
    }

    drawRandomLines(density = 20) {
        const p = this.p;
        p.stroke(255);
        p.strokeWeight(1);
        for (let x = 0; x < p.width; x += density) {
            for (let y = 0; y < p.height; y += density) {
                p.push();
                p.translate(x + density / 2, y + density / 2);
                p.rotate(p.random(p.TWO_PI));
                p.line(-density / 2, 0, density / 2, 0);
                p.pop();
            }
        }
    }

    drawFlowField(density = 20) {
        const p = this.p;
        const noiseScale = 0.02;
        for (let x = 0; x < p.width; x += density) {
            for (let y = 0; y < p.height; y += density) {
                const angle = p.noise(x * noiseScale, y * noiseScale) * p.TWO_PI;
                p.push();
                p.translate(x, y);
                p.rotate(angle);
                p.stroke(255);
                p.line(0, 0, density, 0);
                p.pop();
            }
        }
    }

    draw() {
        const p = this.p;
        p.background(17, 17, 17);

        if (this.mode === 'flowField') {
            this.drawFlowField(this.density);
        } else {
            this.drawRandomLines(this.density);
        }
    }

    bindControls() {
        const inputs = {
            renderMode: document.getElementById('gge-render-mode'),
            renderBtn: document.getElementById('gge-render')
        };

        const update = () => {
            const mode = inputs.renderMode?.value || '2d';
            this.mode = mode === '3d' ? 'randomLines' : 'flowField';
        };

        // Initial update
        update();

        if (inputs.renderMode) {
            inputs.renderMode.addEventListener('change', update);
        }

        inputs.renderBtn?.addEventListener('click', () => {
            update();
        });
    }
}
