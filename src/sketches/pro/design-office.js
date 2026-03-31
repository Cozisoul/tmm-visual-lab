import { ToolBase } from '../../core/tool-base.js';

export class DesignOffice extends ToolBase {
    constructor(p) {
        super(p);
        this.date = new Date();
        this.todos = [
            { text: "Sketch new logo ideas", done: false },
            { text: "Prepare presentation for client", done: true },
            { text: "Update portfolio with new work", done: false },
        ];
        this.quotes = [
            "Design is not just what it looks like and feels like. Design is how it works.",
            "The details are not the details. They make the design.",
            "Good design is obvious. Great design is transparent.",
            "Creativity is intelligence having fun.",
        ];
        this.quote = null;
    }

    setup() {
        this.quote = this.p.random(this.quotes);
    }

    draw() {
        const p = this.p;
        p.background(240, 240, 240);
        const margin = 40;
        let y = margin;

        // Header
        p.fill(17, 17, 17);
        p.textFont('Helvetica, Arial, sans-serif');
        p.textSize(36);
        p.textAlign(p.LEFT, p.TOP);
        p.text("My Design Office", margin, y);
        y += 50;

        // Date
        p.textSize(18);
        p.text(this.date.toDateString(), margin, y);
        y += 50;

        // To-Do List
        p.textSize(24);
        p.text("To-Do List", margin, y);
        y += 30;
        p.textSize(16);
        p.textFont('monospace');
        for (const todo of this.todos) {
            const prefix = todo.done ? "[x] " : "[ ] ";
            p.fill(todo.done ? 150 : 0);
            p.text(prefix + todo.text, margin, y);
            y += 25;
        }
        y += 50;

        // Inspirational Quote
        p.textFont('Georgia, serif');
        p.fill(0);
        p.textSize(20);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`"${this.quote}"`, p.width / 2, y + 50, p.width - margin * 2, 100);
    }

    bindControls() {
        const inputs = {
            generateBtn: document.getElementById('do-generate')
        };

        inputs.generateBtn?.addEventListener('click', () => {
            this.quote = this.p.random(this.quotes);
        });
    }
}
