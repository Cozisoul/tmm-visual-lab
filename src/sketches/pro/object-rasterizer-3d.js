import { ToolBase } from '../../core/tool-base.js';

/**
 * ObjectRasterizer3D - Simplified Version
 * Uses 2D transformations to simulate 3D effects
 * Full WEBGL version can be added later
 */
export class ObjectRasterizer3D extends ToolBase {
    constructor(p) {
        super(p);
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.autoRotate = true;
        this.shape = 'text';
        this.text = 'TMM';
        this.color = '#FFF8E7';
        this.gridEnabled = false;
    }

    setup() {
        const p = this.p;
        p.textAlign(p.CENTER, p.CENTER);
    }

    draw() {
        const p = this.p;
        p.background(17, 17, 17);

        // Simple auto-rotation
        if (this.autoRotate) {
            this.rotationY += 0.01;
        }

        p.push();
        p.translate(p.width / 2, p.height / 2);

        // Simulate 3D rotation with 2D transformations
        p.rotate(this.rotationZ);
        p.scale(p.cos(this.rotationY), 1);

        p.fill(this.color);
        p.noStroke();

        if (this.shape === 'text') {
            p.textSize(120);
            p.text(this.text, 0, 0);
        } else if (this.shape === 'box') {
            const size = 200;
            p.rectMode(p.CENTER);
            p.rect(0, 0, size, size);
        } else if (this.shape === 'sphere') {
            const size = 200;
            p.ellipse(0, 0, size, size);
        }

        p.pop();

        // Optional grid
        if (this.gridEnabled) {
            p.stroke(255, 20);
            p.strokeWeight(1);
            const step = 50;
            for (let x = 0; x < p.width; x += step) {
                p.line(x, 0, x, p.height);
            }
            for (let y = 0; y < p.height; y += step) {
                p.line(0, y, p.width, y);
            }
        }
    }

    bindControls() {
        const inputs = {
            shape: document.getElementById('or-shape'),
            text: document.getElementById('or-text'),
            color: document.getElementById('or-color'),
            rotationX: document.getElementById('or-rotation-x'),
            rotationY: document.getElementById('or-rotation-y'),
            rotationZ: document.getElementById('or-rotation-z'),
            autoRotate: document.getElementById('or-auto-rotate'),
            grid: document.getElementById('or-grid')
        };

        const update = () => {
            this.shape = inputs.shape?.value || 'text';
            this.text = inputs.text?.value || 'TMM';
            this.color = inputs.color?.value || '#FFF8E7';
            this.rotationX = parseFloat(inputs.rotationX?.value || 0);
            this.rotationY = parseFloat(inputs.rotationY?.value || 0);
            this.rotationZ = parseFloat(inputs.rotationZ?.value || 0) * (Math.PI / 180);
            this.autoRotate = inputs.autoRotate?.checked !== false;
            this.gridEnabled = inputs.grid?.checked || false;

            // Show/hide text settings
            const textSettings = document.querySelectorAll('.text-settings');
            textSettings.forEach(el => {
                el.style.display = this.shape === 'text' ? 'block' : 'none';
            });
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input) {
                const eventType = input.type === 'checkbox' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });
    }
}
