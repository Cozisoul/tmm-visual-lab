/**
 * @class ParticleEngine
 * @description A simple physics-based particle system. It emits particles from a central
 * point (or the mouse) and updates their position based on velocity, gravity, and an optional noise field.
 */
class ParticleEngine {
  constructor() {
    console.log("Particle Engine loaded.");
    this.particles = [];
    this.rate = 5;
    this.lifespan = 100;
    this.size = 5;
    this.bounce = false;
    this.emitFromMouse = false;
    this.useNoise = false;
    this.color = '#FFF8E7';
    this.gravity = 0;
  }

  cleanup() {
    this.particles = [];
  }

  draw(buffer, media = null, golGrid = null, options = {}) {
    if (!options.noBackground) {
      buffer.background(17, 17, 17, 25); // Use a low-alpha background for a trail effect
    }
    buffer.noStroke();

    // Add new particles each frame based on rate
    for (let i = 0; i < this.rate; i++) {
      const emitX = this.emitFromMouse ? artboardMouseX : buffer.width / 2;
      const emitY = this.emitFromMouse ? artboardMouseY : buffer.height / 2;

      let vx = random(-2, 2);
      let vy = random(-2, 2);
      if (this.useNoise) {
        const angle = noise(frameCount * 0.01, i * 0.1) * TWO_PI * 4;
        vx = cos(angle) * 2;
        vy = sin(angle) * 2;
      }
      this.particles.push({
        x: emitX,
        y: emitY,
        vx: vx,
        vy: vy,
        life: this.lifespan
      });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.vy += this.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;

      const alpha = map(p.life, 0, this.lifespan, 0, 255);
      const baseColor = color(this.color);
      buffer.fill(red(baseColor), green(baseColor), blue(baseColor), alpha);
      buffer.ellipse(p.x, p.y, this.size, this.size);

      if (this.bounce) {
        if (p.x <= 0 || p.x >= buffer.width) {
          p.vx *= -1;
        }
        if (p.y <= 0 || p.y >= buffer.height) {
          p.vy *= -1;
        }
      }
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

window.ParticleEngine = ParticleEngine;