/**
 * @class UniversalRasterizer
 * @description A tool that reinterprets an image from the Media Bus as a grid of shapes (dots or squares).
 * The size of each shape is determined by the brightness of the corresponding pixel in the source image.
 */
class UniversalRasterizer {
  constructor() {
    console.log("Universal Rasterizer loaded.");
    this.cellSize = 10;
    this.mode = 'shape';
    this.shape = 'ellipse';
    this.invert = false;
    this.threshold = 128;
    this.rasterColor = '#FFF8E7';
    this.text = 'A';
    this.textColor = '#111111';
    this.asciiRamp = ' .:-=+*#%@';
  }

  regenerate() {
    // Reset any cached data if needed
    this.lastProcessedImage = null;
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    // Ensure proper canvas sizing for tools
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;
    
    if (!options.noBackground) {
      buffer.background(options.backgroundColor || color(17, 17, 17));
    }
    buffer.rectMode(CORNER);

    if (media && media.width > 0 && media.height > 0) {
      media.loadPixels();
      if (media.pixels.length === 0) return;

      for (let y = 0; y < canvasHeight; y += this.cellSize) {
        for (let x = 0; x < canvasWidth; x += this.cellSize) {
          const imgX = floor(map(x, 0, canvasWidth, 0, media.width));
          const imgY = floor(map(y, 0, canvasHeight, 0, media.height));
          const index = (imgY * media.width + imgX) * 4;
          const c = color(media.pixels[index], media.pixels[index+1], media.pixels[index+2]);

          const b = brightness(c) / 255;
          const brightnessValue = this.invert ? 1.0 - b : b;

          if (this.mode === 'shape') {
            const size = brightnessValue * this.cellSize * 1.5;
            buffer.fill(this.rasterColor);
            buffer.noStroke();
            if (this.shape === 'ellipse') {
              buffer.ellipse(x + this.cellSize / 2, y + this.cellSize / 2, size);
            } else if (this.shape === 'rect') {
              buffer.rectMode(CENTER);
              buffer.rect(x + this.cellSize / 2, y + this.cellSize / 2, size, size);
              buffer.rectMode(CORNER);
            } else if (this.shape === 'triangle') {
              buffer.push();
              buffer.translate(x + this.cellSize / 2, y + this.cellSize / 2);
              buffer.triangle(0, -size / 2, -size / 2, size / 2, size / 2, size / 2);
              buffer.pop();
            }
            if (this.text && this.text.length > 0) {
              buffer.fill(this.textColor);
              buffer.textAlign(CENTER, CENTER);
              buffer.textSize(size * 0.8);
              buffer.text(this.text, x + this.cellSize / 2, y + this.cellSize / 2);
            }
          } else if (this.mode === 'ascii') {
            const charIndex = floor(brightnessValue * (this.asciiRamp.length - 1));
            const char = this.asciiRamp.charAt(charIndex);
            buffer.fill(this.rasterColor);
            buffer.noStroke();
            buffer.textAlign(CENTER, CENTER);
            buffer.textSize(this.cellSize);
            buffer.text(char, x + this.cellSize / 2, y + this.cellSize / 2);
          } else if (this.mode === 'bitmap') {
            const isAboveThreshold = brightness(c) > this.threshold;
            if (this.invert ? !isAboveThreshold : isAboveThreshold) {
              buffer.fill(this.rasterColor);
              buffer.noStroke();
              buffer.rect(x, y, this.cellSize, this.cellSize);
            }
          }
        }
      }
    } else {
      buffer.fill(128);
      buffer.textAlign(CENTER, CENTER);
      buffer.textSize(12);
      buffer.text('UPLOAD AN IMAGE VIA THE MEDIA BUS', canvasWidth / 2, canvasHeight / 2);
    }
  }
}

window.UniversalRasterizer = UniversalRasterizer;