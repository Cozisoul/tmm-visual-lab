/*
 * ObjectRasterizer3D
 * Clean, self-contained 3D tool for rendering simple shapes and text into an offscreen WEBGL buffer.
 */
class ObjectRasterizer3D {
  constructor() {
    // Basic render properties
    this.renderMode = 'solid'; // 'solid' | 'wireframe' | 'points'
    this.shape = 'text'; // 'box' | 'sphere' | 'torus' | 'text' | 'polar' | 'gol'

    // Colors / materials
    this.colorTheme = 'custom'; // 'custom' | 'monochrome' | 'complementary' | 'triadic' | 'pastel' | 'neon'
    this.primaryColor = '#FFDDCC';
    this.secondaryColor = '#CCDDEE';
    this.materialType = 'basic'; // 'basic' | 'normal' | 'warped' | 'raster' | 'shiny'

    // Text specific
    this.text = 'TMM';
    this.fontSize = 120;
    this.extrude = 5;
    this.font = null;
    this.textGeom = null;
    this.needsGeomUpdate = true;
    this.needsRasterUpdate = true;

    // Camera / environment
    this.zoom = 800;
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationZ = 0;
    this.autoRotate = true;
    this.gridEnabled = false;
    this.gridSize = 800;
    this.shadowsEnabled = true;

    // Shaders
    this.warp = 1; // Used by warpedShader
    this.pixelSize = 8; // For raster shader
    this.rasterPalette = 'famicube'; // For raster shader
    this.warpedShader = null;
    this.rasterTextureGfx = null;
    this.shinyShader = null;

    // Palettes for the raster texture, defined once for efficiency.
    this.shaderPalettes = {
        famicube: ['#644125', '#D29464', '#FFFEF1', '#DE3910', '#7B1000', '#005310'],
        gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
        monochrome: ['#000000', '#444444', '#888888', '#CCCCCC', '#FFFFFF']
    };

    // Internal buffer
    this.buffer3d = null;
    this.cameraType = 'perspective';

    // Particle Engine Integration
    this.particlesEnabled = false;
    this.particleSystem3D = new ParticleSystem3D();
    // Add properties here that you can later connect to UI sliders for more control
    this.particleRate = 5;
    this.particleColor = '#FFF8E7';
    this.particleGravity = -0.05;

    // Internal Metronome Integration
    this.internalMetronome = new InternalMetronome();
    this.rhythmEnabled = false;
    this.pulse = 1.0;
    this.lastBeat = -1;
    this.shadersInitialized = false;
    this.audioTime = 0;
    this.cellStates = {}; // To track GOL cell heights for animation
  }

  regenerate() {
    // Regenerate 3D geometry
    this.regenerateTextGeometry();
  }

  async init() {
    try {
      // Using Anton as it's a bold, classic choice for 3D.
      this.font = await loadFont('https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-Co.ttf');
      console.log("Font loaded successfully for ObjectRasterizer3D.");
      this.regenerateTextGeometry();
    } catch (e) {
      console.error("Failed to load font for 3D text in ObjectRasterizer3D:", e);
      this.font = null; // Ensure font is null on failure
      // Try to use a fallback font or continue without 3D text
      try {
        this.font = await loadFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2');
        console.log("Fallback font loaded successfully.");
        this.regenerateTextGeometry();
      } catch (fallbackError) {
        console.warn("Fallback font also failed. 3D text will not be available.");
      }
    }
  }

  /**
   * Initializes shaders using the modern p5.Shader material system.
   * This is more flexible and declarative than the older createShader method.
   */
  initializeShaders() {
    if (this.shadersInitialized) return;

    const getColorVec = () => {
      const c = color(this.primaryColor);
      return [red(c) / 255, green(c) / 255, blue(c) / 255];
    };

    this.warpedShader = createShader(
      `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec3 aNormal;

      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      uniform mat3 uNormalMatrix;

      uniform float u_time;
      uniform float u_warp;

      varying vec3 v_normal;
      varying vec3 v_position;

      void main() {
        vec3 pos = aPosition;
        pos.x += 5. * u_warp * sin(pos.y * 0.1 + u_time * 0.001) / (1. + u_warp);
        pos.y += 5. * u_warp * sin(pos.x * 0.1 + u_time * 0.0009) / (1. + u_warp);
        
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(pos, 1.0);
        
        v_normal = uNormalMatrix * aNormal;
        v_position = (uModelViewMatrix * vec4(pos, 1.0)).xyz;
      }
      `,
      `
      precision highp float;
      uniform vec3 u_color;
      varying vec3 v_normal;

      void main() {
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 finalColor = u_color * diff + vec3(0.1);
        gl_FragColor = vec4(finalColor, 1.0);
      }
      `
    );
    this.warpedShader.setUniform('u_color', getColorVec());
    this.warpedShader.setUniform('u_warp', this.warp);
    this.warpedShader.setUniform('u_time', millis());

    this.shinyShader = createShader(
      `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec3 aNormal;

      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      uniform mat3 uNormalMatrix;

      varying vec3 v_normal;
      varying vec3 v_position;

      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        v_normal = uNormalMatrix * aNormal;
        v_position = (uModelViewMatrix * vec4(aPosition, 1.0)).xyz;
      }
      `,
      `
      precision highp float;
      uniform vec3 u_color;
      varying vec3 v_normal;
      varying vec3 v_position;

      void main() {
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
        vec3 viewDir = normalize(-v_position);
        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 ambient = vec3(0.1);
        vec3 diffuse = u_color * diff;
        vec3 specular = vec3(0.9) * spec;
        gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
      }
      `
    );
    this.shinyShader.setUniform('u_color', getColorVec());

    this.shadersInitialized = true;
  }

  regenerateTextGeometry() {
    if (!this.font) {
      this.textGeom = null;
      this.needsGeomUpdate = false;
      return;
    }
    try {
      // Increased sampleFactor for better quality and added clearColors from p5.js examples.
      this.textGeom = this.font.textToModel(this.text, this.fontSize, { sampleFactor: 0.5, extrude: this.extrude });
      this.textGeom.normalize();
      this.textGeom.clearColors(); // Ensure our materials/shaders have full control.
      this.needsGeomUpdate = false;
    } catch (e) {
      console.error("Failed to generate text geometry:", e);
      this.textGeom = null;
      // Add this line to prevent the error from being thrown on every frame
      this.needsGeomUpdate = false;
    }
  }

  /**
   * Handles resizing of the internal 3D buffer.
   * This is much more efficient than removing and recreating it.
   */
  onResize(w, h) {
    if (!this.buffer3d) {
      this.create3dBuffer(w, h);
    } else {
      this.buffer3d.resize(w, h);
    }
  }

  create3dBuffer(w, h) {
    try {
      this.rasterTextureGfx = createGraphics(128, 128);
      console.log("ObjectRasterizer3D: rasterTextureGfx created.", this.rasterTextureGfx);
      this.buffer3d = createGraphics(w, h, WEBGL);
      this.buffer3d.pixelDensity(1);
      // Ensure the 3D buffer is properly sized and doesn't overflow
      this.buffer3d.drawingContext.canvas.style.maxWidth = '100%';
      this.buffer3d.drawingContext.canvas.style.maxHeight = '100%';
      this.initializeShaders();
    } catch (e) {
      console.error('ObjectRasterizer3D.create3dBuffer() failed:', e);
      this.buffer3d = null;
    }
  }

  cleanup() {
    if (this.rasterTextureGfx) { 
      this.rasterTextureGfx.remove(); 
      this.rasterTextureGfx = null; 
    }
    if (this.buffer3d) { 
      this.buffer3d.remove(); 
      this.buffer3d = null; 
    }
    this.textGeom = null;
    this.font = null;
    this.particleSystem3D.cleanup();
  }

  draw(mainBuffer, media, golGrid, options = {}) {
    if (!this.buffer3d) {
      this.create3dBuffer(mainBuffer.width, mainBuffer.height);
    }
    if (!this.buffer3d) return;

    if (this.needsRasterUpdate) {
      this.updateRasterTexture();
    }

    if (this.shape === 'text' && this.needsGeomUpdate) {
      this.regenerateTextGeometry();
    }

    // --- Integrations Update ---
    // Always react to audio if it's enabled globally for a direct pulse effect.
    if (options.isAudioReactive && options.audioLevel > 0.02) {
      this.pulse = 1.0 + options.audioLevel * 1.5; // Boosted multiplier for more impact
      this.audioTime += options.audioLevel * 0.2; // Accumulate audio level for animation
    }
    // If global audio is not active, but the local "rhythm" checkbox is, use the internal metronome as a fallback.
    else if (this.rhythmEnabled) {
      const currentBeat = this.internalMetronome.getCurrentStep();
      if (currentBeat !== this.lastBeat) {
          // A beat change occurred. Pulse the object.
          // The previous logic missed the first beat; this ensures it pulses on every beat change.
          this.pulse = 1.2; // Set a fixed pulse strength for the metronome beat
          this.lastBeat = currentBeat;
      }
    }

    // Always decay the pulse back to 1.0 for a smooth animation
    this.pulse = lerp(this.pulse, 1.0, 0.1); // Smoother decay

    this.applyColorTheme();

    // Use clear() for WEBGL buffer for performance and to handle depth buffer
    this.buffer3d.clear(); // Clears the 3D buffer, including depth

    // Camera & Lighting
    if (this.cameraType === 'perspective') {
      this.buffer3d.perspective();
    } else { // ortho
      const w = this.buffer3d.width;
      const h = this.buffer3d.height;
      // In ortho mode, we simulate zoom by changing the projection volume.
      // A larger zoom value should make the object appear smaller (zoomed out).
      // We use 800 as a baseline, which is the default zoom value.
      const orthoZoomFactor = this.zoom / 800.0;
      this.buffer3d.ortho(
        -w / 2 * orthoZoomFactor, w / 2 * orthoZoomFactor,
        -h / 2 * orthoZoomFactor, h / 2 * orthoZoomFactor
      );
    }
    // The camera's Z position is controlled by the zoom property.
    // This is crucial for perspective zoom and for setting the view matrix in ortho.
    this.buffer3d.camera(0, 0, this.zoom, 0, 0, 0, 0, 1, 0);
    this.buffer3d.ambientLight(60);
    if (this.shadowsEnabled) this.buffer3d.directionalLight(255, 255, 255, 0.5, 0.5, -1);
    if (this.gridEnabled) this.drawGrid();

    this.buffer3d.push();
    if (this.autoRotate) {
      this.buffer3d.rotateX(frameCount * 0.005 + radians(this.rotationX));
      this.buffer3d.rotateY(frameCount * 0.006 + radians(this.rotationY));
    } else {
      this.buffer3d.rotateX(radians(this.rotationX));
      this.buffer3d.rotateY(radians(this.rotationY));
    }
    this.buffer3d.rotateZ(radians(this.rotationZ));

    // Apply pulse scaling from rhythm integration
    this.buffer3d.scale(this.pulse);

    if (this.shape === 'text') this.drawText3D();
    else if (this.shape === 'polar') this.drawPolarShape3D(options);
    else if (this.shape === 'gol') this.drawGOL3D(golGrid, options);
    else this.drawShape3D();

    this.buffer3d.pop();

    // --- 3D Particle Drawing ---
    // The particles are drawn inside the same 3D buffer, so they are part of the scene.
    if (this.particlesEnabled) {
      // Sync properties from the main tool to the particle system
      this.particleSystem3D.particleRate = this.particleRate;
      this.particleSystem3D.particleColor = this.particleColor;
      this.particleSystem3D.gravity.y = this.particleGravity;
      this.particleSystem3D.update();
      this.particleSystem3D.draw(this.buffer3d);
    }

    mainBuffer.image(this.buffer3d, 0, 0);
  }

  drawGOL3D(golGrid, options) {
    if (!golGrid) return;

    this.applyMaterial();
    this.buffer3d.push();
    
    const cols = golGrid.length;
    const rows = golGrid[0].length;
    const totalWidth = cols * 20;
    const totalHeight = rows * 20;

    this.buffer3d.translate(-totalWidth / 2, -totalHeight / 2);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const cellId = `${x}-${y}`;
        const targetHeight = golGrid[x][y] === 1 ? 40 : 0;
        
        if (!this.cellStates[cellId]) {
          this.cellStates[cellId] = 0;
        }
        
        this.cellStates[cellId] = lerp(this.cellStates[cellId], targetHeight, 0.5);
        const currentHeight = this.cellStates[cellId];

        if (currentHeight > 1) {
          this.buffer3d.push();
          this.buffer3d.translate(x * 20, y * 20, currentHeight / 2);
          this.buffer3d.box(18, 18, currentHeight);
          this.buffer3d.pop();
        }
      }
    }

    this.buffer3d.pop();
  }

  drawPolarShape3D(options = {}) {
    this.applyMaterial();
    this.buffer3d.push();
    this.buffer3d.scale(250); // Make it large enough to see    
    const points = 120;

    // If audio is reactive, use an accumulated value to drive animation. Otherwise, use frameCount.
    const animationDriver = (options.isAudioReactive && options.audioLevel > 0)
      ? this.audioTime
      : frameCount * 0.05;

    // Add a pulse effect to the base radius based on the current audio level
    const audioPulse = (options.isAudioReactive && options.audioLevel > 0)
      ? options.audioLevel * 2.5 // Multiplier for visual impact
      : 0;

    this.buffer3d.beginShape();
    for (let i = 0; i < points; i++) {
        const angle = map(i, 0, points, 0, TWO_PI);
        // The radius now has a base component that pulses with audio, and the animated wave
        const r = (1 + audioPulse) + 0.2 * sin(angle * 6 + animationDriver);
        const x = r * cos(angle);
        const y = r * sin(angle);
        this.buffer3d.vertex(x, y, 0);
    }
    this.buffer3d.endShape(CLOSE);
    this.buffer3d.pop();
  }

  drawShape3D() {
    this.applyMaterial();
    if (this.shape === 'box') this.buffer3d.box(150);
    else if (this.shape === 'sphere') this.buffer3d.sphere(120);
    else if (this.shape === 'torus') this.buffer3d.torus(100, 35);
  }

  drawText3D() {
    if (!this.textGeom) {
      console.log("ObjectRasterizer3D: textGeom is null. Font might not be loaded or geometry failed to generate.");
      this.buffer3d.push();
      this.buffer3d.fill(255, 100, 100); 
      this.buffer3d.textAlign(CENTER, CENTER); 
      this.buffer3d.textFont('sans-serif'); // Use a safe default font for the error message
      this.buffer3d.text('Font not loaded or 3D text not supported.', 0, 0);
      this.buffer3d.pop();
      return;
    }
    this.buffer3d.push();
    this.buffer3d.scale(4);
    this.applyMaterial();
    this.buffer3d.model(this.textGeom);
    this.buffer3d.pop();
  }

  applyMaterial() {
    console.log("ObjectRasterizer3D: applyMaterial - materialType:", this.materialType, "rasterTextureGfx valid:", !!this.rasterTextureGfx);
    this.buffer3d.resetShader(); // Reset any active shader first
    const c = color(this.primaryColor);
    const cVec = [red(c) / 255, green(c) / 255, blue(c) / 255];

    if (this.materialType === 'normal') {
      this.buffer3d.normalMaterial();
      this.buffer3d.noStroke();
    } else if (this.materialType === 'warped' && this.warpedShader) {
      this.warpedShader.setUniform('u_color', cVec);
      this.warpedShader.setUniform('u_warp', this.warp);
      this.warpedShader.setUniform('u_time', millis());
      this.buffer3d.shader(this.warpedShader);
      this.buffer3d.noStroke();
    } else if (this.materialType === 'raster' && this.rasterTextureGfx) {
      // Use NEAREST filter for a crisp, pixelated look. The default LINEAR filter causes blurriness,
      // which would make the pixelSize control seem ineffective. This makes the tool work as expected.
      const gl = this.buffer3d.drawingContext;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      this.buffer3d.texture(this.rasterTextureGfx);
      this.buffer3d.noStroke();
    } else if (this.materialType === 'shiny' && this.shinyShader) {
      this.shinyShader.setUniform('u_color', cVec);
      this.buffer3d.shader(this.shinyShader);
      this.buffer3d.noStroke();
    } else { // 'basic' material
      if (this.renderMode === 'solid') {
        this.buffer3d.fill(c);
        this.buffer3d.noStroke();
      } else { // 'wireframe' or 'points'
        this.buffer3d.noFill();
        this.buffer3d.stroke(c);
        this.buffer3d.strokeWeight(this.renderMode === 'points' ? 4 : 1.5);
      }
    }
  }
  drawGrid() {
    this.buffer3d.push();
    this.buffer3d.stroke(100);
    this.buffer3d.strokeWeight(0.5);
    const size = this.gridSize;
    const halfSize = size / 2;
    const step = size / 10;

    // The grid is on the XZ plane. Let's place it slightly below the object origin.
    const gridY = -150;

    for (let i = -halfSize; i <= halfSize; i += step) {
      // Lines parallel to Z-axis (varying x)
      this.buffer3d.line(i, gridY, -halfSize, i, gridY, halfSize);
      // Lines parallel to X-axis (varying z)
      this.buffer3d.line(-halfSize, gridY, i, halfSize, gridY, i);
    }
    this.buffer3d.pop();
  }

  applyColorTheme() {
    // If the theme is 'custom', the UI controls the primaryColor directly.
    // For other themes, we override the primaryColor with a preset value.
    switch (this.colorTheme) {
      case 'monochrome':
        this.primaryColor = '#E0E0E0';
        this.secondaryColor = '#616161';
        break;
      case 'complementary':
        this.primaryColor = '#ff6f00'; // Orange
        this.secondaryColor = '#0091ea'; // Blue
        break;
      case 'triadic':
        this.primaryColor = '#fdd835'; // Yellow
        this.secondaryColor = '#03a9f4'; // Blue
        break;
      case 'pastel':
        this.primaryColor = '#f48fb1'; // Pink
        this.secondaryColor = '#80cbc4'; // Teal
        break;
      case 'neon':
        this.primaryColor = '#00e676'; // Green
        this.secondaryColor = '#ff4081'; // Pink
        break;
      case 'custom':
      default:
        // In 'custom' mode, primaryColor is set from the UI.
        const p = color(this.primaryColor);
        this.secondaryColor = color(255 - red(p), 255 - green(p), 255 - blue(p));
        break;
    }
  }

  updateRasterTexture() {
    console.log("ObjectRasterizer3D: updateRasterTexture called. rasterTextureGfx valid:", !!this.rasterTextureGfx);
    if (!this.rasterTextureGfx) return;

    const gfx = this.rasterTextureGfx;
    const paletteName = this.rasterPalette || 'famicube';
    const hexColors = this.shaderPalettes[paletteName] || this.shaderPalettes.famicube;
    const pal = hexColors.map(c => color(c)); // Parse colors for p5

    gfx.background(pal[0]);
    gfx.noStroke();
    const s = this.pixelSize; // Use the existing UI control for pattern size
    const texSize = gfx.width;

    for (let y = 0; y < texSize; y += s) {
        for (let x = 0; x < texSize; x += s) {
            // A simple checkerboard pattern, like your example
            const colorIndex = (floor(x / s) + floor(y / s)) % pal.length;
            gfx.fill(pal[colorIndex]);
            gfx.rect(x, y, s, s);
        }
    }
    this.needsRasterUpdate = false; // Reset the flag
  }
}

// Simplified Metronome for integration, to avoid conflict with the main RhythmSequencer tool.
class InternalMetronome {
    constructor() { this.steps = 8; this.speed = 1; }
    getCurrentStep() { return Math.floor((millis() / 1000 / (1 / this.speed)) % this.steps); }
}

// A simple 3D particle for the new particle system
class Particle3D {
  constructor(origin, velocity) {
    this.pos = origin.copy();
    // Give it a random initial velocity for a "burst" effect
    this.vel = velocity || p5.Vector.random3D().mult(random(1, 4));
    this.acc = createVector(0, 0, 0); // We'll set gravity from the main class
    this.lifespan = 255; // Used for alpha fade
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= 2.5;
    this.acc.mult(0); // Clear acceleration each frame
  }

  isDead() {
    return this.lifespan < 0;
  }
}

// A self-contained 3D particle system to be used by ObjectRasterizer3D
class ParticleSystem3D {
  constructor() {
    this.particles = [];
    this.particleRate = 5;
    this.particleColor = '#FFFFFF';
    this.gravity = createVector(0, -0.05, 0);
  }

  update() {
    for (let i = 0; i < this.particleRate; i++) {
      this.particles.push(new Particle3D(createVector(0, 0, 0)));
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].applyForce(this.gravity);
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(buffer) {
    buffer.resetShader(); // Ensure particles are not drawn with the main object's shader
    buffer.noStroke();
    const baseColor = color(this.particleColor);
    for (const p of this.particles) {
      buffer.push();
      buffer.translate(p.pos.x, p.pos.y, p.pos.z);
      buffer.fill(red(baseColor), green(baseColor), blue(baseColor), p.lifespan);
      buffer.sphere(3); // Draw particles as small spheres
      buffer.pop();
    }
  }

  cleanup() {
    this.particles = [];
  }
}

window.ObjectRasterizer3D = ObjectRasterizer3D;
