/**
 * @class GenerativeGraphicsEngine
 * @description A core engine for generative graphics.
 * Provides a set of low-level generative algorithms.
 */
class GenerativeGraphicsEngine {
  constructor() {
    console.log("Generative Graphics Engine loaded.");
  }

  /**
   * Draws a grid of randomly rotated lines.
   * @param {p5.Graphics} buffer - The buffer to draw on.
   * @param {number} density - The density of the grid.
   */
  drawRandomLines(buffer, density = 20) {
    buffer.stroke(255);
    buffer.strokeWeight(1);
    for (let x = 0; x < buffer.width; x += density) {
      for (let y = 0; y < buffer.height; y += density) {
        buffer.push();
        buffer.translate(x + density / 2, y + density / 2);
        buffer.rotate(random(TWO_PI));
        buffer.line(-density / 2, 0, density / 2, 0);
        buffer.pop();
      }
    }
  }

  /**
   * Draws a flow field.
   * @param {p5.Graphics} buffer - The buffer to draw on.
   * @param {number} density - The density of the flow field.
   */
  drawFlowField(buffer, density = 20) {
    const noiseScale = 0.02;
    for (let x = 0; x < buffer.width; x += density) {
      for (let y = 0; y < buffer.height; y += density) {
        const angle = noise(x * noiseScale, y * noiseScale) * TWO_PI;
        buffer.push();
        buffer.translate(x, y);
        buffer.rotate(angle);
        buffer.stroke(255);
        buffer.line(0, 0, density, 0);
        buffer.pop();
      }
    }
  }

  draw(buffer) {
    buffer.background(17, 17, 17);
    this.drawFlowField(buffer, 20);
  }
}

window.GenerativeGraphicsEngine = GenerativeGraphicsEngine;
