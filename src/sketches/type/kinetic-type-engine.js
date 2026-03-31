import { ToolBase } from '../../core/tool-base.js';

export class KineticTypeEngine extends ToolBase {
    constructor(p) {
        super(p);
        this.x = -200;
        this.text = "KINETIC TYPE ENGINE";
        this.speed = 2;
        this.prevText = "";
        this.fontSize = 64;
        this.repetitions = 1;
        this.lineCount = 1;
        this.isUppercase = true;
        this.algorithm = 'ticker';
        this.amplitude = 50;
        this.tracking = 0;
        this.color = '#FFF8E7';
        this.pulse = 1.0;

        // Audio reactivity state
        this.isAudioReactive = false;
        this.audioLevel = 0;
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        this.x = -200;
        this.prevText = "";
        this.pulse = 1.0;
    }

    draw() {
        const p = this.p;

        // Audio Reactivity
        if (this.isAudioReactive && this.audioLevel > 0.02) {
            this.pulse = 1.0 + this.audioLevel * 2.5;
        }
        this.pulse = p.lerp(this.pulse, 1.0, 0.1);

        const currentSpeed = this.speed * this.pulse;
        const currentAmplitude = this.amplitude * this.pulse;

        const canvasWidth = p.width;
        const canvasHeight = p.height;

        p.background(17, 17, 17);
        p.fill(this.color);
        p.noStroke();
        p.textFont('monospace');
        p.textSize(this.fontSize);

        const baseText = this.isUppercase ? this.text.toUpperCase() : this.text;
        const displayText = (baseText + ' ').repeat(this.repetitions).trim();

        const totalLineHeight = this.fontSize * this.lineCount;
        const startY = canvasHeight / 2 - totalLineHeight / 2 + this.fontSize / 2;

        for (let line = 0; line < this.lineCount; line++) {
            const yPosition = startY + line * this.fontSize;

            if (this.algorithm === 'ticker') {
                if (displayText !== this.prevText) {
                    this.x = -p.textWidth(displayText);
                    this.prevText = displayText;
                }
                p.textAlign(p.LEFT, p.CENTER);
                p.text(displayText, this.x, yPosition);
                this.x += currentSpeed;
                if (this.x > canvasWidth) {
                    this.x = -p.textWidth(displayText);
                }
            } else if (this.algorithm === 'wave') {
                this.prevText = "";
                p.textAlign(p.CENTER, p.CENTER);
                let totalWidth = 0;
                for (let i = 0; i < displayText.length; i++) {
                    totalWidth += p.textWidth(displayText[i]) + this.tracking;
                }
                let xPos = canvasWidth / 2 - totalWidth / 2;
                for (let i = 0; i < displayText.length; i++) {
                    const char = displayText[i];
                    const angle = p.frameCount * currentSpeed * 0.1 + i * 0.5 + line * 2;
                    const yOffset = p.sin(angle) * currentAmplitude;
                    const charWidth = p.textWidth(char);
                    p.text(char, xPos + charWidth / 2, yPosition + yOffset);
                    xPos += charWidth + this.tracking;
                }
            } else if (this.algorithm === 'wave-ticker') {
                if (displayText !== this.prevText) {
                    this.x = -p.textWidth(displayText);
                    this.prevText = displayText;
                }
                p.textAlign(p.LEFT, p.CENTER);

                let currentX = this.x;
                for (let i = 0; i < displayText.length; i++) {
                    const char = displayText[i];
                    const angle = (p.frameCount * currentSpeed * 0.1) + i * 0.5 + line * 2;
                    const yOffset = p.sin(angle) * currentAmplitude;
                    const charWidth = p.textWidth(char);

                    p.text(char, currentX, yPosition + yOffset);
                    currentX += charWidth + this.tracking;
                }

                this.x += currentSpeed;
                if (this.x > canvasWidth) {
                    this.x = -p.textWidth(displayText);
                }
            } else if (this.algorithm === 'circle') {
                p.textAlign(p.CENTER, p.CENTER);
                const centerX = canvasWidth / 2;
                const centerY = canvasHeight / 2;
                const radius = Math.min(canvasWidth, canvasHeight) / 3;
                const startAngle = p.frameCount * currentSpeed * 0.01;

                let totalArcLength = 0;
                for (let i = 0; i < displayText.length; i++) {
                    totalArcLength += p.textWidth(displayText[i]) + this.tracking;
                }

                let currentAngle = startAngle;
                for (let i = 0; i < displayText.length; i++) {
                    const char = displayText[i];
                    const charWidth = p.textWidth(char);
                    const angleOffset = (charWidth / 2 + this.tracking / 2) / radius;
                    currentAngle += angleOffset;
                    const x = centerX + p.cos(currentAngle) * radius;
                    const y = centerY + p.sin(currentAngle) * radius;
                    p.text(char, x, y);
                    currentAngle += angleOffset;
                }
            }
        }
    }

    bindControls() {
        const inputs = {
            text: document.getElementById('kte-text'),
            repetitions: document.getElementById('kte-repetitions'),
            lineCount: document.getElementById('kte-line-count'),
            fontSize: document.getElementById('kte-font-size'),
            uppercase: document.getElementById('kte-uppercase'),
            algorithm: document.getElementById('kte-algorithm'),
            speed: document.getElementById('kte-speed'),
            amplitude: document.getElementById('kte-amplitude'),
            tracking: document.getElementById('kte-tracking'),
            color: document.getElementById('kte-color')
        };

        const update = () => {
            this.text = inputs.text?.value || 'KINETIC TYPE ENGINE';
            this.repetitions = parseInt(inputs.repetitions?.value || 1, 10);
            this.lineCount = parseInt(inputs.lineCount?.value || 1, 10);
            this.fontSize = parseInt(inputs.fontSize?.value || 64, 10);
            this.isUppercase = inputs.uppercase?.checked !== false;
            this.algorithm = inputs.algorithm?.value || 'ticker';
            this.speed = parseFloat(inputs.speed?.value || 2.0);
            this.amplitude = parseInt(inputs.amplitude?.value || 50, 10);
            this.tracking = parseInt(inputs.tracking?.value || 0, 10);
            this.color = inputs.color?.value || '#FFF8E7';
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
