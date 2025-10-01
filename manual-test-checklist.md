# MANUAL TEST CHECKLIST - TMM VISUAL LAB

## 🎯 COMPREHENSIVE TESTING CHECKLIST

### 📏 SIZE TESTING
- [ ] **Square (1080x1080)** - Test all tools
- [ ] **Portrait (1080x1350)** - Test all tools  
- [ ] **Landscape (1920x1080)** - Test all tools
- [ ] **Square (512x512)** - Test all tools
- [ ] **Custom (800x600)** - Test all tools

### 🛠️ TOOL TESTING (18 tools)
- [ ] **Grid Architect** - All grid types (Cartesian, Isometric, Polar)
- [ ] **Poster Composer** - All composition modes
- [ ] **Bauhaus Assembler** - All element types
- [ ] **Kinetic Type Engine** - All algorithms (ticker, wave, wave-ticker)
- [ ] **Glyph Deconstructor** - All deconstruction modes
- [ ] **Waveform Synthesizer** - All waveform types and modes
- [ ] **Universal Rasterizer** - All rasterization modes
- [ ] **Video Sampler** - All sampling modes
- [ ] **Color System Analyzer** - All analysis modes
- [ ] **Truchet Tiler** - All tiling patterns
- [ ] **Particle Engine** - All particle types
- [ ] **Idea Generator** - All generation modes
- [ ] **Generative Composer** - All composition algorithms
- [ ] **Generative Composition Lab** - All lab modes
- [ ] **Vector Field Modulator** - All field types
- [ ] **L-System Architect** - All L-system rules
- [ ] **Design Office** - All office tools
- [ ] **Generative Graphics Engine** - All graphics modes

### 🎮 MOVEMENT TESTING
- [ ] **Joystick Toggle** - Press 'J' to enable/disable
- [ ] **WASD Movement** - Test all four directions
- [ ] **Arrow Key Movement** - Test all four directions
- [ ] **Position Reset** - Press Space to reset to center
- [ ] **Content Movement** - Verify content moves inside canvas, not the canvas itself
- [ ] **Visual Feedback** - Green status indicator shows current offset

### ⌨️ SHORTCUT TESTING
- [ ] **'S'** - Save PNG export
- [ ] **'G'** - Toggle Game of Life
- [ ] **'L'** - Toggle GOL Link
- [ ] **'R'** - Regenerate current tool
- [ ] **'J'** - Toggle joystick mode
- [ ] **' '** - Reset position to center
- [ ] **'W'** - Move up (joystick mode)
- [ ] **'A'** - Move left (joystick mode)
- [ ] **'S'** - Move down (joystick mode)
- [ ] **'D'** - Move right (joystick mode)

### 📤 EXPORT TESTING
- [ ] **PNG Export** - All quality settings
- [ ] **GIF Export** - All duration settings
- [ ] **SVG Export** - Vector format
- [ ] **VIDEO Export** - All quality and duration settings
- [ ] **Transparent Background** - PNG with transparency
- [ ] **Custom Filename** - Test filename input

### 🎨 CSS COMPLIANCE TESTING
- [ ] **Layout Integrity** - 3-column grid layout maintained
- [ ] **Canvas Positioning** - Canvas properly centered and constrained
- [ ] **Tool Panel Visibility** - All tool controls visible and functional
- [ ] **Export Panel** - Export controls properly positioned
- [ ] **Responsive Design** - Layout adapts to different screen sizes
- [ ] **Color Scheme** - Consistent dark theme throughout
- [ ] **Typography** - Monospace fonts for technical elements
- [ ] **Button States** - Hover, focus, and active states work
- [ ] **Input Fields** - All form controls properly styled
- [ ] **Overlay Elements** - Status overlays positioned correctly

### 🔧 TECHNICAL TESTING
- [ ] **Canvas Sizing** - Tools use proper canvasWidth/canvasHeight
- [ ] **Joystick Translation** - translate() moves content correctly
- [ ] **Tool Centering** - All tools properly centered on canvas
- [ ] **Aspect Ratio** - Content maintains proper proportions
- [ ] **Performance** - Smooth 30-60 FPS operation
- [ ] **Memory Usage** - No memory leaks during tool switching
- [ ] **Error Handling** - Graceful handling of tool loading errors

### 🧪 AUTOMATED TESTING
- [ ] **Run All Tests** - Click 🧪 button, then "Run All Tests"
- [ ] **Size Tests** - Test all tools at all sizes
- [ ] **Export Tests** - Test all export formats
- [ ] **Movement Tests** - Test joystick functionality
- [ ] **Shortcut Tests** - Test all keyboard shortcuts
- [ ] **CSS Tests** - Test layout and styling compliance
- [ ] **Generate Report** - Export test results as JSON

## 🎯 EXPECTED BEHAVIOR

### ✅ JOYSTICK MOVEMENT
- Content moves inside the canvas when using WASD/Arrow keys
- Green status indicator shows current offset values
- Space key resets position to center
- 'J' key toggles joystick mode on/off

### ✅ CANVAS SIZING
- All tools work correctly at all preset sizes
- Content is properly centered and scaled
- No overflow or clipping issues
- Aspect ratio maintained across all sizes

### ✅ EXPORT FUNCTIONALITY
- All export formats work correctly
- Quality settings affect output appropriately
- Filename input works for custom names
- Transparent background option works for PNG

### ✅ CSS LAYOUT
- 3-column grid layout maintained
- Canvas properly constrained within wrapper
- Tool panels visible and functional
- Responsive design works on different screen sizes

## 🚨 COMMON ISSUES TO CHECK

- [ ] **Content not moving** - Check if joystick is enabled (press 'J')
- [ ] **Tools off-center** - Verify tools use canvasWidth/canvasHeight
- [ ] **Export not working** - Check if tool is loaded and canvas is ready
- [ ] **Layout broken** - Check CSS grid and flexbox properties
- [ ] **Performance issues** - Check FPS display and memory usage

## 📊 TEST RESULTS

### PASSED TESTS: ___/___
### FAILED TESTS: ___/___
### SUCCESS RATE: ___%

### NOTES:
- 
- 
- 

---

**Test Date:** ___________
**Tester:** ___________
**Browser:** ___________
**Screen Size:** ___________
