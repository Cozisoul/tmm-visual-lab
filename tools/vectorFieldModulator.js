/**
 * @class VectorFieldModulator
 * @description A tool for creating and visualizing a vector field.
 * The field can be modulated by noise and other inputs.
 */
class VectorFieldModulator {
  constructor() {
    console.log("Vector Field Modulator loaded.");
    this.resolution = 20;
    this.field = [];
    this.noiseScale = 0.1;
    this.time = 0;
    this.timeSpeed = 0.01;
    this.regenerate();
  }

  regenerate() {
    this.field = [];
    // Use default size if no buffer is available yet
    const bufferWidth = 1080; // Use fixed default size
    const bufferHeight = 1080; // Use fixed default size
    for (let x = 0; x < bufferWidth; x += this.resolution) {
      for (let y = 0; y < bufferHeight; y += this.resolution) {
        this.field.push({
          x: x,
          y: y,
          vec: createVector(0, 0),
        });
      }
    }
  }

  updateField() {
    for (const point of this.field) {
      const angle = noise(point.x * this.noiseScale, point.y * this.noiseScale, this.time) * TWO_PI * 2;
      point.vec.set(cos(angle), sin(angle));
    }
    this.time += this.timeSpeed;
  }

  draw(buffer) {
    this.updateField();
    buffer.background(17, 17, 17);
    buffer.stroke(255);
    buffer.strokeWeight(1);

    for (const point of this.field) {
      buffer.push();
      buffer.translate(point.x + this.resolution / 2, point.y + this.resolution / 2);
      buffer.rotate(point.vec.heading());
      buffer.line(-this.resolution / 2, 0, this.resolution / 2, 0);
      buffer.pop();
    }
  }
}

window.VectorFieldModulator = VectorFieldModulator;
