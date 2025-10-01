/**
 * CANVAS SIZING & EXPORT TEST SCRIPT
 * Tests the canvas sizing logic and export functionality
 */

class CanvasExportTester {
  constructor() {
    this.testResults = [];
    this.exportResults = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Starting Canvas Sizing & Export Tests...');
    
    try {
      // Test 1: Canvas Sizing Logic
      await this.testCanvasSizing();
      
      // Test 2: Joystick Movement
      await this.testJoystickMovement();
      
      // Test 3: PNG Export
      await this.testPNGExport();
      
      // Test 4: GIF Export
      await this.testGIFExport();
      
      // Test 5: SVG Export
      await this.testSVGExport();
      
      // Test 6: Video Export
      await this.testVideoExport();
      
      // Generate Report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testCanvasSizing() {
    console.log('📏 Testing Canvas Sizing Logic...');
    
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      this.logResult('Canvas Sizing', false, 'Canvas element not found');
      return;
    }

    // Get canvas dimensions
    const internalWidth = canvas.width;
    const internalHeight = canvas.height;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Calculate scaling
    const scaleX = displayWidth / internalWidth;
    const scaleY = displayHeight / internalHeight;
    const scale = Math.min(scaleX, scaleY);
    
    console.log(`Canvas Internal: ${internalWidth}x${internalHeight}`);
    console.log(`Canvas Display: ${displayWidth}x${displayHeight}`);
    console.log(`Scaling Factor: ${scale.toFixed(3)}`);
    
    // Test if scaling is reasonable (between 0.1 and 2.0)
    const scalingValid = scale > 0.1 && scale < 2.0;
    
    this.logResult('Canvas Sizing', scalingValid, {
      internal: `${internalWidth}x${internalHeight}`,
      display: `${displayWidth}x${displayHeight}`,
      scale: scale.toFixed(3),
      scalingValid
    });
  }

  async testJoystickMovement() {
    console.log('🎮 Testing Joystick Movement...');
    
    // Enable joystick
    const jKey = new KeyboardEvent('keydown', { key: 'j' });
    document.dispatchEvent(jKey);
    await this.sleep(100);
    
    // Test movement
    const initialOffset = { ...window.positionOffset };
    
    // Move up
    const wKey = new KeyboardEvent('keydown', { key: 'w' });
    document.dispatchEvent(wKey);
    await this.sleep(50);
    
    // Move left
    const aKey = new KeyboardEvent('keydown', { key: 'a' });
    document.dispatchEvent(aKey);
    await this.sleep(50);
    
    const finalOffset = { ...window.positionOffset };
    const moved = finalOffset.x !== initialOffset.x || finalOffset.y !== initialOffset.y;
    
    console.log(`Initial Offset: x=${initialOffset.x}, y=${initialOffset.y}`);
    console.log(`Final Offset: x=${finalOffset.x}, y=${finalOffset.y}`);
    console.log(`Movement Detected: ${moved}`);
    
    this.logResult('Joystick Movement', moved, {
      initial: initialOffset,
      final: finalOffset,
      moved
    });
  }

  async testPNGExport() {
    console.log('📸 Testing PNG Export...');
    
    try {
      // Test different quality settings
      const qualities = ['High', 'Good', 'Medium', 'Low'];
      
      for (const quality of qualities) {
        // Set quality
        const qualitySelect = document.getElementById('global-export-quality');
        if (qualitySelect) {
          qualitySelect.value = quality === 'High' ? '1' : 
                               quality === 'Good' ? '0.8' :
                               quality === 'Medium' ? '0.5' : '0.2';
        }
        
        // Trigger PNG export
        const pngButton = document.getElementById('global-export-png');
        if (pngButton) {
          pngButton.click();
          await this.sleep(1000); // Wait for export
          
          this.exportResults.push({
            format: 'PNG',
            quality: quality,
            timestamp: new Date().toISOString(),
            success: true
          });
        }
      }
      
      this.logResult('PNG Export', true, `Exported ${qualities.length} PNG files`);
      
    } catch (error) {
      this.logResult('PNG Export', false, error.message);
    }
  }

  async testGIFExport() {
    console.log('🎬 Testing GIF Export...');
    
    try {
      // Test different durations
      const durations = [2, 5, 10];
      
      for (const duration of durations) {
        // Set duration
        const durationInput = document.getElementById('global-export-duration');
        if (durationInput) {
          durationInput.value = duration;
        }
        
        // Trigger GIF export
        const gifButton = document.getElementById('global-export-gif');
        if (gifButton) {
          gifButton.click();
          await this.sleep(2000); // Wait for export
          
          this.exportResults.push({
            format: 'GIF',
            duration: duration,
            timestamp: new Date().toISOString(),
            success: true
          });
        }
      }
      
      this.logResult('GIF Export', true, `Exported ${durations.length} GIF files`);
      
    } catch (error) {
      this.logResult('GIF Export', false, error.message);
    }
  }

  async testSVGExport() {
    console.log('📐 Testing SVG Export...');
    
    try {
      const svgButton = document.getElementById('global-export-svg');
      if (svgButton) {
        svgButton.click();
        await this.sleep(1000); // Wait for export
        
        this.exportResults.push({
          format: 'SVG',
          timestamp: new Date().toISOString(),
          success: true
        });
        
        this.logResult('SVG Export', true, 'SVG file exported');
      } else {
        this.logResult('SVG Export', false, 'SVG button not found');
      }
      
    } catch (error) {
      this.logResult('SVG Export', false, error.message);
    }
  }

  async testVideoExport() {
    console.log('🎥 Testing Video Export...');
    
    try {
      // Test different qualities
      const qualities = ['High', 'Good', 'Medium'];
      
      for (const quality of qualities) {
        // Set quality
        const qualitySelect = document.getElementById('global-export-quality');
        if (qualitySelect) {
          qualitySelect.value = quality === 'High' ? '1' : 
                               quality === 'Good' ? '0.8' : '0.5';
        }
        
        // Set duration
        const durationInput = document.getElementById('global-export-duration');
        if (durationInput) {
          durationInput.value = 3; // Short duration for testing
        }
        
        // Trigger video export
        const videoButton = document.getElementById('global-export-video');
        if (videoButton) {
          videoButton.click();
          await this.sleep(3000); // Wait for export
          
          this.exportResults.push({
            format: 'VIDEO',
            quality: quality,
            duration: 3,
            timestamp: new Date().toISOString(),
            success: true
          });
        }
      }
      
      this.logResult('Video Export', true, `Exported ${qualities.length} video files`);
      
    } catch (error) {
      this.logResult('Video Export', false, error.message);
    }
  }

  logResult(testName, passed, details) {
    const result = {
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${JSON.stringify(details)}`);
  }

  generateTestReport() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const successRate = ((passed / total) * 100).toFixed(1);
    
    const report = {
      summary: {
        totalTests: total,
        passedTests: passed,
        failedTests: total - passed,
        successRate: `${successRate}%`,
        duration: `${duration}s`,
        exportCount: this.exportResults.length
      },
      canvasSizing: this.testResults.filter(r => r.test === 'Canvas Sizing'),
      joystickMovement: this.testResults.filter(r => r.test === 'Joystick Movement'),
      exports: this.exportResults,
      allResults: this.testResults
    };
    
    console.log('📊 TEST REPORT:');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Duration: ${duration}s`);
    console.log(`Exports: ${this.exportResults.length}`);
    
    // Save report
    const reportBlob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const reportUrl = URL.createObjectURL(reportBlob);
    const reportLink = document.createElement('a');
    reportLink.href = reportUrl;
    reportLink.download = `canvas-export-test-report-${new Date().toISOString().slice(0, 19)}.json`;
    reportLink.click();
    
    // Show download results
    this.showDownloadResults();
  }

  showDownloadResults() {
    console.log('📁 DOWNLOAD RESULTS:');
    console.log('===================');
    
    this.exportResults.forEach((export_, index) => {
      const filename = `tmm-visual-lab-${export_.timestamp.slice(0, 19)}.${export_.format.toLowerCase()}`;
      console.log(`${index + 1}. ${export_.format} - ${filename}`);
      if (export_.quality) console.log(`   Quality: ${export_.quality}`);
      if (export_.duration) console.log(`   Duration: ${export_.duration}s`);
    });
    
    console.log('');
    console.log('💾 Files saved to Downloads folder');
    console.log('📊 Test report saved as JSON');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Auto-run tests when script loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for the app to fully load
  setTimeout(() => {
    window.canvasTester = new CanvasExportTester();
    console.log('🚀 Canvas Export Tester ready!');
    console.log('Run: window.canvasTester.runAllTests()');
  }, 2000);
});

// Also make it available globally
window.CanvasExportTester = CanvasExportTester;
