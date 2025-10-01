/**
 * @class ColorSystemAnalyzer
 * @description A utility tool that analyzes an image from the Media Bus to extract a
 * dominant color palette. It uses a simple frequency-based quantization algorithm.
 */
class ColorSystemAnalyzer {
  constructor() {
    console.log("Color System Analyzer loaded.");
    this.paletteSize = 8;
    this.palette = [];
    this.isAnalyzing = false;
  }

  regenerate() {
    // Reset analysis data
    this.palette = [];
    this.isAnalyzing = false;
  }

  analyze(sourceMedia) {
    if (!sourceMedia || this.isAnalyzing) return;

    this.isAnalyzing = true;
    this.palette = [];
    console.log(`Analyzing image for ${this.paletteSize} colors...`);

    try {
      // Use a simple quantization (binning) algorithm for speed
      const source = sourceMedia;
      source.loadPixels();
      
      if (!source.pixels || !source.pixels.length) {
        throw new Error("No pixel data available");
      }

      const colorCounts = new Map();
      const step = 4 * 4; // Check every 4th pixel to speed it up

      for (let i = 0; i < source.pixels.length; i += step) {
        if (i + 2 >= source.pixels.length) break;

        const r = source.pixels[i];
        const g = source.pixels[i + 1];
        const b = source.pixels[i + 2];
        const key = `${r},${g},${b}`;
        colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
      }
      
      // Sort by frequency and take the top N colors
      const sortedColors = Array.from(colorCounts.keys()).sort((a, b) => colorCounts.get(b) - colorCounts.get(a));
      this.palette = sortedColors.slice(0, this.paletteSize).map(c => { const [r, g, b] = c.split(',').map(Number); return color(r, g, b); });

    } catch (error) {
      console.error("Error analyzing colors:", error);
      this.isAnalyzing = false;
      return;
    }

    this.isAnalyzing = false;
    console.log("Analysis complete.");

    // Update the UI swatches
    const outputDiv = document.getElementById('csa-palette-output');
    outputDiv.innerHTML = '';
    this.palette.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'palette-swatch';
      swatch.style.backgroundColor = c.toString('#rrggbb');
      outputDiv.appendChild(swatch);
    });
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(17, 17, 17);
    }

    // Get proper canvas dimensions for centering
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;

    if (this.palette.length > 0) {
      const barHeight = canvasHeight / this.palette.length;
      buffer.noStroke();
      for (let i = 0; i < this.palette.length; i++) {
        buffer.fill(this.palette[i]);
        buffer.rect(0, i * barHeight, canvasWidth, barHeight);
      }
    } else {
      buffer.fill(128);
      buffer.textAlign(CENTER, CENTER);
      buffer.text('UPLOAD AN IMAGE AND CLICK "ANALYZE"', canvasWidth / 2, canvasHeight / 2);
    }
  }
}

window.ColorSystemAnalyzer = ColorSystemAnalyzer;