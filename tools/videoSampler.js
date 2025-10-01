/**
 * @class VideoSampler
 * @description A tool for manipulating video or images from the Media Bus. It supports a
 * "Grid" mode that repeats the media and a "Slit-Scan" mode for creating time-displacement effects.
 */
class VideoSampler {
  constructor() {
    console.log("Video Sampler loaded.");
    this.cols = 16;
    this.mode = 'grid';
    this.slitDirection = 'horizontal';
    this.slitPosition = 50;
    this.slitScanBuffer = null;
    this.slitScanPos = 0;
  }

  // This function is called when the tool is selected or the artboard is resized.
  regenerate(width, height) {
    if (this.slitScanBuffer) {
      this.slitScanBuffer.remove();
    }
    this.slitScanBuffer = createGraphics(width, height);
    this.reset(); // Reset the state whenever the buffer is recreated.
    console.log("VideoSampler buffer regenerated.");
  }

  // Resets the slit-scan position and clears the buffer.
  reset() {
    this.slitScanPos = 0;
    if (this.slitScanBuffer) {
      this.slitScanBuffer.background(0, 0, 0, 0); // Clear with transparency
    }
  }

  cleanup() {
    if (this.slitScanBuffer) {
      this.slitScanBuffer.remove();
      this.slitScanBuffer = null;
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (this.mode === 'grid') {
      if (!options.noBackground) {
        buffer.background(options.backgroundColor || color(17, 17, 17));
      }
      const cellW = buffer.width / this.cols;
      const cellH = cellW; // Force square cells
      const rows = floor(buffer.height / cellH);

      if (media && media.width > 0) {
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * cellW;
            const y = j * cellH;
            buffer.image(media, x, y, cellW, cellH);
          }
        }
      } else {
        buffer.fill(128);
        buffer.textAlign(CENTER, CENTER);
        buffer.text('UPLOAD A VIDEO/IMAGE VIA THE MEDIA BUS', buffer.width / 2, buffer.height / 2);
      }
    } else if (this.mode === 'slit-scan') {
      if (!this.slitScanBuffer || this.slitScanBuffer.width !== buffer.width || this.slitScanBuffer.height !== buffer.height) {
        this.regenerate(buffer.width, buffer.height);
      }

      if (media && media.width > 0 && media.height > 0) {
        if (this.slitDirection === 'horizontal') {
          const slitY = floor(media.height * (this.slitPosition / 100));
          this.slitScanBuffer.copy(media, 0, slitY, media.width, 1, this.slitScanPos, 0, 1, buffer.height);
          this.slitScanPos = (this.slitScanPos + 1) % buffer.width;
        } else { // vertical
          const slitX = floor(media.width * (this.slitPosition / 100));
          this.slitScanBuffer.copy(media, slitX, 0, 1, media.height, 0, this.slitScanPos, buffer.width, 1);
          this.slitScanPos = (this.slitScanPos + 1) % buffer.height;
        }
      }
      buffer.image(this.slitScanBuffer, 0, 0);
    } else {
      if (!options.noBackground) {
        buffer.background(options.backgroundColor || color(17, 17, 17));
      }
      buffer.fill(128);
      buffer.textAlign(CENTER, CENTER);
      buffer.text('UPLOAD A VIDEO/IMAGE VIA THE MEDIA BUS', buffer.width / 2, buffer.height / 2);
    }
  }
}

window.VideoSampler = VideoSampler;