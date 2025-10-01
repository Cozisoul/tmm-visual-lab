/**
 * @class ToolSystem
 * @description The main system for managing and switching between tools.
 */
class ToolSystem {
  constructor(artboard) {
    this.artboard = artboard;
    this.tools = {};
    this.activeToolName = null;
    this.mediaBus = null; // For video or image input
    this.golGrid = null; // For Game of Life input
    this.audioLevel = 0; // For audio reactivity
  }

  registerTool(name, toolClass) {
    this.tools[name] = toolClass;
    console.log(`Registered tool: ${name}`);
  }

  setActiveTool(name) {
    if (this.tools[name]) {
      if (this.activeTool && typeof this.activeTool.cleanup === 'function') {
        this.activeTool.cleanup();
      }
      this.activeToolName = name;
      this.activeTool = new this.tools[name]();
      console.log(`Set active tool: ${name}`);
    } else {
      console.error(`Tool not found: ${name}`);
    }
  }

  regenerateActiveTool() {
    if (this.activeTool && typeof this.activeTool.regenerate === 'function') {
      this.activeTool.regenerate();
    }
  }

  draw() {
    if (this.activeTool && typeof this.activeTool.draw === 'function') {
      const options = {
        isAudioReactive: this.audioLevel > 0.01,
        audioLevel: this.audioLevel,
        noBackground: false, // Can be set to true for exporting with transparent background
      };
      this.activeTool.draw(this.artboard, this.mediaBus, this.golGrid, options);
    } else {
      this.artboard.background(17, 17, 17);
      this.artboard.fill(255);
      this.artboard.textAlign(CENTER, CENTER);
      this.artboard.text("No active tool.", this.artboard.width / 2, this.artboard.height / 2);
    }
  }

  setMedia(media) {
    this.mediaBus = media;
  }

  setGolGrid(grid) {
    this.golGrid = grid;
  }

  setAudioLevel(level) {
    this.audioLevel = level;
  }
}

window.ToolSystem = ToolSystem;
