import { ToolBase } from '../../core/tool-base.js';

export class IdeaGenerator extends ToolBase {
    constructor(p) {
        super(p);
        this.categories = {
            Project: ["Poster", "Logo", "Album Cover", "Book Cover", "Website Homepage"],
            Theme: ["Futurism", "Minimalism", "Bauhaus", "Psychedelic", "Art Deco"],
            Constraint: ["Use only two colors", "Use only circles", "Use a 3x3 grid", "No text allowed"],
        };
        this.idea = this.generateIdea();
    }

    setup() {
        // No specific setup needed
    }

    generateIdea() {
        const p = this.p;
        const project = p.random(this.categories.Project);
        const theme = p.random(this.categories.Theme);
        const constraint = p.random(this.categories.Constraint);
        return { project, theme, constraint };
    }

    regenerate() {
        this.idea = this.generateIdea();
    }

    draw() {
        const p = this.p;
        const canvasWidth = p.width;
        const canvasHeight = p.height;

        p.background(250, 240, 230);
        p.fill(17, 17, 17);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Helvetica, Arial, sans-serif');
        const y = canvasHeight / 2;

        p.textSize(24);
        p.text("Your creative prompt is:", canvasWidth / 2, y - 100);

        p.textSize(36);
        p.textStyle(p.BOLD);
        p.text(this.idea.project, canvasWidth / 2, y - 40);

        p.textSize(24);
        p.textStyle(p.NORMAL);
        p.text(`in the style of ${this.idea.theme}`, canvasWidth / 2, y + 20);

        p.textSize(18);
        p.textStyle(p.ITALIC);
        p.text(`with the constraint: "${this.idea.constraint}"`, canvasWidth / 2, y + 70);
    }

    bindControls() {
        const inputs = {
            generateBtn: document.getElementById('ig-generate')
        };

        inputs.generateBtn?.addEventListener('click', () => {
            this.regenerate();
        });
    }
}
