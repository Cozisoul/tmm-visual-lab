/**
 * @class LibraryNotes
 * @description A tool for taking and displaying notes.
 */
class LibraryNotes {
  constructor() {
    console.log("Library Notes loaded.");
    this.notes = [
      {
        title: "Color Resources",
        content: "- Coolors.co\n- Adobe Color\n- Color Hunt",
      },
      {
        title: "p5.js Snippets",
        content: "// To save a canvas:\nsaveCanvas('myCanvas', 'png');\n\n// To create a gradient:\n// ... (code for gradient)",
      },
      {
        title: "Project Ideas",
        content: "- Generative logo maker\n- Interactive data visualization\n- AI-powered art tool",
      },
    ];
  }

  draw(buffer) {
    buffer.background(255, 250, 240);
    buffer.fill(17, 17, 17);
    buffer.textFont('monospace');
    const margin = 30;
    let y = margin;

    for (const note of this.notes) {
      buffer.textSize(24);
      buffer.textStyle(BOLD);
      buffer.text(note.title, margin, y);
      y += 35;

      buffer.textSize(16);
      buffer.textStyle(NORMAL);
      buffer.text(note.content, margin, y, buffer.width - margin * 2, buffer.height - y);
      y += buffer.textAscent() + buffer.textDescent() + 100; // Approximate height of the text block
    }
  }
}

window.LibraryNotes = LibraryNotes;
