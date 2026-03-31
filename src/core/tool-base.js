export class ToolBase {
    constructor(p) {
        this.p = p;
    }

    setup() {
        // Default setup
    }

    draw() {
        // Default draw
        this.p.background(17, 17, 17);
        this.p.fill(255);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(`${this.constructor.name} - draw() not implemented`, this.p.width / 2, this.p.height / 2);
    }

    windowResized() {
        // Default resize handling
    }

    bindControls() {
        // Default binding
        console.log(`${this.constructor.name} - bindControls() not implemented`);
    }
}
