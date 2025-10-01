/**
 * @class CreativeCodingWorkbench
 * @description A workbench for combining and orchestrating other creative tools.
 * This is a meta-tool that can load and run other tools.
 */
class CreativeCodingWorkbench {
  constructor() {
    console.log("Creative Coding Workbench loaded.");
    this.availableTools = {
      BauhausAssembler,
      GenerativeComposer,
      GridArchitect,
      KineticTypeEngine,
      ParticleEngine,
      TruchetTiler,
      WaveformSynthesizer,
    };
    this.activeTool = null;
    this.toolName = "BauhausAssembler"; // Default tool
    this.loadTool();
  }

  loadTool() {
    if (this.toolName && this.availableTools[this.toolName]) {
      this.activeTool = new this.availableTools[this.toolName]();
      console.log(`Loaded tool: ${this.toolName}`);
    } else {
      console.error(`Tool not found: ${this.toolName}`);
      this.activeTool = null;
    }
  }

  regenerate() {
    if (this.activeTool && typeof this.activeTool.regenerate === 'function') {
      this.activeTool.regenerate();
    }
  }

  draw(buffer, media, golGrid, options) {
    if (this.activeTool && typeof this.activeTool.draw === 'function') {
      this.activeTool.draw(buffer, media, golGrid, options);
    } else {
      // Get proper canvas dimensions for centering
      const canvasWidth = options.canvasWidth || buffer.width;
      const canvasHeight = options.canvasHeight || buffer.height;

      buffer.background(17, 17, 17);
      buffer.fill(255);
      buffer.textAlign(CENTER, CENTER);
      buffer.text("No active tool or tool has no draw method.", canvasWidth / 2, canvasHeight / 2);
    }
  }

  // This method would be called by the UI to switch tools
  setTool(toolName) {
    if (toolName !== this.toolName) {
      this.toolName = toolName;
      this.loadTool();
    }
  }
}

window.CreativeCodingWorkbench = CreativeCodingWorkbench;
