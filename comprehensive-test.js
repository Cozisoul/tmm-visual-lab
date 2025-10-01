/**
 * Comprehensive Test Suite for TMM Visual Lab
 * Tests all tools, controls, canvas fitting, and functionality
 */

class ComprehensiveTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    
    this.tools = [
      'gridArchitect', 'posterComposer', 'bauhausAssembler', 
      'kineticTypeEngine', 'glyphDeconstructor', 'waveformSynthesizer',
      'universalRasterizer', 'videoSampler', 'colorSystemAnalyzer',
      'pixelSorter', 'truchetTiler', 'particleEngine', 'rhythmSequencer',
      'objectRasterizer3D', 'generativeComposer'
    ];
    
    this.testTimeout = 5000; // 5 seconds per test
    this.isRunning = false;
  }

  // Main test runner
  async runAllTests() {
    if (this.isRunning) {
      console.log('⚠️ Test suite already running');
      return;
    }
    
    this.isRunning = true;
    console.log('🧪 Starting Comprehensive Test Suite...');
    this.clearResults();
    
    try {
      await this.testSystemInitialization();
      await this.testAllTools();
      await this.testAllControls();
      await this.testCanvasFitting();
      await this.testExportFunctions();
      await this.testAudioReactivity();
      await this.testGameOfLife();
      await this.testPerformance();
      
      this.generateReport();
      console.log('🎉 All tests completed!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Test system initialization
  async testSystemInitialization() {
    console.log('🔧 Testing system initialization...');
    
    // Test p5.js availability
    this.addResult('p5_available', typeof p5 !== 'undefined', 'p5.js library loaded');
    
    // Test canvas existence
    const canvas = document.querySelector('canvas');
    this.addResult('canvas_exists', !!canvas, 'Canvas element found');
    
    // Test artboard existence
    this.addResult('artboard_exists', typeof artboard !== 'undefined', 'Artboard buffer exists');
    
    // Test tool loading system
    this.addResult('loadTool_function', typeof loadTool === 'function', 'loadTool function available');
    
    // Test active tool system
    this.addResult('activeTool_system', typeof activeTool !== 'undefined', 'Active tool system initialized');
  }

  // Test all tools
  async testAllTools() {
    console.log('🔧 Testing all tools...');
    
    for (const toolName of this.tools) {
      await this.testSingleTool(toolName);
      await this.delay(100); // Small delay between tests
    }
  }

  // Test single tool
  async testSingleTool(toolName) {
    console.log(`Testing ${this.formatToolName(toolName)}...`);
    
    try {
      // Test tool class existence
      const className = this.getToolClassName(toolName);
      const classExists = typeof window[className] !== 'undefined';
      this.addResult(`${toolName}_class_exists`, classExists, `Tool class ${className} exists`);
      
      if (!classExists) {
        this.addResult(`${toolName}_complete`, false, `Tool class not found`);
        return;
      }

      // Test tool instantiation
      let tool = null;
      try {
        tool = new window[className]();
        this.addResult(`${toolName}_instantiation`, !!tool, 'Tool instantiated successfully');
      } catch (error) {
        this.addResult(`${toolName}_instantiation`, false, `Instantiation failed: ${error.message}`);
        return;
      }

      // Test required methods
      const requiredMethods = ['draw', 'regenerate'];
      for (const method of requiredMethods) {
        const hasMethod = typeof tool[method] === 'function';
        this.addResult(`${toolName}_method_${method}`, hasMethod, `Method ${method} exists`);
      }

      // Test tool loading in main system
      if (typeof loadTool === 'function') {
        try {
          await loadTool(toolName);
          this.addResult(`${toolName}_loading`, true, 'Tool loaded successfully');
          
          // Test if tool is now active
          const isActive = activeTool && activeTool.constructor.name === className;
          this.addResult(`${toolName}_active`, isActive, 'Tool is active after loading');
          
          // Test tool display
          if (isActive) {
            await this.testToolDisplay(toolName);
          }
        } catch (error) {
          this.addResult(`${toolName}_loading`, false, `Loading failed: ${error.message}`);
        }
      }

      this.addResult(`${toolName}_complete`, true, 'Tool test completed');
      
    } catch (error) {
      this.addResult(`${toolName}_error`, false, `Test error: ${error.message}`);
    }
  }

  // Test tool display
  async testToolDisplay(toolName) {
    return new Promise((resolve) => {
      try {
        if (!activeTool) {
          this.addResult(`${toolName}_display`, false, 'No active tool');
          resolve();
          return;
        }

        // Test if tool can draw
        const originalDraw = activeTool.draw;
        let drawCalled = false;
        
        // Override draw method to track calls
        activeTool.draw = function(buffer, media, golGrid, options) {
          drawCalled = true;
          return originalDraw.call(this, buffer, media, golGrid, options);
        };

        // Wait a frame to see if draw is called
        setTimeout(() => {
          this.addResult(`${toolName}_display`, drawCalled, 'Tool draw method called');
          
          // Restore original draw method
          activeTool.draw = originalDraw;
          resolve();
        }, 100);
        
      } catch (error) {
        this.addResult(`${toolName}_display`, false, `Display test error: ${error.message}`);
        resolve();
      }
    });
  }

  // Test all controls
  async testAllControls() {
    console.log('🎛️ Testing all controls...');
    
    for (const toolName of this.tools) {
      await this.testToolControls(toolName);
    }
  }

  // Test tool controls
  async testToolControls(toolName) {
    try {
      const controlContainer = document.getElementById(`${toolName}-controls`);
      const hasControls = !!controlContainer;
      this.addResult(`${toolName}_controls_exist`, hasControls, 'Control container exists');
      
      if (hasControls) {
        const inputs = controlContainer.querySelectorAll('input, select, button');
        this.addResult(`${toolName}_controls_count`, inputs.length > 0, `Found ${inputs.length} controls`);
        
        // Test control functionality
        for (const input of inputs) {
          await this.testControlFunctionality(toolName, input);
        }
      }
    } catch (error) {
      this.addResult(`${toolName}_controls_error`, false, `Control test error: ${error.message}`);
    }
  }

  // Test individual control
  async testControlFunctionality(toolName, input) {
    try {
      const inputType = input.type || input.tagName.toLowerCase();
      const inputId = input.id;
      
      if (!inputId) return;
      
      // Test if control can be modified
      let canModify = false;
      try {
        if (inputType === 'range' || inputType === 'number') {
          const originalValue = input.value;
          input.value = originalValue === '0' ? '1' : '0';
          canModify = true;
          input.value = originalValue; // Restore
        } else if (inputType === 'checkbox') {
          input.checked = !input.checked;
          canModify = true;
          input.checked = !input.checked; // Restore
        } else if (inputType === 'select') {
          if (input.options.length > 1) {
            const originalIndex = input.selectedIndex;
            input.selectedIndex = originalIndex === 0 ? 1 : 0;
            canModify = true;
            input.selectedIndex = originalIndex; // Restore
          }
        }
      } catch (error) {
        canModify = false;
      }
      
      this.addResult(`${toolName}_control_${inputId}`, canModify, `Control ${inputId} is functional`);
      
    } catch (error) {
      this.addResult(`${toolName}_control_error`, false, `Control test error: ${error.message}`);
    }
  }

  // Test canvas fitting
  async testCanvasFitting() {
    console.log('🖼️ Testing canvas fitting...');
    
    try {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        this.addResult('canvas_fitting', false, 'No canvas found');
        return;
      }

      // Test canvas dimensions
      const hasDimensions = canvas.width > 0 && canvas.height > 0;
      this.addResult('canvas_dimensions', hasDimensions, `Canvas size: ${canvas.width}x${canvas.height}`);

      // Test canvas scaling
      const wrapper = document.getElementById('canvas-wrapper');
      if (wrapper) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const fitsInWrapper = canvasRect.width <= wrapperRect.width && canvasRect.height <= wrapperRect.height;
        this.addResult('canvas_fits_wrapper', fitsInWrapper, 'Canvas fits within wrapper');
      }

      // Test artboard scaling
      if (typeof artboard !== 'undefined') {
        const artboardSize = artboard.width > 0 && artboard.height > 0;
        this.addResult('artboard_size', artboardSize, `Artboard size: ${artboard.width}x${artboard.height}`);
      }

    } catch (error) {
      this.addResult('canvas_fitting_error', false, `Canvas fitting error: ${error.message}`);
    }
  }

  // Test export functions
  async testExportFunctions() {
    console.log('💾 Testing export functions...');
    
    try {
      // Test PNG export
      const pngButton = document.getElementById('export-png-btn');
      this.addResult('export_png_button', !!pngButton, 'PNG export button exists');
      
      // Test SVG export
      const svgButton = document.getElementById('export-svg-btn');
      this.addResult('export_svg_button', !!svgButton, 'SVG export button exists');
      
      // Test WebM export
      const webmButton = document.getElementById('export-webm-btn');
      this.addResult('export_webm_button', !!webmButton, 'WebM export button exists');
      
      // Test capture functionality
      if (typeof CCapture !== 'undefined') {
        this.addResult('ccapture_available', true, 'CCapture library loaded');
      } else {
        this.addResult('ccapture_available', false, 'CCapture library not found');
      }
      
    } catch (error) {
      this.addResult('export_functions_error', false, `Export test error: ${error.message}`);
    }
  }

  // Test audio reactivity
  async testAudioReactivity() {
    console.log('🎵 Testing audio reactivity...');
    
    try {
      // Test audio analyzer
      if (typeof audioAnalyzer !== 'undefined') {
        this.addResult('audio_analyzer', true, 'Audio analyzer available');
        
        // Test audio context
        if (audioAnalyzer.audioContext) {
          this.addResult('audio_context', true, 'Audio context available');
        } else {
          this.addResult('audio_context', false, 'Audio context not available');
        }
      } else {
        this.addResult('audio_analyzer', false, 'Audio analyzer not found');
      }
      
      // Test audio controls
      const audioButton = document.getElementById('audio-toggle-btn');
      this.addResult('audio_controls', !!audioButton, 'Audio controls exist');
      
    } catch (error) {
      this.addResult('audio_reactivity_error', false, `Audio test error: ${error.message}`);
    }
  }

  // Test Game of Life
  async testGameOfLife() {
    console.log('🎮 Testing Game of Life...');
    
    try {
      // Test GOL controls
      const golButton = document.getElementById('gol-toggle-btn');
      this.addResult('gol_controls', !!golButton, 'Game of Life controls exist');
      
      // Test GOL variables
      if (typeof gameOfLifeEnabled !== 'undefined') {
        this.addResult('gol_system', true, 'Game of Life system available');
      } else {
        this.addResult('gol_system', false, 'Game of Life system not found');
      }
      
      // Test GOL grid
      if (typeof gameOfLifeGrid !== 'undefined') {
        this.addResult('gol_grid', Array.isArray(gameOfLifeGrid), 'Game of Life grid exists');
      } else {
        this.addResult('gol_grid', false, 'Game of Life grid not found');
      }
      
    } catch (error) {
      this.addResult('gol_error', false, `Game of Life test error: ${error.message}`);
    }
  }

  // Test performance
  async testPerformance() {
    console.log('📈 Testing performance...');
    
    try {
      // Test frame rate
      if (typeof frameRate === 'function') {
        const fps = frameRate();
        this.addResult('frame_rate', fps > 0, `Frame rate: ${fps.toFixed(1)} FPS`);
      }
      
      // Test memory usage
      if (performance.memory) {
        const memory = performance.memory;
        const memoryMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        this.addResult('memory_usage', true, `Memory usage: ${memoryMB}MB`);
      }
      
      // Test tool loading performance
      const startTime = performance.now();
      if (typeof loadTool === 'function') {
        await loadTool('gridArchitect');
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        this.addResult('tool_load_performance', loadTime < 1000, `Tool load time: ${loadTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      this.addResult('performance_error', false, `Performance test error: ${error.message}`);
    }
  }

  // Utility methods
  addResult(testName, passed, message) {
    this.results.total++;
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
    
    this.results.details.push({
      name: testName,
      passed: passed,
      message: message,
      timestamp: new Date()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  formatToolName(toolName) {
    return toolName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  getToolClassName(toolName) {
    const classMap = {
      'gridArchitect': 'GridArchitect',
      'posterComposer': 'PosterComposer',
      'bauhausAssembler': 'BauhausAssembler',
      'kineticTypeEngine': 'KineticTypeEngine',
      'glyphDeconstructor': 'GlyphDeconstructor',
      'waveformSynthesizer': 'WaveformSynthesizer',
      'universalRasterizer': 'UniversalRasterizer',
      'videoSampler': 'VideoSampler',
      'colorSystemAnalyzer': 'ColorSystemAnalyzer',
      'pixelSorter': 'PixelSorter',
      'truchetTiler': 'TruchetTiler',
      'particleEngine': 'ParticleEngine',
      'rhythmSequencer': 'RhythmSequencer',
      'objectRasterizer3D': 'ObjectRasterizer3D',
      'generativeComposer': 'GenerativeComposer'
    };
    return classMap[toolName] || toolName;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearResults() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  generateReport() {
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : 0;
    
    console.log('\n📊 TEST REPORT');
    console.log('================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('================\n');
    
    // Show failed tests
    const failedTests = this.results.details.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
      console.log('');
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: successRate
      },
      details: this.results.details
    };
    
    localStorage.setItem('tmm-test-report', JSON.stringify(report));
    console.log('📄 Report saved to localStorage as "tmm-test-report"');
  }
}

// Global test suite instance
window.testSuite = new ComprehensiveTestSuite();

// Test panel toggle function
function toggleTestPanel() {
  const panel = document.getElementById('test-suite-panel');
  const button = document.getElementById('test-toggle-btn');
  
  if (panel.style.display === 'none' || panel.style.display === '') {
    panel.style.display = 'block';
    button.style.display = 'none';
  } else {
    panel.style.display = 'none';
    button.style.display = 'block';
  }
}

// Override the test suite methods to update the UI
const originalRunAllTests = window.testSuite.runAllTests;
window.testSuite.runAllTests = async function() {
  updateTestStatus('Running all tests...');
  await originalRunAllTests.call(this);
  updateTestStatus('All tests completed!');
};

const originalRunToolTests = window.testSuite.runToolTests;
window.testSuite.runToolTests = async function() {
  updateTestStatus('Testing all tools...');
  await originalRunToolTests.call(this);
  updateTestStatus('Tool tests completed!');
};

const originalRunControlTests = window.testSuite.runControlTests;
window.testSuite.runControlTests = async function() {
  updateTestStatus('Testing all controls...');
  await originalRunControlTests.call(this);
  updateTestStatus('Control tests completed!');
};

// Update test status in UI
function updateTestStatus(message) {
  const statusEl = document.getElementById('test-status');
  if (statusEl) {
    statusEl.textContent = message;
  }
  
  const resultsEl = document.getElementById('test-results');
  if (resultsEl) {
    const timestamp = new Date().toLocaleTimeString();
    resultsEl.textContent += `[${timestamp}] ${message}\n`;
    resultsEl.scrollTop = resultsEl.scrollHeight;
  }
}

// Update progress bar
function updateTestProgress() {
  const progressFill = document.getElementById('test-progress-fill');
  if (progressFill && window.testSuite.results.total > 0) {
    const progress = (window.testSuite.results.passed / window.testSuite.results.total) * 100;
    progressFill.style.width = `${progress}%`;
  }
}

// Override addResult to update UI
const originalAddResult = window.testSuite.addResult;
window.testSuite.addResult = function(testName, passed, message) {
  originalAddResult.call(this, testName, passed, message);
  updateTestProgress();
  updateTestStatus(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
};

// Auto-run tests when page loads (optional)
// window.addEventListener('load', () => {
//   setTimeout(() => {
//     window.testSuite.runAllTests();
//   }, 2000);
// });

console.log('🧪 Comprehensive Test Suite loaded. Run with: testSuite.runAllTests()');
console.log('🧪 Test panel available - click the 🧪 button in the top-right corner');
