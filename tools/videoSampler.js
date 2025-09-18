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
    this.slitPosition = 50; // As a percentage (0-100)
    this.slitScanBuffer = null;
    this.slitScanPos = 0;
  }

  regenerate() {
    if (this.slitScanBuffer) {
      this.slitScanBuffer.remove();
    }
    this.slitScanBuffer = createGraphics(artboard.width, artboard.height);
    this.slitScanBuffer.background(17, 17, 17);
    this.slitScanPos = 0;
    console.log("Slit-scan buffer regenerated.");
  }

  /**
   * Cleans up the tool's resources, specifically the slit-scan buffer, to prevent memory leaks.
   */
  cleanup() {
    if (this.slitScanBuffer) {
      this.slitScanBuffer.remove();
      this.slitScanBuffer = null;
      console.log("VideoSampler buffer cleaned up.");
    }
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (this.mode === 'grid') {
      if (!options.noBackground) {
        buffer.background(17, 17, 17);
      }
      const cellW = buffer.width / this.cols;
      const cellH = cellW;
      const rows = floor(buffer.height / cellH);

      if (media && media.width > 0) {
        for (let i = 0; i < this.cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * cellW;
            const y = j * cellH;
            buffer.image(media, x, y, cellW, cellH); // Draw the entire source media scaled into the current grid cell
          }
        }
      } else {
        buffer.fill(128);
        buffer.textAlign(CENTER, CENTER);
        buffer.text('UPLOAD A VIDEO/IMAGE VIA THE MEDIA BUS', buffer.width / 2, buffer.height / 2);
      }
    } else if (this.mode === 'slit-scan') {
      if (!this.slitScanBuffer || this.slitScanBuffer.width !== buffer.width || this.slitScanBuffer.height !== buffer.height) {
        this.regenerate();
      }
      if (options.noBackground) {
        // For slit-scan, a transparent export doesn't make sense as it builds over time. We draw it as is.
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
        buffer.background(17, 17, 17);
        buffer.fill(128);
        buffer.textAlign(CENTER, CENTER);
        buffer.text('UPLOAD A VIDEO/IMAGE VIA THE MEDIA BUS', buffer.width / 2, buffer.height / 2);
      }
    }
  }
}

window.VideoSampler = VideoSampler;