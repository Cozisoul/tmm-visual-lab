/**
 * Test script for the rebuilt download system
 * This tests the new Exporter class and its comprehensive layer capture functionality
 */

// Test function to verify the download system
function testDownloadSystem() {
  console.log("🧪 Testing Download System...");
  
  // Check if Exporter class is available
  if (typeof Exporter === 'undefined') {
    console.error("❌ Exporter class not found");
    return false;
  }
  
  // Check if required global variables are available
  const requiredGlobals = ['artboard', 'activeTool', 'canvas'];
  const missingGlobals = requiredGlobals.filter(global => typeof window[global] === 'undefined');
  
  if (missingGlobals.length > 0) {
    console.warn("⚠️ Missing global variables:", missingGlobals);
  }
  
  // Create exporter instance
  const exporter = new Exporter();
  console.log("✅ Exporter instance created");
  
  // Test canvas info
  const canvasInfo = exporter.getCanvasInfo();
  console.log("📊 Canvas Info:", canvasInfo);
  
  // Test composite image creation
  try {
    const composite = exporter.createCompositeImage({
      includeOverlays: true,
      transparent: false,
      scale: 1.0,
      backgroundColor: '#000000'
    });
    console.log("✅ Composite image created:", composite.width, "x", composite.height);
    composite.remove(); // Clean up
  } catch (error) {
    console.error("❌ Composite image creation failed:", error);
    return false;
  }
  
  // Test different export options
  const testOptions = [
    { name: "PNG with overlays", options: { includeOverlays: true, transparent: false, scale: 1.0 } },
    { name: "PNG transparent", options: { includeOverlays: true, transparent: true, scale: 1.0 } },
    { name: "High-res PNG", options: { includeOverlays: true, transparent: false, scale: 2.0 } },
    { name: "JPG export", options: { includeOverlays: true, transparent: false, scale: 1.0 } }
  ];
  
  console.log("🧪 Testing export options...");
  testOptions.forEach((test, index) => {
    try {
      const composite = exporter.createCompositeImage(test.options);
      console.log(`✅ ${test.name}: ${composite.width}x${composite.height}`);
      composite.remove();
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error);
    }
  });
  
  console.log("🎉 Download system test completed!");
  return true;
}

// Test the export functionality
function testExportFunctions() {
  console.log("🧪 Testing Export Functions...");
  
  if (typeof Exporter === 'undefined') {
    console.error("❌ Exporter class not available");
    return false;
  }
  
  const exporter = new Exporter();
  
  // Test PNG export
  try {
    exporter.saveAsPng(null, 'test-export', {
      includeOverlays: true,
      transparent: false,
      scale: 1.0,
      backgroundColor: '#000000'
    });
    console.log("✅ PNG export test completed");
  } catch (error) {
    console.error("❌ PNG export failed:", error);
  }
  
  // Test JPG export
  try {
    exporter.saveAsJpg(null, 'test-export', {
      includeOverlays: true,
      scale: 1.0,
      backgroundColor: '#000000'
    });
    console.log("✅ JPG export test completed");
  } catch (error) {
    console.error("❌ JPG export failed:", error);
  }
  
  // Test SVG export
  try {
    exporter.saveAsSvg('test-export', {
      includeOverlays: true,
      transparent: false,
      backgroundColor: '#000000'
    });
    console.log("✅ SVG export test completed");
  } catch (error) {
    console.error("❌ SVG export failed:", error);
  }
  
  console.log("🎉 Export functions test completed!");
  return true;
}

// Run tests when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("🚀 Download System Test Suite Starting...");
  
  // Wait a bit for the application to initialize
  setTimeout(() => {
    testDownloadSystem();
    testExportFunctions();
  }, 2000);
});

// Make test functions available globally
window.testDownloadSystem = testDownloadSystem;
window.testExportFunctions = testExportFunctions;
