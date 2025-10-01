// =================================================================================
// == TMM-OS / VISUAL-LAB: CORE SKETCH FILE
// =================================================================================
// This file contains the main p5.js setup() and draw() loops, which form the heart
// of the application. It manages the active tool, the off-screen artboard buffer,
// global effects like Game of Life, and the rendering pipeline.




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
  generativeCompositionLab: 'GenerativeCompositionLab',
  vectorFieldModulator: 'VectorFieldModulator',
  lSystemArchitect: 'LSystemArchitect',
  designOffice: 'DesignOffice',
  generativeGraphicsEngine: 'GenerativeGraphicsEngine',
  ideaGenerator: 'IdeaGenerator',
  creativeCodingWorkbench: 'CreativeCodingWorkbench',
  brandSystemTool: 'BrandSystemTool',
  libraryNotes: 'LibraryNotes'
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
let globalViewZoom = 0.8; // Start with a more reasonable zoom level

// Canvas sizing utilities for tools
let currentCanvasSize = { width: 0, height: 0 };
let currentArtboardSize = { width: 0, height: 0 };
let currentScale = 1.0;

// Simple position control (joystick-like)
let positionOffset = { x: 0, y: 0 };
let positionSpeed = 2;
let joystickEnabled = false;


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

let isDisplayScaled = true;

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
    // Use the globally available audioAnalyzer instance
    audioAnalyzer = window.audioAnalyzer;

    console.log("Loading default tool...");
    loadTool('gridArchitect');
    
    // Add window resize handler
    window.addEventListener('resize', () => {
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper && canvas) {
        // Add a small delay to ensure proper resizing
        setTimeout(() => {
        resizeCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
        }, 10);
      }
    });
    
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
    if (isRecording && !capturer) return;

    // --- GOL & Audio Logic ---
    if (gameOfLifeEnabled && frameCount % gameOfLifeSpeed === 0) {
      if (!justEnabledGOL) {
        updateGOLGrid();
        if (golLinkEnabled) modulateActiveToolWithGOL();
      } else {
        justEnabledGOL = false;
      }
    }
    const rawAudioLevel = isAudioReactive ? audioAnalyzer.getAmplitude() : 0;
    const adjustedAudioLevel = constrain(rawAudioLevel * audioSensitivity, 0, 1.0);
    if (gameOfLifeEnabled && golAudioSeedEnabled && isAudioReactive && adjustedAudioLevel > 0.3 && lastAudioLevelForGOL <= 0.3) {
      seedGameOfLifeFromArtboard();
    }
    lastAudioLevelForGOL = adjustedAudioLevel;

    // --- Drawing to Artboard ---
    if (activeTool && typeof activeTool.draw === 'function' && artboard) {
      const isTransparent = document.getElementById('global-export-transparent-bg')?.checked || false;
      
      // Determine if the background should be drawn. Additive tools manage their own background.
      const shouldDrawBackground = !isTransparent && !['GenerativeComposer', 'ParticleEngine'].includes(activeTool.constructor.name);

      artboard.push();
      if (shouldDrawBackground) {
        artboard.background(artboardBackgroundColor);
      } else if (isTransparent) {
        artboard.clear(); // Ensure transparency is fresh
      }
      
      // Pass the artboard as the graphics context for the tool to draw on
      activeTool.draw(artboard, mediaBusContent, gameOfLifeEnabled ? gameOfLifeGrid : null, {
        noBackground: !shouldDrawBackground,
        isAudioReactive: isAudioReactive,
        audioLevel: adjustedAudioLevel,
        backgroundColor: artboardBackgroundColor,
        zoom: globalViewZoom,
        canvasWidth: artboard.width,
        canvasHeight: artboard.height,
        scale: 1.0 
      });
      artboard.pop();
    }

    // --- Displaying Artboard on Main Canvas ---
    background(20); // Clear main canvas with a dark background
    
    if (artboard) {
      const scaleX = width / artboard.width;
      const scaleY = height / artboard.height;
      const scale = Math.min(scaleX, scaleY) * globalViewZoom;
      const drawW = artboard.width * scale;
      const drawH = artboard.height * scale;
      const drawX = (width - drawW) / 2 + positionOffset.x;
      const drawY = (height - drawH) / 2 + positionOffset.y;

      image(artboard, drawX, drawY, drawW, drawH);
      
      // Update mouse coordinates relative to the scaled and centered artboard
      artboardMouseX = (mouseX - drawX) / scale;
      artboardMouseY = (mouseY - drawY) / scale;
    }

    // --- Overlays and UI ---
    if (activeTool && typeof activeTool.drawOverlay === 'function') {
      activeTool.drawOverlay(this); // Draw overlay on the main canvas
    }
    
    if (joystickEnabled) {
      fill(0, 255, 0, 150);
      textAlign(LEFT, TOP);
      textSize(12);
      text(`Position Joystick: ON (WASD/Arrows to move, Space to reset)`, 10, 10);
      text(`Offset: X:${positionOffset.x.toFixed(1)}, Y:${positionOffset.y.toFixed(1)}`, 10, 25);
    }

    const frDisplay = document.getElementById('canvas-framerate-display');
    if (frDisplay && frameCount % 30 === 0) {
      frDisplay.textContent = `[FRAMERATE: ${frameRate().toFixed(0)} FPS]`;
    }

    // --- Recording ---
    if (isRecording && capturer) {
      capturer.capture(artboard.elt); // Capture the artboard element directly
    }

  } catch (error) {
    console.error("Critical error in draw loop:", error);
    if (activeTool?.cleanup) activeTool.cleanup();
    activeTool = null;
    noLoop();
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) wrapper.innerHTML = '<div class="error-message">An error occurred. Please refresh.</div>';
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
  // Create a 2D buffer for better text support - WEBGL has font loading issues
  artboard = createGraphics(w, h);
  artboard.colorMode(RGB, 255);
  artboard.drawingContext.canvas.willReadFrequently = true;
  console.log("Artboard resized and created as 2D buffer.");

  const sizeDisplay = document.getElementById('canvas-size-display');
  if (sizeDisplay) sizeDisplay.textContent = `[ARTBOARD: ${w}x${h}px]`;

  reinitializeGOLGrid();

  if (activeTool && typeof activeTool.regenerate === 'function') {
    // Pass the new dimensions to the regenerate function if it accepts them
    if (activeTool.regenerate.length === 2) {
        activeTool.regenerate(w, h);
    } else {
        activeTool.regenerate();
    }
  }

  if (activeTool && typeof activeTool.onResize === 'function') {
    activeTool.onResize(w, h);
  }
}

// Artboard system removed - working directly on main canvas

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
    
    // Show user-friendly error message
    const statusEl = document.getElementById('global-export-status');
    if (statusEl) {
      statusEl.textContent = `Error loading tool: ${toolName}. Check console for details.`;
      statusEl.style.display = 'block';
      statusEl.style.color = 'red';
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 5000);
    }
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

  if (tool.constructor.name === 'ObjectRasterizer3D') {
    if (golMetrics.density > 0.01) {
      tool.shape = 'gol';
      tool.cameraType = 'ortho';
      tool.rotationX = 35;
      tool.rotationY = -45;
      tool.autoRotate = false;
      tool.gridEnabled = true;
    }
  }
}

function resizeCanvas(w, h) {
  if (canvas) {
    canvas.resize(w, h);
  }
}

function windowResized() {
  const wrapper = document.getElementById('canvas-wrapper');
  if (wrapper) {
    // Add a small delay to ensure the wrapper has finished resizing
    setTimeout(() => {
      resizeCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
    }, 10);
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    saveCanvas('tmm-visual-lab-' + new Date().toISOString().slice(0, 19), 'png');
  } else if (key === 'g' || key === 'G') {
    gameOfLifeEnabled = !gameOfLifeEnabled;
    console.log('Game of Life:', gameOfLifeEnabled ? 'enabled' : 'disabled');
  } else if (key === 'l' || key === 'L') {
    golLinkEnabled = !golLinkEnabled;
    console.log('GOL Link:', golLinkEnabled ? 'enabled' : 'disabled');
  } else if (key === 'r' || key === 'R') {
    if (activeTool && typeof activeTool.regenerate === 'function') {
      activeTool.regenerate();
    }
  } else if (key === 'j' || key === 'J') {
    joystickEnabled = !joystickEnabled;
    console.log('Position Joystick:', joystickEnabled ? 'enabled' : 'disabled');
    console.log('Use WASD or Arrow Keys to move, Space to reset position');
    
    // Update HTML status
    const joystickStatus = document.getElementById('joystick-status');
    if (joystickStatus) {
      joystickStatus.style.display = joystickEnabled ? 'block' : 'none';
    }
  } else if (key === ' ') {
    // Reset position
    positionOffset = { x: 0, y: 0 };
    console.log('Position reset to center');
  }
  
  // Position controls (joystick)
  if (joystickEnabled) {
    if (key === 'w' || key === 'W' || keyCode === UP_ARROW) {
      positionOffset.y -= positionSpeed;
    } else if (key === 's' || key === 'S' || keyCode === DOWN_ARROW) {
      positionOffset.y += positionSpeed;
    } else if (key === 'a' || key === 'A' || keyCode === LEFT_ARROW) {
      positionOffset.x -= positionSpeed;
    } else if (key === 'd' || key === 'D' || keyCode === RIGHT_ARROW) {
      positionOffset.x += positionSpeed;
    }
  }
}

function reinitializeGOLGrid() {
  if (artboardWidth <= 0 || artboardHeight <= 0 || gameOfLifeCellSize <= 0) return;
  gameOfLifeCols = floor(artboardWidth / gameOfLifeCellSize);
  gameOfLifeRows = floor(artboardHeight / gameOfLifeCellSize);
  gameOfLifeGrid = new Array(gameOfLifeCols).fill(0).map(() => new Array(gameOfLifeRows).fill(0));
}

// Utility functions for tools to get proper canvas sizing
function getCanvasSize() {
  return { ...currentCanvasSize };
}

function getArtboardSize() {
  return { ...currentArtboardSize };
}

function getCanvasScale() {
  return currentScale;
}

function getOptimalCanvasSize() {
  // Return the optimal canvas size that tools should use
  const canvas = getCanvasSize();
  const artboard = getArtboardSize();
  const scale = getCanvasScale();
  
  return {
    width: Math.floor(canvas.width * scale),
    height: Math.floor(canvas.height * scale),
    scale: scale,
    centered: true
  };
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
