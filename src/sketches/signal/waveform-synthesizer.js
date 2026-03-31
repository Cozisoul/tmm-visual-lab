import { ToolBase } from '../../core/tool-base.js';

export class WaveformSynthesizer extends ToolBase {
    constructor(p) {
        super(p);
        this.amp = 100;
        this.freq = 4;
        this.mode = 'line';
        this.waveform = 'sine';
        this.timeSpeed = 0.05;
        this.phase = 0;
        this.lineCount = 1;
        this.color = '#FFF8E7';
        this.noiseAmount = 0;
        this.lineWeight = 3;
        this.pulse = 1.0;

        // New properties for the isometric container
        this.containerShape = 'box';
        this.containerSize = 200;
        this.waveDetail = 20;
        this.rotationX = -0.5;
        this.rotationY = -0.5;
        this.rotationZ = 0;

        // Audio reactivity state
        this.isAudioReactive = false;
        this.audioLevel = 0;
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        this.phase = 0;
        this.pulse = 1.0;
    }

    draw() {
        const p = this.p;
        const canvasWidth = p.width;
        const canvasHeight = p.height;

        if (!this.showBackground) { // Assuming showBackground is handled by ToolBase or default
            p.background(17, 17, 17);
        }

        if (this.isAudioReactive) {
            this.pulse = 1.0 + this.audioLevel * 5.0;
        }
        this.pulse = p.lerp(this.pulse, 1.0, 0.15);

        const currentAmp = this.amp * this.pulse;

        if (this.mode === 'field') {
            this.drawIsometricField(currentAmp);
        } else if (this.mode === 'isometric-line') {
            this.drawIsometricLine(currentAmp);
        } else if (this.mode === 'plan-view') {
            this.drawPlanView(currentAmp);
        } else if (this.mode === 'isometric-container') {
            this.drawIsometricContainer(currentAmp);
        } else { // 'line' mode
            p.push();
            p.translate(0, 0); // Center in WEBGL
            const baseColor = p.color(this.color);
            p.stroke(p.red(baseColor), p.green(baseColor), p.blue(baseColor), 255);
            p.noFill();
            p.strokeWeight(this.lineWeight);

            const totalLineHeight = canvasHeight * 0.6;
            const startY = -totalLineHeight / 2;
            const lineSpacing = this.lineCount > 1 ? totalLineHeight / (this.lineCount - 1) : 0;

            for (let line = 0; line < this.lineCount; line++) {
                const yBase = this.lineCount === 1 ? 0 : startY + line * lineSpacing;

                p.beginShape();
                for (let x = -canvasWidth / 2; x < canvasWidth / 2; x += 2) {
                    const angle = p.map(x, -canvasWidth / 2, canvasWidth / 2, 0, p.TWO_PI * this.freq) + p.radians(this.phase);
                    let yOffset = 0;
                    const t = p.frameCount * this.timeSpeed + line * 0.5;
                    const noiseVal = p.noise(x * 0.01, t) * 2 - 1;
                    const noiseEffect = noiseVal * this.noiseAmount;

                    if (this.waveform === 'sine') yOffset = p.sin(angle + t) * currentAmp;
                    else if (this.waveform === 'square') yOffset = (p.sin(angle + t) > 0 ? 1 : -1) * currentAmp;
                    else if (this.waveform === 'sawtooth') yOffset = (((angle + t) % p.TWO_PI) / p.PI - 1) * currentAmp;
                    else if (this.waveform === 'triangle') yOffset = (p.abs(((angle + t) % p.TWO_PI) - p.PI) / p.PI * 2 - 1) * -currentAmp;

                    const y = yBase + yOffset + noiseEffect;
                    p.vertex(x, y);
                }
                p.endShape();
            }
            p.pop();
        }
    }

    drawIsometricField(currentAmp) {
        const p = this.p;
        p.stroke(this.color);
        p.noFill();
        p.strokeWeight(this.lineWeight);
        p.push();
        p.translate(0, 0);

        const numLines = p.max(4, this.freq * 2);
        const gridSpan = p.min(p.width, p.height) * 0.6;
        const lineSpacing = gridSpan / numLines;

        const t = p.frameCount * this.timeSpeed;
        const angles = [p.radians(30), p.radians(150)];

        for (const baseAngle of angles) {
            const cosBase = p.cos(baseAngle);
            const sinBase = p.sin(baseAngle);
            const perpAngle = baseAngle + p.HALF_PI;
            const cosPerp = p.cos(perpAngle);
            const sinPerp = p.sin(perpAngle);

            for (let i = 0; i <= numLines; i++) {
                const offset = (i - numLines / 2) * lineSpacing;
                const startX = offset * cosPerp;
                const startY = offset * sinPerp;

                p.beginShape();
                for (let pt = -gridSpan / 2; pt <= gridSpan / 2; pt += 5) {
                    const baseX = startX + pt * cosBase;
                    const baseY = startY + pt * sinBase;

                    const waveAngle = p.map(pt, -gridSpan / 2, gridSpan / 2, 0, p.TWO_PI * this.freq) + p.radians(this.phase);
                    let waveOffset = 0;
                    const timeAndLineOffset = t + i * 0.3;

                    if (this.waveform === 'sine') waveOffset = p.sin(waveAngle + timeAndLineOffset) * currentAmp;
                    else if (this.waveform === 'square') waveOffset = (p.sin(waveAngle + timeAndLineOffset) > 0 ? 1 : -1) * currentAmp;
                    else if (this.waveform === 'sawtooth') waveOffset = (((waveAngle + timeAndLineOffset) % p.TWO_PI) / p.PI - 1) * currentAmp;
                    else if (this.waveform === 'triangle') waveOffset = (p.abs(((waveAngle + timeAndLineOffset) % p.TWO_PI) - p.PI) / p.PI * 2 - 1) * -currentAmp;

                    const noiseVal = p.noise(baseX * 0.01, baseY * 0.01, t) * 2 - 1;
                    const noiseEffect = noiseVal * this.noiseAmount;

                    p.vertex(baseX + (waveOffset + noiseEffect) * cosPerp, baseY + (waveOffset + noiseEffect) * sinPerp);
                }
                p.endShape();
            }
        }
        p.pop();
    }

    drawIsometricLine(currentAmp) {
        const p = this.p;
        const baseColor = p.color(this.color);
        p.stroke(p.red(baseColor), p.green(baseColor), p.blue(baseColor), 255);
        p.noFill();
        p.strokeWeight(this.lineWeight);
        p.push();
        p.translate(0, 0);

        this._drawIsometricFloorGrid();

        const totalLineHeight = p.height * 0.5;
        const lineSpacing = this.lineCount > 1 ? totalLineHeight / (this.lineCount - 1) : 0;
        const isoAngle = p.radians(30);
        const cosAngle = p.cos(isoAngle);
        const sinAngle = p.sin(isoAngle);

        for (let line = 0; line < this.lineCount; line++) {
            const yBase = this.lineCount === 1 ? p.height / 2 : line * lineSpacing;

            p.beginShape();
            for (let x = -p.width / 2; x < p.width / 2; x += 5) {
                const waveAngle = p.map(x, -p.width / 2, p.width / 2, 0, p.TWO_PI * this.freq) + p.radians(this.phase);
                let yOffset = 0;
                const t = p.frameCount * this.timeSpeed + line * 0.5;
                const noiseVal = p.noise(x * 0.01, t) * 2 - 1;
                const noiseEffect = noiseVal * this.noiseAmount;

                if (this.waveform === 'sine') yOffset = p.sin(waveAngle + t) * currentAmp;
                else if (this.waveform === 'square') yOffset = (p.sin(waveAngle + t) > 0 ? 1 : -1) * currentAmp;
                else if (this.waveform === 'sawtooth') yOffset = (((waveAngle + t) % p.TWO_PI) / p.PI - 1) * currentAmp;
                else if (this.waveform === 'triangle') yOffset = (p.abs(((waveAngle + t) % p.TWO_PI) - p.PI) / p.PI * 2 - 1) * -currentAmp;

                const finalY = yBase + yOffset + noiseEffect;
                const isoX_base = (x - yBase) * cosAngle;
                const isoY_base = (x + yBase) * sinAngle;
                const finalY_offset = yOffset + noiseEffect;
                p.vertex(isoX_base, isoY_base - finalY_offset);
            }
            p.endShape();
        }
        p.pop();
    }

    _drawIsometricFloorGrid() {
        const p = this.p;
        p.push();
        p.strokeWeight(1);
        const baseColor = p.color(this.color);
        p.stroke(p.red(baseColor), p.green(baseColor), p.blue(baseColor), 50);

        const gridSize = p.width * 1.5;
        const numLines = 20;
        const lineSpacing = gridSize / numLines;
        const isoAngle = p.radians(30);
        const cosAngle = p.cos(isoAngle);
        const sinAngle = p.sin(isoAngle);

        p.translate(0, p.height / 4);

        for (let i = -numLines / 2; i <= numLines / 2; i++) {
            const offset = i * lineSpacing;
            let x1 = (offset - (-gridSize / 2)) * cosAngle;
            let y1 = (offset + (-gridSize / 2)) * sinAngle;
            let x2 = (offset - (gridSize / 2)) * cosAngle;
            let y2 = (offset + (gridSize / 2)) * sinAngle;
            p.line(x1, y1, x2, y2);

            x1 = ((-gridSize / 2) - offset) * cosAngle;
            y1 = ((-gridSize / 2) + offset) * sinAngle;
            x2 = ((gridSize / 2) - offset) * cosAngle;
            y2 = ((gridSize / 2) + offset) * sinAngle;
            p.line(x1, y1, x2, y2);
        }
        p.pop();
    }

    drawPlanView(currentAmp) {
        const p = this.p;
        const baseColor = p.color(this.color);
        p.stroke(p.red(baseColor), p.green(baseColor), p.blue(baseColor), 255);
        p.noFill();
        p.strokeWeight(this.lineWeight);
        p.push();
        p.translate(0, 0);

        const totalLineHeight = p.height * 0.6;
        const lineSpacing = this.lineCount > 1 ? totalLineHeight / (this.lineCount - 1) : 0;

        for (let line = 0; line < this.lineCount; line++) {
            const yBase = this.lineCount === 1 ? 0 : p.map(line, 0, this.lineCount - 1, -totalLineHeight / 2, totalLineHeight / 2);

            p.beginShape();
            for (let x = -p.width / 2; x < p.width / 2; x += 5) {
                const waveAngle = p.map(x, -p.width / 2, p.width / 2, 0, p.TWO_PI * this.freq) + p.radians(this.phase);
                let yOffset = 0;
                const t = p.frameCount * this.timeSpeed + line * 0.5;
                const noiseVal = p.noise(x * 0.01, t) * 2 - 1;
                const noiseEffect = noiseVal * this.noiseAmount;

                if (this.waveform === 'sine') yOffset = p.sin(waveAngle + t) * currentAmp;
                else if (this.waveform === 'square') yOffset = (p.sin(waveAngle + t) > 0 ? 1 : -1) * currentAmp;
                else if (this.waveform === 'sawtooth') yOffset = (((waveAngle + t) % p.TWO_PI) / p.PI - 1) * currentAmp;
                else if (this.waveform === 'triangle') yOffset = (p.abs(((waveAngle + t) % p.TWO_PI) - p.PI) / p.PI * 2 - 1) * -currentAmp;

                const finalY = yBase + yOffset + noiseEffect;
                p.vertex(x, finalY);
            }
            p.endShape();
        }
        p.pop();
    }

    drawIsometricContainer(currentAmp) {
        const p = this.p;
        p.push();
        p.translate(0, 0);
        p.rotateX(this.rotationX);
        p.rotateY(this.rotationY);
        p.rotateZ(this.rotationZ);

        p.noFill();
        p.stroke(this.color);
        p.strokeWeight(this.lineWeight);

        if (this.containerShape === 'box') {
            p.box(this.containerSize);
        } else if (this.containerShape === 'cylinder') {
            p.cylinder(this.containerSize / 2, this.containerSize);
        }

        p.push();
        p.translate(0, 0, -this.containerSize / 2);

        const t = p.frameCount * this.timeSpeed;
        const halfSize = this.containerSize / 2;
        const detail = this.waveDetail;
        const step = this.containerSize / detail;

        p.translate(0, 0, this.containerSize / 4);

        for (let y = 0; y < detail; y++) {
            p.beginShape(p.TRIANGLE_STRIP);
            for (let x = 0; x <= detail; x++) {
                for (let i = 0; i < 2; i++) {
                    const u = x + i;
                    const v = y + (i === 0 ? 0 : 1);
                    const xPos = -halfSize + u * step;
                    const yPos = -halfSize + v * step;

                    const d = p.dist(xPos, yPos, 0, 0);
                    const waveAngle = d * this.freq * 0.1 + t;

                    let zOffset = 0;
                    if (this.waveform === 'sine') {
                        zOffset = p.sin(waveAngle) * currentAmp;
                    } else if (this.waveform === 'square') {
                        zOffset = (p.sin(waveAngle) > 0 ? 1 : -1) * currentAmp;
                    } else if (this.waveform === 'sawtooth') {
                        zOffset = (((waveAngle) % p.TWO_PI) / p.PI - 1) * currentAmp;
                    } else if (this.waveform === 'triangle') {
                        zOffset = (p.abs(((waveAngle) % p.TWO_PI) - p.PI) / p.PI * 2 - 1) * -currentAmp;
                    }

                    const noiseVal = p.noise(xPos * 0.05, yPos * 0.05, t) * 2 - 1;
                    const noiseEffect = noiseVal * this.noiseAmount;

                    let z = zOffset + noiseEffect;

                    if (this.containerShape === 'cylinder') {
                        if (d > halfSize) {
                            z = 0;
                        }
                    }

                    p.vertex(xPos, yPos, z);
                }
            }
            p.endShape();
        }

        p.pop();
        p.pop();
    }

    bindControls() {
        const inputs = {
            mode: document.getElementById('ws-mode'),
            waveform: document.getElementById('ws-waveform'),
            amp: document.getElementById('ws-amp'),
            freq: document.getElementById('ws-freq'),
            lineCount: document.getElementById('ws-line-count'),
            color: document.getElementById('ws-color'),
            noiseAmount: document.getElementById('ws-noise'),
            lineWeight: document.getElementById('ws-line-weight'),
            timeSpeed: document.getElementById('ws-time-speed'),
            containerShape: document.getElementById('ws-container-shape'),
            containerSize: document.getElementById('ws-container-size'),
            waveDetail: document.getElementById('ws-wave-detail'),
            rotationX: document.getElementById('ws-rotation-x'),
            rotationY: document.getElementById('ws-rotation-y'),
            rotationZ: document.getElementById('ws-rotation-z'),
            containerControls: document.getElementById('ws-container-controls')
        };

        const update = () => {
            this.mode = inputs.mode?.value || 'line';
            this.waveform = inputs.waveform?.value || 'sine';
            this.amp = parseInt(inputs.amp?.value || 100, 10);
            this.freq = parseInt(inputs.freq?.value || 4, 10);
            this.lineCount = parseInt(inputs.lineCount?.value || 1, 10);
            this.color = inputs.color?.value || '#FFF8E7';
            this.noiseAmount = parseInt(inputs.noiseAmount?.value || 0, 10);
            this.lineWeight = parseFloat(inputs.lineWeight?.value || 3);
            this.timeSpeed = parseFloat(inputs.timeSpeed?.value || 0.05);
            this.containerShape = inputs.containerShape?.value || 'box';
            this.containerSize = parseInt(inputs.containerSize?.value || 200, 10);
            this.waveDetail = parseInt(inputs.waveDetail?.value || 20, 10);
            this.rotationX = parseFloat(inputs.rotationX?.value || -0.5);
            this.rotationY = parseFloat(inputs.rotationY?.value || -0.5);
            this.rotationZ = parseFloat(inputs.rotationZ?.value || 0);

            if (inputs.containerControls) {
                inputs.containerControls.style.display = this.mode === 'isometric-container' ? 'block' : 'none';
            }
        };

        // Initial update
        update();

        // Bind events
        Object.values(inputs).forEach(input => {
            if (input && input.id !== 'ws-container-controls') {
                const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
                input.addEventListener(eventType, update);
            }
        });
    }
}
