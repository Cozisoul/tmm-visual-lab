/**
 * @class GenerativeComposer
 * @description A tool that creates continuous, evolving compositions using a set of
 * "random walkers" that draw semi-transparent ellipses, building up texture over time.
 */
class GenerativeComposer {
  constructor() {
    console.log("Generative Composer loaded.");
    this.elementCount = 100;
    this.brushSize = 10;
    this.stepSize = 2;
    this.walkers = [];
    this.needsClear = true; // Flag to clear background once
    this.regenerate();
  }

  regenerate() {
    this.walkers = [];
    // Use a default size if no buffer is available yet
    const bufferWidth = 1080; // Use fixed default size
    const bufferHeight = 1080; // Use fixed default size
    
    for (let i = 0; i < this.elementCount; i++) {
      this.walkers.push({
        x: random(bufferWidth),
        y: random(bufferHeight),
        color: color(random(100, 255), random(100, 255), random(100, 255), 10)
      });
    }
    // Set a flag to clear the buffer on the next draw call,
    // instead of directly accessing the global 'artboard'.
    this.needsClear = true;
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    // If regeneration happened, clear the buffer first.
    if (this.needsClear && !options.noBackground) {
      buffer.background(17, 17, 17);
      this.needsClear = false;
    }

    // This tool draws continuously, adding to the artboard over time
    buffer.noStroke();
    for (const walker of this.walkers) {
      buffer.fill(walker.color);
      buffer.ellipse(walker.x, walker.y, this.brushSize, this.brushSize);

      // Move the walker
      walker.x += random(-this.stepSize, this.stepSize);
      walker.y += random(-this.stepSize, this.stepSize);

      // Constrain to canvas
      walker.x = constrain(walker.x, 0, buffer.width);
      walker.y = constrain(walker.y, 0, buffer.height);
    }
  }
}

window.GenerativeComposer = GenerativeComposer;