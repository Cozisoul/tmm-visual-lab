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
    const audioSensitivitySlider = document.getElementById('global-audio-sensitivity');

    audioReactivityToggle?.addEventListener('change', async () => {
      isAudioReactive = audioReactivityToggle.checked;
      if (isAudioReactive) {
        await audioAnalyzer.init();
      }
      audioAnalyzer.setEnabled(isAudioReactive);
    });

    audioSensitivitySlider?.addEventListener('input', () => {
      audioSensitivity = parseFloat(audioSensitivitySlider.value);
      audioAnalyzer.setSensitivity(audioSensitivity);
    });

    // Persistent Export Panel Setup
    const filenameInput = document.getElementById('global-export-filename');
    const exportPngBtn = document.getElementById('global-export-png');
    const exportSvgBtn = document.getElementById('global-export-svg');
    const exportGifBtn = document.getElementById('global-export-gif');
    const exportVideoBtn = document.getElementById('global-export-video');
    const exportHighResBtn = document.getElementById('global-export-highres');
    const exportJpgBtn = document.getElementById('global-export-jpg');
    const exportAllBtn = document.getElementById('global-export-all');
    const transparentBgInput = document.getElementById('global-export-transparent-bg');
    const includeOverlaysInput = document.getElementById('global-export-include-overlays');
    const exportScaleInput = document.getElementById('global-export-scale');
    const durationInput = document.getElementById('global-export-duration');
    const qualitySelect = document.getElementById('global-export-quality');
    const statusEl = document.getElementById('global-export-status');
    const allExportControls = [filenameInput, exportPngBtn, exportSvgBtn, exportGifBtn, exportVideoBtn, exportHighResBtn, exportJpgBtn, exportAllBtn, transparentBgInput, includeOverlaysInput, exportScaleInput, durationInput, qualitySelect];
    let videoRecordInterval = null;

    exportPngBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (!artboard) return;
      
      const isTransparent = transparentBgInput.checked;
      const includeOverlays = includeOverlaysInput.checked;
      const scale = parseFloat(exportScaleInput.value);
      const exporter = new Exporter();

      // Use the new comprehensive export system
      exporter.saveAsPng(null, filename, {
        includeOverlays: includeOverlays,
        transparent: isTransparent,
        scale: scale,
        backgroundColor: artboardBackgroundColor
      });
    });

    exportSvgBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (!artboard) return;
      
      const isTransparent = transparentBgInput.checked;
      const includeOverlays = includeOverlaysInput.checked;
      const exporter = new Exporter();

      try {
        // Use the new comprehensive SVG export system
        exporter.saveAsSvg(filename, {
          includeOverlays: includeOverlays,
          transparent: isTransparent,
          backgroundColor: artboardBackgroundColor
        });
        
        statusEl.textContent = 'SVG saved successfully.';
        statusEl.style.display = 'block';
        setTimeout(() => { statusEl.style.display = 'none'; }, 2000);
      } catch (e) {
        console.error('SVG Export failed:', e);
        statusEl.textContent = 'ERROR: SVG export failed. See console.';
        statusEl.style.display = 'block';
      }
    });

    // High-resolution PNG export
    exportHighResBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (!artboard) return;
      
      const isTransparent = transparentBgInput.checked;
      const includeOverlays = includeOverlaysInput.checked;
      const scale = parseFloat(exportScaleInput.value) * 2.0; // Double the scale for high-res
      const exporter = new Exporter();

      exporter.saveAsHighResPng(filename, scale, {
        includeOverlays: includeOverlays,
        transparent: isTransparent,
        backgroundColor: artboardBackgroundColor
      });
    });

    // JPG export
    exportJpgBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (!artboard) return;
      
      const includeOverlays = includeOverlaysInput.checked;
      const scale = parseFloat(exportScaleInput.value);
      const exporter = new Exporter();

      exporter.saveAsJpg(null, filename, {
        includeOverlays: includeOverlays,
        scale: scale,
        backgroundColor: artboardBackgroundColor
      });
    });

    // Export all formats
    exportAllBtn?.addEventListener('click', () => {
      const filename = filenameInput.value || 'artwork';
      if (!artboard) return;
      
      const isTransparent = transparentBgInput.checked;
      const includeOverlays = includeOverlaysInput.checked;
      const scale = parseFloat(exportScaleInput.value);
      const exporter = new Exporter();

      statusEl.textContent = 'Exporting all formats...';
      statusEl.style.display = 'block';

      // Export all formats
      exporter.saveMultipleFormats(filename, ['png', 'jpg', 'svg'], {
        includeOverlays: includeOverlays,
        transparent: isTransparent,
        scale: scale,
        backgroundColor: artboardBackgroundColor
      });

      setTimeout(() => {
        statusEl.textContent = 'All formats exported successfully!';
        setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
      }, 1000);
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
          allExportControls.forEach(i => { if(i) i.disabled = false; });

          // Restore canvas size and scaling
          isDisplayScaled = true;
          const wrapper = document.getElementById('canvas-wrapper');
          if (wrapper) resizeCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
        });
      } catch (e) {
        console.error('Error while saving capture:', e);
        statusEl.textContent = 'ERROR: saving video failed.';
        allExportControls.forEach(i => { if(i) i.disabled = false; });
        
        // Restore canvas size and scaling even on error
        isDisplayScaled = true;
        const wrapper = document.getElementById('canvas-wrapper');
        if (wrapper) resizeCanvas(wrapper.offsetWidth, wrapper.offsetHeight);
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
        verbose: false,
        width: artboard.width,
        height: artboard.height
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

      const currentBtn = format === 'webm' ? exportVideoBtn : exportGifBtn;
      currentBtn.textContent = `STOP (0/${duration}s)`;
      statusEl.textContent = `RECORDING...`;
      statusEl.style.display = 'block';
      // Disable all other export controls, but keep the stop button active.
      allExportControls.forEach(i => { if(i && i !== currentBtn) i.disabled = true; });

      const startTime = Date.now();
      videoRecordInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        currentBtn.textContent = `STOP (${elapsed}/${duration}s)`;
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
        showBackground: document.getElementById('ga-showBackground'),
        backgroundColor: document.getElementById('ga-backgroundColor'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'GridArchitect') return;
        const tool = activeTool;
        
        // Debug logging to check if controls are working
        console.log('GridArchitect controls updating:', {
          layoutType: inputs.layoutType?.value,
          cols: inputs.cols?.value,
          rows: inputs.rows?.value
        });
        
        tool.layoutType = inputs.layoutType?.value || 'cartesian';
        tool.cols = parseInt(inputs.cols?.value || 10, 10);
        tool.rows = parseInt(inputs.rows?.value || 10, 10);
        tool.marginX = parseInt(inputs.marginX?.value || 50, 10);
        tool.marginY = parseInt(inputs.marginY?.value || 50, 10);
        tool.gutterX = parseInt(inputs.gutterX?.value || 0, 10);
        tool.gutterY = parseInt(inputs.gutterY?.value || 0, 10);
        tool.cellShape = inputs.cellShape?.value || 'rectangle';
        tool.cellText = inputs.cellText?.value || '';
        tool.textColor = inputs.textColor?.value || '#FFF8E7';
        tool.textSizeRatio = parseInt(inputs.textSize?.value || 80, 10) / 100;
        tool.lineWeight = parseFloat(inputs.lineWeight?.value || 1);
        tool.lineColor = inputs.lineColor?.value || '#333333';
        tool.fillColor = inputs.fillColor?.value || '#111111';
        tool.showGrid = inputs.showGrid?.checked !== false;
        tool.showBackground = inputs.showBackground?.checked !== false;
        tool.backgroundColor = inputs.backgroundColor?.value || '#000000';
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
        
        console.log('PosterComposer controls updating:', {
          preset: inputs.preset?.value,
          imageBlocks: inputs.imageBlocks?.value,
          textBlocks: inputs.textBlocks?.value
        });
        
        tool.preset = inputs.preset?.value || 'generative';
        tool.imageBlocks = parseInt(inputs.imageBlocks?.value || 2, 10);
        tool.textBlocks = parseInt(inputs.textBlocks?.value || 3, 10);
        tool.imageColor = inputs.imageColor?.value || '#232323';
        tool.textColor = inputs.textColor?.value || '#3C3C3C';
        tool.blockScale = parseFloat(inputs.blockScale?.value || 1.0);
        if (tool.preset !== oldPreset) {
          tool.regenerate(artboard.width, artboard.height);
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
          activeTool.regenerate(artboard.width, artboard.height);
        }
      });

      // This function is called on tool switch to sync state.
      // We'll use it to trigger the initial regeneration.
      return () => {
        if (activeTool?.constructor.name === 'PosterComposer') {
            update(); // Sync sliders first
            if (activeTool.layout.length === 0) {
                activeTool.regenerate(artboard.width, artboard.height);
            }
        }
      };
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
        
        console.log('BauhausAssembler controls updating:', {
          elementCount: inputs.elementCount?.value,
          maxSize: inputs.maxSize?.value,
          colorPalette: inputs.colorPalette?.value
        });
        
        tool.elementCount = parseInt(inputs.elementCount?.value || 15, 10);
        tool.maxSize = parseInt(inputs.maxSize?.value || 20, 10);
        tool.colorPalette = inputs.colorPalette?.value || 'primary';
        tool.allowOverlap = inputs.allowOverlap?.checked !== false;
        if (typeof tool.regenerate === 'function') {
          tool.regenerate(artboard.width, artboard.height);
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
        
        console.log('KineticTypeEngine controls updating:', {
          text: inputs.text?.value,
          algorithm: inputs.algorithm?.value,
          speed: inputs.speed?.value
        });
        
        tool.text = inputs.text?.value || 'KINETIC TYPE ENGINE';
        tool.repetitions = parseInt(inputs.repetitions?.value || 1, 10);
        tool.lineCount = parseInt(inputs.lineCount?.value || 1, 10);
        tool.fontSize = parseInt(inputs.fontSize?.value || 64, 10);
        tool.isUppercase = inputs.uppercase?.checked !== false;
        tool.algorithm = inputs.algorithm?.value || 'ticker';
        tool.speed = parseFloat(inputs.speed?.value || 2.0);
        tool.amplitude = parseInt(inputs.amplitude?.value || 50, 10);
        tool.tracking = parseInt(inputs.tracking?.value || 0, 10);
        tool.color = inputs.color?.value || '#FFF8E7';
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
        
        console.log('GlyphDeconstructor controls updating:', {
          text: inputs.text?.value,
          scale: inputs.scale?.value,
          jitter: inputs.jitter?.value
        });
        
        tool.text = inputs.text?.value || 'GLYPH';
        tool.lineCount = parseInt(inputs.lineCount?.value || 1, 10);
        tool.scale = parseFloat(inputs.scale?.value || 1.0);
        tool.jitter = parseInt(inputs.jitter?.value || 20, 10);
        tool.rotation = parseInt(inputs.rotation?.value || 10, 10);
        tool.color = inputs.color?.value || '#FFF8E7';
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
        
        // New container controls
        containerControls: document.getElementById('ws-isometric-container-controls'),
        containerShape: document.getElementById('ws-container-shape'),
        containerSize: document.getElementById('ws-container-size'),
        waveDetail: document.getElementById('ws-wave-detail'),
        rotationX: document.getElementById('ws-rotation-x'),
        rotationY: document.getElementById('ws-rotation-y'),
        rotationZ: document.getElementById('ws-rotation-z'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'WaveformSynthesizer') return;
        const tool = activeTool;
        
        // Debug logging
        console.log('WaveformSynthesizer controls updating:', {
          mode: inputs.mode?.value,
          waveform: inputs.waveform?.value,
          amp: inputs.amp?.value
        });
        
        tool.mode = inputs.mode?.value || 'line';
        tool.waveform = inputs.waveform?.value || 'sine';
        tool.amp = parseInt(inputs.amp?.value || 100, 10);
        tool.freq = parseInt(inputs.freq?.value || 4, 10);
        tool.lineCount = parseInt(inputs.lineCount?.value || 1, 10);
        tool.timeSpeed = parseFloat(inputs.timeSpeed?.value || 0.05);
        tool.phase = parseInt(inputs.phase?.value || 0, 10);
        tool.noiseAmount = parseInt(inputs.noiseAmount?.value || 0, 10);
        tool.color = inputs.color?.value || '#FFF8E7';
        tool.lineWeight = parseInt(inputs.lineWeight?.value || 3, 10);

        // Update new properties with null checks
        if (inputs.containerShape) tool.containerShape = inputs.containerShape.value;
        if (inputs.containerSize) tool.containerSize = parseInt(inputs.containerSize.value, 10);
        if (inputs.waveDetail) tool.waveDetail = parseInt(inputs.waveDetail.value, 10);
        if (inputs.rotationX) tool.rotationX = parseFloat(inputs.rotationX.value);
        if (inputs.rotationY) tool.rotationY = parseFloat(inputs.rotationY.value);
        if (inputs.rotationZ) tool.rotationZ = parseFloat(inputs.rotationZ.value);

        // Show/hide container controls
        if (inputs.containerControls) {
            inputs.containerControls.style.display = tool.mode === 'isometric-container' ? 'block' : 'none';
        }
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.tagName === 'SELECT' || input.type === 'checkbox' ? 'change' : 'input';
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
        
        console.log('UniversalRasterizer controls updating:', {
          cellSize: inputs.cellSize?.value,
          mode: inputs.mode?.value,
          shape: inputs.shape?.value
        });
        
        tool.cellSize = parseInt(inputs.cellSize?.value || 10, 10);
        tool.mode = inputs.mode?.value || 'shape';
        tool.shape = inputs.shape?.value || 'ellipse';
        tool.threshold = parseInt(inputs.threshold?.value || 128, 10);
        tool.invert = inputs.invert?.checked !== false;
        tool.rasterColor = inputs.rasterColor?.value || '#FFF8E7';
        tool.text = inputs.text?.value || 'A';
        tool.textColor = inputs.textColor?.value || '#111111';
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
        const oldDirection = tool.slitDirection;

        console.log('VideoSampler controls updating:', {
          mode: inputs.mode?.value,
          slitPosition: inputs.slitPosition?.value,
          cols: inputs.cols?.value
        });

        tool.mode = inputs.mode?.value || 'grid';
        tool.slitPosition = parseInt(inputs.slitPosition?.value || 50, 10);
        tool.slitDirection = inputs.slitDirection?.value || 'horizontal';
        tool.cols = parseInt(inputs.cols?.value || 16, 10);

        // Reset the slit-scan buffer if the mode or direction changes to prevent artifacts
        if ((tool.mode === 'slit-scan' && oldMode !== 'slit-scan') || (tool.slitDirection !== oldDirection)) {
            if (typeof tool.reset === 'function') {
                tool.reset();
            }
        }

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
      };

      Object.values(inputs).forEach(input => {
        if (input) {
          const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
          input.addEventListener(eventType, update);
        }
      });

      // This function is called on tool switch.
      return () => {
        if (activeTool?.constructor.name === 'VideoSampler') {
            update(); // Sync sliders
            // Ensure buffer is created on first load
            if (!activeTool.slitScanBuffer) {
                activeTool.regenerate(artboard.width, artboard.height);
            }
        }
      };
    });

    bindControls('colorSystemAnalyzer', () => {
      const inputs = {
        paletteSize: document.getElementById('csa-palette-size'),
        analyzeBtn: document.getElementById('csa-analyze-btn'),
      };

      const update = () => {
        if (activeTool?.constructor.name !== 'ColorSystemAnalyzer') return;
        
        console.log('ColorSystemAnalyzer controls updating:', {
          paletteSize: inputs.paletteSize?.value
        });
        
        activeTool.paletteSize = parseInt(inputs.paletteSize?.value || 8, 10);
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
        
        console.log('GenerativeComposer live controls updating:', {
          brushSize: inputs.brushSize?.value,
          stepSize: inputs.stepSize?.value
        });
        
        activeTool.brushSize = parseInt(inputs.brushSize?.value || 10, 10);
        activeTool.stepSize = parseFloat(inputs.stepSize?.value || 2.0);
      };

      const updateAndRegenerate = () => {
        if (activeTool?.constructor.name !== 'GenerativeComposer') return;
        
        console.log('GenerativeComposer regenerate controls updating:', {
          elements: inputs.elements?.value
        });
        
        activeTool.elementCount = parseInt(inputs.elements?.value || 100, 10);
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
        
        console.log('PixelSorter controls updating:', {
          sortMode: inputs.sortMode?.value,
          direction: inputs.direction?.value,
          threshold: inputs.threshold?.value
        });
        
        tool.sortMode = inputs.sortMode?.value || 'brightness';
        tool.direction = inputs.direction?.value || 'horizontal';
        tool.threshold = parseInt(inputs.threshold?.value || 80, 10);
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

        console.log('TruchetTiler controls updating:', {
          tileSize: inputs.tileSize?.value,
          density: inputs.density?.value,
          animSpeed: inputs.animSpeed?.value
        });

        tool.tileSize = parseInt(inputs.tileSize?.value || 80, 10);
        tool.density = parseInt(inputs.density?.value || 1, 10);
        tool.animSpeed = parseInt(inputs.animSpeed?.value || 0, 10);
        tool.lineWeight = parseFloat(inputs.lineWeight?.value || 2.0);
        tool.strokeColor = inputs.strokeColor?.value || '#FFF8E7';
        tool.backgroundColor = inputs.backgroundColor?.value || '#111111';
        
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
        const oldPixelSize = tool.pixelSize;
        const oldRasterPalette = tool.rasterPalette;

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
        tool.particleColor = inputs.particleColor.value;
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

        if (tool.pixelSize !== oldPixelSize || tool.rasterPalette !== oldRasterPalette) {
          tool.needsRasterUpdate = true;
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

  const setupCollapsibleSections = () => {
    const panels = document.querySelectorAll('.artboard-settings-panel, .global-view-panel, .tool-controls, .media-bus-panel, .global-fx-panel, .export-panel');
    panels.forEach(panel => {
        const headers = panel.querySelectorAll('.control-group-header');
        headers.forEach((header, index) => {
            let contents = [];
            let nextEl = header.nextElementSibling;
            while (nextEl && !nextEl.classList.contains('control-group-header')) {
                contents.push(nextEl);
                nextEl = nextEl.nextElementSibling;
            }

            if (index !== 0) {
                header.classList.add('active');
                contents.forEach(content => {
                    content.style.display = 'none';
                });
            }

            header.addEventListener('click', () => {
                header.classList.toggle('active');
                contents.forEach(content => {
                    if (content.style.display === 'none') {
                        if(content.classList.contains('control-group')) {
                            content.style.display = 'flex';
                        } else {
                            content.style.display = 'block';
                        }
                    } else {
                        content.style.display = 'none';
                    }
                });
            });
        });
    });
  };

  // Initialize all functionalities
  setupToolSelection();
  setupGlobalControls();
  setupToolControls();
  setupCollapsibleSections();
});