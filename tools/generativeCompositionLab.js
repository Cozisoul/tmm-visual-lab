/**
 * @class GenerativeCompositionLab
 * @description A tool for creating complex, layered generative compositions.
 * This tool can be expanded to combine different generative algorithms.
 */
class GenerativeCompositionLab {
  constructor() {
    console.log("Generative Composition Lab loaded.");
    this.layers = 3;
    this.elementsPerLayer = 20;
    this.composition = [];
    this.regenerate();
  }

  regenerate() {
    this.composition = [];
    const colorPalettes = [
      ['#FF6B6B', '#FFE66D', '#4ECDC4', '#1A535C'],
      ['#F7FFF7', '#4ECDC4', '#FFE66D', '#FF6B6B'],
      ['#DBC2CF', '#9FA2B2', '#545775', '#2A2C49']
    ];

    for (let i = 0; i < this.layers; i++) {
      const layer = [];
      const palette = colorPalettes[i % colorPalettes.length];
      for (let j = 0; j < this.elementsPerLayer; j++) {
        layer.push({
          x: random(1080), // Use fixed default size
          y: random(1080), // Use fixed default size
          w: random(50, 200),
          h: random(50, 200),
          color: color(random(palette)),
          shape: random(['rect', 'ellipse'])
        });
      }
      this.composition.push(layer);
    }
  }

  draw(buffer) {
    buffer.background(17, 17, 17);
    buffer.noStroke();

    for (const layer of this.composition) {
      for (const element of layer) {
        const c = element.color;
        buffer.fill(red(c), green(c), blue(c), 150); // Semi-transparent
        if (element.shape === 'rect') {
          buffer.rect(element.x, element.y, element.w, element.h);
        } else {
          buffer.ellipse(element.x, element.y, element.w, element.h);
        }
      }
    }
  }
}

window.GenerativeCompositionLab = GenerativeCompositionLab;
