/**
 * @class IdeaGenerator
 * @description A tool to generate random creative prompts.
 */
class IdeaGenerator {
  constructor() {
    console.log("Idea Generator loaded.");
    this.categories = {
      Project: ["Poster", "Logo", "Album Cover", "Book Cover", "Website Homepage"],
      Theme: ["Futurism", "Minimalism", "Bauhaus", "Psychedelic", "Art Deco"],
      Constraint: ["Use only two colors", "Use only circles", "Use a 3x3 grid", "No text allowed"],
    };
    this.idea = this.generateIdea();
  }

  generateIdea() {
    const project = random(this.categories.Project);
    const theme = random(this.categories.Theme);
    const constraint = random(this.categories.Constraint);
    return { project, theme, constraint };
  }

  regenerate() {
    this.idea = this.generateIdea();
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    // Get proper canvas dimensions for centering
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;

    buffer.background(250, 240, 230);
    buffer.fill(17, 17, 17);
    buffer.textAlign(CENTER, CENTER);
    buffer.textFont('Helvetica, Arial, sans-serif');
    const y = canvasHeight / 2;

    buffer.textSize(24);
    buffer.text("Your creative prompt is:", canvasWidth / 2, y - 100);

    buffer.textSize(36);
    buffer.textStyle(BOLD);
    buffer.text(this.idea.project, canvasWidth / 2, y - 40);

    buffer.textSize(24);
    buffer.textStyle(NORMAL);
    buffer.text(`in the style of ${this.idea.theme}`, canvasWidth / 2, y + 20);

    buffer.textSize(18);
    buffer.textStyle(ITALIC);
    buffer.text(`with the constraint: "${this.idea.constraint}"`, canvasWidth / 2, y + 70);
  }
}

window.IdeaGenerator = IdeaGenerator;
