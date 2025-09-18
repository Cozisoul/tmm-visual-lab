/**
 * This script handles the main UI interactions, tool selection, and control binding for the Creative Coding Workbench.
 * It acts as the "controller" in a Model-View-Controller pattern, connecting the UI (view) to the tool logic (model).
 */
document.addEventListener('DOMContentLoaded', () => {
  const MEDIA_TOOLS = ['universalRasterizer', 'videoSampler', 'colorSystemAnalyzer', 'pixelSorter'];
  // Define tools that have export limitations
  const SVG_INCOMPATIBLE_TOOLS = [
    'objectRasterizer3D', 'particleEngine', 'generativeComposer', 
    'videoSampler', 'universalRasterizer', 'colorSystemAnalyzer', 'pixelSorter'
  ];
  const ADDITIVE_TOOLS = ['generativeComposer', 'particleEngine']; // Tools that build up over time and don't support transparent export well

  const toolUpdateFunctions = {};

  // --- UI INITIALIZATION ---

  /**
   * Sets up the click handlers for the tool selection list in the left-hand library column.
   * Handles loading the tool, updating the UI to show the correct controls, and syncing state.
   */
  const setupToolSelection = () => {
    const toolSelectors = document.querySelectorAll('.tutorial-item');
    const toolControlPanels = document.querySelectorAll('.tool-controls');
    const toolkitFooter = document.getElementById('toolkit-footer');
    const dropHint = document.querySelector('.drop-hint');
    const exportSvgBtn = document.getElementById('global-export-svg');
    const transparentBgInput = document.getElementById('global-export-transparent-bg');
    const transparentBgLabel = document.querySelector('label[for="global-export-transparent-bg"]');

    toolSelectors.forEach(selector => {
      selector.addEventListener('click', async () => {
        const toolName = selector.dataset.tool;
        
        // Call the global function from sketch.js to load the tool
        if (typeof loadTool === 'function') {
          await loadTool(toolName);
        } else {
          console.error('loadTool function is not defined. Is sketch.js loaded?');
          return;
        }

        // 1. Update active button state in the library
        toolSelectors.forEach(s => s.classList.remove('active'));
        selector.classList.add('active');

        // 2. Show the corresponding controls in the toolkit
        toolControlPanels.forEach(panel => 
          panel.classList.toggle('active', panel.id === `${toolName}-controls`)
        );

        // 3. Update drop hint visibility
        if (dropHint) {
          dropHint.style.display = MEDIA_TOOLS.includes(toolName) ? 'block' : 'none';
        }

        // 4. Update the Toolkit footer status
        if (toolkitFooter) {
          const toolTitle = selector.querySelector('.tutorial-title').textContent;
          toolkitFooter.textContent = `TOOL: ${toolTitle.toUpperCase()}`;
        }

        // 5. Handle Export Compatibility
        if (exportSvgBtn) {
          const isSvgCompatible = !SVG_INCOMPATIBLE_TOOLS.includes(toolName);
          exportSvgBtn.disabled = !isSvgCompatible;
          exportSvgBtn.title = isSvgCompatible ? 'Export as SVG' : 'SVG export is not supported for this tool.';
        }

        if (transparentBgInput && transparentBgLabel) {
          // VideoSampler has its own logic, so we only handle the other additive tools here.
          const isAdditive = ADDITIVE_TOOLS.includes(toolName);
          transparentBgInput.disabled = isAdditive;
          transparentBgLabel.style.color = isAdditive ? 'var(--c-disabled)' : 'inherit';
          if (isAdditive) {
            transparentBgInput.checked = false;
            transparentBgInput.title = 'Transparent background is not supported for this tool.';
          } else {
            // For all other tools, ensure it's enabled and title is cleared.
            transparentBgInput.title = '';
          }
        }

        // 6. Sync the newly loaded tool with the current UI control values
        if (toolUpdateFunctions[toolName]) {
          toolUpdateFunctions[toolName]();
        }
      });
    });
  };

  /**
   * Sets up event listeners for global controls that affect the entire application,
   * such as artboard size, media bus, global effects (Game of Life), and the export panel.
   */
  const setupGlobalControls = () => {
    // Artboard Settings
    const sizeSelector = document.getElementById('artboard-size');
    sizeSelector?.addEventListener('change', () => {
      const [w, h] = sizeSelector.value.split('x').map(dim => parseInt(dim, 10));
      if (w > 0 && h > 0 && typeof resizeArtboard === 'function') resizeArtboard(w, h);
    });

    const bgColorPicker = document.getElementById('artboard-bg-color');
    bgColorPicker?.addEventListener('input', () => {
      if (typeof artboardBackgroundColor !== 'undefined') {
        artboardBackgroundColor = bgColorPicker.value;
      }
    });

    const globalZoomSlider = document.getElementById('global-view-zoom');
    globalZoomSlider?.addEventListener('input', () => {
      if (typeof globalViewZoom !== 'undefined') {
        globalViewZoom = parseFloat(globalZoomSlider.value);
      }
    });
    // Media Bus
    document.getElementById('media-match-ratio-btn')?.addEventListener('click', () => {
      if (mediaBusContent && mediaBusContent.originalWidth && mediaBusContent.originalHeight && typeof resizeArtboard === 'function') {
        let w = mediaBusContent.originalWidth;
        let h = mediaBusContent.originalHeight;
        const maxDim = 1920;
        if (w > maxDim || h > maxDim) {
          const ratio = w / h;
          if (w > h) [w, h] = [maxDim, Math.floor(maxDim / ratio)];
          else [w, h] = [Math.floor(maxDim * ratio), maxDim];
        }
        resizeArtboard(w, h);
      }
    });
    document.getElementById('media-clear-btn')?.addEventListener('click', () => { if (typeof clearMediaBus === 'function') clearMediaBus(); });

    // Global Animation & FX Controls
    const animationToggle = document.getElementById('global-animation-toggle');
    animationToggle?.addEventListener('change', () => {
      if (animationToggle.checked) {
        if (typeof loop === 'function') loop();
      } else {
        if (typeof noLoop === 'function') noLoop();
      }
    });

    const golToggle = document.getElementById('fx-game-of-life-toggle');
    const golMode = document.getElementById('fx-game-of-life-mode');
    const golThreshold = document.getElementById('fx-game-of-life-threshold');
    const golCellSize = document.getElementById('fx-game-of-life-cell-size');
    const golSpeed = document.getElementById('fx-game-of-life-speed');
    const golClear = document.getElementById('fx-game-of-life-clear');
    const golRandom = document.getElementById('fx-game-of-life-random');
    const golLinkToggle = document.getElementById('fx-game-of-life-link-toggle');

    golToggle?.addEventListener('change', () => { if (golToggle.checked) enableGOLAndSeed(); else disableGOL(); });
    golMode?.addEventListener('change', () => { gameOfLifeMode = golMode.value; });
    golThreshold?.addEventListener('input', () => { gameOfLifeThreshold = parseInt(golThreshold.value, 10); if (gameOfLifeEnabled && typeof seedGameOfLifeFromArtboard === 'function') seedGameOfLifeFromArtboard(); });
    golCellSize?.addEventListener('input', () => { gameOfLifeCellSize = parseInt(golCellSize.value, 10); if (typeof reinitializeGOLGrid === 'function') { reinitializeGOLGrid(); if (gameOfLifeEnabled && typeof seedGameOfLifeFromArtboard === 'function') seedGameOfLifeFromArtboard(); } });
    golSpeed?.addEventListener('input', () => { gameOfLifeSpeed = parseInt(golSpeed.value, 10); });
    golClear?.addEventListener('click', () => { if (typeof clearGOLGrid === 'function') clearGOLGrid(); });
    golRandom?.addEventListener('click', () => { if (typeof randomizeGOLGrid === 'function') randomizeGOLGrid(); });
    golLinkToggle?.addEventListener('change', () => { golLinkEnabled = golLinkToggle.checked; });

    // Audio Reactivity
    const audioReactivityToggle = document.getElementById('global-audio-reactivity-toggle');
    audioReactivityToggle?.addEventListener('change', async () => {
      isAudioReactive = audioReactivityToggle.checked;
      if (isAudioReactive) {
        await audioAnalyzer.init();
      }
      audioAnalyzer.setEnabled(isAudioReactive);
    });

    // Persistent Export Panel Setup
    const filenameInput = document.getElementById('global-export-filename');
    const exportPngBtn = document.getElementById('global-export-png');
    const exportSvgBtn = document.getElementById('global-export-svg');
    const exportGifBtn = document.getElementById('global-export-gif');
    const exportVideoBtn = document.getElementById('global-export-video');
    const transparentBgInput = document.getElementById('global-export-transparent-bg');
    const durationInput = document.getElementById('global-export-duration');
    const qualitySelect = document.getElementById('global-export-quality');
    const allExportInputs = [filenameInput, exportPngBtn, exportSvgBtn, exportGifBtn, transparentBgInput, durationInput, qualitySelect];
    const statusEl = document.getElementById('global-export-status');
    let videoRecordInterval = null;

    exportPngBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (!artboard) return;
      const isTransparent = transparentBgInput.checked;
      if (isTransparent) {
        const tempBuffer = createGraphics(artboard.width, artboard.height);
        if (activeTool && typeof activeTool.draw === 'function') {
          activeTool.draw(tempBuffer, mediaBusContent, gameOfLifeEnabled ? gameOfLifeGrid : null, { noBackground: true });
        }
        saveCanvas(tempBuffer, filename, 'png');
        tempBuffer.remove();
      } else {
        saveCanvas(artboard, filename, 'png');
      }
    });

    exportSvgBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (activeTool && artboard) {
        try {
          const svg = createGraphics(artboard.width, artboard.height, SVG);
          if (typeof activeTool.draw === 'function') {
            activeTool.draw(svg, null, null, { noBackground: true });
          }
          save(svg, `${filename}.svg`);
          svg.remove();
          statusEl.textContent = 'SVG saved successfully.'; statusEl.style.display = 'block'; setTimeout(() => { statusEl.style.display = 'none'; }, 2000);
        } catch (e) { console.error('SVG Export failed:', e); statusEl.textContent = 'ERROR: SVG export failed. See console.'; statusEl.style.display = 'block'; }
      }
    });
    
    const stopRecording = (format) => {
      if (!isRecording || !capturer) return;

      if (videoRecordInterval) clearInterval(videoRecordInterval);
      videoRecordInterval = null;

      isRecording = false;
      const btn = format === 'webm' ? exportVideoBtn : exportGifBtn;
      btn.textContent = 'COMPILING...';
      btn.disabled = true;
      statusEl.textContent = 'Compiling and saving video...';
      
      try {
        capturer.stop();
        // When a callback is provided, CCapture returns a blob and does not trigger download.
        // We must handle the download manually.
        capturer.save(blob => {
          const filename = (filenameInput.value || 'artwork') + `.${format}`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          // Now do the cleanup
          capturer = null;
          if (format === 'webm') { // This is the only video format we handle
            exportVideoBtn.textContent = 'RECORD VIDEO (WEBM)';
          } else {
            exportGifBtn.textContent = 'RECORD GIF';
          }
          btn.disabled = false;

          statusEl.style.display = 'none';
          [...allExportInputs, exportVideoBtn].forEach(i => { if(i) i.disabled = false; });
        });
      } catch (e) {
        console.error('Error while saving capture:', e);
        statusEl.textContent = 'ERROR: saving video failed.';
        [...allExportInputs, exportVideoBtn].forEach(i => { if(i) i.disabled = false; });
      }
    };

    const startRecording = (format) => {
      if (isRecording) return;
      if (typeof CCapture === 'undefined') { statusEl.textContent = 'ERROR: CCapture.js not found.'; statusEl.style.display = 'block'; return; }

      const filename = filenameInput.value || 'artwork';
      const fps = 30;
      const duration = Math.max(1, parseInt(durationInput?.value || 5, 10));
      const quality = format === 'webm' ? Math.round(Math.max(0.1, Math.min(1, parseFloat(qualitySelect?.value || '0.8'))) * 100) : 10;

      const settings = {
        format: format,
        framerate: fps,
        name: filename,
        quality: quality,
        verbose: false
      };

      try {
        capturer = new CCapture(settings);
      } catch (e) {
        console.error('Failed to initialize CCapture:', e);
        statusEl.textContent = 'ERROR: recorder failed. See console.';
        statusEl.style.display = 'block';
        return;
      }

      isRecording = true;
      capturer.start();

      const btn = format === 'webm' ? exportVideoBtn : exportGifBtn;
      btn.textContent = `STOP (0/${duration}s)`;
      statusEl.textContent = `RECORDING...`;
      statusEl.style.display = 'block';
      [...allExportInputs, exportVideoBtn, exportGifBtn].forEach(i => { if(i) i.disabled = true; });

      const startTime = Date.now();
      videoRecordInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        btn.textContent = `STOP (${elapsed}/${duration}s)`;
        if (elapsed >= duration) {
          stopRecording(format);
        }
      }, 1000);
    };

    exportVideoBtn?.addEventListener('click', () => {
      if (isRecording) stopRecording('webm');
      else startRecording('webm');
    });

    exportGifBtn?.addEventListener('click', () => {
      if (isRecording) {
        stopRecording('gif');
      } else {
        startRecording('gif');
      }
    });
  };

  /**
   * Sets up the bindings for each individual tool's controls.
   */
  const setupToolControls = () => {
    const bindControls = (toolKey, setupFn) => {
      const updateFn = setupFn();
      if (updateFn) toolUpdateFunctions[toolKey] = updateFn;
    };

    // ... (other tool bindings are omitted for brevity) ...
    bindControls('gridArchitect', () => {
      const inputs = {
        layoutType: document.getElementById('ga-layout-type'),
        cols: document.getElementById('ga-cols'),
        rows: document.getElementById('ga-rows'),
        marginX: document.getElementById('ga-margin-x'),
        marginY: document.getElementById('ga-margin-y'),
        gutterX: document.getElementById('ga-gutter-x'),
        gutterY: document.getElementById('ga-gutter-y'),
        cellShape: document.getElementById('ga-cell-shape'),
        cellText: document.getElementById('ga-cell-text'),
        textColor: document.getElementById('ga-text-color'),
        textSize: document.getElementById('ga-text-size'),
        lineWeight: document.getElementById('ga-line-weight'),
        lineColor: document.getElementById('ga-line-color'),
        fillColor: document.getElementById('ga-fill-color'),
        showGrid: document.getElementById('ga-show-grid'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'GridArchitect') return;
        const tool = activeTool;
        tool.layoutType = inputs.layoutType.value;
        tool.cols = parseInt(inputs.cols.value, 10);
        tool.rows = parseInt(inputs.rows.value, 10);
        tool.marginX = parseInt(inputs.marginX.value, 10);
        tool.marginY = parseInt(inputs.marginY.value, 10);
        tool.gutterX = parseInt(inputs.gutterX.value, 10);
        tool.gutterY = parseInt(inputs.gutterY.value, 10);
        tool.cellShape = inputs.cellShape.value;
        tool.cellText = inputs.cellText.value;
        tool.textColor = inputs.textColor.value;
        tool.textSizeRatio = parseInt(inputs.textSize.value, 10) / 100;
        tool.lineWeight = parseFloat(inputs.lineWeight.value);
        tool.lineColor = inputs.lineColor.value;
        tool.fillColor = inputs.fillColor.value;
        tool.showGrid = inputs.showGrid.checked;
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });

    bindControls('posterComposer', () => {
      const inputs = {
        preset: document.getElementById('pc-preset'),
        imageBlocks: document.getElementById('pc-image-blocks'),
        textBlocks: document.getElementById('pc-text-blocks'),
        imageColor: document.getElementById('pc-image-color'),
        textColor: document.getElementById('pc-text-color'),
        blockScale: document.getElementById('pc-block-scale'),
        regenerateBtn: document.getElementById('pc-regenerate-btn'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'PosterComposer') return;
        const tool = activeTool;
        const oldPreset = tool.preset;
        tool.preset = inputs.preset.value;
        tool.imageBlocks = parseInt(inputs.imageBlocks.value, 10);
        tool.textBlocks = parseInt(inputs.textBlocks.value, 10);
        tool.imageColor = inputs.imageColor.value;
        tool.textColor = inputs.textColor.value;
        tool.blockScale = parseFloat(inputs.blockScale.value);
        if (tool.preset !== oldPreset) {
          tool.regenerate();
        }
      };

      Object.values(inputs).forEach(input => {
        if (input && input.id !== 'pc-regenerate-btn') {
          const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });
      
      inputs.regenerateBtn?.addEventListener('click', () => {
        if (activeTool?.constructor.name === 'PosterComposer') {
          activeTool.regenerate();
        }
      });

      return update;
    });

    bindControls('bauhausAssembler', () => {
      const inputs = {
        elementCount: document.getElementById('ba-element-count'),
        maxSize: document.getElementById('ba-max-size'),
        colorPalette: document.getElementById('ba-color-palette'),
        allowOverlap: document.getElementById('ba-allow-overlap'),
        regenerateBtn: document.getElementById('ba-regenerate-btn'),
      };

      const updateAndRegenerate = () => {
        if (activeTool?.constructor.name !== 'BauhausAssembler') return;
        const tool = activeTool;
        tool.elementCount = parseInt(inputs.elementCount.value, 10);
        tool.maxSize = parseInt(inputs.maxSize.value, 10);
        tool.colorPalette = inputs.colorPalette.value;
        tool.allowOverlap = inputs.allowOverlap.checked;
        if (typeof tool.regenerate === 'function') {
          tool.regenerate();
        }
      };

      inputs.elementCount.addEventListener('input', updateAndRegenerate);
      inputs.maxSize.addEventListener('input', updateAndRegenerate);
      inputs.colorPalette.addEventListener('change', updateAndRegenerate);
      inputs.allowOverlap.addEventListener('change', updateAndRegenerate);
      inputs.regenerateBtn.addEventListener('click', updateAndRegenerate);

      return updateAndRegenerate;
    });

    bindControls('kineticTypeEngine', () => {
      const inputs = {
        text: document.getElementById('kte-text'),
        repetitions: document.getElementById('kte-repetitions'),
        lineCount: document.getElementById('kte-line-count'),
        fontSize: document.getElementById('kte-font-size'),
        uppercase: document.getElementById('kte-uppercase'),
        algorithm: document.getElementById('kte-algorithm'),
        speed: document.getElementById('kte-speed'),
        amplitude: document.getElementById('kte-amplitude'),
        tracking: document.getElementById('kte-tracking'),
        color: document.getElementById('kte-color'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'KineticTypeEngine') return;
        const tool = activeTool;
        tool.text = inputs.text.value;
        tool.repetitions = parseInt(inputs.repetitions.value, 10);
        tool.lineCount = parseInt(inputs.lineCount.value, 10);
        tool.fontSize = parseInt(inputs.fontSize.value, 10);
        tool.isUppercase = inputs.uppercase.checked;
        tool.algorithm = inputs.algorithm.value;
        tool.speed = parseFloat(inputs.speed.value);
        tool.amplitude = parseInt(inputs.amplitude.value, 10);
        tool.tracking = parseInt(inputs.tracking.value, 10);
        tool.color = inputs.color.value;
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });

    bindControls('glyphDeconstructor', () => {
      const inputs = {
        text: document.getElementById('gd-text'),
        lineCount: document.getElementById('gd-line-count'),
        scale: document.getElementById('gd-scale'),
        jitter: document.getElementById('gd-jitter'),
        rotation: document.getElementById('gd-rotation'),
        color: document.getElementById('gd-color'),
        deconstructBtn: document.getElementById('gd-deconstruct-btn'),
      };

      const updateAndRegenerate = () => {
        if (activeTool?.constructor.name !== 'GlyphDeconstructor') return;
        const tool = activeTool;
        tool.text = inputs.text.value;
        tool.lineCount = parseInt(inputs.lineCount.value, 10);
        tool.scale = parseFloat(inputs.scale.value);
        tool.jitter = parseInt(inputs.jitter.value, 10);
        tool.rotation = parseInt(inputs.rotation.value, 10);
        tool.color = inputs.color.value;
        if (typeof tool.regenerate === 'function') {
          tool.regenerate();
        }
      };

      // All controls for this tool trigger a regeneration
      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.tagName === 'BUTTON' ? 'click' : 'input';
          input.addEventListener(eventType, updateAndRegenerate);
        }
      });

      return updateAndRegenerate;
    });

    bindControls('waveformSynthesizer', () => {
      const inputs = {
        mode: document.getElementById('ws-mode'),
        waveform: document.getElementById('ws-waveform'),
        amp: document.getElementById('ws-amp'),
        freq: document.getElementById('ws-freq'),
        lineCount: document.getElementById('ws-line-count'),
        timeSpeed: document.getElementById('ws-time'),
        phase: document.getElementById('ws-phase'),
        noiseAmount: document.getElementById('ws-noise-amount'),
        color: document.getElementById('ws-color'),
        lineWeight: document.getElementById('ws-line-weight'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'WaveformSynthesizer') return;
        const tool = activeTool;
        tool.mode = inputs.mode.value;
        tool.waveform = inputs.waveform.value;
        tool.amp = parseInt(inputs.amp.value, 10);
        tool.freq = parseInt(inputs.freq.value, 10);
        tool.lineCount = parseInt(inputs.lineCount.value, 10);
        tool.timeSpeed = parseFloat(inputs.timeSpeed.value);
        tool.phase = parseInt(inputs.phase.value, 10);
        tool.noiseAmount = parseInt(inputs.noiseAmount.value, 10);
        tool.color = inputs.color.value;
        tool.lineWeight = parseInt(inputs.lineWeight.value, 10);
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });

    bindControls('universalRasterizer', () => {
      const inputs = {
        cellSize: document.getElementById('ur-cell-size'),
        mode: document.getElementById('ur-mode'),
        shape: document.getElementById('ur-shape'),
        threshold: document.getElementById('ur-threshold'),
        invert: document.getElementById('ur-invert'),
        rasterColor: document.getElementById('ur-raster-color'),
        text: document.getElementById('ur-text'),
        textColor: document.getElementById('ur-text-color'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'UniversalRasterizer') return;
        const tool = activeTool;
        tool.cellSize = parseInt(inputs.cellSize.value, 10);
        tool.mode = inputs.mode.value;
        tool.shape = inputs.shape.value;
        tool.threshold = parseInt(inputs.threshold.value, 10);
        tool.invert = inputs.invert.checked;
        tool.rasterColor = inputs.rasterColor.value;
        tool.text = inputs.text.value;
        tool.textColor = inputs.textColor.value;
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });

    bindControls('videoSampler', () => {
      const inputs = {
        mode: document.getElementById('vs-mode'),
        slitPosition: document.getElementById('vs-slit-position'),
        slitDirection: document.getElementById('vs-slit-direction'),
        cols: document.getElementById('vs-cols'),
      };
      const transparentBgInput = document.getElementById('global-export-transparent-bg');
      const transparentBgLabel = document.querySelector('label[for="global-export-transparent-bg"]');

      const update = () => {
        if (activeTool?.constructor.name !== 'VideoSampler') return;
        const tool = activeTool;
        const oldMode = tool.mode;
        tool.mode = inputs.mode.value;
        tool.slitPosition = parseInt(inputs.slitPosition.value, 10);
        tool.slitDirection = inputs.slitDirection.value;
        tool.cols = parseInt(inputs.cols.value, 10);

        // Special handling for transparent BG based on mode
        if (transparentBgInput && transparentBgLabel) {
          const isSlitScan = tool.mode === 'slit-scan';
          transparentBgInput.disabled = isSlitScan;
          transparentBgLabel.style.color = isSlitScan ? 'var(--c-disabled)' : 'inherit';
          
          if (isSlitScan) {
            transparentBgInput.checked = false;
            transparentBgInput.title = 'Transparent background is not supported for slit-scan mode.';
          } else {
            transparentBgInput.title = '';
          }
        }

        if (tool.mode !== oldMode && typeof tool.regenerate === 'function') {
          tool.regenerate();
        }
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });

    bindControls('colorSystemAnalyzer', () => {
      const inputs = {
        paletteSize: document.getElementById('csa-palette-size'),
        analyzeBtn: document.getElementById('csa-analyze-btn'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'ColorSystemAnalyzer') return;
        activeTool.paletteSize = parseInt(inputs.paletteSize.value, 10);
      };

      inputs.paletteSize.addEventListener('input', update);
      inputs.analyzeBtn.addEventListener('click', () => {
        if (activeTool?.constructor.name === 'ColorSystemAnalyzer' && typeof activeTool.analyze === 'function') {
          activeTool.analyze(mediaBusContent);
        }
      });

      return update;
    });

    bindControls('generativeComposer', () => {
      const inputs = {
        elements: document.getElementById('gc-elements'),
        brushSize: document.getElementById('gc-brush-size'),
        stepSize: document.getElementById('gc-step-size'),
        regenerateBtn: document.getElementById('gc-regenerate-btn'),
      };

      const updateLive = () => {
        if (activeTool?.constructor.name !== 'GenerativeComposer') return;
        activeTool.brushSize = parseInt(inputs.brushSize.value, 10);
        activeTool.stepSize = parseFloat(inputs.stepSize.value);
      };

      const updateAndRegenerate = () => {
        if (activeTool?.constructor.name !== 'GenerativeComposer') return;
        activeTool.elementCount = parseInt(inputs.elements.value, 10);
        if (typeof activeTool.regenerate === 'function') {
          activeTool.regenerate();
        }
      };

      inputs.elements.addEventListener('input', updateAndRegenerate);
      inputs.regenerateBtn.addEventListener('click', updateAndRegenerate);
      inputs.brushSize.addEventListener('input', updateLive);
      inputs.stepSize.addEventListener('input', updateLive);

      // Function to run on tool switch, ensures all values are synced and walkers are regenerated.
      return () => { updateLive(); updateAndRegenerate(); };
    });

    bindControls('pixelSorter', () => {
      const inputs = {
        sortMode: document.getElementById('ps-sort-mode'),
        direction: document.getElementById('ps-direction'),
        threshold: document.getElementById('ps-threshold'),
        sortBtn: document.getElementById('ps-sort-btn'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'PixelSorter') return;
        const tool = activeTool;
        tool.sortMode = inputs.sortMode.value;
        tool.direction = inputs.direction.value;
        tool.threshold = parseInt(inputs.threshold.value, 10);
      };

      inputs.sortMode.addEventListener('change', update);
      inputs.direction.addEventListener('change', update);
      inputs.threshold.addEventListener('input', update);
      
      inputs.sortBtn?.addEventListener('click', () => {
        if (activeTool?.constructor.name === 'PixelSorter' && typeof activeTool.sort === 'function') {
          // The sort button is disabled/enabled in sketch.js when media is loaded/cleared
          activeTool.sort(mediaBusContent);
        }
      });

      return update;
    });

    bindControls('truchetTiler', () => {
      const inputs = {
        tileSize: document.getElementById('tt-tile-size'),
        density: document.getElementById('tt-density'),
        animSpeed: document.getElementById('tt-anim-speed'),
        lineWeight: document.getElementById('tt-line-weight'),
        strokeColor: document.getElementById('tt-stroke-color'),
        backgroundColor: document.getElementById('tt-bg-color'),
        regenerateBtn: document.getElementById('tt-regenerate-btn'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'TruchetTiler') return;
        const tool = activeTool;
        const oldTileSize = tool.tileSize;
        const oldDensity = tool.density;

        tool.tileSize = parseInt(inputs.tileSize.value, 10);
        tool.density = parseInt(inputs.density.value, 10);
        tool.animSpeed = parseInt(inputs.animSpeed.value, 10);
        tool.lineWeight = parseFloat(inputs.lineWeight.value);
        tool.strokeColor = inputs.strokeColor.value;
        tool.backgroundColor = inputs.backgroundColor.value;
        
        if (tool.tileSize !== oldTileSize || tool.density !== oldDensity) {
            tool.regenerate();
        }
      };

      Object.values(inputs).forEach(input => {
        if (input && input.id !== 'tt-regenerate-btn') {
          const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });
      
      inputs.regenerateBtn?.addEventListener('click', () => {
        if (activeTool?.constructor.name === 'TruchetTiler') {
          activeTool.regenerate();
        }
      });

      return update;
    });

    bindControls('particleEngine', () => {
      const inputs = {
        bounce: document.getElementById('pe-bounce'),
        emitFromMouse: document.getElementById('pe-emit-from-mouse'),
        rate: document.getElementById('pe-rate'),
        lifespan: document.getElementById('pe-lifespan'),
        size: document.getElementById('pe-size'),
        color: document.getElementById('pe-color'),
        useNoise: document.getElementById('pe-noise-field'),
        gravity: document.getElementById('pe-gravity'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'ParticleEngine') return;
        const tool = activeTool;
        tool.bounce = inputs.bounce.checked;
        tool.emitFromMouse = inputs.emitFromMouse.checked;
        tool.rate = parseInt(inputs.rate.value, 10);
        tool.lifespan = parseInt(inputs.lifespan.value, 10);
        tool.size = parseInt(inputs.size.value, 10);
        tool.color = inputs.color.value;
        tool.useNoise = inputs.useNoise.checked;
        tool.gravity = parseFloat(inputs.gravity.value);
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.type === 'checkbox' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });

    bindControls('rhythmSequencer', () => {
      const inputs = {
        bpm: document.getElementById('rs-bpm'),
        steps: document.getElementById('rs-steps'),
        audioToggle: document.getElementById('rs-audio-toggle'),
        detectBpm: document.getElementById('rs-detect-bpm'),
        masterVolume: document.getElementById('rs-master-volume'),
        showViz: document.getElementById('rs-show-viz'),
        gridContainer: document.getElementById('rs-sequencer-grid'),
      };

      const generateGrid = (stepCount) => {
        if (!inputs.gridContainer) return;
        inputs.gridContainer.innerHTML = '';
        inputs.gridContainer.style.setProperty('--rs-grid-cols', stepCount);
        const numRows = 4; // kick, snare, hat, openHat
        for (let i = 0; i < numRows * stepCount; i++) {
          const step = document.createElement('div');
          step.classList.add('rs-step');
          step.addEventListener('click', () => {
            step.classList.toggle('active');
            if (activeTool?.constructor.name === 'RhythmSequencer') {
              activeTool.updatePatternFromUI();
            }
          });
          inputs.gridContainer.appendChild(step);
        }
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'RhythmSequencer') return;
        const tool = activeTool;
        
        const newStepCount = parseInt(inputs.steps.value, 10);
        if (tool.steps !== newStepCount) {
          tool.setStepCount(newStepCount);
          generateGrid(newStepCount);
        }

        tool.bpm = parseInt(inputs.bpm.value, 10);
        tool.toggleAudio(inputs.audioToggle.checked);
        tool.detectBpm = inputs.detectBpm.checked;
        tool.masterVolume = parseFloat(inputs.masterVolume.value);
        tool.showVisualizer = inputs.showViz.checked;
        tool.updatePatternFromUI(); // Sync pattern on any change
      };

      // Initial grid generation
      generateGrid(parseInt(inputs.steps.value, 10));

      // Add listeners to main controls
      inputs.bpm.addEventListener('input', update);
      inputs.steps.addEventListener('change', update);
      inputs.audioToggle.addEventListener('change', update);
      inputs.detectBpm.addEventListener('change', update);
      inputs.masterVolume.addEventListener('input', update);
      inputs.showViz.addEventListener('change', update);
      
      return update;
    });

    bindControls('objectRasterizer3D', () => {
      const inputs = {
        shape: document.getElementById('or-shape'),
        text: document.getElementById('or-text'),
        fontSize: document.getElementById('or-font-size'),
        extrude: document.getElementById('or-extrude'),
        renderMode: document.getElementById('or-render-mode'),
        material: document.getElementById('or-material'),
        pixelSize: document.getElementById('or-pixel-size'),
        rasterPalette: document.getElementById('or-raster-palette'),
        colorTheme: document.getElementById('or-color-theme'),
        warp: document.getElementById('or-warp'),
        color: document.getElementById('or-color'),
        particlesEnabled: document.getElementById('or-particles-enabled'),
        particleRate: document.getElementById('or-particle-rate'),
        particleGravity: document.getElementById('or-particle-gravity'),
        particleColor: document.getElementById('or-particle-color'),
        rhythmEnabled: document.getElementById('or-rhythm-enabled'),
        camera: document.getElementById('or-camera'),
        zoom: document.getElementById('or-zoom'),
        rotationX: document.getElementById('or-rotation-x'),
        rotationY: document.getElementById('or-rotation-y'),
        rotationZ: document.getElementById('or-rotation-z'),
        autoRotate: document.getElementById('or-auto-rotate'),
        grid: document.getElementById('or-grid'),
        shadows: document.getElementById('or-shadows'),
        gridSize: document.getElementById('or-grid-size')
      };

      // Get containers for visibility toggling
      const textSettingsDiv = document.querySelector('#objectRasterizer3D-controls .text-settings');
      const warpGroup = inputs.warp?.closest('.control-group');
      const particleSettingsDiv = document.querySelector('#objectRasterizer3D-controls .particle-settings');
      const rasterSettingsDiv = document.querySelector('#objectRasterizer3D-controls .raster-settings');
      const renderModeLabel = document.querySelector('label[for="or-render-mode"]');
      const colorLabel = document.querySelector('label[for="or-color"]');

      const updateUiState = () => {
        const isText = inputs.shape.value === 'text';
        const isWarped = inputs.material.value === 'warped';
        const isRaster = inputs.material.value === 'raster';
        const isBasicMaterial = inputs.material.value === 'basic';
        const isCustomColor = inputs.colorTheme.value === 'custom';
        const particlesOn = inputs.particlesEnabled.checked;

        if (textSettingsDiv) textSettingsDiv.style.display = isText ? 'block' : 'none';
        if (warpGroup) warpGroup.style.display = isWarped ? 'flex' : 'none';
        if (particleSettingsDiv) particleSettingsDiv.style.display = particlesOn ? 'block' : 'none';
        if (rasterSettingsDiv) rasterSettingsDiv.style.display = isRaster ? 'block' : 'none';
        
        if (inputs.renderMode && renderModeLabel) {
          inputs.renderMode.disabled = !isBasicMaterial;
          renderModeLabel.style.color = isBasicMaterial ? 'inherit' : 'var(--c-disabled)';
        }
        
        if (inputs.color && colorLabel) {
          inputs.color.disabled = !isCustomColor;
          colorLabel.style.color = isCustomColor ? 'inherit' : 'var(--c-disabled)';
        }
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'ObjectRasterizer3D') return;

        const tool = activeTool;
        const oldText = tool.text;
        const oldFontSize = tool.fontSize;
        const oldExtrude = tool.extrude;

        tool.shape = inputs.shape.value;
        tool.text = inputs.text.value;
        tool.fontSize = parseInt(inputs.fontSize.value, 10);
        tool.extrude = parseInt(inputs.extrude.value, 10);
        tool.renderMode = inputs.renderMode.value;
        tool.materialType = inputs.material.value;
        tool.pixelSize = parseInt(inputs.pixelSize.value, 10);
        tool.rasterPalette = inputs.rasterPalette.value;
        tool.colorTheme = inputs.colorTheme.value;
        tool.warp = parseFloat(inputs.warp.value);
        tool.primaryColor = inputs.color.value;
        tool.particlesEnabled = inputs.particlesEnabled.checked;
        tool.particleRate = parseInt(inputs.particleRate.value, 10);
        tool.particleGravity = parseFloat(inputs.particleGravity.value);
        tool.particleColor = inputs.color.value;
        tool.rhythmEnabled = inputs.rhythmEnabled.checked;
        tool.cameraType = inputs.camera.value;
        tool.zoom = parseInt(inputs.zoom.value, 10);
        tool.rotationX = parseInt(inputs.rotationX.value, 10);
        tool.rotationY = parseInt(inputs.rotationY.value, 10);
        tool.rotationZ = parseInt(inputs.rotationZ.value, 10);
        tool.autoRotate = inputs.autoRotate.checked;
        tool.gridEnabled = inputs.grid.checked;
        tool.shadowsEnabled = inputs.shadows.checked;
        tool.gridSize = parseInt(inputs.gridSize.value, 10);

        if (tool.text !== oldText || tool.fontSize !== oldFontSize || tool.extrude !== oldExtrude) {
          tool.needsGeomUpdate = true;
        }

        // Update UI visibility based on new state
        updateUiState();
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.type === 'checkbox' || input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      return update;
    });
  };

  // Initialize all functionalities
  setupToolSelection();
  setupGlobalControls();
  setupToolControls();
});