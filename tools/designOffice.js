/**
 * @class DesignOffice
 * @description A virtual office dashboard for designers.
 * Displays date, a to-do list, and inspirational quotes.
 */
class DesignOffice {
  constructor() {
    console.log("Design Office loaded.");
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
    this.quote = random(this.quotes);
  }

  draw(buffer) {
    buffer.background(240, 240, 240);
    const margin = 40;
    let y = margin;

    // Header
    buffer.fill(17, 17, 17);
    buffer.textFont('Helvetica, Arial, sans-serif');
    buffer.textSize(36);
    buffer.textAlign(LEFT, TOP);
    buffer.text("My Design Office", margin, y);
    y += 50;

    // Date
    buffer.textSize(18);
    buffer.text(this.date.toDateString(), margin, y);
    y += 50;

    // To-Do List
    buffer.textSize(24);
    buffer.text("To-Do List", margin, y);
    y += 30;
    buffer.textSize(16);
    buffer.textFont('monospace');
    for (const todo of this.todos) {
      const prefix = todo.done ? "[x] " : "[ ] ";
      buffer.fill(todo.done ? 150 : 0);
      buffer.text(prefix + todo.text, margin, y);
      y += 25;
    }
    y += 50;

    // Inspirational Quote
    buffer.textFont('Georgia, serif');
    buffer.fill(0);
    buffer.textSize(20);
    buffer.textAlign(CENTER, CENTER);
    buffer.text(`"${this.quote}"`, buffer.width / 2, y + 50, buffer.width - margin * 2, 100);
  }
}

window.DesignOffice = DesignOffice;
