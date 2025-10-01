/*
 * Exporter
 * A comprehensive tool for exporting the canvas in different formats.
 * This captures all layers including the artboard, overlays, and proper scaling.
 */
class Exporter {
  constructor() {
    this.exportQuality = 1.0; // Default export quality
  }

  /**
   * Creates a composite image that captures all layers of the current canvas state.
   * This includes the artboard content, any overlays, and proper scaling.
   * @param {Object} options - Export options
   * @param {boolean} options.includeOverlays - Whether to include tool overlays
   * @param {boolean} options.transparent - Whether to use transparent background
   * @param {number} options.scale - Scale factor for export (default: 1.0)
   * @param {string} options.backgroundColor - Background color for non-transparent exports
   * @returns {p5.Graphics} A graphics buffer containing the composite image
   */
  createCompositeImage(options = {}) {
    const {
      includeOverlays = true,
      transparent = false,
      scale = 1.0,
      backgroundColor = '#000000'
    } = options;

    // Get the artboard dimensions
    const artboardWidth = artboard ? artboard.width : 1080;
    const artboardHeight = artboard ? artboard.height : 1080;
    
    // Create a high-resolution export buffer
    const exportWidth = Math.floor(artboardWidth * scale);
    const exportHeight = Math.floor(artboardHeight * scale);
    
    const exportBuffer = createGraphics(exportWidth, exportHeight);
    exportBuffer.colorMode(RGB, 255);
    
    // Set background
    if (transparent) {
      exportBuffer.clear();
    } else {
      exportBuffer.background(backgroundColor);
    }
    
    // Draw the artboard content scaled up
    if (artboard) {
      exportBuffer.push();
      exportBuffer.scale(scale);
      exportBuffer.image(artboard, 0, 0);
      exportBuffer.pop();
    }
    
    // Draw overlays if requested and available
    if (includeOverlays && activeTool && typeof activeTool.drawOverlay === 'function') {
      // Create a temporary buffer for overlays
      const overlayBuffer = createGraphics(exportWidth, exportHeight);
      overlayBuffer.colorMode(RGB, 255);
      overlayBuffer.clear();
      
      // Scale the overlay drawing context
      overlayBuffer.push();
      overlayBuffer.scale(scale);
      
      // Draw overlay content
      activeTool.drawOverlay(overlayBuffer);
      
      overlayBuffer.pop();
      
      // Composite the overlay onto the export buffer
      exportBuffer.image(overlayBuffer, 0, 0);
      overlayBuffer.remove();
    }
    
    return exportBuffer;
  }

  /**
   * Saves the current canvas state as a PNG file with all layers.
   * @param {p5.Graphics | p5.Renderer} graphicsContext - Optional specific buffer to save
   * @param {string} filename - The desired filename (without extension)
   * @param {Object} options - Export options
   */
  saveAsPng(graphicsContext = null, filename = 'export', options = {}) {
    const {
      includeOverlays = true,
      transparent = false,
      scale = 1.0,
      backgroundColor = artboardBackgroundColor || '#000000'
    } = options;

    let bufferToSave;
    
    if (graphicsContext) {
      // Use the provided graphics context
      bufferToSave = graphicsContext;
    } else {
      // Create a composite of all layers
      bufferToSave = this.createCompositeImage({
        includeOverlays,
        transparent,
        scale,
        backgroundColor
      });
    }

    if (bufferToSave) {
      saveCanvas(bufferToSave, filename, 'png');
      
      // Clean up if we created a temporary buffer
      if (!graphicsContext) {
        bufferToSave.remove();
      }
    } else {
      console.error("Exporter: No valid canvas or buffer to save.");
    }
  }

  /**
   * Saves the current canvas state as a JPG file with all layers.
   * @param {p5.Graphics | p5.Renderer} graphicsContext - Optional specific buffer to save
   * @param {string} filename - The desired filename (without extension)
   * @param {Object} options - Export options
   */
  saveAsJpg(graphicsContext = null, filename = 'export', options = {}) {
    const {
      includeOverlays = true,
      scale = 1.0,
      backgroundColor = artboardBackgroundColor || '#000000'
    } = options;

    let bufferToSave;
    
    if (graphicsContext) {
      bufferToSave = graphicsContext;
    } else {
      // Create a composite (JPG doesn't support transparency)
      bufferToSave = this.createCompositeImage({
        includeOverlays,
        transparent: false,
        scale,
        backgroundColor
      });
    }

    if (bufferToSave) {
      saveCanvas(bufferToSave, filename, 'jpg');
      
      // Clean up if we created a temporary buffer
      if (!graphicsContext) {
        bufferToSave.remove();
      }
    } else {
      console.error("Exporter: No valid canvas or buffer to save.");
    }
  }

  /**
   * Saves the current canvas state as an SVG file.
   * This creates a new SVG canvas and redraws the content.
   * @param {string} filename - The desired filename (without extension)
   * @param {Object} options - Export options
   */
  saveAsSvg(filename = 'export', options = {}) {
    const {
      includeOverlays = true,
      transparent = false,
      backgroundColor = artboardBackgroundColor || '#000000'
    } = options;

    if (!artboard) {
      console.error("Exporter: No artboard available for SVG export.");
      return;
    }

    try {
      // Create an SVG canvas with the same dimensions as the artboard
      const svgCanvas = createGraphics(artboard.width, artboard.height, SVG);
      svgCanvas.colorMode(RGB, 255);
      
      // Set background
      if (transparent) {
        svgCanvas.clear();
      } else {
        svgCanvas.background(backgroundColor);
      }
      
      // Draw the artboard content
      svgCanvas.image(artboard, 0, 0);
      
      // Draw overlays if requested
      if (includeOverlays && activeTool && typeof activeTool.drawOverlay === 'function') {
        activeTool.drawOverlay(svgCanvas);
      }
      
      // Save the SVG
      save(svgCanvas, `${filename}.svg`);
      svgCanvas.remove();
      
    } catch (error) {
      console.error("Exporter: SVG export failed:", error);
    }
  }

  /**
   * Saves the current canvas state as a high-resolution PNG.
   * @param {string} filename - The desired filename (without extension)
   * @param {number} scale - Scale factor for high-res export (default: 2.0)
   * @param {Object} options - Additional export options
   */
  saveAsHighResPng(filename = 'export', scale = 2.0, options = {}) {
    this.saveAsPng(null, filename, { ...options, scale });
  }

  /**
   * Saves multiple formats at once.
   * @param {string} filename - The base filename (without extension)
   * @param {Array} formats - Array of formats to export ['png', 'jpg', 'svg']
   * @param {Object} options - Export options
   */
  saveMultipleFormats(filename = 'export', formats = ['png'], options = {}) {
    formats.forEach(format => {
      switch (format.toLowerCase()) {
        case 'png':
          this.saveAsPng(null, filename, options);
          break;
        case 'jpg':
        case 'jpeg':
          this.saveAsJpg(null, filename, options);
          break;
        case 'svg':
          this.saveAsSvg(filename, options);
          break;
        default:
          console.warn(`Exporter: Unknown format '${format}' skipped.`);
      }
    });
  }

  /**
   * Gets information about the current canvas state for debugging.
   * @returns {Object} Canvas state information
   */
  getCanvasInfo() {
    return {
      artboard: artboard ? {
        width: artboard.width,
        height: artboard.height,
        type: artboard.isSVG ? 'SVG' : '2D'
      } : null,
      mainCanvas: canvas ? {
        width: canvas.width,
        height: canvas.height
      } : null,
      activeTool: activeTool ? activeTool.constructor.name : null,
      hasOverlays: activeTool && typeof activeTool.drawOverlay === 'function',
      gameOfLifeEnabled: gameOfLifeEnabled,
      audioReactive: isAudioReactive
    };
  }
}

window.Exporter = Exporter;