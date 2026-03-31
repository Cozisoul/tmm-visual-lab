import { ToolBase } from '../../core/tool-base.js';

export class ParticleEngine extends ToolBase {
    constructor(p) {
        super(p);
        this.particles = [];
        this.rate = 5;
        this.lifespan = 100;
        this.size = 5;
        this.bounce = false;
        this.emitFromMouse = false;
        this.useNoise = false;
        this.color = '#FFF8E7';
        this.gravity = 0;

        // Mouse tracking
        this.mouseX = 0;
        this.mouseY = 0;
    }

    setup() {
        const p = this.p;
        this.mouseX = p.width / 2;
        this.mouseY = p.height / 2;
    }

    cleanup() {
        this.particles = [];
    }

    regenerate() {
        this.particles = [];
    }

    draw() {
        const p = this.p;

        // Low alpha background for trail effect
        p.background(17, 17, 17, 25);
        p.noStroke();

        const canvasWidth = p.width;
        const canvasHeight = p.height;

        // Update mouse position (will be set by controller/renderer)
        this.mouseX = p.mouseX;
        this.mouseY = p.mouseY;

        // Add new particles
        for (let i = 0; i < this.rate; i++) {
            const emitX = this.emitFromMouse ? this.mouseX : canvasWidth / 2;
            const emitY = this.emitFromMouse ? this.mouseY : canvasHeight / 2;

            let vx = p.random(-2, 2);
            let vy = p.random(-2, 2);
            if (this.useNoise) {
                const angle = p.noise(p.frameCount * 0.01, i * 0.1) * p.TWO_PI * 4;
                vx = p.cos(angle) * 2;
                vy = p.sin(angle) * 2;
            }
            this.particles.push({
                x: emitX,
                y: emitY,
                vx: vx,
                vy: vy,
                life: this.lifespan
            });
        }

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let particle = this.particles[i];
            particle.vy += this.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 1;

            const alpha = p.map(particle.life, 0, this.lifespan, 0, 255);
            const baseColor = p.color(this.color);
            p.fill(p.red(baseColor), p.green(baseColor), p.blue(baseColor), alpha);
            p.ellipse(particle.x, particle.y, this.size, this.size);

            if (this.bounce) {
                if (particle.x <= 0 || particle.x >= canvasWidth) {
                    particle.vx *= -1;
                }
                if (particle.y <= 0 || particle.y >= canvasHeight) {
                    particle.vy *= -1;
                }
            }

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    bindControls() {
        const inputs = {
            rate: document.getElementById('pe-rate'),
            lifespan: document.getElementById('pe-lifespan'),
            size: document.getElementById('pe-size'),
            color: document.getElementById('pe-color'),
            gravity: document.getElementById('pe-gravity'),
            bounce: document.getElementById('pe-bounce'),
            emitFromMouse: document.getElementById('pe-emit-from-mouse'),
            useNoise: document.getElementById('pe-noise-field')
        };

        const update = () => {
            this.rate = parseInt(inputs.rate?.value || 5, 10);
            this.lifespan = parseInt(inputs.lifespan?.value || 100, 10);
            this.size = parseInt(inputs.size?.value || 5, 10);
            this.color = inputs.color?.value || '#FFF8E7';
            this.gravity = parseFloat(inputs.gravity?.value || 0);
            this.bounce = inputs.bounce?.checked || false;
            this.emitFromMouse = inputs.emitFromMouse?.checked || false;
            this.useNoise = inputs.useNoise?.checked || false;
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
