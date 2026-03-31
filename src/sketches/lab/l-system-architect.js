import { ToolBase } from '../../core/tool-base.js';

export class LSystemArchitect extends ToolBase {
    constructor(p) {
        super(p);
        this.rules = {
            F: "FF+[+F-F-F]-[-F+F+F]",
        };
        this.axiom = "F";
        this.angle = 25;
        this.iterations = 3;
        this.length = 10;
        this.sentence = this.axiom;
    }

    setup() {
        this.regenerate();
    }

    regenerate() {
        this.sentence = this.axiom;
        for (let i = 0; i < this.iterations; i++) {
            let nextSentence = "";
            for (let j = 0; j < this.sentence.length; j++) {
                const current = this.sentence.charAt(j);
                nextSentence += this.rules[current] || current;
            }
            this.sentence = nextSentence;
        }
    }

    draw() {
        const p = this.p;
        p.background(17, 17, 17);
        p.stroke(255);
        p.strokeWeight(2);
        p.push();
        p.translate(p.width / 2, p.height);

        for (let i = 0; i < this.sentence.length; i++) {
            const current = this.sentence.charAt(i);
            if (current === "F") {
                p.line(0, 0, 0, -this.length);
                p.translate(0, -this.length);
            } else if (current === "+") {
                p.rotate(p.radians(this.angle));
            } else if (current === "-") {
                p.rotate(p.radians(-this.angle));
            } else if (current === "[") {
                p.push();
            } else if (current === "]") {
                p.pop();
            }
        }
        p.pop();
    }

    bindControls() {
        const inputs = {
            generateBtn: document.getElementById('lsa-generate')
        };

        inputs.generateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
