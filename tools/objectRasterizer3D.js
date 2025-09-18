/*
 * ObjectRasterizer3D
 * Clean, self-contained 3D tool for rendering simple shapes and text into an offscreen WEBGL buffer.
 */
class ObjectRasterizer3D {
  constructor() {
    // Basic render properties
    this.renderMode = 'solid'; // 'solid' | 'wireframe' | 'points'
    this.shape = 'text'; // 'box' | 'sphere' | 'torus' | 'text'

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
    this.rasterShader = null;
    this.shinyShader = null;

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
  }

  async init() {
    try {
      // Using Anton as it's a bold, classic choice for 3D.
      this.font = await loadFont('https://fonts.gstatic.com/s/anton/v25/1Ptgg87LROyAm0K08i4gS7lu.ttf');
      this.regenerateTextGeometry();
    } catch (e) {
      console.error("Failed to load font for 3D text:", e);
      this.font = null; // Ensure font is null on failure
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


    const palettes = {
        famicube: [
            '#644125', '#D29464', '#FFFEF1', '#DE3910', '#7B1000', '#005310'
        ].map(c => { const col = color(c); return [red(col)/255, green(col)/255, blue(col)/255]; }),
        gameboy: [
            '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
        ].map(c => { const col = color(c); return [red(col)/255, green(col)/255, blue(col)/255]; }),
        monochrome: [
            '#000000', '#444444', '#888888', '#CCCCCC', '#FFFFFF'
        ].map(c => { const col = color(c); return [red(col)/255, green(col)/255, blue(col)/255]; })
    };


    this.rasterShader = createShader(
      `
      precision highp float;
      attribute vec3 aPosition;
      attribute vec3 aNormal;

      uniform mat4 uProjectionMatrix;
      uniform mat4 uModelViewMatrix;
      uniform mat3 uNormalMatrix;

      varying vec3 v_normal;
      varying vec2 v_pos;

      void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
        v_normal = uNormalMatrix * aNormal;
        v_pos = gl_Position.xy;
      }
      `,
      `
      precision highp float;
      uniform vec3 u_color;
      uniform float u_pixel_size;
      uniform vec3 u_palette[6];
      uniform int u_palette_size;

      varying vec3 v_normal;
      varying vec2 v_pos;

      mat4 dither = mat4(0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.)/16.;

      float colorDistance(vec3 c1, vec3 c2) {
          vec3 d = c1 - c2;
          return dot(d, d);
      }

      void main() {
        vec2 pix_coord = floor(gl_FragCoord.xy / u_pixel_size);
        vec3 normal = normalize(v_normal);
        vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
        float diff = max(dot(normal, lightDir), 0.0);
        
        float levels = 4.0;
        float quantized_diff = floor(diff * levels) / levels;
        float dither_factor = fract(diff * levels);
        float dither_val = dither[int(mod(pix_coord.x, 4.0))][int(mod(pix_coord.y, 4.0))];
        if (dither_factor > dither_val) { quantized_diff += 1.0 / levels; }
        
        vec3 lit_color = u_color * quantized_diff + vec3(0.1);

        vec3 finalColor = u_palette[0];
        float min_dist = colorDistance(lit_color, u_palette[0]);

        for (int i = 1; i < 6; i++) {
            if (i >= u_palette_size) break;
            float dist = colorDistance(lit_color, u_palette[i]);
            if (dist < min_dist) {
                min_dist = dist;
                finalColor = u_palette[i];
            }
        }
        gl_FragColor = vec4(finalColor, 1.0);
      }
      `
    );
    this.rasterShader.setUniform('u_color', getColorVec());
    this.rasterShader.setUniform('u_pixel_size', this.pixelSize);
    const p = [...(palettes[this.rasterPalette] || palettes.famicube)];
    while (p.length < 6) { p.push([0,0,0]); }
    this.rasterShader.setUniform('u_palette', p.flat());
    this.rasterShader.setUniform('u_palette_size', (palettes[this.rasterPalette] || palettes.famicube).length);



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
      this.buffer3d = createGraphics(w, h, WEBGL);
      this.buffer3d.pixelDensity(1);
      this.initializeShaders();
    } catch (e) {
      console.error('ObjectRasterizer3D.create3dBuffer() failed:', e);
      this.buffer3d = null;
    }
  }

  cleanup() {
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

    if (this.shape === 'text' && this.needsGeomUpdate) {
      this.regenerateTextGeometry();
    }

    // --- Integrations Update ---
    // Always react to audio if it's enabled globally for a direct pulse effect.
    if (options.isAudioReactive && options.audioLevel > 0.02) {
      this.pulse = 1.0 + options.audioLevel * 1.5; // Boosted multiplier for more impact
    }
    // If global audio is not active, but the local "rhythm" checkbox is, use the internal metronome as a fallback.
    else if (this.rhythmEnabled) {
      const currentBeat = this.internalMetronome.getCurrentStep();
      if (currentBeat !== this.lastBeat && this.lastBeat !== -1) {
          this.pulse = 1.2; // Set a fixed pulse strength for the metronome beat
      }
      this.lastBeat = currentBeat;
    }

    // Always decay the pulse back to 1.0 for a smooth animation
    this.pulse = lerp(this.pulse, 1.0, 0.1); // Smoother decay

    this.applyColorTheme();

    mainBuffer.background(17);
    // Use clear() for WEBGL buffer for performance and to handle depth buffer
    this.buffer3d.clear();

    // Camera & Lighting
    if (this.cameraType === 'perspective') this.buffer3d.perspective(); else this.buffer3d.ortho();
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

    if (this.shape === 'text') this.drawText3D(); else this.drawShape3D();

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

  drawShape3D() {
    this.applyMaterial();
    if (this.shape === 'box') this.buffer3d.box(150);
    else if (this.shape === 'sphere') this.buffer3d.sphere(120);
    else if (this.shape === 'torus') this.buffer3d.torus(100, 35);
  }

  drawText3D() {
    if (!this.textGeom) {
      this.buffer3d.push();
      this.buffer3d.fill(255, 100, 100); this.buffer3d.textAlign(CENTER, CENTER); this.buffer3d.text('Font not loaded or 3D text not supported.', 0, 0);
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
    this.buffer3d.resetShader(); // Reset first
    const c = color(this.primaryColor);

    if (this.materialType === 'normal') {
      this.buffer3d.normalMaterial();
      this.buffer3d.noStroke();
    } else if (this.materialType === 'warped' && this.warpedShader) {
      this.buffer3d.shader(this.warpedShader);
      this.buffer3d.noStroke();
    } else if (this.materialType === 'raster' && this.rasterShader) {
      this.buffer3d.shader(this.rasterShader);
      this.buffer3d.noStroke();
    } else if (this.materialType === 'shiny' && this.shinyShader) {
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
    // ... (implementation unchanged)
  }

  applyColorTheme() {
    const p = color(this.primaryColor);
    if (this.colorTheme === 'monochrome') this.secondaryColor = color(red(p) * 0.8);
    else if (this.colorTheme === 'complementary') this.secondaryColor = color(255 - red(p), 255 - green(p), 255 - blue(p));
    else if (this.colorTheme === 'pastel') this.secondaryColor = color((red(p) + 255) / 2, (green(p) + 255) / 2, (blue(p) + 255) / 2);
    else if (this.colorTheme === 'neon') this.secondaryColor = color(min(255, red(p) * 1.5), min(255, green(p) * 1.5), min(255, blue(p) * 1.5));
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