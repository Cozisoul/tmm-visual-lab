import p5 from 'p5';

export class Renderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.sketch = null;
        this.p5Instance = null;
        this.container = document.getElementById(containerId);
    }

    init(sketchClass) {
        if (this.p5Instance) {
            this.p5Instance.remove();
        }

        const sketchWrapper = (p) => {
            // Store the p5 instance on the sketch for easy access
            this.sketch = new sketchClass(p);

            p.setup = () => {
                const { width, height } = this.getContainerDimensions();
                p.createCanvas(width, height);
                if (this.sketch.setup) this.sketch.setup();
            };

            p.draw = () => {
                if (this.sketch.draw) this.sketch.draw();
            };

            p.windowResized = () => {
                const { width, height } = this.getContainerDimensions();
                p.resizeCanvas(width, height);
                if (this.sketch.windowResized) this.sketch.windowResized();
            };
        };

        this.p5Instance = new p5(sketchWrapper, this.containerId);
    }

    getContainerDimensions() {
        return {
            width: this.container.offsetWidth,
            height: this.container.offsetHeight
        };
    }
}
