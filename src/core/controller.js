export class Controller {
    constructor() {
        this.sketches = {};
        this.activeSketch = null;
        this.renderer = null;
    }

    init(sketches, renderer) {
        this.sketches = sketches;
        this.renderer = renderer;
        this.setupNavigation();

        // Load default sketch if available
        const firstSketchKey = Object.keys(sketches)[0];
        if (firstSketchKey) {
            this.loadSketch(firstSketchKey);
        }
    }

    setupNavigation() {
        const buttons = document.querySelectorAll('.tutorial-item');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                buttons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked
                const target = e.currentTarget; // Use currentTarget to get the button, not span
                target.classList.add('active');

                const toolName = target.dataset.tool;
                this.loadSketch(toolName);
            });
        });
    }

    loadSketch(toolName) {
        console.log(`Loading sketch: ${toolName}`);

        // Hide all tool controls
        document.querySelectorAll('.tool-controls').forEach(el => {
            el.classList.remove('active');
        });

        // Show controls for this tool
        const controlsId = `${toolName}-controls`;
        const controlsEl = document.getElementById(controlsId);
        if (controlsEl) {
            controlsEl.classList.add('active');
        }

        // Update footer
        const footer = document.getElementById('toolkit-footer');
        if (footer) {
            footer.textContent = `TOOL: ${toolName}`;
        }

        // Initialize the sketch via renderer
        const SketchClass = this.sketches[toolName];
        if (SketchClass) {
            this.renderer.init(SketchClass);
            // Bind controls if the sketch supports it
            if (this.renderer.sketch && typeof this.renderer.sketch.bindControls === 'function') {
                this.renderer.sketch.bindControls();
            }
        } else {
            console.warn(`Sketch class not found for: ${toolName}`);
        }
    }
}
