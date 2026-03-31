import { ToolBase } from '../../core/tool-base.js';

export class VectorFieldModulator extends ToolBase {
    constructor(p) {
        super(p);
        this.resolution = 20;
        this.field = [];
        this.noiseScale = 0.1;
        this.time = 0;
        this.timeSpeed = 0.01;

        // UI properties
        this.fieldType = 'flow';
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        const p = this.p;
        this.field = [];
        // Use p.width/height if available, otherwise default
        const bufferWidth = p.width || 1080;
        const bufferHeight = p.height || 1080;

        for (let x = 0; x < bufferWidth; x += this.resolution) {
            for (let y = 0; y < bufferHeight; y += this.resolution) {
                this.field.push({
                    x: x,
                    y: y,
                    vec: p.createVector(0, 0),
                });
            }
        }
    }

    updateField() {
        const p = this.p;
        for (const point of this.field) {
            let angle = 0;
            if (this.fieldType === 'flow' || this.fieldType === 'turbulence') {
                // Basic noise flow
                angle = p.noise(point.x * this.noiseScale, point.y * this.noiseScale, this.time) * p.TWO_PI * 2;
            } else if (this.fieldType === 'attraction') {
                // Simple attraction to center
                angle = p.atan2(p.height / 2 - point.y, p.width / 2 - point.x);
            }

            point.vec.set(p.cos(angle), p.sin(angle));
        }
        this.time += this.timeSpeed;
    }

    draw() {
        const p = this.p;
        this.updateField();

        if (!this.showBackground) {
            p.background(17, 17, 17);
        }

        p.stroke(255);
        p.strokeWeight(1);

        for (const point of this.field) {
            p.push();
            p.translate(point.x + this.resolution / 2, point.y + this.resolution / 2);
            p.rotate(point.vec.heading());
            p.line(-this.resolution / 2, 0, this.resolution / 2, 0);
            p.pop();
        }
    }

    windowResized() {
        this.regenerate();
    }

    bindControls() {
        const inputs = {
            fieldType: document.getElementById('vfm-field-type'),
            regenerateBtn: document.getElementById('vfm-regenerate')
        };

        const update = () => {
            this.fieldType = inputs.fieldType?.value || 'flow';
            // Trigger regeneration if needed when type changes? 
            // The updateField() is called every frame, so it might just update automatically.
        };

        // Initial update
        update();

        // Bind events
        if (inputs.fieldType) {
            inputs.fieldType.addEventListener('change', update);
        }

        inputs.regenerateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
