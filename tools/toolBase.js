/**
 * @class ToolBase
 * @description A base class for all tools in the tmm-visual-lab.
 * It provides a consistent interface and default functionality.
 */
class ToolBase {
  constructor() {
    // This is a base class, so it shouldn't be instantiated directly.
    if (this.constructor === ToolBase) {
      throw new TypeError("Cannot construct ToolBase instances directly");
    }
  }

  /**
   * The main drawing method for the tool.
   * @param {p5.Graphics} buffer - The buffer to draw on.
   * @param {p5.Image | p5.Video} media - The media from the media bus.
   * @param {Array<Array<number>>} golGrid - The Game of Life grid.
   * @param {object} options - Additional options.
   */
  draw(buffer, media, golGrid, options) {
    // Default implementation: a simple message.
    // Get proper canvas dimensions for centering
    const canvasWidth = options.canvasWidth || buffer.width;
    const canvasHeight = options.canvasHeight || buffer.height;

    buffer.background(17, 17, 17);
    buffer.fill(255);
    buffer.textAlign(CENTER, CENTER);
    buffer.text(`${this.constructor.name} - draw() not implemented`, canvasWidth / 2, canvasHeight / 2);
  }

  /**
   * Regenerates the tool's content.
   */
  regenerate() {
    // Default implementation: does nothing.
    console.log(`${this.constructor.name} - regenerate() not implemented`);
  }

  /**
   * Cleans up any resources used by the tool.
   */
  cleanup() {
    // Default implementation: does nothing.
    console.log(`${this.constructor.name} - cleanup() not implemented`);
  }

  /**
   * Called when the canvas is resized.
   * @param {number} w - The new width.
   * @param {number} h - The new height.
   */
  onResize(w, h) {
    // Default implementation: does nothing.
  }
}

window.ToolBase = ToolBase;
