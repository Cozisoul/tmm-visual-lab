/**
 * @class PixelSorter
 * @description A classic glitch art tool that sorts pixels within an image. It sorts segments
 * of pixels based on a specified mode (e.g., brightness, hue) and a threshold value.
 */
class PixelSorter {
  constructor() {
    console.log("Pixel Sorter loaded.");
    this.sortMode = 'brightness';
    this.threshold = 80;
    this.direction = 'horizontal';
    this.sortedImage = null;
  }

  regenerate() {
    // Reset sorted image
    this.sortedImage = null;
  }

  sort(sourceMedia) {
    if (!sourceMedia) return;
    
    // Add dimension validation
    if (sourceMedia.width <= 0 || sourceMedia.height <= 0) {
      console.error("Invalid media dimensions");
      return;
    }

    console.log(`Sorting pixels with mode: ${this.sortMode} and threshold: ${this.threshold}`);
    
    try {
      // Create a copy to sort
      this.sortedImage = createImage(sourceMedia.width, sourceMedia.height);
      this.sortedImage.copy(sourceMedia, 0, 0, sourceMedia.width, sourceMedia.height, 0, 0, sourceMedia.width, sourceMedia.height);
      this.sortedImage.loadPixels();

      if (!this.sortedImage.pixels || !this.sortedImage.pixels.length) {
        throw new Error("No pixel data available");
      }

      const w = this.sortedImage.width;
      const h = this.sortedImage.height;

      if (this.direction === 'horizontal') {
        for (let y = 0; y < h; y++) {
          let row = [];
          for (let x = 0; x < w; x++) {
            let index = (x + y * w) * 4;
            if (index + 3 >= this.sortedImage.pixels.length) continue;
            row.push({
              r: this.sortedImage.pixels[index],
              g: this.sortedImage.pixels[index + 1],
              b: this.sortedImage.pixels[index + 2],
              a: this.sortedImage.pixels[index + 3],
            });
          }

          let start = -1;
          for (let x = 0; x < w; x++) {
            const val = this.getSortValue(row[x]);
            if (val > this.threshold && start === -1) {
              start = x;
            } else if (val < this.threshold && start !== -1) {
              this.sortSegment(row, start, x);
              start = -1;
            }
          }
          if (start !== -1) this.sortSegment(row, start, w);

          for (let x = 0; x < w; x++) {
            let index = (x + y * w) * 4;
            this.sortedImage.pixels[index] = row[x].r;
            this.sortedImage.pixels[index + 1] = row[x].g;
            this.sortedImage.pixels[index + 2] = row[x].b;
            this.sortedImage.pixels[index + 3] = row[x].a;
          }
        }
      } else { // Vertical
        for (let x = 0; x < w; x++) {
          let col = [];
          for (let y = 0; y < h; y++) {
            let index = (x + y * w) * 4;
            if (index + 3 >= this.sortedImage.pixels.length) continue;
            col.push({
              r: this.sortedImage.pixels[index],
              g: this.sortedImage.pixels[index + 1],
              b: this.sortedImage.pixels[index + 2],
              a: this.sortedImage.pixels[index + 3],
            });
          }

          let start = -1;
          for (let y = 0; y < h; y++) {
            const val = this.getSortValue(col[y]);
            if (val > this.threshold && start === -1) {
              start = y;
            } else if (val < this.threshold && start !== -1) {
              this.sortSegment(col, start, y);
              start = -1;
            }
          }
          if (start !== -1) this.sortSegment(col, start, h);

          for (let y = 0; y < h; y++) {
            let index = (x + y * w) * 4;
            this.sortedImage.pixels[index] = col[y].r;
            this.sortedImage.pixels[index + 1] = col[y].g;
            this.sortedImage.pixels[index + 2] = col[y].b;
            this.sortedImage.pixels[index + 3] = col[y].a;
          }
        }
      }
      this.sortedImage.updatePixels();

    } catch (error) {
      console.error("Error during pixel sorting:", error);
      return;
    }
  }

  getSortValue(px) {
    try {
      if (!px) return 0;
      const c = color(px.r, px.g, px.b);
      if (this.sortMode === 'hue') return hue(c);
      if (this.sortMode === 'red') return px.r;
      if (this.sortMode === 'green') return px.g;
      if (this.sortMode === 'blue') return px.b;
      return brightness(c); // Default to brightness
    } catch (e) {
      console.error("Error getting sort value:", e);
      return 0;
    }
  }

  sortSegment(arr, start, end) {
    try {
      if (start >= end || start < 0 || end > arr.length) return;
      const segment = arr.slice(start, end);
      segment.sort((a, b) => this.getSortValue(a) - this.getSortValue(b));
      arr.splice(start, segment.length, ...segment);
    } catch (e) {
      console.error("Error sorting segment:", e);
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(17, 17, 17);
    }

    // Audio reactivity for Pixel Sorter
    if (options.isAudioReactive && media) {
      // Modulate threshold based on audio level
      this.threshold = map(options.audioLevel, 0, 1, 0, 255); // Map audio level to threshold range

      // Trigger sort on audio peak (e.g., when audioLevel crosses a certain point)
      // This requires tracking previous audio level, which is done in sketch.js
      // For simplicity here, we'll just sort every frame if audio is active and media is present.
      // A more sophisticated peak detection would be needed for true "audio-activated" sorting.
      this.sort(media); // Sort continuously if audio is active
    }

    if (this.sortedImage) {
      buffer.image(this.sortedImage, 0, 0, buffer.width, buffer.height);
    } else {
      buffer.fill(128);
      buffer.textAlign(CENTER, CENTER);
      buffer.text('UPLOAD AN IMAGE AND CLICK "SORT"', buffer.width / 2, buffer.height / 2);
    }
  }
}

window.PixelSorter = PixelSorter;