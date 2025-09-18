// =================================================================================
// == TMM-OS / VISUAL-LAB: CORE SKETCH FILE
// =================================================================================
// This file contains the main p5.js setup() and draw() loops, which form the heart
// of the application. It manages the active tool, the off-screen artboard buffer,
// global effects like Game of Life, and the rendering pipeline.

/**
 * @class AudioAnalyzer
 * @description A helper class to manage microphone input and provide a normalized
 * audio level for reactive animations across different tools.
 * This is included directly in sketch.js to prevent file loading race conditions.
 */
class AudioAnalyzer {
  constructor() {
    this.mic = null;
    this.amplitude = null;
    this.level = 0;
    this.isInitialized = false;
    this.isEnabled = false;
  }

  init() {
    if (this.isInitialized) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      try {
        await userStartAudio();
        this.mic = new p5.AudioIn();
        this.mic.start(() => {
          this.amplitude = new p5.Amplitude();
          this.amplitude.setInput(this.mic);
          this.isInitialized = true;
          console.log("Audio Analyzer initialized successfully.");
          resolve();
        }, (err) => {
          console.error("Audio Analyzer mic.start() failed:", err);
          this.isInitialized = false;
          reject(err);
        });
      } catch (e) {
        console.error("Audio Analyzer failed to initialize:", e);
        this.isInitialized = false;
        reject(e);
      }
    });
  }
  update() { if (this.isInitialized && this.isEnabled && this.amplitude) { this.level = this.amplitude.getLevel(); } else { this.level = 0; } }
  getLevel() { return this.level; }
  setEnabled(enabled) { this.isEnabled = enabled; }
}

let activeTool = null;
let canvas;
let artboard; // The off-screen graphics buffer for drawing
let mediaBusContent = null; // To hold the loaded image or video

const toolClasses = {
  gridArchitect: 'GridArchitect',
  posterComposer: 'PosterComposer',
  bauhausAssembler: 'BauhausAssembler',
  kineticTypeEngine: 'KineticTypeEngine',
  glyphDeconstructor: 'GlyphDeconstructor',
  waveformSynthesizer: 'WaveformSynthesizer',
  universalRasterizer: 'UniversalRasterizer',
  videoSampler: 'VideoSampler',
  colorSystemAnalyzer: 'ColorSystemAnalyzer',
  pixelSorter: 'PixelSorter',
  truchetTiler: 'TruchetTiler',
  particleEngine: 'ParticleEngine',
  rhythmSequencer: 'RhythmSequencer',
  objectRasterizer3D: 'ObjectRasterizer3D',
  generativeComposer: 'GenerativeComposer',
};

const MEDIA_TOOL_CLASSES = [
  'UniversalRasterizer',
  'VideoSampler',
  'ColorSystemAnalyzer',
  'PixelSorter'
];

// --- GLOBAL STATE ---
let artboardWidth = 1080;
let artboardHeight = 1080;
let artboardBackgroundColor = '#000000';
let globalViewZoom = 1.0;


// Game of Life FX
let gameOfLifeEnabled = false;
let golLinkEnabled = false;
let gameOfLifeThreshold = 128;
let gameOfLifeCellSize = 10;
let gameOfLifeSpeed = 5;
let gameOfLifeGrid;
let gameOfLifeCols, gameOfLifeRows;
let gameOfLifeMode = 'classic';
let justEnabledGOL = false;

// Mouse coordinates relative to the artboard
let artboardMouseX = 0;
let artboardMouseY = 0;

// Audio Reactivity
let audioAnalyzer;
let isAudioReactive = false;
let audioSensitivity = 1.0; // Multiplier for mic input
let golAudioSeedEnabled = false; // For the new feature
let lastAudioLevelForGOL = 0; // For peak detection


// Game of Life Rule Sets
const golRules = {
  classic: { // Conway's Game of Life
    birth: [3],
    survival: [2, 3]
  },
  highlife: {
    birth: [3, 6],
    survival: [2, 3]
  },
  daynight: {
    birth: [3, 6, 7, 8],
    survival: [3, 4, 6, 7, 8]
  },
  seeds: {
    birth: [2],
    survival: []
  },
  maze: {
    birth: [3],
    survival: [1, 2, 3, 4, 5]
  }
};

// New object for GOL metrics
let golMetrics = {
  liveCellCount: 0,
  density: 0,
  chaos: 0,
  averagePosition: { x: 0.5, y: 0.5 } // Normalized 0-1
};

// GIF Recording
let capturer;
let isRecording = false;

/**
 * The main p5.js setup function. Runs once when the page loads.
 */
function setup() {
  console.log("Application setup starting...");
  try {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) throw new Error("Canvas wrapper not found");

    console.log("Creating main canvas...");
    canvas = createCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
    canvas.parent('canvas-wrapper');
    console.log("Main canvas created.");
    
    resizeArtboard(artboardWidth, artboardHeight);

    colorMode(RGB, 255);

    const fileInput = select('#media-file-input');
    if (fileInput) fileInput.changed(handleFileInput);

    canvas.dragOver(highlightDropZone);
    canvas.dragLeave(unhighlightDropZone);
    canvas.drop(handleFileDrop, unhighlightDropZone);

    // Initialize helpers
    audioAnalyzer = new AudioAnalyzer();

    console.log("Loading default tool...");
    loadTool('gridArchitect');
    console.log("Application setup complete.");
  } catch (e) {
    console.error("Critical setup failed:", e);
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) wrapper.innerHTML = '<div class="error-message">Failed to initialize. Check console.</div>';
  }
}

/**
 * The main p5.js draw function. Runs in a loop.
 */
function draw() {
  try {
    if (isAudioReactive) {
      audioAnalyzer.update();
    }

    if (gameOfLifeEnabled && frameCount % gameOfLifeSpeed === 0) {
      if (!justEnabledGOL) {
        updateGOLGrid();
        if (golLinkEnabled) modulateActiveToolWithGOL();
      } else {
        justEnabledGOL = false;
      }
    }

    // --- Audio Processing & GOL Trigger ---
    const rawAudioLevel = isAudioReactive ? audioAnalyzer.getLevel() : 0;
    const adjustedAudioLevel = constrain(rawAudioLevel * audioSensitivity, 0, 1.0);

    // If GOL audio seeding is on, check for a sound peak to re-seed the grid.
    if (gameOfLifeEnabled && golAudioSeedEnabled && isAudioReactive) {
      // A "peak" is when the audio level crosses a threshold.
      if (adjustedAudioLevel > 0.3 && lastAudioLevelForGOL <= 0.3) {
        seedGameOfLifeFromArtboard();
      }
      lastAudioLevelForGOL = adjustedAudioLevel;
    }

    const drawOptions = {
      noBackground: false,
      isAudioReactive: isAudioReactive,
      audioLevel: adjustedAudioLevel,
      backgroundColor: artboardBackgroundColor, // Pass the global BG color to all tools
      zoom: globalViewZoom
    };

    if (activeTool && typeof activeTool.draw === 'function') {
      // Let the tool draw its own background unless it's an additive tool that needs trails
      if (activeTool.constructor.name !== 'GenerativeComposer' && activeTool.constructor.name !== 'ParticleEngine') {
        artboard.background(17);
      }
      activeTool.draw(artboard, mediaBusContent, gameOfLifeEnabled ? gameOfLifeGrid : null, drawOptions);
    } else {
      artboard.background(20);
    }

    background(color(artboardBackgroundColor));
    const canvasRatio = width / height;
    const artboardRatio = artboard.width / artboard.height;
    let drawW, drawH, x, y;
    if (canvasRatio > artboardRatio) {
      drawH = height * 0.95;
      drawW = drawH * artboardRatio;
    } else {
      drawW = width * 0.95;
      drawH = drawW / artboardRatio;
    }
    x = (width - drawW) / 2;
    y = (height - drawH) / 2;
    image(artboard, x, y, drawW, drawH);

    // Calculate mouse coordinates relative to the artboard for tools that need it
    artboardMouseX = map(mouseX, x, x + drawW, 0, artboard.width);
    artboardMouseY = map(mouseY, y, y + drawH, 0, artboard.height);

    if (activeTool && typeof activeTool.drawOverlay === 'function') {
      activeTool.drawOverlay();
    }

    const frDisplay = document.getElementById('canvas-framerate-display');
    if (frDisplay && frameCount % 10 === 0) {
      frDisplay.textContent = `[FRAMERATE: ${frameRate().toFixed(0)} FPS]`;
    }

    if (isRecording && capturer) {
      capturer.capture(artboard.elt);
    }
  } catch (error) {
    console.error("Critical error in draw loop:", error);
    noLoop();
  }
}

/**
 * Resizes the off-screen artboard.
 */
function resizeArtboard(w, h) {
  console.log(`Resizing artboard to ${w}x${h}`);
  artboardWidth = w;
  artboardHeight = h;
  if (artboard) artboard.remove();
  artboard = createGraphics(w, h);
  artboard.colorMode(RGB, 255);
  artboard.drawingContext.canvas.willReadFrequently = true;
  console.log("Artboard resized and created.");

  const sizeDisplay = document.getElementById('canvas-size-display');
  if (sizeDisplay) sizeDisplay.textContent = `[ARTBOARD: ${w}x${h}px]`;

  reinitializeGOLGrid();

  if (activeTool && typeof activeTool.regenerate === 'function') {
    activeTool.regenerate();
  }
}

/**
 * Dynamically loads a tool.
 */
async function loadTool(toolName) {
  console.log(`--- Loading tool: ${toolName} ---`);
  const className = toolClasses[toolName];
  if (!className) {
    console.error(`Tool "${toolName}" is not defined.`);
    return;
  }

  try {
    if (activeTool && typeof activeTool.cleanup === 'function') {
      console.log(`Cleaning up previous tool: ${activeTool.constructor.name}`);
      activeTool.cleanup();
    }

    if (window[className]) {
      console.log(`Instantiating new tool: ${className}`);
      activeTool = new window[className]();

      if (typeof activeTool.init === 'function') {
        console.log(`Initializing ${className}...`);
        await activeTool.init();
        console.log(`${className} initialized successfully.`);
      }
    } else {
      console.error(`Tool class "${className}" not found. Was the script loaded?`);
      activeTool = null;
    }
  } catch (e) {
    console.error(`Error initializing ${className}:`, e);
    activeTool = null;
  }
  console.log(`--- Tool loading finished ---`);
}

/**
 * Updates the Game of Life grid based on the selected ruleset.
 */
function updateGOLGrid() {
  if (!gameOfLifeGrid || gameOfLifeCols === 0) return;

  const rules = golRules[gameOfLifeMode] || golRules.classic;
  const nextGrid = new Array(gameOfLifeCols).fill(0).map(() => new Array(gameOfLifeRows).fill(0));
  let liveCount = 0, avgX = 0, avgY = 0, changedCells = 0;

  for (let x = 0; x < gameOfLifeCols; x++) {
    for (let y = 0; y < gameOfLifeRows; y++) {
      let neighbors = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          neighbors += gameOfLifeGrid[(x + i + gameOfLifeCols) % gameOfLifeCols][(y + j + gameOfLifeRows) % gameOfLifeRows];
        }
      }

      const state = gameOfLifeGrid[x][y];
      if (state === 1 && rules.survival.includes(neighbors)) nextGrid[x][y] = 1;
      else if (state === 0 && rules.birth.includes(neighbors)) nextGrid[x][y] = 1;
      else nextGrid[x][y] = 0;

      if (nextGrid[x][y] === 1) { liveCount++; avgX += x; avgY += y; }
      if (nextGrid[x][y] !== gameOfLifeGrid[x][y]) changedCells++;
    }
  }
  gameOfLifeGrid = nextGrid;

  const totalCells = gameOfLifeCols * gameOfLifeRows;
  golMetrics.liveCellCount = liveCount;
  golMetrics.density = totalCells > 0 ? liveCount / totalCells : 0;
  golMetrics.chaos = totalCells > 0 ? changedCells / totalCells : 0;
  golMetrics.averagePosition = liveCount > 0 ? { x: (avgX / liveCount) / gameOfLifeCols, y: (avgY / liveCount) / gameOfLifeRows } : { x: 0.5, y: 0.5 };
}

function modulateActiveToolWithGOL() {
  if (!activeTool || !golLinkEnabled) return;
  const tool = activeTool;
  if (typeof tool.cols !== 'undefined') tool.cols = floor(map(golMetrics.density, 0, 0.5, 4, 50));
  if (typeof tool.jitter !== 'undefined') tool.jitter = map(golMetrics.chaos, 0, 0.1, 0, 100);
  if (typeof tool.speed !== 'undefined') tool.speed = map(golMetrics.chaos, 0, 0.1, 0.5, 10);
  if (typeof tool.marginX !== 'undefined') tool.marginX = map(golMetrics.averagePosition.x, 0, 1, 0, 200);
}

function windowResized() {
  const wrapper = document.getElementById('canvas-wrapper');
  if (wrapper) resizeCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
}

function reinitializeGOLGrid() {
  if (artboardWidth <= 0 || artboardHeight <= 0 || gameOfLifeCellSize <= 0) return;
  gameOfLifeCols = floor(artboardWidth / gameOfLifeCellSize);
  gameOfLifeRows = floor(artboardHeight / gameOfLifeCellSize);
  gameOfLifeGrid = new Array(gameOfLifeCols).fill(0).map(() => new Array(gameOfLifeRows).fill(0));
}

function handleFileInput(file) {
  if (file.type === 'image') mediaBusContent = loadImage(file.data, () => handleFile('image'));
  else if (file.type === 'video') {
    mediaBusContent = createVideo(file.data, () => handleFile('video'));
    mediaBusContent.hide();
    mediaBusContent.loop();
  }
}

function handleFileDrop(file) {
  if (file.type === 'image') mediaBusContent = loadImage(file.data, () => handleFile('image'));
  else if (file.type === 'video') {
    mediaBusContent = createVideo(file.data, () => handleFile('video'));
    mediaBusContent.hide();
    mediaBusContent.loop();
  }
}

function handleFile(type) {
  const preview = document.getElementById('media-bus-preview');
  const filenameEl = document.getElementById('media-bus-filename');
  const clearContainer = document.getElementById('media-clear-container');
  const matchRatioBtn = document.getElementById('media-match-ratio-btn');
  const csaBtn = document.getElementById('csa-analyze-btn');
  const psBtn = document.getElementById('ps-sort-btn');

  preview.innerHTML = '';
  mediaBusContent.originalWidth = mediaBusContent.width;
  mediaBusContent.originalHeight = mediaBusContent.height;
  preview.appendChild(type === 'image' ? mediaBusContent.canvas : mediaBusContent.elt);
  filenameEl.textContent = `${type.toUpperCase()}: ${mediaBusContent.width}x${mediaBusContent.height}`;
  
  clearContainer.style.display = 'block';
  matchRatioBtn.style.display = 'inline-block';
  if (csaBtn) csaBtn.disabled = false;
  if (psBtn) psBtn.disabled = false;

  if (activeTool && MEDIA_TOOL_CLASSES.includes(activeTool.constructor.name) && typeof activeTool.regenerate === 'function') {
    activeTool.regenerate();
  }
}

function clearMediaBus() {
  if (mediaBusContent?.elt?.tagName === 'VIDEO') mediaBusContent.stop();
  mediaBusContent = null;
  
  document.getElementById('media-bus-preview').innerHTML = '<p class="placeholder-text">NO MEDIA LOADED</p>';
  document.getElementById('media-bus-filename').textContent = 'NO MEDIA LOADED';
  document.getElementById('media-clear-container').style.display = 'none';
  document.getElementById('media-match-ratio-btn').style.display = 'none';
  
  const csaBtn = document.getElementById('csa-analyze-btn');
  if (csaBtn) csaBtn.disabled = true;
  const psBtn = document.getElementById('ps-sort-btn');
  if (psBtn) psBtn.disabled = true;
}

function highlightDropZone() { document.getElementById('canvas-wrapper').classList.add('drag-over'); }
function unhighlightDropZone() { document.getElementById('canvas-wrapper').classList.remove('drag-over'); }

function seedGameOfLifeFromArtboard() {
  if (!gameOfLifeGrid || !artboard) return;
  artboard.loadPixels();
  if (artboard.pixels.length === 0) return;

  for (let x = 0; x < gameOfLifeCols; x++) {
    for (let y = 0; y < gameOfLifeRows; y++) {
      const artboardX = floor(x * gameOfLifeCellSize);
      const artboardY = floor(y * gameOfLifeCellSize);
      const index = (artboardY * artboard.width + artboardX) * 4;
      const r = artboard.pixels[index];
      const g = artboard.pixels[index + 1];
      const b = artboard.pixels[index + 2];
      const bright = (r + g + b) / 3; // Simple brightness calculation
      gameOfLifeGrid[x][y] = bright > gameOfLifeThreshold ? 1 : 0;
    }
  }
}

function enableGOLAndSeed() {
  gameOfLifeEnabled = true;
  justEnabledGOL = true;
  reinitializeGOLGrid();
  seedGameOfLifeFromArtboard();
}

function disableGOL() { gameOfLifeEnabled = false; }

function clearGOLGrid() {
  if (!gameOfLifeGrid) return;
  for (let x = 0; x < gameOfLifeCols; x++) for (let y = 0; y < gameOfLifeRows; y++) gameOfLifeGrid[x][y] = 0;
}

function randomizeGOLGrid() {
  if (!gameOfLifeGrid) return;
  for (let x = 0; x < gameOfLifeCols; x++) for (let y = 0; y < gameOfLifeRows; y++) gameOfLifeGrid[x][y] = Math.random() > 0.5 ? 1 : 0;
}
