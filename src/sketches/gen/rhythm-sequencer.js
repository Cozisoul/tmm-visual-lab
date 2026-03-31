import { ToolBase } from '../../core/tool-base.js';

/**
 * RhythmSequencer - Simplified Visual Version
 * Note: This is a visual-only version without p5.sound
 * Audio integration can be added later
 */
export class RhythmSequencer extends ToolBase {
    constructor(p) {
        super(p);
        this.bpm = 120;
        this.steps = 16;
        this.pattern = Array(4).fill(0).map(() => Array(this.steps).fill(0));
        this.currentStep = 0;
        this.lastBeatTime = 0;
        this.showVisualizer = true;
    }

    setup() {
        // No specific setup
    }

    draw() {
        const p = this.p;
        const quarterNoteDurationMs = (60 / Math.max(1, this.bpm)) * 1000;
        const stepDurationMs = quarterNoteDurationMs / 4;
        const now = p.millis();

        if (now - this.lastBeatTime > stepDurationMs) {
            this.lastBeatTime = now;
            this.currentStep = (this.currentStep + 1) % this.steps;
        }

        const canvasWidth = p.width;
        const canvasHeight = p.height;

        if (this.showVisualizer) {
            p.background(17, 17, 17);
            p.noStroke();
            const barWidth = canvasWidth / 4;
            for (let i = 0; i < 4; i++) {
                if (this.pattern[i][this.currentStep]) {
                    p.fill(255, 248, 231, 150);
                    p.rect(i * barWidth, 0, barWidth, canvasHeight);
                }
            }
        } else {
            // Visual metronome
            const beatProgress = (now % stepDurationMs) / stepDurationMs;
            const size = 50 + (1 - beatProgress) * 100;
            const alpha = 255 * (1 - beatProgress);

            p.noFill();
            p.stroke(255, 248, 231, alpha);
            p.strokeWeight(4);
            p.ellipse(canvasWidth / 2, canvasHeight / 2, size, size);
        }
    }

    bindControls() {
        const inputs = {
            showViz: document.getElementById('rs-show-viz')
        };

        const update = () => {
            this.showVisualizer = inputs.showViz?.checked || false;
        };

        // Initial update
        update();

        if (inputs.showViz) {
            inputs.showViz.addEventListener('change', update);
        }
    }
}
