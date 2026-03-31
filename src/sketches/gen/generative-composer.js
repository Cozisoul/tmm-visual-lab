import { ToolBase } from '../../core/tool-base.js';

export class GenerativeComposer extends ToolBase {
    constructor(p) {
        super(p);
        this.elementCount = 100;
        this.brushSize = 10;
        this.stepSize = 2;
        this.walkers = [];
        this.needsClear = true;
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        this.walkers = [];
        const bufferWidth = p.width || 1080;
        const bufferHeight = p.height || 1080;

        for (let i = 0; i < this.elementCount; i++) {
            this.walkers.push({
                x: p.random(bufferWidth),
                y: p.random(bufferHeight),
                color: p.color(p.random(100, 255), p.random(100, 255), p.random(100, 255), 10)
            });
        }
        this.needsClear = true;
    }

    draw() {
        const p = this.p;

        if (this.needsClear && !this.showBackground) {
            p.background(17, 17, 17);
            this.needsClear = false;
        }

        p.noStroke();
        for (const walker of this.walkers) {
            p.fill(walker.color);
            p.ellipse(walker.x, walker.y, this.brushSize, this.brushSize);

            walker.x += p.random(-this.stepSize, this.stepSize);
            walker.y += p.random(-this.stepSize, this.stepSize);

            walker.x = p.constrain(walker.x, 0, p.width);
            walker.y = p.constrain(walker.y, 0, p.height);
        }
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            elements: document.getElementById('gc-elements'),
            brushSize: document.getElementById('gc-brush-size'),
            stepSize: document.getElementById('gc-step-size'),
            regenerateBtn: document.getElementById('gc-regenerate-btn')
        };

        const updateLive = () => {
            this.brushSize = parseInt(inputs.brushSize?.value || 10, 10);
            this.stepSize = parseFloat(inputs.stepSize?.value || 2.0);
        };

        const updateAndRegenerate = () => {
            this.elementCount = parseInt(inputs.elements?.value || 100, 10);
            this.regenerate();
        };

        // Initial update
        updateLive();

        // Bind events
        if (inputs.brushSize) inputs.brushSize.addEventListener('input', updateLive);
        if (inputs.stepSize) inputs.stepSize.addEventListener('input', updateLive);
        if (inputs.elements) inputs.elements.addEventListener('input', updateAndRegenerate);
        inputs.regenerateBtn?.addEventListener('click', updateAndRegenerate);
    }
}
